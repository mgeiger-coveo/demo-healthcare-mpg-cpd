import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import React from "react";

interface IBaseFacetProps {
  facetId: string;
  displayName: string;
  children: any;
}

export default function BaseFacet({
  facetId,
  displayName,
  children,
}: IBaseFacetProps) {
  return (
    <Accordion elevation={0} defaultExpanded={true} data-facet={facetId}>
      <AccordionSummary
        aria-controls="panel1a-content"
        id="panel1a-header"
        expandIcon={<ExpandMoreIcon sx={{ color: "#24389E" }} />}
      >
        <Typography>{displayName}</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <div id={facetId}>{children}</div>
      </AccordionDetails>
    </Accordion>
  );
}
