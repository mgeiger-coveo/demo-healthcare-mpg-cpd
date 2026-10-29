import React, { FunctionComponent, useEffect, useState } from "react";
import {
  buildSearch,
  RegularFacet as HeadlessFacet,
  RegularFacetValue,
} from "@coveo/headless/commerce";
import {
  Checkbox,
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from "@mui/material";
import styled from "styled-components";
import { Icon } from "react-icons-kit";
import { chevronDown } from "react-icons-kit/feather/chevronDown";
import { chevronUp } from "react-icons-kit/feather/chevronUp";
import { RegularFacet as TextFacetController } from "@coveo/headless/commerce";
import FacetSkeleton from "../Generic/FacetSkeleton";
import { Theme } from "../../../config/theme";
import { DefaultRecommendationImage } from "../../../config/HomeConfig";
/* import product_type from "../../../product_type_imagesfinal.json"; */

const product_type = {};

interface FacetProps {
  title: string | undefined;
  field: string;
}

interface FacetRendererProps extends FacetProps {
  controller: HeadlessFacet;
}

const FacetRenderer: FunctionComponent<any> = (props) => {
  const { controller, field } = props;
  const [state, setState] = useState(controller.state);
  const [collapse, setCollapse] = useState(true);
  const [firstsearch, setFirstSearch] = useState(true);
  const [products, setProducts] = useState(
    sessionStorage.getItem("products")
      ? JSON.parse(sessionStorage.getItem("products") as string)
      : [],
  );
  const [loadimage, setloadimage] = useState(false);

  console.log("controller", state.values);

  useEffect(() => {
    const unsubscribe = controller.subscribe(() => setState(controller.state));
    return () => unsubscribe();
  }, [controller]);

  const toggleSelect = (value: RegularFacetValue) => {
    controller.toggleSelect(value);
  };

  const showMore = () => {
    controller.showMoreValues();
  };

  const showLess = () => {
    controller.showLessValues();
  };

  let hasQuery = false;

  const query = localStorage.getItem("CoveoStandaloneSearchBox")
    ? JSON.parse(localStorage.getItem("CoveoStandaloneSearchBox") as string)
        .value
    : null;

  if (query) {
    hasQuery = query.q !== "";
  }

  useEffect(() => {
    if (query) {
      setTimeout(() => {
        setFirstSearch(false);
      }, 1500);
    } else {
      setFirstSearch(true);
    }
    setloadimage(true);
    setTimeout(() => {
      setProducts(
        sessionStorage.getItem("products")
          ? JSON.parse(sessionStorage.getItem("products") as string)
          : [],
      );
      setloadimage(false);
    }, 1500);
  }, [query]);

  const imagesmap = {};

  products.map((product) => {
    if (
      imagesmap[product.additionalFields[field]] === undefined &&
      product.additionalFields[field] &&
      product.ec_images.length > 0
    ) {
      imagesmap[product.additionalFields[field]] = product.ec_images[0];
    }
  });

  return (
    <>
      {state.values.length > 3 &&
      hasQuery &&
      !firstsearch &&
      state.values
        .slice(0, 6)
        .filter(
          (x) =>
            x.numberOfResults >
            2 /* && (product_type[x.value] !== undefined) */,
        ).length > 1 ? (
        <Wrapper>
          <Box mb={0} mr={3} p={1}>
            <Box
              pb={1}
              sx={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography variant="h6" component="h6">
                {state.displayName}
              </Typography>
            </Box>
            <List dense style={{ display: "flex" }}>
              {state.values
                .slice(0, 6)
                .filter((x) => x.numberOfResults > 2)
                .map((value: RegularFacetValue) => {
                  return (
                    <ListItemButton
                      style={{
                        padding: "10px 0px",
                        display: "flex",
                        flexDirection: "column",
                        width: "150px",
                        borderRadius: "20px",
                        alignItems: "center",
                        border: controller.isValueSelected(value)
                          ? `1px solid ${Theme.primary}`
                          : "",
                        margin: "5px",
                      }}
                      key={value.value}
                      onClick={() => toggleSelect(value)}
                    >
                      {loadimage ? (
                        <PlaceholderImage
                          urlimage={DefaultRecommendationImage}
                        />
                      ) : (
                        <img
                          src={
                            imagesmap[value.value]
                              ? imagesmap[value.value]
                              : DefaultRecommendationImage
                          }
                          style={{
                            width: "80px",
                            height: "80px",
                            borderRadius: "8px",
                            objectFit: "contain",
                          }}
                          referrerPolicy="same-origin"
                        />
                      )}

                      <span style={{ textAlign: "center" }}>{value.value}</span>
                    </ListItemButton>
                  );
                })}
            </List>
          </Box>
        </Wrapper>
      ) : null}
    </>
  );
};

export const PictureFacetRenderer = (props) => {
  const { controller } = props;
  const [state, setState] = useState(controller.state);

  useEffect(() => controller.subscribe(() => setState(controller.state)), []);

  console.log("controller", controller);

  for (const facet of controller.facets) {
    if (facet.state.facetId === props.field) {
      return (
        <FacetRenderer
          key={facet.state.facetId + "hello"}
          controller={facet as TextFacetController}
          field={props.field}
        />
      );
    }
  }

  /* return <>
    {
      state.isLoading ? <FacetSkeleton /> : <FacetGenerator controller={controller} />
    }
    </> */
};

const PictureFacet: FunctionComponent<any> = ({ engine, field }) => {
  const searchController = buildSearch(engine);
  const facetGenerator = searchController.facetGenerator();

  return <PictureFacetRenderer controller={facetGenerator} field={field} />;
};

const Wrapper = styled.div`
  /*   border: 1px solid #e5e8e8; */
  border-radius: 16px;
  margin-bottom: 20px;
  font-family: inherit;
`;

const PlaceholderImage = styled.div<{ urlimage: string }>`
  width: 80px;
  height: 80px;
  background-color: #e5e5e5;
  border-radius: 8px;
  margin-bottom: 8px;

  background-size: cover;
`;

export default PictureFacet;
