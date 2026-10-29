import { buildProductListing, buildSearch } from "@coveo/headless/commerce";
import { useEffect, useState } from "react";
import FacetGenerator from "../Facets/Generic/FacetGenerator";

export const FacetRenderer = (props) => {
  const { controller } = props;
  const [state, setState] = useState(controller.state);

  useEffect(() => controller.subscribe(() => setState(controller.state)), []);
  return <>{<FacetGenerator controller={controller} />}</>;
};

const Facet = ({ engine, productListing }) => {
  let controller;
  if (productListing) {
    controller = buildProductListing(engine);
  } else {
    controller = buildSearch(engine);
  }
  if (controller.state.error) {
    return null;
  }
  const facetController = controller.facetGenerator();
  return <FacetRenderer controller={facetController} />;
};

export default Facet;
