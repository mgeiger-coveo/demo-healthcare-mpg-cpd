import styled, { keyframes } from "styled-components";
import { memo, useRef } from "react";
import type { Product } from "@coveo/headless/commerce";
import { Theme } from "../../config/theme";
import type { ConversationMessage } from "../../types/conversation";
import { ProductResultsMessage } from "./ProductResultsMessage";
import { registerProducts } from "../../lib/generative/product-index";
import { NextActionsSkeleton, RefinementChipsSkeleton } from "./Skeletons";
import {
  detectPendingRichContent,
  extractNextActions,
  extractRefinementChips,
  hasSpecialMarkup,
  hasPotentialStreamingMarkup,
  splitContentByCarousels,
} from "../../lib/generative/message-markup-parser";
import {
  ProductCarousel,
  renderPendingContentSkeleton,
  renderTextSegmentWithInlineProducts,
} from "./MessageSegmentRenderers";
import { NextActionsBar, RefinementChipsBar } from "./MessageActions";
import { Answer } from "./Answer";

type MessageBubbleProps = {
  message: ConversationMessage;
  isStreaming: boolean;
  productLookup?: ReadonlyMap<string, Product>;
  onFollowUpClick?: (message: string) => void;
};

type AssistantBubbleKind = "text" | "status" | "tool" | "error";

function MessageBubbleComponent({
  message,
  isStreaming,
  productLookup,
  onFollowUpClick,
}: Readonly<MessageBubbleProps>) {
  const isUser = message.role === "user";
  const kind = message.kind;
  const isAssistant = !isUser;

  if (isAssistant && kind === "products") {
    return (
      <ProductResultsMessage message={message} isStreaming={isStreaming} />
    );
  }

  const normalizedKind =
    kind === "products" ? "text" : (kind as AssistantBubbleKind);

  const shouldShowLeadingSpinner =
    isAssistant &&
    isStreaming &&
    normalizedKind !== "text" &&
    normalizedKind !== "error";

  const contentBody = isAssistant ? (
    <AssistantMessageContent
      message={message}
      isStreaming={isStreaming}
      productLookup={productLookup}
      onFollowUpClick={onFollowUpClick}
    />
  ) : (
    message.content
  );

  return (
    <BubbleRow $isUser={isUser}>
      <Bubble $isUser={isUser} $kind={normalizedKind}>
        <BubbleContent $hasSpinner={shouldShowLeadingSpinner}>
          {shouldShowLeadingSpinner && (
            <SpinnerContainer aria-hidden="true">
              <PulsingRing />
              <SpinnerDot />
            </SpinnerContainer>
          )}
          <ContentWrapper $hasSpinner={shouldShowLeadingSpinner}>
            {contentBody}
          </ContentWrapper>
        </BubbleContent>
      </Bubble>
    </BubbleRow>
  );
}

function arePropsEqual(
  prev: Readonly<MessageBubbleProps>,
  next: Readonly<MessageBubbleProps>,
) {
  if (prev.isStreaming !== next.isStreaming) {
    return false;
  }
  if (prev.productLookup !== next.productLookup) {
    return false;
  }
  if (prev.onFollowUpClick !== next.onFollowUpClick) {
    return false;
  }
  const prevMessage = prev.message;
  const nextMessage = next.message;
  return (
    prevMessage === nextMessage ||
    (prevMessage.id === nextMessage.id &&
      prevMessage.content === nextMessage.content &&
      prevMessage.kind === nextMessage.kind &&
      prevMessage.role === nextMessage.role &&
      prevMessage.ephemeral === nextMessage.ephemeral &&
      prevMessage.metadata === nextMessage.metadata)
  );
}

export const MessageBubble = memo(MessageBubbleComponent, arePropsEqual);

type AssistantMessageContentProps = Readonly<{
  message: ConversationMessage;
  isStreaming: boolean;
  productLookup?: ReadonlyMap<string, Product>;
  onFollowUpClick?: (message: string) => void;
}>;

function AssistantMessageContent({
  message,
  isStreaming,
  productLookup,
  onFollowUpClick,
}: AssistantMessageContentProps) {
  const hasShownChipsRef = useRef(false);
  const hasShownActionsRef = useRef(false);

  const { content = "" } = message;
  if (message.kind !== "text") {
    return <>{content}</>;
  }

  const hasPotentialMarkup =
    hasSpecialMarkup(content) ||
    (isStreaming && hasPotentialStreamingMarkup(content));

  if (!hasPotentialMarkup) {
    // No special markup - render with markdown support
    return <Answer text={content} />;
  }

  const pendingContent = isStreaming ? detectPendingRichContent(content) : null;

  let processableContent = content;
  if (pendingContent) {
    processableContent = content.slice(
      0,
      content.length - pendingContent.partialText.length,
    );
  }

  const { cleanedContent: contentAfterNextActions, nextActions } =
    extractNextActions(processableContent);
  const { cleanedContent, refinementChips } = extractRefinementChips(
    contentAfterNextActions,
  );

  const segments = splitContentByCarousels(cleanedContent);
  if (
    segments.length === 0 &&
    nextActions.length === 0 &&
    refinementChips.length === 0 &&
    !pendingContent
  ) {
    // No special content - render with markdown support
    return <Answer text={content} />;
  }

  const productIndex = ensureProductLookup(message, productLookup);
  const renderedSegments = segments.map((segment, index) => {
    const key = `${message.id}-${index}`;
    if (segment.type === "carousel") {
      return (
        <ProductCarousel
          key={key}
          identifiers={segment.identifiers}
          productIndex={productIndex}
        />
      );
    }
    return renderTextSegmentWithInlineProducts(
      segment.value,
      productIndex,
      key,
    );
  });

  const pendingSkeleton = renderPendingContentSkeleton(
    pendingContent,
    message.id,
  );

  const hasRefinementChips = refinementChips.length > 0;
  const hasNextActions = nextActions.length > 0;

  if (hasRefinementChips) {
    hasShownChipsRef.current = true;
  }
  if (hasNextActions) {
    hasShownActionsRef.current = true;
  }

  const isActivelyStreaming = isStreaming && pendingContent !== null;

  const showRefinementChipsSkeleton =
    isActivelyStreaming &&
    pendingContent.type === "refinement_chip" &&
    !hasShownChipsRef.current;

  const showNextActionsSkeleton =
    isActivelyStreaming &&
    pendingContent.type === "nextaction" &&
    !hasShownActionsRef.current;

  const showNextActionsBar = hasNextActions && !showNextActionsSkeleton;

  return (
    <>
      {renderedSegments}
      {pendingSkeleton}
      {showRefinementChipsSkeleton && (
        <RefinementChipsSkeleton
          key={`${message.id}-refinement-chips-skeleton`}
        />
      )}
      {hasRefinementChips && (
        <RefinementChipsBar chips={refinementChips} messageId={message.id} />
      )}
      {showNextActionsSkeleton && (
        <NextActionsSkeleton key={`${message.id}-nextactions-skeleton`} />
      )}
      {showNextActionsBar && (
        <NextActionsBar
          actions={nextActions}
          messageId={message.id}
          onFollowUpClick={onFollowUpClick}
        />
      )}
    </>
  );
}

function ensureProductLookup(
  message: ConversationMessage,
  explicitLookup?: ReadonlyMap<string, Product>,
) {
  if (explicitLookup) {
    return explicitLookup;
  }
  const fallback = new Map<string, Product>();
  registerProducts(fallback, message.metadata?.products);
  return fallback;
}

// Styled Components

const ping = keyframes`
  75%, 100% {
    transform: scale(2);
    opacity: 0;
  }
`;

const BubbleRow = styled.div<{ $isUser: boolean }>`
  display: flex;
  width: 100%;
  justify-content: ${(props) => (props.$isUser ? "flex-end" : "flex-start")};
`;

const getBubbleStyles = (isUser: boolean, kind: AssistantBubbleKind) => {
  if (isUser) {
    return `
      max-width: 600px;
      background: ${Theme.primary};
      color: white;
    `;
  }

  const kindStyles: Record<AssistantBubbleKind, string> = {
    text: `
      background: white;
      color: #333;
      border: 1px solid #e5e5e5;
    `,
    status: `
      background: #eef2ff;
      color: #4338ca;
      border: 1px solid #c7d2fe;
    `,
    tool: `
      background: #ecfeff;
      color: #0e7490;
      border: 1px solid #a5f3fc;
    `,
    error: `
      background: #fef3cd;
      color: #856404;
      border: 1px solid #ffc107;
    `,
  };

  const widthStyle =
    kind === "status" || kind === "tool" ? "max-width: 448px;" : "width: 100%;";
  return `${widthStyle} ${kindStyles[kind] || kindStyles.text}`;
};

const Bubble = styled.div<{ $isUser: boolean; $kind: AssistantBubbleKind }>`
  padding: 12px 16px;
  border-radius: 16px;
  font-size: 14px;
  line-height: 1.5;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  ${(props) => getBubbleStyles(props.$isUser, props.$kind)}
`;

const BubbleContent = styled.div<{ $hasSpinner: boolean }>`
  ${(props) =>
    props.$hasSpinner
      ? `
    display: flex;
    align-items: baseline;
    gap: 8px;
  `
      : ""}
`;

const SpinnerContainer = styled.span`
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

const SpinnerDot = styled.span`
  position: relative;
  display: inline-flex;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #6366f1;
`;

const ContentWrapper = styled.div<{ $hasSpinner: boolean }>`
  white-space: pre-wrap;
  word-break: break-word;
  ${(props) => (props.$hasSpinner ? "flex: 1;" : "")}
`;
