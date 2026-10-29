import { createTheme } from "@mui/material/styles";
import { red } from "@mui/material/colors";

export const Theme = {
  primary: "#5d237d",
  primaryText: "#282829",

  button: "#752e9c",
  buttonText: "#FFFFFF",

  secondary: "#004990",
  secondaryText: "#626971",

  searchBarTitle: "#FFFFFF",
  searchIcon: "#752e9c",
  searchTabBar: "#5d237d",
  searchTabBorder: "#FFFFFF",
  searchBarBackground: "#451c5c",
  searchTabText: "#FFFFFF",

  footer: "#FFFFFF",

  // Provider availability ("Open to New Patients"). Green on purpose: it reads as an
  // availability signal rather than as brand chrome, so it does not compete with the
  // purple primary. Measured contrast ratios, sRGB per WCAG 2.1:
  //   availabilityText on availabilitySurface        6.80:1  (AA, both sizes)
  //   availabilityText on the white card             7.72:1  (AAA)
  //   availabilityOnAccent on availabilityAccent     5.28:1  (AA)
  //   availabilityAccent on availabilitySurface      4.65:1  (AA)
  //   availabilitySurface vs the white card          1.14:1  (decorative only — the
  //                                                   label text carries the meaning,
  //                                                   never the colour alone)
  //   availabilitySurfaceBorder vs the white card    1.39:1  (non-colour pill edge)
  availabilitySurface: "#E6F4EA",
  availabilitySurfaceBorder: "#BFE3CC",
  availabilityAccent: "#1E7B46",
  availabilityText: "#1B5E3F",
  availabilityOnAccent: "#FFFFFF",

  mobileSize: 480,
};

const theme = createTheme({
  palette: {
    mode: "light",
    text: {
      primary: Theme.primaryText,
    },
    primary: {
      main: Theme.primary,
    },
    secondary: {
      main: Theme.secondary,
    },
    error: {
      main: red.A400,
    },
    background: {
      default: "#fff",
    },
  },
  typography: {
    fontFamily:
      "canada-type-gibson, Gibson,Noto Sans, Avenir, Helvetica, Arial, sans-serif",
    // Material-UI uses rem units for the font size. This will change the base size for the entire search page
    // More info at https://material-ui.com/customization/typography/#font-size
    fontSize: 16,
    fontWeightRegular: "300",
    fontWeightMedium: "500",
  },
});

export default theme;
