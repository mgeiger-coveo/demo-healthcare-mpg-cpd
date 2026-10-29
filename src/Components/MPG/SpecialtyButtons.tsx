import { FunctionComponent, useContext } from "react";
import Grid from "@mui/material/Grid";
import { RegularFacet } from "@coveo/headless/commerce";
import { Link } from "react-router-dom";
import styled, { css } from "styled-components";
import { LanguageContext } from "../Internationalization/LanguageUtils";
import { MPGConfigTranslations } from "../../config/InternationalizationConfig";
import {
  MPG_ALL_PROVIDERS_LABEL,
  MPG_FALLBACK_SPECIALTIES,
} from "../../config/MPGConfig";
import { SpecialtyPillItem } from "./mpgUtils";
import { Theme } from "../../config/theme";

interface SpecialtyButtonsProps {
  // Built by buildSpecialtyPillItems, so this component knows nothing about routing
  // config: a pill that filters is a toggle, a pill that navigates is a link.
  items: SpecialtyPillItem[];
  // Required for toggle items; undefined until the hc_specialties facet arrives. A
  // listing page passes none, because every one of its pills is a link.
  controller?: RegularFacet;
  isLoading: boolean;
  // Where the "All Providers" pill goes. Omitted on the search page, where it deselects
  // the facet in place instead of navigating.
  allProvidersHref?: string;
}

const SpecialtyButtons: FunctionComponent<SpecialtyButtonsProps> = (props) => {
  const { items, controller, isLoading, allProvidersHref } = props;
  const { getText } = useContext(LanguageContext);

  const allProvidersLabel = getText(
    MPG_ALL_PROVIDERS_LABEL,
    MPGConfigTranslations,
    "allProvidersLabel",
  );

  const isListingPage = Boolean(allProvidersHref);
  const hasToggleItems = items.some((item) => item.kind === "toggle");

  // Search page only, and only before the first response has produced any filterable
  // pill: pad the grid with inert placeholders so the row below does not shift when the
  // facet arrives. The configured links in `items` still render, because they are
  // config-derived and need no response. A listing page never shows placeholders.
  const placeholderLabels =
    !isListingPage && isLoading && !hasToggleItems
      ? MPG_FALLBACK_SPECIALTIES.filter(
          (specialty) => !items.some((item) => item.label === specialty),
        )
      : [];

  // With nothing to render and nothing on the way, a pill row would be misleading.
  if (items.length === 0 && placeholderLabels.length === 0 && !controller) {
    return null;
  }

  const hasSelection = Boolean(
    controller?.state.values.some((value) => controller.isValueSelected(value)),
  );

  return (
    <PillGrid container spacing={2}>
      {items.map((item) => {
        if (item.kind === "link") {
          return (
            <Grid key={item.href} size={{ xs: 12, sm: 6, md: 4 }}>
              {/* A real anchor, so cmd/ctrl/middle-click work natively. No aria-pressed:
                  this changes page, it does not toggle a filter. */}
              <PillLink
                to={item.href}
                $isSelected={item.isCurrent}
                aria-current={item.isCurrent ? "page" : undefined}
              >
                {item.label}
              </PillLink>
            </Grid>
          );
        }

        // A toggle item cannot filter without the facet controller, which is only
        // possible before the first response.
        if (!controller) return null;
        const isSelected = controller.isValueSelected(item.facetValue);
        return (
          <Grid key={item.label} size={{ xs: 12, sm: 6, md: 4 }}>
            <Pill
              type="button"
              $isSelected={isSelected}
              aria-pressed={isSelected}
              onClick={() => controller.toggleSingleSelect(item.facetValue)}
            >
              {item.label}
            </Pill>
          </Grid>
        );
      })}
      {placeholderLabels.map((specialty) => (
        <Grid key={`placeholder-${specialty}`} size={{ xs: 12, sm: 6, md: 4 }}>
          <Pill type="button" disabled $isSelected={false}>
            {specialty}
          </Pill>
        </Grid>
      ))}
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        {isListingPage ? (
          <PillLink to={allProvidersHref!} $isSelected={false}>
            {allProvidersLabel}
          </PillLink>
        ) : (
          <Pill
            type="button"
            disabled={!controller}
            $isSelected={!hasSelection}
            aria-pressed={!hasSelection}
            onClick={() => controller?.deselectAll()}
          >
            {allProvidersLabel}
          </Pill>
        )}
      </Grid>
    </PillGrid>
  );
};

export default SpecialtyButtons;

const PillGrid = styled(Grid)`
  margin-top: 8px;
`;

// Shared declarations, extracted in their original order so the search page is visually
// untouched. `Pill`'s :hover:enabled / :disabled selectors do not match an <a>, which is
// why the link variant restates them rather than inheriting from a styled(Link) of Pill.
const pillStyles = css<{ $isSelected: boolean }>`
  width: 100%;
  padding: 22px 16px;
  border-radius: 28px;
  border: 1px solid ${Theme.primary};
  font-family: inherit;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  user-select: none;
  transition: 0.2s ease-in-out all;
  color: ${(props) => (props.$isSelected ? Theme.buttonText : Theme.primary)};
  background: ${(props) => (props.$isSelected ? Theme.button : "#ffffff")};
  &:focus-visible {
    outline: 2px solid ${Theme.secondary};
    outline-offset: 2px;
  }
`;

const Pill = styled.button<{ $isSelected: boolean }>`
  ${pillStyles}
  &:hover:enabled {
    background: ${(props) => (props.$isSelected ? Theme.button : "#f5eef9")};
  }
  &:disabled {
    cursor: default;
    opacity: 0.4;
  }
`;

// An <a> has no :enabled/:disabled state and is inline by default, so the link variant
// needs display:block plus box-sizing for the same rendered box as the button. The `$`
// transient prefix is mandatory: a bare `isSelected` on styled(Link) forwards to the DOM
// and produces a "React does not recognize the prop" warning.
const PillLink = styled(Link)<{ $isSelected: boolean }>`
  ${pillStyles}
  display: block;
  text-align: center;
  text-decoration: none;
  box-sizing: border-box;
  &:hover {
    background: ${(props) => (props.$isSelected ? Theme.button : "#f5eef9")};
  }
`;
