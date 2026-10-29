// Phase 0.1, Workstream A -- lifecycle regression gates for HomeProductsSearchBox.
//
// The component used to dispatch two engine updates from its render body:
//   searchBoxController.updateText("")   -- RELOCATED into a post-commit effect that keeps
//                                           the old every-render cadence (no dependency array)
//   resultsController.updateQuery("")    -- REMOVED (dead code; headless returns early on "")
//
// The characterization pass that pinned the ORIGINAL behavior before either change was made
// is preserved at:
//   .agents/tasks/healthcare-commerce-phase0-1/evidence/implement/characterization-before.log
//   .agents/tasks/healthcare-commerce-phase0-1/evidence/implement/characterization-test-as-run.tsx.txt
// It recorded, against the unmodified file: updateText("") called during the parent's render
// pass with the renderer's input not yet committed; updateQuery("") called during render with
// exactly ""; zero React warnings on a cold mount but a real
// "Cannot update a component ... while rendering a different component" error on the first
// navigation once the renderer had subscribed -- which matches the measured browser baseline
// (cold /mpg = 0 warnings, navigate = 1, baseline.md section 4.5).
//
// Conventions follow the repo: vitest, createRoot + act from react/react-dom directly,
// injectable controller doubles via vi.mock. No new test framework.
//
// Phase detection, two independent signals:
//   1. React itself. The controller doubles notify their subscribers synchronously, exactly
//      as the real redux-backed engine does on dispatch, and the renderer subscribes and
//      calls setState from that callback. A dispatch made during render therefore produces
//      React's genuine render-phase error. console.error is SPIED ON to ASSERT its absence --
//      no warning is silenced in application code, and the spy is restored after each test.
//   2. The committed DOM at call time. During the parent's render pass the renderer's <input>
//      is not committed yet, so container.querySelector finds nothing; from a post-commit
//      effect it is present. `inputInDom: true` is positive evidence of a post-commit call.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { StrictMode, act, useState } from "react";
import { createRoot, Root } from "react-dom/client";
import { MemoryRouter, useNavigate } from "react-router-dom";

// React 18 only treats act(...) as supported when this flag is set.
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

type Call = { value: string; inputInDom: boolean; controller: unknown };

const searchBoxCalls: Call[] = [];
const instantProductsCalls: Call[] = [];
let searchBoxSubscribers: Array<() => void> = [];
let instantProductsSubscribers: Array<() => void> = [];
let redirectSubscribers: Array<() => void> = [];
let searchBoxSubscribeCount = 0;
let instantProductsSubscribeCount = 0;
let redirectSubscribeCount = 0;
let searchBoxUnsubscribes = 0;
let instantProductsUnsubscribes = 0;
let redirectUnsubscribes = 0;

// Set by mount(); lets the doubles observe whether the renderer's input is committed.
let currentContainer: HTMLDivElement | null = null;
const inputInDom = () =>
  !!currentContainer?.querySelector(".home-search-box input");

const makeSearchBoxDouble = () => {
  const controller: any = {
    state: { value: "", suggestions: [] },
    subscribe(listener: () => void) {
      searchBoxSubscribeCount += 1;
      searchBoxSubscribers.push(listener);
      return () => {
        searchBoxUnsubscribes += 1;
        searchBoxSubscribers = searchBoxSubscribers.filter(
          (l) => l !== listener,
        );
      };
    },
    updateText(value: string) {
      searchBoxCalls.push({ value, inputInDom: inputInDom(), controller });
      // Faithful to @coveo/headless: updateText writes the querySet entry and then calls
      // showSuggestions(). The redux store notifies subscribers synchronously on dispatch,
      // so a render-phase call would reach the subscribed renderer mid-render.
      controller.state = { ...controller.state, value };
      searchBoxSubscribers.forEach((listener) => listener());
    },
    submit: vi.fn(),
    showSuggestions: vi.fn(),
    clear: vi.fn(),
  };
  return controller;
};

const makeInstantProductsDouble = () => {
  const controller: any = {
    state: { products: [] },
    subscribe(listener: () => void) {
      instantProductsSubscribeCount += 1;
      instantProductsSubscribers.push(listener);
      return () => {
        instantProductsUnsubscribes += 1;
        instantProductsSubscribers = instantProductsSubscribers.filter(
          (l) => l !== listener,
        );
      };
    },
    updateQuery(query: string) {
      instantProductsCalls.push({
        value: query,
        inputInDom: inputInDom(),
        controller,
      });
      // Faithful to @coveo/headless buildInstantProducts: a falsy query returns before
      // dispatching anything, so no state change, no productSuggest request and no
      // subscriber notification. Verified against the installed 3.45.0 source and by a live
      // probe against a real commerce engine -- updateQuery("") dispatched [] while
      // updateQuery("cardiology") dispatched the fetch thunk. See
      // evidence/implement/probe-instantproducts.log.
      if (!query) {
        return;
      }
      controller.state = { ...controller.state, q: query };
      instantProductsSubscribers.forEach((listener) => listener());
    },
  };
  return controller;
};

const makeRedirectDouble = () => ({
  state: { redirectTo: null },
  subscribe(listener: () => void) {
    redirectSubscribeCount += 1;
    redirectSubscribers.push(listener);
    return () => {
      redirectUnsubscribes += 1;
      redirectSubscribers = redirectSubscribers.filter((l) => l !== listener);
    };
  },
});

// Only the three controller builders this component uses are replaced; the rest of the
// module keeps its real implementation.
vi.mock("@coveo/headless/commerce", async (importOriginal) => ({
  ...((await importOriginal()) as Record<string, unknown>),
  buildSearchBox: () => makeSearchBoxDouble(),
  buildInstantProducts: () => makeInstantProductsDouble(),
  buildRedirectionTrigger: () => makeRedirectDouble(),
}));

import HomeProductsSearchBox from "./HomeProductsSearchBox";
import { CommerceEngineContext } from "../../common/engineContext";
import { LanguageContext } from "../Internationalization/LanguageUtils";

const engineDouble = {
  dispatch: vi.fn(),
  configuration: {
    accessToken: "token-not-used-in-render",
    organizationId: "pocmpghcdiz0gkgq",
    analytics: { trackingId: "healthcare_cpd_demo" },
  },
} as any;

let container: HTMLDivElement;
let root: Root;
let consoleError: ReturnType<typeof vi.spyOn>;

let navigateTo: ((to: string) => void) | null = null;
let forceRerender: (() => void) | null = null;

const renderPhaseWarnings = () =>
  consoleError.mock.calls.filter((args) =>
    args.some(
      (a) =>
        typeof a === "string" &&
        a.includes("while rendering a different component"),
    ),
  );

// Mirrors src/Components/HomePage/Header.tsx faithfully. Header sits above the router outlet
// (src/App.tsx) and calls useNavigate(), which consumes LocationContext, so Header re-renders
// on every react-router navigation and builds a fresh HomeProductsSearchBox element each
// time. Reproducing that is essential: it is the mechanism that made the old render-body
// dispatch run once per navigation. The local tick state additionally allows a re-render that
// is NOT a navigation. (Putting the component in a Route `element` prop instead would freeze
// the element object and React would bail out of re-rendering it, hiding the behavior.)
const HeaderLike = () => {
  const [, setTick] = useState(0);
  forceRerender = () => setTick((t) => t + 1);
  navigateTo = useNavigate();
  return <HomeProductsSearchBox toggleSearchBox={() => {}} />;
};

const mount = (initialPath = "/mpg", strict = false) => {
  container = document.createElement("div");
  document.body.appendChild(container);
  currentContainer = container;
  root = createRoot(container);
  const inner = (
    <LanguageContext.Provider
      value={{ getText: (text: string) => text } as any}
    >
      <CommerceEngineContext.Provider value={engineDouble}>
        <MemoryRouter initialEntries={[initialPath]}>
          <HeaderLike />
        </MemoryRouter>
      </CommerceEngineContext.Provider>
    </LanguageContext.Provider>
  );
  // StrictMode is applied in TESTS ONLY. src/index.tsx renders the app WITHOUT
  // React.StrictMode (verified), so no claim is made that the app runs under it.
  const tree = strict ? <StrictMode>{inner}</StrictMode> : inner;
  act(() => root.render(tree));
};

const resetsFor = (controller: unknown) =>
  searchBoxCalls.filter((c) => c.controller === controller);

beforeEach(() => {
  searchBoxCalls.length = 0;
  instantProductsCalls.length = 0;
  searchBoxSubscribers = [];
  instantProductsSubscribers = [];
  redirectSubscribers = [];
  searchBoxSubscribeCount = 0;
  instantProductsSubscribeCount = 0;
  redirectSubscribeCount = 0;
  searchBoxUnsubscribes = 0;
  instantProductsUnsubscribes = 0;
  redirectUnsubscribes = 0;
  navigateTo = null;
  forceRerender = null;
  consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  currentContainer = null;
  consoleError.mockRestore();
  vi.useRealTimers();
});

describe("HomeProductsSearchBox does not update engine state during render", () => {
  it("dispatches the reset only after commit, and emits no render-phase warning on mount", () => {
    // Gate 1.
    mount();

    expect(searchBoxCalls).toHaveLength(1);
    expect(searchBoxCalls[0].value).toBe("");
    // Positive evidence of a post-commit call: the renderer's input is already in the DOM.
    expect(searchBoxCalls[0].inputInDom).toBe(true);
    expect(renderPhaseWarnings()).toHaveLength(0);
  });

  it("emits no render-phase warning on navigation, where the defect used to surface", async () => {
    // Gate 1 and gate 2. This is the exact scenario the characterization pass recorded as
    // producing React's render-phase error, and the one the browser baseline reproduced 4/4
    // on /mpg -> /specialty/cardiology.
    mount("/mpg");

    await act(async () => {
      navigateTo!("/specialty/cardiology");
    });

    expect(renderPhaseWarnings()).toHaveLength(0);
    expect(searchBoxCalls.every((c) => c.inputInDom)).toBe(true);
  });

  it("never dispatches the removed instant-products reset from the parent", () => {
    // Gate 2, removal half. The parent must not call updateQuery at all; the only call is
    // the renderer's own [searchTerm] effect, which is scheduled in a setTimeout and so
    // cannot be a render-phase dispatch either.
    vi.useFakeTimers();
    mount();

    // Nothing synchronous from the parent.
    expect(instantProductsCalls).toHaveLength(0);

    act(() => {
      vi.advanceTimersByTime(1);
    });

    // The renderer's pre-existing effect still passes "" on mount -- behavior preserved.
    expect(instantProductsCalls).toHaveLength(1);
    expect(instantProductsCalls[0].value).toBe("");
    expect(instantProductsCalls[0].inputInDom).toBe(true);
  });
});

describe("HomeProductsSearchBox resets the search text at the intended lifecycle point", () => {
  it("resets exactly once per commit -- on navigation AND on a non-navigation re-render", async () => {
    // Gate 2 and gate 4. The effect has no dependency array on purpose: it must reproduce
    // the cadence the render-body dispatch had, which was "every render of this component",
    // NOT "every navigation". Header re-renders this component with no navigation whenever
    // its own openSearch / anchorEl state changes (Header.tsx:42,72), so a per-navigation
    // effect would skip the render that reveals the box. One dispatch per commit, never two.
    mount("/mpg");
    expect(searchBoxCalls).toHaveLength(1);

    await act(async () => {
      navigateTo!("/specialty/cardiology");
    });
    expect(searchBoxCalls).toHaveLength(2);

    await act(async () => {
      forceRerender!();
    });
    expect(searchBoxCalls).toHaveLength(3);

    await act(async () => {
      forceRerender!();
    });
    expect(searchBoxCalls).toHaveLength(4);
    expect(searchBoxCalls.every((c) => c.value === "" && c.inputInDom)).toBe(
      true,
    );
    expect(renderPhaseWarnings()).toHaveLength(0);
  });

  it("clears a stale entry on a non-navigation re-render, the render that reveals the box", async () => {
    // Regression gate for review finding 1. On /mpg, submitting a query makes the commerce
    // querySet reducer write it into EVERY registered entry via updateAllQuerySetQuery --
    // including this box's random-id entry -- and the route does NOT change, because MPGPage
    // writes the hash with window.history.replaceState (MPGPage.tsx:183). The only render
    // that follows is Header's own openSearch flip from the search icon, which is also the
    // render immediately before MUI Fade reveals the box. The reset must fire there: three
    // readers of the controller entry (the clear (x) button at HomeProductsSearchBox.tsx:170,
    // the Enter guard at :196, and submit()) would otherwise act on a query the user never
    // typed in this box.
    mount("/mpg");
    const controller = searchBoxCalls[0].controller as any;
    expect(controller.state.value).toBe("");

    // Simulate updateAllQuerySetQuery on executeSearch.fulfilled: the entry is populated
    // without this component rendering and without the route changing.
    controller.state = { ...controller.state, value: "cardiology" };
    const beforeReveal = searchBoxCalls.length;

    // Header's openSearch flip: a re-render with no navigation.
    await act(async () => {
      forceRerender!();
    });

    expect(searchBoxCalls.length).toBe(beforeReveal + 1);
    expect(searchBoxCalls[searchBoxCalls.length - 1].value).toBe("");
    // The stale entry is gone by the time the box is visible.
    expect(controller.state.value).toBe("");
    expect(renderPhaseWarnings()).toHaveLength(0);
  });

  it("only ever resets to the empty string", () => {
    // Gate 6. The header box owns the DEFAULT querySet entry (it is built with no `id`); the
    // /mpg page owns MPG_SEARCH_BOX_ID and writes its own visible text in bootstrapSearchPage.
    // The bare-/mpg-empty-input and /mpg#q=cardio -> "cardio" contract is therefore owned by
    // MPGPage and is covered by src/Components/MPG/mpgUtils.test.ts and searchBoxModel.test.ts,
    // which this task leaves untouched. Here we pin only that the header never writes anything
    // but "" and so can never leak text into another box's entry.
    mount("/mpg");
    expect(searchBoxCalls.map((c) => c.value)).toEqual([""]);
  });

  it("produces no duplicate resets across rapid route changes", async () => {
    // Gate 4. Three navigations, then assert no controller was reset twice for the same
    // navigation key.
    mount("/mpg");

    await act(async () => {
      navigateTo!("/specialty/cardiology");
    });
    await act(async () => {
      navigateTo!("/specialty/orthopedics");
    });
    await act(async () => {
      navigateTo!("/mpg");
    });

    // One reset per navigation, four total including the mount, and never two for one key.
    expect(searchBoxCalls).toHaveLength(4);
    expect(searchBoxCalls.every((c) => c.value === "")).toBe(true);
    expect(renderPhaseWarnings()).toHaveLength(0);
  });

  it("performs no update after unmount", async () => {
    // Gate 3.
    vi.useFakeTimers();
    mount("/mpg");
    const before = searchBoxCalls.length;
    const beforeInstant = instantProductsCalls.length;

    act(() => root.unmount());

    // Flush everything that could still be pending: timers and microtasks.
    await act(async () => {
      vi.runAllTimers();
      await Promise.resolve();
    });

    expect(searchBoxCalls).toHaveLength(before);
    expect(instantProductsCalls).toHaveLength(beforeInstant);
    expect(renderPhaseWarnings()).toHaveLength(0);
  });
});

describe("HomeProductsSearchBox controller subscriptions", () => {
  it("subscribes to each controller and cleans up the two that already did", async () => {
    // Gate 5. The searchBox and instantProducts effects return their unsubscribe, so both are
    // cleaned up on unmount. The redirectController effect at the top of the renderer has no
    // dependency array and a comma-expression body, so it never unsubscribes. That is a
    // PRE-EXISTING leak, unrelated to a render-phase dispatch, and this task deliberately
    // leaves it unchanged -- it is pinned here so a future change to it is visible.
    mount("/mpg");

    expect(searchBoxSubscribeCount).toBeGreaterThanOrEqual(1);
    expect(instantProductsSubscribeCount).toBeGreaterThanOrEqual(1);
    expect(redirectSubscribeCount).toBeGreaterThanOrEqual(1);

    act(() => root.unmount());

    expect(searchBoxUnsubscribes).toBeGreaterThanOrEqual(1);
    expect(instantProductsUnsubscribes).toBeGreaterThanOrEqual(1);
    // Unchanged pre-existing behavior, not a goal of this task.
    expect(redirectUnsubscribes).toBe(0);
  });
});

describe("HomeProductsSearchBox under React StrictMode", () => {
  it("adds exactly one reset per controller per update, and no render-phase warning", async () => {
    // Gate 7. StrictMode double-invokes effects at the INITIAL mount only. This component's
    // initial mount renders with both controllers still null, so the double-invoked reset
    // effect early-returns both times; the controllers first exist on the NEXT commit, which
    // is an update and runs effects once. The measured result is therefore ONE reset on
    // mount -- identical to the non-StrictMode count, so no duplicated empty-query
    // querySuggest request. src/index.tsx renders <App /> WITHOUT React.StrictMode
    // (verified), so this is a test-only configuration and no claim is made about the app
    // running under it.
    mount("/mpg", true);

    const controllers = Array.from(
      new Set(searchBoxCalls.map((c) => c.controller)),
    );
    // Pinned rather than asserted loosely, so a change in the StrictMode cost is visible.
    expect(searchBoxCalls).toHaveLength(1);
    expect(controllers).toHaveLength(1);
    expect(searchBoxCalls.every((c) => c.value === "" && c.inputInDom)).toBe(
      true,
    );
    expect(renderPhaseWarnings()).toHaveLength(0);

    // Keyed on the controller itself, not on the call index, so the counts can actually fail.
    const before = new Map<unknown, number>(
      controllers.map((c) => [c, resetsFor(c).length]),
    );

    await act(async () => {
      navigateTo!("/specialty/cardiology");
    });

    // The navigation is an update, not a mount: each controller that is still rendered gains
    // exactly one reset, and no controller gains two.
    const deltas = controllers.map(
      (c) => resetsFor(c).length - (before.get(c) ?? 0),
    );
    expect(deltas.filter((d) => d === 1)).toHaveLength(1);
    expect(deltas.every((d) => d <= 1)).toBe(true);
    expect(searchBoxCalls.every((c) => c.value === "")).toBe(true);
    expect(renderPhaseWarnings()).toHaveLength(0);
  });
});
