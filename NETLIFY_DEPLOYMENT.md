# Netlify Deployment Setup

This project is configured for deployment on Netlify with serverless functions for secure token generation.

## Architecture

- **Frontend**: React + Vite app (deployed to Netlify CDN)
- **Backend**: Netlify Functions (serverless, auto-deployed with site)
- **Development**: Local API server proxied through Vite for consistent dev/prod experience

## Environment Variables

### For Local Development

Create a `.env` file in the project root with:

```
# Frontend variables (exposed to client)
VITE_PLATFORM_URL=https://platform.cloud.coveo.com
VITE_ORGANIZATION_ID=your-organization-id
VITE_USER_EMAIL=user@example.com
VITE_COMMERCE_ENGINE_URL=https://your-commerce-url.com
VITE_COMMERCE_ENGINE_TRACKING_ID=your-tracking-id
VITE_COMMERCE_ENGINE_CURRENCY=USD
VITE_COMMERCE_ENGINE_LANGUAGE=en
VITE_COMMERCE_ENGINE_COUNTRY=US
VITE_COMMERCE_RECS_SLOTID=your-recs-slot-id
VITE_GET_PRODUCT_LISTING_API_KEY=your-product-listing-api-key

# Server-side variables (for API server in development)
PLATFORM_URL=https://platform.cloud.coveo.com
ORGANIZATION_ID=your-organization-id
API_KEY=your-api-key-with-impersonate-privilege
USER_EMAIL=user@example.com
```

### For Netlify Production

In your Netlify dashboard (Site settings → Environment variables), add:

```
PLATFORM_URL=https://platform.cloud.coveo.com
ORGANIZATION_ID=your-organization-id
API_KEY=your-api-key-with-impersonate-privilege
USER_EMAIL=user@example.com
```

**Important**: Never commit API keys to the repository. The `API_KEY` should only exist in:

1. Your local `.env` file (which is gitignored)
2. Netlify's environment variable settings

## Development

```bash
npm install
npm run dev
```

This starts:

- Vite dev server on http://localhost:5173
- API server on http://localhost:3001
- Vite proxy forwards `/api/*` requests to the API server

## Deployment to Netlify

### Option 1: Netlify CLI

```bash
npm install -g netlify-cli
netlify login
netlify init  # Link to your Netlify site
netlify deploy --prod
```

### Option 2: Git Integration (Recommended)

1. Push your code to GitHub/GitLab/Bitbucket
2. In Netlify dashboard:
   - Click "Add new site" → "Import an existing project"
   - Connect your repository
   - Build settings are already configured in `netlify.toml`
3. Add environment variables in Site settings
4. Netlify will automatically deploy on every push to main

## Build Configuration

The `netlify.toml` file configures:

- Build command: `npm run build`
- Publish directory: `dist`
- Functions directory: `netlify/functions`
- Redirects `/api/*` to serverless functions

## How Token Generation Works

### Development

1. Frontend makes request to `/api/token`
2. Vite proxy forwards to `http://localhost:3001/api/token`
3. Local API server generates token using `@coveord/platform-client`

### Production

1. Frontend makes request to `/api/token`
2. Netlify redirects to `/.netlify/functions/token`
3. Serverless function generates token using environment variables

This ensures API keys are never exposed in the client-side bundle.
