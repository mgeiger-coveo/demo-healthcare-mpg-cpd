// Phase 0 regression gates for the provider detail page:
//   - the ec.productView lifecycle is unchanged (behavior 9)
//   - nothing on the page displays the synthetic numeric price (behavior 11)
//   - an unresolved provider is reported, never substituted (behavior 12)
//
// createRoot + act from react/react-dom directly, because @testing-library/dom is not a
// dependency of this project. No production file was restructured for these tests.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";

// React 18 only treats act(...) as supported when this flag is set.
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const viewSpy = vi.fn();
const buildProductViewSpy = vi.fn(() => ({ view: viewSpy }));
const fetchProviderByIdSpy = vi.fn();

// Only buildProductView is replaced; everything else in the module keeps its real
// implementation, so nothing about the engine or the controllers is faked away.
vi.mock("@coveo/headless/commerce", async (importOriginal) => ({
  ...((await importOriginal()) as Record<string, unknown>),
  buildProductView: (...args: any[]) => buildProductViewSpy(...(args as [])),
}));

vi.mock("./providerService", () => ({
  fetchProviderById: (...args: any[]) => fetchProviderByIdSpy(...(args as [])),
}));

import ProviderDetailPage from "./ProviderDetailPage";
import { CommerceEngineContext } from "../../common/engineContext";
import { LanguageContext } from "../Internationalization/LanguageUtils";

// A provider exactly as the catalog would supply it once Workstream B's numeric
// ec_price = 0 is applied, so the no-pricing assertions gate that change too.
const davidKim = {
  ec_product_id: "PROV-1006",
  ec_name: "Dr. David Kim",
  ec_price: 0,
  ec_promo_price: 0,
  ec_description: "Board certified cardiologist.",
  additionalFields: {
    hc_accepting_patients: "true",
    hc_specialties: ["Cardiology"],
    hc_locations: ["Downtown Medical Center"],
    hc_medical_group: "Barca Health Cardiology",
  },
};

const sarahMitchell = {
  ec_product_id: "PROV-1001",
  ec_name: "Dr. Sarah Mitchell",
  ec_price: 0,
  additionalFields: { hc_specialties: ["Cardiology"] },
};

// A minimal engine stand-in: the page only passes it to buildProductView, which is
// mocked, so nothing here is exercised beyond identity.
const engineDouble = { dispatch: vi.fn() } as any;

let container: HTMLDivElement;
let root: Root;

const mount = (providerId: string, seededProduct: any) => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  const tree = (
    <LanguageContext.Provider value={{ getText: (text: string) => text }}>
      <CommerceEngineContext.Provider value={engineDouble}>
        <MemoryRouter
          initialEntries={[
            {
              pathname: `/providers/${providerId}`,
              state: seededProduct ? { product: seededProduct } : undefined,
            },
          ]}
        >
          <Routes>
            <Route
              path="/providers/:providerId"
              element={<ProviderDetailPage />}
            />
          </Routes>
        </MemoryRouter>
      </CommerceEngineContext.Provider>
    </LanguageContext.Provider>
  );
  act(() => root.render(tree));
  return {
    markup: () => container.innerHTML,
    rerender: () => act(() => root.render(tree)),
  };
};

beforeEach(() => {
  viewSpy.mockClear();
  buildProductViewSpy.mockClear();
  fetchProviderByIdSpy.mockReset();
});

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
});

describe("ProviderDetailPage product-view analytics", () => {
  it("emits exactly one productView per provider id, with a numeric price of 0", async () => {
    // Behavior 9 — the once-per-provider-id ref guard and the supported
    // buildProductView(...).view({...}) lifecycle are untouched by Phase 0. The price is
    // the numeric 0 the audit calls for, not null and not a string.
    const page = mount("PROV-1006", davidKim);

    expect(buildProductViewSpy).toHaveBeenCalledTimes(1);
    expect(buildProductViewSpy).toHaveBeenCalledWith(engineDouble);
    expect(viewSpy).toHaveBeenCalledTimes(1);
    const payload = viewSpy.mock.calls[0][0];
    expect(payload).toEqual({
      productId: "PROV-1006",
      name: "Dr. David Kim",
      price: 0,
    });
    expect(typeof payload.price).toBe("number");

    // Behavior 10 — re-renders for the same provider add no event.
    page.rerender();
    page.rerender();
    expect(viewSpy).toHaveBeenCalledTimes(1);

    // No lookup was issued either: the seeded product short-circuits it.
    expect(fetchProviderByIdSpy).not.toHaveBeenCalled();
  });

  it("emits a second productView only after the provider id changes", async () => {
    // Behavior 9 — the guard is keyed on the provider id, so a different provider is a
    // new view and the same provider never is.
    mount("PROV-1006", davidKim);
    expect(viewSpy).toHaveBeenCalledTimes(1);

    act(() => root.unmount());
    container.remove();

    mount("PROV-1001", sarahMitchell);
    expect(viewSpy).toHaveBeenCalledTimes(2);
    expect(viewSpy.mock.calls[1][0]).toEqual({
      productId: "PROV-1001",
      name: "Dr. Sarah Mitchell",
      price: 0,
    });
  });
});

describe("ProviderDetailPage shows no pricing", () => {
  it("renders no price, no $0 and no pricing language", () => {
    // Behavior 11 — ec_price = 0 exists for Event Protocol schema compatibility only. It
    // is not a consultation cost or a reimbursement rate, so it must never reach the UI.
    const page = mount("PROV-1006", davidKim);
    const markup = page.markup();

    expect(markup).toContain("Dr. David Kim");
    expect(markup).not.toMatch(/\$/);
    expect(markup).not.toMatch(/\b0\.00\b/);
    expect(markup).not.toMatch(/free/i);
    expect(markup).not.toMatch(/\bprice\b/i);
    expect(markup).not.toMatch(/\bcost\b/i);
    expect(markup).not.toMatch(/\bfee\b/i);
    expect(markup).not.toMatch(/USD/i);
  });
});

describe("ProviderDetailPage reports missing catalog data", () => {
  it("renders the not-found state instead of substituting a provider", async () => {
    // Behavior 12 — an unresolved id yields the not-found copy. No name, no fabricated
    // field and no price is invented to fill the gap, and no analytics event is emitted
    // for a provider that does not exist.
    fetchProviderByIdSpy.mockResolvedValue(null);

    const page = mount("PROV-9999", null);
    await act(async () => {
      await Promise.resolve();
    });

    const markup = page.markup();
    expect(fetchProviderByIdSpy).toHaveBeenCalledWith("PROV-9999");
    expect(markup).toContain("Provider not found");
    expect(markup).not.toContain("PROV-9999");
    expect(markup).not.toMatch(/\$/);
    expect(markup).not.toMatch(/\bprice\b/i);
    expect(viewSpy).not.toHaveBeenCalled();
  });

  it("reports a failed lookup instead of rendering a placeholder provider", async () => {
    // Behavior 12 — a lookup that throws is surfaced as not-found and logged; it is not
    // papered over with default values.
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    fetchProviderByIdSpy.mockRejectedValue(
      new Error("Provider lookup failed: 500"),
    );

    const page = mount("PROV-1006", null);
    await act(async () => {
      await Promise.resolve();
    });

    expect(page.markup()).toContain("Provider not found");
    expect(error).toHaveBeenCalled();
    expect(viewSpy).not.toHaveBeenCalled();
    error.mockRestore();
  });
});
