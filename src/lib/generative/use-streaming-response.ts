import { useCallback, useRef } from "react";
import type { Product } from "@coveo/headless/commerce";
import type { ConversationThinkingUpdate } from "../../types/conversation";

export interface StreamEvent {
  type:
    | "session"
    | "chunk"
    | "done"
    | "error"
    | "message"
    | "tool_result"
    | "status"
    | "status_update"
    | "tool_invocation"
    | "turn_started"
    | "turn_complete";
  sessionId?: string;
  content?: string;
  message?: string;
  timestamp?: string;
  // For upstream 'message' type events
  payload?: {
    sessionId?: string;
    message?: string;
    products?: Product[];
  };
  // For tool_result events
  products?: Product[];
}

export interface UseStreamingResponseOptions {
  endpoint: string;
  onChunk?: (content: string, accumulated: string) => void;
  onComplete?: (fullContent: string, sessionId?: string) => void;
  onError?: (error: string) => void;
  onSessionStart?: (sessionId: string) => void;
  onProducts?: (products: Product[]) => void;
  onThinkingUpdate?: (update: ConversationThinkingUpdate) => void;
}

export interface StreamingResponseResult {
  streamResponse: (payload: {
    message: string;
    conversationHistory?: Array<{ role: string; content: string }>;
    sessionId?: string;
    accessToken?: string;
  }) => Promise<{ content: string; sessionId?: string } | null>;
  abortStream: () => void;
}

/**
 * Hook for handling Server-Sent Events (SSE) streaming responses
 * from the /agent-stream endpoint
 */
export function useStreamingResponse({
  endpoint,
  onChunk,
  onComplete,
  onError,
  onSessionStart,
  onProducts,
  onThinkingUpdate,
}: UseStreamingResponseOptions): StreamingResponseResult {
  const abortControllerRef = useRef<AbortController | null>(null);

  const abortStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const streamResponse = useCallback(
    async (payload: {
      message: string;
      conversationHistory?: Array<{ role: string; content: string }>;
      sessionId?: string;
    }): Promise<{ content: string; sessionId?: string } | null> => {
      // Abort any existing stream
      abortStream();

      const controller = new AbortController();
      abortControllerRef.current = controller;

      // Set a timeout for the entire stream
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minutes

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage =
            errorData.message ||
            errorData.error ||
            `HTTP error! status: ${response.status}`;
          onError?.(errorMessage);
          return null;
        }

        // Check if it's an SSE stream
        const contentType = response.headers.get("Content-Type") || "";
        if (!contentType.includes("text/event-stream")) {
          // Fallback to JSON response (for non-streaming endpoints)
          const data = await response.json();
          const content = data.response || data.message || "";
          onComplete?.(content, data.sessionId);
          return { content, sessionId: data.sessionId };
        }

        // Handle SSE stream
        const reader = response.body?.getReader();
        if (!reader) {
          onError?.("No response body available");
          return null;
        }

        const decoder = new TextDecoder();
        let buffer = "";
        let accumulatedContent = "";
        let sessionId: string | undefined;

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          // Decode the chunk and add to buffer
          buffer += decoder.decode(value, { stream: true });

          // Process complete SSE events (separated by double newlines)
          const events = buffer.split("\n\n");
          // Keep the last incomplete event in the buffer
          buffer = events.pop() || "";

          for (const eventText of events) {
            if (!eventText.trim()) continue;

            // Parse SSE format: "data: {...}"
            const lines = eventText.split("\n");
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const jsonStr = line.slice(6); // Remove "data: " prefix
                  const event: StreamEvent = JSON.parse(jsonStr);

                  switch (event.type) {
                    case "session":
                      sessionId = event.sessionId;
                      onSessionStart?.(sessionId || "");
                      break;

                    case "message":
                      // Handle upstream agent message format
                      if (event.payload?.message) {
                        accumulatedContent += event.payload.message;
                        onChunk?.(event.payload.message, accumulatedContent);
                      }
                      // Also capture sessionId from payload if present
                      if (event.payload?.sessionId && !sessionId) {
                        sessionId = event.payload.sessionId;
                        onSessionStart?.(sessionId);
                      }
                      break;

                    case "chunk":
                      if (event.content) {
                        accumulatedContent += event.content;
                        onChunk?.(event.content, accumulatedContent);
                      }
                      break;

                    case "done":
                      onComplete?.(accumulatedContent, sessionId);
                      break;

                    case "tool_result":
                      // Handle products from tool results
                      const products =
                        event.products ?? event.payload?.products;
                      if (products && products.length > 0) {
                        onProducts?.(products);
                      }
                      // Also record as a thinking update
                      const toolResultText =
                        event.message ??
                        event.payload?.message ??
                        "Tool completed";
                      if (toolResultText) {
                        onThinkingUpdate?.({
                          type: "tool_call",
                          status: "active",
                          message: toolResultText,
                        });
                      }
                      break;

                    case "status":
                    case "status_update":
                    case "turn_started": {
                      // Capture sessionId if present
                      if (event.payload?.sessionId && !sessionId) {
                        sessionId = event.payload.sessionId;
                        onSessionStart?.(sessionId);
                      }
                      // Record as thinking update
                      const statusText =
                        event.message ?? event.payload?.message;
                      if (statusText) {
                        onThinkingUpdate?.({
                          type: "other",
                          status: "active",
                          message: statusText,
                        });
                      }
                      break;
                    }

                    case "tool_invocation": {
                      // Capture sessionId if present
                      if (event.payload?.sessionId && !sessionId) {
                        sessionId = event.payload.sessionId;
                        onSessionStart?.(sessionId);
                      }
                      // Record as thinking update (tool kind)
                      const toolText = event.message ?? event.payload?.message;
                      if (toolText) {
                        onThinkingUpdate?.({
                          type: "tool_call",
                          status: "active",
                          message: toolText,
                        });
                      }
                      break;
                    }

                    case "turn_complete":
                      // Turn is complete, no action needed here
                      break;

                    case "error":
                      onError?.(event.message || "Unknown stream error");
                      break;
                  }
                } catch (parseError) {
                  console.warn("Failed to parse SSE event:", line, parseError);
                }
              }
            }
          }
        }

        return { content: accumulatedContent, sessionId };
      } catch (error: any) {
        clearTimeout(timeoutId);

        if (error.name === "AbortError") {
          onError?.("Request was aborted or timed out");
        } else {
          onError?.(error.message || "Unknown error occurred");
        }
        return null;
      } finally {
        abortControllerRef.current = null;
      }
    },
    [
      endpoint,
      onChunk,
      onComplete,
      onError,
      onSessionStart,
      onProducts,
      onThinkingUpdate,
      abortStream,
    ],
  );

  return { streamResponse, abortStream };
}
