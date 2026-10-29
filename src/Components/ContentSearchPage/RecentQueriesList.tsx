import {
  buildRecentQueriesList,
  buildSearchBox,
  SearchBox as HeadlessSearchBox,
  RecentQueriesList as RecentQueriesController,
} from "@coveo/headless";
import { useContext, useEffect, useState } from "react";
import { SearchConfigTranslations } from "../../config/InternationalizationConfig";
import { LanguageContext } from "../Internationalization/LanguageUtils";
import usePersistedState from "../../customHooks/usePersistedState";
import { search } from "react-icons-kit/feather/search";
import { minus as Dash } from "react-icons-kit/feather/minus";
import { chevronDown as ChevronDown } from "react-icons-kit/feather/chevronDown";
import { Icon } from "react-icons-kit";
import EngineContext from "../../common/engineContext";
import styled from "styled-components";
import { Theme } from "../../config/theme";

export interface RecentQueriesProps {
  controller: RecentQueriesController;
  searchController: HeadlessSearchBox;
}

export const RecentQueriesList = () => {
  const engine = useContext(EngineContext)!;
  const queriesList = JSON.parse(localStorage.getItem("recent-queries")!);
  const controller = buildRecentQueriesList(engine, {
    initialState: { queries: queriesList || [] },
  });
  const searchController = buildSearchBox(engine);
  return (
    <RecentQueriesListRenderer
      controller={controller}
      searchController={searchController}
    />
  );
};

const RecentQueriesListRenderer: React.FunctionComponent<RecentQueriesProps> = (
  props,
) => {
  const { controller, searchController } = props;
  const { getText } = useContext(LanguageContext);
  const [state, setState] = useState(controller.state);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    controller.subscribe(() => {
      setState(controller.state);
      localStorage.setItem(
        "recent-queries",
        JSON.stringify(controller.state.queries),
      );
    });
  }, []);

  if (state.queries.length === 0) {
    return null;
  }

  return (
    <Container>
      <TitleContainer>
        <p>
          {getText("Recent Queries", SearchConfigTranslations, "recentQueries")}
        </p>
        <CollapseIcon
          icon={isCollapsed ? ChevronDown : Dash}
          onClick={() => setIsCollapsed(!isCollapsed)}
        />
      </TitleContainer>
      {!isCollapsed && (
        <List>
          {state.queries.map((query, index) => {
            return (
              <ListItem
                key={`recentQuery-${index}`}
                onClick={() => {
                  searchController.updateText(query);
                  searchController.submit();
                }}
              >
                <SearchIcon
                  key={index}
                  icon={search}
                  className="recentQuery-icon"
                />
                <RedirectButton key={`${query}-${index}`}>
                  {query}
                </RedirectButton>
              </ListItem>
            );
          })}
        </List>
      )}
    </Container>
  );
};

const Container = styled.div`
  border-radius: var(--atomic-border-radius-lg);
  border: solid var(--atomic-neutral) 1px;
  font-family: var(--atomic-font-family);
  padding-left: 1rem;
  padding-bottom: 0.75rem;
  padding-top: 0.75rem;
  margin-bottom: 1rem;
  margin-top: 0.35rem;
  width: 380px;
  margin-left: auto;
  margin-right: auto;
`;

const TitleContainer = styled.div`
  color: black;
  font-size: var(--atomic-text-lg);
  letter-spacing: 0.5px;
  margin-bottom: 1rem;
  display: flex;
  align-content: center;
  font-weight: var(--atomic-font-bold);
`;

const List = styled.ul`
  list-style-type: none;
  padding-inline-start: 0;
  padding-right: 2rem;
`;

const CollapseIcon = styled(Icon)`
  margin-left: auto;
  margin-right: 1rem;
  cursor: pointer;
`;

const SearchIcon = styled(Icon)`
  color: ${Theme.primaryText};
  min-width: 25px;
`;

const RedirectButton = styled.a`
  color: ${Theme.primaryText};
  text-decoration: none;
  display: block;
  cursor: pointer;
  background: none;
  border: none;
`;

const ListItem = styled.li`
  display: flex;
  margin: 5px 0px;

  &:hover ${SearchIcon}, &:hover ${RedirectButton} {
    color: ${Theme.primary};
  }
`;
