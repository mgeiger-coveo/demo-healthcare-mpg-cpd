import { FunctionComponent, useContext } from "react";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import styled from "styled-components";
import {
  getNewPatientBadgeStyle,
  isAcceptingNewPatients,
  isAcceptingPatientsValue,
  NewPatientBadgeVariant,
} from "./newPatientBadgeUtils";
import { LanguageContext } from "../Internationalization/LanguageUtils";
import { MPGConfigTranslations } from "../../config/InternationalizationConfig";
import { MPG_NEW_PATIENT_BADGE_LABEL } from "../../config/MPGConfig";
import { Theme } from "../../config/theme";

interface NewPatientBadgeProps {
  // The raw `hc_accepting_patients` value, for callers that already have the field.
  acceptingPatients?: string | null;
  // Or the whole Commerce product, for callers that have the card's product. Takes
  // precedence when both are given.
  product?: any;
  variant?: NewPatientBadgeVariant;
  className?: string;
}

/**
 * The provider availability indicator: "Open to New Patients".
 *
 * Visibility comes exclusively from `hc_accepting_patients` and only from the exact
 * string "true" (see isAcceptingPatientsValue). It renders nothing otherwise, which is
 * why callers can place it unconditionally.
 *
 * Deliberately inert — a `<span>` with no role, tabIndex, href or handler — matching the
 * ProviderLocationBadges / ProviderHeader chip precedent. On a provider card the whole
 * card is an anchor, so the badge must neither be announced as a control nor swallow the
 * click.
 *
 * The visible label is the accessible label: the icon is decorative and aria-hidden, so
 * the string is announced exactly once, and the meaning is carried by text rather than by
 * the green colour alone.
 */
const NewPatientBadge: FunctionComponent<NewPatientBadgeProps> = (props) => {
  const { acceptingPatients, product, variant = "standard", className } = props;
  const { getText } = useContext(LanguageContext);

  const isAccepting =
    product !== undefined && product !== null
      ? isAcceptingNewPatients(product)
      : isAcceptingPatientsValue(acceptingPatients);

  if (!isAccepting) return null;

  const label = getText(
    MPG_NEW_PATIENT_BADGE_LABEL,
    MPGConfigTranslations,
    "newPatientBadgeLabel",
  );

  return (
    <Pill
      $variant={variant}
      className={className}
      data-testid="new-patient-badge"
      data-variant={variant}
    >
      <IconCircle $variant={variant} aria-hidden="true">
        <PersonAddAlt1Icon fontSize="inherit" />
      </IconCircle>
      <Label $variant={variant}>{label}</Label>
    </Pill>
  );
};

export default NewPatientBadge;

// Every custom styled-components prop is `$`-prefixed so it is transient and never
// forwarded to the DOM.
const Pill = styled.span<{ $variant: NewPatientBadgeVariant }>`
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  box-sizing: border-box;
  max-width: 100%;
  min-width: 0;
  border-radius: 999px;
  background: ${Theme.availabilitySurface};
  border: 1px solid ${Theme.availabilitySurfaceBorder};
  color: ${Theme.availabilityText};
  vertical-align: middle;
  gap: ${(props) => getNewPatientBadgeStyle(props.$variant).gap}px;
  padding: ${(props) => getNewPatientBadgeStyle(props.$variant).padding};
`;

const IconCircle = styled.span<{ $variant: NewPatientBadgeVariant }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  border-radius: 50%;
  background: ${Theme.availabilityAccent};
  color: ${Theme.availabilityOnAccent};
  width: ${(props) => getNewPatientBadgeStyle(props.$variant).iconCircle}px;
  height: ${(props) => getNewPatientBadgeStyle(props.$variant).iconCircle}px;
  font-size: ${(props) =>
    getNewPatientBadgeStyle(props.$variant).iconFontSize}px;
`;

// No text-overflow and no ellipsis anywhere: the label wraps rather than truncating, so
// the visible text always equals the accessible text.
//
// `wrapLabel` is the variant's preference, not an absolute: the compact variant wraps at
// every width because its column is always narrow, while standard and prominent prefer
// one line. Below Theme.mobileSize every variant is allowed to wrap, because the pill is
// clamped to `max-width: 100%` there and `nowrap` would clip the label instead.
const Label = styled.span<{ $variant: NewPatientBadgeVariant }>`
  min-width: 0;
  font-weight: 600;
  line-height: 1.25;
  font-size: ${(props) =>
    getNewPatientBadgeStyle(props.$variant).labelFontSize}px;
  white-space: ${(props) =>
    getNewPatientBadgeStyle(props.$variant).wrapLabel ? "normal" : "nowrap"};

  @media (max-width: ${Theme.mobileSize}px) {
    white-space: normal;
  }
`;
