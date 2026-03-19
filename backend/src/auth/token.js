const crypto = require("crypto");
const config = require("../config");

const encode = (value) => Buffer.from(value, "utf8").toString("base64url");
const decode = (value) => Buffer.from(value, "base64url").toString("utf8");

const sign = (payloadEncoded) =>
  crypto.createHmac("sha256", config.sessionSecret).update(payloadEncoded).digest("base64url");

const safeCompare = (left, right) => {
  const leftBuffer = Buffer.from(left, "utf8");
  const rightBuffer = Buffer.from(right, "utf8");
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

const createAuthToken = (uid, ttlSeconds = config.sessionTtlSeconds) => {
  const payload = {
    uid,
    exp: Date.now() + ttlSeconds * 1000
  };
  const payloadEncoded = encode(JSON.stringify(payload));
  const signature = sign(payloadEncoded);
  return `${payloadEncoded}.${signature}`;
};

const verifyAuthToken = (token) => {
  if (!token || typeof token !== "string") {
    return null;
  }
  const [payloadEncoded, signature] = token.split(".");
  if (!payloadEncoded || !signature) {
    return null;
  }
  const expectedSignature = sign(payloadEncoded);
  if (!safeCompare(signature, expectedSignature)) {
    return null;
  }
  try {
    const payload = JSON.parse(decode(payloadEncoded));
    if (!payload.uid || !payload.exp || Date.now() > payload.exp) {
      return null;
    }
    return payload.uid;
  } catch (error) {
    return null;
  }
};

module.exports = {
  createAuthToken,
  verifyAuthToken
};
