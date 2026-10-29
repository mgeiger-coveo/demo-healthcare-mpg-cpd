import { describe, it, expect, vi } from "vitest";
import { act } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createRoot } from "react-dom/client";
import { MemoryRouter, StaticRouter } from "react-router-dom";
import ProviderCard from "./ProviderCard";
import { LanguageContext } from "../Internationalization/LanguageUtils";
import { MPGViewModeType } from "../../config/Types/ConfigTypes";

// renderToStaticMarkup + StaticRouter, because @testing-library/dom is not a dependency
// of this project. StaticRouter is exported from the react-router-dom package root.
const renderCard = (
  product: any,
  viewMode: MPGViewModeType,
  location: string = "/mpg",
  fromPath?: string,
) =>
  renderToStaticMarkup(
    <LanguageContext.Provider value={{ getText: (text: string) => text }}>
      <StaticRouter location={location}>
        <ProviderCard
          product={product}
          viewMode={viewMode}
          fromPath={fromPath}
        />
      </StaticRouter>
    </LanguageContext.Provider>,
  );

// Search-response shapes, as probed from POST /commerce/v2/search.
const mitchell = {
  ec_product_id: "PROV-1001",
  ec_name: "Dr. Sarah Mitchell",
  additionalFields: {
    hc_accepting_patients: "true",
    hc_specialties: ["Cardiology", "Preventive Cardiology"],
    hc_locations: ["Downtown Medical Center"],
  },
};

const nguyen = {
  ec_product_id: "PROV-1004",
  ec_name: "Dr. Michael Nguyen",
  additionalFields: {
    hc_accepting_patients: "false",
    hc_specialties: ["Orthopedics"],
    hc_locations: ["Northside Clinic"],
  },
};

// Listing-response shapes, as probed from POST /commerce/v2/listing for
// /specialty/orthopedics: one accepting provider and one not, in the same response.
const carter = {
  ec_product_id: "PROV-1002",
  ec_name: "Dr. James Carter",
  additionalFields: {
    hc_accepting_patients: "true",
    hc_specialties: ["Orthopedics"],
  },
};

const hassan = {
  ec_product_id: "PROV-1007",
  ec_name: "Dr. Amina Hassan",
  additionalFields: {
    hc_accepting_patients: "false",
    hc_specialties: ["Orthopedics"],
  },
};

describe("ProviderCard new-patient badge", () => {
  it("shows the standard variant on a list card", () => {
    const markup = renderCard(mitchell, "list");
    expect(markup).toContain('data-testid="new-patient-badge"');
    expect(markup).toContain('data-variant="standard"');
  });

  it("shows the compact variant on a grid card", () => {
    const markup = renderCard(mitchell, "grid");
    expect(markup).toContain('data-testid="new-patient-badge"');
    expect(markup).toContain('data-variant="compact"');
  });

  it("places the badge after the name and before the specialty line", () => {
    const markup = renderCard(mitchell, "list");
    const name = markup.indexOf("Dr. Sarah Mitchell");
    const badge = markup.indexOf('data-testid="new-patient-badge"');
    const specialty = markup.indexOf("Cardiology, Preventive Cardiology");

    expect(name).toBeGreaterThan(-1);
    expect(badge).toBeGreaterThan(name);
    expect(specialty).toBeGreaterThan(badge);
  });

  it('renders no badge for a "false" provider but keeps the card intact', () => {
    const markup = renderCard(nguyen, "list");
    expect(markup).not.toContain("new-patient-badge");
    expect(markup).toContain("Dr. Michael Nguyen");
    expect(markup).toContain('href="/providers/PROV-1004"');
  });

  it("renders no badge when the field is absent from the response", () => {
    const markup = renderCard(
      {
        ec_product_id: "PROV-9999",
        ec_name: "Dr. Nobody",
        additionalFields: { hc_specialties: ["Primary Care"] },
      },
      "list",
    );
    expect(markup).not.toContain("new-patient-badge");
    expect(markup).toContain('href="/providers/PROV-9999"');
  });

  it("keeps the card's anchor and href on a badged card", () => {
    const markup = renderCard(mitchell, "list");
    expect(markup).toContain('href="/providers/PROV-1001"');
    // The badge itself contributes no anchor, so it cannot shadow the card link.
    expect(markup.match(/<a /g)).toHaveLength(1);
  });
});

describe("ProviderCard badge on specialty listing cards", () => {
  it("badges the accepting provider and not the other, from one listing response", () => {
    const carterMarkup = renderCard(
      carter,
      "list",
      "/specialty/orthopedics",
      "/specialty/orthopedics",
    );
    const hassanMarkup = renderCard(
      hassan,
      "list",
      "/specialty/orthopedics",
      "/specialty/orthopedics",
    );

    expect(carterMarkup).toContain('data-variant="standard"');
    expect(hassanMarkup).not.toContain("new-patient-badge");
    expect(carterMarkup).toContain('href="/providers/PROV-1002"');
    expect(hassanMarkup).toContain('href="/providers/PROV-1007"');
  });

  it("uses the compact variant on a listing grid card", () => {
    expect(renderCard(carter, "grid", "/specialty/orthopedics")).toContain(
      'data-variant="compact"',
    );
  });
});

// -----------------  Phase 0: click lifecycle and the absence of pricing  --------------

// React 18 only treats act(...) as supported when this flag is set. Declared here rather
// than in setupTests.ts so the existing renderToStaticMarkup suites are unaffected.
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

// A provider record carrying the numeric ec_price = 0 that the Workstream B catalog
// change would add, so the no-pricing assertions below are a real regression gate for it.
const kimWithPrice = {
  ec_product_id: "PROV-1006",
  ec_name: "Dr. David Kim",
  ec_price: 0,
  ec_promo_price: 0,
  position: 3,
  responseId: "a2f1c0de-0000-4000-8000-000000000000",
  additionalFields: {
    hc_accepting_patients: "true",
    hc_specialties: ["Cardiology"],
    hc_locations: ["Downtown Medical Center"],
  },
};

describe("ProviderCard click analytics lifecycle", () => {
  // createRoot + act from react/react-dom directly: @testing-library/dom is not a
  // dependency of this project, and nothing in ProviderCard.tsx was restructured to make
  // this testable — its click path is byte-identical to before Phase 0.
  const mountCard = (controller: any, product: any = kimWithPrice) => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    const tree = (
      <LanguageContext.Provider value={{ getText: (text: string) => text }}>
        <MemoryRouter initialEntries={["/mpg"]}>
          <ProviderCard
            product={product}
            controller={controller}
            viewMode="list"
          />
        </MemoryRouter>
      </LanguageContext.Provider>
    );
    act(() => root.render(tree));
    const rerender = () => act(() => root.render(tree));
    const unmount = () => {
      act(() => root.unmount());
      container.remove();
    };
    return { container, rerender, unmount };
  };

  const createControllerDouble = () => {
    const select = vi.fn();
    const interactiveProduct = vi.fn(() => ({ select }));
    return {
      controller: { interactiveProduct } as any,
      interactiveProduct,
      select,
    };
  };

  it("emits exactly one interactiveProduct select per card click", () => {
    // Behavior 8 — the supported Headless lifecycle, unchanged: one
    // interactiveProduct({ options: { product } }).select() per click, with position and
    // responseId left for Headless to derive from the product itself.
    const { controller, interactiveProduct, select } = createControllerDouble();
    const { container, rerender, unmount } = mountCard(controller);

    const anchor = container.querySelector("a");
    expect(anchor).not.toBeNull();

    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    act(() => {
      anchor!.dispatchEvent(event);
    });

    expect(interactiveProduct).toHaveBeenCalledTimes(1);
    expect(interactiveProduct).toHaveBeenCalledWith({
      options: { product: kimWithPrice },
    });
    expect(select).toHaveBeenCalledTimes(1);
    expect(select).toHaveBeenCalledWith();
    // A plain click is prevented by react-router's own Link handler so it can navigate
    // in place — that is the router's doing, not the card's.
    expect(event.defaultPrevented).toBe(true);

    // The card's handler adds no preventDefault of its own, which is what keeps
    // cmd/ctrl-click working: a modified click is left to the browser and still logs.
    const metaEvent = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      metaKey: true,
    });
    act(() => {
      anchor!.dispatchEvent(metaEvent);
    });
    expect(metaEvent.defaultPrevented).toBe(false);
    expect(select).toHaveBeenCalledTimes(2);

    // Behavior 10 — a re-render with the same props adds no event.
    rerender();
    rerender();
    expect(interactiveProduct).toHaveBeenCalledTimes(2);
    expect(select).toHaveBeenCalledTimes(2);

    unmount();
  });

  it("emits nothing until the user clicks, and nothing without a controller", () => {
    // Behavior 10 — mounting, re-rendering and unmounting a card produce no analytics;
    // the event is strictly user initiated. A card rendered without a controller (the
    // detail-page related rail case) stays silent instead of throwing.
    const { controller, interactiveProduct, select } = createControllerDouble();
    const mounted = mountCard(controller);
    mounted.rerender();
    expect(interactiveProduct).not.toHaveBeenCalled();
    expect(select).not.toHaveBeenCalled();
    mounted.unmount();

    const withoutController = mountCard(undefined);
    const anchor = withoutController.container.querySelector("a");
    expect(() =>
      act(() => {
        anchor!.dispatchEvent(
          new MouseEvent("click", { bubbles: true, cancelable: true }),
        );
      }),
    ).not.toThrow();
    withoutController.unmount();
  });
});

describe("ProviderCard shows no pricing", () => {
  it("renders no price, no $0 and no pricing language", () => {
    // Behavior 11 — ec_price = 0 exists for Event Protocol schema compatibility only. It
    // is not a consultation cost, a reimbursement rate or any medical price, so it must
    // never surface in the UI in either view mode.
    (["list", "grid"] as MPGViewModeType[]).forEach((viewMode) => {
      const markup = renderCard(kimWithPrice, viewMode);
      expect(markup).toContain("Dr. David Kim");
      expect(markup).not.toMatch(/\$/);
      expect(markup).not.toMatch(/\b0\.00\b/);
      expect(markup).not.toMatch(/free/i);
      expect(markup).not.toMatch(/price/i);
      expect(markup).not.toMatch(/cost/i);
      expect(markup).not.toMatch(/USD/i);
    });
  });
});
