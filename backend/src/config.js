require("dotenv").config();

const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 4000),
  mongoUri: process.env.MONGODB_URI || process.env.DATABASE_URL,
  sessionSecret: process.env.SESSION_SECRET || "dev_secret_change_me",
  allowedOrigins: (process.env.ALLOWED_ORIGINS || "http://localhost:5173")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
  devLoginEmail: process.env.DEV_LOGIN_EMAIL || "demo@upenn.edu",
  devAuthEnabled: process.env.DEV_AUTH_ENABLED !== "false",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  host: process.env.HOST || "0.0.0.0",
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  googleCallbackUrl:
    process.env.GOOGLE_CALLBACK_URL ||
    "http://127.0.0.1:4000/auth/google/callback"
};

if (!config.mongoUri) {
  throw new Error("MONGODB_URI is required");
}

config.isProduction = config.nodeEnv === "production";

module.exports = config;
