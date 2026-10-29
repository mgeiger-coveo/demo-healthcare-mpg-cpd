import type { ConversationRecord } from "./chat";
import { STORAGE_KEY, MAX_CONVERSATIONS, sortConversations } from "./chat";

/**
 * Simple localStorage-based storage for conversations.
 * For production use, consider using IndexedDB via the 'idb' package.
 */

export async function loadConversations(): Promise<ConversationRecord[]> {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ConversationRecord[];
    return sortConversations(parsed);
  } catch (error) {
    console.error("[storage] Failed to load conversations", error);
    return [];
  }
}

export async function saveConversation(
  record: ConversationRecord,
): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const existing = await loadConversations();
    const filtered = existing.filter((c) => c.id !== record.id);
    const updated = sortConversations([record, ...filtered]).slice(
      0,
      MAX_CONVERSATIONS,
    );
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("[storage] Failed to save conversation", error);
  }
}

export async function saveAllConversations(
  records: ConversationRecord[],
): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const sorted = sortConversations(records).slice(0, MAX_CONVERSATIONS);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
  } catch (error) {
    console.error("[storage] Failed to save conversations", error);
  }
}

export async function deleteConversation(id: string): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const existing = await loadConversations();
    const filtered = existing.filter((c) => c.id !== id);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("[storage] Failed to delete conversation", error);
  }
}

export async function clearAllConversations(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("[storage] Failed to clear conversations", error);
  }
}
