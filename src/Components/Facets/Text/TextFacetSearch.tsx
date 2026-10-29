import {
  RegularFacet as HeadlessFacet,
  RegularFacetState,
  RegularFacetValue,
  RegularFacetSearchResult,
} from "@coveo/headless/commerce";
import { Autocomplete, TextField, InputAdornment, Box } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useState } from "react";

export interface IFacetSearchProps {
  controller: HeadlessFacet;
  facetState: RegularFacetState;
}

export default function TextFacetSearch({
  controller,
  facetState,
}: IFacetSearchProps) {
  const [value, setValue] = useState("");

  const onInput = (event: any, newValue: string) => {
    setValue(newValue);
    controller.facetSearch.updateText(newValue);
    if (newValue === "") {
      controller.facetSearch.clear();
      return;
    }
    controller.facetSearch.search();
  };

  const onSelect = (event: any, value: RegularFacetSearchResult | null) => {
    if (value) {
      controller.facetSearch.select(value);
      controller.facetSearch.clear();
      setValue("");
    }
  };

  const onClear = () => {
    controller.facetSearch.clear();
  };

  const isLoading = () => {
    return facetState.isLoading;
  };

  const hasNoResults = () => {
    return (
      facetState.facetSearch.query !== "" && facetState.values.length === 0
    );
  };

  return (
    <Box>
      <Autocomplete
        freeSolo
        inputValue={value}
        filterOptions={(x) => x}
        onInputChange={onInput}
        options={facetState.facetSearch.values}
        getOptionLabel={(option: RegularFacetSearchResult) =>
          option.displayValue
        }
        loading={isLoading()}
        noOptionsText={
          hasNoResults() ? "No matching values." : "Type to search"
        }
        onChange={onSelect}
        disableClearable={true}
        renderInput={(params) => (
          <TextField
            {...params}
            variant="outlined"
            fullWidth
            size="small"
            inputProps={{
              ...params.inputProps,
              type: "search",
              onEmptied: onClear,
            }}
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: <>{params.InputProps.endAdornment}</>,
            }}
            sx={{
              ".MuiOutlinedInput-root": {
                "& fieldset": {
                  borderRadius: "5px", // Customize the border radius to match the style
                },
              },
              ".MuiInputLabel-root": {
                top: "-5px", // Adjust the position of the label
              },
            }}
          />
        )}
        renderOption={(props, option: RegularFacetSearchResult) => (
          <li {...props} key={option.rawValue}>
            {option.displayValue}
          </li>
        )}
      />
    </Box>
  );
}
