// Phase 2 unit gates for the appointment analytics module: the pure helpers and the three
// recorders against a mocked Commerce surface, which pins WHAT WE CALL — controller
// construction, the exact payloads, the dispatch order of the submission, the engine-null
// and missing-id guards, and error containment.
//
// WHAT THE ENGINE EMITS is asserted separately, in `appointmentAnalytics.engine.test.ts`,
// against a real engine. The split is deliberate: a mocked `buildCart` cannot observe an
// emitted payload, and this file must not be read as evidence about one.
//
// No network, no live events, no engine configuration and no `.env`. Nothing here patches
// or silences `console`; the guard tests that expect a `console.error` replace it with a
// spy for the duration of the assertion only.

import { describe, it, expect, vi, beforeEach } from "vitest";

const buildCartSpy = vi.fn();
const emitPurchaseEventStub = vi.fn((payload: any) => ({
  type: "test/emitPurchaseEvent",
  payload,
}));
const purchaseStub = vi.fn(() => ({ type: "test/purchase" }));
const loadCartActionsSpy = vi.fn(() => ({
  emitPurchaseEvent: emitPurchaseEventStub,
  purchase: purchaseStub,
}));

vi.mock("@coveo/headless/commerce", async (importOriginal) => {
  const original = (await importOriginal()) as Record<string, unknown>;
  return {
    ...original,
    buildCart: (...args: any[]) => buildCartSpy(...(args as [])),
    loadCartActions: (...args: any[]) => loadCartActionsSpy(...(args as [])),
  };
});

import {
  APPOINTMENT_SYNTHETIC_PRICE,
  APPOINTMENT_SYNTHETIC_REVENUE,
  APPOINTMENT_TRANSACTION_PREFIX,
  buildAppointmentCartItem,
  createAppointmentTransactionId,
  getAppointmentProductId,
  recordAppointmentAbandoned,
  recordAppointmentIntent,
  recordAppointmentSubmitted,
  selectStaleAppointmentCartItems,
} from "./appointmentAnalytics";

const PROV_1001 = {
  ec_product_id: "PROV-1001",
  ec_name: "Dr. Sarah Mitchell",
  ec_price: 0,
};

const PROV_1002 = {
  ec_product_id: "PROV-1002",
  ec_name: "Dr. James Patel",
  ec_price: 0,
};

const ITEM_1001 = {
  productId: "PROV-1001",
  name: "Dr. Sarah Mitchell",
  price: 0,
  quantity: 1,
};

// A stand-in for the engine held in CommerceEngineContext. These tests only check that
// this exact object reaches `buildCart` / `loadCartActions` and what is dispatched on it.
const engineDouble = { dispatch: vi.fn() } as any;

/** Drains the microtask queue so the deferred cart-empty dispatch has run. */
const flush = async () => {
  await new Promise((resolve) => setTimeout(resolve, 0));
};

/** A `Cart` double whose cart contents are declared per test. */
const cartDouble = (items: any[] = []) => {
  const double = {
    state: { items, totalQuantity: items.length, totalPrice: 0 },
    updateItemQuantity: vi.fn(),
    purchase: vi.fn(),
    empty: vi.fn(),
    subscribe: vi.fn(),
  };
  buildCartSpy.mockReturnValue(double);
  return double;
};

beforeEach(() => {
  buildCartSpy.mockReset();
  loadCartActionsSpy.mockClear();
  emitPurchaseEventStub.mockClear();
  purchaseStub.mockClear();
  engineDouble.dispatch.mockReset();
});

// ---------------------------------------------------------------- pure helpers

describe("the provider id comes from the catalog, never from an invention", () => {
  it("reads ec_product_id and trims it", () => {
    expect(getAppointmentProductId(PROV_1001)).toBe("PROV-1001");
    expect(getAppointmentProductId({ ec_product_id: "  PROV-1007  " })).toBe(
      "PROV-1007",
    );
  });

  it("returns an empty string rather than a substitute when the field is absent", () => {
    expect(getAppointmentProductId({})).toBe("");
    expect(getAppointmentProductId({ ec_product_id: "" })).toBe("");
    expect(getAppointmentProductId({ ec_product_id: null })).toBe("");
    expect(getAppointmentProductId(undefined)).toBe("");
  });
});

describe("the cart line built for an appointment request", () => {
  it("carries the provider's ec_product_id, its ec_name and quantity 1", () => {
    expect(buildAppointmentCartItem(PROV_1001)).toEqual(ITEM_1001);
  });

  it("carries the JSON number 0 as the price, never a string", () => {
    const item = buildAppointmentCartItem(PROV_1001)!;
    expect(item.price).toBe(0);
    expect(typeof item.price).toBe("number");
    expect(APPOINTMENT_SYNTHETIC_PRICE).toBe(0);
    expect(typeof APPOINTMENT_SYNTHETIC_PRICE).toBe("number");
  });

  it("uses the same name expression as the existing ec.productView call", () => {
    expect(buildAppointmentCartItem({ ec_product_id: "PROV-1009" })!.name).toBe(
      "",
    );
  });

  it("is null when the product carries no usable product id", () => {
    expect(buildAppointmentCartItem({ ec_name: "Dr. Nobody" })).toBeNull();
    expect(buildAppointmentCartItem({ ec_product_id: "  " })).toBeNull();
  });
});

describe("stale cart lines belonging to another provider", () => {
  it("selects every line whose productId differs, and nothing else", () => {
    const items = [
      ITEM_1001,
      {
        productId: "PROV-1002",
        name: "Dr. James Patel",
        price: 0,
        quantity: 1,
      },
    ];
    expect(selectStaleAppointmentCartItems(items, "PROV-1001")).toEqual([
      items[1],
    ]);
    expect(selectStaleAppointmentCartItems(items, "PROV-1002")).toEqual([
      items[0],
    ]);
    expect(selectStaleAppointmentCartItems([], "PROV-1001")).toEqual([]);
  });
});

describe("the synthetic transaction id", () => {
  it("has the approved format and the simulated-appointment prefix", () => {
    expect(
      createAppointmentTransactionId("PROV-1001", 1761740000000, "4a1c9e02"),
    ).toBe(`SIM-APPT-PROV-1001-${(1761740000000).toString(36)}-4a1c9e02`);
    expect(APPOINTMENT_TRANSACTION_PREFIX).toBe("SIM-APPT");
  });

  it("is ASCII, under 60 characters, and carries no patient information", () => {
    const id = createAppointmentTransactionId("PROV-1001");
    expect(id.length).toBeLessThan(60);
    expect(id).toMatch(/^SIM-APPT-PROV-1001-[0-9a-z]+-[0-9a-f]{8}$/);
  });

  it("is never reused across distinct attempts", () => {
    const ids = new Set(
      Array.from({ length: 500 }, () =>
        createAppointmentTransactionId("PROV-1001"),
      ),
    );
    expect(ids.size).toBe(500);
  });

  it("still produces a unique id when no CSPRNG is available", () => {
    const realCrypto = (globalThis as any).crypto;
    Object.defineProperty(globalThis, "crypto", {
      value: {},
      configurable: true,
      writable: true,
    });
    try {
      const ids = new Set(
        Array.from({ length: 200 }, () =>
          createAppointmentTransactionId("PROV-1001"),
        ),
      );
      expect(ids.size).toBe(200);
      expect(createAppointmentTransactionId("PROV-1001")).toMatch(
        /^SIM-APPT-PROV-1001-[0-9a-z]+-[0-9a-f]{8}$/,
      );
    } finally {
      Object.defineProperty(globalThis, "crypto", {
        value: realCrypto,
        configurable: true,
        writable: true,
      });
    }
  });
});

// ----------------------------------------------------------- what we call

describe("recordAppointmentIntent", () => {
  it("builds the cart controller on the engine it was handed, exactly once", () => {
    cartDouble();
    recordAppointmentIntent(engineDouble, PROV_1001);
    expect(buildCartSpy).toHaveBeenCalledTimes(1);
    expect(buildCartSpy).toHaveBeenCalledWith(engineDouble);
  });

  it("adds the provider at quantity 1 and price 0", () => {
    const cart = cartDouble();
    recordAppointmentIntent(engineDouble, PROV_1001);
    expect(cart.updateItemQuantity).toHaveBeenCalledTimes(1);
    expect(cart.updateItemQuantity).toHaveBeenCalledWith(ITEM_1001);
  });

  it("removes another provider's stale line before adding this one", () => {
    const stale = {
      productId: "PROV-1002",
      name: "Dr. James Patel",
      price: 0,
      quantity: 1,
    };
    const cart = cartDouble([stale]);
    recordAppointmentIntent(engineDouble, PROV_1001);
    expect(cart.updateItemQuantity.mock.calls.map((call) => call[0])).toEqual([
      { ...stale, quantity: 0 },
      ITEM_1001,
    ]);
  });

  it("removes this provider's OWN stale line before adding, so the add is never deduped", () => {
    // Left behind by an attempt the visitor never closed — navigation unmounted the
    // dialog subtree, so no close handler ran. An identical re-add would hit the
    // controller's isEqual early return and emit nothing at all.
    const cart = cartDouble([ITEM_1001]);
    recordAppointmentIntent(engineDouble, PROV_1001);
    expect(cart.updateItemQuantity.mock.calls.map((call) => call[0])).toEqual([
      { ...ITEM_1001, quantity: 0 },
      ITEM_1001,
    ]);
  });

  it("does nothing at all when there is no engine", () => {
    cartDouble();
    recordAppointmentIntent(null, PROV_1001);
    expect(buildCartSpy).not.toHaveBeenCalled();
  });

  it("never touches the controller when the product id is missing", () => {
    const cart = cartDouble();
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      recordAppointmentIntent(engineDouble, { ec_name: "Dr. Nobody" });
      expect(buildCartSpy).not.toHaveBeenCalled();
      expect(cart.updateItemQuantity).not.toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalledTimes(1);
    } finally {
      errorSpy.mockRestore();
    }
  });

  it("contains a controller failure instead of breaking the caller", () => {
    buildCartSpy.mockImplementation(() => {
      throw new Error("reducer load failed");
    });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      expect(() =>
        recordAppointmentIntent(engineDouble, PROV_1001),
      ).not.toThrow();
      expect(errorSpy).toHaveBeenCalledTimes(1);
    } finally {
      errorSpy.mockRestore();
    }
  });
});

describe("recordAppointmentAbandoned", () => {
  it("sets this provider's line to quantity 0 and calls empty() never", () => {
    const cart = cartDouble([ITEM_1001]);
    recordAppointmentAbandoned(engineDouble, PROV_1001);
    expect(cart.updateItemQuantity).toHaveBeenCalledTimes(1);
    expect(cart.updateItemQuantity).toHaveBeenCalledWith({
      ...ITEM_1001,
      quantity: 0,
    });
    expect(cart.empty).not.toHaveBeenCalled();
  });

  it("never emits a purchase", () => {
    const cart = cartDouble([ITEM_1001]);
    recordAppointmentAbandoned(engineDouble, PROV_1001);
    expect(cart.purchase).not.toHaveBeenCalled();
  });

  it("does nothing when there is no engine or no product id", () => {
    cartDouble([ITEM_1001]);
    recordAppointmentAbandoned(null, PROV_1001);
    recordAppointmentAbandoned(engineDouble, {});
    expect(buildCartSpy).not.toHaveBeenCalled();
  });
});

describe("recordAppointmentSubmitted", () => {
  it("emits with revenue as the JSON number 0 and returns the id it generated", () => {
    cartDouble([ITEM_1001]);
    const id = recordAppointmentSubmitted(engineDouble, PROV_1001);
    expect(emitPurchaseEventStub).toHaveBeenCalledTimes(1);
    const transaction = emitPurchaseEventStub.mock.calls[0][0];
    expect(transaction.revenue).toBe(0);
    expect(typeof transaction.revenue).toBe("number");
    expect(APPOINTMENT_SYNTHETIC_REVENUE).toBe(0);
    expect(transaction.id).toBe(id);
    expect(transaction.id).toMatch(/^SIM-APPT-PROV-1001-/);
  });

  it("loads the cart actions from the engine it was handed", () => {
    cartDouble([ITEM_1001]);
    recordAppointmentSubmitted(engineDouble, PROV_1001);
    expect(loadCartActionsSpy).toHaveBeenCalledWith(engineDouble);
  });

  it("empties the cart only after the event thunk has settled, and never via Cart.purchase", async () => {
    const cart = cartDouble([ITEM_1001]);
    recordAppointmentSubmitted(engineDouble, PROV_1001);

    // Synchronously, the event thunk is the only thing dispatched: were the emptying
    // action dispatched here too, it would reach the store first and the emitted
    // `products` array would be empty.
    expect(
      engineDouble.dispatch.mock.calls.map((call) => call[0].type),
    ).toEqual(["test/emitPurchaseEvent"]);
    expect(purchaseStub).not.toHaveBeenCalled();

    await flush();

    expect(
      engineDouble.dispatch.mock.calls.map((call) => call[0].type),
    ).toEqual(["test/emitPurchaseEvent", "test/purchase"]);
    expect(purchaseStub).toHaveBeenCalledTimes(1);
    // `Cart.purchase` bundles both dispatches and cannot be ordered, so it is unused.
    expect(cart.purchase).not.toHaveBeenCalled();
    expect(cart.empty).not.toHaveBeenCalled();
  });

  it("still empties the cart when the event thunk rejects", async () => {
    cartDouble([ITEM_1001]);
    engineDouble.dispatch.mockImplementation((action: any) =>
      action.type === "test/emitPurchaseEvent"
        ? Promise.reject(new Error("relay unavailable"))
        : action,
    );
    recordAppointmentSubmitted(engineDouble, PROV_1001);
    await flush();
    expect(purchaseStub).toHaveBeenCalledTimes(1);
  });

  it("does not re-add the line when the provider is already in the cart", () => {
    const cart = cartDouble([ITEM_1001]);
    recordAppointmentSubmitted(engineDouble, PROV_1001);
    expect(cart.updateItemQuantity).not.toHaveBeenCalled();
  });

  it("re-adds the provider when the line is gone, so no empty purchase can be emitted", () => {
    const cart = cartDouble([]);
    recordAppointmentSubmitted(engineDouble, PROV_1001);
    expect(cart.updateItemQuantity).toHaveBeenCalledTimes(1);
    expect(cart.updateItemQuantity).toHaveBeenCalledWith(ITEM_1001);
    expect(emitPurchaseEventStub).toHaveBeenCalledTimes(1);
  });

  it("sweeps another provider's line so the purchase stays single-provider", () => {
    const stale = {
      productId: "PROV-1002",
      name: "Dr. James Patel",
      price: 0,
      quantity: 1,
    };
    const cart = cartDouble([stale, ITEM_1001]);
    recordAppointmentSubmitted(engineDouble, PROV_1001);
    expect(cart.updateItemQuantity).toHaveBeenCalledTimes(1);
    expect(cart.updateItemQuantity).toHaveBeenCalledWith({
      ...stale,
      quantity: 0,
    });
  });

  it("generates a different id for each completed attempt", () => {
    cartDouble([ITEM_1001]);
    const first = recordAppointmentSubmitted(engineDouble, PROV_1001);
    cartDouble([ITEM_1001]);
    const second = recordAppointmentSubmitted(engineDouble, PROV_1001);
    expect(first).not.toBe(second);
  });

  it("emits nothing and returns null without an engine or a product id", () => {
    cartDouble([ITEM_1001]);
    expect(recordAppointmentSubmitted(null, PROV_1001)).toBeNull();
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      expect(recordAppointmentSubmitted(engineDouble, {})).toBeNull();
    } finally {
      errorSpy.mockRestore();
    }
    expect(buildCartSpy).not.toHaveBeenCalled();
    expect(emitPurchaseEventStub).not.toHaveBeenCalled();
  });

  it("returns null and does not throw when the dispatch fails", () => {
    cartDouble([ITEM_1001]);
    engineDouble.dispatch.mockImplementation(() => {
      throw new Error("relay unavailable");
    });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      expect(recordAppointmentSubmitted(engineDouble, PROV_1001)).toBeNull();
      expect(errorSpy).toHaveBeenCalledTimes(1);
    } finally {
      errorSpy.mockRestore();
    }
  });
});
