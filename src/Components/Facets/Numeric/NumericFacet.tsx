import {
  NumericFacetValue as HeadlessNumericFacetValue,
  NumericFacet as NumericFacetController,
} from "@coveo/headless/commerce";
import { useEffect, useState } from "react";
import {
  Collapse,
  Divider,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import { chevronDown } from "react-icons-kit/feather/chevronDown";
import { chevronUp } from "react-icons-kit/feather/chevronUp";
import { Icon } from "react-icons-kit";
import styled from "styled-components";
import { NumericFacetValue } from "@coveo/headless/commerce";
import FacetSkeleton from "../Generic/FacetSkeleton";

export interface INumericFacetProps {
  controller: NumericFacetController;
}

interface FacetProps {
  title: string | undefined;
  field: string;
}

export default function NumericFacet({ controller }: INumericFacetProps) {
  const [state, setState] = useState(controller.state);
  const [collapse, setCollapse] = useState(true);
  useEffect(
    () => controller.subscribe(() => setState(controller.state)),
    [controller],
  );

  const toggleSelect = (value: NumericFacetValue) => {
    controller.toggleSelect(value);
  };

  const showMore = () => {
    controller.showMoreValues();
  };

  const showLess = () => {
    controller.showLessValues();
  };

  const onSelect = (item: HeadlessNumericFacetValue, event: any) => {
    event.stopPropagation();
    event.preventDefault();
    controller.toggleSelect(item);
  };

  if (state.values.length === 0) {
    return <></>;
  }

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
            <Collapse in={collapse}>
              <List dense>
                {state.values.map((value: any) => {
                  let displayValue = `${value.start} - ${value.endInclusive ? value.end : value.end - 1}`;

                  if (state.field === "ec_promo_price") {
                    displayValue = `$${value.start} - $${value.endInclusive ? value.end : value.end - 1}`;
                  }

                  return (
                    <ListItemButton
                      style={{ padding: 0 }}
                      key={displayValue}
                      onClick={() => toggleSelect(value)}
                    >
                      <Checkbox
                        size="small"
                        edge="start"
                        checked={controller.isValueSelected(value)}
                        tabIndex={-1}
                        disableRipple
                      />
                      <ListItemText
                        className="truncate inline"
                        primary={`${displayValue}`}
                        secondary={`(${value.numberOfResults})`}
                      />
                    </ListItemButton>
                  );
                })}
              </List>
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
}

const Wrapper = styled.div`
  border: 1px #e5e8e8 solid;
  border-radius: 16px;
  padding: 24px 16px;
  margin-bottom: 20px;
  font-family: inherit;
`;
