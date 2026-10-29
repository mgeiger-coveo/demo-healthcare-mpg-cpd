import { useContext, useEffect, useRef, useState } from "react";
import { LanguageContext } from "../Internationalization/LanguageUtils";
import styled from "styled-components";
import { Theme } from "../../config/theme";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { SkeletonRecommendtionCard } from "./RecommendationCard";
import ResultTemplate from "../../config/CommerceResultTemplate";
import { Recommendations } from "@coveo/headless/commerce";
import ErrorBanner from "../ErrorBanner/ErrorBanner";

interface RecommendationSliderProps {
  controller: Recommendations;
}

const RecommendationSlider = (props: RecommendationSliderProps) => {
  const { getText } = useContext(LanguageContext);
  const scrollContainerRef = useRef(null);
  const skeletonArray = [1, 2, 3, 4, 5];

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

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      const scrollContainerWidth = scrollContainerRef.current.offsetWidth;
      scrollContainerRef.current.scrollBy({
        left: -scrollContainerWidth / 2,
        behavior: "smooth",
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      const scrollContainerWidth = scrollContainerRef.current.offsetWidth;
      scrollContainerRef.current.scrollBy({
        left: scrollContainerWidth / 2,
        behavior: "smooth",
      });
    }
  };

  return (
    <MainWrapper>
      <Title>{state.headline}</Title>
      <Slider>
        <ArrowButton onClick={scrollLeft}>
          <ArrowBackIcon />
        </ArrowButton>
        <CardWrapper ref={scrollContainerRef}>
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
        <ArrowButton onClick={scrollRight}>
          <ArrowForwardIcon />
        </ArrowButton>
      </Slider>
    </MainWrapper>
  );
};

export default RecommendationSlider;

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
`;

const SubTitle = styled.p`
  font-weight: 300;
  font-size: 18px;
  line-height: 28px;
  color: ${Theme.primaryText};
  margin-bottom: 20px;
`;

const Slider = styled.div`
  width: 100%;
  max-width: 1500px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;
const ArrowButton = styled.button`
  background-color: ${Theme.button};
  border: none;
  font-size: 18px;
  color: #fff;
  cursor: pointer;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  transition: background-color 0.3s ease-in-out;

  &:hover {
    background-color: ${Theme.button};
  }
`;

const CardWrapper = styled.div`
  display: flex;
  overflow-x: scroll;
  align-items: stretch; // Ensure cards stretch to the same height
  width: 90%;
  gap: 20px;
  padding: 20px 0px;

  &::-webkit-scrollbar {
    display: none;
  }
`;
