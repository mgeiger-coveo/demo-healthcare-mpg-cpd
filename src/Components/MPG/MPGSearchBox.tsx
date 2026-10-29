import { FunctionComponent, useContext, useEffect, useState } from "react";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import { useNavigate } from "react-router-dom";
import { InstantProducts } from "@coveo/headless/commerce";
import parse from "autosuggest-highlight/parse";
import match from "autosuggest-highlight/match";
import { Icon } from "react-icons-kit";
import { search } from "react-icons-kit/feather/search";
import styled from "styled-components";
import ProviderPhoto from "../ProviderDetail/ProviderPhoto";
import {
  buildProviderSuggestionLine,
  getProviderDetailPath,
  selectProviderImageUrl,
} from "./mpgUtils";
import { SearchBoxModel } from "./searchBoxModel";
import {
  formatTemplate,
  getProviderInitials,
} from "../ProviderDetail/providerDetailUtils";
import { LanguageContext } from "../Internationalization/LanguageUtils";
import { MPGConfigTranslations } from "../../config/InternationalizationConfig";
import {
  MPG_PRODUCT_SUGGESTION_DEBOUNCE_MS,
  MPG_PRODUCT_SUGGESTION_LIMIT,
  MPG_PRODUCT_SUGGESTIONS_GROUP_LABEL,
  MPG_PROVIDER_CARD_FIELDS,
  MPG_PROVIDER_ID_FIELD,
  MPG_PROVIDER_IMAGE_FIELDS,
  MPG_PROVIDER_IMAGE_SIZES,
  MPG_PROVIDER_PHOTO_ALT_TEMPLATE,
  MPG_QUERY_SUGGESTION_LIMIT,
  MPG_QUERY_SUGGESTIONS_GROUP_LABEL,
  MPG_SEARCH_CLEAR_LABEL,
  MPG_SEARCH_INPUT_LABEL,
  MPG_SEARCH_PLACEHOLDER,
  MPG_SEARCH_SUBMIT_LABEL,
  MPG_SUGGESTION_COUNT_TEMPLATE,
} from "../../config/MPGConfig";
import { Theme } from "../../config/theme";

interface MPGSearchBoxProps {
  // The text model decides what submitting does: the search page's model runs a Commerce
  // search, a listing page's model navigates to the search page. Nothing else in this
  // component knows the difference.
  model: SearchBoxModel;
  instantProducts: InstantProducts;
  // Where the provider detail page's back link should return to. Defaults to /mpg with
  // its current hash, which is what the search page needs.
  fromPath?: string;
}

// One dropdown, two kinds of row: a query to run and a provider to open. The tagged
// union is what lets getOptionLabel / groupBy / onChange tell them apart.
type QuerySuggestionOption = { kind: "query"; value: string };
type ProductSuggestionOption = { kind: "product"; product: any };
type SuggestionOption = QuerySuggestionOption | ProductSuggestionOption;

const MPG_SEARCH_INPUT_ID = "mpg-search-input";

const MPGSearchBox: FunctionComponent<MPGSearchBoxProps> = (props) => {
  const {
    model,
    instantProducts,
    fromPath = `/mpg${window.location.hash}`,
  } = props;
  const [instantProductsState, setInstantProductsState] = useState(
    instantProducts.state,
  );
  const [isOpen, setIsOpen] = useState(false);
  // A restored query (/mpg#q=cardio) paints the input without the user asking for a
  // dropdown, so product suggestions are only requested once someone actually types.
  const [hasTyped, setHasTyped] = useState(false);
  const { getText } = useContext(LanguageContext);
  const navigate = useNavigate();

  useEffect(
    () =>
      instantProducts.subscribe(() =>
        setInstantProductsState(instantProducts.state),
      ),
    [instantProducts],
  );

  // Product suggestions are asked for once the typing settles rather than per keystroke.
  // `updateQuery("")` is a no-op in headless and the controller caches per query, so an
  // empty or repeated box issues no request at all.
  useEffect(() => {
    if (!hasTyped) return;
    const value = model.value;
    const timer = setTimeout(() => {
      instantProducts.updateQuery(value);
    }, MPG_PRODUCT_SUGGESTION_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [model.value, hasTyped, instantProducts]);

  const inputLabel = getText(
    MPG_SEARCH_INPUT_LABEL,
    MPGConfigTranslations,
    "searchInputLabel",
  );
  const submitLabel = getText(
    MPG_SEARCH_SUBMIT_LABEL,
    MPGConfigTranslations,
    "searchSubmitLabel",
  );
  const clearLabel = getText(
    MPG_SEARCH_CLEAR_LABEL,
    MPGConfigTranslations,
    "searchClearLabel",
  );
  const queryGroupLabel = getText(
    MPG_QUERY_SUGGESTIONS_GROUP_LABEL,
    MPGConfigTranslations,
    "querySuggestionsGroupLabel",
  );
  const productGroupLabel = getText(
    MPG_PRODUCT_SUGGESTIONS_GROUP_LABEL,
    MPGConfigTranslations,
    "productSuggestionsGroupLabel",
  );

  // The commerce SearchBoxOptions carries no numberOfSuggestions, so both limits are
  // applied here rather than asked of the API.
  // An empty box shows nothing: the instant-products cache keeps the last query's
  // products, which would otherwise linger after the input is cleared.
  const hasText = model.value.trim().length > 0;
  const options: SuggestionOption[] = !hasText
    ? []
    : [
        ...model.suggestions.slice(0, MPG_QUERY_SUGGESTION_LIMIT).map(
          (suggestion): SuggestionOption => ({
            kind: "query",
            value: suggestion.rawValue,
          }),
        ),
        ...instantProductsState.products
          .slice(0, MPG_PRODUCT_SUGGESTION_LIMIT)
          .map((product): SuggestionOption => ({ kind: "product", product })),
      ];

  const optionLabel = (option: SuggestionOption | string) => {
    if (typeof option === "string") return option;
    if (option.kind === "query") return option.value;
    const name = option.product?.[MPG_PROVIDER_CARD_FIELDS.name];
    return name ? String(name) : "";
  };

  // Identity of an option across both kinds, so MUI can compare a selected value to the
  // refreshed option list without reading a field the other shape does not have.
  const optionKey = (option: SuggestionOption | string) => {
    if (typeof option === "string") return `query:${option}`;
    if (option.kind === "query") return `query:${option.value}`;
    return `product:${option.product?.[MPG_PROVIDER_ID_FIELD]}`;
  };

  const openProvider = (product: any) => {
    const detailPath = getProviderDetailPath(product, MPG_PROVIDER_ID_FIELD);
    if (!detailPath) return;
    // Click analytics attach to the productSuggest response, then the same `from`
    // capture ProviderCard uses so the detail page's back link restores this page.
    instantProducts.interactiveProduct({ options: { product } }).select();
    navigate(detailPath, {
      state: { product, from: fromPath },
    });
  };

  return (
    <Container>
      <VisuallyHiddenLabel htmlFor={MPG_SEARCH_INPUT_ID}>
        {inputLabel}
      </VisuallyHiddenLabel>
      <Autocomplete
        // Suggestions are already filtered server-side; MUI must not filter again.
        filterOptions={(x) => x}
        options={options}
        inputValue={model.value}
        open={isOpen && options.length > 0}
        onOpen={() => setIsOpen(true)}
        onClose={() => setIsOpen(false)}
        onInputChange={(_, newInputValue, reason) => {
          // "reset" fires when MUI writes a selected option's label back into the box;
          // only real typing should drive the model.
          if (reason !== "input") return;
          setHasTyped(true);
          model.updateText(newInputValue);
        }}
        onChange={(_, option) => {
          if (!option) return;
          if (typeof option === "string") {
            model.submitQuery(option);
            return;
          }
          if (option.kind === "query") {
            // On the search page this delegates to the controller, which logs the
            // suggestion-select event and submits, so submitting again would double the
            // search.
            model.selectSuggestion(option.value);
            return;
          }
          openProvider(option.product);
        }}
        getOptionLabel={optionLabel}
        isOptionEqualToValue={(option, value) =>
          optionKey(option) === optionKey(value)
        }
        // `freeSolo` widens the option type with the raw string case, which never reaches
        // the option list here — only the two tagged shapes do.
        groupBy={(option) =>
          typeof option !== "string" && option.kind === "product"
            ? productGroupLabel
            : queryGroupLabel
        }
        freeSolo
        // No implicit highlight, so Tab and a bare Enter never select a suggestion the
        // user did not move to.
        autoHighlight={false}
        blurOnSelect
        clearOnBlur={false}
        handleHomeEndKeys={false}
        style={{ width: "100%" }}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder={getText(
              MPG_SEARCH_PLACEHOLDER,
              MPGConfigTranslations,
              "searchPlaceholder",
            )}
            fullWidth
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <InputAdornment position="start">
                  <SubmitButton
                    type="button"
                    aria-label={submitLabel}
                    onClick={() => model.submitQuery(model.value)}
                  >
                    <SearchIconWrapper>
                      <Icon icon={search} size={20} />
                    </SearchIconWrapper>
                  </SubmitButton>
                </InputAdornment>
              ),
              endAdornment: model.value ? (
                <InputAdornment position="end">
                  <IconButton
                    type="button"
                    size="small"
                    aria-label={clearLabel}
                    onClick={() => {
                      // On the search page the model's clear re-runs the now-empty
                      // search; clearFilters is false there, so the unfiltered listing
                      // comes back with the facet selections still applied.
                      setHasTyped(false);
                      setIsOpen(false);
                      model.clear();
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
            inputProps={{
              ...params.inputProps,
              // Set on the input itself so both the visually hidden <label for> and the
              // aria-label resolve to the real control.
              id: MPG_SEARCH_INPUT_ID,
              "aria-label": inputLabel,
              autoComplete: "off",
            }}
          />
        )}
        renderOption={(optionProps, rawOption, { inputValue }) => {
          const { key, ...liProps } = optionProps as any;
          const option = rawOption as SuggestionOption;

          if (option.kind === "query") {
            const parts = parse(option.value, match(option.value, inputValue));
            return (
              <li key={key} {...liProps}>
                <div>
                  {parts.map((part, index) => (
                    <span
                      key={index}
                      style={{ fontWeight: part.highlight ? 500 : 300 }}
                    >
                      {part.text}
                    </span>
                  ))}
                </div>
              </li>
            );
          }

          const { product } = option;
          const name = optionLabel(option);
          const parts = parse(name, match(name, inputValue));
          const specialtyLine = buildProviderSuggestionLine(
            product,
            MPG_PROVIDER_CARD_FIELDS.specialties,
          );

          return (
            <li key={key} {...liProps}>
              <ProductRow>
                <ProviderPhoto
                  imageUrl={selectProviderImageUrl(
                    product,
                    MPG_PROVIDER_IMAGE_FIELDS,
                    "small",
                  )}
                  alt={formatTemplate(
                    getText(
                      MPG_PROVIDER_PHOTO_ALT_TEMPLATE,
                      MPGConfigTranslations,
                      "providerPhotoAltTemplate",
                    ),
                    { name },
                  )}
                  initials={getProviderInitials(name)}
                  size={MPG_PROVIDER_IMAGE_SIZES.suggestion}
                  radius={20}
                />
                <ProductText>
                  <div>
                    {parts.map((part, index) => (
                      <span
                        key={index}
                        style={{ fontWeight: part.highlight ? 600 : 400 }}
                      >
                        {part.text}
                      </span>
                    ))}
                  </div>
                  {specialtyLine && (
                    <Typography
                      variant="caption"
                      component="p"
                      sx={{ color: Theme.secondaryText }}
                    >
                      {specialtyLine}
                    </Typography>
                  )}
                </ProductText>
              </ProductRow>
            </li>
          );
        }}
      />
      {isOpen && options.length > 0 && (
        <VisuallyHidden aria-live="polite">
          {formatTemplate(
            getText(
              MPG_SUGGESTION_COUNT_TEMPLATE,
              MPGConfigTranslations,
              "suggestionCountTemplate",
            ),
            { count: String(options.length) },
          )}
        </VisuallyHidden>
      )}
    </Container>
  );
};

export default MPGSearchBox;

const Container = styled.div`
  width: 100%;
  position: relative;
  .MuiOutlinedInput-root {
    border-radius: 28px;
    background: #ffffff;
    padding-left: 6px;
  }
`;

const SearchIconWrapper = styled.span`
  display: flex;
  align-items: center;
  color: ${Theme.searchIcon};
`;

const SubmitButton = styled(IconButton)`
  padding: 6px;
  &:focus-visible {
    outline: 2px solid ${Theme.secondary};
    outline-offset: 2px;
  }
`;

const ProductRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  width: 100%;
`;

const ProductText = styled.div`
  min-width: 0;
  font-size: 14px;
  overflow-wrap: anywhere;
`;

const VisuallyHiddenLabel = styled.label`
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

const VisuallyHidden = styled.div`
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
