// TEST-ONLY harness. It lives under `__tests__/` so it cannot be mistaken for, or
// accidentally imported by, application code; nothing in `src` outside the Phase 2 test
// files imports it, and it ships in no bundle.
//
// It builds a REAL Commerce engine with `buildCommerceEngine` — the same public entry
// point `src/common/Engine.tsx` uses — and observes what the engine emits through
// `relay.on`, the public listener API of `@coveo/relay`. Nothing here reaches into
// Headless internals: no deep file import, no reducer reconstruction, no state-key symbol.
//
// Why a real engine rather than a hand-rolled store: the engine's middleware chain
// decides WHEN a thunk's payload creator reads Redux state. `renewAccessToken` is
// configured, exactly as the application configures it, which makes the renew-access-token
// middleware await a proactive token check before letting any thunk through — while a
// plain action passes synchronously. A stand-in store without that middleware runs thunks
// synchronously and therefore cannot reproduce the ordering the live browser shows. That
// divergence previously produced a passing test for an `ec.purchase` payload shape that
// was wrong on the wire.
//
// The only stub is `navigator.sendBeacon`, which jsdom does not implement: it records the
// relay's transport calls and returns true, so no request is attempted and no live
// analytics event is generated. Events are captured from the relay listener, which runs
// before the transport, so capture does not depend on the stub.

import {
  buildCart,
  buildCommerceEngine,
  type CartItem,
  type CommerceEngine,
} from "@coveo/headless/commerce";

export interface RecordedEvent {
  /** The Event Protocol type, e.g. `ec.cartAction`. */
  type: string;
  /** The emitted event body, as the relay built it. */
  payload: any;
}

export interface RecordedBeacon {
  url: string;
}

export interface CommerceEngineHarness {
  engine: CommerceEngine;
  /** Every event the engine emitted, in emission order. */
  events: RecordedEvent[];
  /** Events of one Event Protocol type, in emission order. */
  eventsOfType: (type: string) => RecordedEvent[];
  /** The cart lines currently in engine state. */
  items: () => CartItem[];
  /** The relay transport calls the engine made. */
  beacons: () => RecordedBeacon[];
  /** Drains pending microtasks so deferred thunks have emitted. */
  flush: () => Promise<void>;
  /** Restores `navigator.sendBeacon`. */
  restore: () => void;
}

// A deliberately SYNTHETIC, non-JWT token. It is intentionally NOT in the shape of a Coveo
// API key (`xx` + UUID) so it can never be mistaken for, or used as, a real credential.
// `parseJWT` returns null for any non-JWT string, so `shouldRenewJWT` cannot parse
// an expiry out of it, so the proactive renewal never fires a call: the middleware's await
// still happens, which is the behaviour under test, but `renewAccessToken` is never
// invoked and nothing leaves the process.
const TEST_ACCESS_TOKEN = "synthetic-local-test-token-not-a-coveo-credential";

export const createCommerceEngineHarness = (): CommerceEngineHarness => {
  const beacons: RecordedBeacon[] = [];
  const originalSendBeacon = (navigator as any).sendBeacon;
  Object.defineProperty(navigator, "sendBeacon", {
    value: (url: string) => {
      beacons.push({ url: String(url) });
      return true;
    },
    configurable: true,
    writable: true,
  });

  const engine = buildCommerceEngine({
    configuration: {
      organizationId: "testorg",
      accessToken: TEST_ACCESS_TOKEN,
      // Mirrors src/common/Engine.tsx: with a renew function configured, every thunk is
      // deferred by the renew-access-token middleware.
      renewAccessToken: async () => TEST_ACCESS_TOKEN,
      analytics: { trackingId: "healthcare_cpd_demo" },
      context: {
        language: "en",
        country: "US",
        currency: "USD",
        view: { url: "https://example.test/providers/PROV-1001" },
      },
    },
  });

  const events: RecordedEvent[] = [];
  engine.relay.on("*", (event: any) => {
    events.push({ type: event?.meta?.type, payload: event });
  });

  return {
    engine,
    events,
    eventsOfType: (type: string) => events.filter((e) => e.type === type),
    items: () => buildCart(engine).state.items,
    beacons: () => beacons,
    flush: async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    },
    restore: () => {
      Object.defineProperty(navigator, "sendBeacon", {
        value: originalSendBeacon,
        configurable: true,
        writable: true,
      });
    },
  };
};
