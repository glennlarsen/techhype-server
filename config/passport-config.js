const passport = require('passport');
const { ExtractJwt, Strategy: JwtStrategy } = require('passport-jwt');
const Auth0Strategy = require('passport-auth0');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const UserService = require('../services/UserService');
const db = require('../models');
const userService = new UserService(db);


const auth0Domain = process.env.AUTH0_DOMAIN;
const auth0ClientID = process.env.AUTH0_CLIENT_ID;
const auth0ClientSecret = process.env.AUTH0_CLIENT_SECRET;

// Auth0 Strategy
passport.use(
  new Auth0Strategy(
    {
      domain: auth0Domain,
      clientID: auth0ClientID,
      clientSecret: auth0ClientSecret,
      callbackURL: `${process.env.BASE_URL}/auth/callback`,  // Ensure BASE_URL is set correctly
    },
    async (accessToken, refreshToken, extraParams, profile, done) => {
      try {
        // Find or create the user in your MySQL database
        let user = await userService.getOneByEmail(profile.emails[0].value);

        if (!user) {
          // If user doesn't exist in the database, create a new user
          user = await userService.create({
            email: profile.emails[0].value,
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            role: 'user', // Set default role or based on your logic
            verified: true, // Assuming Auth0 has already verified the user
          });
        }

        done(null, user);
      } catch (error) {
        done(error, null);
      }
    }
  )
);

// JWT Strategy
passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.TOKEN_SECRET,
    },
    async (jwtPayload, done) => {
      try {
        console.log("JWT Payload:", jwtPayload);
        const user = await userService.getOne(jwtPayload.id);

        if (!user) {
          return done(null, false);
        }

        return done(null, user);
      } catch (error) {
        console.log("Error in JWT Strategy:", error);
        return done(error, false);
      }
    }
  )
);



  // Facebook Strategy
passport.use(new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: `${process.env.BASE_URL}/auth/facebook/callback`,
      profileFields: ['id', 'emails', 'name'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await userService.getOneByEmail(profile.emails[0].value);
  
        if (!user) {
          user = await userService.create({
            email: profile.emails[0].value,
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            role: 'user',
            verified: true,
          });
        }

  
        done(null, user);
      } catch (error) {
        done(error, null);
      }
    }
  ));

  /*
  Use this for session based authentication, not for token based.
passport.serializeUser((user, done) => {
  return done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await userService.getOne(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});
*/

module.exports = passport;
