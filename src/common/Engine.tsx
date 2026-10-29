import { buildSearchEngine } from "@coveo/headless";
import {
  KEY_NAME_CONTEXT_DATA,
  KEY_NAME_PROFILE_SELECTED,
  ProfileConfig,
} from "../config/ProfileConfig";
import { configureContext } from "../Components/CustomContext/CustomContextContext";
import { buildCommerceEngine } from "@coveo/headless/commerce";
import { getSearchTokenCommerce } from "./generateToken";

const PROFILE_SELECTED: string | null = localStorage.getItem(
  KEY_NAME_PROFILE_SELECTED,
);
const CONTEXT_DATA = localStorage.getItem(KEY_NAME_CONTEXT_DATA);
let USER_ID_EMAIL = "";

if (
  CONTEXT_DATA !== null &&
  CONTEXT_DATA.length > 0 &&
  typeof PROFILE_SELECTED === "string"
) {
  USER_ID_EMAIL = JSON.parse(CONTEXT_DATA).filter((item: any) => {
    return item.name === JSON.parse(PROFILE_SELECTED);
  })[0].email;
}

const getTokenEndpoint = () => {
  // Use Netlify function endpoint (works in both dev and production)
  return "/api/token";
};

export async function getSearchToken() {
  // If VITE_SEARCH_API_KEY is defined, use it directly instead of generating a token
  const searchApiKey = import.meta.env.VITE_SEARCH_API_KEY;
  if (searchApiKey) {
    return searchApiKey;
  }

  try {
    const res = await fetch(getTokenEndpoint());
    if (!res.ok) {
      throw new Error(`Token fetch failed: ${res.status}`);
    }
    const { token } = await res.json();
    return token;
  } catch (error) {
    console.error("Failed to fetch token from server:", error);
    throw error;
  }
}

// Not used in the GDE-CAPI but kept here for reference
export async function initializeHeadlessEngine() {
  return buildSearchEngine({
    configuration: {
      organizationId: import.meta.env.VITE_ORGANIZATION_ID!,
      accessToken: await getSearchToken(),
      renewAccessToken: getSearchToken,
      search: {
        searchHub: "default",
      },
    },
  });
}

export async function initializeCommerceHeadlessEngine() {
  return buildCommerceEngine({
    configuration: {
      organizationId: import.meta.env.VITE_ORGANIZATION_ID!,
      accessToken: await getSearchTokenCommerce(),
      renewAccessToken: getSearchTokenCommerce,
      context: {
        //@ts-ignore
        currency: import.meta.env.VITE_COMMERCE_ENGINE_CURRENCY,
        country: import.meta.env.VITE_COMMERCE_ENGINE_COUNTRY,
        language: import.meta.env.VITE_COMMERCE_ENGINE_LANGUAGE,
        view: {
          url:
            import.meta.env.VITE_COMMERCE_ENGINE_URL + window.location.pathname,
        },
      },
      analytics: {
        trackingId: import.meta.env.VITE_COMMERCE_ENGINE_TRACKING_ID,
      },
      preprocessRequest: (request, clientOrigin, metadata) => {
        const SavedContextData = JSON.parse(
          window.localStorage.getItem(KEY_NAME_CONTEXT_DATA),
        );
        const SavedProfileSelected = JSON.parse(
          window.localStorage.getItem(KEY_NAME_PROFILE_SELECTED),
        );
        const ContextData =
          SavedContextData !== null ? SavedContextData : ProfileConfig;
        const profileSelected =
          SavedProfileSelected !== null
            ? SavedProfileSelected
            : ProfileConfig[0].name;

        const filterdProfile = ContextData.filter(
          (item) => item.name === profileSelected,
        );

        const locale = JSON.parse(
          window.localStorage.getItem("locale") || "en",
        );
        const filterdContext = filterdProfile[0].context;
        const { ContextSetObject } = configureContext(filterdContext);
        console.log(ContextSetObject);
        ContextSetObject.poc_origin = "gde";
        //@ts-ignore
        const newbody = JSON.parse(request.body);
        newbody.language = locale;
        newbody.context = {
          ...newbody.context,
          ...ContextSetObject,
        };
        request.body = JSON.stringify(newbody);
        return request;
      },
    },
  });
}
