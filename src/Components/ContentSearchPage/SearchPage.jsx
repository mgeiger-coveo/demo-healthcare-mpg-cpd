import React, { useContext, useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import SearchBox from "./SearchBox";
import { Theme } from "../../config/theme";
import {
  FacetTranslations,
  SearchConfigTranslations,
} from "../../config/InternationalizationConfig";
import { LanguageContext } from "../Internationalization/LanguageUtils";
import SearchSideBarRecommendationList from "./SearchSideBarRecommendationList";
import { useParams } from "react-router-dom";
import SearchTabs, { encodeCustomSearchTab } from "./SearchTabs";
import {
  DefaultSideBarRecommendationConfig,
  EnableRecentQueries,
  EnableRecentResultList,
  SearchPageTabConfig,
  EnableDebugMode,
  EnableSmartSnippetToggle,
  SearchBarTitle,
  EnableGenQAToggle,
  NoResultRecommendationConfig,
} from "../../config/SearchConfig";
import styled from "styled-components";
import PoweredBy from "./PoweredBy";
import MyResultTemplateFunction from "../../config/ContentResultTemplate";
import { AtomicResultList } from "@coveo/atomic-react";
import RedirectionTrigger from "./RedirectionTrigger";
import NotifyTrigger from "./NotifyTrigger";
import EngineContext from "../../common/engineContext";
import { QuickViewModalContext } from "./QuickViewModalContext";
import { RecentQueriesList } from "./RecentQueriesList";
import { RecentResultsList } from "./RecentResultsList";
import { Switch } from "@mui/material";
import RelevanceInspector from "./RelavanceInspector";
import { usePersistedSessionState } from "../../customHooks/usePersistedState";
import NoResult from "./NoResult";
const SSlabel = { inputProps: { "aria-label": "Smart Snippet Switch" } };
const GenQAlabel = {
  inputProps: { "aria-label": "Generative Answering Switch" },
};

const SearchPage = (props) => {
  const { filter } = useParams();
  const { getText } = useContext(LanguageContext);
  const Engine = useContext(EngineContext);
  const QuickViewObj = useContext(QuickViewModalContext);
  const [showSS, setShowSS] = usePersistedSessionState(
    "smart-snippet-enabled",
    !EnableSmartSnippetToggle,
  );
  const [showGenQA, setShowGenQA] = usePersistedSessionState(
    "gen-qa-enabled",
    !EnableGenQAToggle,
  );
  const [displayStyle, setDisplayStyle] = useState("list");

  /*   useEffect(() => {
    if(filter === undefined){
      const firstTab = SearchPageTabConfig[0].caption;
      if(window.location.hash === ""){
        window.location.href = `/search/${firstTab.replace(/\s/g, "")}#tab=${encodeURI(firstTab)}`
      }else{
        window.location.href = `/search/${firstTab.replace(/\s/g, "")}${window.location.hash}`
      }
    }
  }, []); */

  return (
    <>
      <Grid
        container
        justifyContent="center"
        style={{
          background: Theme.searchBarBackground,
          marginTop: "70px",
        }}
      >
        <SearchBoxContainer>
          {SearchBarTitle && (
            <SearchBoxTitleHeading>
              {getText(
                SearchBarTitle,
                SearchConfigTranslations,
                "searchBarTitle",
              )}
            </SearchBoxTitleHeading>
          )}
          <SearchBox />
          {SearchBarTitle && <PoweredBy />}
        </SearchBoxContainer>
      </Grid>
      <SearchTabs filterSelected={filter ? filter : ""} />
      <SearchInterfaceContainer>
        <AtomicSearchWrapper>
          <ToggleButtonContainer>
            {EnableSmartSnippetToggle && (
              <span>
                <Switch
                  {...SSlabel}
                  onChange={() => setShowSS(!showSS)}
                  checked={showSS}
                />
                <label>
                  {getText(
                    "Smart Snippets",
                    SearchConfigTranslations,
                    "smartSnippets",
                  )}
                </label>
              </span>
            )}
            {EnableGenQAToggle && (
              <span>
                <Switch
                  {...GenQAlabel}
                  onChange={() => setShowGenQA(!showGenQA)}
                  checked={showGenQA}
                />
                <label>
                  {getText(
                    "Generative Answering",
                    SearchConfigTranslations,
                    "generativeAnswering",
                  )}
                </label>
              </span>
            )}
          </ToggleButtonContainer>
          {EnableDebugMode && <RelevanceInspector />}
          <RedirectionTrigger />
          <NotifyTrigger />
          <atomic-search-layout>
            <style>{CustomAtomicStyle}</style>
            <atomic-layout-section section="facets">
              <atomic-category-facet
                field="custurlnav"
                label="Category"
                field-id="CategoryFacet"
                heading-level="3"
                sort-criteria="occurrences"
                delimiting-character="|"
                with-search={true}
                facet-id={"custurlnav"}
              ></atomic-category-facet>
              <atomic-facet-manager>
                <atomic-facet
                  field="author"
                  label={getText(
                    "Author",
                    FacetTranslations["author"],
                    "label",
                  )}
                  facet-id={"author"}
                ></atomic-facet>
                <atomic-facet
                  field="source"
                  label={getText(
                    "Source",
                    FacetTranslations["source"],
                    "label",
                  )}
                  facet-id={"source"}
                ></atomic-facet>
                <atomic-facet
                  field="category"
                  label={getText(
                    "Platform Solutions",
                    FacetTranslations["category"],
                    "label",
                  )}
                  facet-id={"category"}
                ></atomic-facet>
                <atomic-facet
                  field="concepts"
                  label={getText(
                    "Concepts",
                    FacetTranslations["concepts"],
                    "label",
                  )}
                  facet-id={"concepts"}
                ></atomic-facet>
              </atomic-facet-manager>
            </atomic-layout-section>

            <atomic-layout-section section="main">
              <atomic-layout-section section="status">
                <atomic-breadbox></atomic-breadbox>
                <atomic-query-summary></atomic-query-summary>
                <atomic-refine-toggle></atomic-refine-toggle>

                <atomic-sort-dropdown>
                  <atomic-sort-expression
                    label="relevance"
                    expression="relevancy"
                  ></atomic-sort-expression>
                  <atomic-sort-expression
                    label="most-recent"
                    expression="date descending"
                  ></atomic-sort-expression>
                </atomic-sort-dropdown>

                <atomic-did-you-mean></atomic-did-you-mean>
              </atomic-layout-section>

              <atomic-layout-section section="results">
                <div style={{ display: showGenQA ? "block" : "none" }}>
                  <atomic-generated-answer></atomic-generated-answer>
                </div>
                <div style={{ display: showSS ? "block" : "none" }}>
                  <atomic-smart-snippet></atomic-smart-snippet>
                  <atomic-smart-snippet-suggestions></atomic-smart-snippet-suggestions>
                </div>
                <AtomicResultList
                  display={displayStyle}
                  template={(result) =>
                    MyResultTemplateFunction(
                      result,
                      QuickViewObj,
                      setDisplayStyle,
                    )
                  }
                ></AtomicResultList>
                <atomic-query-error></atomic-query-error>
                <atomic-no-results>
                  {NoResultRecommendationConfig.enable && (
                    <slot>
                      {NoResultRecommendationConfig.pipeline &&
                      NoResultRecommendationConfig.searchHub ? (
                        <NoResult />
                      ) : (
                        <NoResultSubContainer>
                          <RecentQueriesList />
                          <RecentResultsList />
                        </NoResultSubContainer>
                      )}
                    </slot>
                  )}
                </atomic-no-results>
              </atomic-layout-section>
              <atomic-layout-section section="pagination">
                <atomic-load-more-results></atomic-load-more-results>
              </atomic-layout-section>
              <atomic-layout-section section="pagination">
                <atomic-pager></atomic-pager>
                <atomic-results-per-page></atomic-results-per-page>
              </atomic-layout-section>
            </atomic-layout-section>
          </atomic-search-layout>
        </AtomicSearchWrapper>
        <RecentsBoxContainer>
          <SideBarRecommendation filter={filter} engine={Engine}>
            {EnableRecentQueries && <RecentQueriesList />}
            {EnableRecentResultList && <RecentResultsList />}
          </SideBarRecommendation>
        </RecentsBoxContainer>
      </SearchInterfaceContainer>
    </>
  );
};

export default SearchPage;

export const SideBarRecommendation = ({ filter, engine, children }) => {
  return (
    <>
      {children}
      {DefaultSideBarRecommendationConfig.length > 0 ? (
        <SideBarRecommendationContainer>
          {DefaultSideBarRecommendationConfig.map((item) => {
            return (
              <React.Fragment key={item.title}>
                <SearchSideBarRecommendationList
                  pipeline={item?.pipeline}
                  NumberofResults={item?.NumberofResults}
                  title={item?.title}
                  videoRecommendation={item?.videoRecommendation}
                  imageField={item.imageField}
                  searchHub={item.searchHub}
                />
              </React.Fragment>
            );
          })}
        </SideBarRecommendationContainer>
      ) : (
        <>
          {SearchPageTabConfig.map((tab, index) => {
            const tabHasRecommendation =
              (filter?.toLowerCase() ===
                encodeCustomSearchTab(tab.caption).toLowerCase() ||
                (index === 0 && filter === undefined)) &&
              tab.sideBarRecommendationConfig;

            if (tabHasRecommendation) {
              return (
                <React.Fragment key={tab.caption}>
                  <SideBarRecommendationContainer
                    tabHasRecommendation={tabHasRecommendation}
                  >
                    <>
                      {tab.sideBarRecommendationConfig.map((item) => {
                        return (
                          <React.Fragment key={item.title}>
                            <SearchSideBarRecommendationList
                              pipeline={item.pipeline}
                              NumberofResults={item.NumberofResults}
                              title={item.title}
                              videoRecommendation={item.videoRecommendation}
                              imageField={item.imageField}
                              searchHub={item.searchHub}
                            />
                          </React.Fragment>
                        );
                      })}
                    </>
                  </SideBarRecommendationContainer>
                </React.Fragment>
              );
            }
          })}
        </>
      )}
    </>
  );
};

const SearchBoxContainer = styled.div`
  width: 50%;
  /*   height: 300px; */
  max-width: 800px;
  min-width: 500px;
  /* padding: 130px 0px; */
  padding: 30px 0px;
  @media (max-width: 480px) {
    min-width: 80vw;
  }
`;

const SearchInterfaceContainer = styled.div`
  margin-top: 50px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
`;

const AtomicSearchWrapper = styled.div`
  flex: 3;
  max-width: 1400px;
`;

const SideBarRecommendationContainer = styled.div`
  flex: 1;
  max-width: 400px;
  display: ${(props) => (props.tabHasRecommendation ? "block" : "none")};
  @media (max-width: 768px) {
    display: none;
  }
`;

const SearchBoxTitleHeading = styled.h6`
  text-align: center;
  color: ${Theme.searchBarTitle};
  font-size: 32px;
  font-weight: 500;
  padding-bottom: 5px;
  @media (max-width: 480px) {
    font-size: 25px;
  }
`;

const RecentsBoxContainer = styled.div`
  display: flex;
  flex-direction: column;
  margin-right: 1.5rem;
  @media (max-width: 768px) {
    display: none;
  }
`;

const ToggleButtonContainer = styled.div`
  display: flex;
  width: 360px;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
`;

const NoResultSubContainer = styled.div`
  display: flex;
  justify-content: center;
`;

const CustomAtomicStyle = `
atomic-no-results::part(icon){
  height : ${NoResultRecommendationConfig.enable ? "150px" : "100%"}
}
`;
