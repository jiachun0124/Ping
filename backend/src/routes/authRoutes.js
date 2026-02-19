const express = require("express");
const User = require("../models/User");
const passport = require("../auth/passport");
const config = require("../config");

const router = express.Router();

const buildUserResponse = (user) => ({
  uid: user._id.toString(),
  username: user.username,
  email: user.email,
  is_verified: user.is_verified,
  interest_tags: user.interest_tags || []
});

const findOrCreateUser = async ({ email, username }) => {
  const existing = await User.findOne({ email }).lean();
  if (existing) {
    if (!existing.is_verified) {
      const updated = await User.findByIdAndUpdate(
        existing._id,
        { is_verified: true },
        { new: true }
      ).lean();
      return updated;
    }
    return existing;
  }

  const user = await User.create({
    username: username || email.split("@")[0],
    email,
    is_verified: true
  });
  return user.toObject();
};

router.get("/google", (req, res, next) => {
  if (!config.googleClientId || !config.googleClientSecret) {
    return res.status(501).json({ error: "OAuth not configured" });
  }
  return passport.authenticate("google", { scope: ["profile", "email"] })(req, res, next);
});

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${config.frontendUrl}/login?error=oauth`
  }),
  (req, res) => {
    if (req.user?._id) {
      req.session.userId = req.user._id.toString();
    }
    return res.redirect(`${config.frontendUrl}/map`);
  }
);

router.post("/dev", async (req, res, next) => {
  if (!config.devAuthEnabled) {
    return res.status(403).json({ error: "Dev auth disabled" });
  }
  const { email, username } = req.body;
  if (!email) {
    return res.status(400).json({ error: "email is required" });
  }
  try {
    const user = await findOrCreateUser({ email, username });
    req.session.userId = user._id ? user._id.toString() : user.uid;
    return res.json({ user: buildUserResponse(user) });
  } catch (error) {
    return next(error);
  }
});

router.get("/me", async (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  try {
    const user = await User.findById(req.session.userId).lean();
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    return res.json(buildUserResponse(user));
  } catch (error) {
    return next(error);
  }
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("ping.sid");
    res.json({ logged_out: true });
  });
});

module.exports = router;
