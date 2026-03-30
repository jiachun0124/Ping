const express = require("express");
const session = require("express-session");
const cors = require("cors");
const morgan = require("morgan");
const config = require("./config");
const passport = require("./auth/passport");
const { connectMongo, getSessionStore } = require("./runtime");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const eventRoutes = require("./routes/eventRoutes");
const discoveryRoutes = require("./routes/discoveryRoutes");
const mapRoutes = require("./routes/mapRoutes");

const createApp = async () => {
  await connectMongo();
  const sessionStore = await getSessionStore();
  const app = express();

  if (config.isProduction || config.isLambdaRuntime) {
    app.set("trust proxy", 1);
  }

  app.use(
    cors({
      origin: config.allowedOrigins,
      credentials: true
    })
  );
  app.use(express.json({ limit: "2mb" }));
  app.use(morgan("dev"));

  const sessionOptions = {
    name: "ping.sid",
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: config.isProduction ? "none" : "lax",
      secure: config.isProduction,
      maxAge: config.sessionTtlSeconds * 1000
    }
  };
  if (sessionStore) {
    sessionOptions.store = sessionStore;
  }

  app.use(session(sessionOptions));
  app.use(passport.initialize());
  app.use(passport.session());

  app.use((req, res, next) => {
    const start = Date.now();

    res.on("finish", () => {
      const latencyMs = Date.now() - start;
      console.log(
        `[API latency] ${req.method} ${req.originalUrl} -> ${latencyMs}ms`
      );
    });

    next();
  });

  app.get("/health", (req, res) => {
    res.json({ ok: true });
  });

  app.use("/auth", authRoutes);
  app.use("/users", userRoutes);
  app.use("/events", eventRoutes);
  app.use("/discover", discoveryRoutes);
  app.use("/map", mapRoutes);

  app.use((req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  });

  return app;
};

module.exports = { createApp };

