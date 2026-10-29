import { FunctionComponent } from "react";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { ProviderDetailSection } from "./providerDetailUtils";
import { Theme } from "../../config/theme";

interface ProviderAboutProps {
  heading: string;
  bio: string;
  sections: ProviderDetailSection[];
}

const ProviderAbout: FunctionComponent<ProviderAboutProps> = (props) => {
  const { heading, bio, sections } = props;

  return (
    <section>
      <Typography variant="h5" component="h2" sx={{ fontWeight: 700 }}>
        {heading}
      </Typography>
      {bio && (
        <Typography
          variant="body1"
          component="p"
          sx={{ color: Theme.secondaryText, marginTop: "12px" }}
        >
          {bio}
        </Typography>
      )}
      {sections.length > 0 && (
        <Grid container spacing={3} sx={{ marginTop: "16px" }}>
          {sections.map((section) => (
            <Grid key={section.key} size={{ xs: 12, sm: 6 }}>
              <Typography
                variant="subtitle1"
                component="h3"
                sx={{ fontWeight: 600 }}
              >
                {section.label}
              </Typography>
              <Typography
                variant="body2"
                component="p"
                sx={{
                  color: Theme.secondaryText,
                  marginTop: "4px",
                  overflowWrap: "anywhere",
                }}
              >
                {section.value}
              </Typography>
            </Grid>
          ))}
        </Grid>
      )}
    </section>
  );
};

export default ProviderAbout;
