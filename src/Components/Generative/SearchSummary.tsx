import { useCallback, useEffect, useState, useMemo } from "react";
import type { FormEvent } from "react";
import styled, { keyframes } from "styled-components";
import ExpandMore from "@mui/icons-material/ExpandMore";
import ExpandLess from "@mui/icons-material/ExpandLess";
import AutoAwesome from "@mui/icons-material/AutoAwesome";
import { useNavigate } from "react-router";
import {
  createEmptyConversation,
  type ConversationRecord,
  type ConversationMessage,
} from "../../lib/generative/chat";
import { useAssistantStreaming } from "../../lib/generative/use-assistant-streaming";
import { useMessageDerivation } from "../../lib/generative/use-message-derivation";
import { useThinkingState } from "../../lib/generative/use-thinking-state";
import { CarouselSkeleton } from "./Skeletons";
import { MessageBubble } from "./MessageBubble";
import { registerProducts } from "../../lib/generative/product-index";
import type { Product } from "@coveo/headless/commerce";
import { Theme } from "../../config/theme";

interface SearchSummaryProps {
  searchQuery: string;
}

export function SearchSummary({ searchQuery }: SearchSummaryProps) {
  const locale = navigator.language;
  const navigate = useNavigate();

  const [isExpanded, setIsExpanded] = useState(false);
  const [conversations, setConversations] = useState<ConversationRecord[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [currentQuery, setCurrentQuery] = useState(searchQuery);
  const [inputValue, setInputValue] = useState("");

  const {
    messages,
    visibleMessages,
    activeConversation,
    latestStreamingAssistantId,
  } = useMessageDerivation({
    conversations,
    activeConversationId,
    isStreaming,
  });

  const {
    activeSnapshot: activeThinkingSnapshot,
    setActiveSnapshot,
    clearActiveSnapshot,
  } = useThinkingState({
    visibleMessages,
    isStreaming,
    latestStreamingAssistantId,
    activeConversationId,
  });

  const { streamAssistantResponse, abortStream } = useAssistantStreaming({
    locale,
    setConversations,
    setIsStreaming,
    setStreamError,
    endpoint: "/api/agentic/conversation",
    onThinkingUpdate: (snapshot) => {
      setActiveSnapshot(snapshot);
    },
  });

  // Find the latest assistant message with products
  const latestAssistantMessage = [...visibleMessages]
    .reverse()
    .find((msg) => msg.role === "assistant");

  const products = latestAssistantMessage?.metadata?.products ?? [];
  const hasContent = visibleMessages.length > 0;

  // Check if we're actively thinking (has thinking snapshot and no products yet)
  const isActivelyThinking =
    activeThinkingSnapshot !== null &&
    !activeThinkingSnapshot.isComplete &&
    products.length === 0;

  // Create product lookup map
  const productLookup = useMemo(() => {
    const map = new Map<string, Product>();
    if (products.length > 0) {
      registerProducts(map, products as Product[]);
    }
    return map;
  }, [products]);

  // Initialize or reinitialize conversation when query changes
  useEffect(() => {
    if (!searchQuery) return;

    // If query changed, reset everything
    if (searchQuery !== currentQuery) {
      setConversations([]);
      setActiveConversationId(null);
      setIsExpanded(false);
      setStreamError(null);
      setCurrentQuery(searchQuery);
      setInputValue("");
      clearActiveSnapshot();
      return; // Exit and let effect re-run with new query
    }

    const conversation = createEmptyConversation(searchQuery);

    setConversations([conversation]);
    setActiveConversationId(conversation.localId);

    // Send the search query as a message
    const sendQuery = async () => {
      const userMessage: ConversationMessage = {
        id: crypto.randomUUID(),
        role: "user" as const,
        content: searchQuery,
        timestamp: Date.now(),
        kind: undefined,
      };

      setConversations((prev) =>
        prev.map((conv) =>
          conv.localId === conversation.localId
            ? { ...conv, messages: [...conv.messages, userMessage] }
            : conv,
        ),
      );

      await streamAssistantResponse({
        conversationLocalId: conversation.localId,
        userMessage: searchQuery,
        sessionId: conversation.sessionId,
      });
    };

    void sendQuery();

    return () => {
      abortStream();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, currentQuery]);

  const handleToggle = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const handleFollowUpSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const value = inputValue.trim();
      if (!value || !activeConversation) return;

      // Navigate to generative route with conversation ID
      const params = new URLSearchParams({
        conversationId: activeConversation.localId,
        q: value,
      });
      navigate(`/generative?${params.toString()}`);
    },
    [inputValue, activeConversation, navigate],
  );

  const handleFollowUpClick = useCallback(
    (message: string) => {
      if (!activeConversation) return;

      const params = new URLSearchParams({
        conversationId: activeConversation.localId,
        q: message,
      });
      navigate(`/generative?${params.toString()}`);
    },
    [activeConversation, navigate],
  );

  // Show loading state immediately on mount
  if (!hasContent) {
    return (
      <SummaryContainer>
        <SummaryInner>
          <SummaryCard>
            <HeaderSection>
              <IconWrapper>
                <StyledSparklesIcon className="animate-pulse" />
              </IconWrapper>
              <Title>AI Summary</Title>
            </HeaderSection>
            <CarouselSkeleton />
          </SummaryCard>
        </SummaryInner>
      </SummaryContainer>
    );
  }

  // Don't render if there's an error
  if (streamError) {
    return null;
  }

  return (
    <SummaryContainer>
      <SummaryInner>
        <SummaryCard>
          {/* Header with toggle and inline product chips */}
          <HeaderContainer>
            <HeaderRow>
              <HeaderContent>
                <TitleSection>
                  <IconWrapper>
                    <StyledSparklesIcon />
                  </IconWrapper>
                  <Title>Intent Recommendations</Title>
                  {isActivelyThinking && (
                    <ThinkingDots>
                      <PulsingDot />
                      <PulsingDot />
                      <PulsingDot />
                    </ThinkingDots>
                  )}
                </TitleSection>

                {/* Inline product chips - shown when collapsed */}
                {!isExpanded && products.length > 0 && (
                  <ProductChipsContainer>
                    {products.slice(0, 4).map((product: Product) => (
                      <ProductChipStyled key={product.ec_product_id}>
                        {product.ec_name || product.ec_product_id}
                      </ProductChipStyled>
                    ))}
                  </ProductChipsContainer>
                )}
              </HeaderContent>

              <ToggleButton onClick={handleToggle} aria-expanded={isExpanded}>
                {isExpanded ? (
                  <StyledChevronUpIcon />
                ) : (
                  <StyledChevronDownIcon />
                )}
              </ToggleButton>
            </HeaderRow>
          </HeaderContainer>

          {/* Expanded state: Show full conversation with chat input */}
          {isExpanded && (
            <ExpandedContent>
              {/* Messages */}
              <MessagesContainer>
                {visibleMessages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isStreaming={isStreaming}
                    productLookup={productLookup}
                    onFollowUpClick={handleFollowUpClick}
                  />
                ))}
              </MessagesContainer>

              {/* Chat input footer */}
              <ChatFooter>
                {streamError && <ErrorBanner>{streamError}</ErrorBanner>}
                <ChatForm onSubmit={handleFollowUpSubmit}>
                  <TextareaWrapper>
                    <ChatTextarea
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Ask a follow-up question..."
                      rows={2}
                      disabled={isStreaming}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          if (!isStreaming && inputValue.trim()) {
                            handleFollowUpSubmit(e as any);
                          }
                        }
                      }}
                    />
                    <SendButtonContainer>
                      <SendButton
                        type="submit"
                        disabled={isStreaming || !inputValue.trim()}
                      >
                        Send
                      </SendButton>
                    </SendButtonContainer>
                  </TextareaWrapper>
                  <HelpText>
                    Press Enter to continue the conversation in full mode
                  </HelpText>
                </ChatForm>
              </ChatFooter>
            </ExpandedContent>
          )}
        </SummaryCard>
      </SummaryInner>
    </SummaryContainer>
  );
}

// Keyframes
const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

// Styled components
const SummaryContainer = styled.div`
  background-color: #ffffff;
  padding-bottom: 2rem;
`;

const SummaryInner = styled.div`
  max-width: 80rem;
  margin: 0 auto;
  padding: 2rem 1rem;

  @media (min-width: 640px) {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }

  @media (min-width: 1024px) {
    padding-left: 2rem;
    padding-right: 2rem;
  }
`;

const SummaryCard = styled.div`
  border-radius: 0.5rem;
  border: 1px solid ${Theme.primary}33;
  background-color: ${Theme.primary}08;
  overflow: hidden;
`;

const HeaderSection = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const HeaderContainer = styled.div`
  padding: 1rem 1.5rem;
`;

const HeaderRow = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  min-width: 0;
`;

const TitleSection = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
`;

const IconWrapper = styled.div`
  display: flex;
  align-items: center;
`;

const StyledSparklesIcon = styled(AutoAwesome)`
  height: 1.25rem;
  width: 1.25rem;
  color: ${Theme.primary};

  &.animate-pulse {
    animation: ${pulse} 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
`;

const Title = styled.h3`
  font-size: 1rem;
  font-weight: 500;
  color: ${Theme.primaryText};
  margin: 0;
`;

const ThinkingDots = styled.div`
  display: flex;
  align-items: center;
  gap: 0.375rem;
`;

const PulsingDot = styled.div`
  width: 0.375rem;
  height: 0.375rem;
  background-color: ${Theme.primary};
  border-radius: 9999px;
  animation: ${pulse} 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
`;

const ProductChipsContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  min-width: 0;
  margin-left: 1rem;
`;

const ProductChipStyled = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  background-color: ${Theme.primary}14;
  color: ${Theme.primaryText};
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 160px;
  border: 1px solid ${Theme.primary}22;
`;

const ToggleButton = styled.button`
  flex-shrink: 0;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 0.8;
  }
`;

const StyledChevronUpIcon = styled(ExpandLess)`
  height: 1.25rem;
  width: 1.25rem;
  color: ${Theme.secondaryText};
`;

const StyledChevronDownIcon = styled(ExpandMore)`
  height: 1.25rem;
  width: 1.25rem;
  color: ${Theme.secondaryText};
`;

const ExpandedContent = styled.div`
  background-color: #ffffff;
`;

const MessagesContainer = styled.div`
  padding: 1rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: 600px;
  overflow-y: auto;
`;

const ChatFooter = styled.div`
  border-top: 1px solid #e2e8f0;
  background-color: #f9fafb;
  padding: 1rem 1.5rem;
`;

const ErrorBanner = styled.div`
  margin-bottom: 0.75rem;
  border-radius: 0.375rem;
  border: 1px solid #fde68a;
  background-color: #fffbeb;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  color: #b45309;
`;

const ChatForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const TextareaWrapper = styled.div`
  position: relative;
  border-radius: 1rem;
  border: 1px solid #cbd5e1;
  background-color: #ffffff;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);

  &:focus-within {
    border-color: ${Theme.primary};
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }
`;

const ChatTextarea = styled.textarea`
  display: block;
  width: 100%;
  resize: none;
  border-radius: 1rem;
  border: none;
  padding: 0.75rem 1rem;
  padding-right: 4rem;
  font-size: 0.875rem;
  color: ${Theme.primaryText};
  font-family: inherit;

  &::placeholder {
    color: #9ca3af;
  }

  &:focus {
    outline: none;
  }

  &:disabled {
    background-color: #f9fafb;
    cursor: not-allowed;
  }
`;

const SendButtonContainer = styled.div`
  position: absolute;
  bottom: 0.5rem;
  right: 0.5rem;
`;

const SendButton = styled.button`
  display: inline-flex;
  align-items: center;
  border-radius: 0.5rem;
  background-color: ${Theme.primary};
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: ${Theme.buttonText};
  border: none;
  cursor: pointer;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  transition: background-color 0.2s ease;

  &:hover:not(:disabled) {
    background-color: ${Theme.primary}dd;
  }

  &:focus-visible {
    outline: 2px solid ${Theme.primary};
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const HelpText = styled.p`
  font-size: 0.75rem;
  color: ${Theme.secondaryText};
  text-align: center;
  margin: 0;
`;
