import {
  buildCart,
  CartItem,
  CommerceEngine,
  loadCartActions,
} from "@coveo/headless/commerce";
import {
  MPG_PROVIDER_DETAIL_FIELDS,
  MPG_PROVIDER_ID_FIELD,
} from "../../config/MPGConfig";

// Phase 2 appointment analytics. The ONE place a Commerce cart payload is constructed, so
// `productId`, `name` and `price` stay byte-identical across ec.cartAction and ec.purchase
// — and identical to what ProviderDetailPage already sends on ec.productView. That byte
// stability matters because the Cart controller keys a line on
// `${productId},${name},${price}`: a drift in any of the three would create a second cart
// line for the same provider instead of updating the first one.
//
// Semantics of the three events this module can cause, which must not be restated any
// other way anywhere:
//   ec.cartAction add    — appointment request intent (a request was started)
//   ec.cartAction remove — appointment request abandoned before submission
//   ec.purchase          — Simulated Appointment Request Submitted
// None of these is a booked appointment, a completed visit, a real transaction or a paid
// service. Revenue is the JSON number 0 on every transaction, always.

/**
 * The synthetic cart-line price. Numeric 0 is the Event Protocol's documented stand-in for
 * "price not available"; providers have no price. It exists for schema compatibility only
 * and is NEVER rendered in the patient-facing UI.
 */
export const APPOINTMENT_SYNTHETIC_PRICE = 0;

/** Synthetic transaction revenue. Always the JSON number 0: no revenue is generated. */
export const APPOINTMENT_SYNTHETIC_REVENUE = 0;

/** Marks a transaction id as a simulated appointment request rather than a retail order. */
export const APPOINTMENT_TRANSACTION_PREFIX = "SIM-APPT";

/** Quantity of a provider line. One appointment request is one line at quantity 1. */
const APPOINTMENT_QUANTITY = 1;

/**
 * The provider's catalog product id (`ec_product_id`) as a trimmed string, or "" when it is
 * absent, empty or not stringifiable. Single source of the id: no id is ever invented, and
 * none is derived from the route.
 */
export const getAppointmentProductId = (product: any): string => {
  const raw = product?.[MPG_PROVIDER_ID_FIELD];
  if (raw === null || raw === undefined) return "";
  return String(raw).trim();
};

/**
 * A byte-stable cart line for the provider, or `null` when the product carries no usable
 * `ec_product_id`.
 *
 * Returning null matters: the Cart controller dispatches its analytics thunk BEFORE the
 * payload-validated state action, so an item with an empty `productId` would emit an
 * ec.cartAction and then silently fail to update the cart. Validation therefore happens
 * here, before the controller is touched.
 */
export const buildAppointmentCartItem = (product: any): CartItem | null => {
  const productId = getAppointmentProductId(product);
  if (!productId) return null;
  return {
    productId,
    name: String(product?.[MPG_PROVIDER_DETAIL_FIELDS.name] ?? ""),
    price: APPOINTMENT_SYNTHETIC_PRICE,
    quantity: APPOINTMENT_QUANTITY,
  };
};

/**
 * The cart lines that belong to some other provider. The cart is engine-global state, so
 * this is what keeps one appointment attempt from contaminating another provider's
 * ec.purchase.
 */
export const selectStaleAppointmentCartItems = (
  items: CartItem[],
  productId: string,
): CartItem[] =>
  (items ?? []).filter((item) => item && item.productId !== productId);

/** 8 lowercase hex characters, from the CSPRNG when available. */
const randomHex8 = (): string => {
  const webCrypto = (globalThis as any)?.crypto;
  if (webCrypto?.getRandomValues) {
    const bytes = webCrypto.getRandomValues(new Uint8Array(4));
    return Array.from(bytes as Uint8Array)
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }
  // Math.random is not a CSPRNG; it is only a fallback so an id can always be produced.
  // Uniqueness, not unpredictability, is what this segment is for.
  return Math.floor(Math.random() * 0x100000000)
    .toString(16)
    .padStart(8, "0");
};

/**
 * `SIM-APPT-<providerId>-<base36 ms>-<8 hex>`, e.g.
 * `SIM-APPT-PROV-1001-m9x2k3f7-4a1c9e02`.
 *
 * Its only inputs are the catalog provider id, the wall clock and random bytes. It carries
 * no patient information of any kind — and the appointment flow has no free-text input
 * anywhere, so there is none to carry. `nowMs` and `randomPart` are injectable so the
 * format can be asserted deterministically in tests.
 */
export const createAppointmentTransactionId = (
  productId: string,
  nowMs: number = Date.now(),
  randomPart: string = randomHex8(),
): string =>
  `${APPOINTMENT_TRANSACTION_PREFIX}-${productId}-${nowMs.toString(36)}-${randomPart}`;

/** Removes every cart line that is not this provider's. Silent when there are none. */
const sweepStaleItems = (
  cart: ReturnType<typeof buildCart>,
  productId: string,
): void => {
  for (const stale of selectStaleAppointmentCartItems(
    cart.state.items,
    productId,
  )) {
    cart.updateItemQuantity({ ...stale, quantity: 0 });
  }
};

/**
 * Removes every cart line, including this provider's own.
 *
 * Used when a new attempt starts, and the reason start counts are exact. The cart is
 * engine-global and survives the dialog subtree: navigating away with the dialog open
 * runs no close handler, so the provider's line is still there on the next attempt. Were
 * it left in place, `Cart.updateItemQuantity` would see an identical line, return early
 * on its `isEqual` check and emit NOTHING — the second attempt would be invisible.
 * Clearing first turns that interrupted attempt into the `remove` it always was
 * (abandoned before submission) and lets the new attempt emit its own `add`.
 *
 * Silent when the cart is empty, which is the normal case.
 */
const clearCartLines = (cart: ReturnType<typeof buildCart>): void => {
  for (const existing of [...(cart.state.items ?? [])]) {
    cart.updateItemQuantity({ ...existing, quantity: 0 });
  }
};

/**
 * Appointment request intent: one ec.cartAction `add` per intentional new attempt.
 *
 * Called from a click handler only — never during render, never from an effect. A no-op
 * when no engine is available (the context is absent or the engine is still initializing);
 * the dialog opens either way, because the UX must never depend on analytics.
 */
export const recordAppointmentIntent = (
  engine: CommerceEngine | null,
  product: any,
): void => {
  if (!engine) return;
  const item = buildAppointmentCartItem(product);
  if (!item) {
    console.error(
      "Appointment intent not recorded: the provider product carries no " +
        `${MPG_PROVIDER_ID_FIELD}.`,
    );
    return;
  }
  try {
    const cart = buildCart(engine);
    clearCartLines(cart);
    cart.updateItemQuantity(item);
  } catch (error) {
    console.error("Unable to record appointment request intent.", error);
  }
};

/**
 * Appointment request abandoned before submission: one ec.cartAction `remove` for this
 * provider's line.
 *
 * Targeted removal, never `Cart.empty()`: it touches only the line this feature created,
 * and it is silent when the line is already gone — which is what makes closing the dialog
 * after a completed submission a clean no-op, since the submission already emptied the
 * cart (asynchronously, but within a microtask of the submit click, long before any
 * subsequent interaction).
 */
export const recordAppointmentAbandoned = (
  engine: CommerceEngine | null,
  product: any,
): void => {
  if (!engine) return;
  const item = buildAppointmentCartItem(product);
  if (!item) return;
  try {
    buildCart(engine).updateItemQuantity({ ...item, quantity: 0 });
  } catch (error) {
    console.error("Unable to record appointment request abandonment.", error);
  }
};

/**
 * Simulated Appointment Request Submitted: one ec.purchase with revenue 0, carrying exactly
 * one product line — the provider being requested.
 *
 * Returns the transaction id that was generated, or `null` when no event was emitted. The
 * cart is emptied one microtask later, once the event has been built (see below), so the
 * id is available to the caller synchronously while the cart still settles to empty before
 * any further interaction is possible.
 *
 * Invocation is NOT delivery: the relay exposes no delivery result to the dispatcher, so
 * nothing here may be read as proof that an event reached Coveo.
 */
export const recordAppointmentSubmitted = (
  engine: CommerceEngine | null,
  product: any,
): string | null => {
  if (!engine) return null;
  const item = buildAppointmentCartItem(product);
  if (!item) {
    console.error(
      "Simulated appointment submission not recorded: the provider product " +
        `carries no ${MPG_PROVIDER_ID_FIELD}.`,
    );
    return null;
  }
  try {
    const cart = buildCart(engine);
    sweepStaleItems(cart, item.productId);
    // An ec.purchase on an empty cart still goes out, with `products: []`. Re-adding the
    // provider's line when it is missing keeps the event meaningful and preserves the
    // "no purchase without a prior add" invariant. In the designed flow the line is always
    // already present, so this emits nothing.
    const hasLine = cart.state.items.some(
      (existing) => existing.productId === item.productId,
    );
    if (!hasLine) {
      cart.updateItemQuantity(item);
    }
    const id = createAppointmentTransactionId(item.productId);
    // `Cart.purchase` is deliberately NOT used here, and the reason is an ordering trap
    // measured inside a real engine (see __tests__/appointmentCommerceEngineHarness.ts and
    // appointmentAnalytics.engine.test.ts). `Cart.purchase` dispatches the event thunk and
    // then, on the next line, the plain action that empties the cart. Because this
    // application configures `renewAccessToken`, the renew-access-token middleware awaits a
    // proactive token check before any THUNK reaches the store, while a PLAIN action passes
    // through synchronously. So the cart is already empty by the time the thunk reads it,
    // and the emitted `products` array comes out empty — which is exactly what the live
    // capture showed, and what makes a simulated submission unattributable to a provider.
    //
    // `loadCartActions` is the package's public actions loader, and its own documentation
    // prescribes this order: emit first, empty after. Dispatching the two steps separately
    // lets the empty wait until the event thunk has settled, which is the only point at
    // which the payload is provably built. No internal API, no `relay.emit`, no
    // hand-built request.
    const { emitPurchaseEvent, purchase } = loadCartActions(engine);
    const emitted = engine.dispatch(
      emitPurchaseEvent({ id, revenue: APPOINTMENT_SYNTHETIC_REVENUE }),
    );
    const emptyCart = () => {
      engine.dispatch(purchase());
    };
    // `purchase` is a plain action and emits nothing, so this cleanup is analytics-silent:
    // it returns the cart to empty without recording an abandonment. It runs on both
    // settlement paths so a failed emission cannot leave the line behind.
    Promise.resolve(emitted).then(emptyCart, emptyCart);
    return id;
  } catch (error) {
    console.error(
      "Unable to record the simulated appointment request submission.",
      error,
    );
    return null;
  }
};
