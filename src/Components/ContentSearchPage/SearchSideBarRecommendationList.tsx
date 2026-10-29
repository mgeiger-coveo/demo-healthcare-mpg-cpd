import { useEffect, useState, FunctionComponent, useContext } from "react";
import {
  RecommendationList as HeadlessRecommendationList,
  loadClickAnalyticsActions,
  Result,
  buildRecommendationEngine,
  buildRecommendationList,
  loadAdvancedSearchQueryActions,
  RecommendationEngine,
} from "@coveo/headless/recommendation";
import { Theme } from "../../config/theme";
import styled from "styled-components";
import RecommendtionCardSmall, {
  SkeletonRecommendtionCardSmall,
} from "../Recommendations/RecommendationCardSmall";
import EngineContext from "../../common/engineContext";
import { Typography } from "@mui/material";
import { CustomContextContext } from "../CustomContext/CustomContextContext";
import { useLocation } from "react-router-dom";
import { DefaultRecommendationImage } from "../../config/HomeConfig";
import { getSearchToken } from "../../common/Engine";

interface RecommendationListProps {
  controller: HeadlessRecommendationList;
  engine: RecommendationEngine;
  NumberofResults: number;
  title: string;
  videoRecommendation: boolean;
  imageField: string;
}

export const RecommendationListRenderer: FunctionComponent<
  RecommendationListProps
> = (props) => {
  const engine = props.engine;
  const [lastQuery, setLastQuery] = useState("");
  const MainEngine = useContext(EngineContext)!;
  const { controller } = props;
  const [state, setState] = useState(controller.state);
  const [query, setQuery] = useState("");
  useEffect(() => {
    controller.refresh();
    controller.subscribe(() => setState(controller.state));
  }, []);

  useEffect(() => {
    MainEngine.subscribe(() =>
      setQuery(MainEngine.state.query?.q ? MainEngine.state.query.q : ""),
    );
  }, []);

  useEffect(() => {
    if (MainEngine.state.query?.q !== lastQuery) {
      engine.dispatch(
        loadAdvancedSearchQueryActions(engine).updateAdvancedSearchQueries({
          aq: MainEngine.state.query?.q,
        }),
      );
      setLastQuery(MainEngine.state.query ? MainEngine.state.query.q : "");
      controller.refresh();
      controller.subscribe(() => setState(controller.state));
    }
  }, [query]);

  if (state.error) {
    return <div></div>;
  }

  const logClick = (recommendation: Result) => {
    if (!engine) {
      return;
    }
    const { logRecommendationOpen } = loadClickAnalyticsActions(engine);
    engine.dispatch(logRecommendationOpen(recommendation));
  };

  const skeletonArray = [1, 2, 3, 4, 5];
  return (
    <MainWrapper>
      {!state.isLoading ? (
        <>
          {state.recommendations.length > 0 && (
            <>
              <Divider />
              <Typography
                variant="h6"
                component="h6"
                sx={{ marginLeft: "20px" }}
              >
                {props.title}
              </Typography>
              <CardWrapper>
                {state?.recommendations
                  ?.slice(0, props.NumberofResults)
                  .map((recommendation, index) => {
                    let imageURL: string = "";
                    imageURL = recommendation.raw[
                      `${props.imageField}`
                    ] as string;
                    if (
                      recommendation.raw.sourcetype === "YouTube" &&
                      (props.imageField === null ||
                        props.imageField === "" ||
                        props.imageField === undefined)
                    ) {
                      imageURL = recommendation.raw[`ytthumbnailurl`] as string;
                    }

                    return (
                      <div key={recommendation.title + recommendation.uniqueId}>
                        <RecommendtionCardSmall
                          video={
                            props.videoRecommendation
                              ? props.videoRecommendation
                              : recommendation.raw.sourcetype === "YouTube"
                                ? true
                                : false
                          }
                          title={recommendation.title}
                          description={recommendation.excerpt}
                          clickUri={recommendation.clickUri}
                          onClick={() => logClick(recommendation)}
                          onContextMenu={() => logClick(recommendation)}
                          onMouseDown={() => logClick(recommendation)}
                          onMouseUp={() => logClick(recommendation)}
                          image={
                            imageURL ? imageURL : DefaultRecommendationImage
                          }
                        />
                      </div>
                    );
                  })}
              </CardWrapper>{" "}
            </>
          )}
        </>
      ) : (
        <>
          <Divider />
          <Title>{props.title}</Title>
          <CardWrapper>
            {skeletonArray.map((item, index) => {
              return (
                <div key={item}>
                  <SkeletonRecommendtionCardSmall />
                </div>
              );
            })}
          </CardWrapper>{" "}
        </>
      )}
    </MainWrapper>
  );
};

interface SearSearchSideBarRecommendationListProps {
  pipeline?: string;
  NumberofResults?: number;
  title?: string;
  videoRecommendation?: boolean;
  imageField?: string;
  searchHub: string;
}

const SearchSideBarRecommendationList: FunctionComponent<
  SearSearchSideBarRecommendationListProps
> = ({
  pipeline = "default",
  NumberofResults = 0,
  title = "",
  videoRecommendation = false,
  imageField = "",
  searchHub,
}) => {
  const [token, setToken] = useState("");
  const { settingContextFromEngine } = useContext(CustomContextContext);
  useEffect(() => {
    (async () => {
      setToken(await getSearchToken());
    })();
  }, []);

  if (!token) return null;

  const recommendationEngine = buildRecommendationEngine({
    configuration: {
      organizationId: import.meta.env.VITE_ORGANIZATION_ID!,
      accessToken: token,
      searchHub: searchHub,
      pipeline: pipeline,
    },
  });

  settingContextFromEngine(recommendationEngine);

  const recController = buildRecommendationList(recommendationEngine, {
    options: { id: "Recommendation" },
  });

  return (
    <RecommendationListRenderer
      controller={recController}
      engine={recommendationEngine}
      NumberofResults={NumberofResults}
      videoRecommendation={videoRecommendation}
      imageField={imageField}
      title={title}
    />
  );
};

export default SearchSideBarRecommendationList;

const Divider = styled.div`
  /*   width: 100%; */
  height: 4px;
  background: ${Theme.primaryText};
  margin-top: 30px;
  margin-bottom: 20px;
  margin-left: 10px;
  margin-right: 10px;
`;

const MainWrapper = styled.div`
  width: 400px;
  border-radius: 24px;
  position: relative;
  display: flex;
  flex-direction: column;
  margin-bottom: 30px;
`;

const Title = styled.h2`
  margin-left: 10px;
  font-size: 20px;
  font-weight: 400;
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

const CardWrapper = styled.div`
  display: flex;
  flex-direction: column;
  /* max-width: 1500px; */
`;
