export interface Env {
  DB: D1Database;
  R2_BUCKET: R2Bucket;
  PERIMETER_LOCK?: string;
  ENVIRONMENT?: string;
  STRIPE_SECRET?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  DAILY_API_KEY?: string;
  CF_ACCESS_TEAM_DOMAIN?: string;
  CF_ACCESS_AUD?: string;
}
