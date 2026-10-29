import React, { useContext, useEffect, useState, useRef } from "react";
import styled from "styled-components";
import { buildProductEnrichment } from "@coveo/headless/commerce";
import type { Badge } from "@coveo/headless/commerce";
import { CommerceEngineContext } from "../../common/engineContext";

const BadgeContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const BadgeChip = styled.span<{ $bgColor: string; $textColor: string }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  line-height: 1.4;
  background-color: ${(props) => props.$bgColor};
  color: ${(props) => props.$textColor};
`;

const BadgeIcon = styled.img`
  width: 14px;
  height: 14px;
  object-fit: contain;
`;

interface ProductBadgeProps {
  productId?: string;
  placementIds?: string[];
}

const ProductBadge: React.FC<ProductBadgeProps> = ({
  productId,
  placementIds,
}) => {
  const engine = useContext(CommerceEngineContext);
  const [badges, setBadges] = useState<Badge[]>([]);
  const controllerRef = useRef<ReturnType<
    typeof buildProductEnrichment
  > | null>(null);

  useEffect(() => {
    if (!engine || !placementIds?.length) return;

    const controller = buildProductEnrichment(engine, {
      options: {
        placementIds,
        ...(productId && { productId }),
      },
    });
    controllerRef.current = controller;

    const unsubscribe = controller.subscribe(() => {
      const { products } = controller.state;
      const allBadges = products.flatMap((product) =>
        product.badgePlacements.flatMap((placement) => placement.badges),
      );
      if (allBadges.length > 0) {
        setBadges(allBadges);
      }
    });

    controller.getBadges();

    return () => unsubscribe();
  }, [engine, productId, placementIds]);

  if (!badges || badges.length === 0) return null;

  return (
    <BadgeContainer>
      {badges.map((badge, index) => (
        <BadgeChip
          key={index}
          $bgColor={badge.backgroundColor}
          $textColor={badge.textColor}
        >
          {badge.iconUrl && <BadgeIcon src={badge.iconUrl} alt="" />}
          {badge.text}
        </BadgeChip>
      ))}
    </BadgeContainer>
  );
};

export default ProductBadge;
export type { Badge };
