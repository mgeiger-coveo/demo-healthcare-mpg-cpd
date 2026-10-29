import React, { useEffect, useState } from "react";
import { buildProductListing } from "@coveo/headless/commerce";
import { Grid } from "@mui/material";
import ResultTemplate, {
  ResultSkeleton,
} from "../../config/CommerceResultTemplate";
import ErrorBanner from "../ErrorBanner/ErrorBanner";

const ResultRenderer = ({ controller }) => {
  const [products, setProducts] = React.useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    controller.subscribe(() => {
      if (controller.state.error) {
        setError(controller.state.error);
      } else {
        setError(null);
      }
      setProducts(controller.state.products);
      setLoading(false);
    });
  }, []);

  if (error) {
    return (
      <ErrorBanner
        message="Unable to load product listings."
        details={error.message}
        onRetry={() => controller.refresh()}
      />
    );
  }

  return (
    <>
      <Grid
        container
        spacing={2}
        mt={1}
        maxWidth={1300}
        style={controller.state.isLoading ? { opacity: 0.2 } : {}}
      >
        {loading ? (
          <>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((index) => {
              return <ResultSkeleton key={index} />;
            })}
          </>
        ) : (
          <>
            {products.map((product) => {
              return (
                <ResultTemplate
                  controller={controller}
                  product={product}
                  key={product.permanentid}
                />
              );
            })}
          </>
        )}
      </Grid>
    </>
  );
};

const Results = ({ engine }) => {
  const [controller, setController] = React.useState(null);
  useEffect(() => {
    const controller = buildProductListing(engine);
    controller.refresh();
    setController(controller);
  }, []);

  if (controller === null) return <div>Loading...</div>;

  return <ResultRenderer controller={controller} />;
};

export default Results;
