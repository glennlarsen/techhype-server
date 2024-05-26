const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const transporter = require("./middleware/nodemailer");
const authLimiter = require("./middleware/authLimiter");
const db = require("../models");
const jsend = require("jsend");
const UserService = require("../services/UserService");
const userService = new UserService(db);
const bodyParser = require("body-parser");
const jsonParser = bodyParser.json();
const axios = require('axios');
const { auth, requiresAuth } = require("express-openid-connect");

router.use(jsend.middleware);

const config = {
  authRequired: false,
  auth0Logout: true,
  secret: process.env.AUTH0_CLIENT_SECRET,
  baseURL: process.env.BASE_URL,
  clientID: process.env.AUTH0_CLIENT_ID,
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}`,
  redirectUriPath: '/auth/callback' // Add this to specify the callback URL path
};

// Initialize Auth0 authentication middleware
router.use(auth(config));

// Post for registered users to be able to login
router.post("/login", authLimiter, jsonParser, (req, res) => {
  console.log('Login route called, redirecting to Auth0 login');
  res.oidc.login({ returnTo: '/' });
});

// Route to handle the callback from Auth0
router.get('/callback', requiresAuth(), async (req, res) => {
  console.log('Callback route called from Auth0');
  const user = req.oidc.user;
  
  // Find or create the user in your MySQL database
  let dbUser = await userService.getOneByEmail(user.email);
  
  if (!dbUser) {
    // If user doesn't exist in the database, create a new user
    dbUser = await userService.create({
      email: user.email,
      firstName: user.given_name,
      lastName: user.family_name,
      role: 'user', // Set default role or based on your logic
      verified: true // Assuming Auth0 has already verified the user
    });
  }

  res.jsend.success({
    result: "You are logged in",
    id: dbUser.id,
    email: dbUser.email,
    name: dbUser.firstName,
    role: dbUser.role,
    verified: dbUser.verified
  });
});

// Route for logout
router.post('/logout', (req, res) => {
  req.oidc.logout({ returnTo: process.env.BASE_URL });
});

// Post for new users to register / signup
router.post("/signup", jsonParser, async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  // Define a regular expression pattern to validate the email.
  const emailPattern = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
  
  // Define a regular expression pattern to validate the password.
  const passwordPattern = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*\W)(?!.* ).{8,16}$/;

  // Check if the email meets the requirements
  if (!emailPattern.test(email)) {
    return res.jsend.fail({
      statusCode: 400,
      message: "Invalid email format. Please provide a valid email address.",
    });
  }

  // Check if the password meets the requirements
  if (!passwordPattern.test(password)) {
    return res.jsend.fail({
      statusCode: 400,
      message: "Password requirements not met. It must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
    });
  }

  // Check if the user already exists in your database
  let user = await userService.getOneByEmail(email);
  if (user != null) {
    return res.jsend.fail({
      statusCode: 409,
      email: "Provided email is already in use.",
    });
  }

  // Create the user in Auth0
  try {
    const auth0User = await axios.post(`https://${process.env.AUTH0_DOMAIN}/dbconnections/signup`, {
      client_id: process.env.AUTH0_CLIENT_ID,
      email: email,
      password: password,
      connection: 'Username-Password-Authentication', // Make sure this matches your Auth0 DB connection
      user_metadata: {
        firstName: firstName,
        lastName: lastName
      }
    });

    // Create the user in your local database
    const salt = crypto.randomBytes(16);
    const hashedPassword = await new Promise((resolve, reject) => {
      crypto.pbkdf2(password, salt, 310000, 32, "sha256", (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });

    user = await userService.create({
      firstName,
      lastName,
      email,
      hashedPassword,
      salt,
      verified: true // Assuming Auth0 handles email verification
    });

    res.jsend.success({
      statusCode: 201,
      result: "You created an account. Please check your email for verification instructions.",
    });
  } catch (error) {
    console.error("Auth0 signup error:", error.response.data);
    res.jsend.fail({
      statusCode: 500,
      result: error.response.data,
    });
  }
});

module.exports = router;
