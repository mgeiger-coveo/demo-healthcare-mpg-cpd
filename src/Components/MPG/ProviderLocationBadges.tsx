import { FunctionComponent, useContext } from "react";
import Chip from "@mui/material/Chip";
import styled from "styled-components";
import { getAdditionalField, splitLocationBadges } from "./mpgUtils";
import { formatTemplate } from "../ProviderDetail/providerDetailUtils";
import { LanguageContext } from "../Internationalization/LanguageUtils";
import { MPGConfigTranslations } from "../../config/InternationalizationConfig";
import {
  MPG_LOCATION_BADGE_LIMIT,
  MPG_LOCATION_OVERFLOW_TEMPLATE,
  MPG_LOCATION_OVERFLOW_TITLE_TEMPLATE,
  MPG_PROVIDER_CARD_FIELDS,
} from "../../config/MPGConfig";

interface ProviderLocationBadgesProps {
  product: any;
  // Grid cards render the same badges tighter so three of them fit a narrow column.
  dense?: boolean;
}

// The provider's locations as a plain list of badges. Deliberately inert: no onClick, no
// onDelete and no tabIndex, so nothing here is announced or styled as a control — the
// same treatment the detail page header gives its attribute chips.
const ProviderLocationBadges: FunctionComponent<ProviderLocationBadgesProps> = (
  props,
) => {
  const { product, dense = false } = props;
  const { getText } = useContext(LanguageContext);

  const locations = getAdditionalField(
    product,
    MPG_PROVIDER_CARD_FIELDS.facility,
  );
  const { visible, overflow, overflowCount } = splitLocationBadges(
    locations,
    MPG_LOCATION_BADGE_LIMIT,
  );

  if (visible.length === 0 && overflowCount === 0) return null;

  const overflowLabel = formatTemplate(
    getText(
      MPG_LOCATION_OVERFLOW_TEMPLATE,
      MPGConfigTranslations,
      "locationOverflowTemplate",
    ),
    { count: String(overflowCount) },
  );
  const overflowDetail = formatTemplate(
    getText(
      MPG_LOCATION_OVERFLOW_TITLE_TEMPLATE,
      MPGConfigTranslations,
      "locationOverflowTitleTemplate",
    ),
    { locations: overflow.join(", ") },
  );

  return (
    <BadgeList $dense={dense}>
      {visible.map((location) => (
        <li key={location}>
          <Chip label={location} size="small" variant="outlined" />
        </li>
      ))}
      {overflowCount > 0 && (
        <li>
          {/* The title is a hover affordance only, so the remaining locations are also
              carried in text that a screen reader reads out. */}
          <Chip
            label={overflowLabel}
            size="small"
            variant="outlined"
            title={overflowDetail}
          />
          <VisuallyHidden>{overflowDetail}</VisuallyHidden>
        </li>
      )}
    </BadgeList>
  );
};

export default ProviderLocationBadges;

const BadgeList = styled.ul<{ $dense: boolean }>`
  display: flex;
  flex-wrap: wrap;
  gap: ${(props) => (props.$dense ? "4px" : "8px")};
  list-style: none;
  margin: ${(props) => (props.$dense ? "10px 0 0" : "12px 0 0")};
  padding: 0;
  min-width: 0;

  .MuiChip-root {
    max-width: 100%;
    ${(props) => (props.$dense ? "height: 22px;" : "")}
  }

  .MuiChip-label {
    font-size: ${(props) => (props.$dense ? "11px" : "12px")};
  }
`;

const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;
