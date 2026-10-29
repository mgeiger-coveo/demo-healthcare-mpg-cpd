import { FunctionComponent, useEffect, useState, useContext } from "react";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import {
  SearchBox as HeadlessSearchBox,
  StandaloneSearchBoxOptions,
} from "@coveo/headless";
import EngineContext, {
  CommerceEngineContext,
} from "../../common/engineContext";
import { useLocation, useNavigate } from "react-router-dom";
import Button from "@mui/material/Button";
import styled from "styled-components";
import parse from "autosuggest-highlight/parse";
import match from "autosuggest-highlight/match";
import { Icon } from "react-icons-kit";
import { search } from "react-icons-kit/feather/search";
import { SpeechRecognitionButton } from "../SearchPage/SpeechRecognitionButton";
import { IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { SearchConfigTranslations } from "../../config/InternationalizationConfig";
import { LanguageContext } from "../Internationalization/LanguageUtils";
import {
  buildSearchBox,
  buildStandaloneSearchBox,
  StandaloneSearchBox,
} from "@coveo/headless/commerce";

interface SearchBoxProps {
  controller: StandaloneSearchBox;
  toggleSearchBox: () => void;
}

export const STANDALONE_SEARCHBOX_KEY = "CoveoStandaloneSearchBox";

const SearchBoxRenderer: FunctionComponent<SearchBoxProps> = (props) => {
  const { controller } = props;
  const [state, setState] = useState(controller.state);
  const { getText } = useContext(LanguageContext);
  console.log("test", state);
  let navigate = useNavigate();

  useEffect(
    () => controller.subscribe(() => setState(controller.state)),
    [controller],
  );

  const location = useLocation();

  const onPressSearchButton = (e) => {
    props.toggleSearchBox();
    controller.submit();
    setState((prev) => ({ ...prev, redirectTo: "/search" }));
  };

  if (!state) {
    return null;
  }

  if (state.redirectTo) {
    const { redirectTo, value } = state;
    const data = JSON.stringify({ value });
    localStorage.setItem(STANDALONE_SEARCHBOX_KEY, data);
    window.location.href = redirectTo;
    return null;
  }

  return (
    <Container>
      <Autocomplete
        filterOptions={(x) => x}
        inputValue={state.value}
        onInputChange={(_, newInputValue) => {
          controller.updateText(newInputValue);
        }}
        onChange={(e) => {
          if (controller.state.value !== "") {
            props.toggleSearchBox();
            controller.submit();
            setState((prev) => ({ ...prev, redirectTo: "/search" }));
          }
        }}
        options={state.suggestions.map((suggestion) => suggestion.rawValue)}
        freeSolo
        style={{ width: "100%" }}
        renderInput={(params) => (
          <TextField
            {...params}
            className="home-search-box"
            placeholder={getText(
              "Search",
              SearchConfigTranslations,
              "searchPlaceholder",
            )}
            size="small"
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <EndButtons>
                  {state.value.length > 0 && (
                    <ClearButton onClick={() => controller.updateText("")}>
                      <CloseIcon />
                    </ClearButton>
                  )}
                  <SpeechRecognitionButton
                    controller={controller}
                  ></SpeechRecognitionButton>
                </EndButtons>
              ),
            }}
          />
        )}
        renderOption={(props, option, { inputValue }) => {
          const matches = match(option, inputValue);
          const parts = parse(option, matches);
          return (
            <li {...props}>
              <div>
                {parts.map((part, index) => (
                  <span
                    key={index}
                    style={{
                      fontWeight: part.highlight ? 500 : 300,
                    }}
                  >
                    {part.text}
                  </span>
                ))}
              </div>
            </li>
          );
        }}
      />
      <SearchButton
        type="submit"
        variant="contained"
        style={{ height: "43px", marginLeft: "10px" }}
        onClick={onPressSearchButton}
      >
        <Icon icon={search} size={24} />
      </SearchButton>
    </Container>
  );
};

interface SearchBoxType {
  toggleSearchBox: () => void;
}

const SearchBox = ({ toggleSearchBox }: SearchBoxType) => {
  const engine = useContext(EngineContext)!;
  const commerceEngine = useContext(CommerceEngineContext)!;
  if (!commerceEngine) {
    return null;
  }
  const controller = buildStandaloneSearchBox(commerceEngine, {
    options: {
      redirectionUrl: "/search",
    },
  });
  controller.updateText("");
  return (
    <SearchBoxRenderer
      controller={controller}
      toggleSearchBox={toggleSearchBox}
    />
  );
};

export default SearchBox;

const Container = styled.div`
  display: flex;
  flex-direction: row;
`;

const SearchButton = styled(Button)`
  height: 43px;
  margin-left: 10px;
`;

const EndButtons = styled.div`
  display: flex;
  flex-direction: row;
  gap: 5px;
  padding: 0 4px;
`;

const ClearButton = styled(IconButton)`
  transform: scale(0.75);
  padding: 0;
`;
