import styled, { keyframes } from "styled-components";

const pulse = keyframes`
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
`;

export function ProductCardSkeleton() {
  return (
    <ProductCardSkeletonContainer>
      <ProductImageSkeleton />
      <ProductLineSkeleton style={{ width: "75%" }} />
      <ProductLineSkeleton style={{ width: "50%" }} />
      <StarContainer>
        {[1, 2, 3, 4, 5].map((star) => (
          <StarSkeleton key={`star-${star}`} />
        ))}
      </StarContainer>
      <ProductLineSkeleton style={{ width: "48px", height: "16px" }} />
    </ProductCardSkeletonContainer>
  );
}

export function CarouselSkeleton() {
  return (
    <CarouselSkeletonContainer>
      <CarouselList aria-label="Loading products...">
        {["slot-1", "slot-2", "slot-3"].map((slotId) => (
          <CarouselItem key={slotId}>
            <CarouselItemInner>
              <ProductCardSkeleton />
            </CarouselItemInner>
          </CarouselItem>
        ))}
      </CarouselList>
    </CarouselSkeletonContainer>
  );
}

export function InlineProductSkeleton() {
  return (
    <InlineProductSkeletonContainer>
      <ProductImageSkeleton />
      <ProductLineSkeleton style={{ width: "75%" }} />
      <ProductLineSkeleton style={{ width: "50%" }} />
    </InlineProductSkeletonContainer>
  );
}

export function NextActionsSkeleton() {
  return (
    <NextActionsSkeletonContainer>
      {["action-1", "action-2", "action-3"].map((actionId) => (
        <ActionSkeleton key={actionId} />
      ))}
    </NextActionsSkeletonContainer>
  );
}

export function RefinementChipsSkeleton() {
  return (
    <ChipsSkeletonContainer>
      {["chip-1", "chip-2"].map((chipId) => (
        <ChipSkeleton key={chipId} />
      ))}
    </ChipsSkeletonContainer>
  );
}

export function MarkdownSkeleton() {
  return (
    <MarkdownSkeletonContainer>
      <MarkdownDot />
      <span>Formatting content...</span>
    </MarkdownSkeletonContainer>
  );
}

// Styled Components

const ProductCardSkeletonContainer = styled.div`
  width: 160px;
  min-width: 160px;
  max-width: 160px;
  animation: ${pulse} 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
`;

const ProductImageSkeleton = styled.div`
  width: 160px;
  height: 160px;
  border-radius: 8px;
  background: #e5e5e5;
`;

const ProductLineSkeleton = styled.div`
  margin-top: 8px;
  height: 12px;
  border-radius: 4px;
  background: #e5e5e5;
`;

const StarContainer = styled.div`
  margin-top: 4px;
  display: flex;
  gap: 2px;
`;

const StarSkeleton = styled.div`
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #e5e5e5;
`;

const CarouselSkeletonContainer = styled.div`
  margin: 16px 0;
  display: inline-block;
  padding: 12px 16px;
  background: #f9f9f9;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.05);
`;

const CarouselList = styled.ul`
  display: flex;
  gap: 12px;
  list-style: none;
  margin: 0;
  padding: 0;
`;

const CarouselItem = styled.li`
  flex-shrink: 0;
`;

const CarouselItemInner = styled.div`
  padding: 8px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e5e5;
  height: 100%;
`;

const InlineProductSkeletonContainer = styled.div`
  margin: 12px 0;
  width: 160px;
  min-width: 160px;
  max-width: 160px;
  animation: ${pulse} 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
`;

const NextActionsSkeletonContainer = styled.div`
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e5e5;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  animation: ${pulse} 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
`;

const ActionSkeleton = styled.div`
  height: 28px;
  width: 96px;
  border-radius: 20px;
  background: #e5e5e5;
`;

const ChipsSkeletonContainer = styled.div`
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  animation: ${pulse} 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
`;

const ChipSkeleton = styled.div`
  height: 28px;
  width: 80px;
  border-radius: 20px;
  background: #e5e5e5;
`;

const MarkdownSkeletonContainer = styled.div`
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #666;
`;

const MarkdownDot = styled.span`
  display: inline-flex;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ theme }) => (theme as any)?.primary || "#d63b26"};
  animation: ${pulse} 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
`;
