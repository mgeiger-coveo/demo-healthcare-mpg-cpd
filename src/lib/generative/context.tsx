import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type {
  ConversationMessage,
  ConversationThinkingUpdate,
  ConversationRecord,
} from "../../types/conversation";
import { useSettings } from "./SettingsContext";

// Streaming state
interface StreamingState {
  isStreaming: boolean;
  streamError: string | null;
}

interface StreamingActions {
  onSendMessage: (message: string) => void;
  onStop: () => void;
}

// Messages context
interface MessagesContext {
  visibleMessages: ConversationMessage[];
  latestStreamingAssistantId: string | null;
  latestUserMessageId: string | null;
}

// Thinking context
export interface ThinkingUpdateSnapshot {
  updates: ConversationThinkingUpdate[];
  isComplete: boolean;
  messageId: string | null;
}

interface ThinkingContext {
  activeSnapshot: ThinkingUpdateSnapshot | null;
  pendingSnapshot: ThinkingUpdateSnapshot | null;
  expandedByMessage: Record<string, boolean>;
  showThinkingSteps: boolean;
  onToggleThinking: (messageId: string, expanded: boolean) => void;
  onTogglePendingThinking: (expanded: boolean) => void;
  onToggleShowThinkingSteps: () => void;
}

const StreamingStateContext = createContext<StreamingState>({
  isStreaming: false,
  streamError: null,
});

const StreamingActionsContext = createContext<StreamingActions>({
  onSendMessage: () => {},
  onStop: () => {},
});

const MessagesContextObj = createContext<MessagesContext>({
  visibleMessages: [],
  latestStreamingAssistantId: null,
  latestUserMessageId: null,
});

const ThinkingContextObj = createContext<ThinkingContext>({
  activeSnapshot: null,
  pendingSnapshot: null,
  expandedByMessage: {},
  showThinkingSteps: true,
  onToggleThinking: () => {},
  onTogglePendingThinking: () => {},
  onToggleShowThinkingSteps: () => {},
});

export function useStreamingState() {
  return useContext(StreamingStateContext);
}

export function useStreamingActions() {
  return useContext(StreamingActionsContext);
}

export function useMessagesContext() {
  return useContext(MessagesContextObj);
}

export function useThinkingContext() {
  return useContext(ThinkingContextObj);
}

// Conversations context
interface ConversationsState {
  conversations: ConversationRecord[];
  activeConversationId: string | null;
}

interface ConversationActions {
  onSelectConversation: (conversation: ConversationRecord) => void;
  onDeleteConversation: (conversation: ConversationRecord) => void;
  onNewConversation: () => void;
}

const ConversationsStateContext = createContext<ConversationsState>({
  conversations: [],
  activeConversationId: null,
});

const ConversationActionsContext = createContext<ConversationActions>({
  onSelectConversation: () => {},
  onDeleteConversation: () => {},
  onNewConversation: () => {},
});

export function useConversationsState() {
  return useContext(ConversationsStateContext);
}

export function useConversationActions() {
  return useContext(ConversationActionsContext);
}

interface GenerativeContextProviderProps {
  children: ReactNode;
  messages: ConversationMessage[];
  onSendMessage: (message: string) => void;
  isStreaming?: boolean;
  streamError?: string | null;
}

export function GenerativeContextProvider({
  children,
  messages,
  onSendMessage,
  isStreaming = false,
  streamError = null,
}: GenerativeContextProviderProps) {
  const [expandedByMessage, setExpandedByMessage] = useState<
    Record<string, boolean>
  >({});
  const { settings, toggleShowThinkingSteps } = useSettings();

  const handleToggleThinking = useCallback(
    (messageId: string, expanded: boolean) => {
      setExpandedByMessage((prev) => ({ ...prev, [messageId]: expanded }));
    },
    [],
  );

  const handleTogglePendingThinking = useCallback((expanded: boolean) => {
    setExpandedByMessage((prev) => ({
      ...prev,
      __PENDING_THINKING__: expanded,
    }));
  }, []);

  const streamingState: StreamingState = {
    isStreaming,
    streamError,
  };

  const streamingActions: StreamingActions = {
    onSendMessage,
    onStop: () => {},
  };

  const messagesContext: MessagesContext = {
    visibleMessages: messages,
    latestStreamingAssistantId: null,
    latestUserMessageId:
      messages.length > 0 ? messages[messages.length - 1].id : null,
  };

  const thinkingContext: ThinkingContext = {
    activeSnapshot: null,
    pendingSnapshot: null,
    expandedByMessage,
    showThinkingSteps: settings.showThinkingSteps,
    onToggleThinking: handleToggleThinking,
    onTogglePendingThinking: handleTogglePendingThinking,
    onToggleShowThinkingSteps: toggleShowThinkingSteps,
  };

  return (
    <StreamingStateContext.Provider value={streamingState}>
      <StreamingActionsContext.Provider value={streamingActions}>
        <MessagesContextObj.Provider value={messagesContext}>
          <ThinkingContextObj.Provider value={thinkingContext}>
            {children}
          </ThinkingContextObj.Provider>
        </MessagesContextObj.Provider>
      </StreamingActionsContext.Provider>
    </StreamingStateContext.Provider>
  );
}
