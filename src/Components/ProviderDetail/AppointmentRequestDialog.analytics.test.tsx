// Phase 2 event-lifecycle gates for the appointment workflow.
//
// This file supersedes the Phase 1 version, which asserted that the flow emitted ZERO
// analytics events and never built a Commerce controller. Phase 2 is authorized to
// instrument exactly that flow, so those four assertions are replaced by the per-
// interaction event policy below. Every invariant they also carried is kept and made more
// specific: the application still issues no `fetch`, XHR or `sendBeacon` of its own; no
// patient information is collected anywhere; no price is rendered; and the flow still
// renders and completes with no `CommerceEngineContext` in the tree.
//
// The engine is a REAL Commerce engine, built through the same public entry point and with
// the same `renewAccessToken` configuration the application uses, and the events are read
// off its own relay listener. The counts asserted here are therefore the events the engine
// actually emits — not a count of our own calls. Only the relay's transport
// (`navigator.sendBeacon`) is replaced by a recorder, so nothing reaches the network and no
// live event is generated.
//
// Emission is asynchronous in a real engine: the renew-access-token middleware awaits a
// proactive token check before any thunk reaches the store. `settle()` drains that queue
// before the assertions.
//
// Policy under test, per intentional interaction:
//   open                        -> 1 ec.cartAction add        (appointment request intent)
//   rerender / re-entrant press -> nothing
//   step selection, Continue, Back -> nothing
//   cancel, close icon, Escape  -> 1 ec.cartAction remove     (abandoned before submission)
//   submit on review            -> 1 ec.purchase              (Simulated Appointment
//                                                              Request Submitted, revenue 0)
//   double-click / Enter-repeat -> nothing extra
//   close from confirmation     -> nothing

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { StrictMode } from "react";
import { act, cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import ProviderAppointmentCta from "./ProviderAppointmentCta";
import {
  createCommerceEngineHarness,
  type CommerceEngineHarness,
} from "./__tests__/appointmentCommerceEngineHarness";
import { CommerceEngineContext } from "../../common/engineContext";
import { LanguageContext } from "../Internationalization/LanguageUtils";
import {
  MPG_APPOINTMENT_VISIT_TYPE_FOLLOW_UP,
  MPG_PROVIDER_CTA_BUTTON,
} from "../../config/MPGConfig";

const PROV_1001 = {
  ec_product_id: "PROV-1001",
  ec_name: "Dr. Sarah Mitchell",
  ec_price: 0,
  additionalFields: {
    hc_locations: ["Downtown Medical Center", "Northside Clinic"],
    hc_telehealth: "true",
  },
};

const PROV_1002 = {
  ec_product_id: "PROV-1002",
  ec_name: "Dr. James Patel",
  ec_price: 0,
  additionalFields: {
    hc_locations: ["Westside Orthopedic Center"],
    hc_telehealth: "false",
  },
};

let harness: CommerceEngineHarness;

/** Drains the engine's deferred emissions so the captured list is complete. */
const settle = async () => {
  await harness.flush();
};

const tree = (product: any, engine: any) => (
  <LanguageContext.Provider value={{ getText: (text: string) => text } as any}>
    <MemoryRouter>
      <CommerceEngineContext.Provider value={engine}>
        <ProviderAppointmentCta
          product={product}
          providerName={String(product?.ec_name ?? "")}
          specialtyLine="Cardiology"
          discoveryPath="/mpg"
        />
      </CommerceEngineContext.Provider>
    </MemoryRouter>
  </LanguageContext.Provider>
);

const renderCta = (product: any = PROV_1001, engine: any = undefined) =>
  render(tree(product, engine === undefined ? harness.engine : engine));

const trigger = () =>
  screen.getByRole("button", { name: MPG_PROVIDER_CTA_BUTTON, hidden: true });
const dialog = () => screen.getByRole("dialog");

/** Relay event types in emission order, e.g. `["ec.cartAction add", "ec.purchase"]`. */
const sequence = () =>
  harness.events.map((event) =>
    event.type === "ec.cartAction"
      ? `ec.cartAction ${event.payload.action} ${event.payload.product.productId}`
      : `${event.type} ${event.payload.transaction.id.slice(0, 18)}`,
  );

const cartActions = () => harness.eventsOfType("ec.cartAction");
const purchases = () => harness.eventsOfType("ec.purchase");

/** Advances a fresh dialog to the review step. */
const advanceToReview = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(
    within(dialog()).getByRole("radio", { name: "Northside Clinic" }),
  );
  await user.click(within(dialog()).getByRole("button", { name: "Continue" }));
  await user.click(
    within(dialog()).getByRole("radio", {
      name: MPG_APPOINTMENT_VISIT_TYPE_FOLLOW_UP,
    }),
  );
  await user.click(within(dialog()).getByRole("button", { name: "Continue" }));
};

let fetchSpy: ReturnType<typeof vi.fn>;
let xhrOpenSpy: ReturnType<typeof vi.fn>;
let xhrSendSpy: ReturnType<typeof vi.fn>;
let originalFetch: any;
let originalOpen: any;
let originalSend: any;

// Spies are installed and restored by hand. Nothing here patches, filters or silences
// `console`: React warnings must stay visible. `navigator.sendBeacon` is owned by the
// harness, which records the relay's transport calls and restores the original.
beforeEach(() => {
  harness = createCommerceEngineHarness();

  fetchSpy = vi.fn();
  xhrOpenSpy = vi.fn();
  xhrSendSpy = vi.fn();

  originalFetch = (globalThis as any).fetch;
  originalOpen = XMLHttpRequest.prototype.open;
  originalSend = XMLHttpRequest.prototype.send;

  (globalThis as any).fetch = fetchSpy;
  XMLHttpRequest.prototype.open = xhrOpenSpy as any;
  XMLHttpRequest.prototype.send = xhrSendSpy as any;
});

afterEach(() => {
  cleanup();
  harness.restore();
  (globalThis as any).fetch = originalFetch;
  XMLHttpRequest.prototype.open = originalOpen;
  XMLHttpRequest.prototype.send = originalSend;
});

// The application itself never performs a request. The only transport in the supported
// path is the engine's relay, so the recorded transport calls must match the emitted
// events exactly: one beacon per event, and no `fetch` or `XMLHttpRequest` at all.
const expectNoApplicationTraffic = () => {
  expect(fetchSpy).not.toHaveBeenCalled();
  expect(xhrOpenSpy).not.toHaveBeenCalled();
  expect(xhrSendSpy).not.toHaveBeenCalled();
  expect(harness.beacons()).toHaveLength(harness.events.length);
};

describe("appointment request intent", () => {
  it("emits one ec.cartAction add for the provider when the flow is opened", async () => {
    const user = userEvent.setup();
    renderCta();

    await user.click(trigger());

    expect(sequence()).toEqual(["ec.cartAction add PROV-1001"]);
    expect(cartActions()[0].payload.product).toEqual({
      productId: "PROV-1001",
      name: "Dr. Sarah Mitchell",
      price: 0,
    });
    expect(cartActions()[0].payload.quantity).toBe(1);
    expectNoApplicationTraffic();
  });

  it("does not count a rerender as intent", async () => {
    const user = userEvent.setup();
    const view = renderCta();

    await user.click(trigger());
    // A parent re-render, then a language-context change: both re-render the open dialog.
    view.rerender(tree(PROV_1001, harness.engine));
    await act(async () => {
      view.rerender(
        <LanguageContext.Provider
          value={{ getText: (text: string) => text } as any}
        >
          <MemoryRouter>
            <CommerceEngineContext.Provider value={harness.engine}>
              <ProviderAppointmentCta
                product={{ ...PROV_1001 }}
                providerName="Dr. Sarah Mitchell"
                specialtyLine="Cardiology"
                discoveryPath="/mpg"
              />
            </CommerceEngineContext.Provider>
          </MemoryRouter>
        </LanguageContext.Provider>,
      );
    });

    expect(cartActions()).toHaveLength(1);
  });

  it("does not count a re-entrant press of the trigger as a second attempt", async () => {
    const user = userEvent.setup();
    renderCta();

    await user.click(trigger());
    // The modal covers the trigger, so a real visitor cannot reach it; dispatched
    // directly to prove the handler itself short-circuits while the dialog is open.
    await act(async () => {
      trigger().click();
      trigger().click();
    });

    expect(cartActions()).toHaveLength(1);
  });

  it("emits nothing while the visitor moves through the steps", async () => {
    const user = userEvent.setup();
    renderCta();

    await user.click(trigger());
    const before = harness.events.length;
    await advanceToReview(user);
    await user.click(within(dialog()).getByRole("button", { name: "Back" }));
    await user.click(
      within(dialog()).getByRole("radio", {
        name: MPG_APPOINTMENT_VISIT_TYPE_FOLLOW_UP,
      }),
    );
    await user.click(
      within(dialog()).getByRole("button", { name: "Continue" }),
    );

    expect(harness.events).toHaveLength(before);
    expect(purchases()).toHaveLength(0);
  });

  it("records nothing when the provider carries no ec_product_id, and still opens", async () => {
    const user = userEvent.setup();
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      renderCta({ ec_name: "Dr. Nobody", additionalFields: {} });
      await user.click(trigger());

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(harness.events).toHaveLength(0);
      expect(errorSpy).toHaveBeenCalledTimes(1);
    } finally {
      errorSpy.mockRestore();
    }
  });
});

describe("abandonment before submission", () => {
  it("emits one ec.cartAction remove on Cancel, and never a purchase", async () => {
    const user = userEvent.setup();
    renderCta();

    await user.click(trigger());
    await user.click(
      within(dialog()).getByRole("radio", { name: "Downtown Medical Center" }),
    );
    await user.click(
      within(dialog()).getByRole("button", { name: "Continue" }),
    );
    await user.click(within(dialog()).getByRole("button", { name: "Cancel" }));

    expect(sequence()).toEqual([
      "ec.cartAction add PROV-1001",
      "ec.cartAction remove PROV-1001",
    ]);
    expect(purchases()).toHaveLength(0);
    expectNoApplicationTraffic();
  });

  it("emits one remove when the dialog is dismissed with the close icon", async () => {
    const user = userEvent.setup();
    renderCta();

    await user.click(trigger());
    await user.click(
      within(dialog()).getByRole("button", {
        name: "Close appointment request",
      }),
    );

    expect(sequence()).toEqual([
      "ec.cartAction add PROV-1001",
      "ec.cartAction remove PROV-1001",
    ]);
    expect(purchases()).toHaveLength(0);
  });

  it("emits one remove when the dialog is dismissed with Escape", async () => {
    const user = userEvent.setup();
    renderCta();

    await user.click(trigger());
    await user.keyboard("{Escape}");

    expect(sequence()).toEqual([
      "ec.cartAction add PROV-1001",
      "ec.cartAction remove PROV-1001",
    ]);
    expect(purchases()).toHaveLength(0);
  });

  it("records a reopened flow after cancellation as a second intent", async () => {
    const user = userEvent.setup();
    renderCta();

    await user.click(trigger());
    await user.click(within(dialog()).getByRole("button", { name: "Cancel" }));
    await user.click(trigger());

    expect(sequence()).toEqual([
      "ec.cartAction add PROV-1001",
      "ec.cartAction remove PROV-1001",
      "ec.cartAction add PROV-1001",
    ]);
  });

  it("emits nothing when the dialog subtree is unmounted by navigation", async () => {
    const user = userEvent.setup();
    const view = renderCta();

    await user.click(trigger());
    const before = harness.events.length;
    view.unmount();

    expect(harness.events).toHaveLength(before);
    expect(purchases()).toHaveLength(0);
  });

  it("records a second attempt on the SAME provider after an unmount as remove then add", async () => {
    const user = userEvent.setup();
    const view = renderCta();

    await user.click(trigger());
    // Navigation unmounts the subtree with the dialog open, so no close handler runs and
    // the provider's own line survives in the engine-global cart. Returning to the same
    // provider must still count as a start: the open-time clear turns the interrupted
    // attempt into the abandonment it was, which is also what keeps the new add from
    // being swallowed by the controller's identical-line early return.
    view.unmount();
    renderCta(PROV_1001);
    await user.click(trigger());
    await settle();

    expect(sequence()).toEqual([
      "ec.cartAction add PROV-1001",
      "ec.cartAction remove PROV-1001",
      "ec.cartAction add PROV-1001",
    ]);
    expect(purchases()).toHaveLength(0);
    expect(harness.items().map((item) => item.productId)).toEqual([
      "PROV-1001",
    ]);
  });

  it("removes the previous provider's line when a different provider's flow is opened", async () => {
    const user = userEvent.setup();
    const view = renderCta();

    await user.click(trigger());
    // Navigating away without closing leaves the line behind; the next attempt sweeps it.
    view.unmount();
    renderCta(PROV_1002);
    await user.click(trigger());
    await settle();

    expect(sequence()).toEqual([
      "ec.cartAction add PROV-1001",
      "ec.cartAction remove PROV-1001",
      "ec.cartAction add PROV-1002",
    ]);
    expect(harness.items().map((item) => item.productId)).toEqual([
      "PROV-1002",
    ]);
  });
});

describe("simulated appointment request submission", () => {
  it("emits one ec.purchase with revenue 0 carrying exactly the requested provider", async () => {
    const user = userEvent.setup();
    renderCta();

    await user.click(trigger());
    await advanceToReview(user);
    await user.click(
      within(dialog()).getByRole("button", {
        name: "Submit simulated request",
      }),
    );

    await settle();

    expect(cartActions()).toHaveLength(1);
    expect(purchases()).toHaveLength(1);
    const payload = purchases()[0].payload;
    expect(payload.products).toEqual([
      {
        quantity: 1,
        product: {
          productId: "PROV-1001",
          name: "Dr. Sarah Mitchell",
          price: 0,
        },
      },
    ]);
    expect(payload.transaction.revenue).toBe(0);
    expect(typeof payload.transaction.revenue).toBe("number");
    expect(payload.transaction.id).toMatch(/^SIM-APPT-PROV-1001-/);
    expect(
      within(dialog()).getByRole("heading", {
        name: "Appointment Request Submitted (Demo)",
      }),
    ).toBeInTheDocument();
    expectNoApplicationTraffic();
  });

  it("emits one purchase for a double-click on Submit", async () => {
    const user = userEvent.setup();
    renderCta();

    await user.click(trigger());
    await advanceToReview(user);
    const submit = within(dialog()).getByRole("button", {
      name: "Submit simulated request",
    });
    // Both clicks are dispatched before React re-renders, which is the case only the
    // in-handler latch can stop.
    await act(async () => {
      submit.click();
      submit.click();
    });
    await settle();

    expect(purchases()).toHaveLength(1);
  });

  it("emits one purchase for an Enter key-repeat on Submit", async () => {
    const user = userEvent.setup();
    renderCta();

    await user.click(trigger());
    await advanceToReview(user);
    const submit = within(dialog()).getByRole("button", {
      name: "Submit simulated request",
    });
    submit.focus();
    await user.keyboard("{Enter>3/}");
    await settle();

    expect(purchases()).toHaveLength(1);
  });

  it("emits nothing when the dialog is closed from the confirmation step", async () => {
    const user = userEvent.setup();
    renderCta();

    await user.click(trigger());
    await advanceToReview(user);
    await user.click(
      within(dialog()).getByRole("button", {
        name: "Submit simulated request",
      }),
    );
    await user.click(within(dialog()).getByRole("button", { name: "Close" }));
    await settle();

    expect(sequence()).toEqual([
      "ec.cartAction add PROV-1001",
      "ec.purchase SIM-APPT-PROV-1001",
    ]);
    expect(harness.items()).toHaveLength(0);
  });

  it("records a reopened flow after a completed submission as a new intent", async () => {
    const user = userEvent.setup();
    renderCta();

    await user.click(trigger());
    await advanceToReview(user);
    await user.click(
      within(dialog()).getByRole("button", {
        name: "Submit simulated request",
      }),
    );
    await user.click(within(dialog()).getByRole("button", { name: "Close" }));
    await user.click(trigger());
    await settle();

    expect(cartActions().map((event) => event.payload.action)).toEqual([
      "add",
      "add",
    ]);
    expect(purchases()).toHaveLength(1);
  });

  it("generates a different transaction id for each completed attempt", async () => {
    const user = userEvent.setup();
    renderCta();

    await user.click(trigger());
    await advanceToReview(user);
    await user.click(
      within(dialog()).getByRole("button", {
        name: "Submit simulated request",
      }),
    );
    await user.click(within(dialog()).getByRole("button", { name: "Close" }));
    await user.click(trigger());
    await advanceToReview(user);
    await user.click(
      within(dialog()).getByRole("button", {
        name: "Submit simulated request",
      }),
    );

    await settle();

    const ids = purchases().map((event) => event.payload.transaction.id);
    expect(ids).toHaveLength(2);
    expect(ids[0]).not.toBe(ids[1]);
  });

  it("emits exactly one add and one purchase under StrictMode double-rendering", async () => {
    const user = userEvent.setup();
    render(<StrictMode>{tree(PROV_1001, harness.engine)}</StrictMode>);

    await user.click(trigger());
    await advanceToReview(user);
    await user.click(
      within(dialog()).getByRole("button", {
        name: "Submit simulated request",
      }),
    );

    await settle();

    expect(sequence()).toEqual([
      "ec.cartAction add PROV-1001",
      "ec.purchase SIM-APPT-PROV-1001",
    ]);
  });

  it("emits only cart and purchase events: no productClick or productView comes from this flow", async () => {
    const user = userEvent.setup();
    renderCta();

    await user.click(trigger());
    await advanceToReview(user);
    await user.click(
      within(dialog()).getByRole("button", {
        name: "Submit simulated request",
      }),
    );

    await settle();

    expect(new Set(harness.events.map((event) => event.type))).toEqual(
      new Set(["ec.cartAction", "ec.purchase"]),
    );
  });
});

describe("invariants carried over from the pre-instrumentation gates", () => {
  it("renders and completes with no CommerceEngineContext in the tree", async () => {
    const user = userEvent.setup();
    render(tree(PROV_1001, null));

    await user.click(trigger());
    await advanceToReview(user);
    await user.click(
      within(dialog()).getByRole("button", {
        name: "Submit simulated request",
      }),
    );

    expect(
      within(dialog()).getByRole("heading", {
        name: "Appointment Request Submitted (Demo)",
      }),
    ).toBeInTheDocument();
    await settle();

    expect(harness.events).toHaveLength(0);
    expectNoApplicationTraffic();
  });

  it("collects no patient information at any step", async () => {
    const user = userEvent.setup();
    renderCta();

    await user.click(trigger());
    const freeTextAtEachStep = () => {
      const panel = dialog();
      expect(panel.querySelectorAll("textarea")).toHaveLength(0);
      expect(
        Array.from(panel.querySelectorAll("input")).filter(
          (input) => input.type !== "radio",
        ),
      ).toHaveLength(0);
      expect(within(panel).queryAllByRole("textbox")).toHaveLength(0);
      expect(within(panel).queryAllByRole("combobox")).toHaveLength(0);
      expect(within(panel).queryAllByRole("spinbutton")).toHaveLength(0);
    };

    freeTextAtEachStep();
    await advanceToReview(user);
    freeTextAtEachStep();
    await user.click(
      within(dialog()).getByRole("button", {
        name: "Submit simulated request",
      }),
    );
    freeTextAtEachStep();
  });

  it("displays no price, cost or fee even though the cart line carries price 0", async () => {
    const user = userEvent.setup();
    renderCta();

    await user.click(trigger());
    await advanceToReview(user);
    const reviewText = dialog().textContent ?? "";
    await user.click(
      within(dialog()).getByRole("button", {
        name: "Submit simulated request",
      }),
    );
    const confirmationText = dialog().textContent ?? "";
    await settle();

    for (const text of [reviewText, confirmationText]) {
      expect(text).not.toMatch(/\$|0\.00|0,00|\bprice\b|\bcost\b|\bfee\b/i);
    }
    // The event payload still carries the numeric 0 that the schema requires.
    expect(purchases()[0].payload.products[0].product.price).toBe(0);
  });
});
