/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PLATFORM_URL: string;
  readonly VITE_ORGANIZATION_ID: string;
  readonly VITE_SEARCH_API_KEY: string;
  readonly VITE_API_KEY: string;
  readonly VITE_USER_EMAIL: string;
  readonly VITE_SERVER_PORT: string;
  readonly VITE_SEARCH_HUB: string;
  readonly VITE_SEARCH_ENGINE_PIPELINE: string;
  readonly VITE_GOOGLE_CLOUD_VISION_API_KEY: string;
  readonly VITE_CASE_ASSIST_ID: string;
  // Add all other VITE_ variables here
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
