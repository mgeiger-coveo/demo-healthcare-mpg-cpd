import {
  FunctionComponent,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import Typography from "@mui/material/Typography";
import styled from "styled-components";
import { ProductListing, RegularFacet, Search } from "@coveo/headless/commerce";
import ProviderCard from "./ProviderCard";
import ViewModeToggle from "./ViewModeToggle";
import { buildProvidersHeading } from "./mpgUtils";
import { LanguageContext } from "../Internationalization/LanguageUtils";
import { MPGConfigTranslations } from "../../config/InternationalizationConfig";
import {
  MPG_ALL_PROVIDERS_LABEL,
  MPG_GRID_COLUMNS,
  MPG_NO_PROVIDERS_MESSAGE,
  MPG_PROVIDERS_TITLE_SUFFIX,
  MPG_VIEW_MODE_DEFAULT,
} from "../../config/MPGConfig";
import { MPGViewModeType } from "../../config/Types/ConfigTypes";
import { Theme } from "../../config/theme";

interface ProviderListProps {
  // Either experience's results controller. A listing page passes its ProductListing, so
  // card clicks are attributed to the listing response.
  controller: Search | ProductListing;
  specialtyFacet?: RegularFacet;
  viewMode?: MPGViewModeType;
  onViewModeChange?: (mode: MPGViewModeType) => void;
  // false => render the results region only, so a page can own the heading row and keep
  // it visible in states where this component is replaced entirely.
  renderHeadingRow?: boolean;
  // Substitutes the no-providers MESSAGE only. It never hides products and is never a
  // mechanism for showing an error: a failed refetch leaves the previous products in
  // headless state, so this branch is unreachable exactly when an error matters most.
  // `null` is a legitimate value meaning "show nothing here yet".
  emptyState?: ReactNode;
  fromPath?: string;
}

const ProviderList: FunctionComponent<ProviderListProps> = (props) => {
  const {
    controller,
    specialtyFacet,
    viewMode = MPG_VIEW_MODE_DEFAULT,
    onViewModeChange,
    renderHeadingRow = true,
    emptyState,
    fromPath,
  } = props;
  const [state, setState] = useState(controller.state);
  const { getText } = useContext(LanguageContext);

  // The state copy is scheduled on a microtask rather than written inline. A page above
  // dispatches setView during ITS render, which notifies this controller while that
  // parent is still rendering; an inline setState there is a render-phase update to a
  // different component, which React reports as an error and is not guaranteed to be
  // applied in that pass. Reading `controller.state` inside the microtask still yields
  // the latest state.
  useEffect(
    () =>
      controller.subscribe(() =>
        queueMicrotask(() => setState(controller.state)),
      ),
    [controller],
  );

  const selectedSpecialties = (specialtyFacet?.state.values ?? []).filter(
    (value) => specialtyFacet?.isValueSelected(value),
  );

  const heading = buildProvidersHeading(
    selectedSpecialties,
    getText(
      MPG_PROVIDERS_TITLE_SUFFIX,
      MPGConfigTranslations,
      "providersTitleSuffix",
    ),
    getText(
      MPG_ALL_PROVIDERS_LABEL,
      MPGConfigTranslations,
      "allProvidersLabel",
    ),
  );

  return (
    <Wrapper>
      {renderHeadingRow && (
        <HeadingRow>
          <Typography variant="h6" component="h2">
            {heading}
          </Typography>
          {onViewModeChange && (
            <ViewModeToggle mode={viewMode} onChange={onViewModeChange} />
          )}
        </HeadingRow>
      )}
      <ResultsRegion
        aria-live="polite"
        style={state.isLoading ? { opacity: 0.2 } : {}}
      >
        {state.products.length === 0 && !state.isLoading ? (
          emptyState !== undefined ? (
            emptyState
          ) : (
            <Typography variant="body2" sx={{ color: Theme.secondaryText }}>
              {getText(
                MPG_NO_PROVIDERS_MESSAGE,
                MPGConfigTranslations,
                "noProvidersMessage",
              )}
            </Typography>
          )
        ) : (
          <CardsLayout $viewMode={viewMode}>
            {state.products.map((product) => (
              <ProviderCard
                key={product.permanentid}
                product={product}
                controller={controller}
                viewMode={viewMode}
                fromPath={fromPath}
              />
            ))}
          </CardsLayout>
        )}
      </ResultsRegion>
    </Wrapper>
  );
};

export default ProviderList;

const Wrapper = styled.div`
  width: 100%;
`;

const HeadingRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
`;

const ResultsRegion = styled.div`
  width: 100%;
`;

// List mode keeps the cards stacked exactly as before; grid mode lays them out in a CSS
// grid whose column count comes from MPG_GRID_COLUMNS. `minmax(0, 1fr)` plus `min-width:
// 0` on the items is what keeps a long provider name from forcing horizontal overflow.
const CardsLayout = styled.div<{ $viewMode: MPGViewModeType }>`
  width: 100%;
  ${(props) =>
    props.$viewMode === "grid"
      ? `
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(${MPG_GRID_COLUMNS.xs}, minmax(0, 1fr));
  > * {
    min-width: 0;
  }
  @media (min-width: 600px) {
    grid-template-columns: repeat(${MPG_GRID_COLUMNS.sm}, minmax(0, 1fr));
  }
  @media (min-width: 900px) {
    grid-template-columns: repeat(${MPG_GRID_COLUMNS.md}, minmax(0, 1fr));
  }
  @media (min-width: 1200px) {
    grid-template-columns: repeat(${MPG_GRID_COLUMNS.lg}, minmax(0, 1fr));
  }
`
      : ""}
`;
