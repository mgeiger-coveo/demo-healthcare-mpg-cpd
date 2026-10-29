import { FunctionComponent, useContext } from "react";
import Typography from "@mui/material/Typography";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { LanguageContext } from "../Internationalization/LanguageUtils";
import { MPGConfigTranslations } from "../../config/InternationalizationConfig";
import {
  MPG_PROVIDER_BACK_LABEL,
  MPG_PROVIDER_NOT_FOUND_BODY,
  MPG_PROVIDER_NOT_FOUND_TITLE,
} from "../../config/MPGConfig";
import { Theme } from "../../config/theme";

const ProviderNotFound: FunctionComponent = () => {
  const { getText } = useContext(LanguageContext);

  return (
    <>
      <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
        {getText(
          MPG_PROVIDER_NOT_FOUND_TITLE,
          MPGConfigTranslations,
          "providerNotFoundTitle",
        )}
      </Typography>
      <Typography
        variant="body1"
        sx={{ color: Theme.secondaryText, marginTop: "8px" }}
      >
        {getText(
          MPG_PROVIDER_NOT_FOUND_BODY,
          MPGConfigTranslations,
          "providerNotFoundBody",
        )}
      </Typography>
      <BackLink to="/mpg">
        {getText(
          MPG_PROVIDER_BACK_LABEL,
          MPGConfigTranslations,
          "providerBackLabel",
        )}
      </BackLink>
    </>
  );
};

export default ProviderNotFound;

const BackLink = styled(Link)`
  display: inline-block;
  margin-top: 20px;
  color: ${Theme.primary};
  font-weight: 600;
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
  &:focus-visible {
    outline: 2px solid ${Theme.primary};
    outline-offset: 2px;
  }
`;
