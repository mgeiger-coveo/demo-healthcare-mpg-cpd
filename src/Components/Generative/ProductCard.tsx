import styled from "styled-components";
import type { Product } from "@coveo/headless/commerce";
import { Link } from "react-router-dom";
import Star from "@mui/icons-material/Star";
import { Theme } from "../../config/theme";

interface ProductCardProps {
  product: Product;
  onSelect?: () => void;
  className?: string;
  variant?: "default" | "compact";
}

export function ProductCard({
  product,
  onSelect,
  className = "",
  variant = "default",
}: ProductCardProps) {
  const isCompact = variant === "compact";

  // Extract product properties with fallbacks
  const title =
    (product.additionalFields?.ec_item_group_name as string) ||
    product.ec_name ||
    product.ec_product_id ||
    "Product";
  const price = product.ec_price;
  const promoPrice = product.ec_promo_price;
  const hasPromo = promoPrice && promoPrice < (price || 0);
  const rating = product.ec_rating || 0;
  const imageUrl = Array.isArray(product.ec_images)
    ? product.ec_images[0]
    : product.ec_images;
  const clickUri = product.clickUri || "#";
  const description = product.ec_shortdesc || product.ec_description || "";

  // Get product link path
  let productLink = clickUri;
  try {
    productLink = new URL(clickUri).pathname;
  } catch {
    // Keep clickUri as-is if not a valid URL
  }

  if (isCompact) {
    return (
      <CompactCardWrapper
        style={{ width: "160px", minWidth: "160px", maxWidth: "160px" }}
      >
        <CompactCardLink
          to={productLink}
          onClick={onSelect}
          className={className}
        >
          {imageUrl ? (
            <CompactImage
              src={imageUrl}
              alt={title}
              loading="lazy"
              width={160}
              height={160}
            />
          ) : (
            <CompactImagePlaceholder>
              <PlaceholderIcon
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                />
              </PlaceholderIcon>
            </CompactImagePlaceholder>
          )}
          <CompactTitle>{title}</CompactTitle>
          <StarRating>
            {Array.from(Array(5).keys()).map((i) => (
              <Star
                key={i}
                sx={{
                  fontSize: 14,
                  color: i < Math.floor(rating) ? "#fde047" : "#94a3b8",
                }}
              />
            ))}
          </StarRating>
          <CompactPriceRow>
            <CompactPrice $hasPromo={hasPromo}>
              ${price?.toFixed(2)}
            </CompactPrice>
            {hasPromo && (
              <CompactPromoPrice>${promoPrice?.toFixed(2)}</CompactPromoPrice>
            )}
          </CompactPriceRow>
        </CompactCardLink>
      </CompactCardWrapper>
    );
  }

  return (
    <CardWrapper>
      <CardLink to={productLink} onClick={onSelect} className={className}>
        {imageUrl ? (
          <CardImage
            src={imageUrl}
            alt={title}
            loading="lazy"
            width={1024}
            height={1024}
          />
        ) : (
          <ImagePlaceholder>
            <PlaceholderIcon
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
              />
            </PlaceholderIcon>
          </ImagePlaceholder>
        )}
        <CardTitle>{title}</CardTitle>
        <StarRating>
          {Array.from(Array(5).keys()).map((i) => (
            <Star
              key={i}
              sx={{
                fontSize: 20,
                color: i < Math.floor(rating) ? "#fde047" : "#94a3b8",
              }}
            />
          ))}
        </StarRating>
        <PriceRow>
          <CardPrice $hasPromo={hasPromo}>${price?.toFixed(2)}</CardPrice>
          {hasPromo && (
            <CardPromoPrice>${promoPrice?.toFixed(2)}</CardPromoPrice>
          )}
        </PriceRow>
        {description && <Description>{description}</Description>}
      </CardLink>
    </CardWrapper>
  );
}

// Styled Components - Default variant

const CardWrapper = styled.div``;

const CardLink = styled(Link)`
  display: block;
  text-decoration: none;

  &:hover img {
    opacity: 0.75;
  }
`;

const CardImage = styled.img`
  aspect-ratio: 1/1;
  width: 100%;
  border-radius: 8px;
  background: #e5e7eb;
  object-fit: cover;
`;

const ImagePlaceholder = styled.div`
  aspect-ratio: 1/1;
  width: 100%;
  border-radius: 8px;
  background: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const PlaceholderIcon = styled.svg`
  width: 48px;
  height: 48px;
  color: #9ca3af;
`;

const CardTitle = styled.h3`
  margin-top: 16px;
  font-size: 14px;
  color: ${Theme.primaryText};
`;

const StarRating = styled.div`
  display: flex;
`;

const PriceRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
  font-size: 18px;
  font-weight: 500;
`;

const CardPrice = styled.div<{ $hasPromo?: boolean }>`
  color: ${(props) => (props.$hasPromo ? "#9ca3af" : Theme.primaryText)};
  text-decoration: ${(props) => (props.$hasPromo ? "line-through" : "none")};
`;

const CardPromoPrice = styled.div`
  color: ${Theme.primaryText};
`;

const Description = styled.p`
  font-size: 12px;
  color: ${Theme.secondaryText};
  margin: 8px 0 0 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

// Styled Components - Compact variant

const CompactCardWrapper = styled.div``;

const CompactCardLink = styled(Link)`
  display: block;
  text-decoration: none;

  &:hover img {
    opacity: 0.75;
  }
`;

const CompactImage = styled.img`
  aspect-ratio: 1/1;
  width: 100%;
  border-radius: 8px;
  background: #e5e7eb;
  object-fit: cover;
  width: 160px;
  height: 160px;
`;

const CompactImagePlaceholder = styled.div`
  aspect-ratio: 1/1;
  width: 160px;
  height: 160px;
  border-radius: 8px;
  background: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CompactTitle = styled.h3`
  margin-top: 8px;
  font-size: 12px;
  color: ${Theme.primaryText};
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const CompactPriceRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 2px;
  font-size: 14px;
  font-weight: 500;
`;

const CompactPrice = styled.div<{ $hasPromo?: boolean }>`
  color: ${(props) => (props.$hasPromo ? "#9ca3af" : Theme.primaryText)};
  text-decoration: ${(props) => (props.$hasPromo ? "line-through" : "none")};
`;

const CompactPromoPrice = styled.div`
  color: ${Theme.primaryText};
`;
