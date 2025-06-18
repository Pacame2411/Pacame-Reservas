/// <reference types="vite/client" />

declare interface ImportMetaEnv {
  readonly VITE_REACT_APP_SUPABASE_URL: string;
  readonly VITE_REACT_APP_SUPABASE_ANON_KEY: string;
}

declare interface ImportMeta {
  readonly env: ImportMetaEnv;
}
