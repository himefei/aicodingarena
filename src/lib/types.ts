/** Cloudflare environment bindings */
export interface Env {
  ARENA_DB: D1Database;
  ARENA_FILES: R2Bucket;
  ADMIN_PASSWORD: string;
}
