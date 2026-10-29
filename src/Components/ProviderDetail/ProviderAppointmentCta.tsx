import { FunctionComponent, useContext, useState } from "react";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import styled from "styled-components";
import AppointmentRequestDialog from "./AppointmentRequestDialog";
import {
  recordAppointmentAbandoned,
  recordAppointmentIntent,
} from "./appointmentAnalytics";
import { CommerceEngineContext } from "../../common/engineContext";
import { LanguageContext } from "../Internationalization/LanguageUtils";
import { MPGConfigTranslations } from "../../config/InternationalizationConfig";
import {
  MPG_PROVIDER_CTA_BUTTON,
  MPG_PROVIDER_CTA_SUBTEXT,
  MPG_PROVIDER_CTA_TITLE,
} from "../../config/MPGConfig";
import { Theme } from "../../config/theme";

interface ProviderAppointmentCtaProps {
  product: any;
  providerName: string;
  specialtyLine: string;
  /** Where "return to provider discovery" sends the visitor, i.e. the page's back target. */
  discoveryPath: string;
}

// The appointment flow is simulated: no scheduling backend exists, so the four-step
// dialog collects nothing, sends nothing anywhere and only acknowledges the request
// locally. The trigger stays mounted while the dialog is open so focus can return to it
// on close.
const ProviderAppointmentCta: FunctionComponent<ProviderAppointmentCtaProps> = (
  props,
) => {
  const { product, providerName, specialtyLine, discoveryPath } = props;
  const { getText } = useContext(LanguageContext);
  // The single Commerce engine built once in App.tsx. Read, never constructed.
  const commerceEngine = useContext(CommerceEngineContext);
  const [open, setOpen] = useState(false);

  // PHASE 2 — flow opened. This is the ONE place the request flow is opened, so it is the
  // single source of the `ec.cartAction` add that means "appointment request intent":
  // `recordAppointmentIntent` adds the provider to the existing engine's cart at quantity
  // 1 and price 0. It runs in a click handler, never during render and never from an
  // effect, so no rerender can be mistaken for intent; a re-entrant press while the dialog
  // is open is short-circuited below. The companion seam — request submitted, where
  // `ec.purchase` goes — is `handleSubmit` in AppointmentRequestDialog.tsx.
  const handleOpen = () => {
    if (open) return;
    // State first: the dialog must open even if analytics throws.
    setOpen(true);
    recordAppointmentIntent(commerceEngine, product);
  };

  // Cancel, the close icon, Escape and a backdrop click all land here. Closing before
  // submission is an abandoned request, recorded as a targeted `ec.cartAction` remove.
  // After a completed submission the purchase has already emptied the cart, so the
  // removal is silent and this path emits nothing.
  const handleClose = () => {
    setOpen(false);
    recordAppointmentAbandoned(commerceEngine, product);
  };

  return (
    <Panel>
      <Typography variant="h6" component="h2" sx={{ fontWeight: 700 }}>
        {getText(
          MPG_PROVIDER_CTA_TITLE,
          MPGConfigTranslations,
          "providerCtaTitle",
        )}
      </Typography>
      <Typography
        variant="body2"
        sx={{ color: Theme.secondaryText, marginTop: "6px" }}
      >
        {getText(
          MPG_PROVIDER_CTA_SUBTEXT,
          MPGConfigTranslations,
          "providerCtaSubtext",
        )}
      </Typography>

      <Button
        variant="contained"
        fullWidth
        onClick={handleOpen}
        aria-haspopup="dialog"
        aria-expanded={open}
        sx={{
          marginTop: "20px",
          padding: "14px",
          borderRadius: "12px",
          textTransform: "none",
          fontSize: "1rem",
          background: Theme.button,
          color: Theme.buttonText,
          "&:hover": { background: Theme.primary },
          "&:focus-visible": {
            outline: `2px solid ${Theme.primary}`,
            outlineOffset: "2px",
          },
        }}
      >
        {getText(
          MPG_PROVIDER_CTA_BUTTON,
          MPGConfigTranslations,
          "providerCtaButton",
        )}
      </Button>

      {open && (
        <AppointmentRequestDialog
          open={open}
          onClose={handleClose}
          product={product}
          providerName={providerName}
          specialtyLine={specialtyLine}
          discoveryPath={discoveryPath}
        />
      )}
    </Panel>
  );
};

export default ProviderAppointmentCta;

const Panel = styled.div`
  margin-top: 32px;
  padding: 24px;
  border-radius: 16px;
  background: ${Theme.primary}0d;
`;
