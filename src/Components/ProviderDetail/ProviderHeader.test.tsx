import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import ProviderHeader from "./ProviderHeader";
import { LanguageContext } from "../Internationalization/LanguageUtils";

const renderHeader = (acceptingPatients?: string | null) =>
  renderToStaticMarkup(
    <LanguageContext.Provider value={{ getText: (text: string) => text }}>
      <ProviderHeader
        name="Dr. Sarah Mitchell"
        specialtyLine="Cardiology · Preventive Cardiology"
        affiliation="Regional Heart Institute"
        imageUrl={null}
        photoAlt="Photo of Dr. Sarah Mitchell"
        initials="SM"
        acceptingPatients={acceptingPatients}
        chips={[{ key: "telehealth", label: "Telehealth" }]}
      />
    </LanguageContext.Provider>,
  );

describe("ProviderHeader availability badge", () => {
  it('shows the prominent badge when hc_accepting_patients is "true"', () => {
    const markup = renderHeader("true");
    expect(markup).toContain('data-testid="new-patient-badge"');
    expect(markup).toContain('data-variant="prominent"');
    expect(markup).toContain("Open to New Patients");
    // The neutral telehealth chip stays beside it, as its own indicator.
    expect(markup).toContain("Telehealth");
  });

  it("puts the badge before the telehealth chip in the indicator row", () => {
    const markup = renderHeader("true");
    expect(markup.indexOf("new-patient-badge")).toBeLessThan(
      markup.indexOf("Telehealth"),
    );
  });

  it('hides the badge for "false" and keeps the telehealth chip', () => {
    const markup = renderHeader("false");
    expect(markup).not.toContain("new-patient-badge");
    expect(markup).toContain("Telehealth");
  });

  it("hides the badge when the field is absent", () => {
    const markup = renderHeader(undefined);
    expect(markup).not.toContain("new-patient-badge");
    expect(markup).toContain("Telehealth");
  });

  it("keeps the indicator row inert", () => {
    const markup = renderHeader("true");
    expect(markup).toContain("Dr. Sarah Mitchell");
    expect(markup).not.toContain("<button");
    expect(markup).not.toContain("MuiChip-clickable");
  });
});

describe("ProviderHeader indicator row rendering", () => {
  it("renders the row for the badge alone when there are no chips", () => {
    const markup = renderToStaticMarkup(
      <LanguageContext.Provider value={{ getText: (text: string) => text }}>
        <ProviderHeader
          name="Dr. Maya Patel"
          specialtyLine="Dermatology"
          affiliation=""
          imageUrl={null}
          photoAlt="Photo of Dr. Maya Patel"
          initials="MP"
          acceptingPatients="true"
          chips={[]}
        />
      </LanguageContext.Provider>,
    );
    expect(markup).toContain('data-variant="prominent"');
  });

  it("renders no row at all when neither the badge nor a chip applies", () => {
    const markup = renderToStaticMarkup(
      <LanguageContext.Provider value={{ getText: (text: string) => text }}>
        <ProviderHeader
          name="Dr. Amina Hassan"
          specialtyLine="Orthopedics"
          affiliation=""
          imageUrl={null}
          photoAlt="Photo of Dr. Amina Hassan"
          initials="AH"
          acceptingPatients="false"
          chips={[]}
        />
      </LanguageContext.Provider>,
    );
    expect(markup).not.toContain("new-patient-badge");
    expect(markup).not.toContain("<ul");
  });
});
