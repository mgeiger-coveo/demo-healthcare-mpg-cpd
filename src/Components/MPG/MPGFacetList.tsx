import { FunctionComponent, useContext } from "react";
import Typography from "@mui/material/Typography";
import styled from "styled-components";
import TextFacet from "../Facets/Text/TextFacet";
import { LanguageContext } from "../Internationalization/LanguageUtils";
import { MPGConfigTranslations } from "../../config/InternationalizationConfig";
import {
  MPG_REFINEMENTS_TITLE,
  MPG_REFINEMENT_FACETS,
} from "../../config/MPGConfig";
import { MPGRefinementFacetConfigType } from "../../config/Types/ConfigTypes";
import { selectRenderableFacets } from "./mpgUtils";

interface MPGFacetListProps {
  facetGenerator: any;
  // Which facets to render, in render order. Omitted means the search page's five-facet
  // allow-list; `null` means "render what the Hub returned, in Hub order", which is what
  // a listing page passes so the Merchandising Hub stays the source of truth.
  //
  // Deliberately NOT named `facets`: the local `facets` below holds the generated facet
  // CONTROLLERS, and "facets" means controllers throughout headless.
  facetAllowList?: MPGRefinementFacetConfigType[] | null;
  // Facet ids this page does not draw. A rendering rule only — the facet stays in the
  // request, in the response and in the facet order.
  suppressedFacetIds?: string[];
}

const MPGFacetList: FunctionComponent<MPGFacetListProps> = (props) => {
  const { facetGenerator, facetAllowList, suppressedFacetIds } = props;
  const { getText } = useContext(LanguageContext);

  // `facets` mints a fresh controller on every access, so read it once per render.
  const facets: any[] = facetGenerator?.facets ?? [];

  const allowList =
    facetAllowList === undefined ? MPG_REFINEMENT_FACETS : facetAllowList;
  const renderable = selectRenderableFacets(facets, allowList, {
    suppressedFacetIds,
    labelOverrides: MPG_REFINEMENT_FACETS,
  });

  return (
    <Wrapper>
      <Typography variant="h6" component="h2" mb={2}>
        {getText(
          MPG_REFINEMENTS_TITLE,
          MPGConfigTranslations,
          "refinementsTitle",
        )}
      </Typography>
      {/* i18n is resolved here rather than inside selectRenderableFacets: getText comes
          from LanguageContext, and a helper reading React context could not be unit
          tested. A facet with no config entry falls back to the Hub display name. */}
      {renderable.map(({ facet, facetId, labelToken }) => (
        <TextFacet
          key={facetId}
          controller={facet}
          displayNameOverride={getText(
            labelToken ?? facet.state.displayName,
            MPGConfigTranslations,
            `facet_${facetId}`,
          )}
        />
      ))}
    </Wrapper>
  );
};

export default MPGFacetList;

const Wrapper = styled.div`
  width: 100%;
`;
