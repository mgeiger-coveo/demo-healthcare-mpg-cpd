import { describe, it, expect } from "vitest";
import {
  buildProviderAttributeChips,
  buildProviderDetailSections,
  coerceBooleanField,
  formatTemplate,
  getProviderAffiliation,
  getProviderBio,
  getProviderImageUrl,
  getProviderInitials,
  getProviderLastName,
  getProviderSpecialtyLine,
  ProviderDetailFieldMap,
} from "./providerDetailUtils";
import {
  MPG_PROVIDER_ABOUT_HEADING_TEMPLATE,
  MPG_PROVIDER_ATTRIBUTE_CHIPS,
  MPG_PROVIDER_DETAIL_FIELDS,
  MPG_PROVIDER_DETAIL_SECTIONS,
} from "../../config/MPGConfig";

const fields = MPG_PROVIDER_DETAIL_FIELDS as ProviderDetailFieldMap;

// Fixtures copied from live Commerce API payloads of the HC - Provider Catalog source.
const sarahMitchell = {
  ec_product_id: "PROV-1001",
  ec_name: "Dr. Sarah Mitchell",
  ec_description:
    "Board-certified cardiologist specializing in preventive cardiology and cardiovascular disease management.",
  ec_images: ["https://randomuser.me/api/portraits/women/44.jpg"],
  ec_thumbnails: ["https://randomuser.me/api/portraits/med/women/44.jpg"],
  additionalFields: {
    hc_specialties: ["Cardiology", "Preventive Cardiology"],
    hc_languages: ["English", "Spanish"],
    hc_locations: ["Downtown Medical Center", "Northside Clinic"],
    hc_services: [
      "Cardiovascular Risk Assessment",
      "Preventive Cardiology",
      "Heart Disease Management",
    ],
    hc_medical_group: "Regional Heart Institute",
    hc_accepting_patients: "true",
    hc_telehealth: "true",
  },
};

// Both boolean attributes indexed as the string "false".
const aminaHassan = {
  ec_product_id: "PROV-1007",
  ec_name: "Dr. Amina Hassan",
  additionalFields: {
    hc_specialties: ["Primary Care"],
    hc_accepting_patients: "false",
    hc_telehealth: "false",
  },
};

describe("formatTemplate", () => {
  it("interpolates the about heading after the translation lookup", () => {
    expect(
      formatTemplate(MPG_PROVIDER_ABOUT_HEADING_TEMPLATE, {
        lastName: "Mitchell",
      }),
    ).toBe("About Dr. Mitchell");
  });

  it("leaves unknown tokens untouched", () => {
    expect(formatTemplate("About Dr. {lastName}", { name: "x" })).toBe(
      "About Dr. {lastName}",
    );
  });

  it("handles an empty template", () => {
    expect(formatTemplate("", { lastName: "Mitchell" })).toBe("");
  });
});

describe("getProviderLastName", () => {
  it("strips the honorific and takes the last token", () => {
    expect(getProviderLastName("Dr. Sarah Mitchell")).toBe("Mitchell");
    expect(getProviderLastName("Doctor Amina Hassan")).toBe("Hassan");
  });

  it("keeps a single-token name", () => {
    expect(getProviderLastName("Mitchell")).toBe("Mitchell");
    expect(getProviderLastName("Dr.")).toBe("Dr.");
  });

  it("returns an empty string for no name", () => {
    expect(getProviderLastName("")).toBe("");
    expect(getProviderLastName(undefined as any)).toBe("");
  });
});

describe("getProviderInitials", () => {
  it("builds two-letter initials without the honorific", () => {
    expect(getProviderInitials("Dr. Sarah Mitchell")).toBe("SM");
  });

  it("caps at two characters", () => {
    expect(getProviderInitials("Dr. Mary Jane Watson")).toBe("MJ");
  });

  it("returns an empty string for no name", () => {
    expect(getProviderInitials("")).toBe("");
  });
});

describe("coerceBooleanField", () => {
  it("treats the indexed strings as booleans", () => {
    expect(coerceBooleanField("true")).toBe(true);
    expect(coerceBooleanField("TRUE")).toBe(true);
    expect(coerceBooleanField("false")).toBe(false);
  });

  it("passes real booleans through", () => {
    expect(coerceBooleanField(true)).toBe(true);
    expect(coerceBooleanField(false)).toBe(false);
  });

  it("is false for missing values", () => {
    expect(coerceBooleanField(null)).toBe(false);
    expect(coerceBooleanField(undefined)).toBe(false);
    expect(coerceBooleanField("")).toBe(false);
  });

  it("reads the first entry of an array", () => {
    expect(coerceBooleanField(["true"])).toBe(true);
    expect(coerceBooleanField(["false"])).toBe(false);
  });
});

describe("getProviderImageUrl", () => {
  it("prefers ec_images", () => {
    expect(getProviderImageUrl(sarahMitchell, fields)).toBe(
      "https://randomuser.me/api/portraits/women/44.jpg",
    );
  });

  it("falls back to ec_thumbnails", () => {
    expect(
      getProviderImageUrl(
        { ec_images: [], ec_thumbnails: ["https://example.com/med.jpg"] },
        fields,
      ),
    ).toBe("https://example.com/med.jpg");
  });

  it("returns null when no image is indexed", () => {
    expect(getProviderImageUrl({}, fields)).toBeNull();
    expect(getProviderImageUrl(undefined, fields)).toBeNull();
  });
});

describe("header lines", () => {
  it("joins specialties with a middle dot", () => {
    expect(getProviderSpecialtyLine(sarahMitchell, fields)).toBe(
      "Cardiology · Preventive Cardiology",
    );
  });

  it("reads the scalar medical group as the affiliation", () => {
    expect(getProviderAffiliation(sarahMitchell, fields)).toBe(
      "Regional Heart Institute",
    );
  });

  it("returns empty lines rather than throwing on a bare product", () => {
    expect(getProviderSpecialtyLine({}, fields)).toBe("");
    expect(getProviderAffiliation({}, fields)).toBe("");
    expect(getProviderBio({}, fields)).toBe("");
  });
});

describe("buildProviderDetailSections", () => {
  it("builds the four labelled blocks from a live payload", () => {
    const sections = buildProviderDetailSections(
      sarahMitchell,
      MPG_PROVIDER_DETAIL_SECTIONS,
    );

    expect(sections.map((section) => section.label)).toEqual([
      "Specialties",
      "Languages",
      "Locations",
      "Services",
    ]);
    expect(sections[3].value).toBe(
      "Cardiovascular Risk Assessment, Preventive Cardiology, Heart Disease Management",
    );
  });

  it("drops sections whose field has no value", () => {
    const sections = buildProviderDetailSections(
      aminaHassan,
      MPG_PROVIDER_DETAIL_SECTIONS,
    );

    expect(sections).toEqual([
      { key: "specialties", label: "Specialties", value: "Primary Care" },
    ]);
  });

  it("applies translated labels when supplied", () => {
    const sections = buildProviderDetailSections(
      aminaHassan,
      MPG_PROVIDER_DETAIL_SECTIONS,
      { specialties: "Spécialités" },
    );

    expect(sections[0].label).toBe("Spécialités");
  });

  it("yields no sections for a product without additionalFields", () => {
    expect(
      buildProviderDetailSections(
        { ec_name: "Dr. Nobody" },
        MPG_PROVIDER_DETAIL_SECTIONS,
      ),
    ).toEqual([]);
  });
});

describe("buildProviderAttributeChips", () => {
  // hc_accepting_patients is no longer a configured attribute chip: it renders as the
  // green NewPatientBadge at the head of the same indicator row, so the chip list is
  // telehealth only even when both attributes are true.
  it("shows the telehealth chip when the attributes are true", () => {
    expect(
      buildProviderAttributeChips(
        sarahMitchell,
        MPG_PROVIDER_ATTRIBUTE_CHIPS,
      ).map((chip) => chip.label),
    ).toEqual(["Telehealth"]);
  });

  it("shows no chips when both attributes are the string false", () => {
    expect(
      buildProviderAttributeChips(aminaHassan, MPG_PROVIDER_ATTRIBUTE_CHIPS),
    ).toEqual([]);
  });

  it("shows only the true attribute", () => {
    const product = {
      additionalFields: {
        hc_accepting_patients: "false",
        hc_telehealth: "true",
      },
    };

    expect(
      buildProviderAttributeChips(product, MPG_PROVIDER_ATTRIBUTE_CHIPS).map(
        (chip) => chip.label,
      ),
    ).toEqual(["Telehealth"]);
  });

  it("yields no chips for a product without additionalFields", () => {
    expect(
      buildProviderAttributeChips(
        { ec_name: "Dr. Nobody" },
        MPG_PROVIDER_ATTRIBUTE_CHIPS,
      ),
    ).toEqual([]);
  });
});
