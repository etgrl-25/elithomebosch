declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    ADMIN_EMAIL?: string;
    ALLOWED_EMAILS?: string;
    ELIT_HOME_PASSWORD?: string;
    BUCKET?: R2Bucket;
  }
}
