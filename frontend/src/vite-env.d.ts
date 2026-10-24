/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_BACKEND_URL?: string;
  /** Google Analytics 4 id ("G-..."). Leave unset to turn analytics off. */
  readonly VITE_GA_MEASUREMENT_ID?: string;
}
