import {
  FunctionComponent,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import {
  buildInstantProducts,
  buildSearch,
  buildSearchBox,
  CommerceEngine,
  loadContextActions,
  loadQuerySetActions,
  RegularFacet,
} from "@coveo/headless/commerce";
import styled from "styled-components";
import {
  buildSearchBox as buildStandardSearchBox,
  SearchEngine,
} from "@coveo/headless";
import { CommerceEngineContext } from "../../common/engineContext";
import EngineContext from "../../common/engineContext";
import MPGSearchBox from "./MPGSearchBox";
import SpecialtyButtons from "./SpecialtyButtons";
import MPGFacetList from "./MPGFacetList";
import ProviderList from "./ProviderList";
import RelatedResources from "./RelatedResources";
import { LanguageContext } from "../Internationalization/LanguageUtils";
import { MPGConfigTranslations } from "../../config/InternationalizationConfig";
import {
  MPG_PAGE_SUBTITLE,
  MPG_PAGE_TITLE,
  MPG_PRODUCT_SUGGESTION_CACHE_TIMEOUT_MS,
  MPG_SEARCH_BOX_ID,
  MPG_SPECIALTY_BUTTON_LIMIT,
  MPG_SPECIALTY_BUTTON_ORDER,
  MPG_SPECIALTY_FACET_ID,
  MPG_SPECIALTY_LISTING_PAGES,
  MPG_VIEW_MODE_DEFAULT,
  MPG_VIEW_MODE_STORAGE_KEY,
} from "../../config/MPGConfig";
import {
  bootstrapSearchPageSafely,
  buildSearchViewUrl,
  buildSpecialtyPillItems,
  coerceViewMode,
  deferEngineStateUpdate,
  orderSpecialtyValues,
  requestFirstRequestOnce,
} from "./mpgUtils";
// Both pages' url-manager writers share one route predicate and one history-url builder,
// so the guard cannot drift between them.
import {
  buildHistoryUrl,
  isSameRoutePath,
} from "../SpecialtyListing/specialtyListingUtils";
import useCommerceViewUrl from "../../customHooks/useCommerceViewUrl";
import { useHeadlessSearchBoxModel } from "../../customHooks/useSearchBoxModels";
import usePersistedState from "../../customHooks/usePersistedState";
import { Theme } from "../../config/theme";

interface MPGPageRendererProps {
  engine: CommerceEngine;
  resourceEngine: SearchEngine;
}

interface RelatedResource {
  title: string;
  description: string;
  type?: string;
  link: string;
}

const toRelatedResource = (result: any): RelatedResource | null => {
  const link = String(result?.clickUri ?? "");
  const source = String(result?.raw?.source ?? "");
  const isProvider =
    link.startsWith("provider://") ||
    source === "HC - Provider Catalog" ||
    Boolean(result?.raw?.ec_product_id);

  const title = String(result?.title ?? "").trim();
  if (isProvider || !title || !/^https?:\/\//i.test(link)) return null;

  return {
    title,
    description: String(
      result?.excerpt ??
        result?.raw?.ec_description ??
        result?.raw?.description ??
        "",
    ).trim(),
    type: String(result?.raw?.sysfiletype ?? "").trim() || undefined,
    link,
  };
};

const readFragment = () => window.location.hash.slice(1);

// This page's own route. Its history writes target it explicitly rather than whatever
// window.location.pathname happens to be when a subscriber fires.
const SEARCH_PAGE_PATH = "/mpg";

const MPGPageRenderer: FunctionComponent<MPGPageRendererProps> = (props) => {
  const { engine, resourceEngine } = props;
  const resourceSearchBox = useMemo(
    () =>
      buildStandardSearchBox(resourceEngine, {
        options: { id: "mpg-related-resources-search-box" },
      }),
    [resourceEngine],
  );
  const [resourceQuery, setResourceQuery] = useState("");
  const [resourceStatus, setResourceStatus] = useState<
    "idle" | "loading" | "loaded" | "error"
  >("idle");
  const [resources, setResources] = useState<RelatedResource[]>([]);
  const lastResourceQuery = useRef<string | null>(null);

  const submitRelatedResources = useCallback(
    (value: string) => {
      const query = String(value ?? "").trim();
      if (!query) {
        lastResourceQuery.current = null;
        setResourceQuery("");
        setResources([]);
        setResourceStatus("idle");
        return;
      }
      if (lastResourceQuery.current === query) return;

      lastResourceQuery.current = query;
      setResourceQuery(query);
      setResources([]);
      setResourceStatus("loading");
      resourceSearchBox.updateText(query);
      resourceSearchBox.submit();
    },
    [resourceSearchBox],
  );

  useEffect(
    () =>
      resourceEngine.subscribe(() => {
        const searchState = resourceEngine.state.search;
        if (
          resourceStatus !== "loading" ||
          searchState.isLoading ||
          searchState.queryExecuted !== resourceQuery ||
          resourceEngine.state.query.q !== resourceQuery
        )
          return;
        if (searchState.error) {
          setResourceStatus("error");
          return;
        }
        const validResources = (searchState.results ?? [])
          .map(toRelatedResource)
          .filter((resource): resource is RelatedResource => resource !== null);
        setResources(validResources);
        setResourceStatus("loaded");
      }),
    [resourceEngine, resourceStatus],
  );

  useEffect(() => {
    const initialQuery = readQueryFromFragment(readFragment());
    if (initialQuery) submitRelatedResources(initialQuery);
  }, [submitRelatedResources]);

  const { getText } = useContext(LanguageContext);

  // First, before any controller exists: setView resets the facet, parameter, sort,
  // pagination and response slices, and it has to land before the url manager restores
  // the fragment into them. It is re-stated on every mount because after a listing visit
  // the engine's view url points at /specialty/....
  //
  // The value is the real browser origin plus this page's own route, so analytics
  // attribute the search to where the user actually is — Engine.tsx's cold-start value is
  // derived from VITE_COMMERCE_ENGINE_URL (`http://localhost:5173/search`) and so
  // reported `/search/mpg` on every host. See buildSearchViewUrl for why the origin comes
  // from window.location while the path comes from the SEARCH_PAGE_PATH constant: both
  // inputs are constant for the page's lifetime, which keeps this string stable across
  // re-renders. That stability is required — the bootstrap useMemo and the first-request
  // effect below are both keyed on it.
  const viewUrl = useCommerceViewUrl(
    engine,
    buildSearchViewUrl(SEARCH_PAGE_PATH),
  );

  // The whole startup sequence in one injectable function, so its ordering is unit
  // tested (see bootstrapSearchPage). It also dispatches the explicit querySet write
  // that gives this page sole ownership of its visible search text: a bare /mpg now
  // shows an empty input instead of inheriting the previous query's text, and
  // /mpg#q=cardio shows "cardio". The safe wrapper keeps /mpg#page=abc from blanking the
  // app.
  const { search, facetGenerator, urlManager, searchBox, fragmentUsed } =
    useMemo(
      () =>
        bootstrapSearchPageSafely(
          engine,
          viewUrl,
          readFragment(),
          MPG_SEARCH_BOX_ID,
          {
            setView: loadContextActions(engine).setView,
            updateQuerySetQuery:
              loadQuerySetActions(engine).updateQuerySetQuery,
            buildSearch,
            buildSearchBox,
          },
        ),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [engine, viewUrl],
    );

  const searchBoxModel = useHeadlessSearchBoxModel(
    searchBox,
    submitRelatedResources,
  );

  // Typeahead product suggestions. Keyed to the same search box id so the dropdown's
  // products belong to this page's query, and memoized because constructing the
  // controller registers a reducer on the engine. It posts to
  // commerce/v2/search/productSuggest, so it never perturbs the listing response.
  const instantProducts = useMemo(
    () =>
      buildInstantProducts(engine, {
        options: {
          searchBoxId: MPG_SEARCH_BOX_ID,
          cacheTimeout: MPG_PRODUCT_SUGGESTION_CACHE_TIMEOUT_MS,
        },
      }),
    [engine],
  );

  // A display preference rather than part of the result set, so it is persisted per
  // browser instead of in the hash: the url manager below rewrites the whole fragment
  // from commerce state on every update and would wipe a hand-added parameter. The same
  // storage key a listing page uses, so the preference carries across routes.
  const [persistedViewMode, setPersistedViewMode] = usePersistedState(
    MPG_VIEW_MODE_STORAGE_KEY,
    MPG_VIEW_MODE_DEFAULT,
  );
  const viewMode = coerceViewMode(persistedViewMode, MPG_VIEW_MODE_DEFAULT);

  // `facetGenerator.facets` is a getter that mints fresh controllers on access, so we
  // bump a counter on every engine update to force a re-read during render.
  const [, setStateVersion] = useState(0);
  // Deferred to a microtask, the same way the listing page and the other subscriber
  // sites are. These two subscriptions are still attached while the INCOMING listing page
  // dispatches setView during its own render, so an inline setState here updates this
  // page while a different component renders — React logs a setState-in-render error on
  // every /mpg -> /specialty/<slug> navigation and does not guarantee the update lands in
  // that pass. See deferEngineStateUpdate for the full rationale.
  const bump = deferEngineStateUpdate(() =>
    setStateVersion((version) => version + 1),
  );

  useEffect(() => search.subscribe(bump), [search]);

  useEffect(() => facetGenerator.subscribe(bump), [facetGenerator]);

  // Mirror the search state into the location hash so a query plus facet selections
  // survive a refresh or a shared link, and returning from a provider detail page
  // restores them even on a cold load. replaceState on purpose: this page's facet
  // changes deliberately create no history entries. Seeded from `fragmentUsed`, so a
  // recovered fragment replaces a malformed one on the first write.
  const lastSynchronized = useRef(fragmentUsed);

  useEffect(
    () =>
      urlManager.subscribe(() => {
        const fragment = urlManager.state.fragment;
        lastSynchronized.current = fragment;
        // Same route gate the listing pages' writer uses, and for the same reason: the
        // incoming page dispatches setView during render, so this url manager can be
        // notified after the router has already moved to /specialty/<slug> but before
        // this effect is cleaned up. Writing then stamped this page's
        // `#perPage=…&sortCriteria=…` onto the listing route. The page's own path is used
        // instead of window.location.pathname so the write can never retarget.
        if (!isSameRoutePath(window.location.pathname, SEARCH_PAGE_PATH))
          return;
        window.history.replaceState(
          null,
          "",
          buildHistoryUrl(SEARCH_PAGE_PATH, fragment),
        );
      }),
    [urlManager],
  );

  useEffect(() => {
    const onHashChange = () => {
      const fragment = readFragment();
      if (fragment === lastSynchronized.current) return;
      lastSynchronized.current = fragment;
      try {
        urlManager.synchronize(fragment);
        submitRelatedResources(readQueryFromFragment(fragment));
      } catch (error) {
        console.warn("Ignoring an invalid search fragment", fragment, error);
      }
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [urlManager, submitRelatedResources]);

  // Populates the pills, the refinements and the provider list without the user typing.
  // Unlike /search this page never reads or writes the standalone search box key and
  // never redirects: it searches in place.
  //
  // `setView` above zeroed `commerceSearch.responseId`, so `executeFirstSearch()`'s own
  // responseId guard is correct here and the hand-rolled facet-definition guard this
  // page used to carry is gone: the state it inferred — facet definitions that came from
  // a parameter restore rather than a response — cannot occur once the view is reset on
  // mount. Two layers remain: the ref keyed on the view url, and the engine's own guard.
  const firstRequestKey = useRef<string | null>(null);

  useEffect(() => {
    requestFirstRequestOnce(firstRequestKey, viewUrl, () =>
      search.executeFirstSearch(),
    );
  }, [search, viewUrl]);

  const facets: any[] = facetGenerator?.facets ?? [];
  const specialtyFacet = facets.find(
    (facet) => facet?.state?.facetId === MPG_SPECIALTY_FACET_ID,
  ) as RegularFacet | undefined;

  // Configured specialties navigate to their own listing page; everything else keeps
  // filtering here, which is what makes a new specialty page a one-line config change.
  const specialtyItems = buildSpecialtyPillItems({
    facetValues: orderSpecialtyValues(
      specialtyFacet?.state.values,
      MPG_SPECIALTY_BUTTON_ORDER,
      MPG_SPECIALTY_BUTTON_LIMIT,
    ),
    pages: MPG_SPECIALTY_LISTING_PAGES,
    currentSlug: null,
    unconfiguredValues: "toggle",
  });

  return (
    <PageWrapper>
      <Card>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          {getText(MPG_PAGE_TITLE, MPGConfigTranslations, "pageTitle")}
        </Typography>
        <Typography
          variant="body1"
          sx={{ color: Theme.secondaryText, marginTop: "8px" }}
        >
          {getText(MPG_PAGE_SUBTITLE, MPGConfigTranslations, "pageSubtitle")}
        </Typography>

        <SearchBoxRow>
          <MPGSearchBox
            model={searchBoxModel}
            instantProducts={instantProducts}
          />
        </SearchBoxRow>

        <SpecialtyButtons
          items={specialtyItems}
          controller={specialtyFacet}
          isLoading={search.state.isLoading || !search.state.responseId}
        />

        <Divider sx={{ margin: "32px 0" }} />

        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 3 }}>
            <MPGFacetList facetGenerator={facetGenerator} />
          </Grid>
          <Grid size={{ xs: 12, md: 9 }}>
            <ProviderList
              controller={search}
              specialtyFacet={specialtyFacet}
              viewMode={viewMode}
              onViewModeChange={setPersistedViewMode}
            />
            <RelatedResources
              query={resourceQuery}
              isLoading={resourceStatus === "loading"}
              error={
                resourceStatus === "error" ? "Search request failed" : null
              }
              resources={resources}
            />
          </Grid>
        </Grid>
      </Card>
    </PageWrapper>
  );
};

// The engine comes from CommerceEngineContext rather than a prop: sibling routes in
// App.tsx pass an engine down, but this page only needs the commerce engine.
const MPGPage = () => {
  const commerceEngine = useContext(CommerceEngineContext);
  const resourceEngine = useContext(EngineContext);
  if (!commerceEngine || !resourceEngine) return <div>Loading...</div>;
  return (
    <MPGPageRenderer engine={commerceEngine} resourceEngine={resourceEngine} />
  );
};

export default MPGPage;

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

const SearchBoxRow = styled.div`
  margin-top: 24px;
  width: 100%;
`;
