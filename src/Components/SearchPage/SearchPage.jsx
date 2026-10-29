import React, { useContext, useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import SearchBox from "./SearchBox";
import { Theme } from "../../config/theme";
import { SearchConfigTranslations } from "../../config/InternationalizationConfig";
import { LanguageContext } from "../Internationalization/LanguageUtils";
import SearchSideBarRecommendationList from "./SearchSideBarRecommendationList";
import { useParams } from "react-router-dom";
import {
  SearchBarTitle,
  NoResultRecommendationConfig,
  EnableContentSearch,
} from "../../config/SearchConfig";
import styled from "styled-components";
import PoweredBy from "./PoweredBy";
import RedirectionTrigger from "./RedirectionTrigger";
import NotifyTrigger from "./NotifyTrigger";
import EngineContext, {
  CommerceEngineContext,
} from "../../common/engineContext";
import { QuickViewModalContext } from "./QuickViewModalContext";
import ResultsList from "./ResultsList";
import FacetsList from "./FacetsList";
import BreadcrumbManager from "./BreadcrumbManager";
import Summary from "./Summary";
import DidYouMean from "./DidYouMean";
import SortComponent from "./SortComponent";

import PaginationManager from "./PaginationManager";
import SearchTabs from "../ContentSearchPage/SearchTabs";
import PictureFacet from "../Facets/PictureFacet/PictureFacet";

const SearchPage = (props) => {
  const { getText } = useContext(LanguageContext);
  const commerceEngine = useContext(CommerceEngineContext);
  if (commerceEngine === null) return <div>Loading...</div>;

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
      {EnableContentSearch && <SearchTabs filterSelected={""} />}

      <SearchInterfaceContainer>
        <SearchWrapper>
          <FacetContainer>
            <FacetsList engine={commerceEngine} />
          </FacetContainer>
          <ResultsListContainer>
            {/*  To use the PictureFacet component, make sure the field is included in the list of additionalFields 
                  The PictureFacet only works with text facet field
             */}
            {/*  <PictureFacet engine={commerceEngine} field={"ec_brand"}/> */}
            <BreadcrumbManager engine={commerceEngine} />
            <DidYouMean engine={commerceEngine} />
            <Summary engine={commerceEngine} />
            <SortComponent engine={commerceEngine} />
            <ResultsList engine={commerceEngine} />
            <PaginationManager engine={commerceEngine} />
          </ResultsListContainer>
        </SearchWrapper>

        {/*         <RecentsBoxContainer>
          <SideBarRecommendation filter={filter} engine={Engine}>
          {EnableRecentQueries && <RecentQueriesList />}
          {EnableRecentResultList &&  <RecentResultsList />}
          </SideBarRecommendation>
        </RecentsBoxContainer> */}
      </SearchInterfaceContainer>
    </>
  );
};

export default SearchPage;

export const SearchBoxContainer = styled.div`
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

export const SearchInterfaceContainer = styled.div`
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

export const SearchWrapper = styled.div`
  flex: 1;
  max-width: 1600px;
  display: flex;
`;

const SideBarRecommendationContainer = styled.div`
  flex: 1;
  max-width: 400px;
  display: ${(props) => (props.tabHasRecommendation ? "block" : "none")};
  @media (max-width: 768px) {
    display: none;
  }
`;

export const SearchBoxTitleHeading = styled.h6`
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

export const FacetContainer = styled.div`
  display: flex;
  flex: 1;
  width: 100%;
`;

export const ResultsListContainer = styled.div`
  display: flex;
  flex: 3;
  flex-direction: column;
`;
