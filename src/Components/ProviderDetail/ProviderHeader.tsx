import { FunctionComponent } from "react";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import styled from "styled-components";
import ProviderPhoto from "./ProviderPhoto";
import { ProviderAttributeChip } from "./providerDetailUtils";
import NewPatientBadge from "../MPG/NewPatientBadge";
import { isAcceptingPatientsValue } from "../MPG/newPatientBadgeUtils";
import { Theme } from "../../config/theme";

interface ProviderHeaderProps {
  name: string;
  specialtyLine: string;
  affiliation: string;
  imageUrl: string | null;
  photoAlt: string;
  initials: string;
  chips: ProviderAttributeChip[];
  // The raw `hc_accepting_patients` value. Drives the green availability badge at the
  // head of the indicator row; the remaining attributes stay neutral chips.
  acceptingPatients?: string | null;
}

const ProviderHeader: FunctionComponent<ProviderHeaderProps> = (props) => {
  const {
    name,
    specialtyLine,
    affiliation,
    imageUrl,
    photoAlt,
    initials,
    chips,
    acceptingPatients,
  } = props;

  const showBadge = isAcceptingPatientsValue(acceptingPatients);

  return (
    <Grid container spacing={3} alignItems="flex-start">
      <Grid size={{ xs: 12, sm: "auto" }}>
        <ProviderPhoto imageUrl={imageUrl} alt={photoAlt} initials={initials} />
      </Grid>
      <Grid size={{ xs: 12, sm: "grow" }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          {name}
        </Typography>
        {specialtyLine && (
          <Typography
            variant="body1"
            sx={{ color: Theme.secondaryText, marginTop: "8px" }}
          >
            {specialtyLine}
          </Typography>
        )}
        {affiliation && (
          <Typography
            variant="body2"
            sx={{ color: Theme.secondaryText, marginTop: "6px" }}
          >
            {affiliation}
          </Typography>
        )}
        {(showBadge || chips.length > 0) && (
          // A plain list, not a group of controls: the badge and the chips carry no
          // onClick and no onDelete, so they are never announced as interactive. The
          // availability badge comes first, then the neutral attribute chips.
          <ChipList>
            {showBadge && (
              <li>
                <NewPatientBadge
                  acceptingPatients={acceptingPatients}
                  variant="prominent"
                />
              </li>
            )}
            {chips.map((chip) => (
              <li key={chip.key}>
                <Chip label={chip.label} size="small" variant="outlined" />
              </li>
            ))}
          </ChipList>
        )}
      </Grid>
    </Grid>
  );
};

export default ProviderHeader;

const ChipList = styled.ul`
  display: flex;
  flex-wrap: wrap;
  /* The prominent badge is taller than a small Chip, so the row centres its items
     instead of stretching them. */
  align-items: center;
  gap: 8px;
  list-style: none;
  margin: 16px 0 0;
  padding: 0;
`;
