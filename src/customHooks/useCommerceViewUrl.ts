import { useRef } from "react";
import { CommerceEngine, loadContextActions } from "@coveo/headless/commerce";

/**
 * Dispatches `setView` once per (engine, viewUrl) pair and returns the url.
 *
 * `viewUrl` is whatever string the page owns, and the two page types deliberately own
 * different shapes: the search page passes `buildSearchViewUrl('/mpg')` (the real runtime
 * origin plus its route), and a listing page passes `buildListingViewUrl(...)` (a bare
 * relative path, because the Merchandising Hub resolves a listing by that exact string).
 * The hook owns the ordering rule; each page owns its value, so the two cannot drift.
 *
 * The dispatch runs during render on purpose. `setView` resets the facet, parameter,
 * sort, pagination and response slices, so it has to land BEFORE the url manager that
 * restores the location fragment into those same slices — and an effect runs after
 * render, i.e. after the url manager has already been built.
 *
 * Dispatching into a store during render is normally unsafe because a discarded render
 * still mutates it. It is tolerable here, and only here, because:
 *   - the ref makes a repeated render with the same url a no-op, so a double render
 *     (StrictMode or a concurrent re-render) dispatches once;
 *   - the action is idempotent: a second setView with the same url yields the same state
 *     and issues no request;
 *   - nothing downstream is armed by the dispatch itself — the single first request is
 *     guarded separately by requestFirstRequestOnce, plus the engine's own responseId
 *     guard inside executeFirstRequest / executeFirstSearch.
 *
 * There is deliberately NO guard on engine state: the ref belongs to the component
 * instance, so a remount always re-dispatches. That is what makes back-navigation
 * correct — a conditional dispatch would leave a stale responseId in place, the first
 * request would no-op, and the url-manager restore would truncate the facet order.
 */
export default function useCommerceViewUrl(
  engine: CommerceEngine,
  viewUrl: string,
) {
  const applied = useRef<string | null>(null);
  if (applied.current !== viewUrl) {
    applied.current = viewUrl;
    engine.dispatch(loadContextActions(engine).setView({ url: viewUrl }));
  }
  return viewUrl;
}
