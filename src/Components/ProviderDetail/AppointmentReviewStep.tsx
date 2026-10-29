import { FunctionComponent, useContext } from "react";
import Typography from "@mui/material/Typography";
import styled from "styled-components";
import { LanguageContext } from "../Internationalization/LanguageUtils";
import { MPGConfigTranslations } from "../../config/InternationalizationConfig";
import {
  MPG_APPOINTMENT_REVIEW_LOCATION_LABEL,
  MPG_APPOINTMENT_REVIEW_PROVIDER_LABEL,
  MPG_APPOINTMENT_REVIEW_SIMULATED_NOTICE,
  MPG_APPOINTMENT_REVIEW_SPECIALTY_LABEL,
  MPG_APPOINTMENT_REVIEW_VISIT_TYPE_LABEL,
} from "../../config/MPGConfig";
import { Theme } from "../../config/theme";

interface AppointmentReviewStepProps {
  providerName: string;
  specialtyLine: string;
  location: string;
  visitTypeLabel: string;
}

// Step 3. Reads the live selection through its props and keeps no state, so changing a
// choice on step 1 or 2 and returning here always shows the current request. Nothing is
// collected: there is no input of any kind, free-text or otherwise.
const AppointmentReviewStep: FunctionComponent<AppointmentReviewStepProps> = (
  props,
) => {
  const { providerName, specialtyLine, location, visitTypeLabel } = props;
  const { getText } = useContext(LanguageContext);

  const rows = [
    {
      key: "provider",
      label: getText(
        MPG_APPOINTMENT_REVIEW_PROVIDER_LABEL,
        MPGConfigTranslations,
        "appointmentReviewProviderLabel",
      ),
      value: providerName,
    },
    {
      key: "specialty",
      label: getText(
        MPG_APPOINTMENT_REVIEW_SPECIALTY_LABEL,
        MPGConfigTranslations,
        "appointmentReviewSpecialtyLabel",
      ),
      value: specialtyLine,
    },
    {
      key: "location",
      label: getText(
        MPG_APPOINTMENT_REVIEW_LOCATION_LABEL,
        MPGConfigTranslations,
        "appointmentReviewLocationLabel",
      ),
      value: location,
    },
    {
      key: "visitType",
      label: getText(
        MPG_APPOINTMENT_REVIEW_VISIT_TYPE_LABEL,
        MPGConfigTranslations,
        "appointmentReviewVisitTypeLabel",
      ),
      value: visitTypeLabel,
    },
  ];

  return (
    <>
      <SummaryList>
        {rows.map((row) => (
          <Row key={row.key}>
            <dt>
              <Typography
                variant="body2"
                component="span"
                sx={{ color: Theme.secondaryText }}
              >
                {row.label}
              </Typography>
            </dt>
            <dd>
              <Typography
                variant="body1"
                component="span"
                sx={{ fontWeight: 600 }}
              >
                {row.value}
              </Typography>
            </dd>
          </Row>
        ))}
      </SummaryList>

      {/* Deliberately not green: the availability greens carry "open to new patients"
          meaning in this app, and a green compliance notice would read as an
          availability signal. */}
      <Notice>
        <Typography variant="body2" sx={{ color: Theme.secondaryText }}>
          {getText(
            MPG_APPOINTMENT_REVIEW_SIMULATED_NOTICE,
            MPGConfigTranslations,
            "appointmentReviewSimulatedNotice",
          )}
        </Typography>
      </Notice>
    </>
  );
};

export default AppointmentReviewStep;

const SummaryList = styled.dl`
  margin: 0;
  padding: 0;
`;

const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px 16px;
  padding: 10px 0;
  border-bottom: 1px #e5e8e8 solid;

  dt {
    flex: 0 0 140px;
    margin: 0;
  }

  dd {
    flex: 1 1 180px;
    margin: 0;
    min-width: 0;
  }

  @media (max-width: ${Theme.mobileSize}px) {
    dt {
      flex: 1 1 100%;
    }
  }
`;

const Notice = styled.div`
  margin-top: 20px;
  padding: 16px;
  border: 1px #e5e8e8 solid;
  border-radius: 12px;
  background: #ffffff;
`;
