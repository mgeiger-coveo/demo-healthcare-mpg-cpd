import { createRoot } from "react-dom/client";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider, StyledEngineProvider } from "@mui/material/styles";
import App from "./App";
import theme from "./config/theme";
import "./index.css";
import "font-awesome/css/font-awesome.min.css";
import "@coveo/atomic/themes/coveo.css";
import { EnableAuthentication } from "./config/HomeConfig";
import Authenticate from "./Components/Authentication/Authenticate";

const container = document.getElementById("root")!;
const root = createRoot(container);
root.render(
  <StyledEngineProvider injectFirst>
    <ThemeProvider theme={theme}>
      {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
      <CssBaseline />
      {EnableAuthentication ? <Authenticate /> : <App />}
    </ThemeProvider>
  </StyledEngineProvider>,
);
