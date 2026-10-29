import React, { Fragment, useEffect, useState } from "react";
import { Grid, Button } from "@mui/material";
import {
  CategoryFacet as CategoryFacetController,
  NumericFacet as NumericFacetController,
  DateFacet as DateFacetController,
  RegularFacet as TextFacetController,
} from "@coveo/headless/commerce";
import NumericFacet from "../Numeric/NumericFacet";
import TextFacet from "../Text/TextFacet";
import CategoryFacet from "../Category/CategoryFacet";

export interface FacetGeneratorProps {
  controller: any;
  isOpen: boolean;
  onClose: () => void;
}

function arrangeHierarchicalFirst(arr) {
  arr.sort((a, b) => {
    if (a.type === "hierarchical" && b.type !== "hierarchical") {
      return -1;
    }
    if (a.type !== "hierarchical" && b.type === "hierarchical") {
      return 1;
    }
    return 0;
  });

  return arr;
}

export default function FacetGenerator(props: FacetGeneratorProps) {
  const { controller } = props;
  // This is a temporary workaround to prevent the app from freezing.
  // We may be able to fix this is by using actual Redux selectors in the state of our Headless controllers.
  //@ts-ignore
  const ready = controller.facets.length > 0;
  const [state, setState] = useState(controller);

  useEffect(() => {
    setState(controller);
  }, [setState, controller, ready]);

  if (!ready) {
    return;
  }

  return (
    <div style={{ width: "90%" }}>
      <div onClick={props.onClose}></div>

      <Grid>
        {/*  @ts-ignore */}
        {arrangeHierarchicalFirst(state.facets).map((facet) => {
          if (facet.state.values.length === 0) {
            return;
          }
          const key = facet.state.facetId;
          switch (facet.state.type) {
            case "numericalRange":
              return (
                <NumericFacet
                  key={key}
                  controller={facet as NumericFacetController}
                />
              );
            case "regular":
              return (
                <TextFacet
                  key={key}
                  controller={facet as TextFacetController}
                />
              );
            case "hierarchical":
              return (
                <CategoryFacet
                  key={key}
                  controller={facet as CategoryFacetController}
                />
              );
            default:
              return <Fragment key={key}></Fragment>;
          }
        })}
      </Grid>
    </div>
  );
}
