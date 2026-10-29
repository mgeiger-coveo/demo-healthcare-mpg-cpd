import { useEffect, useState } from "react";
import { Theme } from "../../config/theme";
import styled from "styled-components";
import { SkeletonRecommendtionCard } from "./RecommendationCard";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ResultTemplate from "../../config/CommerceResultTemplate";
import { Recommendations } from "@coveo/headless/commerce";
import ErrorBanner from "../ErrorBanner/ErrorBanner";

interface RecommendationCarouselProps {
  controller: Recommendations;
}

const RecommendationCarousel = (props: RecommendationCarouselProps) => {
  const { controller } = props;
  const [state, setState] = useState(controller.state);
  const [currentIndex, setCurrentIndex] = useState(0); // for carousel

  useEffect(() => {
    controller.refresh();
    controller.subscribe(() => setState(controller.state));
  }, []);

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

  const nextSlide = () => {
    setCurrentIndex(
      (prevIndex: number) => (prevIndex + 1) % state.products.length,
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex: number) =>
      prevIndex === 0 ? state.products.length - 1 : prevIndex - 1,
    );
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const getVisibleRecommendations = () => {
    const totalRecommendations = state.products.length;
    const prevIndex =
      (currentIndex - 2 + totalRecommendations) % totalRecommendations;
    const nextIndex = (currentIndex + 2) % totalRecommendations;
    const prevPrevIndex =
      (currentIndex - 1 + totalRecommendations) % totalRecommendations;
    const nextNextIndex = (currentIndex + 1) % totalRecommendations;

    return [
      state.products[prevIndex],
      state.products[prevPrevIndex],
      state.products[currentIndex],
      state.products[nextNextIndex],
      state.products[nextIndex],
    ];
  };

  const skeletonArray = [1, 2, 3, 4, 5];

  return (
    <MainWrapper>
      <Title>{state.headline}</Title>
      <SliderContainer>
        <ArrowButton onClick={prevSlide}>
          <ArrowBackIcon />
        </ArrowButton>
        <CarouselCardWrapper>
          {state.products.length > 0
            ? getVisibleRecommendations().map((recommendation, index) => {
                const isFocused = index === 2; // the middle one is always focused
                return (
                  <Slide
                    key={recommendation.ec_product_id}
                    $isFocused={isFocused}
                  >
                    <div
                      key={recommendation.ec_product_id}
                      style={{ width: "300px" }}
                    >
                      <ResultTemplate
                        controller={controller}
                        product={recommendation}
                      />
                    </div>
                  </Slide>
                );
              })
            : skeletonArray.map((item, index) => (
                <Slide key={item} $isFocused={index === 2}>
                  <SkeletonRecommendtionCard />
                </Slide>
              ))}
        </CarouselCardWrapper>
        <ArrowButton onClick={nextSlide}>
          <ArrowForwardIcon />
        </ArrowButton>
      </SliderContainer>
      <DotsContainer>
        {state.products.map((_, index) => (
          <Dot
            key={index}
            onClick={() => goToSlide(index)}
            $isActive={index === currentIndex}
          />
        ))}
      </DotsContainer>
    </MainWrapper>
  );
};

export default RecommendationCarousel;

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

const SliderContainer = styled.div`
  display: flex;
  align-items: center;
  position: relative;
  width: 100%;
  max-width: 1500px;
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

const CarouselCardWrapper = styled.div`
  display: flex;
  flex-wrap: nowrap;
  overflow: hidden;
  width: 90%;
  height: 700px;
  justify-content: center;
  align-items: center;
  position: relative;
  margin: 0px auto;
  background-color: white;
`;

type SlideProps = {
  $isFocused: boolean;
};

const Slide = styled.div<SlideProps>`
  flex: 0 0 ${({ $isFocused }) => ($isFocused ? "3%" : "20%")};
  transition: all 0.5s ease-in-out;
  opacity: ${({ $isFocused }) => ($isFocused ? 1 : 0.6)};
  transform: translateX(${({ $isFocused }) => ($isFocused ? "0" : "0")})
    scale(${({ $isFocused }) => ($isFocused ? 1.25 : 1)});
  transition:
    transform 0.5s ease-in-out,
    flex 0.5s ease-in-out,
    opacity 0.5s ease-in-out;
  margin: ${({ $isFocused }) => ($isFocused ? "0 47px" : "10px")};
  border-radius: 16px;

  img {
    width: 100%;
    height: 250px;
    object-fit: contain;
  }
`;

const DotsContainer = styled.div`
  display: flex;
`;

type DotProps = {
  $isActive: boolean;
};

const Dot = styled.div<DotProps>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: ${({ $isActive }) => ($isActive ? Theme.primary : "#ccc")};
  margin: 0 5px;
  cursor: pointer;
  transition: background-color 0.3s ease-in-out;

  &:hover {
    background-color: ${Theme.primary};
  }
`;
