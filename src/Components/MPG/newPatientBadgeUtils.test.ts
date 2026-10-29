import { describe, it, expect } from "vitest";
import {
  getNewPatientBadgeStyle,
  isAcceptingNewPatients,
  isAcceptingPatientsValue,
  selectNewPatientBadgeVariant,
} from "./newPatientBadgeUtils";
import { MPG_ACCEPTING_PATIENTS_FIELD } from "../../config/MPGConfig";

const accepting = {
  ec_product_id: "PROV-1001",
  ec_name: "Dr. Sarah Mitchell",
  additionalFields: { hc_accepting_patients: "true", hc_telehealth: "true" },
};

const notAccepting = {
  ec_product_id: "PROV-1004",
  ec_name: "Dr. Michael Nguyen",
  additionalFields: { hc_accepting_patients: "false", hc_telehealth: "true" },
};

// The live index has no provider missing the field, so this shape only exists in tests
// and in the routed browser stub.
const fieldAbsent = {
  ec_product_id: "PROV-9999",
  ec_name: "Dr. Nobody",
  additionalFields: { hc_telehealth: "true" },
};

describe("isAcceptingPatientsValue", () => {
  it("is true only for the exact string true", () => {
    expect(isAcceptingPatientsValue("true")).toBe(true);
  });

  it("is false for the string false", () => {
    expect(isAcceptingPatientsValue("false")).toBe(false);
  });

  it("is false for missing values", () => {
    expect(isAcceptingPatientsValue(undefined)).toBe(false);
    expect(isAcceptingPatientsValue(null)).toBe(false);
    expect(isAcceptingPatientsValue("")).toBe(false);
  });

  // Strictness is the requirement: unlike coerceBooleanField, none of these pass.
  it("fails closed for permissive look-alikes", () => {
    expect(isAcceptingPatientsValue("TRUE")).toBe(false);
    expect(isAcceptingPatientsValue(" true ")).toBe(false);
    expect(isAcceptingPatientsValue(true)).toBe(false);
    expect(isAcceptingPatientsValue(1)).toBe(false);
    expect(isAcceptingPatientsValue("yes")).toBe(false);
  });

  it("unwraps a single-element array once", () => {
    expect(isAcceptingPatientsValue(["true"])).toBe(true);
    expect(isAcceptingPatientsValue(["false"])).toBe(false);
    expect(isAcceptingPatientsValue(["true", "false"])).toBe(false);
    expect(isAcceptingPatientsValue([])).toBe(false);
  });
});

describe("isAcceptingNewPatients", () => {
  it('shows for a product whose field is "true"', () => {
    expect(isAcceptingNewPatients(accepting)).toBe(true);
  });

  it('hides for a product whose field is "false"', () => {
    expect(isAcceptingNewPatients(notAccepting)).toBe(false);
  });

  it("hides when the field is absent", () => {
    expect(isAcceptingNewPatients(fieldAbsent)).toBe(false);
  });

  it("hides for a product with no additionalFields at all", () => {
    expect(isAcceptingNewPatients({ ec_name: "Dr. Nobody" })).toBe(false);
    expect(isAcceptingNewPatients(null)).toBe(false);
    expect(isAcceptingNewPatients(undefined)).toBe(false);
  });

  it("reads only the configured field", () => {
    expect(MPG_ACCEPTING_PATIENTS_FIELD).toBe("hc_accepting_patients");
    // A true-looking value on any other field must not show the badge.
    expect(
      isAcceptingNewPatients({
        additionalFields: { hc_telehealth: "true", hc_provider_status: "true" },
      }),
    ).toBe(false);
  });

  it("honours an explicit field name", () => {
    expect(
      isAcceptingNewPatients(
        { additionalFields: { other_field: "true" } },
        "other_field",
      ),
    ).toBe(true);
  });
});

describe("selectNewPatientBadgeVariant", () => {
  it("maps grid to compact", () => {
    expect(selectNewPatientBadgeVariant("grid")).toBe("compact");
  });

  it("maps list to standard", () => {
    expect(selectNewPatientBadgeVariant("list")).toBe("standard");
  });

  it("defaults to standard for an undefined view mode", () => {
    expect(selectNewPatientBadgeVariant(undefined)).toBe("standard");
  });
});

describe("getNewPatientBadgeStyle", () => {
  it("scales the icon and the label up from compact to prominent", () => {
    const compact = getNewPatientBadgeStyle("compact");
    const standard = getNewPatientBadgeStyle("standard");
    const prominent = getNewPatientBadgeStyle("prominent");

    expect(compact.iconCircle).toBeLessThan(standard.iconCircle);
    expect(standard.iconCircle).toBeLessThan(prominent.iconCircle);
    expect(compact.labelFontSize).toBeLessThan(standard.labelFontSize);
    expect(standard.labelFontSize).toBeLessThan(prominent.labelFontSize);
  });

  it("only lets the compact label wrap", () => {
    expect(getNewPatientBadgeStyle("compact").wrapLabel).toBe(true);
    expect(getNewPatientBadgeStyle("standard").wrapLabel).toBe(false);
    expect(getNewPatientBadgeStyle("prominent").wrapLabel).toBe(false);
  });

  it("keeps the badge smaller than the provider name it sits beside", () => {
    // subtitle1 on a card is 16px; the card variants must not compete with it.
    expect(getNewPatientBadgeStyle("compact").labelFontSize).toBeLessThan(16);
    expect(getNewPatientBadgeStyle("standard").labelFontSize).toBeLessThan(16);
  });

  it("falls back to the standard descriptor for an unknown variant", () => {
    expect(getNewPatientBadgeStyle("solid" as any)).toEqual(
      getNewPatientBadgeStyle("standard"),
    );
  });
});
