import { describe, it, expect } from "vitest";
import {
  APPOINTMENT_STEP_ORDER,
  AppointmentRequestState,
  appointmentRequestReducer,
  canAdvanceFromStep,
  canSubmitAppointmentRequest,
  createAppointmentRequestState,
  getAppointmentLocationOptions,
  getAppointmentStepIndex,
  getEligibleVisitTypeKeys,
  isTelehealthEligible,
  isTelehealthEligibleValue,
} from "./appointmentRequestUtils";

// Shapes below are the ones actually observed in the catalog: `hc_locations` is always a
// JSON array of strings (length 1 or 2) and `hc_telehealth` is always the scalar string
// "true" or "false".
const PROV_1001 = {
  ec_product_id: "PROV-1001",
  ec_name: "Dr. Sarah Mitchell",
  additionalFields: {
    hc_locations: ["Downtown Medical Center", "Northside Clinic"],
    hc_telehealth: "true",
    hc_specialties: ["Cardiology", "Preventive Cardiology"],
  },
};

const PROV_1002 = {
  ec_product_id: "PROV-1002",
  ec_name: "Dr. James Carter",
  additionalFields: {
    hc_locations: ["Downtown Medical Center", "Westside Specialty Center"],
    hc_telehealth: "false",
  },
};

const PROV_1009 = {
  ec_product_id: "PROV-1009",
  ec_name: "Dr. Maya Patel",
  additionalFields: {
    hc_locations: ["Westside Specialty Center"],
    hc_telehealth: "true",
  },
};

const stateAt = (
  step: AppointmentRequestState["step"],
  overrides: Partial<AppointmentRequestState> = {},
): AppointmentRequestState => ({
  ...createAppointmentRequestState(
    ["Downtown Medical Center", "Northside Clinic"],
    ["newPatient", "followUp", "telehealth"],
  ),
  step,
  ...overrides,
});

// Test 3 (logic) — location options are derived from the provider's real metadata.
describe("getAppointmentLocationOptions (test 3)", () => {
  it("returns the provider's two real locations in order", () => {
    expect(getAppointmentLocationOptions(PROV_1001)).toEqual([
      "Downtown Medical Center",
      "Northside Clinic",
    ]);
  });

  it("returns the single real location for a one-location provider", () => {
    expect(getAppointmentLocationOptions(PROV_1009)).toEqual([
      "Westside Specialty Center",
    ]);
  });

  it("reads the injected field name rather than a hardcoded one", () => {
    const product = { additionalFields: { custom_locations: ["Elsewhere"] } };
    expect(getAppointmentLocationOptions(product, "custom_locations")).toEqual([
      "Elsewhere",
    ]);
  });
});

// Test 4 (logic) — absent location metadata yields no options, never an invented one.
describe("getAppointmentLocationOptions with absent metadata (test 4)", () => {
  it("returns [] for undefined, null, empty string and empty array", () => {
    expect(getAppointmentLocationOptions({ additionalFields: {} })).toEqual([]);
    expect(
      getAppointmentLocationOptions({
        additionalFields: { hc_locations: null },
      }),
    ).toEqual([]);
    expect(
      getAppointmentLocationOptions({ additionalFields: { hc_locations: "" } }),
    ).toEqual([]);
    expect(
      getAppointmentLocationOptions({ additionalFields: { hc_locations: [] } }),
    ).toEqual([]);
  });

  it("returns [] when the product has no additionalFields at all", () => {
    expect(getAppointmentLocationOptions({})).toEqual([]);
    expect(getAppointmentLocationOptions(null)).toEqual([]);
    expect(getAppointmentLocationOptions(undefined)).toEqual([]);
  });

  it("invents nothing: the empty result has no placeholder entry", () => {
    const options = getAppointmentLocationOptions({ additionalFields: {} });
    expect(options).toHaveLength(0);
    expect(options.join("")).toBe("");
  });
});

// Test 5 — the strict telehealth gate. Each permissive look-alike is its own named
// assertion so a regression names itself.
describe("isTelehealthEligibleValue (test 5)", () => {
  it('is true for the exact string "true"', () => {
    expect(isTelehealthEligibleValue("true")).toBe(true);
  });

  it('is true for a single-element array ["true"]', () => {
    expect(isTelehealthEligibleValue(["true"])).toBe(true);
  });

  it('is false for "false"', () => {
    expect(isTelehealthEligibleValue("false")).toBe(false);
  });

  it('is false for "TRUE" — case folding must NOT enable telehealth', () => {
    expect(isTelehealthEligibleValue("TRUE")).toBe(false);
  });

  it('is false for " true " — trimming must NOT enable telehealth', () => {
    expect(isTelehealthEligibleValue(" true ")).toBe(false);
  });

  it("is false for boolean true", () => {
    expect(isTelehealthEligibleValue(true)).toBe(false);
  });

  it("is false for undefined", () => {
    expect(isTelehealthEligibleValue(undefined)).toBe(false);
  });

  it("is false for null", () => {
    expect(isTelehealthEligibleValue(null)).toBe(false);
  });

  it("is false for an empty array", () => {
    expect(isTelehealthEligibleValue([])).toBe(false);
  });

  it("is false for a multi-element array, which is not unwrapped", () => {
    expect(isTelehealthEligibleValue(["true", "false"])).toBe(false);
  });

  it("is false for numeric and object look-alikes", () => {
    expect(isTelehealthEligibleValue(0)).toBe(false);
    expect(isTelehealthEligibleValue(1)).toBe(false);
    expect(isTelehealthEligibleValue("1")).toBe(false);
    expect(isTelehealthEligibleValue({})).toBe(false);
  });

  it("reads exactly one field off the product", () => {
    expect(isTelehealthEligible(PROV_1001)).toBe(true);
    expect(isTelehealthEligible(PROV_1002)).toBe(false);
    expect(isTelehealthEligible({})).toBe(false);
  });
});

// Test 6 (logic) — the eligible visit-type list.
describe("getEligibleVisitTypeKeys (test 6)", () => {
  it("offers all three options when the strict gate passes", () => {
    expect(getEligibleVisitTypeKeys(PROV_1001)).toEqual([
      "newPatient",
      "followUp",
      "telehealth",
    ]);
  });

  it('withholds telehealth for a provider whose field is "false"', () => {
    expect(getEligibleVisitTypeKeys(PROV_1002)).toEqual([
      "newPatient",
      "followUp",
    ]);
  });

  it("withholds telehealth for every permissive look-alike", () => {
    for (const raw of ["TRUE", " true ", true, undefined, null, [], 1]) {
      expect(
        getEligibleVisitTypeKeys({ additionalFields: { hc_telehealth: raw } }),
      ).toEqual(["newPatient", "followUp"]);
    }
  });
});

// Test 7 (logic) — required-field validation blocks progression and submission.
describe("validation guards (test 7)", () => {
  it("blocks step 1 until a location is chosen", () => {
    expect(canAdvanceFromStep(stateAt("location"))).toBe(false);
    expect(
      canAdvanceFromStep(
        stateAt("location", {
          selection: { location: "Northside Clinic", visitTypeKey: null },
        }),
      ),
    ).toBe(true);
  });

  it("blocks a location that is not one of the provider's own", () => {
    expect(
      canAdvanceFromStep(
        stateAt("location", {
          selection: { location: "Invented Clinic", visitTypeKey: null },
        }),
      ),
    ).toBe(false);
  });

  it("blocks step 2 until an eligible visit type is chosen", () => {
    expect(canAdvanceFromStep(stateAt("visitType"))).toBe(false);
    expect(
      canAdvanceFromStep(
        stateAt("visitType", {
          selection: { location: "Northside Clinic", visitTypeKey: "followUp" },
        }),
      ),
    ).toBe(true);
  });

  it("blocks an ineligible visit type", () => {
    expect(
      canAdvanceFromStep(
        stateAt("visitType", {
          eligibleVisitTypeKeys: ["newPatient", "followUp"],
          selection: {
            location: "Northside Clinic",
            visitTypeKey: "telehealth",
          },
        }),
      ),
    ).toBe(false);
  });

  it("blocks submission unless both selections are present and valid", () => {
    expect(canSubmitAppointmentRequest(stateAt("review"))).toBe(false);
    expect(
      canSubmitAppointmentRequest(
        stateAt("review", {
          selection: { location: "Northside Clinic", visitTypeKey: null },
        }),
      ),
    ).toBe(false);
    expect(
      canSubmitAppointmentRequest(
        stateAt("review", {
          selection: { location: null, visitTypeKey: "followUp" },
        }),
      ),
    ).toBe(false);
    expect(
      canSubmitAppointmentRequest(
        stateAt("review", {
          selection: {
            location: "Northside Clinic",
            visitTypeKey: "telehealth",
          },
        }),
      ),
    ).toBe(true);
  });

  it("returns the identical state object when `next` is blocked", () => {
    const blocked = stateAt("location");
    expect(appointmentRequestReducer(blocked, { type: "next" })).toBe(blocked);
  });

  it("ignores a selection that is not an offered option", () => {
    const start = stateAt("location");
    expect(
      appointmentRequestReducer(start, {
        type: "selectLocation",
        location: "Invented Clinic",
      }),
    ).toBe(start);
  });
});

// Test 8 (logic) — Back preserves the selections already made.
describe("back preserves selections (test 8)", () => {
  it("keeps the location when stepping back from visit type", () => {
    let state = stateAt("location");
    state = appointmentRequestReducer(state, {
      type: "selectLocation",
      location: "Northside Clinic",
    });
    state = appointmentRequestReducer(state, { type: "next" });
    expect(state.step).toBe("visitType");
    state = appointmentRequestReducer(state, { type: "back" });
    expect(state.step).toBe("location");
    expect(state.selection.location).toBe("Northside Clinic");
  });

  it("keeps both selections when stepping back from review", () => {
    let state = stateAt("review", {
      selection: { location: "Northside Clinic", visitTypeKey: "telehealth" },
    });
    state = appointmentRequestReducer(state, { type: "back" });
    expect(state.step).toBe("visitType");
    expect(state.selection).toEqual({
      location: "Northside Clinic",
      visitTypeKey: "telehealth",
    });
  });

  it("is a no-op at the first step and at the confirmation", () => {
    const first = stateAt("location");
    expect(appointmentRequestReducer(first, { type: "back" })).toBe(first);
    const done = stateAt("confirmation");
    expect(appointmentRequestReducer(done, { type: "back" })).toBe(done);
  });
});

// Test 9 (logic) — the review reads the live selection, so a change is reflected.
describe("changing a selection updates the request (test 9)", () => {
  it("carries the newly chosen location forward to the review", () => {
    let state = stateAt("location");
    state = appointmentRequestReducer(state, {
      type: "selectLocation",
      location: "Downtown Medical Center",
    });
    state = appointmentRequestReducer(state, { type: "next" });
    state = appointmentRequestReducer(state, {
      type: "selectVisitType",
      visitTypeKey: "newPatient",
    });
    state = appointmentRequestReducer(state, { type: "next" });
    expect(state.step).toBe("review");

    state = appointmentRequestReducer(state, { type: "back" });
    state = appointmentRequestReducer(state, { type: "back" });
    state = appointmentRequestReducer(state, {
      type: "selectLocation",
      location: "Northside Clinic",
    });
    state = appointmentRequestReducer(state, { type: "next" });
    state = appointmentRequestReducer(state, { type: "next" });

    expect(state.step).toBe("review");
    expect(state.selection).toEqual({
      location: "Northside Clinic",
      visitTypeKey: "newPatient",
    });
  });
});

// Test 12 (logic) — a second submit cannot produce a second request.
describe("no duplicate submissions (test 12)", () => {
  it("advances to the confirmation on the first submit only", () => {
    const review = stateAt("review", {
      selection: { location: "Northside Clinic", visitTypeKey: "followUp" },
    });
    const confirmed = appointmentRequestReducer(review, { type: "submit" });
    expect(confirmed.step).toBe("confirmation");
    expect(appointmentRequestReducer(confirmed, { type: "submit" })).toBe(
      confirmed,
    );
    expect(appointmentRequestReducer(confirmed, { type: "submit" })).toBe(
      confirmed,
    );
  });

  it("refuses a submit from any step other than review", () => {
    for (const step of ["location", "visitType"] as const) {
      const state = stateAt(step, {
        selection: { location: "Northside Clinic", visitTypeKey: "followUp" },
      });
      expect(appointmentRequestReducer(state, { type: "submit" })).toBe(state);
    }
  });
});

describe("state shape and step order", () => {
  it("starts clean, at the location step with nothing selected", () => {
    const state = createAppointmentRequestState(["A"], ["newPatient"]);
    expect(state.step).toBe("location");
    expect(state.selection).toEqual({ location: null, visitTypeKey: null });
  });

  it("orders the four steps and indexes them", () => {
    expect(APPOINTMENT_STEP_ORDER).toEqual([
      "location",
      "visitType",
      "review",
      "confirmation",
    ]);
    expect(getAppointmentStepIndex("location")).toBe(0);
    expect(getAppointmentStepIndex("confirmation")).toBe(3);
    expect(getAppointmentStepIndex("nope" as any)).toBe(-1);
  });

  it("resets back to a clean request while keeping the provider's options", () => {
    const state = stateAt("review", {
      selection: { location: "Northside Clinic", visitTypeKey: "followUp" },
    });
    const reset = appointmentRequestReducer(state, { type: "reset" });
    expect(reset.step).toBe("location");
    expect(reset.selection).toEqual({ location: null, visitTypeKey: null });
    expect(reset.locationOptions).toEqual(state.locationOptions);
    expect(reset.eligibleVisitTypeKeys).toEqual(state.eligibleVisitTypeKeys);
  });
});
