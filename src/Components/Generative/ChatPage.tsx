import React, { useState, useRef, useCallback, useEffect } from "react";
import styled from "styled-components";
import type { Product } from "@coveo/headless/commerce";
import type { ConversationThinkingUpdate } from "../../types/conversation";
import { Theme } from "../../config/theme";
import { generateId } from "../../lib/generative/chat";
import { useStreamingResponse } from "../../lib/generative/use-streaming-response";
import { registerProducts } from "../../lib/generative/product-index";
import { useSettings } from "../../lib/generative/SettingsContext";
import {
  extractNextActions,
  extractRefinementChips,
  splitContentByCarousels,
  hasSpecialMarkup,
  hasPotentialStreamingMarkup,
  detectPendingRichContent,
} from "../../lib/generative/message-markup-parser";
import { NextActionsBar, RefinementChipsBar } from "./MessageActions";
import {
  ProductCarousel,
  renderTextSegmentWithInlineProducts,
  renderPendingContentSkeleton,
} from "./MessageSegmentRenderers";
import { NextActionsSkeleton, RefinementChipsSkeleton } from "./Skeletons";
import { Answer } from "./Answer";
import { ThinkingStatusPanel } from "./ThinkingStatusPanel";
import { getSearchToken } from "../../common/Engine";

// Markdown content renderer component
interface MarkdownRendererProps {
  content: string;
  isUser: boolean;
  messageId: string;
  isStreaming?: boolean;
  onFollowUpClick?: (message: string) => void;
  productIndex?: Map<string, Product>;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  isUser,
  messageId,
  isStreaming = false,
  onFollowUpClick,
  productIndex: externalProductIndex,
}) => {
  const hasShownChipsRef = useRef(false);
  const hasShownActionsRef = useRef(false);

  if (isUser) {
    // User messages don't need special rendering
    return <>{content}</>;
  }

  if (!content) {
    return null;
  }

  const hasPotentialMarkup =
    hasSpecialMarkup(content) ||
    (isStreaming && hasPotentialStreamingMarkup(content));

  if (!hasPotentialMarkup) {
    // No special markup - render with markdown support via Answer component
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

  // Use provided productIndex or create empty map
  const productIndex = externalProductIndex ?? new Map();

  const renderedSegments = segments.map((segment, index) => {
    const key = `${messageId}-${index}`;
    if (segment.type === "carousel") {
      return (
        <ProductCarousel
          key={key}
          identifiers={segment.identifiers ?? []}
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
    messageId,
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
          key={`${messageId}-refinement-chips-skeleton`}
        />
      )}
      {hasRefinementChips && (
        <RefinementChipsBar chips={refinementChips} messageId={messageId} />
      )}
      {showNextActionsSkeleton && (
        <NextActionsSkeleton key={`${messageId}-nextactions-skeleton`} />
      )}
      {showNextActionsBar && (
        <NextActionsBar
          actions={nextActions}
          messageId={messageId}
          onFollowUpClick={onFollowUpClick}
        />
      )}
    </>
  );
};

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  isStreaming?: boolean;
  products?: Product[];
  thinkingUpdates?: ConversationThinkingUpdate[];
}

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const productIndexRef = useRef<Map<string, Product>>(new Map());
  const [, forceProductUpdate] = useState(0);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Use a ref to track streaming message ID to avoid stale closure issues in callbacks
  const streamingMessageIdRef = useRef<string | null>(null);
  // Track thinking updates during streaming and panel expanded state
  const [activeThinkingUpdates, setActiveThinkingUpdates] = useState<
    ConversationThinkingUpdate[]
  >([]);
  const [expandedThinkingPanels, setExpandedThinkingPanels] = useState<
    Set<string>
  >(new Set());
  // Get showThinkingSteps from global settings
  const { settings } = useSettings();
  // Ref for thinking updates to access in callbacks
  const activeThinkingUpdatesRef = useRef<ConversationThinkingUpdate[]>([]);
  // Access token state for streaming responses
  const [accessToken, setAccessToken] = useState<string>("");

  // initialize accessToken for streaming responses
  useEffect(() => {
    const fetchAccessToken = async () => {
      const accessToken = await getSearchToken();
      setAccessToken(accessToken);
    };
    fetchAccessToken();
  }, []);

  // Keep ref in sync with state
  useEffect(() => {
    activeThinkingUpdatesRef.current = activeThinkingUpdates;
  }, [activeThinkingUpdates]);

  // Auto-scroll to bottom when messages or thinking updates change
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, activeThinkingUpdates]);

  // Handle streaming chunk updates
  const handleChunk = useCallback((chunk: string, accumulated: string) => {
    const currentId = streamingMessageIdRef.current;
    if (!currentId) return;
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === currentId ? { ...msg, content: accumulated } : msg,
      ),
    );
  }, []);

  // Handle stream completion
  const handleComplete = useCallback(
    (fullContent: string, newSessionId?: string) => {
      const currentId = streamingMessageIdRef.current;
      if (currentId) {
        // Copy thinking updates to the completed message
        const thinkingSnapshot = activeThinkingUpdatesRef.current;
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === currentId
              ? {
                  ...msg,
                  content: fullContent,
                  isStreaming: false,
                  thinkingUpdates:
                    thinkingSnapshot.length > 0
                      ? [...thinkingSnapshot]
                      : undefined,
                }
              : msg,
          ),
        );
      }
      streamingMessageIdRef.current = null;
      setIsLoading(false);
      if (newSessionId) {
        setSessionId(newSessionId);
      }
    },
    [],
  );

  // Handle stream errors
  const handleError = useCallback((error: string) => {
    console.error("Stream error:", error);

    let errorContent =
      "Sorry, I encountered an error processing your request. Please try again.";

    if (error.includes("abort") || error.includes("timeout")) {
      errorContent =
        "The request took too long to process. The agent might be busy. Please try again.";
    } else if (error.includes("503")) {
      errorContent =
        "Backend server is not available. Please ensure the server is running.";
    } else if (error.includes("504")) {
      errorContent =
        "The agent is taking longer than expected to respond. Please try a simpler question or try again later.";
    } else if (error) {
      errorContent = `Error: ${error}`;
    }

    const currentId = streamingMessageIdRef.current;
    // Update the streaming message with error content, or add a new error message
    setMessages((prev) => {
      if (currentId) {
        return prev.map((msg) =>
          msg.id === currentId
            ? { ...msg, content: errorContent, isStreaming: false }
            : msg,
        );
      } else {
        return [
          ...prev,
          {
            id: generateId(),
            role: "assistant" as const,
            content: errorContent,
            timestamp: Date.now(),
            isStreaming: false,
          },
        ];
      }
    });

    streamingMessageIdRef.current = null;
    setIsLoading(false);
  }, []);

  // Handle session start
  const handleSessionStart = useCallback((newSessionId: string) => {
    if (newSessionId) {
      setSessionId(newSessionId);
    }
  }, []);

  // Handle products from tool results
  const handleProducts = useCallback((products: Product[]) => {
    if (products && products.length > 0) {
      registerProducts(productIndexRef.current, products);
      // Force re-render so ProductCarousel can see the new products
      forceProductUpdate((v) => v + 1);
    }
  }, []);

  // Handle thinking updates from the stream
  const handleThinkingUpdate = useCallback(
    (update: ConversationThinkingUpdate) => {
      setActiveThinkingUpdates((prev) => {
        // Avoid duplicate updates with same text
        const last = prev.at(-1);
        if (last?.message === update.message && last.type === update.type) {
          return prev;
        }
        // Keep max 25 updates
        return [...prev.slice(-24), update];
      });
    },
    [],
  );

  const { streamResponse, abortStream } = useStreamingResponse({
    endpoint: "/agent-stream",
    onChunk: handleChunk,
    onComplete: handleComplete,
    onError: handleError,
    onSessionStart: handleSessionStart,
    onProducts: handleProducts,
    onThinkingUpdate: handleThinkingUpdate,
  });

  const handleSendMessage = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!inputValue.trim() || isLoading) return;

      const userMessage: Message = {
        id: generateId(),
        role: "user",
        content: inputValue.trim(),
        timestamp: Date.now(),
      };

      // Create placeholder for assistant response
      const assistantMessageId = generateId();
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        timestamp: Date.now(),
        isStreaming: true,
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      streamingMessageIdRef.current = assistantMessageId;
      // Reset thinking updates for the new turn
      setActiveThinkingUpdates([]);
      const messageContent = inputValue.trim();
      setInputValue("");
      setIsLoading(true);

      // Build conversation history from existing messages (excluding the new ones)
      const conversationHistory = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Start streaming
      await streamResponse({
        message: messageContent,
        conversationHistory,
        sessionId,
        accessToken,
      });
    },
    [inputValue, isLoading, messages, sessionId, streamResponse],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortStream();
    };
  }, [abortStream]);

  const suggestedPrompts = [
    "Looking for a spanish speaking family medicine specialist",
    "who can help with ortho",
    "where are your locations"


    // "Suggest a paddleboarding accessory kit for beginners",
    // "What safety gear do I need for a twilight kayak tour?",
    // "Compare waterproof deck bags for a weekend surf trip",
    // "Build a surf travel checklist with board protection and repairs",
  ];

  return (
    <ChatPageContainer>
      <ChatHeader>
        <ChatTitle>Commerce Assistant</ChatTitle>
        <ChatSubtitle>
          Ask us anything about our products and services
        </ChatSubtitle>
      </ChatHeader>

      <MessagesContainer ref={messagesContainerRef}>
        {messages.length === 0 ? (
          <EmptyState>
            <EmptyStateTitle>How can we help you today?</EmptyStateTitle>
            <EmptyStateText>
              Ask about products, services, or get help with your order
            </EmptyStateText>
            <SuggestedPrompts>
              {suggestedPrompts.map((prompt, index) => (
                <PromptButton
                  key={index}
                  onClick={() => setInputValue(prompt)}
                  disabled={isLoading}
                >
                  {prompt}
                </PromptButton>
              ))}
            </SuggestedPrompts>
          </EmptyState>
        ) : (
          <MessagesList>
            {messages.map((message) => {
              // Determine thinking updates to show: active for streaming, stored for completed
              const isCurrentlyStreaming =
                message.isStreaming &&
                message.id === streamingMessageIdRef.current;
              const thinkingUpdates = isCurrentlyStreaming
                ? activeThinkingUpdates
                : (message.thinkingUpdates ?? []);
              const showThinkingPanel =
                settings.showThinkingSteps &&
                message.role === "assistant" &&
                thinkingUpdates.length > 0;

              return (
                <React.Fragment key={message.id}>
                  {/* Thinking Status Panel for assistant messages */}
                  {showThinkingPanel && (
                    <ThinkingPanelWrapper>
                      <ThinkingStatusPanel
                        updates={thinkingUpdates}
                        isStreaming={isCurrentlyStreaming ?? false}
                        isExpanded={expandedThinkingPanels.has(message.id)}
                        onToggle={() => {
                          setExpandedThinkingPanels((prev) => {
                            const next = new Set(prev);
                            if (next.has(message.id)) {
                              next.delete(message.id);
                            } else {
                              next.add(message.id);
                            }
                            return next;
                          });
                        }}
                      />
                    </ThinkingPanelWrapper>
                  )}
                  <MessageBubble $isUser={message.role === "user"}>
                    <MessageContent $isUser={message.role === "user"}>
                      {message.isStreaming &&
                      !message.content &&
                      thinkingUpdates.length === 0 ? (
                        <TypingIndicator>
                          <Dot delay={0} />
                          <Dot delay={0.2} />
                          <Dot delay={0.4} />
                        </TypingIndicator>
                      ) : (
                        <>
                          <MarkdownRenderer
                            content={message.content}
                            isUser={message.role === "user"}
                            messageId={message.id}
                            isStreaming={message.isStreaming}
                            onFollowUpClick={(text) => setInputValue(text)}
                            productIndex={productIndexRef.current}
                          />
                          {message.isStreaming && <StreamingCursor />}
                        </>
                      )}
                    </MessageContent>
                  </MessageBubble>
                </React.Fragment>
              );
            })}
            <div ref={messagesEndRef} />
          </MessagesList>
        )}
      </MessagesContainer>

      <ChatInputContainer>
        <ChatForm onSubmit={handleSendMessage}>
          <ChatInput
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
          />
          <SendButton type="submit" disabled={!inputValue.trim() || isLoading}>
            Send
          </SendButton>
        </ChatForm>
      </ChatInputContainer>
    </ChatPageContainer>
  );
};

const ChatPageContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100vh - 150px);
  max-width: 1200px;
  margin: 120px auto 30px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.1);
  overflow: hidden;

  @media (max-width: 1000px) {
    margin: 100px 15px 15px;
    height: calc(100vh - 130px);
  }
`;

const ChatHeader = styled.div`
  padding: 20px 30px;
  border-bottom: 1px solid #e5e5e5;
  background: ${Theme.searchBarBackground};
  color: white;
`;

const ChatTitle = styled.h1`
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
`;

const ChatSubtitle = styled.p`
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px 30px;
  background: #f9f9f9;

  @media (max-width: 1000px) {
    padding: 15px;
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  padding: 40px 20px;
`;

const EmptyStateTitle = styled.h2`
  margin: 0 0 12px 0;
  font-size: 28px;
  font-weight: 600;
  color: #333;
`;

const EmptyStateText = styled.p`
  margin: 0 0 32px 0;
  font-size: 16px;
  color: #666;
  max-width: 500px;
`;

const SuggestedPrompts = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  max-width: 700px;
`;

const PromptButton = styled.button`
  padding: 12px 20px;
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  font-size: 14px;
  color: #333;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    border-color: ${Theme.primary};
    color: ${Theme.primary};
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const MessagesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const ThinkingPanelWrapper = styled.div`
  max-width: 70%;

  @media (max-width: 1000px) {
    max-width: 85%;
  }
`;

const MessageBubble = styled.div<{ $isUser: boolean }>`
  display: flex;
  justify-content: ${(props) => (props.$isUser ? "flex-end" : "flex-start")};
`;

const MessageContent = styled.div<{ $isUser: boolean }>`
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 16px;
  background: ${(props) => (props.$isUser ? Theme.primary : "white")};
  color: ${(props) => (props.$isUser ? "white" : "#333")};
  font-size: 14px;
  line-height: 1.5;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  word-wrap: break-word;

  @media (max-width: 1000px) {
    max-width: 85%;
  }
`;

const TypingIndicator = styled.div`
  display: flex;
  gap: 4px;
  padding: 4px 0;
`;

const Dot = styled.div<{ delay: number }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #999;
  animation: bounce 1.4s infinite ease-in-out;
  animation-delay: ${(props) => props.delay}s;

  @keyframes bounce {
    0%,
    60%,
    100% {
      transform: translateY(0);
    }
    30% {
      transform: translateY(-10px);
    }
  }
`;

const StreamingCursor = styled.span`
  display: inline-block;
  width: 2px;
  height: 1em;
  background: ${Theme.primary};
  margin-left: 2px;
  vertical-align: text-bottom;
  animation: blink 1s infinite;

  @keyframes blink {
    0%,
    50% {
      opacity: 1;
    }
    51%,
    100% {
      opacity: 0;
    }
  }
`;

const ChatInputContainer = styled.div`
  padding: 20px 30px;
  border-top: 1px solid #e5e5e5;
  background: white;

  @media (max-width: 1000px) {
    padding: 15px;
  }
`;

const ChatForm = styled.form`
  display: flex;
  gap: 12px;
`;

const ChatInput = styled.input`
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;

  &:focus {
    border-color: ${Theme.primary};
  }

  &:disabled {
    background: #f5f5f5;
    cursor: not-allowed;
  }
`;

const SendButton = styled.button`
  padding: 12px 32px;
  background: ${Theme.button};
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: ${Theme.button}CC;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export default ChatPage;
