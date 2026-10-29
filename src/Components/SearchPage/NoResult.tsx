import React from "react";
import { useEffect, useState, useContext } from "react";
import { NoResultRecommendationConfig } from "../../config/SearchConfig";
import styled from "styled-components";
import { Theme } from "../../config/theme";
import { SkeletonRecommendtionCard } from "../Recommendations/RecommendationCard";
import { SearchConfigTranslations } from "../../config/InternationalizationConfig";
import { LanguageContext } from "../Internationalization/LanguageUtils";
import { buildRecommendations } from "@coveo/headless/commerce";
import { CommerceEngineContext } from "../../common/engineContext";
import ResultTemplate from "../../config/CommerceResultTemplate";
import { Recommendations } from "@coveo/headless/commerce";
import ErrorBanner from "../ErrorBanner/ErrorBanner";

interface NoResultProps {
  controller: Recommendations;
}

const NoResultRenderer: React.FC<NoResultProps> = (props) => {
  const { controller } = props;
  const { getText } = useContext(LanguageContext);
  const [state, setState] = useState(controller.state);

  useEffect(() => {
    controller.refresh();
    controller.subscribe(() => setState(controller.state));
  }, []);

  if (state.error) {
    return (
      <MainWrapper>
        <h2>
          {getText("No Result Found", SearchConfigTranslations, "noResults")}
        </h2>
        <ErrorBanner
          message="Unable to load recommendations."
          details={state.error.message}
          onRetry={() => controller.refresh()}
        />
      </MainWrapper>
    );
  }

  const skeletonArray = [1, 2, 3];
  return (
    <MainWrapper>
      <h2>
        {getText("No Result Found", SearchConfigTranslations, "noResults")}
      </h2>
      <Title>{state.headline}</Title>

      {state.products.length > 0 ? (
        <CardWrapper>
          {state?.products.map((recommendation, index) => {
            return (
              <div
                key={recommendation.ec_product_id}
                style={{ width: "300px", margin: "10px" }}
              >
                <ResultTemplate
                  controller={controller}
                  product={recommendation}
                />
              </div>
            );
          })}
        </CardWrapper>
      ) : (
        <CardWrapper>
          {skeletonArray.map((item, index) => {
            return (
              <div key={item}>
                <SkeletonRecommendtionCard />
              </div>
            );
          })}
        </CardWrapper>
      )}
    </MainWrapper>
  );
};

const NoResult: React.FC = () => {
  const engine = useContext(CommerceEngineContext)!;
  const { getText } = useContext(LanguageContext);

  if (
    !NoResultRecommendationConfig.active ||
    !NoResultRecommendationConfig.slotID
  ) {
    return (
      <h2>
        {getText("No Result Found", SearchConfigTranslations, "noResults")}
      </h2>
    );
  }

  const controller = buildRecommendations(engine, {
    options: {
      slotId: NoResultRecommendationConfig.slotID,
    },
  });

  return <NoResultRenderer controller={controller} />;
};

export default NoResult;

const MainWrapper = styled.div`
  /* position: relative;
display: flex;
flex-direction: column;
align-items: center; */
  /*   width: 95%;
  max-width : 1800px; */
  /*   background-color: white;
  border-radius: 24px; */
  /*  text-align : center; */
  /*   position: relative;
  padding: 40px 20px;
  display: flex;
  flex-direction: column;
  align-items: center; */
  /*   box-shadow: 0px 10px 25px rgba(229, 232, 232, 0.6); */
  /*   margin-bottom: 30px; */
`;

const Title = styled.h2`
  font-size: 24px;
  font-weight: 500;
  font-family: inherit;
  color: ${Theme.primaryText};
  margin-top: 30px;
  margin-bottom: 10px;
`;

const SubTitle = styled.p`
  font-weight: 300;
  font-size: 18px;
  line-height: 28px;
  color: ${Theme.primaryText};
  margin-bottom: 20px;
`;

const CardWrapper = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  /*   align-items: center;
  justify-content: center; */
  max-width: 1500px;
  margin-top: 20px;
`;
