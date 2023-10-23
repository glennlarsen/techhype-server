var express = require("express");
var router = express.Router();
var crypto = require("crypto");
var db = require("../models");
var jsend = require("jsend");
var UserService = require("../services/UserService");
var userService = new UserService(db);
var bodyParser = require("body-parser");
var jsonParser = bodyParser.json();
var jwt = require("jsonwebtoken");

router.use(jsend.middleware);

// Post for registered users to be able to login
router.post("/login", jsonParser, async (req, res, next) => {
  // #swagger.tags = ['Auth']
  // #swagger.description = "Logs the user to the application. Both email and password needed to be correct. After successful login, the JWT token is returned - use it later in the Authorization header to access the other endpoints"
  /* #swagger.parameters['body'] =  {
    "name": "body",
    "in": "body",
      "schema": {
        $ref: "#/definitions/UserLogin"
      }
    }
  */
  const { email, password } = req.body;
  if (email == null) {
    return res.jsend.fail({ statusCode: 400, email: "Email is required." });
  }
  if (password == null) {
    return res.jsend.fail({
      statusCode: 400,
      password: "Password is required.",
    });
  }
  await userService.getOneByEmail(email).then((data) => {
    if (data === null) {
      return res.jsend.fail({
        statusCode: 400,
        result: "Incorrect email or password",
      });
    }
    crypto.pbkdf2(
      password,
      data.Salt,
      310000,
      32,
      "sha256",
      function (err, hashedPassword) {
        if (err) {
          return cb(err);
        }
        if (!crypto.timingSafeEqual(data.EncryptedPassword, hashedPassword)) {
          return res.jsend.fail({ result: "Incorrect email or password" });
        }
        let token;
        try {
          token = jwt.sign(
            {
              id: data.id,
              email: data.Email,
              role: data.Role,
              name: data.FirstName,
            },
            process.env.TOKEN_SECRET,
            { expiresIn: process.env.JWT_EXPIRATION }
          );
        } catch (err) {
          res.jsend.error("Something went wrong with creating JWT token");
        }
        res.jsend.success({
          result: "You are logged in",
          id: data.id,
          email: data.Email,
          name: data.FirstName,
          role: data.Role,
          token: token,
        });
      }
    );
  });
});

// Post for new users to register / signup
router.post("/signup", async (req, res, next) => {
  // #swagger.tags = ['Auth']
  // #swagger.description = "Creates a new account for the user. Name, email and password needs to be provided. After successful signup, the user can login with the created user to get a valid jwt token"
  /* #swagger.parameters['body'] =  {
    "name": "body",
    "in": "body",
      "schema": {
        $ref: "#/definitions/UserSignup"
      }
    }
  */
  const { firstName, lastName, email, password } = req.body;
  // Generate a random salt
  const salt = crypto.randomBytes(16);

  const missingAttributes = [];

  if (firstName == null) {
    missingAttributes.push("FirstName");
  }

  if (lastName == null) {
    missingAttributes.push("LastName");
  }

  if (email == null) {
    missingAttributes.push("Email");
  }

  if (password == null) {
    missingAttributes.push("Password");
  }

  if (missingAttributes.length > 0) {
    const errorMessage =
      "These attributes are required: " + missingAttributes.join(", ") + ".";
    return res.jsend.fail({ statusCode: 400, message: errorMessage });
  }
  var user = await userService.getOneByEmail(email);
  if (user != null) {
    return res.jsend.fail({
      statusCode: 409,
      email: "Provided email is already in use.",
    });
  }
  // Generate a verification token
  const verificationToken = crypto.randomBytes(32).toString("hex");
  // Calculate the expiration time (e.g., 24 hours from now)
  const expirationTime = new Date();
  expirationTime.setHours(expirationTime.getHours() + 24); // Adjust the duration as needed

  // Hash the password and create a user record with the verification token
  crypto.pbkdf2(
    password,
    salt,
    310000,
    32,
    "sha256",
    async (err, hashedPassword) => {
      if (err) {
        return next(err);
      }

      // Create a new user record with the verification token
      const user = await userService.create(
        firstName,
        lastName,
        email,
        hashedPassword,
        salt,
        verificationToken,
        expirationTime
      );

      // Send an email to the user with a link containing the verification token
      // This step is specific to your email service and needs to be implemented separately.

      // Return a success response
      res.jsend.success({
        result:
          "You created an account. Please check your email for verification instructions.",
      });
    }
  );
});

module.exports = router;
