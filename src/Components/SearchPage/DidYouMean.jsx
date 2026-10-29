import { buildProductListing, buildSearch } from "@coveo/headless/commerce";
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { Theme } from "../../config/theme";

const DidYouMeanRenderer = ({ didYouMeanController }) => {
  const [state, setState] = useState(didYouMeanController.state);

  useEffect(() => {
    const unsubscribe = didYouMeanController.subscribe(() =>
      setState(didYouMeanController.state),
    );
    return () => unsubscribe();
  }, [didYouMeanController]);

  if (state.hasQueryCorrection && !state.wasAutomaticallyCorrected) {
    return (
      <DidYouMeanContainer>
        Did you mean{" "}
        <span
          onClick={() => didYouMeanController.applyCorrection()}
          style={{
            color: Theme.primary,
            textDecoration: "underline",
            cursor: "pointer",
          }}
        >
          {state.queryCorrection.correctedQuery}
        </span>
        ?
      </DidYouMeanContainer>
    );
  }

  return (
    <DidYouMeanContainer>
      {state.wasAutomaticallyCorrected && (
        <>
          The query was automatically corrected to{" "}
          <span>{state.wasCorrectedTo}</span>
        </>
      )}
    </DidYouMeanContainer>
  );
};

const DidYouMean = ({ engine, productListing = false }) => {
  let controller = null;
  if (productListing) {
    controller = buildProductListing(engine);
  } else {
    controller = buildSearch(engine);
  }

  if (controller.state.error) {
    return null;
  }

  const didYouMeanController = controller.didYouMean();

  return <DidYouMeanRenderer didYouMeanController={didYouMeanController} />;
};

const DidYouMeanContainer = styled.div`
  span {
    font-weight: 500;
  }
`;
export default DidYouMean;
