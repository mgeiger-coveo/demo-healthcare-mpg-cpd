import { FunctionComponent, useEffect, useState, memo } from "react";
import {
  CategoryFacetValue,
  RegularFacet as HeadlessFacet,
  RegularFacetValue,
} from "@coveo/headless/commerce";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import {
  Collapse,
  Divider,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";
import styled from "styled-components";
import { chevronDown } from "react-icons-kit/feather/chevronDown";
import { chevronUp } from "react-icons-kit/feather/chevronUp";
import { Icon } from "react-icons-kit";
import FacetSkeleton from "../Generic/FacetSkeleton";
import TextFacetSearch from "../Text/TextFacetSearch";

interface FacetProps {
  title: string | undefined;
  field: string;
}

interface FacetRendererProps extends FacetProps {
  controller: HeadlessFacet;
}

const FacetRenderer: FunctionComponent<any> = (props) => {
  const { controller } = props;
  const [state, setState] = useState(controller.state);
  const [collapse, setCollapse] = useState(true);
  useEffect(
    () => controller.subscribe(() => setState(controller.state)),
    [controller],
  );

  const toggleSelect = (value: RegularFacetValue) => {
    controller.toggleSelect(value);
  };

  const showMore = () => {
    controller.showMoreValues();
  };

  const showLess = () => {
    controller.showLessValues();
  };

  const renderFacetValues = (values: RegularFacetValue[], level = 0) => {
    return values.map((value: CategoryFacetValue) => {
      const labelId = `checkbox-list-label-${value.value}`;
      const hasChildren = value.children && value.children.length > 0;

      return (
        <Box ml={level * 2} key={value.value}>
          <ListItemButton
            style={{ padding: 0 }}
            onClick={() => {
              if (level === 0 && value.state === "selected") {
                controller.deselectAll();
              } else {
                toggleSelect(value);
              }
            }}
          >
            <Checkbox
              size="small"
              edge="start"
              checked={controller.isValueSelected(value)}
              tabIndex={-1}
              disableRipple
              inputProps={{ "aria-labelledby": labelId }}
            />
            <ListItemText
              className="truncate inline"
              primary={`${value.value}`}
              secondary={`(${value.numberOfResults})`}
            />
          </ListItemButton>
          {hasChildren && (
            <Collapse in={collapse}>
              <List dense>{renderFacetValues(value.children, level + 1)}</List>
            </Collapse>
          )}
        </Box>
      );
    });
  };

  // if(state.isLoading) {
  //   return <FacetSkeleton />;
  // }

  return (
    <>
      {state.values.length > 0 ? (
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
              <div
                onClick={() => setCollapse(!collapse)}
                style={{ cursor: "pointer" }}
              >
                {!collapse ? (
                  <Icon icon={chevronDown} size={20} />
                ) : (
                  <Icon icon={chevronUp} size={20} />
                )}
              </div>
            </Box>
            <TextFacetSearch controller={controller} facetState={state} />
            <Collapse in={collapse}>
              <List dense>{renderFacetValues(state.values)}</List>
              {state.canShowLessValues && (
                <Button size="small" onClick={() => showLess()}>
                  Show Less
                </Button>
              )}
              {state.canShowMoreValues && (
                <Button size="small" onClick={() => showMore()}>
                  Show More
                </Button>
              )}
            </Collapse>
          </Box>
        </Wrapper>
      ) : null}
    </>
  );
};

const Wrapper = styled.div`
  border: 1px #e5e8e8 solid;
  border-radius: 16px;
  padding: 24px 16px;
  margin-bottom: 20px;
  font-family: inherit;
`;

export default FacetRenderer;
