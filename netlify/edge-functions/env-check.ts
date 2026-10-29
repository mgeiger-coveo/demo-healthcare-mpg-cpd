import type { Context } from "https://edge.netlify.com";

/**
 * Diagnostic endpoint to check environment configuration
 * Returns which environment variables are set (without revealing values)
 */
export default async (request: Request, context: Context) => {
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
      },
    });
  }

  // List of required environment variables for OIDC auth
  const requiredOIDC = [
    "AWS_REGION",
    "AWS_ROLE_ARN",
    "AWS_BEDROCK_AGENTCORE_RUNTIME_ARN",
  ];

  // Optional OIDC token variables (at least one should be set)
  const oidcTokenVars = ["AWS_WEB_IDENTITY_TOKEN", "NETLIFY_OIDC_TOKEN"];

  // List of required environment variables for access key auth
  const requiredAccessKeys = [
    "AWS_REGION",
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
    "AWS_BEDROCK_AGENTCORE_RUNTIME_ARN",
  ];

  const optionalVars = [
    "AWS_BEDROCK_AGENTCORE_QUALIFIER",
    "VITE_GET_PRODUCT_LISTING_API_KEY",
    "VITE_ORGANIZATION_ID",
    "VITE_PLATFORM_URL",
    "VITE_COMMERCE_ENGINE_LANGUAGE",
    "VITE_COMMERCE_ENGINE_COUNTRY",
    "VITE_COMMERCE_ENGINE_CURRENCY",
    "VITE_COMMERCE_ENGINE_TRACKING_ID",
  ];

  // Check which variables are set (without revealing values)
  const envStatus = {
    authMethod: "none" as "oidc" | "access_keys" | "none",
    oidc: {} as Record<string, { set: boolean; length?: number }>,
    oidcTokens: {} as Record<string, { set: boolean; length?: number }>,
    accessKeys: {} as Record<string, { set: boolean; length?: number }>,
    optional: {} as Record<string, { set: boolean; length?: number }>,
    allRequiredSet: false,
  };

  // Check OIDC configuration
  let oidcComplete = true;
  for (const varName of requiredOIDC) {
    const value = Deno.env.get(varName);
    const isSet = !!value;
    envStatus.oidc[varName] = {
      set: isSet,
      length: value ? value.length : 0,
    };
    if (!isSet) {
      oidcComplete = false;
    }
  }

  // Check OIDC token variables (at least one should be set)
  let hasOidcToken = false;
  for (const varName of oidcTokenVars) {
    const value = Deno.env.get(varName);
    const isSet = !!value;
    envStatus.oidcTokens[varName] = {
      set: isSet,
      length: value ? value.length : 0,
    };
    if (isSet) {
      hasOidcToken = true;
    }
  }

  // Check access key configuration
  let accessKeysComplete = true;
  for (const varName of requiredAccessKeys) {
    const value = Deno.env.get(varName);
    const isSet = !!value;
    envStatus.accessKeys[varName] = {
      set: isSet,
      length: value ? value.length : 0,
    };
    if (!isSet) {
      accessKeysComplete = false;
    }
  }

  // Determine auth method
  if (oidcComplete && hasOidcToken) {
    envStatus.authMethod = "oidc";
    envStatus.allRequiredSet = true;
  } else if (accessKeysComplete) {
    envStatus.authMethod = "access_keys";
    envStatus.allRequiredSet = true;
  }

  for (const varName of optionalVars) {
    const value = Deno.env.get(varName);
    envStatus.optional[varName] = {
      set: !!value,
      length: value ? value.length : 0,
    };
  }

  // Provide helpful setup instructions
  let setupInstructions = "";
  if (envStatus.authMethod === "oidc") {
    setupInstructions = "✅ OIDC authentication is configured and ready!";
  } else if (envStatus.authMethod === "access_keys") {
    setupInstructions =
      "✅ Access key authentication is configured (Note: OIDC is recommended for production)";
  } else if (oidcComplete && !hasOidcToken) {
    setupInstructions =
      "⚠️ OIDC role is configured but token is missing. Token will be provided automatically by Netlify in production.";
  } else {
    setupInstructions =
      "⚠️ AWS authentication is not configured. Set up either OIDC (recommended) or access keys.";
  }

  return new Response(
    JSON.stringify(
      {
        status: envStatus.allRequiredSet ? "ready" : "configuration_needed",
        authMethod: envStatus.authMethod,
        message: setupInstructions,
        environment: envStatus,
        instructions: {
          oidc: {
            description:
              "Recommended for production - uses temporary credentials via OIDC",
            local: "For local testing, you may need to use access keys instead",
            netlify: "Netlify automatically provides OIDC token in production",
            required: [
              "AWS_ROLE_ARN (IAM role that trusts Netlify OIDC provider)",
              "AWS_WEB_IDENTITY_TOKEN or NETLIFY_OIDC_TOKEN (auto-provided by Netlify)",
            ],
            example: `
AWS_REGION=us-east-1
AWS_ROLE_ARN=arn:aws:iam::<your-aws-account-id>:role/<your-netlify-oidc-role>
AWS_BEDROCK_AGENTCORE_RUNTIME_ARN=arn:aws:bedrock-agentcore:us-east-1:<your-aws-account-id>:runtime/<your-runtime-name>
            `.trim(),
          },
          accessKeys: {
            description:
              "For local development only - not recommended for production",
            local: "Create a .env file in the project root",
            netlify:
              "Set in Netlify dashboard under Site settings > Environment variables",
            required: ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY"],
            example: `
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_BEDROCK_AGENTCORE_RUNTIME_ARN=arn:aws:bedrock-agentcore:us-east-1:<your-aws-account-id>:runtime/<your-runtime-name>
            `.trim(),
          },
        },
      },
      null,
      2,
    ),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    },
  );
};

export const config = { path: "/env-check" };
