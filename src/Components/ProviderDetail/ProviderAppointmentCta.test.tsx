import { describe, it, expect, afterEach } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import ProviderAppointmentCta from "./ProviderAppointmentCta";
import { LanguageContext } from "../Internationalization/LanguageUtils";
import {
  MPG_APPOINTMENT_CONFIRMATION_TITLE,
  MPG_APPOINTMENT_DIALOG_TITLE,
  MPG_APPOINTMENT_LOCATION_HEADING,
  MPG_APPOINTMENT_VISIT_TYPE_FOLLOW_UP,
  MPG_PROVIDER_CTA_BUTTON,
} from "../../config/MPGConfig";

// LanguageContext has no default getText (its default value is `{}`), so the provider is
// required. Returning the default text mirrors InternationalizationEnabled === false.
const renderCta = (product: any, providerName: string, specialtyLine: string) =>
  render(
    <LanguageContext.Provider value={{ getText: (text: string) => text }}>
      <MemoryRouter>
        <ProviderAppointmentCta
          product={product}
          providerName={providerName}
          specialtyLine={specialtyLine}
          discoveryPath="/mpg"
        />
      </MemoryRouter>
    </LanguageContext.Provider>,
  );

const PROV_1001 = {
  ec_product_id: "PROV-1001",
  ec_name: "Dr. Sarah Mitchell",
  additionalFields: {
    hc_locations: ["Downtown Medical Center", "Northside Clinic"],
    hc_telehealth: "true",
  },
};

const PROV_1006 = {
  ec_product_id: "PROV-1006",
  ec_name: "Dr. David Kim",
  additionalFields: {
    hc_locations: ["Downtown Medical Center", "Westside Specialty Center"],
    hc_telehealth: "true",
  },
};

// `hidden: true` is required once the dialog is open: MUI's Modal marks the rest of the
// page `aria-hidden`, which is correct behaviour, so the still-mounted trigger is only
// reachable by a query that does not filter on accessibility.
const trigger = () =>
  screen.getByRole("button", { name: MPG_PROVIDER_CTA_BUTTON, hidden: true });

afterEach(cleanup);

// Test 1 — opening the workflow.
describe("opening the appointment workflow (test 1)", () => {
  it("renders no dialog until the trigger is activated", () => {
    renderCta(PROV_1001, "Dr. Sarah Mitchell", "Cardiology");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(trigger().getAttribute("aria-expanded")).toBe("false");
    expect(trigger().getAttribute("aria-haspopup")).toBe("dialog");
  });

  it("opens exactly one named dialog on step 1", async () => {
    const user = userEvent.setup();
    renderCta(PROV_1001, "Dr. Sarah Mitchell", "Cardiology");
    await user.click(trigger());

    const dialogs = screen.getAllByRole("dialog");
    expect(dialogs).toHaveLength(1);
    expect(dialogs[0]).toHaveAccessibleName(MPG_APPOINTMENT_DIALOG_TITLE);
    expect(
      within(dialogs[0]).getByRole("heading", {
        name: MPG_APPOINTMENT_LOCATION_HEADING,
      }),
    ).toBeInTheDocument();
    expect(
      within(dialogs[0]).getByText("Step 1 of 4: Location"),
    ).toBeInTheDocument();
  });

  it("keeps the trigger mounted and marks it expanded", async () => {
    const user = userEvent.setup();
    renderCta(PROV_1001, "Dr. Sarah Mitchell", "Cardiology");
    await user.click(trigger());
    expect(trigger()).toBeInTheDocument();
    expect(trigger().getAttribute("aria-expanded")).toBe("true");
  });
});

// Test 2 — the provider identity shown comes from the props, not from a cache or a
// hardcoded value.
describe("provider identity on the review step (test 2)", () => {
  const driveToReview = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(trigger());
    await user.click(
      screen.getByRole("radio", { name: "Downtown Medical Center" }),
    );
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(
      screen.getByRole("radio", { name: MPG_APPOINTMENT_VISIT_TYPE_FOLLOW_UP }),
    );
    await user.click(screen.getByRole("button", { name: "Continue" }));
  };

  it("shows PROV-1001's name and specialty line", async () => {
    const user = userEvent.setup();
    renderCta(
      PROV_1001,
      "Dr. Sarah Mitchell",
      "Cardiology · Preventive Cardiology",
    );
    await driveToReview(user);

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Dr. Sarah Mitchell")).toBeInTheDocument();
    expect(
      within(dialog).getByText("Cardiology · Preventive Cardiology"),
    ).toBeInTheDocument();
  });

  it("shows PROV-1006's name and specialty line for a different provider", async () => {
    const user = userEvent.setup();
    renderCta(PROV_1006, "Dr. David Kim", "Orthopedics");
    await driveToReview(user);

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Dr. David Kim")).toBeInTheDocument();
    expect(within(dialog).getByText("Orthopedics")).toBeInTheDocument();
    expect(within(dialog).queryByText("Dr. Sarah Mitchell")).toBeNull();
  });
});

// Test 11 — closing and reopening resets the workflow.
describe("closing and reopening resets the workflow (test 11)", () => {
  it("returns to a clean step 1 after a completed flow is closed", async () => {
    const user = userEvent.setup();
    renderCta(PROV_1001, "Dr. Sarah Mitchell", "Cardiology");

    await user.click(trigger());
    await user.click(screen.getByRole("radio", { name: "Northside Clinic" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(
      screen.getByRole("radio", { name: MPG_APPOINTMENT_VISIT_TYPE_FOLLOW_UP }),
    );
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(
      screen.getByRole("button", { name: "Submit simulated request" }),
    );
    expect(
      screen.getByText(MPG_APPOINTMENT_CONFIRMATION_TITLE),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).toBeNull();

    await user.click(trigger());
    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByText("Step 1 of 4: Location"),
    ).toBeInTheDocument();
    expect(
      within(dialog).queryByText(MPG_APPOINTMENT_CONFIRMATION_TITLE),
    ).toBeNull();
    for (const radio of within(dialog).getAllByRole("radio")) {
      expect(radio).not.toBeChecked();
    }
  });

  it("discards a mid-flow selection when the request is cancelled at step 2", async () => {
    const user = userEvent.setup();
    renderCta(PROV_1001, "Dr. Sarah Mitchell", "Cardiology");

    await user.click(trigger());
    await user.click(screen.getByRole("radio", { name: "Northside Clinic" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(
      screen.getByRole("radio", { name: MPG_APPOINTMENT_VISIT_TYPE_FOLLOW_UP }),
    );
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).toBeNull();

    await user.click(trigger());
    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByText("Step 1 of 4: Location"),
    ).toBeInTheDocument();
    for (const radio of within(dialog).getAllByRole("radio")) {
      expect(radio).not.toBeChecked();
    }
  });
});

// Test 14, focus-return half — see AppointmentRequestDialog.a11y.test.tsx for the rest.
describe("focus returns to the trigger on close (test 14)", () => {
  it("restores focus to the Request Appointment button", async () => {
    const user = userEvent.setup();
    renderCta(PROV_1001, "Dr. Sarah Mitchell", "Cardiology");

    const button = trigger();
    await user.click(button);
    expect(screen.getByRole("dialog").contains(document.activeElement)).toBe(
      true,
    );

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(document.activeElement).toBe(button);
  });
});
