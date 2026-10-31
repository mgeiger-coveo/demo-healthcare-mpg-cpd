// The two text models behind MPGSearchBox. Pure factories with no React and no engine
// import, so "submitting on a listing page navigates and never searches" is unit testable.
//
// This is the component-level expression of the query-state ownership rule: the model is
// the only thing that knows whether submitting runs a Commerce search or changes route.

import { buildSearchQueryHref } from "./mpgUtils";

export interface SearchBoxModel {
  value: string;
  suggestions: { rawValue: string }[];
  updateText(value: string): void;
  /** Clears the input. On the search page this also re-runs the (now empty) search. */
  clear(): void;
  /** The submit button, Enter, and a free-text selection. */
  submitQuery(value: string): void;
  /** A query-suggestion row. */
  selectSuggestion(value: string): void;
}

/**
 * The search page's model: today's behaviour, unchanged. `clear()` keeps its
 * clear-then-submit pair so the unfiltered results come back, and `selectSuggestion`
 * delegates to the controller so its suggestion-select analytics event survives.
 *
 * Returns a snapshot of `controller.state`, so callers must NOT memoize it — see
 * useSearchBoxModels.
 */
export const createHeadlessSearchBoxModel = (
  controller: any,
  onSubmitQuery?: (query: string) => void,
): SearchBoxModel => ({
  value: controller.state.value,
  suggestions: controller.state.suggestions ?? [],
  updateText: (value) => controller.updateText(value),
  clear: () => {
    onSubmitQuery?.("");
    controller.clear();
    controller.submit();
  },
  submitQuery: (value) => {
    onSubmitQuery?.(value);
    controller.updateText(value);
    controller.submit();
  },
  selectSuggestion: (value) => {
    onSubmitQuery?.(value);
    controller.selectSuggestion(value);
  },
});

/**
 * A listing page's model: the text is local React state and submitting NAVIGATES to the
 * search page. No commerce query state is touched and the commerce search box's
 * submit()/selectSuggestion() are not reachable from here, which is what keeps a listing
 * request query-free and a listing input free of another page's text.
 *
 * Returns a snapshot of `args.value`, so callers must NOT memoize it.
 */
export const createNavigatingSearchBoxModel = (args: {
  value: string;
  setValue: (next: string) => void;
  navigate: (to: string) => void;
}): SearchBoxModel => {
  const submitQuery = (value: string) => {
    const query = String(value ?? "").trim();
    // A blank box must not navigate: it would push "/mpg" for no reason.
    if (!query) return;
    args.navigate(buildSearchQueryHref(query));
  };

  return {
    value: args.value,
    // No querySuggest without a search box, and the live org has no query-suggestions
    // model anyway. Product suggestions still work: they come from instantProducts.
    suggestions: [],
    updateText: (value) => args.setValue(value),
    clear: () => args.setValue(""),
    submitQuery,
    selectSuggestion: submitQuery,
  };
};
