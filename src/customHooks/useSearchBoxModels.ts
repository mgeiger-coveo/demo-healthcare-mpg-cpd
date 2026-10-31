import { useEffect, useState } from "react";
import {
  createHeadlessSearchBoxModel,
  createNavigatingSearchBoxModel,
  SearchBoxModel,
} from "../Components/MPG/searchBoxModel";

/**
 * Adapts the headless commerce search box to the SearchBoxModel the search page renders.
 *
 * The factory is called on EVERY render, deliberately: it snapshots `controller.state`,
 * so wrapping it in useMemo on any dependency list would freeze the text the input
 * displays while the user types. The re-render that keeps the snapshot fresh comes from
 * the subscription below, and the factory is a cheap object literal with nothing to
 * optimise.
 */
export const useHeadlessSearchBoxModel = (
  controller: any,
  onSubmitQuery?: (query: string) => void,
): SearchBoxModel => {
  const [, setStateVersion] = useState(0);

  useEffect(
    () =>
      controller.subscribe(() =>
        setStateVersion((version: number) => version + 1),
      ),
    [controller],
  );

  return createHeadlessSearchBoxModel(controller, onSubmitQuery);
};

/**
 * A listing page's search entry: local text, and submitting navigates to the search page.
 *
 * Same rule as above — the factory snapshots `value`, so it must not be memoized. The
 * `useState` setter supplies the re-render.
 */
export const useNavigatingSearchBoxModel = (
  navigate: (to: string) => void,
): SearchBoxModel => {
  const [value, setValue] = useState("");
  return createNavigatingSearchBoxModel({ value, setValue, navigate });
};
