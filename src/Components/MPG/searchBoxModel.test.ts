import { describe, it, expect } from "vitest";
import {
  createHeadlessSearchBoxModel,
  createNavigatingSearchBoxModel,
} from "./searchBoxModel";

describe("createNavigatingSearchBoxModel", () => {
  it("navigates to the search page and touches no commerce state", () => {
    // T-33 — a listing page's search entry is local text plus a route change. Every call
    // is recorded, so a commerce dispatch sneaking in would show up here.
    const calls: string[] = [];
    let value = "";
    const model = () =>
      createNavigatingSearchBoxModel({
        value,
        setValue: (next) => {
          calls.push(`setValue:${next}`);
          value = next;
        },
        navigate: (to) => calls.push(`navigate:${to}`),
      });

    model().submitQuery("cardio");
    expect(calls).toEqual(["navigate:/mpg#q=cardio"]);

    // A blank submit must not navigate.
    calls.length = 0;
    model().submitQuery("  ");
    expect(calls).toEqual([]);

    model().updateText("car");
    expect(value).toBe("car");
    expect(model().value).toBe("car");

    model().clear();
    expect(value).toBe("");

    calls.length = 0;
    model().selectSuggestion("dr. kim");
    expect(calls).toEqual(["navigate:/mpg#q=dr.%20kim"]);

    // There are no query suggestions without a search box.
    expect(model().suggestions).toEqual([]);
    // Nothing in this model is a commerce dispatch.
    expect(calls.some((call) => call.startsWith("commerce/"))).toBe(false);
  });
});

describe("createHeadlessSearchBoxModel", () => {
  it("drives the commerce controller exactly as the search page does today", () => {
    // T-34
    const calls: string[] = [];
    const controller = {
      state: { value: "cardio", suggestions: [{ rawValue: "cardiology" }] },
      updateText: (value: string) => calls.push(`updateText:${value}`),
      submit: () => calls.push("submit"),
      clear: () => calls.push("clear"),
      selectSuggestion: (value: string) =>
        calls.push(`selectSuggestion:${value}`),
    };
    const model = createHeadlessSearchBoxModel(controller);

    expect(model.value).toBe("cardio");
    expect(model.suggestions).toEqual([{ rawValue: "cardiology" }]);

    model.submitQuery("ortho");
    expect(calls).toEqual(["updateText:ortho", "submit"]);

    calls.length = 0;
    model.clear();
    expect(calls).toEqual(["clear", "submit"]);

    // Delegated, not reimplemented, so the suggestion-select analytics event survives.
    calls.length = 0;
    model.selectSuggestion("cardiology");
    expect(calls).toEqual(["selectSuggestion:cardiology"]);
  });
});
