# demo-healthcare-mpg-cpd

Healthcare Commerce POC. It includes the following features:

1. Search Page (commerce api)
2. Product Listing Page (commerce api)
3. Recommendation (search api)
4. Commerce Agent (AI-powered shopping assistant via AWS Bedrock AgentCore)

Will work only with the commerce catalog and CMH setup.

## Prerequisite

- Node v20 or greater (tested on v22)
- Netlify-CLI v23 or greater (tested on v23): `npm install -g netlify-cli`
- You should have an `.env` file at the root of this project (see [.env.example](./.env.example))

## API Keys

demo-healthcare-mpg-cpd requires a Product Listing key and one of two authentication options:

### Authentication (choose one)

**Option 1 (default) -- Authentication API Key (`API_KEY`)**

Use an API key with the **"Authenticated Search"** preset. This key stays server-side and is used to generate short-lived search tokens via `api-server.js` (local dev) or Netlify Functions (production). This is the recommended approach for production deployments.

Set in `.env`:

```bash
API_KEY=your-api-key-with-impersonate-privilege
```

**Option 2 -- Search API Key (`VITE_SEARCH_API_KEY`)**

Use a Search API key directly in the browser. When defined, the app skips server-side token generation entirely and uses this key as the access token for all search engines and the Commerce Agent. This is simpler to set up but the key is exposed to the client.

Set in `.env`:

```bash
VITE_SEARCH_API_KEY=your-search-api-key
```

> If `VITE_SEARCH_API_KEY` is set, it takes priority over `API_KEY`.

### Product Listing Key (required)

**`VITE_GET_PRODUCT_LISTING_API_KEY`** -- an API key with the following privileges:

- Commerce > Catalog = View
- Commerce > Merchandising Hub = View
- Commerce > Product listing = View

## Cloning and Running the Application in local

Clone the project into local

```bash
git clone https://github.com/mgeiger-coveo/demo-healthcare-mpg-cpd.git

cd demo-healthcare-mpg-cpd
```

Install all the npm packages. Go into the project folder and type the following command to install all npm packages

```bash
npm install
```

To run the application, type the following command

```bash
netlify dev
```

This starts both the API server (port 3001) and the Vite dev server concurrently.

The Application Runs on **[localhost:5173/](http://localhost:5173/)**

> **Note:** If you need to test Netlify edge functions (e.g., the Commerce Agent streaming), use `npx netlify dev` instead, which runs the full Netlify local environment.

## Configuration Steps

1. Copy [.env.example](./.env.example) to `.env` and update the configuration: the required API keys, organization ID, Commerce Storefront values.
1. For Commerce agent: Create a `.env.local` file at the root of the project and add your AWS credentials (`AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`). _You can ask the team (SEs, or jdevost) for the credentials if you don't have them._
1. For Commerce agent: update `VITE_AGENT_NAME` and `VITE_AGENT_PURPOSE` in file [.env](./.env)

### Agent Configuration (optional)

The Commerce Agent feature requires additional environment variables in your `.env`:

```bash
# Agent persona
VITE_AGENT_NAME="Your agent name and persona description"
VITE_AGENT_PURPOSE="Your agent's purpose description"

# AWS Bedrock AgentCore
AWS_REGION=us-east-1
AWS_BEDROCK_AGENTCORE_QUALIFIER=DEFAULT
AWS_ROLE_ARN=arn:aws:iam::your-account-id:role/YourRole
AWS_BEDROCK_AGENTCORE_RUNTIME_ARN=arn:aws:bedrock-agentcore:us-east-1:your-account-id:runtime/your-runtime

# AWS credentials (put these in .env.local, NOT in .env)
# AWS_ACCESS_KEY_ID=AKIA...
# AWS_SECRET_ACCESS_KEY=lho...
```

## Creating demo branches

When creating a new branch, follow this format:

`feature/<work-item-description>`

Replace `<work-item-description>` with a brief, descriptive name of the work item.

## Deploying to Netlify

The application is configured to be deployed on Netlify. Branches containing `demo` in their name are automatically deployed (for example, `demo-my-demo`).
