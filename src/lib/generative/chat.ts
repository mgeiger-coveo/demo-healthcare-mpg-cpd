import type { Product } from "@coveo/headless/commerce";
import type {
  ConversationMessage,
  ConversationRecord,
} from "../../types/conversation";

// Re-export types for convenience
export type { ConversationRecord, ConversationMessage };

export const STORAGE_KEY = "agentic:conversations:v1";
export const MAX_CONVERSATIONS = 50;

type ToolResultParse = {
  message: string | null;
  products: Product[] | null;
};

export function parseToolResultPayload(raw: unknown): ToolResultParse {
  let message: string | null = null;

  if (typeof raw === "object" && raw !== null) {
    const candidate = raw as Record<string, unknown>;
    const value = candidate.message ?? candidate.status ?? candidate.text;
    if (typeof value === "string" && value.trim()) {
      message = value.trim();
    }
  } else if (typeof raw === "string") {
    message = raw.trim();
  }

  const products = extractProductArray(raw);

  return {
    message: message?.length ? message : null,
    products,
  };
}

function extractProductArray(source: unknown): Product[] | null {
  const stack: unknown[] = [source];
  const seen = new Set<unknown>();
  const keysToCheck = ["products", "items", "results", "hits", "documents"];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }

    if (Array.isArray(current) && current.length > 0) {
      return current as Product[];
    }

    if (typeof current === "object") {
      if (seen.has(current)) {
        continue;
      }
      seen.add(current);
      const record = current as Record<string, unknown>;
      for (const key of keysToCheck) {
        if (key in record) {
          stack.push(record[key]);
        }
      }
    }
  }

  return null;
}

export function extractAssistantChunk(value: unknown): string | null {
  const chunk = gatherAssistantChunk(value);
  if (!chunk) {
    return null;
  }

  const trimmed = chunk.trim();
  if (trimmed) {
    const normalized = trimmed.toLowerCase();
    if (
      normalized === "assistant" ||
      normalized === "user" ||
      normalized === "system" ||
      normalized === "tool" ||
      normalized === "stop" ||
      normalized === "completed"
    ) {
      return null;
    }

    const upper = trimmed.toUpperCase();
    if (upper === "[DONE]" || upper === "DONE") {
      return null;
    }
  }

  return chunk;
}

function gatherAssistantChunk(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (!value || typeof value !== "object") {
    return "";
  }

  if (Array.isArray(value)) {
    return value.map((entry) => gatherAssistantChunk(entry)).join("");
  }

  const record = value as Record<string, unknown>;

  const directKeys: Array<keyof typeof record> = ["content", "text", "message"];
  for (const key of directKeys) {
    const candidate = record[key];
    if (typeof candidate === "string") {
      return candidate;
    }
    if (Array.isArray(candidate)) {
      const aggregated = candidate
        .map((entry) => gatherAssistantChunk(entry))
        .join("");
      if (aggregated) {
        return aggregated;
      }
    }
  }

  const nestedKeys: Array<keyof typeof record> = [
    "delta",
    "contentDelta",
    "messageDelta",
    "chunk",
    "value",
    "data",
    "response",
  ];
  for (const key of nestedKeys) {
    if (key in record) {
      const nested = gatherAssistantChunk(record[key]);
      if (nested) {
        return nested;
      }
    }
  }

  const collectionKeys: Array<keyof typeof record> = [
    "choices",
    "segments",
    "parts",
  ];
  for (const key of collectionKeys) {
    const collection = record[key];
    if (Array.isArray(collection)) {
      for (const entry of collection) {
        const nested = gatherAssistantChunk(entry);
        if (nested) {
          return nested;
        }
      }
    }
  }

  return "";
}

export function findEventBoundary(buffer: string) {
  const lfIndex = buffer.indexOf("\n\n");
  const crlfIndex = buffer.indexOf("\r\n\r\n");
  if (lfIndex === -1) return crlfIndex;
  if (crlfIndex === -1) return lfIndex;
  return Math.min(lfIndex, crlfIndex);
}

export function getBoundaryLength(buffer: string, index: number) {
  return buffer.startsWith("\r\n\r\n", index) ? 4 : 2;
}

export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diffSeconds = Math.floor((now - timestamp) / 1000);

  if (diffSeconds < 60) {
    return "Just now";
  }

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  return new Date(timestamp).toLocaleDateString();
}

export function createEmptyConversation(
  title?: string,
  _timestamp?: string,
): ConversationRecord {
  const now = Date.now();
  const id = generateId();
  return {
    id,
    localId: id,
    messages: [],
    createdAt: now,
    updatedAt: now,
    title: title?.trim() || "New conversation",
  };
}

export function mergeConversations(
  existing: ConversationRecord[],
  incoming: ConversationRecord[],
): ConversationRecord[] {
  const merged = new Map<string, ConversationRecord>();

  const upsert = (record: ConversationRecord) => {
    const key = record.id;
    const current = merged.get(key);
    if (!current) {
      merged.set(key, record);
      return;
    }

    const newer = record.updatedAt > current.updatedAt ? record : current;
    const older = newer === current ? record : current;

    merged.set(key, {
      ...newer,
      title: newer.title || older.title,
      messages: newer.messages.length ? newer.messages : older.messages,
    });
  };

  for (const record of existing) {
    upsert(record);
  }
  for (const record of incoming) {
    upsert(record);
  }

  return sortConversations(Array.from(merged.values())).slice(
    0,
    MAX_CONVERSATIONS,
  );
}

export function sortConversations(
  records: ConversationRecord[],
): ConversationRecord[] {
  return [...records].sort((a, b) => b.updatedAt - a.updatedAt);
}

export function generateId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getProductGridClass(count: number) {
  if (count >= 6) {
    return "sm:grid-cols-2 xl:grid-cols-3";
  }
  if (count >= 4) {
    return "sm:grid-cols-2 lg:grid-cols-3";
  }
  if (count >= 2) {
    return "sm:grid-cols-2";
  }
  return "sm:grid-cols-1";
}
