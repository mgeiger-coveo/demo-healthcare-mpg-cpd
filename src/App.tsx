import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Grid, Typography } from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import {
  initializeCommerceHeadlessEngine,
  initializeHeadlessEngine,
} from "./common/Engine";
import { SearchEngine } from "@coveo/headless";
import { CommerceEngine } from "@coveo/headless/commerce";
import HomePage from "./Components/HomePage/HomePage";
import Header from "./Components/HomePage/Header";
import { CommerceEngineProvider, EngineProvider } from "./common/engineContext";
import SearchPage from "./Components/SearchPage/SearchPage";
import Footer from "./Components/HomePage/Footer";
import QuickViewModal from "./Components/SearchPage/QuickViewModal";
import QuickViewModalProvider from "./Components/SearchPage/QuickViewModalContext";
import CustomContextProvider, {
  settingCommerceContextFromEngineFirstTime,
  settingContextFromEngineFirstTime,
} from "./Components/CustomContext/CustomContextContext";
import { Theme } from "./config/theme";
import {
  LanguageContextProvider,
  LanguageContext,
} from "./Components/Internationalization/LanguageUtils";
import DocsPage from "./Components/HomePage/DocsPage";
import PLP from "./Components/PLP/PLP";
import ContentSearchPage from "./Components/ContentSearchPage/SearchPage";
import { AtomicSearchInterface } from "@coveo/atomic-react";
import {
  EnableContentSearch,
  FieldToIncludesInSearchResults,
} from "./config/SearchConfig";
import {
  CoveoStandardTranslations,
  FacetTranslations,
  InternationalizationEnabled,
} from "./config/InternationalizationConfig";
import ChatPage from "./Components/Generative/ChatPage";
import MPGPage from "./Components/MPG/MPGPage";
import ProviderDetailPage from "./Components/ProviderDetail/ProviderDetailPage";
import ProviderListingPage from "./Components/SpecialtyListing/ProviderListingPage";

export default function App() {
  const [engine, setEngine] = React.useState<SearchEngine | null>(null);
  const [commerceEngine, setCommerceEngine] =
    React.useState<CommerceEngine | null>(null);
  const [engineError, setEngineError] = React.useState<string | null>(null);

  const setCustomTranslations = (i18n: any, elementTranslations: any) => {
    if (typeof elementTranslations != "object" || elementTranslations == null)
      return console.error(
        "Unable to set custom translations as value isn't a valid object (Using default settings)",
      );

    for (const key in elementTranslations) {
      const element = elementTranslations[key];
      const languagesDetected: string[] = Object.keys(element);
      if (!languagesDetected || languagesDetected.length == 0) continue;

      languagesDetected.forEach((language) => {
        i18n.addResourceBundle(language, "translation", {
          [key]: element[language],
        });
      });
    }
  };

  const setFacetTranslations = (i18n: any, facetConfig: any) => {
    if (typeof facetConfig != "object" || facetConfig == null)
      return console.error(
        "Unable to set custom facet translations as value isn't valid",
      );

    for (const key in facetConfig) {
      const facet = facetConfig[key];
      if (!facet.hasOwnProperty("values")) continue;
      const values = facet["values"];
      Object.keys(values).forEach((language: any) => {
        i18n.addResourceBundle(language, `caption-${key}`, values[language]);
      });
    }
  };

  useEffect(() => {
    initializeHeadlessEngine()
      .then((engine) => {
        settingContextFromEngineFirstTime(engine);
        setEngine(engine);
      })
      .catch((error) => {
        console.error("Failed to initialize headless engine:", error);
        setEngineError(`Headless Engine Error: ${error.message}`);
      });

    initializeCommerceHeadlessEngine()
      .then((engine) => {
        settingCommerceContextFromEngineFirstTime(engine);
        setCommerceEngine(engine);
      })
      .catch((error) => {
        console.error("Failed to initialize commerce engine:", error);
        setEngineError(`Commerce Engine Error: ${error.message}`);
      });
  }, []);

  const RoutingComponent = (
    <>
      <style>{AtomicTheme}</style>
      <QuickViewModalProvider>
        <CustomContextProvider>
          <Router>
            <Header />
            <QuickViewModal />
            <Routes>
              <Route
                path="/"
                element={
                  <Navigate
                    to={isEnvValid() === true ? "/home" : "/error"}
                    replace
                  />
                }
              />
              <Route path="/home" element={<HomePage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route
                path="/search"
                element={<SearchPage engine={commerceEngine} />}
              />
              {EnableContentSearch && (
                <Route
                  path="/search/:filter"
                  element={<ContentSearchPage engine={engine} />}
                />
              )}
              {/* MPGPage reads the commerce engine from CommerceEngineContext itself,
                  so unlike the sibling routes it takes no engine prop. */}
              <Route path="/mpg" element={<MPGPage />} />
              {/* Commerce Product Listing Pages. One config-driven component serves every
                  configured specialty, so a new listing page is a config entry only. */}
              <Route
                path="/specialty/:specialtySlug"
                element={<ProviderListingPage />}
              />
              {/* Keyed on ec_product_id, and takes no engine prop for the same reason
                  /mpg does not. */}
              <Route
                path="/providers/:providerId"
                element={<ProviderDetailPage />}
              />
              <Route path="/plp/:filter" element={<PLP />} />
              <Route path="/plp/:filter/:secondfilter" element={<PLP />} />
              <Route
                path="/plp/:filter/:secondfilter/:thirdfilter"
                element={<PLP />}
              />
              <Route path="/error" element={<Error />} />
              <Route path="/docs" element={<DocsPage />} />
            </Routes>
            <Footer />
          </Router>
        </CustomContextProvider>
      </QuickViewModalProvider>
    </>
  );

  return (
    <>
      {engineError ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            width: "100vw",
            height: "100vh",
            padding: 4,
          }}
        >
          <Typography variant="h4" color="error" gutterBottom>
            Engine Initialization Failed
          </Typography>
          <Typography variant="body1" color="textSecondary">
            {engineError}
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
            Please check the browser console for more details.
          </Typography>
        </Box>
      ) : commerceEngine && engine ? (
        <EngineProvider value={engine}>
          <CommerceEngineProvider value={commerceEngine}>
            <LanguageContextProvider>
              <LanguageContext.Consumer>
                {({ selectedLanguage }) => (
                  <>
                    {EnableContentSearch ? (
                      <AtomicSearchInterface
                        engine={engine}
                        fieldsToInclude={FieldToIncludesInSearchResults}
                        language={selectedLanguage}
                        localization={(i18n) => {
                          if (!InternationalizationEnabled) return;
                          setCustomTranslations(
                            i18n,
                            CoveoStandardTranslations,
                          );
                          setFacetTranslations(i18n, FacetTranslations);
                        }}
                      >
                        {RoutingComponent}
                      </AtomicSearchInterface>
                    ) : (
                      <>{RoutingComponent}</>
                    )}
                  </>
                )}
              </LanguageContext.Consumer>
            </LanguageContextProvider>
          </CommerceEngineProvider>
        </EngineProvider>
      ) : (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "100vw",
            height: "100vh",
          }}
        >
          <CircularProgress />
        </Box>
      )}
    </>
  );
}

const isEnvValid = () => {
  const variables = [
    "VITE_PLATFORM_URL",
    "VITE_ORGANIZATION_ID",
    "VITE_USER_EMAIL",
    "VITE_COMMERCE_ENGINE_URL",
    "VITE_COMMERCE_ENGINE_TRACKING_ID",
  ];
  const reducer = (previousValue: boolean, currentValue: string) =>
    previousValue && Boolean(import.meta.env[currentValue]);
  return variables.reduce(reducer, true);
};

const Error = () => {
  return (
    <Box height="100vh" display="flex" alignItems="center">
      <Grid
        container
        direction="row"
        justifyContent="center"
        alignItems="center"
      >
        <Grid size={{ xs: 11, md: 9 }}>
          <div className="container">
            <Typography variant="h4" color="error">
              Invalid Environment variables
            </Typography>
            <Typography variant="body1">
              You should have a valid <code>.env</code> file at the root of this
              project. You can use <code>.env.example</code> as starting point
              and make sure to replace all placeholder variables
              <code>&#60;...&#62;</code> by the proper information for your
              organization.
            </Typography>
            <p>
              Refer to the project <b>README</b> file for more information.
            </p>
          </div>
        </Grid>
      </Grid>
    </Box>
  );
};

const AtomicTheme = `
:root {
  --atomic-font-family: inherit;
  --atomic-primary : ${Theme.primary};
  --atomic-on-background : ${Theme.primaryText};
  --atomic-primary-light : ${Theme.primary}80;
  --atomic-primary-dark : ${Theme.primary};
  --atomic-neutral-dark : ${Theme.secondaryText}
  
 }
`;
