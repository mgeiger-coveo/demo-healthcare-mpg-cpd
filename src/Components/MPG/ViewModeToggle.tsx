import { FunctionComponent, useContext } from "react";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import GridViewIcon from "@mui/icons-material/GridView";
import ViewListIcon from "@mui/icons-material/ViewList";
import styled from "styled-components";
import { LanguageContext } from "../Internationalization/LanguageUtils";
import { MPGConfigTranslations } from "../../config/InternationalizationConfig";
import {
  MPG_VIEW_MODE_GRID_LABEL,
  MPG_VIEW_MODE_GROUP_LABEL,
  MPG_VIEW_MODE_LIST_LABEL,
} from "../../config/MPGConfig";
import { MPGViewModeType } from "../../config/Types/ConfigTypes";
import { Theme } from "../../config/theme";

interface ViewModeToggleProps {
  mode: MPGViewModeType;
  onChange: (mode: MPGViewModeType) => void;
}

const ViewModeToggle: FunctionComponent<ViewModeToggleProps> = (props) => {
  const { mode, onChange } = props;
  const { getText } = useContext(LanguageContext);

  const listLabel = getText(
    MPG_VIEW_MODE_LIST_LABEL,
    MPGConfigTranslations,
    "viewModeListLabel",
  );
  const gridLabel = getText(
    MPG_VIEW_MODE_GRID_LABEL,
    MPGConfigTranslations,
    "viewModeGridLabel",
  );

  return (
    <StyledToggleGroup
      exclusive
      size="small"
      value={mode}
      aria-label={getText(
        MPG_VIEW_MODE_GROUP_LABEL,
        MPGConfigTranslations,
        "viewModeGroupLabel",
      )}
      // MUI reports null when the active button is pressed again; ignoring it keeps the
      // group from ending up with no layout selected.
      onChange={(_, value) => {
        if (value === "list" || value === "grid") onChange(value);
      }}
    >
      <ToggleButton value="list" aria-label={listLabel}>
        <ViewListIcon fontSize="small" />
        <ButtonLabel>{listLabel}</ButtonLabel>
      </ToggleButton>
      <ToggleButton value="grid" aria-label={gridLabel}>
        <GridViewIcon fontSize="small" />
        <ButtonLabel>{gridLabel}</ButtonLabel>
      </ToggleButton>
    </StyledToggleGroup>
  );
};

export default ViewModeToggle;

const StyledToggleGroup = styled(ToggleButtonGroup)`
  .MuiToggleButton-root {
    border: 1px solid ${Theme.primary};
    border-radius: 20px;
    color: ${Theme.primary};
    font-family: inherit;
    font-size: 14px;
    font-weight: 500;
    gap: 6px;
    padding: 5px 14px;
    text-transform: none;
  }
  .MuiToggleButton-root.Mui-selected {
    background: ${Theme.button};
    color: ${Theme.buttonText};
  }
  .MuiToggleButton-root.Mui-selected:hover {
    background: ${Theme.button};
  }
  .MuiToggleButton-root:not(.Mui-selected):hover {
    background: #f5eef9;
  }
  .MuiToggleButtonGroup-grouped:not(:first-of-type) {
    margin-left: 6px;
    border-left: 1px solid ${Theme.primary};
  }
  .MuiToggleButton-root:focus-visible {
    outline: 2px solid ${Theme.secondary};
    outline-offset: 2px;
  }
`;

// Icon-only below the small breakpoint; the aria-label carries the name either way.
const ButtonLabel = styled.span`
  @media (max-width: ${Theme.mobileSize}px) {
    display: none;
  }
`;
