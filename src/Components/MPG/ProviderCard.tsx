import { FunctionComponent, useContext } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { Link } from "react-router-dom";
import { ProductListing, Search } from "@coveo/headless/commerce";
import styled from "styled-components";
import NewPatientBadge from "./NewPatientBadge";
import ProviderLocationBadges from "./ProviderLocationBadges";
import ProviderPhoto from "../ProviderDetail/ProviderPhoto";
import {
  formatProviderCard,
  getProviderDetailPath,
  ProviderCardFieldMap,
  selectProviderImageUrl,
} from "./mpgUtils";
import { selectNewPatientBadgeVariant } from "./newPatientBadgeUtils";
import {
  formatTemplate,
  getProviderInitials,
} from "../ProviderDetail/providerDetailUtils";
import { LanguageContext } from "../Internationalization/LanguageUtils";
import { MPGConfigTranslations } from "../../config/InternationalizationConfig";
import {
  MPG_FACILITY_JOIN_LIMIT,
  MPG_PROVIDER_CARD_FIELDS,
  MPG_PROVIDER_ID_FIELD,
  MPG_PROVIDER_IMAGE_FIELDS,
  MPG_PROVIDER_IMAGE_SIZES,
  MPG_PROVIDER_PHOTO_ALT_TEMPLATE,
  MPG_VIEW_MODE_DEFAULT,
} from "../../config/MPGConfig";
import { MPGViewModeType } from "../../config/Types/ConfigTypes";
import { Theme } from "../../config/theme";

interface ProviderCardProps {
  product: any;
  // Either experience's results controller, so the click event is attributed to the
  // response that produced this card.
  controller?: Search | ProductListing;
  viewMode?: MPGViewModeType;
  // Where the detail page's back link returns to. Defaults to /mpg with its current hash.
  fromPath?: string;
}

const ProviderCard: FunctionComponent<ProviderCardProps> = (props) => {
  const {
    product,
    controller,
    viewMode = MPG_VIEW_MODE_DEFAULT,
    fromPath = `/mpg${window.location.hash}`,
  } = props;
  const { getText } = useContext(LanguageContext);
  const { name, secondaryLine, facilityLine } = formatProviderCard(
    product,
    MPG_PROVIDER_CARD_FIELDS as ProviderCardFieldMap,
    MPG_FACILITY_JOIN_LIMIT,
  );

  const isGrid = viewMode === "grid";
  const detailPath = getProviderDetailPath(product, MPG_PROVIDER_ID_FIELD);

  // List cards have room for the full-size headshot; the tight grid asks for the smaller
  // indexed variant. Both fall back to the other field, then to an initials avatar.
  const imageUrl = selectProviderImageUrl(
    product,
    MPG_PROVIDER_IMAGE_FIELDS,
    isGrid ? "small" : "large",
  );
  const photoAlt = formatTemplate(
    getText(
      MPG_PROVIDER_PHOTO_ALT_TEMPLATE,
      MPGConfigTranslations,
      "providerPhotoAltTemplate",
    ),
    { name },
  );

  const card = (
    <StyledCard variant="outlined" $viewMode={viewMode}>
      <CardContent>
        <CardLayout $viewMode={viewMode}>
          <ProviderPhoto
            imageUrl={imageUrl}
            alt={photoAlt}
            initials={getProviderInitials(name)}
            size={
              isGrid
                ? MPG_PROVIDER_IMAGE_SIZES.grid
                : MPG_PROVIDER_IMAGE_SIZES.list
            }
            radius={isGrid ? 12 : 16}
          />
          <CardText>
            {/* The name row is rendered for every card, badge or not, so a list mixing
                eligible and ineligible providers keeps one vertical rhythm. No reserved
                min-height is needed: hc_accepting_patients arrives in the same Commerce
                response as the name, so the badge is there on the card's first paint and
                cannot pop in afterwards. */}
            <NameRow>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 600, minWidth: 0 }}
              >
                {name}
              </Typography>
              <NewPatientBadge
                product={product}
                variant={selectNewPatientBadgeVariant(viewMode)}
              />
            </NameRow>
            {secondaryLine && (
              <Typography
                variant="body2"
                sx={{ color: Theme.secondaryText, marginTop: "4px" }}
              >
                {secondaryLine}
              </Typography>
            )}
            {/* In grid mode the badges carry the locations, so the facility line would
                only repeat them in a column that has no room for it. */}
            {!isGrid && facilityLine && (
              <Typography
                variant="caption"
                component="p"
                sx={{ color: Theme.secondaryText, marginTop: "6px" }}
              >
                {facilityLine}
              </Typography>
            )}
            <ProviderLocationBadges product={product} dense={isGrid} />
          </CardText>
        </CardLayout>
      </CardContent>
    </StyledCard>
  );

  // Without an id there is no detail route to point at, so the card stays unwrapped
  // rather than becoming a dead link.
  if (!detailPath) return card;

  return (
    <CardLink
      to={detailPath}
      // The resolved product rides along so the detail page can paint without a second
      // fetch; `from` carries this page's url state so the back link restores the query
      // and facet selections.
      state={{ product, from: fromPath }}
      onClick={() => {
        // Commerce click analytics, same pattern as CommerceResultTemplate. No
        // preventDefault, so cmd/ctrl-click and middle-click still work, and no
        // window.open: clickUri is `provider://<id>`, not a navigable url.
        controller?.interactiveProduct({ options: { product } }).select();
      }}
    >
      {card}
    </CardLink>
  );
};

export default ProviderCard;

const CardLink = styled(Link)`
  display: block;
  color: inherit;
  text-decoration: none;
  border-radius: 16px;
  height: 100%;
  min-width: 0;
  &:focus-visible {
    outline: 2px solid ${Theme.primary};
    outline-offset: 2px;
  }
`;

const StyledCard = styled(Card)<{ $viewMode: MPGViewModeType }>`
  border: 1px #e5e8e8 solid;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  /* The grid gap is the only spacing between grid cards. */
  margin-bottom: ${(props) => (props.$viewMode === "grid" ? "0" : "16px")};
  height: ${(props) => (props.$viewMode === "grid" ? "100%" : "auto")};
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease;
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.12);
  }
`;

// List mode puts the headshot beside the text; grid mode stacks it above so three cards
// still fit a desktop row and one fits a 390px viewport.
const CardLayout = styled.div<{ $viewMode: MPGViewModeType }>`
  display: flex;
  min-width: 0;
  gap: ${(props) => (props.$viewMode === "grid" ? "12px" : "20px")};
  flex-direction: ${(props) => (props.$viewMode === "grid" ? "column" : "row")};
  align-items: ${(props) =>
    props.$viewMode === "grid" ? "flex-start" : "center"};
`;

const CardText = styled.div`
  min-width: 0;
  flex: 1 1 auto;
  overflow-wrap: anywhere;
`;

// The provider name and the availability badge share one line. `flex-wrap` plus the
// badge's own `flex: 0 0 auto` means that at 390px the badge drops to the line below the
// name instead of squeezing or truncating it.
const NameRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  column-gap: 8px;
  row-gap: 4px;
  min-width: 0;
`;
