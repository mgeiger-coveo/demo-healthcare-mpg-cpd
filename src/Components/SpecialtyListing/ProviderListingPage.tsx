import {
  FunctionComponent,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  buildInstantProducts,
  buildProductListing,
  buildSearch,
  CommerceEngine,
  loadContextActions,
} from "@coveo/headless/commerce";
import styled from "styled-components";
import { CommerceEngineContext } from "../../common/engineContext";
import MPGSearchBox from "../MPG/MPGSearchBox";
import SpecialtyButtons from "../MPG/SpecialtyButtons";
import MPGFacetList from "../MPG/MPGFacetList";
import ProviderList from "../MPG/ProviderList";
import ViewModeToggle from "../MPG/ViewModeToggle";
import ErrorBanner from "../ErrorBanner/ErrorBanner";
import SortComponent from "../SearchPage/SortComponent";
import PaginationManager from "../SearchPage/PaginationManager";
import { LanguageContext } from "../Internationalization/LanguageUtils";
import { MPGConfigTranslations } from "../../config/InternationalizationConfig";
import {
  MPG_ALL_PROVIDERS_LABEL,
  MPG_LISTING_CLEAR_FILTERS_LABEL,
  MPG_LISTING_EMPTY_MESSAGE,
  MPG_LISTING_ERROR_MESSAGE,
  MPG_LISTING_SUGGESTIONS_ID,
  MPG_LISTING_SUPPRESSED_FACET_IDS,
  MPG_LISTING_UNKNOWN_SPECIALTY_MESSAGE,
  MPG_LISTING_UNRESOLVED_DETAIL_TEMPLATE,
  MPG_LISTING_UNRESOLVED_MESSAGE,
  MPG_NO_PROVIDERS_MESSAGE,
  MPG_PROVIDER_BACK_LABEL,
  MPG_SPECIALTY_BUTTON_LIMIT,
  MPG_SPECIALTY_BUTTON_ORDER,
  MPG_SPECIALTY_FACET_ID,
  MPG_SPECIALTY_LISTING_PAGES,
  MPG_VIEW_MODE_DEFAULT,
  MPG_VIEW_MODE_STORAGE_KEY,
} from "../../config/MPGConfig";
import { MPGSpecialtyListingConfigType } from "../../config/Types/ConfigTypes";
import {
  buildAllProvidersHref,
  buildListingPath,
  buildSpecialtyPillItems,
  coerceViewMode,
  deferEngineStateUpdate,
  orderSpecialtyValues,
  requestFirstRequestOnce,
} from "../MPG/mpgUtils";
import {
  bootstrapProductListingSafely,
  buildHistoryUrl,
  buildListingHeading,
  buildListingViewUrl,
  classifyListingState,
  findListingBySlug,
  isSameRoutePath,
  shouldResyncListingAfterForeignSearch,
  shouldSynchronizeFragment,
  stripQueryFromFragment,
} from "./specialtyListingUtils";
import { formatTemplate } from "../ProviderDetail/providerDetailUtils";
import useCommerceViewUrl from "../../customHooks/useCommerceViewUrl";
import { useNavigatingSearchBoxModel } from "../../customHooks/useSearchBoxModels";
import usePersistedState from "../../customHooks/usePersistedState";
import { Theme } from "../../config/theme";

const SEARCH_PAGE_PATH = "/mpg";

const readFragment = () => window.location.hash.slice(1);

interface ProviderListingPageRendererProps {
  engine: CommerceEngine;
  entry: MPGSpecialtyListingConfigType;
}

const ProviderListingPageRenderer: FunctionComponent<
  ProviderListingPageRendererProps
> = (props) => {
  const { engine, entry } = props;
  const { getText } = useContext(LanguageContext);
  const navigate = useNavigate();

  const listingPath = buildListingPath(entry);

  // The view url is the only routing input the Listings API gets, so it must equal the
  // listing url configured in the Merchandising Hub — which is the RELATIVE route path,
  // not a fully qualified url. Dispatched first, during render, before any controller
  // exists.
  const viewUrl = useCommerceViewUrl(engine, buildListingViewUrl(listingPath));

  // Steps 1-4 of the lifecycle in one injectable function, so the ordering that makes it
  // correct is unit tested: setView clears the facet/parameter slices, and only then may
  // the url manager restore the fragment into them.
  const {
    listing,
    facetGenerator,
    summary,
    breadcrumbManager,
    urlManager,
    fragmentUsed,
  } = useMemo(
    () =>
      bootstrapProductListingSafely(engine, viewUrl, readFragment(), {
        setView: loadContextActions(engine).setView,
        buildProductListing,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [engine, viewUrl],
  );

  // Deliberately outside the view-url-keyed bootstrap: the suggestion cache is
  // route-independent and registering an instant-products id is idempotent, so a
  // specialty transition has nothing to rebuild. This is the only commerce controller
  // behind the search entry — no search box, so this page holds no querySet entry and
  // therefore no other page's query text can appear in its input.
  const instantProducts = useMemo(
    () =>
      buildInstantProducts(engine, {
        options: { searchBoxId: MPG_LISTING_SUGGESTIONS_ID },
      }),
    [engine],
  );

  // A state READER only. It never executes a search, never submits and has no search
  // box: it exists because application code cannot read engine state directly, and this
  // page needs to notice a search response that lands after it took over the view.
  const searchWatch = useMemo(() => buildSearch(engine), [engine]);

  const [persistedViewMode, setPersistedViewMode] = usePersistedState(
    MPG_VIEW_MODE_STORAGE_KEY,
    MPG_VIEW_MODE_DEFAULT,
  );
  const viewMode = coerceViewMode(persistedViewMode, MPG_VIEW_MODE_DEFAULT);

  // `facetGenerator.facets` mints fresh controllers on access, so a counter forces a
  // re-read during render on every engine update.
  const [, setStateVersion] = useState(0);
  // Deferred to a microtask on purpose, through the one shared helper that MPGPage uses
  // too, so the two pages cannot drift. The incoming page dispatches setView during
  // render (see useCommerceViewUrl), so engine subscribers are notified mid-render and an
  // inline setState here is a render-phase cross-component update: React logs
  // "Cannot update a component while rendering a different component" and does not
  // guarantee the update is applied in that pass. The microtask runs after the render
  // commits, which turns it into an ordinary update.
  const bump = deferEngineStateUpdate(() => setStateVersion((v) => v + 1));

  useEffect(() => listing.subscribe(bump), [listing]);
  useEffect(() => facetGenerator.subscribe(bump), [facetGenerator]);
  useEffect(() => summary.subscribe(bump), [summary]);
  useEffect(() => breadcrumbManager.subscribe(bump), [breadcrumbManager]);

  // One first request per page entry, keyed on the view url so a specialty-to-specialty
  // transition refetches even if React reuses this component instance. The engine's own
  // responseId guard inside executeFirstRequest is the second layer.
  const firstRequestKey = useRef<string | null>(null);

  useEffect(() => {
    requestFirstRequestOnce(firstRequestKey, viewUrl, () =>
      listing.executeFirstRequest(),
    );
  }, [listing, viewUrl]);

  // `lastSynchronized` always holds the fragment currently reflected in engine state,
  // whoever wrote it: this seed, the url-manager writer, or the location reader. All
  // three maintain it — a reader-only guard is what swallowed Back in an earlier pass.
  const lastSynchronized = useRef(fragmentUsed);

  useEffect(
    () =>
      urlManager.subscribe(() => {
        const fragment = urlManager.state.fragment;
        // Write side of the invariant: engine state now reflects this fragment, so a
        // later popstate back to the PREVIOUS fragment is not mistaken for our own write.
        lastSynchronized.current = fragment;
        // Same route gate the reader uses. On a specialty-to-specialty transition the
        // incoming page dispatches setView during render, which clears the parameter
        // slices and notifies THIS (outgoing) url manager before React runs the cleanup
        // below. Writing here would push the outgoing `listingPath` over the route the
        // router just pushed, so the address bar would name the previous specialty while
        // the new one renders — and a reload would load the wrong listing.
        if (!isSameRoutePath(window.location.pathname, listingPath)) return;
        try {
          // pushState, not replaceState: Back and Forward must step through facet states
          // on a listing page.
          window.history.pushState(
            null,
            "",
            buildHistoryUrl(listingPath, fragment),
          );
        } catch (error) {
          console.warn("Could not update the listing url", error);
        }
      }),
    [urlManager, listingPath],
  );

  useEffect(() => {
    const synchronizeFromLocation = () => {
      const fragment = stripQueryFromFragment(readFragment());
      if (
        !shouldSynchronizeFragment({
          currentPathname: window.location.pathname,
          listingPath,
          fragment,
          lastSynchronized: lastSynchronized.current,
        })
      ) {
        return;
      }
      // Advanced before the attempt on purpose: a repeated event for the same bad
      // fragment must not re-attempt and re-log.
      lastSynchronized.current = fragment;
      try {
        urlManager.synchronize(fragment);
      } catch (error) {
        console.warn("Ignoring an invalid listing fragment", fragment, error);
      }
    };

    window.addEventListener("popstate", synchronizeFromLocation);
    window.addEventListener("hashchange", synchronizeFromLocation);
    return () => {
      window.removeEventListener("popstate", synchronizeFromLocation);
      window.removeEventListener("hashchange", synchronizeFromLocation);
    };
  }, [urlManager, listingPath]);

  // A commerce search that was in flight when the user left the search page rewrites the
  // shared facet slices from the wrong response. setView zeroed the search response id,
  // so any non-empty one seen here is by construction a late arrival; one listing
  // refresh converges the facet column on the listing response.
  const lastResynced = useRef<string | null>(null);

  useEffect(
    () =>
      searchWatch.subscribe(() => {
        if (
          !shouldResyncListingAfterForeignSearch({
            searchResponseId: searchWatch.state.responseId,
            listingResponseId: listing.state.responseId,
            lastResyncedSearchResponseId: lastResynced.current,
          })
        ) {
          return;
        }
        lastResynced.current = searchWatch.state.responseId;
        console.warn(
          "Re-syncing the listing after a late search response",
          searchWatch.state.responseId,
        );
        listing.refresh();
      }),
    [searchWatch, listing],
  );

  const facets: any[] = facetGenerator?.facets ?? [];
  const specialtyFacet = facets.find(
    (facet) => facet?.state?.facetId === MPG_SPECIALTY_FACET_ID,
  );

  const title = getText(
    entry.title,
    MPGConfigTranslations,
    `specialtyListingTitle_${entry.slug}`,
  );
  const description = entry.description
    ? getText(
        entry.description,
        MPGConfigTranslations,
        `specialtyListingDescription_${entry.slug}`,
      )
    : "";

  const renderState = classifyListingState({
    firstRequestExecuted: summary.state.firstRequestExecuted,
    isLoading: summary.state.isLoading,
    hasError: summary.state.hasError,
    productCount: summary.state.totalNumberOfProducts,
    facetCount: facetGenerator?.state?.length ?? 0,
    hasActiveFilters: Boolean(breadcrumbManager.state.hasBreadcrumbs),
  });

  // Non-null whenever the classifier says "error": hasError is the error selector being
  // non-null. Read from the controller, never inferred from an empty product array.
  const error: any = listing.state.error;

  useEffect(() => {
    if (renderState === "error" && error) {
      console.error("Specialty listing request failed", error);
    }
  }, [renderState, error]);

  useEffect(() => {
    if (renderState !== "listing-unresolved") return;
    console.error("Specialty listing did not resolve", {
      viewUrl,
      listingId: entry.listingId,
      responseId: listing.state.responseId,
    });
  }, [renderState, viewUrl, entry.listingId, listing.state.responseId]);

  const specialtyItems = buildSpecialtyPillItems({
    facetValues: orderSpecialtyValues(
      specialtyFacet?.state?.values,
      MPG_SPECIALTY_BUTTON_ORDER,
      MPG_SPECIALTY_BUTTON_LIMIT,
    ),
    baselineValues: MPG_SPECIALTY_BUTTON_ORDER,
    pages: MPG_SPECIALTY_LISTING_PAGES,
    currentSlug: entry.slug,
    // On a listing page every pill navigates, so an unconfigured specialty goes to the
    // search page with its facet pre-selected rather than filtering in place.
    unconfiguredValues: "searchLink",
  });

  const sortState = useMemo(() => listing.sort(), [listing]).state;
  const paginationState = useMemo(() => listing.pagination(), [listing]).state;

  const fromPath = `${listingPath}${window.location.hash}`;

  // Exactly one component occupies the results column. The two failure states REPLACE
  // ProviderList rather than nesting inside it, which is what guarantees no stale
  // provider card can render beside an error banner: a rejected fetch leaves the previous
  // products in headless state, and that state is left untouched rather than cleared.
  const renderResults = () => {
    if (renderState === "error") {
      return (
        <ErrorBanner
          message={getText(
            MPG_LISTING_ERROR_MESSAGE,
            MPGConfigTranslations,
            "listingErrorMessage",
          )}
          details={
            error
              ? `${error.statusCode ?? ""} ${error.message ?? ""}`.trim()
              : undefined
          }
          onRetry={() => listing.refresh()}
        />
      );
    }

    if (renderState === "listing-unresolved") {
      return (
        <ErrorBanner
          message={getText(
            MPG_LISTING_UNRESOLVED_MESSAGE,
            MPGConfigTranslations,
            "listingUnresolvedMessage",
          )}
          // Naming the exact view url that was sent is the point: it is compared against
          // the Hub entry, and a mismatch is a configuration issue to report, never
          // something to work around in the client.
          details={formatTemplate(
            getText(
              MPG_LISTING_UNRESOLVED_DETAIL_TEMPLATE,
              MPGConfigTranslations,
              "listingUnresolvedDetailTemplate",
            ),
            { viewUrl },
          )}
          onRetry={() => listing.refresh()}
        />
      );
    }

    // `emptyState={null}` keeps the cold load silent: no message is painted between first
    // paint and the first response. During a refetch the previous cards stay visible
    // inside the existing dimmed region rather than blanking on every facet toggle.
    let emptyState: any = null;
    if (renderState === "filtered-empty") {
      emptyState = (
        <EmptyBlock>
          <Typography variant="body2" sx={{ color: Theme.secondaryText }}>
            {getText(
              MPG_NO_PROVIDERS_MESSAGE,
              MPGConfigTranslations,
              "noProvidersMessage",
            )}
          </Typography>
          <ClearFiltersButton
            type="button"
            onClick={() => breadcrumbManager.deselectAll()}
          >
            {getText(
              MPG_LISTING_CLEAR_FILTERS_LABEL,
              MPGConfigTranslations,
              "listingClearFiltersLabel",
            )}
          </ClearFiltersButton>
        </EmptyBlock>
      );
    } else if (renderState === "listing-empty") {
      emptyState = (
        <Typography variant="body2" sx={{ color: Theme.secondaryText }}>
          {getText(
            MPG_LISTING_EMPTY_MESSAGE,
            MPGConfigTranslations,
            "listingEmptyMessage",
          )}
        </Typography>
      );
    }

    return (
      <ProviderList
        controller={listing}
        viewMode={viewMode}
        renderHeadingRow={false}
        emptyState={emptyState}
        fromPath={fromPath}
      />
    );
  };

  return (
    <PageWrapper>
      <Card>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        {description && (
          <Typography
            variant="body1"
            sx={{ color: Theme.secondaryText, marginTop: "8px" }}
          >
            {description}
          </Typography>
        )}
        <BackLinkRow>
          <BackLink to={SEARCH_PAGE_PATH}>
            {getText(
              MPG_PROVIDER_BACK_LABEL,
              MPGConfigTranslations,
              "providerBackLabel",
            )}
          </BackLink>
        </BackLinkRow>

        <SearchBoxRow>
          {/* Keyed on the view url so the local text is dropped on a specialty-to-
              specialty transition, with no effect and no dispatch. Submitting navigates
              to the Commerce Search experience; it never queries this listing. */}
          <SpecialtyListingSearchEntry
            key={viewUrl}
            instantProducts={instantProducts}
            fromPath={fromPath}
            navigate={navigate}
          />
        </SearchBoxRow>

        <SpecialtyButtons
          items={specialtyItems}
          isLoading={summary.state.isLoading}
          allProvidersHref={buildAllProvidersHref(readFragment())}
        />

        <Divider sx={{ margin: "32px 0" }} />

        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 3 }}>
            {/* null => render what the Hub returned, in Hub order. The specialty facet is
                suppressed by config, because each configured specialty is its own page. */}
            <MPGFacetList
              facetGenerator={facetGenerator}
              facetAllowList={null}
              suppressedFacetIds={MPG_LISTING_SUPPRESSED_FACET_IDS}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 9 }}>
            {/* Page-owned, so the specialty, the count and the view toggle stay visible
                in every state including both failures. */}
            <HeadingRow>
              <Typography variant="h6" component="h2">
                {buildListingHeading(
                  title,
                  summary.state.totalNumberOfProducts,
                )}
              </Typography>
              <ViewModeToggle mode={viewMode} onChange={setPersistedViewMode} />
            </HeadingRow>
            {sortState.availableSorts.length > 1 && (
              <SortComponent engine={engine} productListing={true} />
            )}
            {renderResults()}
            {summary.state.totalNumberOfProducts > paginationState.pageSize && (
              <PaginationManager engine={engine} productListing={true} />
            )}
          </Grid>
        </Grid>
      </Card>
    </PageWrapper>
  );
};

// The search entry is its own component so its local text state lives below the keyed
// boundary: remounting it on a view-url change is what discards a half-typed query.
const SpecialtyListingSearchEntry: FunctionComponent<{
  instantProducts: any;
  fromPath: string;
  navigate: (to: string) => void;
}> = ({ instantProducts, fromPath, navigate }) => {
  const model = useNavigatingSearchBoxModel(navigate);
  return (
    <MPGSearchBox
      model={model}
      instantProducts={instantProducts}
      fromPath={fromPath}
    />
  );
};

/**
 * The one reusable, config-driven Commerce Product Listing Page. A third specialty page
 * is one more entry in MPG_SPECIALTY_LISTING_PAGES and nothing else: no branch anywhere
 * reads a specialty name.
 */
const ProviderListingPage = () => {
  const commerceEngine = useContext(CommerceEngineContext);
  const { specialtySlug } = useParams();
  const { getText } = useContext(LanguageContext);

  const entry = findListingBySlug(specialtySlug, MPG_SPECIALTY_LISTING_PAGES);

  useEffect(() => {
    if (!entry) {
      console.warn("No specialty listing configured for slug", specialtySlug);
    }
  }, [entry, specialtySlug]);

  // Deliberately not a redirect to the search page: a silent redirect would hide a
  // typo'd or stale link. No request is issued and no controller is built.
  if (!entry) {
    return (
      <PageWrapper>
        <Card>
          <ErrorBanner
            message={getText(
              MPG_LISTING_UNKNOWN_SPECIALTY_MESSAGE,
              MPGConfigTranslations,
              "listingUnknownSpecialtyMessage",
            )}
          />
          <BackLinkRow>
            <BackLink to={SEARCH_PAGE_PATH}>
              {getText(
                MPG_ALL_PROVIDERS_LABEL,
                MPGConfigTranslations,
                "allProvidersLabel",
              )}
            </BackLink>
          </BackLinkRow>
        </Card>
      </PageWrapper>
    );
  }

  if (!commerceEngine) return <div>Loading...</div>;

  return <ProviderListingPageRenderer engine={commerceEngine} entry={entry} />;
};

export default ProviderListingPage;

const PageWrapper = styled.div`
  padding: 0 16px;
`;

const Card = styled.div`
  max-width: 1200px;
  margin: 90px auto 60px;
  border: 1px #e5e8e8 solid;
  border-radius: 16px;
  padding: 32px 24px;
  font-family: inherit;
`;

const BackLinkRow = styled.div`
  margin-top: 12px;
`;

const BackLink = styled(Link)`
  color: ${Theme.primary};
  font-size: 14px;
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
  &:focus-visible {
    outline: 2px solid ${Theme.secondary};
    outline-offset: 2px;
  }
`;

const SearchBoxRow = styled.div`
  margin-top: 24px;
  width: 100%;
`;

const HeadingRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
`;

const EmptyBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
`;

const ClearFiltersButton = styled.button`
  border: 1px solid ${Theme.primary};
  border-radius: 6px;
  background: #ffffff;
  color: ${Theme.primary};
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  padding: 8px 16px;
  cursor: pointer;
  &:hover {
    background: #f5eef9;
  }
  &:focus-visible {
    outline: 2px solid ${Theme.secondary};
    outline-offset: 2px;
  }
`;
