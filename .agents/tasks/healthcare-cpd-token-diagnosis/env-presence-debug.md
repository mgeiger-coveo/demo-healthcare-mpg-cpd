# Local token environment-presence diagnostics

## Change

`netlify/functions/token.ts` now adds a `diagnostics` object to the existing missing-configuration HTTP 500 response only when the handler is running in Netlify Dev (`NETLIFY_DEV=true` or `CONTEXT=dev`). The existing status code and message are unchanged.

The diagnostic contains only boolean presence for these variables:

- `PLATFORM_URL`
- `ORGANIZATION_ID`
- `API_KEY`
- `USER_EMAIL`

It also states that unreplaced build placeholders resolve through `process.env`. It never includes variable values, tokens, headers, or credentials. Production and deploy-preview contexts do not receive this object.

## Local endpoint attempt

Started `netlify dev --offline` and made a bounded request to `http://localhost:8888/api/token` with curl configured for a 10-second maximum. The execution environment did not return a response and the request wrapper timed out after 30 seconds. Therefore no endpoint-derived boolean-presence outcome was obtained in this session.

The user stated that `API_KEY` is intentionally absent. The diagnostic will report it as `false` when the local Netlify function is reachable. The status remains HTTP 500 until all four required variables are present.

## Verification

- `npm run build`: passed.
- `npm test -- --run`: passed, 20 test files and 350 tests.
