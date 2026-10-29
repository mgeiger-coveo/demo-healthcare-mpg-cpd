import { useState, useEffect, useContext } from "react";
import EngineContext from "../../common/engineContext";
import { getSearchToken } from "../../common/Engine";
import { List, ListItem, Typography } from "@mui/material";

interface QuerySuggestCompletion {
  expression: string;
  score: number;
  highlighted: string;
  executableConfidence: number;
}
import styled from "styled-components";
import { Theme } from "../../config/theme";
import { SearchPageTabConfig } from "../../config/SearchConfig";
import { encodeCustomSearchTab } from "./SearchTabs";

const Title = styled.div`
  font-size: 24px;
  font-weight: 500;
  font-family: inherit;
  color: ${Theme.primaryText};
  margin-top: 30px;
  margin-bottom: 10px;
`;

const SuggestionLink = styled.p`
  text-decoration: none;
  color: ${Theme.primary};
  cursor: pointer;
  font-size: 16px;

  &:hover {
    text-decoration: underline;
  }
`;

const QuerySuggestion = () => {
  const [suggestions, setSuggestions] = useState([]);
  const engine = useContext(EngineContext)!;

  useEffect(() => {
    getSearchToken().then((tk) => {
      fetch(
        `${import.meta.env.VITE_PLATFORM_URL}/rest/search/v2/querySuggest?locale=en&searchHub=${import.meta.env.VITE_SEARCH_HUB}&organizationId=${import.meta.env.VITE_ORGANIZATION_ID}`,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${tk}`,
          },
        },
      )
        .then((res) => res.json())
        .then((data) => {
          console.log(data);
          setSuggestions(data.completions);
        });
    });
  }, [engine]);

  const handleSuggestionClick = (expression: string) => {
    const newHref = `/search/${encodeCustomSearchTab(SearchPageTabConfig[0]?.caption)}#q=${encodeURIComponent(expression)}&tab=${encodeURIComponent(SearchPageTabConfig[0]?.caption)}`;
    window.location.href = newHref;
    window.scrollTo(0, 0);
  };

  return (
    <div>
      {suggestions?.length > 0 && (
        <>
          <Title>Popular Search Terms:</Title>
          <List>
            {suggestions.map((suggestion: QuerySuggestCompletion, index) => (
              <ListItem key={index}>
                <SuggestionLink
                  onClick={() => handleSuggestionClick(suggestion.expression)}
                >
                  {suggestion.expression}
                </SuggestionLink>
              </ListItem>
            ))}
          </List>
        </>
      )}
    </div>
  );
};

export default QuerySuggestion;
