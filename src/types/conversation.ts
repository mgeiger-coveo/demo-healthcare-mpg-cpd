import type { Product } from "@coveo/headless/commerce";

export type ConversationRole = "user" | "assistant";

export type ConversationMessageKind =
  | "text"
  | "status"
  | "tool"
  | "error"
  | "products";

export interface ConversationThinkingUpdate {
  type: "other" | "tool_call";
  status: string;
  message: string;
}

export interface ConversationMessage {
  id: string;
  role: ConversationRole;
  content: string;
  kind?: ConversationMessageKind;
  timestamp?: number;
  ephemeral?: boolean;
  metadata?: {
    products?: Product[];
    thinkingUpdates?: ConversationThinkingUpdate[];
    [key: string]: any;
  };
}

export interface ConversationRecord {
  id: string;
  localId: string;
  sessionId?: string | null;
  messages: ConversationMessage[];
  createdAt: number;
  updatedAt: number;
  title?: string;
}
