import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { env } from '../config/env.js';
import { authService } from '../services/auth.service.js';

if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    callbackURL: env.OAUTH_REDIRECT_URI,
    scope: ['profile', 'email']
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails[0].value.toLowerCase();
      let user = await authService.getUserByEmail(email);
      
      if (!user) {
        const firstName = profile.name.givenName || '';
        const lastName = profile.name.familyName || '';
        // Create user with random password since they use OAuth
        user = await authService.createUser(email, firstName, lastName, Math.random().toString(36).slice(-12));
        user.email_verified = true;
        await user.save();
      }
      
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  }));
}

export { passport };
