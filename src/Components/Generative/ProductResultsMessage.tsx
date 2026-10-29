import styled, { keyframes } from "styled-components";
import { memo } from "react";
import { ProductCard } from "./ProductCard";
import type { ConversationMessage } from "../../types/conversation";

type ProductResultsMessageProps = {
  message: ConversationMessage;
  isStreaming: boolean;
};

function ProductResultsMessageComponent({
  message,
  isStreaming,
}: ProductResultsMessageProps) {
  const products = message.metadata?.products ?? [];

  if (products.length === 0) {
    return (
      <MessageRow>
        <EmptyBubble>
          <ContentText>{message.content}</ContentText>
        </EmptyBubble>
      </MessageRow>
    );
  }

  const hasHeadline = Boolean(message.content);
  const showProgress = isStreaming;

  return (
    <MessageRow>
      <ProductsBubble>
        {hasHeadline && <Headline>{message.content}</Headline>}
        {showProgress && (
          <ProgressIndicator $hasHeadline={hasHeadline}>
            <PulsingDotContainer aria-hidden="true">
              <PulsingRing />
              <DotCenter />
            </PulsingDotContainer>
            <span>
              Assistant is still summarizing insights for these picks...
            </span>
          </ProgressIndicator>
        )}
        <ProductsScroller $hasContent={hasHeadline || showProgress}>
          {products.map((product, index) => (
            <ProductCard
              key={
                product.permanentid ??
                product.clickUri ??
                `${message.id}-${index}`
              }
              product={product}
              variant="compact"
            />
          ))}
        </ProductsScroller>
      </ProductsBubble>
    </MessageRow>
  );
}

export const ProductResultsMessage = memo(ProductResultsMessageComponent);

// Styled Components

const ping = keyframes`
  75%, 100% {
    transform: scale(2);
    opacity: 0;
  }
`;

const MessageRow = styled.div`
  display: flex;
  width: 100%;
  justify-content: flex-start;
`;

const EmptyBubble = styled.div`
  max-width: 600px;
  padding: 12px 16px;
  border-radius: 16px;
  font-size: 14px;
  line-height: 1.5;
  background: white;
  color: #333;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e5e5;
`;

const ContentText = styled.span`
  white-space: pre-wrap;
  word-break: break-word;
`;

const ProductsBubble = styled.div`
  display: flex;
  max-width: 100%;
  flex-direction: column;
  padding: 16px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e5e5;
`;

const Headline = styled.p`
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin: 0;
`;

const ProgressIndicator = styled.div<{ $hasHeadline: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 500;
  color: #666;
  ${(props) => (props.$hasHeadline ? "margin-top: 12px;" : "")}
`;

const PulsingDotContainer = styled.span`
  position: relative;
  display: inline-flex;
  width: 10px;
  height: 10px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
`;

const PulsingRing = styled.span`
  position: absolute;
  display: inline-flex;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #c7d2fe;
  animation: ${ping} 1s cubic-bezier(0, 0, 0.2, 1) infinite;
`;

const DotCenter = styled.span`
  position: relative;
  display: inline-flex;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #6366f1;
`;

const ProductsScroller = styled.div<{ $hasContent: boolean }>`
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 8px;
  ${(props) => (props.$hasContent ? "margin-top: 16px;" : "")}
`;
