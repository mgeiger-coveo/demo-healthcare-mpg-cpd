import {
  FunctionComponent,
  useEffect,
  useState,
  useContext,
  useMemo,
  useRef,
} from "react";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import { SearchBox as HeadlessSearchBox } from "@coveo/headless";
import EngineContext, {
  CommerceEngineContext,
} from "../../common/engineContext";
import parse from "autosuggest-highlight/parse";
import match from "autosuggest-highlight/match";
import Button from "@mui/material/Button";
import styled from "styled-components";
import { Icon } from "react-icons-kit";
import { search } from "react-icons-kit/feather/search";
import { SpeechRecognitionButton } from "./SpeechRecognitionButton";
import { IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { SearchConfigTranslations } from "../../config/InternationalizationConfig";
import { LanguageContext } from "../Internationalization/LanguageUtils";
import { buildSearchBox } from "@coveo/headless/commerce";
import { STANDALONE_SEARCHBOX_KEY } from "../HomePage/HomeSearchBox";

interface SearchBoxProps {
  controller: HeadlessSearchBox;
}

const SearchBoxRenderer: FunctionComponent<SearchBoxProps> = (props) => {
  const { controller } = props;
  const [state, setState] = useState(controller.state);
  const { getText } = useContext(LanguageContext);

  useEffect(
    () => controller.subscribe(() => setState(controller.state)),
    [controller],
  );

  const onPressSearchButton = () => {
    controller.submit();
    if (!window.location.href.includes("/search")) {
      window.location.href = "/search";
    }
  };

  return (
    <Container>
      <Autocomplete
        filterOptions={(x) => x}
        inputValue={state.value}
        onInputChange={(_, newInputValue) => {
          controller.updateText(newInputValue);
          localStorage.setItem(
            STANDALONE_SEARCHBOX_KEY,
            JSON.stringify({ value: newInputValue }),
          );
        }}
        onChange={() => {
          controller.submit();
        }}
        options={state.suggestions.map((suggestion) => suggestion.rawValue)}
        freeSolo
        style={{ width: "100%", background: "white", borderRadius: "5px" }}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder={getText(
              "Search",
              SearchConfigTranslations,
              "searchPlaceholder",
            )}
            size="small"
            className="search-box"
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <EndButtons>
                  {state.value.length > 0 && (
                    <ClearButton
                      onClick={() => {
                        localStorage.setItem(
                          STANDALONE_SEARCHBOX_KEY,
                          JSON.stringify({ value: "" }),
                        );
                        controller.updateText("");
                        controller.submit();
                      }}
                    >
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

const SearchBox = () => {
  const commerceEngine = useContext(CommerceEngineContext);
  const hydratedController = useRef<HeadlessSearchBox | null>(null);
  const controller = useMemo(
    () =>
      commerceEngine
        ? buildSearchBox(commerceEngine, {
            options: { numberOfSuggestions: 8 },
          })
        : null,
    [commerceEngine],
  );

  useEffect(() => {
    if (!controller || hydratedController.current === controller) {
      return;
    }

    hydratedController.current = controller;
    const searchqueryObject = localStorage.getItem(STANDALONE_SEARCHBOX_KEY)
      ? JSON.parse(localStorage.getItem(STANDALONE_SEARCHBOX_KEY) as string)
      : null;
    const value = searchqueryObject ? searchqueryObject.value : "";

    controller.updateText(value);
    controller.submit();
  }, [controller]);

  if (!controller) {
    return null;
  }

  return <SearchBoxRenderer controller={controller} />;
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
