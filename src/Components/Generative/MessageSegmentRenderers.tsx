import styled from "styled-components";
import type { ReactNode } from "react";
import type { Product } from "@coveo/headless/commerce";
import { ProductCard } from "./ProductCard";
import {
  CarouselSkeleton,
  InlineProductSkeleton,
  MarkdownSkeleton,
} from "./Skeletons";
import {
  extractInlineProductRefs,
  type PendingRichContent,
} from "../../lib/generative/message-markup-parser";
import { Answer } from "./Answer";

export function renderPendingContentSkeleton(
  pendingContent: PendingRichContent | null,
  messageId: string,
): ReactNode {
  if (!pendingContent) {
    return null;
  }

  const key = `${messageId}-pending-skeleton`;

  switch (pendingContent.type) {
    case "carousel":
      return <CarouselSkeleton key={key} />;
    case "product_ref":
      return <InlineProductSkeleton key={key} />;
    case "table":
    case "code_block":
      return <MarkdownSkeleton key={key} />;
    case "nextaction":
    default:
      return null;
  }
}

export function renderTextSegmentWithInlineProducts(
  text: string | undefined,
  productIndex: ReadonlyMap<string, Product>,
  key: string,
): ReactNode {
  if (!text) {
    return null;
  }

  const productRefs = extractInlineProductRefs(text);

  if (productRefs.length === 0) {
    // No inline products - render with markdown support
    return <Answer key={key} text={text} />;
  }

  const nodes: ReactNode[] = [];
  let cursor = 0;

  productRefs.forEach((ref, index) => {
    if (ref.startIndex > cursor) {
      const textSegment = text.slice(cursor, ref.startIndex);
      // Render text segments with markdown support
      nodes.push(<Answer key={`${key}-text-${index}`} text={textSegment} />);
    }

    nodes.push(
      <InlineProduct
        key={`${key}-product-${index}`}
        identifier={ref.identifier}
        productIndex={productIndex}
      />,
    );

    cursor = ref.endIndex;
  });

  if (cursor < text.length) {
    const textSegment = text.slice(cursor);
    nodes.push(<Answer key={`${key}-text-end`} text={textSegment} />);
  }

  return <ContentsSpan key={key}>{nodes}</ContentsSpan>;
}

type InlineProductProps = Readonly<{
  identifier: string | null;
  productIndex: ReadonlyMap<string, Product>;
}>;

function InlineProduct({ identifier, productIndex }: InlineProductProps) {
  const product = lookupProduct(identifier, productIndex);

  if (!product) {
    // Silently skip products that aren't in the index
    return null;
  }

  return (
    <InlineProductWrapper>
      <ProductCard product={product} variant="compact" />
    </InlineProductWrapper>
  );
}

type ProductCarouselProps = Readonly<{
  identifiers: string[];
  productIndex: ReadonlyMap<string, Product>;
}>;

export function ProductCarousel({
  identifiers,
  productIndex,
}: ProductCarouselProps) {
  // Filter to only include products that exist in the index
  const availableProducts = identifiers
    .map((identifier) => ({
      identifier,
      product: lookupProduct(identifier, productIndex),
    }))
    .filter(
      (item): item is { identifier: string; product: Product } =>
        item.product !== null,
    );

  if (availableProducts.length === 0) {
    return null;
  }

  return (
    <CarouselContainer>
      <CarouselList aria-label="Product carousel">
        {availableProducts.map(({ identifier, product }) => (
          <CarouselItem key={identifier}>
            <CarouselItemInner>
              <ProductCard product={product} variant="compact" />
            </CarouselItemInner>
          </CarouselItem>
        ))}
      </CarouselList>
    </CarouselContainer>
  );
}

function lookupProduct(
  identifier: string | null,
  productIndex: ReadonlyMap<string, Product>,
): Product | null {
  if (!identifier) {
    return null;
  }
  return (
    productIndex.get(identifier) ??
    productIndex.get(identifier.toLowerCase()) ??
    null
  );
}

// Styled Components

const ContentsSpan = styled.span`
  display: contents;
`;

const InlineProductWrapper = styled.div`
  margin: 12px 0;
`;

const CarouselContainer = styled.div`
  margin: 16px 0;
  display: flex;
  max-width: 100%;
  flex-direction: column;
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
  overflow-x: auto;
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
