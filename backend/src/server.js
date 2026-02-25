const express = require("express");
const session = require("express-session");
const cors = require("cors");
const morgan = require("morgan");
const mongoose = require("mongoose");
const config = require("./config");
const passport = require("./auth/passport");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const eventRoutes = require("./routes/eventRoutes");
const discoveryRoutes = require("./routes/discoveryRoutes");
const mapRoutes = require("./routes/mapRoutes");

const app = express();

if (config.isProduction) {
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

app.use(
  session({
    name: "ping.sid",
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      // Frontend and backend use different domains in production, so cross-site
      // session cookies must use SameSite=None (with Secure=true).
      sameSite: config.isProduction ? "none" : "lax",
      secure: config.isProduction
    }
  })
);
app.use(passport.initialize());
app.use(passport.session());

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

const start = async () => {
  await mongoose.connect(config.mongoUri);
  app.listen(config.port, config.host, () => {
    console.log(`Ping backend listening on http://${config.host}:${config.port}`);
  });
};

start().catch((err) => {
  console.error("Failed to start server", err);
  process.exit(1);
});
