import {
  ClickAnalyticsActionCreators,
  RecentResultsList as RecentResultsController,
  Result,
  buildRecentResultsList,
  loadClickAnalyticsActions,
} from "@coveo/headless";
import { useContext, useEffect, useState } from "react";
import usePersistedState from "../../customHooks/usePersistedState";
import { minus as Dash } from "react-icons-kit/feather/minus";
import { chevronDown as ChevronDown } from "react-icons-kit/feather/chevronDown";
import { Icon } from "react-icons-kit";
import EngineContext from "../../common/engineContext";
import styled from "styled-components";
import { Theme } from "../../config/theme";
import { LanguageContext } from "../Internationalization/LanguageUtils";
import { SearchConfigTranslations } from "../../config/InternationalizationConfig";

export interface ResultsListsProps {
  controller: RecentResultsController;
  logRecentResultClick: (result: Result) => void;
}

export const RecentResultsList = () => {
  const engine = useContext(EngineContext)!;
  const resultsList = JSON.parse(localStorage.getItem("recent-results")!);
  const logRecentResultClick = (result: Result) => {
    const actionToDispatch =
      loadClickAnalyticsActions(engine).logDocumentOpen(result);
    engine.dispatch(actionToDispatch);
  };
  const controller = buildRecentResultsList(engine, {
    initialState: { results: resultsList || [] },
  });

  return (
    <RecentResultsListRenderer
      controller={controller}
      logRecentResultClick={logRecentResultClick}
    />
  );
};

const RecentResultsListRenderer: React.FunctionComponent<ResultsListsProps> = (
  props,
) => {
  const { controller, logRecentResultClick } = props;
  const [state, setState] = useState(controller.state);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { getText } = useContext(LanguageContext);

  useEffect(() => {
    controller.subscribe(() => {
      setState(controller.state);
      localStorage.setItem(
        "recent-results",
        JSON.stringify(controller.state.results),
      );
    });
  }, []);

  if (state.results.length === 0) {
    return null;
  }

  return (
    <Container>
      <TitleContainer>
        <p>
          {getText("Recent Results", SearchConfigTranslations, "recentResults")}
        </p>
        <CollapseIcon
          icon={isCollapsed ? ChevronDown : Dash}
          className="collapse-icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
        />
      </TitleContainer>
      {!isCollapsed && (
        <List className="recentResults-list">
          {state.results.map((result) => {
            return (
              <RedirectLink
                key={result.uniqueId}
                target="_blank"
                href={`${result.clickUri}`}
                rel="noopener"
                onClick={() => logRecentResultClick(result)}
              >
                {result.title}
              </RedirectLink>
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
  display: flex;
  flex-direction: column;
`;

const CollapseIcon = styled(Icon)`
  margin-left: auto;
  margin-right: 1rem;
  cursor: pointer;
`;

const ListItem = styled.li`
  display: flex;
  align-items: flex-end;
  cursor: pointer;
`;

const SearchIcon = styled(Icon)`
  color: var(--atomic-primary);
`;

const RedirectLink = styled.a`
  color: ${Theme.primaryText};
  margin: 5px 0px;
  text-decoration: none;
  display: inline-block;
  font-size: var(--atomic-text-base);

  &:hover {
    text-decoration: underline;
    color: ${Theme.primary};
  }
`;
