// Pure logic for the simulated appointment request flow opened from the provider detail
// page. No React, no engine, no network and no storage dependency, so every rule — which
// locations may be offered, which visit types are eligible, when a step may advance, and
// what a second submit does — is unit testable without rendering anything.
//
// Kept out of providerDetailUtils.ts so the flow's tests do not perturb that module's
// pinned baseline, and so the one place the appointment rules live is easy to find.

import { getAdditionalField } from "../MPG/mpgUtils";
import { MPG_PROVIDER_DETAIL_FIELDS } from "../../config/MPGConfig";

export type AppointmentStep =
  | "location"
  | "visitType"
  | "review"
  | "confirmation";

export type AppointmentVisitTypeKey = "newPatient" | "followUp" | "telehealth";

export interface AppointmentSelection {
  location: string | null;
  visitTypeKey: AppointmentVisitTypeKey | null;
}

export interface AppointmentRequestState {
  step: AppointmentStep;
  selection: AppointmentSelection;
  /** The provider's real locations, captured once when the flow opens. */
  locationOptions: string[];
  /** Always ["newPatient","followUp"], plus "telehealth" only when the strict gate passes. */
  eligibleVisitTypeKeys: AppointmentVisitTypeKey[];
}

export type AppointmentAction =
  | { type: "selectLocation"; location: string }
  | { type: "selectVisitType"; visitTypeKey: AppointmentVisitTypeKey }
  | { type: "next" }
  | { type: "back" }
  | { type: "submit" }
  | { type: "reset" };

export const APPOINTMENT_STEP_ORDER: readonly AppointmentStep[] = [
  "location",
  "visitType",
  "review",
  "confirmation",
];

/**
 * The two visit types every provider is offered. They are demonstration options only and
 * are never read from the index, so nothing here can imply bookable inventory.
 */
export const APPOINTMENT_BASE_VISIT_TYPE_KEYS: readonly AppointmentVisitTypeKey[] =
  ["newPatient", "followUp"];

/**
 * The strict telehealth gate, applied to one raw field value.
 *
 * The requirement is **exact equality with the string "true"**. This deliberately does
 * NOT reuse `coerceBooleanField` from providerDetailUtils: that helper is permissive by
 * design (it accepts boolean `true`, `"TRUE"` and `" true "`), the provider-header
 * telehealth chip depends on that permissiveness, and `providerDetailUtils.test.ts` pins
 * it — so tightening it would change an unrelated feature. This gate therefore carries
 * its own comparison, exactly as `isAcceptingPatientsValue` in newPatientBadgeUtils.ts
 * does, and `coerceBooleanField` is left exactly as it is.
 *
 * It fails closed: anything that is not the literal string "true" withholds the
 * Telehealth Visit option, so a schema change in the index can never make the demo offer
 * a modality the provider has not been recorded as supporting.
 *
 * A single-element array is unwrapped once. The live field is a scalar string for all 10
 * providers, but a future multi-value field mapping in the Merchandising Hub would
 * otherwise withhold the option for every provider rather than failing visibly.
 */
export const isTelehealthEligibleValue = (raw: any): boolean => {
  const value = Array.isArray(raw) && raw.length === 1 ? raw[0] : raw;
  return value === "true";
};

/**
 * Whether a Commerce product may be offered the Telehealth visit type. Reads exactly one
 * field, `product.additionalFields[fieldName]`, and nothing else: the modality is never
 * inferred from specialty, location or any other attribute.
 */
export const isTelehealthEligible = (
  product: any,
  fieldName: string = MPG_PROVIDER_DETAIL_FIELDS.telehealth,
): boolean => isTelehealthEligibleValue(product?.additionalFields?.[fieldName]);

/**
 * The provider's real locations, read through `getAdditionalField` so the field is never
 * re-parsed, split or defaulted here. Returns [] for an absent / null / "" / [] field,
 * which is the one and only trigger for the unavailable state. No location is ever
 * invented or inferred on a provider's behalf.
 */
export const getAppointmentLocationOptions = (
  product: any,
  fieldName: string = MPG_PROVIDER_DETAIL_FIELDS.locations,
): string[] => getAdditionalField(product, fieldName);

/** ["newPatient","followUp"] always, plus "telehealth" iff the strict gate passes. */
export const getEligibleVisitTypeKeys = (
  product: any,
  telehealthFieldName: string = MPG_PROVIDER_DETAIL_FIELDS.telehealth,
): AppointmentVisitTypeKey[] =>
  isTelehealthEligible(product, telehealthFieldName)
    ? [...APPOINTMENT_BASE_VISIT_TYPE_KEYS, "telehealth"]
    : [...APPOINTMENT_BASE_VISIT_TYPE_KEYS];

/** A clean request: step "location", both selections null. Called once per open. */
export const createAppointmentRequestState = (
  locationOptions: string[],
  eligibleVisitTypeKeys: AppointmentVisitTypeKey[],
): AppointmentRequestState => ({
  step: "location",
  selection: { location: null, visitTypeKey: null },
  locationOptions: Array.isArray(locationOptions) ? locationOptions : [],
  eligibleVisitTypeKeys: Array.isArray(eligibleVisitTypeKeys)
    ? eligibleVisitTypeKeys
    : [],
});

/** True when the selected location is present and is one of the provider's own. */
const hasValidLocation = (state: AppointmentRequestState) =>
  state.selection.location !== null &&
  state.locationOptions.indexOf(state.selection.location) !== -1;

/** True when the selected visit type is present and eligible for this provider. */
const hasValidVisitType = (state: AppointmentRequestState) =>
  state.selection.visitTypeKey !== null &&
  state.eligibleVisitTypeKeys.indexOf(state.selection.visitTypeKey) !== -1;

/** Whether the current step's required selection is present and valid. */
export const canAdvanceFromStep = (state: AppointmentRequestState): boolean => {
  if (state.step === "location") return hasValidLocation(state);
  if (state.step === "visitType") return hasValidVisitType(state);
  return false;
};

/** Whether the review step may be submitted: both selections present and both valid. */
export const canSubmitAppointmentRequest = (
  state: AppointmentRequestState,
): boolean =>
  state.step === "review" &&
  hasValidLocation(state) &&
  hasValidVisitType(state);

/** 0-based index of a step in APPOINTMENT_STEP_ORDER; -1 for an unknown step. */
export const getAppointmentStepIndex = (step: AppointmentStep): number =>
  APPOINTMENT_STEP_ORDER.indexOf(step);

/**
 * Pure reducer, directly usable with useReducer. Every blocked or invalid action returns
 * the SAME state object, so React bails out of the re-render: that is what makes a second
 * submit, a double click and an Enter key-repeat all no-ops rather than a second request.
 */
export const appointmentRequestReducer = (
  state: AppointmentRequestState,
  action: AppointmentAction,
): AppointmentRequestState => {
  switch (action.type) {
    case "selectLocation": {
      if (state.step !== "location") return state;
      if (state.locationOptions.indexOf(action.location) === -1) return state;
      if (state.selection.location === action.location) return state;
      return {
        ...state,
        selection: { ...state.selection, location: action.location },
      };
    }
    case "selectVisitType": {
      if (state.step !== "visitType") return state;
      if (state.eligibleVisitTypeKeys.indexOf(action.visitTypeKey) === -1)
        return state;
      if (state.selection.visitTypeKey === action.visitTypeKey) return state;
      return {
        ...state,
        selection: { ...state.selection, visitTypeKey: action.visitTypeKey },
      };
    }
    case "next": {
      if (!canAdvanceFromStep(state)) return state;
      // Selections are carried forward untouched, so step 3 always reads the live choice.
      return {
        ...state,
        step: state.step === "location" ? "visitType" : "review",
      };
    }
    case "back": {
      if (state.step === "visitType") return { ...state, step: "location" };
      if (state.step === "review") return { ...state, step: "visitType" };
      return state;
    }
    case "submit": {
      if (!canSubmitAppointmentRequest(state)) return state;
      return { ...state, step: "confirmation" };
    }
    case "reset":
      return createAppointmentRequestState(
        state.locationOptions,
        state.eligibleVisitTypeKeys,
      );
    default:
      return state;
  }
};
