import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import { useState, act } from "react";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const { buildSearchBoxMock } = vi.hoisted(() => ({
  buildSearchBoxMock: vi.fn(),
}));

vi.mock("@coveo/headless/commerce", async (importOriginal) => ({
  ...((await importOriginal()) as Record<string, unknown>),
  buildSearchBox: buildSearchBoxMock,
}));

vi.mock("@mui/material/TextField", () => ({
  default: ({ InputProps }: any) => <div>{InputProps.endAdornment}</div>,
}));

vi.mock("@mui/material/Autocomplete", () => ({
  default: ({ renderInput }: any) => (
    <div>{renderInput({ InputProps: {} })}</div>
  ),
}));

vi.mock("@mui/material/Button", () => ({
  default: ({ children, onClick }: any) => (
    <button onClick={onClick}>{children}</button>
  ),
}));

vi.mock("@mui/material", () => ({
  IconButton: ({ children, onClick }: any) => (
    <button data-testid="clear-search" onClick={onClick}>
      {children}
    </button>
  ),
}));

vi.mock("@mui/icons-material/Close", () => ({
  default: () => <span>clear</span>,
}));

vi.mock("react-icons-kit", () => ({
  Icon: () => <span>search</span>,
}));

vi.mock("./SpeechRecognitionButton", () => ({
  SpeechRecognitionButton: () => null,
}));

import SearchBox from "./SearchBox";
import { CommerceEngineContext } from "../../common/engineContext";
import { LanguageContext } from "../Internationalization/LanguageUtils";
import { STANDALONE_SEARCHBOX_KEY } from "../HomePage/HomeSearchBox";

const engine = {} as any;
let controller: any;
let container: HTMLDivElement;
let root: Root;
let rerender: (() => void) | null = null;
let consoleError: ReturnType<typeof vi.spyOn>;

const makeController = () => {
  const subscribers: Array<() => void> = [];
  return {
    state: { value: "maya", suggestions: [] },
    submit: vi.fn(),
    updateText: vi.fn((value: string) => {
      controller.state = { ...controller.state, value };
      subscribers.forEach((listener) => listener());
    }),
    subscribe: vi.fn((listener: () => void) => {
      subscribers.push(listener);
      const unsubscribe = vi.fn(() => {
        const index = subscribers.indexOf(listener);
        if (index >= 0) subscribers.splice(index, 1);
      });
      return unsubscribe;
    }),
  };
};

const Harness = () => {
  const [, setTick] = useState(0);
  rerender = () => setTick((tick) => tick + 1);
  return <SearchBox />;
};

const mount = () => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(
      <LanguageContext.Provider
        value={{ getText: (text: string) => text } as any}
      >
        <CommerceEngineContext.Provider value={engine}>
          <Harness />
        </CommerceEngineContext.Provider>
      </LanguageContext.Provider>,
    );
  });
};

beforeEach(() => {
  controller = makeController();
  buildSearchBoxMock.mockReturnValue(controller);
  localStorage.setItem(
    STANDALONE_SEARCHBOX_KEY,
    JSON.stringify({ value: "maya" }),
  );
  consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  localStorage.clear();
  consoleError.mockRestore();
  buildSearchBoxMock.mockReset();
  rerender = null;
});

const renderPhaseWarnings = () =>
  consoleError.mock.calls.filter((args) =>
    args.some(
      (arg) =>
        typeof arg === "string" &&
        arg.includes("while rendering a different component"),
    ),
  );

describe("legacy SearchBox lifecycle", () => {
  it("hydrates and submits the stored query once after commit", () => {
    mount();

    expect(buildSearchBoxMock).toHaveBeenCalledTimes(1);
    expect(controller.updateText).toHaveBeenCalledTimes(1);
    expect(controller.updateText).toHaveBeenCalledWith("maya");
    expect(controller.submit).toHaveBeenCalledTimes(1);
    expect(renderPhaseWarnings()).toHaveLength(0);
  });

  it("keeps one controller and does not resubmit when rerendered", async () => {
    mount();

    await act(async () => {
      rerender!();
    });

    expect(buildSearchBoxMock).toHaveBeenCalledTimes(1);
    expect(controller.updateText).toHaveBeenCalledTimes(1);
    expect(controller.submit).toHaveBeenCalledTimes(1);
    expect(renderPhaseWarnings()).toHaveLength(0);
  });

  it("submits an empty query when clearing the input", () => {
    mount();

    const clearButton = container.querySelector(
      "[data-testid='clear-search']",
    ) as HTMLButtonElement;
    act(() => clearButton.click());

    expect(localStorage.getItem(STANDALONE_SEARCHBOX_KEY)).toBe(
      JSON.stringify({ value: "" }),
    );
    expect(controller.updateText).toHaveBeenLastCalledWith("");
    expect(controller.submit).toHaveBeenCalledTimes(2);
  });

  it("cleans up the controller subscription on unmount", () => {
    mount();
    const unsubscribe = controller.subscribe.mock.results[0].value;

    act(() => root.unmount());

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});
