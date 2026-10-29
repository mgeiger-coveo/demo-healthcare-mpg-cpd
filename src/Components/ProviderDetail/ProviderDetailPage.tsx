import { useContext, useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import { Link, useLocation, useParams } from "react-router-dom";
import { buildProductView } from "@coveo/headless/commerce";
import styled from "styled-components";
import ProviderAbout from "./ProviderAbout";
import ProviderAppointmentCta from "./ProviderAppointmentCta";
import ProviderHeader from "./ProviderHeader";
import ProviderNotFound from "./ProviderNotFound";
import { fetchProviderById } from "./providerService";
import {
  buildProviderAttributeChips,
  buildProviderDetailSections,
  formatTemplate,
  getProviderAffiliation,
  getProviderBio,
  getProviderImageUrl,
  getProviderInitials,
  getProviderLastName,
  getProviderSpecialtyLine,
  ProviderDetailFieldMap,
} from "./providerDetailUtils";
import { CommerceEngineContext } from "../../common/engineContext";
import { LanguageContext } from "../Internationalization/LanguageUtils";
import { MPGConfigTranslations } from "../../config/InternationalizationConfig";
import {
  MPG_PROVIDER_ABOUT_HEADING_TEMPLATE,
  MPG_PROVIDER_ATTRIBUTE_CHIPS,
  MPG_PROVIDER_BACK_LABEL,
  MPG_PROVIDER_DETAIL_FIELDS,
  MPG_PROVIDER_DETAIL_SECTIONS,
  MPG_PROVIDER_ID_FIELD,
  MPG_PROVIDER_LOADING_LABEL,
  MPG_PROVIDER_PHOTO_ALT_TEMPLATE,
} from "../../config/MPGConfig";
import { Theme } from "../../config/theme";

const fields = MPG_PROVIDER_DETAIL_FIELDS as ProviderDetailFieldMap;

type Status = "loading" | "ready" | "notFound";

const ProviderDetailPage = () => {
  const { providerId } = useParams();
  const location = useLocation();
  const commerceEngine = useContext(CommerceEngineContext);
  const { getText } = useContext(LanguageContext);

  // A card click hands the already-loaded product over in router state, so the common
  // path paints immediately. The URL param stays the source of truth: anything else —
  // a cold deep link, a refresh, a stale state object — falls through to the lookup.
  const seededProduct =
    (location.state as any)?.product?.[MPG_PROVIDER_ID_FIELD] === providerId
      ? (location.state as any).product
      : null;

  const [product, setProduct] = useState<any>(seededProduct);
  const [status, setStatus] = useState<Status>(
    seededProduct ? "ready" : "loading",
  );
  const viewedProviderId = useRef<string | null>(null);

  useEffect(() => {
    if (!providerId) {
      setStatus("notFound");
      return;
    }
    if (seededProduct) {
      setProduct(seededProduct);
      setStatus("ready");
      return;
    }

    let cancelled = false;
    setProduct(null);
    setStatus("loading");

    fetchProviderById(providerId)
      .then((resolved) => {
        if (cancelled) return;
        setProduct(resolved);
        setStatus(resolved ? "ready" : "notFound");
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("Failed to load provider:", error);
        setStatus("notFound");
      });

    return () => {
      cancelled = true;
    };
  }, [providerId, seededProduct]);

  // Commerce product-view analytics, once per resolved provider. The relay payload wants
  // a numeric price and providers carry none, so 0 is the documented stand-in.
  useEffect(() => {
    if (status !== "ready" || !product || !commerceEngine) return;
    if (viewedProviderId.current === providerId) return;
    viewedProviderId.current = providerId ?? null;
    buildProductView(commerceEngine).view({
      productId: String(product[MPG_PROVIDER_ID_FIELD] ?? providerId ?? ""),
      name: String(product[fields.name] ?? ""),
      price: 0,
    });
  }, [status, product, commerceEngine, providerId]);

  const backTo = (location.state as any)?.from ?? "/mpg";
  const backLabel = getText(
    MPG_PROVIDER_BACK_LABEL,
    MPGConfigTranslations,
    "providerBackLabel",
  );

  const name = product?.[fields.name] ? String(product[fields.name]) : "";

  return (
    <PageWrapper>
      <Card>
        {status !== "notFound" && (
          <BackLink to={backTo}>
            <Chevron aria-hidden="true">‹</Chevron>
            {backLabel}
          </BackLink>
        )}

        {status === "loading" && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "48px 0",
            }}
          >
            <CircularProgress size={28} />
            <Typography variant="body1" sx={{ color: Theme.secondaryText }}>
              {getText(
                MPG_PROVIDER_LOADING_LABEL,
                MPGConfigTranslations,
                "providerLoadingLabel",
              )}
            </Typography>
          </Box>
        )}

        {status === "notFound" && <ProviderNotFound />}

        {status === "ready" && product && (
          <>
            <ProviderHeader
              name={name}
              specialtyLine={getProviderSpecialtyLine(product, fields)}
              affiliation={getProviderAffiliation(product, fields)}
              imageUrl={getProviderImageUrl(product, fields)}
              photoAlt={formatTemplate(
                getText(
                  MPG_PROVIDER_PHOTO_ALT_TEMPLATE,
                  MPGConfigTranslations,
                  "providerPhotoAltTemplate",
                ),
                { name },
              )}
              initials={getProviderInitials(name)}
              acceptingPatients={
                product?.additionalFields?.[fields.acceptingPatients]
              }
              chips={buildProviderAttributeChips(
                product,
                MPG_PROVIDER_ATTRIBUTE_CHIPS,
                chipLabels(getText),
              )}
            />

            <Divider sx={{ margin: "32px 0" }} />

            <ProviderAbout
              heading={formatTemplate(
                getText(
                  MPG_PROVIDER_ABOUT_HEADING_TEMPLATE,
                  MPGConfigTranslations,
                  "providerAboutHeadingTemplate",
                ),
                { lastName: getProviderLastName(name) },
              )}
              bio={getProviderBio(product, fields)}
              sections={buildProviderDetailSections(
                product,
                MPG_PROVIDER_DETAIL_SECTIONS,
                sectionLabels(getText),
              )}
            />

            <ProviderAppointmentCta
              product={product}
              providerName={name}
              specialtyLine={getProviderSpecialtyLine(product, fields)}
              discoveryPath={backTo}
            />
          </>
        )}
      </Card>
    </PageWrapper>
  );
};

export default ProviderDetailPage;

// Section and chip labels default to the config value and pick up a translation when one
// exists under the matching `section<Key>` / `chip<Key>` key.
const translationKey = (prefix: string, key: string) =>
  `${prefix}${key.charAt(0).toUpperCase()}${key.slice(1)}`;

const sectionLabels = (getText: any) =>
  MPG_PROVIDER_DETAIL_SECTIONS.reduce(
    (labels: Record<string, string>, section) => {
      labels[section.key] = getText(
        section.label,
        MPGConfigTranslations,
        translationKey("section", section.key),
      );
      return labels;
    },
    {},
  );

const chipLabels = (getText: any) =>
  MPG_PROVIDER_ATTRIBUTE_CHIPS.reduce(
    (labels: Record<string, string>, chip) => {
      labels[chip.key] = getText(
        chip.label,
        MPGConfigTranslations,
        translationKey("chip", chip.key),
      );
      return labels;
    },
    {},
  );

const PageWrapper = styled.div`
  padding: 0 16px;
`;

const Card = styled.div`
  max-width: 1200px;
  margin: 90px auto 60px;
  border: 1px #e5e8e8 solid;
  border-radius: 16px;
  padding: 32px 24px;
  font-family: inherit;
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 24px;
  color: ${Theme.primary};
  font-weight: 600;
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
  &:focus-visible {
    outline: 2px solid ${Theme.primary};
    outline-offset: 2px;
  }
`;

const Chevron = styled.span`
  font-size: 20px;
  line-height: 1;
`;
