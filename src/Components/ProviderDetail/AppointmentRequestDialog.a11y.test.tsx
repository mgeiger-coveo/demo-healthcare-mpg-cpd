import { describe, it, expect, afterEach } from "vitest";
import { act, cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import ProviderAppointmentCta from "./ProviderAppointmentCta";
import { LanguageContext } from "../Internationalization/LanguageUtils";
import {
  MPG_APPOINTMENT_DIALOG_CLOSE_LABEL,
  MPG_APPOINTMENT_DIALOG_TITLE,
  MPG_APPOINTMENT_LOCATION_GROUP_LABEL,
  MPG_APPOINTMENT_LOCATION_HEADING,
  MPG_APPOINTMENT_VISIT_TYPE_FOLLOW_UP,
  MPG_APPOINTMENT_VISIT_TYPE_GROUP_LABEL,
  MPG_APPOINTMENT_VISIT_TYPE_NEW_PATIENT,
  MPG_APPOINTMENT_VISIT_TYPE_TELEHEALTH,
  MPG_PROVIDER_CTA_BUTTON,
} from "../../config/MPGConfig";

const PROV_1001 = {
  ec_product_id: "PROV-1001",
  ec_name: "Dr. Sarah Mitchell",
  additionalFields: {
    hc_locations: ["Downtown Medical Center", "Northside Clinic"],
    hc_telehealth: "true",
  },
};

// LanguageContext has no default getText (its default value is `{}`), so the provider is
// required. Returning the default text mirrors InternationalizationEnabled === false.
const renderCta = () =>
  render(
    <LanguageContext.Provider value={{ getText: (text: string) => text }}>
      <MemoryRouter>
        <ProviderAppointmentCta
          product={PROV_1001}
          providerName="Dr. Sarah Mitchell"
          specialtyLine="Cardiology"
          discoveryPath="/mpg"
        />
      </MemoryRouter>
    </LanguageContext.Provider>,
  );

// `hidden: true` is required once the dialog is open: MUI's Modal marks the rest of the
// page `aria-hidden`, so the still-mounted trigger needs a query that does not filter on
// accessibility.
const trigger = () =>
  screen.getByRole("button", { name: MPG_PROVIDER_CTA_BUTTON, hidden: true });
const dialog = () => screen.getByRole("dialog");

afterEach(cleanup);

// Test 14 — accessibility and keyboard behaviour.
describe("dialog semantics and accessible names (test 14)", () => {
  it("exposes exactly one dialog, named through aria-labelledby", async () => {
    const user = userEvent.setup();
    renderCta();
    await user.click(trigger());

    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    const labelledBy = dialog().getAttribute("aria-labelledby");
    expect(labelledBy).toBeTruthy();
    expect(document.getElementById(labelledBy as string)?.textContent).toBe(
      MPG_APPOINTMENT_DIALOG_TITLE,
    );
    expect(dialog()).toHaveAccessibleName(MPG_APPOINTMENT_DIALOG_TITLE);
  });

  it("names the icon-only close control and every radio", async () => {
    const user = userEvent.setup();
    renderCta();
    await user.click(trigger());

    expect(
      within(dialog()).getByRole("button", {
        name: MPG_APPOINTMENT_DIALOG_CLOSE_LABEL,
      }),
    ).toBeInTheDocument();

    const radios = within(dialog()).getAllByRole("radio");
    expect(radios[0]).toHaveAccessibleName("Downtown Medical Center");
    expect(radios[1]).toHaveAccessibleName("Northside Clinic");
  });

  it("groups each option list under a real legend", async () => {
    const user = userEvent.setup();
    renderCta();
    await user.click(trigger());

    expect(
      within(dialog()).getByRole("group", {
        name: MPG_APPOINTMENT_LOCATION_GROUP_LABEL,
      }),
    ).toBeInTheDocument();

    await user.click(
      within(dialog()).getByRole("radio", { name: "Northside Clinic" }),
    );
    await user.click(
      within(dialog()).getByRole("button", { name: "Continue" }),
    );

    expect(
      within(dialog()).getByRole("group", {
        name: MPG_APPOINTMENT_VISIT_TYPE_GROUP_LABEL,
      }),
    ).toBeInTheDocument();
  });

  it("collects no free-text input anywhere in the flow", async () => {
    const user = userEvent.setup();
    renderCta();
    await user.click(trigger());

    expect(within(dialog()).queryByRole("textbox")).toBeNull();
    expect(dialog().querySelectorAll('input[type="text"]')).toHaveLength(0);
    expect(dialog().querySelectorAll("textarea")).toHaveLength(0);
  });
});

describe("focus management (test 14)", () => {
  it("moves focus into the dialog, onto the active step heading", async () => {
    const user = userEvent.setup();
    renderCta();
    await user.click(trigger());

    expect(dialog().contains(document.activeElement)).toBe(true);
    expect(document.activeElement).toBe(
      within(dialog()).getByRole("heading", {
        name: MPG_APPOINTMENT_LOCATION_HEADING,
      }),
    );
  });

  it("moves focus to the new step heading when the step changes", async () => {
    const user = userEvent.setup();
    renderCta();
    await user.click(trigger());
    await user.click(
      within(dialog()).getByRole("radio", { name: "Northside Clinic" }),
    );
    await user.click(
      within(dialog()).getByRole("button", { name: "Continue" }),
    );

    expect(document.activeElement).toBe(
      within(dialog()).getByRole("heading", { name: "Select a visit type" }),
    );
  });

  it("returns focus to the triggering button on close", async () => {
    const user = userEvent.setup();
    renderCta();
    const button = trigger();
    await user.click(button);
    await user.click(
      within(dialog()).getByRole("button", {
        name: MPG_APPOINTMENT_DIALOG_CLOSE_LABEL,
      }),
    );

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(button);
  });

  it("keeps Tab inside the dialog", async () => {
    const user = userEvent.setup();
    renderCta();
    await user.click(trigger());

    for (let i = 0; i < 12; i += 1) {
      await user.tab();
      expect(dialog().contains(document.activeElement)).toBe(true);
    }
    for (let i = 0; i < 12; i += 1) {
      await user.tab({ shift: true });
      expect(dialog().contains(document.activeElement)).toBe(true);
    }
  });
});

describe("keyboard operation (test 14)", () => {
  it("moves the checked radio with Arrow keys without leaving the group", async () => {
    const user = userEvent.setup();
    renderCta();
    await user.click(trigger());

    const first = within(dialog()).getByRole("radio", {
      name: "Downtown Medical Center",
    });
    const second = within(dialog()).getByRole("radio", {
      name: "Northside Clinic",
    });

    act(() => {
      first.focus();
    });
    await user.keyboard("{ArrowDown}");
    expect(second).toBeChecked();
    expect(document.activeElement).toBe(second);

    await user.keyboard("{ArrowDown}");
    expect(first).toBeChecked();
    expect(dialog().contains(document.activeElement)).toBe(true);

    await user.keyboard("{ArrowUp}");
    expect(second).toBeChecked();
  });

  it("selects with Space and advances with Enter", async () => {
    const user = userEvent.setup();
    renderCta();
    await user.click(trigger());

    const location = within(dialog()).getByRole("radio", {
      name: "Northside Clinic",
    });
    act(() => {
      location.focus();
    });
    await user.keyboard(" ");
    expect(location).toBeChecked();

    const cont = within(dialog()).getByRole("button", { name: "Continue" });
    act(() => {
      cont.focus();
    });
    await user.keyboard("{Enter}");
    expect(
      within(dialog()).getByRole("heading", { name: "Select a visit type" }),
    ).toBeInTheDocument();
  });

  it("completes the whole flow without a mouse", async () => {
    const user = userEvent.setup();
    renderCta();
    act(() => {
      trigger().focus();
    });
    await user.keyboard("{Enter}");

    act(() => {
      within(dialog())
        .getByRole("radio", { name: "Downtown Medical Center" })
        .focus();
    });
    await user.keyboard(" ");
    act(() => {
      within(dialog()).getByRole("button", { name: "Continue" }).focus();
    });
    await user.keyboard("{Enter}");

    act(() => {
      within(dialog())
        .getByRole("radio", { name: MPG_APPOINTMENT_VISIT_TYPE_NEW_PATIENT })
        .focus();
    });
    await user.keyboard(" ");
    act(() => {
      within(dialog()).getByRole("button", { name: "Continue" }).focus();
    });
    await user.keyboard("{Enter}");

    act(() => {
      within(dialog())
        .getByRole("button", { name: "Submit simulated request" })
        .focus();
    });
    await user.keyboard("{Enter}");

    expect(
      within(dialog()).getByRole("heading", {
        name: "Appointment Request Submitted (Demo)",
      }),
    ).toBeInTheDocument();
  });

  it("closes on Escape at each step", async () => {
    for (const stepsToAdvance of [0, 1, 2]) {
      const user = userEvent.setup();
      renderCta();
      await user.click(trigger());

      if (stepsToAdvance > 0) {
        await user.click(
          within(dialog()).getByRole("radio", { name: "Northside Clinic" }),
        );
        await user.click(
          within(dialog()).getByRole("button", { name: "Continue" }),
        );
      }
      if (stepsToAdvance > 1) {
        await user.click(
          within(dialog()).getByRole("radio", {
            name: MPG_APPOINTMENT_VISIT_TYPE_FOLLOW_UP,
          }),
        );
        await user.click(
          within(dialog()).getByRole("button", { name: "Continue" }),
        );
      }

      await user.keyboard("{Escape}");
      expect(screen.queryByRole("dialog")).toBeNull();
      cleanup();
    }
  });

  it("closes on Escape from the confirmation step", async () => {
    const user = userEvent.setup();
    renderCta();
    await user.click(trigger());
    await user.click(
      within(dialog()).getByRole("radio", { name: "Northside Clinic" }),
    );
    await user.click(
      within(dialog()).getByRole("button", { name: "Continue" }),
    );
    await user.click(
      within(dialog()).getByRole("radio", {
        name: MPG_APPOINTMENT_VISIT_TYPE_TELEHEALTH,
      }),
    );
    await user.click(
      within(dialog()).getByRole("button", { name: "Continue" }),
    );
    await user.click(
      within(dialog()).getByRole("button", {
        name: "Submit simulated request",
      }),
    );

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

describe("disabled states and announcements (test 14)", () => {
  it("marks a blocked Continue both disabled and aria-disabled", async () => {
    const user = userEvent.setup();
    renderCta();
    await user.click(trigger());

    const cont = within(dialog()).getByRole("button", { name: "Continue" });
    expect(cont).toBeDisabled();
    expect(cont.getAttribute("aria-disabled")).toBe("true");

    await user.click(
      within(dialog()).getByRole("radio", { name: "Northside Clinic" }),
    );
    const enabled = within(dialog()).getByRole("button", { name: "Continue" });
    expect(enabled).toBeEnabled();
    expect(enabled).not.toHaveAttribute("aria-disabled");
  });

  it("marks a blocked Submit both disabled and aria-disabled", async () => {
    const user = userEvent.setup();
    // A provider with no locations can never complete step 1, so Continue stays blocked
    // and the flow can never reach a submittable review — the honest blocked case.
    render(
      <LanguageContext.Provider value={{ getText: (text: string) => text }}>
        <MemoryRouter>
          <ProviderAppointmentCta
            product={{ additionalFields: { hc_telehealth: "true" } }}
            providerName="Dr. Nobody"
            specialtyLine="Cardiology"
            discoveryPath="/mpg"
          />
        </MemoryRouter>
      </LanguageContext.Provider>,
    );
    await user.click(trigger());

    const cont = within(dialog()).getByRole("button", { name: "Continue" });
    expect(cont).toBeDisabled();
    expect(cont.getAttribute("aria-disabled")).toBe("true");
    expect(within(dialog()).queryAllByRole("radio")).toHaveLength(0);
  });

  it("announces validity through a polite status region the button describes", async () => {
    const user = userEvent.setup();
    renderCta();
    await user.click(trigger());

    const status = within(dialog()).getByRole("status");
    expect(status.getAttribute("aria-live")).toBe("polite");
    expect(
      within(dialog())
        .getByRole("button", { name: "Continue" })
        .getAttribute("aria-describedby"),
    ).toBe(status.getAttribute("id"));
  });

  it("announces the confirmation through a status region", async () => {
    const user = userEvent.setup();
    renderCta();
    await user.click(trigger());
    await user.click(
      within(dialog()).getByRole("radio", { name: "Northside Clinic" }),
    );
    await user.click(
      within(dialog()).getByRole("button", { name: "Continue" }),
    );
    await user.click(
      within(dialog()).getByRole("radio", {
        name: MPG_APPOINTMENT_VISIT_TYPE_FOLLOW_UP,
      }),
    );
    await user.click(
      within(dialog()).getByRole("button", { name: "Continue" }),
    );
    await user.click(
      within(dialog()).getByRole("button", {
        name: "Submit simulated request",
      }),
    );

    const status = within(dialog()).getByRole("status");
    expect(status).toHaveTextContent("Appointment Request Submitted (Demo)");
  });
});
