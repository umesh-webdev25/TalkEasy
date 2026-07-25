import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { env } from '../config/env.js';
import { userRepository } from '../repositories/user.repository.js';

if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    callbackURL: env.OAUTH_REDIRECT_URI || '/api/auth/google/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails[0].value;
      let user = await userRepository.findByEmail(email);

      if (!user) {
        user = await userRepository.createUser({
          email,
          first_name: profile.name.givenName || '',
          last_name: profile.name.familyName || '',
          email_verified: profile.emails[0].verified,
        });
      }

      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }));
}

export default passport;
