/// <reference types="https://deno.land/x/netlify_edge/mod.ts" />
import type { Context } from "https://edge.netlify.com";

interface AgentRequestBody {
  message: string;
  conversationHistory?: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
  sessionId?: string;
}

/**
 * Generate a unique session ID (must be 33+ characters)
 */
function generateSessionId(): string {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2);
  const uuid = `${timestamp}-${random}-${Math.random().toString(36).substring(2)}`;
  return `session-${uuid}`.padEnd(33, "0");
}

/**
 * Netlify Edge Function for streaming agent responses
 * Supports true HTTP streaming with Server-Sent Events
 */
const handler = async (request: Request, context: Context) => {
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

  // Only allow POST requests
  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({
        error: "Method not allowed",
        message: "Only POST requests are supported",
      }),
      {
        status: 405,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  }

  try {
    // Parse request body
    const body: AgentRequestBody = await request.json();
    const { message, conversationHistory, sessionId } = body;

    // Validate request
    if (!message || typeof message !== "string") {
      return new Response(
        JSON.stringify({
          error: "Invalid request",
          message: "Message field is required and must be a string",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    }

    console.log(`[Agent Stream] Message: "${message.substring(0, 100)}..."`);
    console.log(
      `[Agent Stream] History length: ${conversationHistory?.length || 0}`,
    );

    // Get configuration from environment
    const agentRuntimeArn =
      Deno.env.get("AWS_BEDROCK_AGENTCORE_RUNTIME_ARN") ||
      "arn:aws:bedrock-agentcore:us-east-1:<your-aws-account-id>:runtime/<your-runtime-name>";
    const qualifier = Deno.env.get("AWS_BEDROCK_AGENTCORE_QUALIFIER");
    const region = Deno.env.get("AWS_REGION") || "us-east-1";

    // Get AWS credentials for SigV4 authentication
    const accessKeyId =
      Deno.env.get("AWS_ACCESS_KEY_ID") || "TRANE_AGENT_AWS_ACCESS_KEY_ID";
    const secretAccessKey =
      Deno.env.get("AWS_SECRET_ACCESS_KEY") ||
      "TRANE_AGENT_AWS_SECRET_ACCESS_KEY";
    const sessionToken = Deno.env.get("AWS_SESSION_TOKEN"); // Optional, for temporary credentials

    if (!accessKeyId || !secretAccessKey) {
      return new Response(
        JSON.stringify({
          error: "Configuration Error",
          message:
            "AWS credentials not configured. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY.",
          required: ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY"],
          optional: ["AWS_SESSION_TOKEN"],
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    }

    console.log(
      "[Agent Stream] Using SigV4 authentication for Bedrock AgentCore",
    );

    // Set environment variables for AWS SDK compatibility in Deno
    if (!Deno.env.get("HOME")) {
      Deno.env.set("HOME", "/tmp");
    }
    Deno.env.set("AWS_SDK_LOAD_CONFIG", "0");

    // Dynamically import AWS SDK using esm.sh for better Deno compatibility
    const { BedrockAgentCoreClient, InvokeAgentRuntimeCommand } =
      await import("https://esm.sh/@aws-sdk/client-bedrock-agentcore@3.975.0");

    // Build credentials object
    const credentials: {
      accessKeyId: string;
      secretAccessKey: string;
      sessionToken?: string;
    } = {
      accessKeyId,
      secretAccessKey,
    };
    if (sessionToken) {
      credentials.sessionToken = sessionToken;
    }

    // Initialize Bedrock Agentcore client with SigV4 credentials
    const client = new BedrockAgentCoreClient({
      region,
      credentials,
    });

    // Generate session ID
    const runtimeSessionId = sessionId || generateSessionId();

    // Prepare payload
    const payloadObject = {
      prompt: message,
      coveo: {
        accessToken:
          body.accessToken ||
          Deno.env.get("VITE_SEARCH_API_KEY") ||
          "PLACEHOLDER_VITE_SEARCH_AGENT_API_KEY",
        organizationId:
          Deno.env.get("VITE_ORGANIZATION_ID") ||
          "PLACEHOLDER_VITE_ORGANIZATION_ID",
        platformUrl:
          Deno.env.get("VITE_PLATFORM_URL") || "PLACEHOLDER_VITE_PLATFORM_URL",
        language:
          Deno.env.get("VITE_COMMERCE_ENGINE_LANGUAGE") ||
          "PLACEHOLDER_VITE_COMMERCE_ENGINE_LANGUAGE",
        locale:
          Deno.env.get("VITE_COMMERCE_ENGINE_LANGUAGE") ||
          "PLACEHOLDER_VITE_COMMERCE_ENGINE_LANGUAGE",
        country:
          Deno.env.get("VITE_COMMERCE_ENGINE_COUNTRY") ||
          "PLACEHOLDER_VITE_COMMERCE_ENGINE_COUNTRY",
        currency:
          Deno.env.get("VITE_COMMERCE_ENGINE_CURRENCY") ||
          "PLACEHOLDER_VITE_COMMERCE_ENGINE_CURRENCY",
        trackingId:
          Deno.env.get("VITE_COMMERCE_ENGINE_TRACKING_ID") ||
          "PLACEHOLDER_VITE_COMMERCE_ENGINE_TRACKING_ID",
        clientId: runtimeSessionId,
        agentName:
          Deno.env.get("VITE_AGENT_NAME") ||
          "You are the **Barca Sports Assistant**, an expert, friendly shopping companion for Barca Sports.",
        agentPurpose:
          Deno.env.get("VITE_AGENT_PURPOSE") ||
          "You understand Water Sports and can help find the perfect products for any skill levels.",
      },
    };

    console.log("Payload sent: ", payloadObject);
    const payload = new TextEncoder().encode(JSON.stringify(payloadObject));

    const input = {
      runtimeSessionId,
      agentRuntimeArn,
      payload,
      qualifier: qualifier || undefined,
    };

    // Invoke the agent
    const command = new InvokeAgentRuntimeCommand(input);
    const response = await client.send(command);

    // Create a streaming response using Server-Sent Events
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send session ID first
          const sessionData = `data: ${JSON.stringify({
            type: "session",
            sessionId: runtimeSessionId,
          })}\n\n`;
          controller.enqueue(new TextEncoder().encode(sessionData));

          // Stream the agent response
          if (response.response) {
            const streamResponse = response.response as any;

            // The AWS SDK response is a ReadableStream-like object
            // We need to read it chunk by chunk and forward to the client immediately
            try {
              // Check if it's an async iterable (Node.js stream style)
              if (streamResponse[Symbol.asyncIterator]) {
                for await (const chunk of streamResponse) {
                  // Pass through the raw bytes directly - upstream already sends SSE format
                  controller.enqueue(chunk);
                }
              }
              // Check if it has a getReader method (Web ReadableStream style)
              else if (typeof streamResponse.getReader === "function") {
                const reader = streamResponse.getReader();
                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;
                  // Pass through the raw bytes directly - upstream already sends SSE format
                  controller.enqueue(value);
                }
              }
              // Fallback: if it's a Node.js Readable stream
              else if (typeof streamResponse.on === "function") {
                await new Promise<void>((resolve, reject) => {
                  streamResponse.on("data", (chunk: any) => {
                    // Pass through the raw bytes directly - upstream already sends SSE format
                    controller.enqueue(chunk);
                  });
                  streamResponse.on("end", resolve);
                  streamResponse.on("error", reject);
                });
              }
              // Last resort: use transformToString (not streaming but works)
              else if (typeof streamResponse.transformToString === "function") {
                console.warn(
                  "[Stream Warning] Using transformToString - not true streaming",
                );
                const fullText = await streamResponse.transformToString();
                // Pass through the raw text - upstream already sends SSE format
                controller.enqueue(new TextEncoder().encode(fullText));
              }
            } catch (streamError) {
              console.error("[Stream Read Error]", streamError);
              throw streamError;
            }
          }

          // Send completion event
          const doneData = `data: ${JSON.stringify({
            type: "done",
            timestamp: new Date().toISOString(),
          })}\n\n`;
          controller.enqueue(new TextEncoder().encode(doneData));
          controller.close();
        } catch (error) {
          console.error("[Stream Error]", error);
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
  } catch (error) {
    console.error("[Agent Stream Error]", error);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: "Failed to process agent request",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  }
};

export default handler;

export const config = { path: "/agent-stream" };
