import { Recommendations } from "@coveo/headless/commerce";
import { useEffect, useState } from "react";
import styled from "styled-components";
import { Theme } from "../../config/theme";
import { SkeletonRecommendtionCard } from "./RecommendationCard";
import ResultTemplate from "../../config/CommerceResultTemplate";
import ErrorBanner from "../ErrorBanner/ErrorBanner";

interface RecommendationListProps {
  controller: Recommendations;
}

const RecommendationList = (props: RecommendationListProps) => {
  const { controller } = props;
  const [state, setState] = useState(controller.state);

  useEffect(() => {
    controller.refresh();
    controller.subscribe(() => setState(controller.state));
  }, []);

  if (state.error) {
    return (
      <MainWrapper>
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
      <Title>{state.headline}</Title>
      <CardWrapper>
        {state.products.length > 0
          ? state.products.map((recommendation) => {
              return (
                <div
                  key={recommendation.ec_product_id}
                  style={{ width: "300px" }}
                >
                  <ResultTemplate
                    controller={controller}
                    product={recommendation}
                  />
                </div>
              );
            })
          : skeletonArray.map((_, index) => (
              <SkeletonRecommendtionCard key={index} />
            ))}
      </CardWrapper>
    </MainWrapper>
  );
};

export default RecommendationList;

const MainWrapper = styled.div`
  width: 95%;
  max-width: 1800px;
  background-color: white;
  border-radius: 24px;
  position: relative;
  top: -40px;
  padding: 40px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0px 10px 25px rgba(229, 232, 232, 0.6);
  margin-bottom: 30px;
`;

const Title = styled.h2`
  font-size: 32px;
  font-weight: 500;
  font-family: inherit;
  color: ${Theme.primaryText};
  margin-top: 30px;
  margin-bottom: 20px;
`;

const SubTitle = styled.p`
  font-weight: 300;
  font-size: 18px;
  line-height: 28px;
  color: ${Theme.primaryText};
`;

const CardWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: stretch; // Ensure cards stretch to the same height
  justify-content: center;
  max-width: 1500px;
  margin-top: 20px;
  gap: 15px;
`;
