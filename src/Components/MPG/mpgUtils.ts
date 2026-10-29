// Pure helpers for the /mpg "Find Care" page. No engine or React dependency, so
// they can be unit tested directly.

import {
  MPGProviderImageFieldsType,
  MPGRefinementFacetConfigType,
  MPGSpecialtyListingConfigType,
  MPGViewModeType,
} from "../../config/Types/ConfigTypes";
import {
  MPG_SPECIALTY_FACET_ID,
  MPG_SPECIALTY_LISTING_ROUTE_BASE,
} from "../../config/MPGConfig";

// The Commerce Search experience's route. Free-text search always goes here: a listing
// page's search entry navigates to it rather than querying the listing controller.
const MPG_SEARCH_PAGE_PATH = "/mpg";

export interface ProviderCardFieldMap {
  name: string;
  specialties: string;
  languages: string;
  facility: string;
}

export interface ProviderCardContent {
  name: string;
  secondaryLine: string;
  facilityLine: string;
}

export interface LocationBadgeSplit {
  visible: string[];
  overflow: string[];
  overflowCount: number;
}

/**
 * Orders facet values by a configured preferred list, appends the remaining values
 * alphabetically, then truncates to `limit`. Returns the facet value objects, not strings.
 */
export const orderSpecialtyValues = (
  facetValues: any[] | undefined,
  order: string[],
  limit: number,
) => {
  const values = Array.isArray(facetValues) ? facetValues : [];

  const preferred: any[] = [];
  order.forEach((name) => {
    const found = values.find((value) => value?.value === name);
    if (found) preferred.push(found);
  });

  const remaining = values
    .filter((value) => order.indexOf(value?.value) === -1)
    .sort((a, b) => String(a?.value).localeCompare(String(b?.value)));

  return [...preferred, ...remaining].slice(0, limit);
};

/**
 * Null-safe read of `product.additionalFields[fieldName]`, always normalised to an
 * array of strings (empty when the field is missing).
 */
export const getAdditionalField = (product: any, fieldName: string) => {
  const raw = product?.additionalFields?.[fieldName];
  if (raw === undefined || raw === null || raw === "") return [];
  const asArray = Array.isArray(raw) ? raw : [raw];
  return asArray
    .filter((value) => value !== null && value !== undefined && value !== "")
    .map((value) => String(value));
};

/**
 * Builds the three lines of a provider card: name, "Specialty · Languages" and the
 * facility line. Missing sides are omitted rather than leaving a stray separator.
 */
export const formatProviderCard = (
  product: any,
  fieldMap: ProviderCardFieldMap,
  facilityJoinLimit: number,
): ProviderCardContent => {
  const name = product?.[fieldMap.name] ? String(product[fieldMap.name]) : "";
  const specialties = getAdditionalField(product, fieldMap.specialties);
  const languages = getAdditionalField(product, fieldMap.languages);
  const facilities = getAdditionalField(product, fieldMap.facility);

  const secondaryParts: string[] = [];
  if (specialties.length > 0) secondaryParts.push(specialties.join(", "));
  if (languages.length > 0) secondaryParts.push(languages.join(", "));

  return {
    name,
    secondaryLine: secondaryParts.join(" · "),
    facilityLine: facilities.slice(0, facilityJoinLimit).join(", "),
  };
};

/**
 * The detail-page href for a provider, e.g. "/providers/PROV-1001". Returns null when the
 * id field is missing, so the card can render unwrapped instead of as a dead link.
 */
export const getProviderDetailPath = (
  product: any,
  idField: string = "ec_product_id",
) => {
  const id = product?.[idField];
  if (id === undefined || id === null || String(id).trim() === "") return null;
  return `/providers/${encodeURIComponent(String(id).trim())}`;
};

/**
 * Narrows an arbitrary value — typically a localStorage read — to a supported view mode,
 * so a stale or hand-edited preference cannot render an unknown layout.
 */
export const coerceViewMode = (
  raw: any,
  fallback: string = "list",
): MPGViewModeType => {
  if (raw === "list" || raw === "grid") return raw;
  if (fallback === "grid") return "grid";
  return "list";
};

/**
 * Splits a provider's locations into the badges shown on the card and the ones folded
 * into the overflow indicator. A `limit` of 0 or less overflows everything.
 */
export const splitLocationBadges = (
  locations: string[] | undefined,
  limit: number,
): LocationBadgeSplit => {
  const values = Array.isArray(locations) ? locations : [];
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 0;

  if (values.length <= safeLimit) {
    return { visible: values.slice(), overflow: [], overflowCount: 0 };
  }

  const overflow = values.slice(safeLimit);
  return {
    visible: values.slice(0, safeLimit),
    overflow,
    overflowCount: overflow.length,
  };
};

/**
 * The headshot url for a given render context: the preferred variant's field first, then
 * the other one, else null so the caller can fall back to an initials avatar. Only two
 * variants are indexed, so "large" and "small" simply swap the preference order rather
 * than rewriting urls to synthesise a size that is not there.
 */
export const selectProviderImageUrl = (
  product: any,
  fields: MPGProviderImageFieldsType,
  variant: "large" | "small",
): string | null => {
  const preferred = variant === "small" ? fields?.small : fields?.large;
  const alternate = variant === "small" ? fields?.large : fields?.small;

  for (const field of [preferred, alternate]) {
    if (!field) continue;
    const raw = product?.[field];
    const asArray = Array.isArray(raw) ? raw : [raw];
    const found = asArray.find(
      (value) => typeof value === "string" && value.trim().length > 0,
    );
    if (found) return String(found).trim();
  }
  return null;
};

/** "Cardiology · Preventive Cardiology" secondary line of a product suggestion row. */
export const buildProviderSuggestionLine = (
  product: any,
  specialtiesField: string,
) => getAdditionalField(product, specialtiesField).join(" · ");

/**
 * "Cardiology providers" for one selected specialty, comma-joined for several, and the
 * "All Providers" label when nothing is selected.
 */
export const buildProvidersHeading = (
  selectedSpecialtyValues: any[] | undefined,
  suffix: string,
  allLabel: string,
) => {
  const names = (
    Array.isArray(selectedSpecialtyValues) ? selectedSpecialtyValues : []
  )
    .map((value) => (typeof value === "string" ? value : value?.value))
    .filter((value) => Boolean(value))
    .map((value) => String(value));

  if (names.length === 0) return allLabel;
  return `${names.join(", ")} ${suffix}`;
};

// -----------------------  Specialty listing routing  -----------------------

/**
 * Normalises a specialty name or slug to one comparable key, so a config entry can be
 * written as `{slug: "primary-care", specialtyValue: "Primary Care"}` and still match a
 * route param, a facet value or a hand-typed url. Spaces, underscores, casing and
 * punctuation are all tolerated.
 */
export const normalizeSpecialtyKey = (value: any) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

/**
 * The configured listing page for an `hc_specialties` facet value, or null when the
 * specialty has no page of its own. A null return is the signal to keep the /mpg facet
 * filter behaviour for that specialty rather than navigating anywhere.
 */
export const findListingBySpecialtyValue = (
  value: any,
  pages: MPGSpecialtyListingConfigType[] | undefined,
): MPGSpecialtyListingConfigType | null => {
  const key = normalizeSpecialtyKey(value);
  if (!key) return null;
  const found = (Array.isArray(pages) ? pages : []).find(
    (page) => normalizeSpecialtyKey(page?.specialtyValue) === key,
  );
  return found ?? null;
};

/** "/specialty/cardiology" for a listing config entry. */
export const buildListingPath = (
  entry: MPGSpecialtyListingConfigType | undefined,
) => `${MPG_SPECIALTY_LISTING_ROUTE_BASE}/${String(entry?.slug ?? "")}`;

/**
 * The search-page href for a free-text query, e.g. "/mpg#q=cardio". A blank query yields
 * the bare path so submitting an empty box cannot produce a "#q=" fragment.
 */
export const buildSearchQueryHref = (query: any) => {
  const trimmed = String(query ?? "").trim();
  if (!trimmed) return MPG_SEARCH_PAGE_PATH;
  return `${MPG_SEARCH_PAGE_PATH}#q=${encodeURIComponent(trimmed)}`;
};

/**
 * The search-page href that pre-selects one specialty facet value, e.g.
 * "/mpg#f-hc_specialties=Primary%20Care". Used for specialties that have no listing page
 * of their own, so they keep filtering on the search page.
 */
export const buildSpecialtyFacetHref = (value: any) =>
  `${MPG_SEARCH_PAGE_PATH}#f-${MPG_SPECIALTY_FACET_ID}=${encodeURIComponent(
    String(value ?? ""),
  )}`;

/**
 * The `q` parameter carried by a url fragment, decoded, or "" when there is none. This is
 * the input to the search page's explicit querySet write: the page states the text its
 * input shows instead of inheriting whatever a previous search left behind.
 */
export const readQueryFromFragment = (fragment: any) => {
  const pairs = String(fragment ?? "").split("&");
  const found = pairs.find((pair) => pair.startsWith("q="));
  if (!found) return "";
  try {
    return decodeURIComponent(found.slice(2));
  } catch (_error) {
    return found.slice(2);
  }
};

/**
 * Runs `request` at most once per `key`, where the key is the page's Commerce view url.
 * Keying on the view url rather than a boolean is what makes a specialty-to-specialty
 * transition refetch even when React reuses the component instance, while an effect
 * re-run for the same page stays at one request.
 */
export const requestFirstRequestOnce = (
  ref: { current: string | null },
  key: string,
  request: () => void,
) => {
  if (ref.current === key) return false;
  ref.current = key;
  request();
  return true;
};

/**
 * Wraps a controller-subscription state update so it lands after the current render
 * instead of during it.
 *
 * Both page types dispatch `setView` during render (see useCommerceViewUrl). A dispatch
 * notifies every engine subscriber synchronously, including the subscriptions of the page
 * being navigated AWAY from, because React has not run their effect cleanup yet. An
 * inline `setState` in such a subscriber is therefore a cross-component render-phase
 * update: React logs "Cannot update a component while rendering a different component"
 * and does not guarantee the update is applied in that pass.
 *
 * Deferring to a microtask moves the update past the commit, which makes it an ordinary
 * update. It is still the same tick, so no paint happens in between and no extra request
 * or analytics event is produced — only one additional render, which the subscriber was
 * asking for anyway. Reading `controller.state` inside the callback still yields the
 * latest state, since the microtask runs after the dispatch completes.
 *
 * `schedule` is injectable so the deferral is unit testable without a React tree.
 */
export const deferEngineStateUpdate = (
  update: () => void,
  schedule: (callback: () => void) => void = queueMicrotask,
) => {
  return () => schedule(update);
};

// -----------------------  Facet column selection  -----------------------

export interface RenderableFacet {
  /** The generated facet controller, passed straight to TextFacet. */
  facet: any;
  facetId: string;
  /** The config label for this facet, absent when there is no config entry. */
  labelToken?: string;
}

/**
 * Chooses and orders the facets a refinement column renders.
 *
 * `facets` is `facetGenerator.facets`, which is `facetOrder.map(...)` and therefore
 * already in `facetGenerator.state` (= Merchandising Hub) order.
 *
 * - `allowList` provided: output in **allow-list** order, one entry per allow-list id
 *   present in `facets` with at least one value; `labelToken` is that entry's label.
 *   This is the search page's behaviour.
 * - `allowList === null`: output in **input** order (= Hub order), every facet with at
 *   least one value; `labelToken` comes from `options.labelOverrides` when the facet has
 *   an entry there, otherwise undefined. This is a listing page's behaviour, so the Hub
 *   stays the source of truth for which facets a listing offers.
 *
 * In both modes facets with zero values and facets whose id is in
 * `options.suppressedFacetIds` are dropped.
 *
 * Pure: it resolves no translations. `getText` stays at the call site, because it comes
 * from LanguageContext and a helper reading React context could not be unit tested here.
 */
export const selectRenderableFacets = (
  facets: any[] | undefined,
  allowList: MPGRefinementFacetConfigType[] | null,
  options?: {
    suppressedFacetIds?: string[];
    labelOverrides?: MPGRefinementFacetConfigType[];
  },
): RenderableFacet[] => {
  const suppressed = new Set(
    (options?.suppressedFacetIds ?? []).map((facetId) => String(facetId)),
  );
  const overrides = Array.isArray(options?.labelOverrides)
    ? options!.labelOverrides
    : [];

  // One pass over the generated controllers: drop anything without an id, without values,
  // or explicitly suppressed. `facets` mints controllers on access, so it is read once.
  const available = (Array.isArray(facets) ? facets : [])
    .map((facet) => ({
      facet,
      facetId: facet?.state?.facetId ? String(facet.state.facetId) : "",
      valueCount: Array.isArray(facet?.state?.values)
        ? facet.state.values.length
        : 0,
    }))
    .filter(
      (candidate) =>
        candidate.facetId !== "" &&
        candidate.valueCount > 0 &&
        !suppressed.has(candidate.facetId),
    );

  if (allowList === null) {
    return available.map(({ facet, facetId }) => ({
      facet,
      facetId,
      labelToken: overrides.find((entry) => entry?.facetId === facetId)?.label,
    }));
  }

  const renderable: RenderableFacet[] = [];
  (Array.isArray(allowList) ? allowList : []).forEach(({ facetId, label }) => {
    const candidate = available.find((entry) => entry.facetId === facetId);
    if (!candidate) return;
    renderable.push({ facet: candidate.facet, facetId, labelToken: label });
  });
  return renderable;
};

// -----------------------  Specialty pills  -----------------------

// A pill that filters is a toggle; a pill that navigates is a link. Mixing them under one
// ARIA role would tell a screen-reader user that a link is "not pressed" and hide the
// fact that activation changes page, so the distinction is carried per item.
export type SpecialtyPillItem =
  | { kind: "link"; label: string; href: string; isCurrent: boolean }
  | { kind: "toggle"; label: string; facetValue: any };

/**
 * The specialty pill row, for either page type.
 *
 * Every configured page yields a `link` item, in config order, first — so the configured
 * specialties are navigable before the first response lands. Each response facet value
 * that matches no configured page then yields either a `toggle` item carrying the raw
 * facet value (search page) or a `link` item to the search page's facet href (listing
 * page), in the order given.
 *
 * Never returns MPG_FALLBACK_SPECIALTIES and never returns the "All Providers" pill: the
 * component appends that, because its behaviour differs per page type.
 */
export const buildSpecialtyPillItems = (args: {
  /** Response facet values, ALREADY ordered/limited by the caller via orderSpecialtyValues. */
  facetValues: any[] | undefined;
  pages: MPGSpecialtyListingConfigType[] | undefined;
  /** The slug of the listing page being rendered, or null on the search page. */
  currentSlug: string | null;
  /** What to do with a response value that has no configured page. */
  unconfiguredValues: "toggle" | "searchLink";
}): SpecialtyPillItem[] => {
  const { facetValues, pages, currentSlug, unconfiguredValues } = args;
  const configured = Array.isArray(pages) ? pages : [];
  const currentKey = normalizeSpecialtyKey(currentSlug ?? "");

  const items: SpecialtyPillItem[] = configured.map((entry) => ({
    kind: "link",
    // The pill shows the specialty, matching today's row; the slug is only a fallback.
    label: String(entry?.specialtyValue ?? entry?.slug ?? ""),
    href: buildListingPath(entry),
    isCurrent:
      currentKey !== "" && normalizeSpecialtyKey(entry.slug) === currentKey,
  }));

  (Array.isArray(facetValues) ? facetValues : []).forEach((facetValue) => {
    const label = String(facetValue?.value ?? facetValue ?? "");
    if (!label) return;
    if (findListingBySpecialtyValue(label, configured)) return;

    if (unconfiguredValues === "toggle") {
      items.push({ kind: "toggle", label, facetValue });
      return;
    }
    items.push({
      kind: "link",
      label,
      href: buildSpecialtyFacetHref(label),
      isCurrent: false,
    });
  });

  return items;
};

// -----------------------  Search view url  -----------------------

/**
 * The `context.view.url` a healthcare SEARCH page sends: the REAL RUNTIME ORIGIN plus the
 * page's own route path, and nothing else.
 *
 * Why the runtime origin and not `VITE_COMMERCE_ENGINE_URL`: that variable is
 * `http://localhost:5173/search` — an origin AND a path belonging to the unrelated
 * `/search` experience — so `${VITE_COMMERCE_ENGINE_URL}/mpg` reported
 * `http://localhost:5173/search/mpg` no matter which host, port or deploy the browser was
 * actually on. `window.location.origin` is the only part of the browser location that is
 * constant for the lifetime of a single-page session, which is exactly what the view url
 * needs to be.
 *
 * Why `routePath` is passed in rather than read from `window.location.pathname`: the
 * caller states its OWN route (the `SEARCH_PAGE_PATH` module constant), so the value can
 * never retarget when a subscriber fires mid-navigation, and it stays byte-identical
 * across re-renders. Stability is load bearing: the search page's bootstrap `useMemo` and
 * its first-request effect are both keyed on this string, so a value that changed more
 * often than the route would cause extra Commerce requests and re-bootstraps.
 *
 * Why no query string and no fragment: the `/mpg` hash is rewritten from commerce state
 * on every facet, sort and page change, so folding it in would re-key those two call
 * sites on every refinement. The query already travels in the request body, and keeping
 * user-typed healthcare text out of the page-context dimension is the safer default.
 *
 * NOT for listing pages. See `buildListingViewUrl` in specialtyListingUtils: the Listings
 * API resolves a listing BY this url against the Merchandising Hub, which stores relative
 * paths for this org, so an origin there produced a live
 * `404 LISTING_CONFIGURATION_DOES_NOT_EXIST`. The two helpers deliberately live in
 * different modules under different names so a substitution is visible in review.
 *
 * `origin` is injectable so the behaviour is unit testable without touching jsdom's
 * location, the same way `deferEngineStateUpdate` injects its scheduler. A blank origin
 * (non-browser caller) degrades to the bare path rather than emitting "undefined/mpg".
 */
export const buildSearchViewUrl = (
  routePath: string,
  origin: string = typeof window === "undefined"
    ? ""
    : (window.location?.origin ?? ""),
) => {
  const path = String(routePath ?? "");
  const withLeadingSlash = path.startsWith("/") ? path : `/${path}`;
  // A trailing slash is a different string to every consumer, so it is dropped here for
  // the same reason buildListingViewUrl drops it.
  const normalizedPath = withLeadingSlash.replace(/\/+$/, "") || "/";
  const normalizedOrigin = String(origin ?? "")
    .trim()
    .replace(/\/+$/, "");
  if (!normalizedOrigin) return normalizedPath;
  return normalizedPath === "/"
    ? `${normalizedOrigin}/`
    : `${normalizedOrigin}${normalizedPath}`;
};

// -----------------------  Search page bootstrap  -----------------------

export interface SearchPageBootstrapDeps {
  setView: (payload: { url: string }) => unknown;
  updateQuerySetQuery: (payload: { id: string; query: string }) => unknown;
  buildSearch: (engine: any) => any;
  buildSearchBox: (engine: any, props: any) => any;
}

/**
 * The search page's load-bearing startup sequence, as a plain injectable function so the
 * ordering can be asserted without React.
 *
 * `setView` must be dispatched before the url manager is built, because it resets the
 * facet, parameter, sort, pagination and response slices while building the url manager
 * restores the fragment *into* those slices.
 *
 * The querySet write must come after `buildSearchBox`, because `updateQuerySetQuery` is a
 * no-op for an id that is not yet registered. That write is what gives this page sole
 * ownership of the visible search text: `registerQuerySetQuery` returns early for an
 * already-registered id and a fulfilled search writes the executed query into every
 * registered id, so without it a bare /mpg would keep the previous query's text.
 */
export const bootstrapSearchPage = (
  engine: any,
  viewUrl: string,
  fragment: string,
  searchBoxId: string,
  deps: SearchPageBootstrapDeps,
) => {
  engine.dispatch(deps.setView({ url: viewUrl }));
  const search = deps.buildSearch(engine);
  const facetGenerator = search.facetGenerator();
  // Default url-manager parameters on purpose: the search page's hash round-trips exactly
  // as it does today, with no `excludeDefaultParameters`.
  const urlManager = search.urlManager({ initialState: { fragment } });
  const searchBox = deps.buildSearchBox(engine, {
    options: { id: searchBoxId, clearFilters: false },
  });
  engine.dispatch(
    deps.updateQuerySetQuery({
      id: searchBoxId,
      query: readQueryFromFragment(fragment),
    }),
  );
  return { search, facetGenerator, urlManager, searchBox };
};

/**
 * `bootstrapSearchPage` with malformed-fragment recovery. An out-of-range or non-numeric
 * `page`/`perPage` throws a SchemaValidationError out of `urlManager(...)` during render,
 * and there is no error boundary above the route, so /mpg#page=abc would blank the app.
 * `setView` has already run and nothing has fetched, so re-restoring from "" is safe.
 */
export const bootstrapSearchPageSafely = (
  engine: any,
  viewUrl: string,
  fragment: string,
  searchBoxId: string,
  deps: SearchPageBootstrapDeps,
) => {
  try {
    return {
      ...bootstrapSearchPage(engine, viewUrl, fragment, searchBoxId, deps),
      fragmentUsed: fragment,
    };
  } catch (error) {
    console.warn("Ignoring an invalid search fragment", fragment, error);
    return {
      ...bootstrapSearchPage(engine, viewUrl, "", searchBoxId, deps),
      fragmentUsed: "",
    };
  }
};
