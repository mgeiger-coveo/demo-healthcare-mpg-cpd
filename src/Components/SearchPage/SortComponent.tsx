import React, { useEffect, useState, useContext } from "react";
import { FormControl, InputLabel, Select, MenuItem, Box } from "@mui/material";
import styled from "styled-components";
import {
  SortBy,
  buildProductListing,
  buildSearch,
} from "@coveo/headless/commerce";
import { SearchConfigTranslations } from "../../config/InternationalizationConfig";
import { LanguageContext } from "../Internationalization/LanguageUtils";

const SortRenderer = ({ sortController }) => {
  const [state, setState] = useState(sortController.state);
  const defaultSort = sortController.state.appliedSort.by;
  const [sortCriterion, setSortCriterion] = useState<SortBy>(defaultSort);
  const { getText } = useContext(LanguageContext);

  useEffect(() => {
    const unsubscribe = sortController.subscribe(() => {
      setState(sortController.state);
    });
    return () => unsubscribe();
  }, [sortController]);

  const handleSortChange = (event) => {
    const newCriterion = event.target.value;

    // Find the selected sort criterion
    const selectedSort = state.availableSorts.find((sort) => {
      if (sort.by === "fields") {
        return sort.fields.some((field) => field.displayName === newCriterion);
      }
      return sort.by === newCriterion;
    });
    if (selectedSort) {
      sortController.sortBy(selectedSort);
      setSortCriterion(newCriterion);
    }
  };

  return (
    <Box display="flex" alignItems="center">
      <SortLabel>
        {getText("Sort by", SearchConfigTranslations, "sortBy")} :{" "}
      </SortLabel>
      <StyledFormControl>
        <Select
          value={sortCriterion}
          onChange={handleSortChange}
          label="Sort By"
          variant="standard"
        >
          {state.availableSorts.map((sort, index) =>
            sort.by === "relevance" ? (
              <MenuItem key={index} value="relevance">
                Relevance
              </MenuItem>
            ) : (
              sort.fields.map((field, index) => (
                <MenuItem key={index} value={field.displayName}>
                  {field.displayName}
                </MenuItem>
              ))
            ),
          )}
        </Select>
      </StyledFormControl>
    </Box>
  );
};

const SortComponent = ({ engine, productListing = false }) => {
  let controller = null;
  if (productListing) {
    controller = buildProductListing(engine);
  } else {
    controller = buildSearch(engine);
  }

  if (controller.state.error) {
    return null;
  }

  const sortController = controller.sort();
  return (
    <SortWrapper>
      <SortRenderer sortController={sortController} />
    </SortWrapper>
  );
};

export default SortComponent;

const SortWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
  width: 100%;
  padding-right: 15px;
`;

const SortLabel = styled.span`
  margin-right: 8px;
  font-size: 18px;
`;

const StyledFormControl = styled(FormControl)`
  width: 200px;
`;
