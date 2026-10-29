import { buildProductListing, buildSearch } from "@coveo/headless/commerce";
import React, { useEffect, useState, useContext } from "react";
import styled from "styled-components";
import { SearchConfigTranslations } from "../../config/InternationalizationConfig";
import { LanguageContext } from "../Internationalization/LanguageUtils";
import { CommerceEngineContext } from "../../common/engineContext";

const SummaryRenderer = ({ summaryController }) => {
  const engine = useContext(CommerceEngineContext);
  const [state, setState] = useState(summaryController.state);
  const { getText } = useContext(LanguageContext);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    const unsubscribe = summaryController.subscribe(() =>
      setState(summaryController.state),
    );
    return () => unsubscribe();
  }, [summaryController]);

  useEffect(() => {
    let { query, firstRequestExecuted, isLoading } = state;
    if (firstRequestExecuted && !isLoading) {
      const headers = new Headers();
      headers.append("accept", "application/json");
      headers.append(
        "Authorization",
        `Bearer ${engine.configuration.accessToken}`,
      );
      headers.append("Content-Type", "application/json");
      const raw = JSON.stringify({
        q: query,
        context: {
          "commerce-api": "Search",
          trackingId: engine.configuration.analytics.trackingId,
        },
      });

      const requestOptions = {
        method: "POST",
        headers: headers,
        body: raw,
      };

      fetch(
        `https://${engine.configuration.organizationId}.org.coveo.com/rest/search/v2/plan?organizationId=${engine.configuration.organizationId}`,
        requestOptions,
      )
        .then((response) => response.json())
        .then((resJson) => {
          if (
            resJson &&
            resJson.preprocessingOutput &&
            resJson.preprocessingOutput.triggers &&
            resJson.preprocessingOutput.triggers.length > 0
          ) {
            const redirTrigger = resJson.preprocessingOutput.triggers.find(
              (trigger) => trigger.type === "redirect",
            );
            if (redirTrigger && redirTrigger.content) {
              window.open(redirTrigger.content, "_self");
            }
            const notifyTrigger = resJson.preprocessingOutput.triggers.find(
              (trigger) => trigger.type === "notify",
            );
            if (notifyTrigger && notifyTrigger.content) {
              setNotification(notifyTrigger.content);
            }
          }
        })
        .catch((error) => console.log("error", error));
    }
  }, [state]);

  return (
    <>
      {!state.isLoading && notification && state.firstRequestExecuted && (
        <div dangerouslySetInnerHTML={{ __html: notification }} />
      )}
      {!state.isLoading && state.hasProducts && (
        <SummaryContainer>
          {
            getText(
              "Results of for",
              SearchConfigTranslations,
              "summaryResults",
            ).split(" ")[0]
          }{" "}
          <span>{state.firstProduct}</span>-<span>{state.lastProduct}</span>{" "}
          {
            getText(
              "Results of for",
              SearchConfigTranslations,
              "summaryResults",
            ).split(" ")[1]
          }{" "}
          <span>{state.totalNumberOfProducts}</span>{" "}
          <>
            {state.query && (
              <>
                {
                  getText(
                    "Results of for",
                    SearchConfigTranslations,
                    "summaryResults",
                  ).split(" ")[2]
                }{" "}
                <span>{state.query}</span>
              </>
            )}
          </>
        </SummaryContainer>
      )}
    </>
  );
};

const Summary = ({ engine, productListing = false }) => {
  let controller;
  if (productListing) {
    controller = buildProductListing(engine);
  } else {
    controller = buildSearch(engine);
  }

  if (controller.state.error) {
    return null;
  }

  const summaryController = controller.summary();

  return <SummaryRenderer summaryController={summaryController} />;
};

const SummaryContainer = styled.div`
  span {
    font-weight: 500;
  }
`;

export default Summary;
