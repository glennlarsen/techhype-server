var express = require("express");
var router = express.Router();
var crypto = require("crypto");
var transporter = require("./middleware/nodemailer");
var authLimiter = require("./middleware/authLimiter");
var db = require("../models");
var jsend = require("jsend");
var UserService = require("../services/UserService");
var userService = new UserService(db);
var bodyParser = require("body-parser");
var jsonParser = bodyParser.json();
var jwt = require("jsonwebtoken");

router.use(jsend.middleware);

// Post for registered users to be able to login
router.post("/login", authLimiter, jsonParser, async (req, res, next) => {
  // #swagger.tags = ['Auth']
  // #swagger.description = "Logs the user into the application. Both email and password must be correct. After successful login, the JWT token is returned - use it later in the Authorization header to access other endpoints."
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

  // Retrieve the user by email
  const user = await userService.getOneByEmail(email);

  if (!user) {
    return res.jsend.fail({
      statusCode: 400,
      result: "Incorrect email or password",
    });
  }

  // Check if the user is verified
  if (!user.Verified) {
    return res.jsend.fail({
      statusCode: 400,
      result:
        "User is not verified. Please check your email for the verification link.",
    });
  }

  // Verify the password
  crypto.pbkdf2(
    password,
    user.Salt,
    310000,
    32,
    "sha256",
    function (err, hashedPassword) {
      if (err) {
        return cb(err);
      }
      if (!crypto.timingSafeEqual(user.EncryptedPassword, hashedPassword)) {
        return res.jsend.fail({ result: "Incorrect email or password" });
      }
      let token;
      try {
        token = jwt.sign(
          {
            id: user.id,
            email: user.Email,
            role: user.Role,
            Verified: user.Verified,
            name: user.FirstName,
          },
          process.env.TOKEN_SECRET,
          { expiresIn: process.env.JWT_EXPIRATION }
        );
      } catch (err) {
        return res.jsend.error(
          "Something went wrong with creating the JWT token"
        );
      }
      return res.jsend.success({
        result: "You are logged in",
        id: user.id,
        email: user.Email,
        name: user.FirstName,
        role: user.Role,
        verified: user.Verified,
        token: token,
      });
    }
  );
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

  // Define a regular expression pattern to validate the email.
  const emailPattern = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

  // Define a regular expression pattern to validate the password.
  // This pattern enforces the requirements: minimum length 8, one uppercase, one lowercase, one number, one special character.
  const passwordPattern =
    /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*\W)(?!.* ).{8,16}$/;

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
      message:
        "Password requirements not met. It must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
    });
  }

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

      // Send a verification email to the user
      const mailOptions = {
        from: process.env.NODEMAILER_USER, // Sender's email address
        to: email, // Recipient's email address (user's email)
        subject: "Email Verification - Techhype",
        html: `
          <table width="100%" cellspacing="0" cellpadding="0">
            <tr>
              <td align="center">
                <h1 style="color: black;">Thank you for signing up on Techhype!</h1>
                <p style="color: black;">To verify your email, please click the button below:</p>
                <a href="http://tricky-cyan-zipper.cyclic.app/auth/verify/${verificationToken}" style="text-decoration: none; background-color: #54d4c6; color: black; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; display: inline-block; font-weight: bold;">
                  Verify Email
                </a>
              </td>
            </tr>
          </table>
        `, // Design the verification email in this HTML
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Email verification error:", error);
          res.jsend.fail({
            statusCode: 401,
            result: error,
          });
        } else {
          console.log("Email verification sent:", info.response);
          // Return a success response to the user
          res.jsend.success({
            statusCode: 201,
            result:
              "You created an account. Please check your email for verification instructions.",
          });
        }
      });
    }
  );
});

// Create a route for email verification
router.get("/verify/:token", async (req, res) => {
  // #swagger.tags = ['Auth']
  // #swagger.description = "Verifies the token sent to the users email."
  const { token } = req.params;

  try {
    const user = await userService.verifyToken(token);

    if (!user) {
      // Token is invalid or has expired
      return res.jsend.fail({
        statusCode: 400,
        message: "Invalid token, expired token or already verified email.",
      });
    }

    // Update the user's "Verified" field to mark the email as verified
    await user.update({ Verified: true });

    return res.jsend.success({
      result: "Email verified successfully. You can now log in.",
    });
  } catch (error) {
    console.error("Email verification error:", error);
    return res.jsend.error("Email verification failed");
  }
});

module.exports = router;
