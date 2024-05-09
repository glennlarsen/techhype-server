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
const { promisify } = require("util");
const jwtVerify = promisify(jwt.verify);

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
      result: "User is not verified. Please check your email for the verification link.",
    });
  }

  // Verify the password
  crypto.pbkdf2(password, user.Salt, 310000, 32, "sha256", function (err, hashedPassword) {
    if (err) {
      return res.jsend.error("Error in password encryption");
    }
    if (!crypto.timingSafeEqual(user.EncryptedPassword, hashedPassword)) {
      return res.jsend.fail({ result: "Incorrect password" });
    }

    try {
      const token = jwt.sign(
        {
          id: user.id,
          email: user.Email,
          role: user.Role,
          Verified: user.Verified,
          name: user.FirstName,
        },
        process.env.TOKEN_SECRET,
        { expiresIn: process.env.JWT_EXPIRATION }  // or "3600" (expressed in seconds)
      );

      const refreshToken = jwt.sign(
        { id: user.id },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.JWT_EXPIRATION_LONG }  // or "604800" (expressed in seconds)
      );

      // Set the JWT and refresh token in HTTP-only cookies
      res.cookie('token', token, {
        httpOnly: true,
        secure: true, // set to true if you are using https
        sameSite: 'strict'  // can be 'strict' or 'lax'
      });
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: true, // set to true if you are using https
        sameSite: 'strict'
      });

      return res.jsend.success({
        result: "You are logged in",
        id: user.id,
        email: user.Email,
        name: user.FirstName,
        role: user.Role,
        verified: user.Verified
      });
    } catch (err) {
      return res.jsend.error("Something went wrong with creating the JWT token");
    }
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
  try {
    const hashedPassword = await new Promise((resolve, reject) => {
      crypto.pbkdf2(password, salt, 310000, 32, "sha256", (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });

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
            <a href="${process.env.BASE_URL}/auth/verify/${verificationToken}" style="text-decoration: none; background-color: #54d4c6; color: black; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; display: inline-block; font-weight: bold;">
              Verify Email
            </a>
          </td>
        </tr>
      </table>
    `, // Design the verification email in this HTML
    };

    await transporter.sendMail(mailOptions);

    console.log("Email verification sent");
    // Return a success response to the user
    res.jsend.success({
      statusCode: 201,
      result:
        "You created an account. Please check your email for verification instructions.",
    });
  } catch (error) {
    console.error("Email verification error:", error);
    res.jsend.fail({
      statusCode: 401,
      result: error,
    });
  }
});

// Create a route for email verification
router.get("/verify/:token", async (req, res) => {
  // #swagger.tags = ['Auth']
  // #swagger.description = "Verifies the token sent to the user's email."
  const { token } = req.params;

  try {
    const user = await userService.verifyToken(token);
    console.log("user: ", user);

    if (!user) {
      // Token is invalid or has expired
      return res.jsend.fail({
        statusCode: 400,
        message: "Invalid token, expired token or already verified email.",
      });
    }

    // Update the user's "Verified" field to mark the email as verified
    await user.update({ Verified: true });

    // Render the email is verified page
    return res.render("emailVerified", { user });
  } catch (error) {
    console.error("Email verification error:", error);
    return res.jsend.error("Email verification failed");
  }
});

// Route for forgot password
router.post("/forgotpassword", jsonParser, async (req, res, next) => {
  // #swagger.tags = ['Auth']
  // #swagger.description = "Sends a password reset link to the user's email address."
  const { email } = req.body;

  if (!email) {
    return res.jsend.fail({ statusCode: 400, message: "Email is required." });
  }

  // Find the user by their email
  const user = await userService.getOneByEmail(email);

  if (!user) {
    return res.jsend.fail({
      statusCode: 400,
      message: "User with this email does not exist.",
    });
  }

  // Generate a reset token and an expiration time
  const resetToken = crypto.randomBytes(32).toString("hex");
  const expirationTime = new Date();
  expirationTime.setHours(expirationTime.getHours() + 1); // Set the expiration time as needed

  // Create a new token record associated with the user
  const token = await userService.createToken(
    user.id,
    resetToken,
    expirationTime
  );

  // Send the password reset email to the user
  const resetLink = `${process.env.BASE_URL}/auth/resetpassword/${resetToken}`; // Update with the correct URL
  const mailOptions = {
    from: process.env.NODEMAILER_USER,
    to: email,
    subject: "Password Reset - Techhype",
    html: `
      <p>You requested a password reset for your Techhype account.</p>
      <p>To reset your password, please click on the following link:</p>
      <a href="${resetLink}" target="_blank">Reset Password</a>
      <p>If you did not request a password reset, please ignore this email.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return res.jsend.success({
      statusCode: 200,
      message: "Password reset link sent to your email.",
    });
  } catch (error) {
    return res.jsend.fail({
      statusCode: 500,
      message: "Failed to send password reset email.",
    });
  }
});

// Route to reset to a new password
router.post("/resetpassword/:token", jsonParser, async (req, res, next) => {
  // #swagger.tags = ['Auth']
  // #swagger.description = "Set a new password after clicking the password reset link."
  const { token } = req.params;
  const { newPassword } = req.body;

  // Define a regular expression pattern to validate the password.
  // This pattern enforces the requirements: minimum length 8, one uppercase, one lowercase, one number, one special character.
  const passwordPattern =
    /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*\W)(?!.* ).{8,16}$/;

  if (!newPassword) {
    return res.jsend.fail({
      statusCode: 400,
      message: "New password is required.",
    });
  }

  // Check if the password meets the requirements
  if (!passwordPattern.test(newPassword)) {
    return res.jsend.fail({
      statusCode: 400,
      message:
        "Password requirements not met. It must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
    });
  }

  // Verify the reset token
  const tokenRecord = await userService.getToken(token);

  if (!tokenRecord) {
    return res.jsend.fail({
      statusCode: 400,
      message:
        "Invalid or expired password reset link. Please request a new one.",
    });
  }

  // Get the associated user from the token record
  const user = await userService.getUserFromToken(token);

  // Generate a new salt and hash the new password
  const newSalt = crypto.randomBytes(16);
  const newHashedPassword = await new Promise((resolve, reject) => {
    crypto.pbkdf2(newPassword, newSalt, 310000, 32, "sha256", (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });

  // Update the user's password in the database
  user.EncryptedPassword = newHashedPassword;
  user.Salt = newSalt;

  // Clear the reset token in the Token model
  await userService.clearToken(token);

  try {
    await user.save();
    return res.jsend.success({
      statusCode: 200,
      message:
        "Password reset successful. You can now log in with your new password.",
    });
  } catch (error) {
    return res.jsend.fail({
      statusCode: 500,
      message: "Failed to reset the password.",
    });
  }
});

router.post("/refresh-token", jsonParser, async (req, res) => {
  // Retrieve the refresh token from HTTP-only cookies instead of the request body
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(400).jsend.fail({ message: "Refresh token is required" });
  }

  try {
    const decoded = await jwtVerify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await userService.getOne(decoded.id);
    console.log("Decoded id:", decoded.id);
    console.log("User data:", user);
    if (!user) {
      return res.status(404).jsend.fail({ message: "User not found" });
    }

    const userData = user.toJSON();

    const newAccessToken = jwt.sign(
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

    // Optionally refresh the refresh token and set it in an HTTP-only cookie
    const newRefreshToken = jwt.sign(
      { id: user.id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION_LONG }
    );

    res.cookie('token', newAccessToken, {
      httpOnly: true,
      secure: true, // Ensure HTTPS
      sameSite: 'strict'
    });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict'
    });

    console.log("user: ", user);
    console.log("userdata: ", user.dataValues);
    return res.jsend.success({
      result: "Token successfully refreshed",
      id: userData.id,
      email: userData.Email,
      name: userData.FirstName,
      role: userData.Role,
      verified: userData.Verified
    });
  } catch (err) {
    console.log("JWT Verification Error:", err);
    return res.status(401).jsend.fail({ message: "Invalid refresh token" });
  }
});

router.post('/logout', (req, res) => {
  // Clear the authentication and refresh tokens
  res.cookie('token', '', { expires: new Date(0), httpOnly: true, secure: true, sameSite: 'strict' });
  res.cookie('refreshToken', '', { expires: new Date(0), httpOnly: true, secure: true, sameSite: 'strict' });

  // Send a response indicating logout was successful
  return res.jsend.success({ message: 'Logged out successfully' });
});



module.exports = router;
