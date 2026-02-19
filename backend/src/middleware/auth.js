const User = require("../models/User");

const requireAuth = async (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  try {
    const user = await User.findById(req.session.userId)
      .select("username email is_verified interest_tags")
      .lean();
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    req.user = { uid: user._id.toString(), ...user };
    return next();
  } catch (error) {
    return next(error);
  }
};

const requireVerified = (req, res, next) => {
  if (!req.user || !req.user.is_verified) {
    return res.status(403).json({ error: "Verification required" });
  }
  return next();
};

module.exports = {
  requireAuth,
  requireVerified
};
