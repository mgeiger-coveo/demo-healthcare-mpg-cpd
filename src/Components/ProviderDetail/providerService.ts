// Provider lookup for the detail page.
//
// The lookup deliberately does NOT go through `buildSearch(engine)`: the commerce search
// state is a single flat slice, so running a lookup query through the shared engine would
// overwrite the /mpg page's query and facet selections — exactly the context the back
// navigation has to preserve. Instead this is an isolated request to the same Commerce
// API endpoint, using the same credential the engine uses.

import {
  MPG_PROVIDER_DETAIL_SEARCH_PER_PAGE,
  MPG_PROVIDER_ID_FIELD,
} from "../../config/MPGConfig";
// Pure, no React and no engine import, so the lazy token path gains no module weight and
// there is no import cycle.
import { buildSearchViewUrl } from "../MPG/mpgUtils";

/**
 * Picks the provider whose id field matches exactly. Relevance ranking is not trusted:
 * without the strict equality check a partial id match could render the wrong provider.
 */
export const selectProviderById = (
  products: any[] | undefined,
  providerId: string,
  idField: string = MPG_PROVIDER_ID_FIELD,
) => {
  if (!Array.isArray(products) || !providerId) return null;
  const match = products.find(
    (product) => String(product?.[idField] ?? "") === String(providerId),
  );
  return match ?? null;
};

/**
 * Resolves a single provider by `ec_product_id`.
 *
 * Resolves `null` when the catalog has no such provider (a normal not-found, not an
 * error) and throws when the request itself fails, so the page can tell the two apart
 * instead of spinning forever.
 */
/**
 * The Commerce API rejects a request without a `clientId`. The engine keeps the visitor
 * id in the `coveo_visitorId` cookie and mirrors it to localStorage, so the lookup reuses
 * it rather than minting a second identity for the same visitor.
 */
export const getVisitorClientId = () => {
  const fromCookie = document.cookie
    .split(";")
    .map((entry) => entry.trim().split("="))
    .find(([name]) => name === "coveo_visitorId");
  if (fromCookie?.[1]) return decodeURIComponent(fromCookie[1]);

  const fromStorage = window.localStorage.getItem("visitorId");
  if (fromStorage) return fromStorage.replace(/^"|"$/g, "");

  return crypto.randomUUID();
};

export const fetchProviderById = async (providerId: string) => {
  if (!providerId) return null;

  const organizationId = import.meta.env.VITE_ORGANIZATION_ID;
  // Imported lazily: the token module reads localStorage at module scope, which would
  // make `selectProviderById` untestable outside a browser-like environment.
  const { getSearchTokenCommerce } = await import("../../common/generateToken");
  const accessToken = await getSearchTokenCommerce();

  const response = await fetch(
    `https://${organizationId}.org.coveo.com/rest/organizations/${organizationId}/commerce/v2/search`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        trackingId: import.meta.env.VITE_COMMERCE_ENGINE_TRACKING_ID,
        clientId: getVisitorClientId(),
        language: import.meta.env.VITE_COMMERCE_ENGINE_LANGUAGE,
        country: import.meta.env.VITE_COMMERCE_ENGINE_COUNTRY,
        currency: import.meta.env.VITE_COMMERCE_ENGINE_CURRENCY,
        context: {
          // The real browser location of the detail page, for the same reason the search
          // page uses it: VITE_COMMERCE_ENGINE_URL hardcoded a dev origin AND the
          // unrelated /search path into the reported url. This is a commerce/v2/search
          // POST, and search resolution — unlike listing resolution — never looks the
          // view url up in the Merchandising Hub, so changing it carries no routing risk.
          view: {
            url: buildSearchViewUrl(`/providers/${providerId}`),
          },
        },
        query: providerId,
        page: 0,
        perPage: MPG_PROVIDER_DETAIL_SEARCH_PER_PAGE,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Provider lookup failed: ${response.status}`);
  }

  const body = await response.json();
  return selectProviderById(body?.products, providerId);
};
