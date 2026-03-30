require("dotenv").config();

const nodeEnv = process.env.NODE_ENV || "development";
const isProduction = nodeEnv === "production";

const config = {
  nodeEnv,
  port: Number(process.env.PORT || 4000),
  mongoUri: process.env.MONGODB_URI || process.env.DATABASE_URL,
  sessionSecret: process.env.SESSION_SECRET || "dev_secret_change_me",
  sessionTtlSeconds: Number(process.env.SESSION_TTL_SECONDS || 60 * 60 * 24 * 7),
  redisUrl: process.env.REDIS_URL || "",
  redisSessionPrefix: process.env.REDIS_SESSION_PREFIX || "ping:sess:",
  allowedOrigins: (process.env.ALLOWED_ORIGINS || "http://localhost:5173")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
  devLoginEmail: process.env.DEV_LOGIN_EMAIL || "demo@upenn.edu",
  devAuthEnabled: process.env.DEV_AUTH_ENABLED !== "false",
  frontendUrl:
    (isProduction ? process.env.FRONTEND_URL_PROD : process.env.FRONTEND_URL_DEV) ||
    process.env.FRONTEND_URL ||
    "http://localhost:5173",
  host: process.env.HOST || "0.0.0.0",
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  googleCallbackUrl:
    (isProduction
      ? process.env.GOOGLE_CALLBACK_URL_PROD
      : process.env.GOOGLE_CALLBACK_URL_DEV) ||
    process.env.GOOGLE_CALLBACK_URL ||
    "http://127.0.0.1:4000/auth/google/callback",
  smtpHost: process.env.SMTP_HOST || "",
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpUser: process.env.SMTP_USER || "",
  smtpPass: process.env.SMTP_PASS || "",
  smtpFrom: process.env.SMTP_FROM || "",
  smtpSecure: process.env.SMTP_SECURE === "true",
  isLambdaRuntime: Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME)
};

if (!config.mongoUri) {
  throw new Error("MONGODB_URI is required");
}

config.isProduction = isProduction;

module.exports = config;
