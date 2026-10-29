import type { Context } from "https://edge.netlify.com";

/**
 * Simple test endpoint to verify streaming works correctly
 * This sends chunks one at a time to the browser to validate SSE streaming
 */
export default async (request: Request, context: Context) => {
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }

  console.log("[Stream Test] Starting streaming test");

  // Create a streaming response
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Send initial event
        const startData = `data: ${JSON.stringify({
          type: "start",
          message: "Starting stream test",
          timestamp: new Date().toISOString(),
        })}\n\n`;
        controller.enqueue(new TextEncoder().encode(startData));

        // Send 10 chunks with delays to simulate streaming
        for (let i = 1; i <= 10; i++) {
          // Wait 200ms between chunks to make streaming visible
          await new Promise((resolve) => setTimeout(resolve, 200));

          const chunkData = `data: ${JSON.stringify({
            type: "chunk",
            number: i,
            content: `This is chunk ${i} of 10. `,
            timestamp: new Date().toISOString(),
          })}\n\n`;

          controller.enqueue(new TextEncoder().encode(chunkData));
          console.log(`[Stream Test] Sent chunk ${i}`);
        }

        // Send completion event
        const doneData = `data: ${JSON.stringify({
          type: "done",
          message: "Stream test complete",
          timestamp: new Date().toISOString(),
        })}\n\n`;
        controller.enqueue(new TextEncoder().encode(doneData));

        console.log("[Stream Test] Stream complete");
        controller.close();
      } catch (error) {
        console.error("[Stream Test Error]", error);
        const errorData = `data: ${JSON.stringify({
          type: "error",
          message: error instanceof Error ? error.message : "Unknown error",
        })}\n\n`;
        controller.enqueue(new TextEncoder().encode(errorData));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "X-Accel-Buffering": "no",
    },
  });
};

export const config = { path: "/test-stream" };
