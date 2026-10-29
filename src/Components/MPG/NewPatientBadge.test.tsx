import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import NewPatientBadge from "./NewPatientBadge";
import { LanguageContext } from "../Internationalization/LanguageUtils";
import {
  getNewPatientBadgeStyle,
  NewPatientBadgeVariant,
} from "./newPatientBadgeUtils";
import { MPG_NEW_PATIENT_BADGE_LABEL } from "../../config/MPGConfig";

// LanguageContext has no default getText (its default value is `{}`), so the provider is
// required. Returning the default text mirrors InternationalizationEnabled === false.
const render = (element: any) =>
  renderToStaticMarkup(
    <LanguageContext.Provider value={{ getText: (text: string) => text }}>
      {element}
    </LanguageContext.Provider>,
  );

const productWith = (value?: string) => ({
  ec_product_id: "PROV-1001",
  ec_name: "Dr. Sarah Mitchell",
  additionalFields:
    value === undefined
      ? { hc_telehealth: "true" }
      : { hc_accepting_patients: value, hc_telehealth: "true" },
});

describe("NewPatientBadge visibility", () => {
  it('renders the label when the field is "true"', () => {
    const markup = render(<NewPatientBadge acceptingPatients="true" />);
    expect(markup).toContain(MPG_NEW_PATIENT_BADGE_LABEL);
    expect(markup).toContain('data-testid="new-patient-badge"');
  });

  it('renders nothing when the field is "false"', () => {
    expect(render(<NewPatientBadge acceptingPatients="false" />)).toBe("");
  });

  it("renders nothing when the field is missing", () => {
    expect(render(<NewPatientBadge />)).toBe("");
    expect(render(<NewPatientBadge acceptingPatients={null} />)).toBe("");
  });

  it("reads the product's additionalFields when given a product", () => {
    expect(render(<NewPatientBadge product={productWith("true")} />)).toContain(
      MPG_NEW_PATIENT_BADGE_LABEL,
    );
    expect(render(<NewPatientBadge product={productWith("false")} />)).toBe("");
    expect(render(<NewPatientBadge product={productWith()} />)).toBe("");
  });

  it("stays strict: permissive look-alikes render nothing", () => {
    expect(render(<NewPatientBadge acceptingPatients="TRUE" />)).toBe("");
    expect(
      render(<NewPatientBadge acceptingPatients={" true " as any} />),
    ).toBe("");
    expect(render(<NewPatientBadge acceptingPatients={true as any} />)).toBe(
      "",
    );
  });
});

describe("NewPatientBadge variants", () => {
  const variants: NewPatientBadgeVariant[] = [
    "compact",
    "standard",
    "prominent",
  ];

  variants.forEach((variant) => {
    it(`renders the ${variant} variant with its own marker and label`, () => {
      const markup = render(
        <NewPatientBadge acceptingPatients="true" variant={variant} />,
      );
      expect(markup).toContain(`data-variant="${variant}"`);
      // One label string for every variant: no shortened grid text, no truncation.
      expect(markup).toContain(MPG_NEW_PATIENT_BADGE_LABEL);
      expect(markup).not.toContain("ellipsis");
    });
  });

  it("defaults to the standard variant", () => {
    expect(render(<NewPatientBadge acceptingPatients="true" />)).toContain(
      'data-variant="standard"',
    );
  });

  it("sizes each variant from its own style descriptor", () => {
    const sizes = variants.map(
      (variant) => getNewPatientBadgeStyle(variant).iconCircle,
    );
    expect(new Set(sizes).size).toBe(variants.length);
  });
});

describe("NewPatientBadge accessibility", () => {
  const markup = render(
    <NewPatientBadge acceptingPatients="true" variant="prominent" />,
  );

  it("marks the icon decorative so the label is announced once", () => {
    expect(markup).toContain('aria-hidden="true"');
    expect(markup.match(/Open to New Patients/g)).toHaveLength(1);
  });

  it("is not exposed as an interactive control", () => {
    expect(markup).not.toContain("role=");
    expect(markup).not.toContain("tabindex");
    expect(markup).not.toContain("onclick");
    expect(markup).not.toContain("<a ");
    expect(markup).not.toContain("<button");
  });

  it("accepts a className so a host can position it without a wrapper", () => {
    expect(
      render(
        <NewPatientBadge acceptingPatients="true" className="host-class" />,
      ),
    ).toContain("host-class");
  });
});
