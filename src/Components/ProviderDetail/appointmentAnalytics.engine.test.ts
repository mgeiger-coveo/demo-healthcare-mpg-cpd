// Phase 2 emitted-payload gates, measured inside a REAL Commerce engine.
//
// Everything here runs against `buildCommerceEngine` with the same public entry point and
// the same `renewAccessToken` configuration the application uses, and reads the events off
// the engine's own relay listener. That is what makes these assertions evidence about what
// goes on the wire rather than a record of which methods we called — which is asserted
// separately, against mocks, in `appointmentAnalytics.test.ts`.
//
// No network and no live event: the relay's transport (`navigator.sendBeacon`) is replaced
// by a recorder in the harness, and the engine is configured with a throwaway
// organization, a throwaway tracking id and a token that is never sent anywhere.
//
// Emission is asynchronous in a real engine: the renew-access-token middleware awaits a
// proactive token check before any thunk reaches the store, so every assertion is made
// after `harness.flush()`.

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  buildCart,
  loadCartActions,
  type CartItem,
} from "@coveo/headless/commerce";
import {
  createCommerceEngineHarness,
  type CommerceEngineHarness,
} from "./__tests__/appointmentCommerceEngineHarness";
import {
  recordAppointmentAbandoned,
  recordAppointmentIntent,
  recordAppointmentSubmitted,
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

const ITEM_1001: CartItem = {
  productId: "PROV-1001",
  name: "Dr. Sarah Mitchell",
  price: 0,
  quantity: 1,
};

let harness: CommerceEngineHarness;

beforeEach(() => {
  harness = createCommerceEngineHarness();
});

afterEach(() => {
  harness.restore();
});

const actions = () =>
  harness.eventsOfType("ec.cartAction").map((event) => event.payload.action);

describe("appointment request intent, as the engine emits it", () => {
  it("emits exactly one ec.cartAction add carrying the provider at price 0", async () => {
    recordAppointmentIntent(harness.engine, PROV_1001);
    await harness.flush();

    expect(harness.events.map((event) => event.type)).toEqual([
      "ec.cartAction",
    ]);
    const payload = harness.events[0].payload;
    expect(payload.action).toBe("add");
    expect(payload.quantity).toBe(1);
    expect(payload.product).toEqual({
      productId: "PROV-1001",
      name: "Dr. Sarah Mitchell",
      price: 0,
    });
    expect(typeof payload.product.price).toBe("number");
  });

  it("emits one add per attempt even when the previous attempt's line was never removed", async () => {
    // The undercount path: navigation unmounts the dialog without running a close
    // handler, so the provider's own line survives. The open-time clear turns it into the
    // abandonment it was, and the new attempt still emits its own add.
    recordAppointmentIntent(harness.engine, PROV_1001);
    recordAppointmentIntent(harness.engine, PROV_1001);
    recordAppointmentIntent(harness.engine, PROV_1001);
    await harness.flush();

    expect(actions()).toEqual(["add", "remove", "add", "remove", "add"]);
    expect(harness.items().map((item) => item.productId)).toEqual([
      "PROV-1001",
    ]);
  });

  it("emits one remove on abandonment, and stays silent on a second one", async () => {
    recordAppointmentIntent(harness.engine, PROV_1001);
    recordAppointmentAbandoned(harness.engine, PROV_1001);
    recordAppointmentAbandoned(harness.engine, PROV_1001);
    await harness.flush();

    expect(actions()).toEqual(["add", "remove"]);
    expect(harness.eventsOfType("ec.purchase")).toHaveLength(0);
    expect(harness.items()).toHaveLength(0);
  });

  it("records a reopened attempt after abandonment as a second add", async () => {
    recordAppointmentIntent(harness.engine, PROV_1001);
    recordAppointmentAbandoned(harness.engine, PROV_1001);
    recordAppointmentIntent(harness.engine, PROV_1001);
    await harness.flush();

    expect(actions()).toEqual(["add", "remove", "add"]);
  });

  it("removes the previous provider's line when a new provider's attempt starts", async () => {
    recordAppointmentIntent(harness.engine, PROV_1001);
    recordAppointmentIntent(harness.engine, PROV_1002);
    await harness.flush();

    expect(
      harness
        .eventsOfType("ec.cartAction")
        .map((event) => [
          event.payload.action,
          event.payload.product.productId,
        ]),
    ).toEqual([
      ["add", "PROV-1001"],
      ["remove", "PROV-1001"],
      ["add", "PROV-1002"],
    ]);
    expect(harness.items().map((item) => item.productId)).toEqual([
      "PROV-1002",
    ]);
  });
});

describe("simulated appointment submission, as the engine emits it", () => {
  it("emits an ec.purchase whose products array is non-empty and carries the provider", async () => {
    recordAppointmentIntent(harness.engine, PROV_1001);
    const id = recordAppointmentSubmitted(harness.engine, PROV_1001);
    await harness.flush();

    const purchases = harness.eventsOfType("ec.purchase");
    expect(purchases).toHaveLength(1);
    const payload = purchases[0].payload;
    expect(payload.products.length).toBeGreaterThan(0);
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
    expect(payload.transaction).toEqual({ id, revenue: 0 });
    expect(typeof payload.transaction.revenue).toBe("number");
    expect(payload.currency).toBe("USD");
    // The submission returns the cart to empty, which is what makes a later close a no-op.
    expect(harness.items()).toHaveLength(0);
  });

  it("never emits a purchase with an empty products array, even on an emptied cart", async () => {
    recordAppointmentIntent(harness.engine, PROV_1001);
    recordAppointmentAbandoned(harness.engine, PROV_1001);
    await harness.flush();
    expect(harness.items()).toHaveLength(0);

    recordAppointmentSubmitted(harness.engine, PROV_1001);
    await harness.flush();

    const purchases = harness.eventsOfType("ec.purchase");
    expect(purchases).toHaveLength(1);
    expect(purchases[0].payload.products).toHaveLength(1);
    expect(purchases[0].payload.products[0].product.productId).toBe(
      "PROV-1001",
    );
    // The guard's re-add is a truthful add, so the purchase still follows an add.
    expect(actions()).toEqual(["add", "remove", "add"]);
  });

  it("keeps a purchase single-provider when another provider's line is stale", async () => {
    recordAppointmentIntent(harness.engine, PROV_1002);
    recordAppointmentSubmitted(harness.engine, PROV_1001);
    await harness.flush();

    const payload = harness.eventsOfType("ec.purchase")[0].payload;
    expect(payload.products).toHaveLength(1);
    expect(payload.products[0].product.productId).toBe("PROV-1001");
  });

  it("emits a single ec.purchase per submission, with no cart removal of its own", async () => {
    recordAppointmentIntent(harness.engine, PROV_1001);
    recordAppointmentSubmitted(harness.engine, PROV_1001);
    await harness.flush();
    // Closing the dialog after a completed submission: the line is already gone.
    recordAppointmentAbandoned(harness.engine, PROV_1001);
    await harness.flush();

    expect(harness.events.map((event) => event.type)).toEqual([
      "ec.cartAction",
      "ec.purchase",
    ]);
  });

  it("hands every emitted event to the relay transport, and nothing else", async () => {
    recordAppointmentIntent(harness.engine, PROV_1001);
    recordAppointmentSubmitted(harness.engine, PROV_1001);
    await harness.flush();

    expect(harness.beacons()).toHaveLength(harness.events.length);
    for (const beacon of harness.beacons()) {
      expect(beacon.url).toContain("/events/v1");
    }
  });
});

describe("why Cart.purchase is not used (the ordering trap this engine reproduces)", () => {
  it("Cart.purchase emits products: [] because the emptying action overtakes the event thunk", async () => {
    const cart = buildCart(harness.engine);
    cart.updateItemQuantity(ITEM_1001);
    cart.purchase({ id: "ORDERING-PROBE", revenue: 0 });
    await harness.flush();

    const payload = harness.eventsOfType("ec.purchase")[0].payload;
    expect(payload.products).toEqual([]);
  });

  it("dispatching the emit first and emptying after it settles carries the provider", async () => {
    const cart = buildCart(harness.engine);
    cart.updateItemQuantity(ITEM_1001);
    const { emitPurchaseEvent, purchase } = loadCartActions(harness.engine);
    await harness.engine.dispatch(
      emitPurchaseEvent({ id: "ORDERING-PROBE", revenue: 0 }),
    );
    harness.engine.dispatch(purchase());
    await harness.flush();

    const payload = harness.eventsOfType("ec.purchase")[0].payload;
    expect(payload.products).toHaveLength(1);
    expect(payload.products[0].product.productId).toBe("PROV-1001");
    expect(harness.items()).toHaveLength(0);
  });
});
