import { useContext, useEffect, useState } from "react";
import { CustomContextContext } from "../CustomContext/CustomContextContext";
import { getSearchToken } from "../../common/Engine";
import {
  CommerceRecommendationType,
  RecommendationType,
} from "../../config/Types/ConfigTypes";
import RecommendationList from "./RecommendationList";
import RecommendationSlider from "./RecommendationSlider";
import RecommendationCarousel from "./RecommendationCarousel";
import { CommerceEngineContext } from "../../common/engineContext";
import { buildRecommendations } from "@coveo/headless/commerce";

interface HomeRecommendationsProps {
  RecommendationConfig: CommerceRecommendationType;
}

const HomeRecommendations = (props: HomeRecommendationsProps) => {
  const { RecommendationConfig } = props;
  const engine = useContext(CommerceEngineContext);

  if (!RecommendationConfig.slotID) {
    console.log("No slot id found");
    return null;
  }

  const controller = buildRecommendations(engine, {
    options: {
      slotId: RecommendationConfig.slotID,
    },
  });

  if (!RecommendationConfig.active) {
    return null;
  }

  switch (RecommendationConfig.type) {
    case "list":
      return <RecommendationList controller={controller} />;
    case "carousel":
      return <RecommendationCarousel controller={controller} />;
    case "slider":
      return <RecommendationSlider controller={controller} />;
    default:
      return <></>;
  }
};

export default HomeRecommendations;
