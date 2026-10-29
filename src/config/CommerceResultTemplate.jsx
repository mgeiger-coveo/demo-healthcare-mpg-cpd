import React from "react";
import {
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Rating,
  Chip,
  Skeleton,
  Box,
} from "@mui/material";
import styled from "styled-components";
import ProductBadge from "../Components/ProductBadge/ProductBadge";
import { BadgePlacementIds } from "./SearchConfig";

const StyledCard = styled(Card)`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  flex-grow: 1;
  border: none;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  min-width: 280px;
  overflow: hidden;
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease;
  &:hover {
    cursor: pointer;
    transform: translateY(-4px);
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.12);
  }
`;

const StyledGrid = styled(Grid)`
  display: flex;
  flex-direction: column;
`;

const ImageWrapper = styled.div`
  position: relative;
  background: #f8f9fa;
  overflow: hidden;
`;

const VariantContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 12px;
`;

const Variant = styled.img`
  width: 36px;
  height: 36px;
  object-fit: contain;
  border-radius: 8px;
  border: 2px solid transparent;
  background: #f8f9fa;
  transition:
    border-color 0.2s ease,
    transform 0.2s ease;
  &:hover {
    border-color: #5d237d;
    transform: scale(1.1);
  }
`;

const formatPrice = (price) => {
  return price.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,");
};

const ResultTemplate = ({ controller, product }) => {
  const [productImage, setProductImage] = React.useState(product.ec_images[0]);
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const interactiveResult = controller.interactiveProduct({
    options: {
      product: product,
    },
  });

  return (
    <StyledGrid size={{ xs: 12, sm: 6, md: 3 }} p={1} key={product.permanentid}>
      <StyledCard
        onClick={() => {
          interactiveResult.select();
          window.open(product.clickUri);
        }}
      >
        <ImageWrapper>
          {!imageLoaded && (
            <Skeleton
              variant="rectangular"
              width="100%"
              height="260px"
              sx={{ position: "absolute", top: 0, left: 0, bgcolor: "#f0f0f0" }}
            />
          )}
          <CardMedia
            component="img"
            height="100%"
            image={productImage}
            alt={product.ec_name}
            onLoad={() => setImageLoaded(true)}
            sx={{
              objectFit: "contain",
              opacity: imageLoaded ? 1 : 0,
              transition: "opacity 0.3s ease",
            }}
          />
        </ImageWrapper>
        <CardContent
          sx={{
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            flexGrow: 1,
          }}
        >
          <ProductBadge
            productId={product.permanentid}
            placementIds={BadgePlacementIds}
          />
          {product.ec_brand && (
            <Typography
              variant="caption"
              sx={{
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#5d237d",
                fontSize: "0.7rem",
              }}
            >
              {product.ec_brand}
            </Typography>
          )}
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 600,
              lineHeight: 1.3,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
            component="div"
          >
            {product.ec_name}
          </Typography>
          {product.ec_rating && (
            <Box sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Rating
                name="read-only"
                value={product.ec_rating}
                size="small"
                readOnly
                sx={{ color: "#faaf00" }}
              />
              <Typography variant="caption" color="text.secondary">
                {product.ec_rating.toFixed(1)}
              </Typography>
            </Box>
          )}
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              textOverflow: "ellipsis",
              fontSize: "0.8rem",
              lineHeight: 1.5,
            }}
          >
            {product.ec_description}
          </Typography>
          <Box sx={{ marginTop: "auto", paddingTop: "12px" }}>
            {product.ec_price && (
              <Typography
                variant="h6"
                sx={{ fontWeight: 700, color: "#1a1a2e", fontSize: "1.15rem" }}
              >
                ${formatPrice(product.ec_price)}
              </Typography>
            )}
          </Box>
          <VariantContainer>
            {product.children.length > 0 &&
              product.children
                .slice(1, 6)
                .map((variant) => (
                  <Variant
                    src={variant.ec_images[0]}
                    key={variant.permanentid}
                    alt={variant.ec_name}
                    onMouseOver={() => setProductImage(variant.ec_images[0])}
                    onMouseOut={() => setProductImage(product.ec_images[0])}
                    onClick={() => window.open(variant.clickUri)}
                  />
                ))}
          </VariantContainer>
        </CardContent>
      </StyledCard>
    </StyledGrid>
  );
};

export const ResultSkeleton = () => {
  return (
    <StyledGrid size={{ xs: 12, sm: 6, md: 3 }} p={1}>
      <StyledCard>
        <Skeleton
          variant="rectangular"
          width={"100%"}
          height={"260px"}
          sx={{ borderRadius: "16px 16px 0 0", bgcolor: "#f0f0f0" }}
        />
        <CardContent
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            padding: "20px",
          }}
        >
          <Skeleton
            variant="rounded"
            width={80}
            height={12}
            sx={{ borderRadius: "4px" }}
          />
          <Skeleton
            variant="rounded"
            width={"85%"}
            height={18}
            sx={{ borderRadius: "6px" }}
          />
          <Skeleton
            variant="rounded"
            width={120}
            height={16}
            sx={{ borderRadius: "4px" }}
          />
          <Skeleton
            variant="rounded"
            width={"100%"}
            height={36}
            sx={{ borderRadius: "6px" }}
          />
          <Skeleton
            variant="rounded"
            width={90}
            height={22}
            sx={{ borderRadius: "6px", marginTop: "8px" }}
          />
        </CardContent>
      </StyledCard>
    </StyledGrid>
  );
};

export default ResultTemplate;
