import {
  PlatformClient,
  RestUserIdType,
  TokenModel,
} from "@coveo/platform-client";

// These placeholders are replaced at build time by the CI/CD pipeline via sed.
// At runtime, the injected values are used (falling back to process.env if not replaced).
const INJECTED_PLATFORM_URL = "INJECT_PLATFORM_URL_VALUE";
const INJECTED_ORGANIZATION_ID = "INJECT_ORGANIZATION_ID_VALUE";
const INJECTED_API_KEY = "INJECT_API_KEY_VALUE";
const INJECTED_USER_EMAIL = "INJECT_USER_EMAIL_VALUE";

// Use injected values if replaced, otherwise fall back to process.env
const PLATFORM_URL = INJECTED_PLATFORM_URL.startsWith("INJECT_")
  ? process.env.PLATFORM_URL
  : INJECTED_PLATFORM_URL;
const ORGANIZATION_ID = INJECTED_ORGANIZATION_ID.startsWith("INJECT_")
  ? process.env.ORGANIZATION_ID
  : INJECTED_ORGANIZATION_ID;
const API_KEY = INJECTED_API_KEY.startsWith("INJECT_")
  ? process.env.API_KEY
  : INJECTED_API_KEY;
const USER_EMAIL = INJECTED_USER_EMAIL.startsWith("INJECT_")
  ? process.env.USER_EMAIL
  : INJECTED_USER_EMAIL;
const isNetlifyDev =
  process.env.NETLIFY_DEV === "true" || process.env.CONTEXT === "dev";

const getEnvironmentDiagnostics = () => ({
  runtime: "netlify-dev",
  environmentSource: "process.env fallback for unreplaced build placeholders",
  variablePresence: {
    PLATFORM_URL: Boolean(PLATFORM_URL),
    ORGANIZATION_ID: Boolean(ORGANIZATION_ID),
    API_KEY: Boolean(API_KEY),
    USER_EMAIL: Boolean(USER_EMAIL),
  },
});

export const handler = async (event: any) => {
  // Allow GET and POST requests
  if (event.httpMethod !== "GET" && event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Method Not Allowed" }),
    };
  }

  // Check for required environment variables
  if (!PLATFORM_URL || !ORGANIZATION_ID || !API_KEY || !USER_EMAIL) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message:
          "Missing required environment variables. Please configure PLATFORM_URL, ORGANIZATION_ID, API_KEY, and USER_EMAIL in Netlify.",
        ...(isNetlifyDev && { diagnostics: getEnvironmentDiagnostics() }),
      }),
    };
  }

  try {
    // Parse request body if POST (for dictionary field context)
    let userEmail = USER_EMAIL;
    let dictionaryFieldContext = {};

    if (event.httpMethod === "POST" && event.body) {
      const body = JSON.parse(event.body);
      if (body.userEmail) {
        userEmail = body.userEmail;
      }
      if (body.dictionaryFieldContext) {
        dictionaryFieldContext = body.dictionaryFieldContext;
      }
    }

    const platform = new PlatformClient({
      host: PLATFORM_URL,
      organizationId: ORGANIZATION_ID,
      accessToken: API_KEY,
    });

    const tokenData: TokenModel = await platform.search.createToken({
      userIds: [
        {
          name: userEmail,
          provider: "Email Security Provider",
          type: RestUserIdType.User,
        },
      ],
      ...(Object.keys(dictionaryFieldContext).length > 0 && {
        dictionaryFieldContext,
      }),
    });

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*", // Adjust in production
      },
      body: JSON.stringify({ token: tokenData.token }),
    };
  } catch (error: any) {
    console.error("Token generation error:", error);
    return {
      statusCode: error.statusCode || 500,
      body: JSON.stringify({
        message: error.message || "Failed to generate token",
      }),
    };
  }
};
