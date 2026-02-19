const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");
const config = require("../config");

passport.serializeUser((user, done) => {
  done(null, user._id.toString());
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).lean();
    if (!user) {
      return done(null, false);
    }
    return done(null, user);
  } catch (error) {
    return done(error);
  }
});

if (config.googleClientId && config.googleClientSecret) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: config.googleClientId,
        clientSecret: config.googleClientSecret,
        callbackURL: config.googleCallbackUrl
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error("Google account has no email"));
          }
          const existing = await User.findOne({ email });
          if (existing) {
            if (!existing.is_verified) {
              existing.is_verified = true;
              await existing.save();
            }
            return done(null, existing);
          }
          const created = await User.create({
            username: profile.displayName || email.split("@")[0],
            email,
            is_verified: true
          });
          return done(null, created);
        } catch (error) {
          return done(error);
        }
      }
    )
  );
}

module.exports = passport;
