import { FunctionComponent, useContext } from "react";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { LanguageContext } from "../Internationalization/LanguageUtils";
import { MPGConfigTranslations } from "../../config/InternationalizationConfig";
import {
  MPG_APPOINTMENT_CONFIRMATION_BODY,
  MPG_APPOINTMENT_CONFIRMATION_CLOSE_LABEL,
  MPG_APPOINTMENT_CONFIRMATION_DISCOVERY_LABEL,
  MPG_APPOINTMENT_CONFIRMATION_TITLE,
} from "../../config/MPGConfig";
import { Theme } from "../../config/theme";

interface AppointmentConfirmationStepProps {
  onClose: () => void;
  discoveryPath: string;
}

// Step 4. Deliberately carries no confirmation number, booking reference, date or time
// slot: nothing here may imply a real booking or real appointment inventory. The panel is
// a `role="status"` live region so the outcome is announced, matching the precedent the
// previous inline confirmation set.
const AppointmentConfirmationStep: FunctionComponent<
  AppointmentConfirmationStepProps
> = (props) => {
  const { onClose, discoveryPath } = props;
  const { getText } = useContext(LanguageContext);

  return (
    <>
      <Panel role="status">
        <Typography
          variant="subtitle1"
          component="h3"
          sx={{ fontWeight: 700, color: Theme.availabilityText }}
        >
          {getText(
            MPG_APPOINTMENT_CONFIRMATION_TITLE,
            MPGConfigTranslations,
            "appointmentConfirmationTitle",
          )}
        </Typography>
        <Typography
          variant="body2"
          sx={{ marginTop: "6px", color: Theme.availabilityText }}
        >
          {getText(
            MPG_APPOINTMENT_CONFIRMATION_BODY,
            MPGConfigTranslations,
            "appointmentConfirmationBody",
          )}
        </Typography>
      </Panel>

      <Actions>
        <Button
          variant="outlined"
          onClick={onClose}
          sx={{
            borderRadius: "12px",
            textTransform: "none",
            "&:focus-visible": {
              outline: `2px solid ${Theme.primary}`,
              outlineOffset: "2px",
            },
          }}
        >
          {getText(
            MPG_APPOINTMENT_CONFIRMATION_CLOSE_LABEL,
            MPGConfigTranslations,
            "appointmentConfirmationCloseLabel",
          )}
        </Button>
        <Button
          variant="contained"
          component={Link}
          to={discoveryPath}
          sx={{
            borderRadius: "12px",
            textTransform: "none",
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
            MPG_APPOINTMENT_CONFIRMATION_DISCOVERY_LABEL,
            MPGConfigTranslations,
            "appointmentConfirmationDiscoveryLabel",
          )}
        </Button>
      </Actions>
    </>
  );
};

export default AppointmentConfirmationStep;

const Panel = styled.div`
  padding: 16px;
  border: 1px ${Theme.availabilitySurfaceBorder} solid;
  border-radius: 12px;
  background: ${Theme.availabilitySurface};
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 20px;
`;
