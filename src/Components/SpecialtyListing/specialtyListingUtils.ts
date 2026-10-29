// Pure and injectable helpers for the Commerce Product Listing Pages served at
// /specialty/:specialtySlug. No React import and no engine import, so the listing
// lifecycle's ordering rules and render-state decisions are unit testable directly.

import { MPGSpecialtyListingConfigType } from "../../config/Types/ConfigTypes";
import { normalizeSpecialtyKey } from "../MPG/mpgUtils";

/**
 * The `context.view.url` a listing page sends: the ROUTE PATHNAME ONLY, never a fully
 * qualified url.
 *
 * The view url is the only routing input the Listings API gets, so it has to equal the
 * listing url configured in the Merchandising Hub, and the Hub for this org is configured
 * with relative paths ("/specialty/cardiology", "/specialty/orthopedics"). Sending an
 * origin — whether taken from `VITE_COMMERCE_ENGINE_URL` or from `window.location` —
 * produced a live
 * `404 LISTING_CONFIGURATION_DOES_NOT_EXIST: The listing configuration with url
 * 'http://localhost:5173/specialty/orthopedics' does not exist for tracking id
 * 'healthcare_cpd_demo'.`
 *
 * A path also happens to be the only form that is portable: the same build runs on
 * localhost, on a Netlify deploy preview and on a production host, and the Hub entry does
 * not have to enumerate those origins.
 *
 * The path is derived from the route config (`buildListingPath`), never hardcoded here,
 * and this function is used only by listing pages. The healthcare search page sends a
 * deliberately DIFFERENT shape — `buildSearchViewUrl(...)` in MPG/mpgUtils, i.e. the real
 * runtime origin plus its route — because search resolution does not look the url up in
 * the Hub. Do not "unify" the two: an origin here reintroduces the live 404 above.
 */
export const buildListingViewUrl = (listingPath: string) => {
  const path = String(listingPath ?? "");
  const withLeadingSlash = path.startsWith("/") ? path : `/${path}`;
  // A trailing slash is a different string to the Hub: "/specialty/cardiology/" returns
  // 404 where "/specialty/cardiology" resolves.
  return withLeadingSlash.replace(/\/+$/, "") || "/";
};

/**
 * The configured listing page for a route param, or null for an unknown slug. Comparison
 * is on the normalised key, so "/specialty/Cardiology" resolves like "/specialty/cardiology".
 */
export const findListingBySlug = (
  slug: any,
  pages: MPGSpecialtyListingConfigType[] | undefined,
): MPGSpecialtyListingConfigType | null => {
  const key = normalizeSpecialtyKey(slug);
  if (!key) return null;
  const found = (Array.isArray(pages) ? pages : []).find(
    (page) => normalizeSpecialtyKey(page?.slug) === key,
  );
  return found ?? null;
};

/** The history entry for a listing path plus fragment. Never produces a bare "#". */
export const buildHistoryUrl = (listingPath: string, fragment: any) => {
  const safeFragment = String(fragment ?? "");
  return safeFragment ? `${listingPath}#${safeFragment}` : listingPath;
};

/**
 * Drops a stray `q` pair from a fragment. Listing parameters have no query field, but the
 * shared serializer parses and re-emits `q`, so it is stripped on both edges — the mount
 * fragment and every synchronize fragment — and never reaches engine state.
 */
export const stripQueryFromFragment = (fragment: any) =>
  String(fragment ?? "")
    .split("&")
    .filter((pair) => pair !== "q" && !pair.startsWith("q="))
    .join("&");

// React Router matches /specialty/cardiology/ to the same route, so an exact string
// compare would silently stop synchronizing there.
const stripTrailingSlash = (path: any) =>
  String(path ?? "").replace(/\/+$/, "") || "/";

/**
 * Whether two route paths address the same page, ignoring a trailing slash.
 *
 * Both the url-manager WRITER and the popstate/hashchange READER gate on this. The writer
 * needs it because a page's own history write must never land after the user has left:
 * `setView` is dispatched during the incoming page's render, before React tears down the
 * outgoing page's effects, so the outgoing url manager is notified (its parameters were
 * just cleared) and would push its OWN captured path over the route React Router had
 * already pushed — leaving the address bar on the previous specialty while the new one is
 * on screen.
 */
export const isSameRoutePath = (pathname: any, routePath: any) =>
  stripTrailingSlash(pathname) === stripTrailingSlash(routePath);

/**
 * The popstate/hashchange gate. It does three things: ignores events belonging to another
 * route (a popstate for Back to /mpg can fire before this component unmounts), collapses
 * the popstate+hashchange pair a single Back press produces, and ignores an echo of our
 * own pushState. A real Back always passes, because the writer moves `lastSynchronized`
 * forward when it writes.
 */
export const shouldSynchronizeFragment = (args: {
  currentPathname: string;
  listingPath: string;
  fragment: string;
  lastSynchronized: string;
}) =>
  isSameRoutePath(args.currentPathname, args.listingPath) &&
  args.fragment !== args.lastSynchronized;

export type ListingRenderState =
  | "error" // the request failed
  | "loading" // no first response yet, or a request is in flight
  | "results" // products to render
  | "filtered-empty" // 0 products and at least one facet value is active
  | "listing-empty" // 0 products, no active filter, but the response carried facets
  | "listing-unresolved"; // 0 products, no active filter, and NO facets came back

/**
 * The six render states of a listing page's results column.
 *
 * `hasError` is read FIRST and ALONE. A rejected listing fetch sets only `error` and
 * `isLoading`, leaving the previous page of products in state, so any rule keyed on an
 * empty product array would miss exactly the failure that matters most — a failed
 * refetch — and would render stale provider cards where an error belongs.
 *
 * The zero-product cases are then split three ways so a facet-filtered empty result is
 * visibly distinguishable from a missing or misconfigured Commerce listing.
 */
export const classifyListingState = (args: {
  firstRequestExecuted: boolean;
  isLoading: boolean;
  hasError: boolean;
  productCount: number;
  facetCount: number;
  hasActiveFilters: boolean;
}): ListingRenderState => {
  if (args.hasError) return "error";
  if (!args.firstRequestExecuted || args.isLoading) return "loading";
  if (args.productCount > 0) return "results";
  if (args.hasActiveFilters) return "filtered-empty";
  if (args.facetCount > 0) return "listing-empty";
  return "listing-unresolved";
};

/**
 * Whether a Commerce *search* response landed while this listing page owns the view, in
 * which case it has rewritten the shared facet slices from the wrong response and the
 * listing must resync.
 *
 * `setView` zeroed the search response id at mount, so any non-empty one observed here is
 * by construction a late response. Gated on the listing already having its own response:
 * otherwise the in-flight listing request will fix the slices anyway, and firing would
 * duplicate the cold-load request.
 */
export const shouldResyncListingAfterForeignSearch = (args: {
  searchResponseId: string;
  listingResponseId: string;
  lastResyncedSearchResponseId: string | null;
}) =>
  Boolean(args.searchResponseId) &&
  Boolean(args.listingResponseId) &&
  args.searchResponseId !== args.lastResyncedSearchResponseId;

/** "Cardiology Providers (2)", or the bare title when the count is 0. */
export const buildListingHeading = (
  title: string,
  totalNumberOfProducts: number,
) => {
  const count = Number(totalNumberOfProducts);
  if (!Number.isFinite(count) || count <= 0) return title;
  return `${title} (${count})`;
};

export interface ListingBootstrapDeps {
  setView: (payload: { url: string }) => unknown;
  buildProductListing: (engine: any) => any;
}

/**
 * The listing page's load-bearing startup sequence, as a plain injectable function so the
 * ordering can be asserted without React.
 *
 * `setView` resets the facet, parameter, sort, pagination and response slices; building
 * the url manager restores the fragment INTO those slices. The reset therefore has to
 * come first, which is also why it cannot move into an effect.
 *
 * `excludeDefaultParameters: true` keeps the listing hash free of parameters the user has
 * not chosen. Nothing here issues a request: the single first request is dispatched from
 * an effect, through requestFirstRequestOnce.
 */
export const bootstrapProductListing = (
  engine: any,
  viewUrl: string,
  fragment: string,
  deps: ListingBootstrapDeps,
) => {
  engine.dispatch(deps.setView({ url: viewUrl }));
  const listing = deps.buildProductListing(engine);
  const facetGenerator = listing.facetGenerator();
  const summary = listing.summary();
  const breadcrumbManager = listing.breadcrumbManager();
  const urlManager = listing.urlManager({
    initialState: { fragment },
    excludeDefaultParameters: true,
  });
  return { listing, facetGenerator, summary, breadcrumbManager, urlManager };
};

/**
 * `bootstrapProductListing` with malformed-fragment recovery. An out-of-range or
 * non-numeric `page`/`perPage` throws a SchemaValidationError out of `urlManager(...)`
 * during render, and there is no error boundary above the route, so
 * /specialty/cardiology#page=abc would blank the app.
 *
 * `setView` has already run and nothing has fetched, so re-restoring from "" is safe: the
 * page loads the unfiltered listing instead. `fragmentUsed` tells the caller which
 * fragment is actually in engine state, so the first url-manager write replaces the bad
 * hash with the recovered one.
 */
export const bootstrapProductListingSafely = (
  engine: any,
  viewUrl: string,
  fragment: string,
  deps: ListingBootstrapDeps,
) => {
  const safeFragment = stripQueryFromFragment(fragment);
  try {
    return {
      ...bootstrapProductListing(engine, viewUrl, safeFragment, deps),
      fragmentUsed: safeFragment,
    };
  } catch (error) {
    console.warn("Ignoring an invalid listing fragment", safeFragment, error);
    return {
      ...bootstrapProductListing(engine, viewUrl, "", deps),
      fragmentUsed: "",
    };
  }
};
