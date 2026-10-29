import { describe, it, expect, afterEach, vi } from "vitest";
import { act, cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import AppointmentRequestDialog from "./AppointmentRequestDialog";
import { LanguageContext } from "../Internationalization/LanguageUtils";
import {
  MPG_APPOINTMENT_CONFIRMATION_BODY,
  MPG_APPOINTMENT_CONFIRMATION_TITLE,
  MPG_APPOINTMENT_LOCATION_HINT,
  MPG_APPOINTMENT_LOCATION_UNAVAILABLE_BODY,
  MPG_APPOINTMENT_LOCATION_UNAVAILABLE_TITLE,
  MPG_APPOINTMENT_REVIEW_SIMULATED_NOTICE,
  MPG_APPOINTMENT_VISIT_TYPE_FOLLOW_UP,
  MPG_APPOINTMENT_VISIT_TYPE_HINT,
  MPG_APPOINTMENT_VISIT_TYPE_NEW_PATIENT,
  MPG_APPOINTMENT_VISIT_TYPE_TELEHEALTH,
} from "../../config/MPGConfig";

// LanguageContext has no default getText (its default value is `{}`), so the provider is
// required. Returning the default text mirrors InternationalizationEnabled === false.
const renderDialog = (product: any, specialtyLine = "Cardiology") =>
  render(
    <LanguageContext.Provider value={{ getText: (text: string) => text }}>
      <MemoryRouter>
        <AppointmentRequestDialog
          open
          onClose={() => {}}
          product={product}
          providerName="Dr. Sarah Mitchell"
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

const PROV_1002 = {
  ec_product_id: "PROV-1002",
  ec_name: "Dr. James Carter",
  additionalFields: {
    hc_locations: ["Downtown Medical Center", "Westside Specialty Center"],
    hc_telehealth: "false",
  },
};

const dialog = () => screen.getByRole("dialog");
const button = (name: string) => screen.getByRole("button", { name });
const radio = (name: string) => screen.getByRole("radio", { name });

const chooseLocation = async (
  user: ReturnType<typeof userEvent.setup>,
  name: string,
) => {
  await user.click(radio(name));
  await user.click(button("Continue"));
};

const chooseVisitType = async (
  user: ReturnType<typeof userEvent.setup>,
  name: string,
) => {
  await user.click(radio(name));
  await user.click(button("Continue"));
};

afterEach(cleanup);

// Test 3, rendered half — step 1 offers exactly the provider's own locations.
describe("location options come from provider metadata (test 3)", () => {
  it("renders one radio per real location and nothing else", async () => {
    renderDialog(PROV_1001);
    const radios = within(dialog()).getAllByRole("radio");
    expect(radios).toHaveLength(2);
    expect(radios.map((r) => r.getAttribute("value"))).toEqual([
      "Downtown Medical Center",
      "Northside Clinic",
    ]);
    expect(
      within(dialog()).queryByRole("radio", { name: /any location/i }),
    ).toBeNull();
    expect(
      within(dialog()).queryByRole("radio", { name: /main office/i }),
    ).toBeNull();
    for (const r of radios) expect(r).not.toBeChecked();
  });

  it("renders a single radio for a single-location provider", () => {
    renderDialog({
      additionalFields: {
        hc_locations: ["Westside Specialty Center"],
        hc_telehealth: "true",
      },
    });
    const radios = within(dialog()).getAllByRole("radio");
    expect(radios).toHaveLength(1);
    expect(radios[0]).toHaveAccessibleName("Westside Specialty Center");
    expect(radios[0]).not.toBeChecked();
  });
});

// Test 4, rendered half — absent metadata yields an explicit unavailable state.
describe("missing location metadata (test 4)", () => {
  it("shows the unavailable state, no radios and a blocked Continue", () => {
    renderDialog({ additionalFields: { hc_telehealth: "true" } });
    expect(
      within(dialog()).getByText(MPG_APPOINTMENT_LOCATION_UNAVAILABLE_TITLE),
    ).toBeInTheDocument();
    expect(
      within(dialog()).getByText(MPG_APPOINTMENT_LOCATION_UNAVAILABLE_BODY),
    ).toBeInTheDocument();
    expect(within(dialog()).queryAllByRole("radio")).toHaveLength(0);
    expect(button("Continue")).toBeDisabled();
    expect(button("Continue").getAttribute("aria-disabled")).toBe("true");
  });
});

// Test 5, rendered half — the telehealth option follows the strict gate.
describe("telehealth option visibility (test 5)", () => {
  it('offers three visit types when hc_telehealth is exactly "true"', async () => {
    const user = userEvent.setup();
    renderDialog(PROV_1001);
    await chooseLocation(user, "Northside Clinic");
    const radios = within(dialog()).getAllByRole("radio");
    expect(radios).toHaveLength(3);
    expect(
      within(dialog()).getByRole("radio", {
        name: MPG_APPOINTMENT_VISIT_TYPE_TELEHEALTH,
      }),
    ).toBeInTheDocument();
  });

  it('offers two visit types and no telehealth when the field is "false"', async () => {
    const user = userEvent.setup();
    renderDialog(PROV_1002);
    await chooseLocation(user, "Downtown Medical Center");
    const radios = within(dialog()).getAllByRole("radio");
    expect(radios).toHaveLength(2);
    expect(
      within(dialog()).queryByRole("radio", {
        name: MPG_APPOINTMENT_VISIT_TYPE_TELEHEALTH,
      }),
    ).toBeNull();
  });

  it('withholds telehealth for "TRUE" and " true "', async () => {
    for (const raw of ["TRUE", " true "]) {
      const user = userEvent.setup();
      renderDialog({
        additionalFields: {
          hc_locations: ["Northside Clinic"],
          hc_telehealth: raw,
        },
      });
      await chooseLocation(user, "Northside Clinic");
      expect(within(dialog()).getAllByRole("radio")).toHaveLength(2);
      expect(
        within(dialog()).queryByRole("radio", {
          name: MPG_APPOINTMENT_VISIT_TYPE_TELEHEALTH,
        }),
      ).toBeNull();
      cleanup();
    }
  });
});

// Test 6 — visit type selection.
describe("visit type selection (test 6)", () => {
  it("checks exactly one option and clears the others", async () => {
    const user = userEvent.setup();
    renderDialog(PROV_1001);
    await chooseLocation(user, "Northside Clinic");

    await user.click(radio(MPG_APPOINTMENT_VISIT_TYPE_NEW_PATIENT));
    expect(radio(MPG_APPOINTMENT_VISIT_TYPE_NEW_PATIENT)).toBeChecked();
    expect(radio(MPG_APPOINTMENT_VISIT_TYPE_FOLLOW_UP)).not.toBeChecked();
    expect(radio(MPG_APPOINTMENT_VISIT_TYPE_TELEHEALTH)).not.toBeChecked();

    await user.click(radio(MPG_APPOINTMENT_VISIT_TYPE_TELEHEALTH));
    expect(radio(MPG_APPOINTMENT_VISIT_TYPE_TELEHEALTH)).toBeChecked();
    expect(radio(MPG_APPOINTMENT_VISIT_TYPE_NEW_PATIENT)).not.toBeChecked();
    expect(button("Continue")).toBeEnabled();
  });

  it("carries the chosen label through to the review step", async () => {
    const user = userEvent.setup();
    renderDialog(PROV_1001);
    await chooseLocation(user, "Northside Clinic");
    await chooseVisitType(user, MPG_APPOINTMENT_VISIT_TYPE_TELEHEALTH);
    expect(
      within(dialog()).getByText(MPG_APPOINTMENT_VISIT_TYPE_TELEHEALTH),
    ).toBeInTheDocument();
  });
});

// Test 7, rendered half — validation blocks progression and submission.
describe("required-field validation (test 7)", () => {
  it("blocks Continue at step 1 and announces the hint politely", () => {
    renderDialog(PROV_1001);
    expect(button("Continue")).toBeDisabled();
    expect(button("Continue").getAttribute("aria-disabled")).toBe("true");
    const status = within(dialog()).getByRole("status");
    expect(status).toHaveTextContent(MPG_APPOINTMENT_LOCATION_HINT);
    expect(status.getAttribute("aria-live")).toBe("polite");
    expect(button("Continue").getAttribute("aria-describedby")).toBe(
      status.getAttribute("id"),
    );
  });

  it("enables Continue once a location is chosen and clears the hint", async () => {
    const user = userEvent.setup();
    renderDialog(PROV_1001);
    await user.click(radio("Northside Clinic"));
    expect(button("Continue")).toBeEnabled();
    expect(button("Continue")).not.toHaveAttribute("aria-disabled");
    expect(within(dialog()).getByRole("status")).toHaveTextContent("");
  });

  it("blocks Continue at step 2 until a visit type is chosen", async () => {
    const user = userEvent.setup();
    renderDialog(PROV_1001);
    await chooseLocation(user, "Northside Clinic");
    expect(button("Continue")).toBeDisabled();
    expect(within(dialog()).getByRole("status")).toHaveTextContent(
      MPG_APPOINTMENT_VISIT_TYPE_HINT,
    );
  });

  it("enables Submit only on a complete request", async () => {
    const user = userEvent.setup();
    renderDialog(PROV_1001);
    await chooseLocation(user, "Northside Clinic");
    await chooseVisitType(user, MPG_APPOINTMENT_VISIT_TYPE_FOLLOW_UP);
    expect(button("Submit simulated request")).toBeEnabled();
    expect(button("Submit simulated request")).not.toHaveAttribute(
      "aria-disabled",
    );
  });
});

// Test 8, rendered half — Back preserves what was already chosen.
describe("back preserves selections (test 8)", () => {
  it("keeps both radios checked after stepping back twice", async () => {
    const user = userEvent.setup();
    renderDialog(PROV_1001);
    await chooseLocation(user, "Northside Clinic");
    await chooseVisitType(user, MPG_APPOINTMENT_VISIT_TYPE_FOLLOW_UP);

    await user.click(button("Back"));
    expect(radio(MPG_APPOINTMENT_VISIT_TYPE_FOLLOW_UP)).toBeChecked();

    await user.click(button("Back"));
    expect(radio("Northside Clinic")).toBeChecked();
    expect(radio("Downtown Medical Center")).not.toBeChecked();
  });
});

// Test 9 — the review reflects the current request, including after a change.
describe("review accuracy (test 9)", () => {
  it("shows the provider, specialty, location and visit type", async () => {
    const user = userEvent.setup();
    renderDialog(PROV_1001, "Cardiology · Preventive Cardiology");
    await chooseLocation(user, "Downtown Medical Center");
    await chooseVisitType(user, MPG_APPOINTMENT_VISIT_TYPE_NEW_PATIENT);

    expect(within(dialog()).getByText("Provider")).toBeInTheDocument();
    expect(within(dialog()).getByText("Specialty")).toBeInTheDocument();
    expect(
      within(dialog()).getByText("Dr. Sarah Mitchell"),
    ).toBeInTheDocument();
    expect(
      within(dialog()).getByText("Cardiology · Preventive Cardiology"),
    ).toBeInTheDocument();
    expect(
      within(dialog()).getByText("Downtown Medical Center"),
    ).toBeInTheDocument();
    expect(
      within(dialog()).getByText(MPG_APPOINTMENT_VISIT_TYPE_NEW_PATIENT),
    ).toBeInTheDocument();
    expect(
      within(dialog()).getByText(MPG_APPOINTMENT_REVIEW_SIMULATED_NOTICE),
    ).toBeInTheDocument();
  });

  it("shows the new location after a selection is changed", async () => {
    const user = userEvent.setup();
    renderDialog(PROV_1001);
    await chooseLocation(user, "Downtown Medical Center");
    await chooseVisitType(user, MPG_APPOINTMENT_VISIT_TYPE_NEW_PATIENT);

    await user.click(button("Back"));
    await user.click(button("Back"));
    await user.click(radio("Northside Clinic"));
    await user.click(button("Continue"));
    await user.click(button("Continue"));

    expect(within(dialog()).getByText("Northside Clinic")).toBeInTheDocument();
    expect(within(dialog()).queryByText("Downtown Medical Center")).toBeNull();
    expect(
      within(dialog()).getByText(MPG_APPOINTMENT_VISIT_TYPE_NEW_PATIENT),
    ).toBeInTheDocument();
  });
});

// Test 10 — the confirmation copy, asserted byte-exact.
describe("submission confirmation (test 10)", () => {
  const submit = async (user: ReturnType<typeof userEvent.setup>) => {
    await chooseLocation(user, "Northside Clinic");
    await chooseVisitType(user, MPG_APPOINTMENT_VISIT_TYPE_FOLLOW_UP);
    await user.click(button("Submit simulated request"));
  };

  it("renders the exact heading and body inside a live region", async () => {
    const user = userEvent.setup();
    renderDialog(PROV_1001);
    await submit(user);

    const heading = within(dialog()).getByRole("heading", {
      name: MPG_APPOINTMENT_CONFIRMATION_TITLE,
    });
    expect(heading.textContent).toBe("Appointment Request Submitted (Demo)");

    const body = within(dialog()).getByText(MPG_APPOINTMENT_CONFIRMATION_BODY);
    expect(body.textContent).toBe(
      "This is a demonstration. No appointment has been scheduled and no information has been sent to a healthcare provider.",
    );

    const status = within(dialog()).getByRole("status");
    expect(status).toContainElement(heading);
    expect(status).toContainElement(body);
  });

  it("offers a close action and a route back to provider discovery", async () => {
    const user = userEvent.setup();
    renderDialog(PROV_1001);
    await submit(user);

    expect(button("Close")).toBeInTheDocument();
    expect(
      within(dialog())
        .getByRole("link", { name: "Return to provider search" })
        .getAttribute("href"),
    ).toBe("/mpg");
  });

  it("shows no confirmation number, booking reference, date or time", async () => {
    const user = userEvent.setup();
    renderDialog(PROV_1001);
    await submit(user);

    const panel = within(dialog()).getByRole("status");
    expect(panel.textContent ?? "").not.toMatch(/\d/);
    expect(within(dialog()).queryByText(/confirmation number/i)).toBeNull();
    expect(within(dialog()).queryByText(/reference/i)).toBeNull();
  });
});

// Test 12, rendered half — a repeated submit cannot produce a second request.
describe("no duplicate submissions (test 12)", () => {
  it("produces one confirmation on a double click", async () => {
    const user = userEvent.setup();
    renderDialog(PROV_1001);
    await chooseLocation(user, "Northside Clinic");
    await chooseVisitType(user, MPG_APPOINTMENT_VISIT_TYPE_FOLLOW_UP);

    const submitButton = button("Submit simulated request");
    await user.dblClick(submitButton);

    expect(
      screen.getAllByText(MPG_APPOINTMENT_CONFIRMATION_TITLE),
    ).toHaveLength(1);
    expect(within(dialog()).getAllByRole("status")).toHaveLength(1);
  });

  it("produces one confirmation on an Enter key repeat", async () => {
    const user = userEvent.setup();
    renderDialog(PROV_1001);
    await chooseLocation(user, "Northside Clinic");
    await chooseVisitType(user, MPG_APPOINTMENT_VISIT_TYPE_FOLLOW_UP);

    const submitButton = button("Submit simulated request");
    act(() => {
      submitButton.focus();
    });
    await user.keyboard("{Enter>3/}");

    expect(
      screen.getAllByText(MPG_APPOINTMENT_CONFIRMATION_TITLE),
    ).toHaveLength(1);
  });

  it("does not re-enter the submit handler once confirmed", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <LanguageContext.Provider value={{ getText: (text: string) => text }}>
        <MemoryRouter>
          <AppointmentRequestDialog
            open
            onClose={onClose}
            product={PROV_1001}
            providerName="Dr. Sarah Mitchell"
            specialtyLine="Cardiology"
            discoveryPath="/mpg"
          />
        </MemoryRouter>
      </LanguageContext.Provider>,
    );
    await chooseLocation(user, "Northside Clinic");
    await chooseVisitType(user, MPG_APPOINTMENT_VISIT_TYPE_FOLLOW_UP);
    await user.click(button("Submit simulated request"));

    // The submit control is gone on the confirmation step, so there is nothing left to
    // press a second time.
    expect(
      screen.queryByRole("button", { name: "Submit simulated request" }),
    ).toBeNull();
    expect(onClose).not.toHaveBeenCalled();
  });
});
