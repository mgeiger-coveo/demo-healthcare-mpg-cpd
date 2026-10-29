import { buildProductListing, buildSearch } from "@coveo/headless/commerce";
import React, { useEffect, useState } from "react";
import { Box, Chip, Typography, Link } from "@mui/material";
import { Clear } from "@mui/icons-material";

const BreadcrumbManagerRenderer = ({ breadcrumbManagerController }) => {
  const [state, setState] = useState(breadcrumbManagerController.state);

  useEffect(() => {
    const unsubscribe = breadcrumbManagerController.subscribe(() =>
      setState(breadcrumbManagerController.state),
    );
    return () => unsubscribe();
  }, [breadcrumbManagerController]);

  const handleClearAll = () => {
    breadcrumbManagerController.deselectAll();
  };

  const hasSelectedValues = state.facetBreadcrumbs.some(
    (facetBreadcrumb) => facetBreadcrumb.values.length > 0,
  );

  /*   console.log(breadcrumbManagerController) */

  return (
    <Box mb={1}>
      {hasSelectedValues ? (
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: "bold", marginRight: 2 }}
          >
            Filters:
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {state.facetBreadcrumbs.map((facetBreadcrumb) => {
              if (
                facetBreadcrumb.type === "regular" &&
                facetBreadcrumb.values.length > 0
              ) {
                return facetBreadcrumb.values.map((breadcrumbValue, index) => (
                  <Chip
                    key={`${facetBreadcrumb.facetId}-${index}`}
                    label={`${facetBreadcrumb.facetDisplayName}: ${breadcrumbValue.value.value}`}
                    onDelete={breadcrumbValue.deselect}
                    deleteIcon={<Clear />}
                    variant="outlined"
                    sx={{
                      marginRight: 1,
                      borderRadius: "16px",
                      borderColor: "#ccc",
                      color: "#333",
                      backgroundColor: "#fff",
                    }}
                  />
                ));
              } else if (
                facetBreadcrumb.type === "numericalRange" &&
                facetBreadcrumb.values.length > 0
              ) {
                return facetBreadcrumb.values.map((breadcrumbValue, index) => {
                  let displayValue = `${breadcrumbValue.value.start} - ${breadcrumbValue.value.endInclusive ? breadcrumbValue.value.end : breadcrumbValue.value.end - 1}`;
                  if (facetBreadcrumb.field === "ec_promo_price") {
                    displayValue = `$${breadcrumbValue.value.start} - $${breadcrumbValue.value.endInclusive ? breadcrumbValue.value.end : breadcrumbValue.value.end - 1}`;
                  }
                  return (
                    <Chip
                      key={`${facetBreadcrumb.facetId}-${index}`}
                      label={`${facetBreadcrumb.facetDisplayName}: ${displayValue}`}
                      onDelete={breadcrumbValue.deselect}
                      deleteIcon={<Clear />}
                      variant="outlined"
                      sx={{
                        marginRight: 1,
                        borderRadius: "16px",
                        borderColor: "#ccc",
                        color: "#333",
                        backgroundColor: "#fff",
                      }}
                    />
                  );
                });
              } else if (
                facetBreadcrumb.type === "hierarchical" &&
                facetBreadcrumb.values.length > 0
              ) {
                return facetBreadcrumb.values.map((breadcrumbValue, index) => {
                  return (
                    <Chip
                      key={`${facetBreadcrumb.facetId}-${index}`}
                      label={`${facetBreadcrumb.facetDisplayName}: ${breadcrumbValue.value.value}`}
                      /* onDelete={()=>breadcrumbValue.deselect()} */
                      deleteIcon={<Clear />}
                      variant="outlined"
                      sx={{
                        marginRight: 1,
                        borderRadius: "16px",
                        borderColor: "#ccc",
                        color: "#333",
                        backgroundColor: "#fff",
                      }}
                    />
                  );
                });
              }
            })}
          </Box>
          <Link
            component="button"
            variant="body2"
            onClick={handleClearAll}
            sx={{ marginLeft: 2, color: "#007bff", cursor: "pointer" }}
          >
            Clear
          </Link>
        </Box>
      ) : null}
    </Box>
  );
};

const BreadcrumbManager = ({ engine, productListing = false }) => {
  let controller = null;
  if (productListing) {
    controller = buildProductListing(engine);
  } else {
    controller = buildSearch(engine);
  }

  if (controller.state.error) {
    return null;
  }

  const breadcrumbManagerController = controller.breadcrumbManager();

  return (
    <BreadcrumbManagerRenderer
      breadcrumbManagerController={breadcrumbManagerController}
    />
  );
};

export default BreadcrumbManager;
