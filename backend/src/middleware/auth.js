const User = require("../models/User");
const { verifyAuthToken } = require("../auth/token");

const getBearerToken = (req) => {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) {
    return "";
  }
  return header.slice("Bearer ".length).trim();
};

const requireAuth = async (req, res, next) => {
  const bearerToken = getBearerToken(req);
  const tokenUserId = verifyAuthToken(bearerToken);
  const userId = req.session.userId || tokenUserId;

  if (!userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  try {
    const user = await User.findById(userId)
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
