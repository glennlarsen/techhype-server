const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const crypto = require("crypto");
const transporter = require("./middleware/nodemailer");
const authLimiter = require("./middleware/authLimiter");
const db = require("../models");
const jsend = require("jsend");
const UserService = require("../services/UserService");
const userService = new UserService(db);
const bodyParser = require("body-parser");
const verifyRefreshToken = require("./middleware/verifyRefreshToken");
const jsonParser = bodyParser.json();
require("../config/passport-config");

const router = express.Router();
router.use(jsend.middleware);

router.get(
  "/login",
  passport.authenticate("auth0", {
    scope: "openid email profile",
  }),
  (req, res) => {
    res.redirect("/");
  }
);

// Auth0 callback route
router.get("/callback", (req, res, next) => {
  passport.authenticate("auth0", (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.redirect("/login");
    }
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.TOKEN_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION }
    );
    res.cookie("jwt", token, { httpOnly: true, secure: true });
    res.redirect("/cards");
  })(req, res, next);
});

router.post("/signup", jsonParser, async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  const emailPattern = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
  const passwordPattern =
    /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*\W)(?!.* ).{8,16}$/;

  if (!emailPattern.test(email)) {
    return res.jsend.fail({
      statusCode: 400,
      message: "Invalid email format. Please provide a valid email address.",
    });
  }

  if (!passwordPattern.test(password)) {
    return res.jsend.fail({
      statusCode: 400,
      message:
        "Password requirements not met. It must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
    });
  }

  try {
    const salt = crypto.randomBytes(16);
    const hashedPassword = await new Promise((resolve, reject) => {
      crypto.pbkdf2(
        password,
        salt,
        310000,
        32,
        "sha256",
        (err, hashedPassword) => {
          if (err) {
            reject(err);
          } else {
            resolve(hashedPassword);
          }
        }
      );
    });

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

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const expirationTime = new Date();
    expirationTime.setHours(expirationTime.getHours() + 24); // 24-hour expiration

    // Create user and token
    const newUser = await userService.create(
      firstName,
      lastName,
      email,
      hashedPassword,
      salt
    );

    // Now, create a corresponding verification token
    await userService.createToken(
      newUser.id,
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

    if (!user) {
      // Token is invalid, expired, or already used
      return res.status(400).json({
        status: "fail",
        message: "Invalid token, expired token, or already verified email.",
      });
    }

    // Update the user's "Verified" field to mark the email as verified
    await user.update({ Verified: true });

    // Return JSON response indicating success
    return res.json({
      status: "success",
      message: "Email successfully verified.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        verified: user.Verified,
      },
    });
  } catch (error) {
    console.error("Email verification error:", error);
    return res.status(500).json({
      status: "error",
      message: "Email verification failed",
    });
  }
});

router.post("/login", authLimiter, jsonParser, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.jsend.fail({
      statusCode: 400,
      result: "Email and password are required",
    });
  }

  const user = await userService.getOneByEmail(email);
  if (!user) {
    return res.jsend.fail({
      statusCode: 400,
      result: "Incorrect email or password",
    });
  }

  if (!user.Verified) {
    return res.jsend.fail({
      statusCode: 400,
      result: "Please verify your email before logging in.",
    });
  }

  crypto.pbkdf2(
    password,
    user.Salt,
    310000,
    32,
    "sha256",
    (err, hashedPassword) => {
      if (err) {
        return res.jsend.error("Error in password encryption");
      }
      if (!crypto.timingSafeEqual(user.EncryptedPassword, hashedPassword)) {
        return res.jsend.fail({ result: "Incorrect password" });
      }

      const token = jwt.sign(
        { id: user.id, email: user.Email },
        process.env.TOKEN_SECRET,
        { expiresIn: process.env.JWT_EXPIRATION }
      );

      const refreshToken = jwt.sign(
        { id: user.id },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.JWT_EXPIRATION_LONG }
      );

      res.cookie("jwt", token, { httpOnly: true, secure: true });
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
      });

      res.jsend.success({
        result: "You are logged in",
        token: token,
        refreshToken: refreshToken,
        id: user.id,
        email: user.Email,
        name: user.FirstName,
        role: user.Role,
        verified: user.Verified,
      });
    }
  );
});

// Example logout route
router.post("/logout", async (req, res) => {
  try {
    // Clear cookies for JWT and refreshToken
    res.clearCookie("jwt");
    res.clearCookie("refreshToken");

    // Additional logout handling logic if needed
    res.jsend.success({
      statusCode: 200,
      message: "User logged out successfully.",
    });
  } catch (error) {
    console.error("Exception during logout:", error);
    res.jsend.error({
      statusCode: 500,
      message: "An error occurred during logout.",
      error: error.message,
    });
  }
});

//refresh token
router.post("/refresh-token", verifyRefreshToken, async (req, res) => {
  const { id } = req.user;
  console.log("user: ", id);

  try {
    const user = await userService.getOne(id);

    if (!user) {
      return res.status(401).jsend.fail({
        message: "Invalid refresh token",
      });
    }

    const newToken = jwt.sign(
      { id: user.id, email: user.Email },
      process.env.TOKEN_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION }
    );

    const newRefreshToken = jwt.sign(
      { id: user.id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION_LONG }
    );

    res.cookie("jwt", newToken, { httpOnly: true, secure: true });
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: true,
    });

    res.jsend.success({
      token: newToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    res.status(401).jsend.fail({
      message: "Invalid refresh token",
    });
  }
});

//Forgot password
router.post("/forgotpassword", jsonParser, async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.jsend.fail({ statusCode: 400, message: "Email is required." });
  }

  const user = await userService.getOneByEmail(email);

  if (!user) {
    return res.jsend.fail({
      statusCode: 400,
      message: "User with this email does not exist.",
    });
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  const expirationTime = new Date();
  expirationTime.setHours(expirationTime.getHours() + 1); // 1-hour expiration

  await userService.createToken(user.id, resetToken, expirationTime);

  const resetLink = `${process.env.FRONTEND_BASE_URL}/resetpassword/${resetToken}`;
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
    res.jsend.success({
      statusCode: 200,
      message: "Password reset link sent to your email.",
    });
  } catch (error) {
    res.jsend.fail({
      statusCode: 500,
      message: "Failed to send password reset email.",
    });
  }
});

//Reset password
router.post("/resetpassword/:token", jsonParser, async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const passwordPattern =
    /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*\W)(?!.* ).{8,16}$/;

  if (!password) {
    return res.jsend.fail({
      statusCode: 400,
      message: "New password is required.",
    });
  }

  if (!passwordPattern.test(password)) {
    return res.jsend.fail({
      statusCode: 400,
      message:
        "Password requirements not met. It must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
    });
  }

  const tokenRecord = await userService.getToken(token);

  if (!tokenRecord) {
    return res.jsend.fail({
      statusCode: 400,
      message:
        "Invalid or expired password reset link. Please request a new one.",
    });
  }

  const user = await userService.getUserFromToken(token);

  const newSalt = crypto.randomBytes(16);
  const newHashedPassword = await new Promise((resolve, reject) => {
    crypto.pbkdf2(password, newSalt, 310000, 32, "sha256", (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });

  user.EncryptedPassword = newHashedPassword;
  user.Salt = newSalt;

  await userService.clearToken(token);

  try {
    await user.save();
    res.jsend.success({
      statusCode: 200,
      message:
        "Password reset successful. You can now log in with your new password.",
    });
  } catch (error) {
    res.jsend.fail({
      statusCode: 500,
      message: "Failed to reset the password.",
    });
  }
});

// Google Authentication Routes
// Google Authentication Routes
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get("/google/callback", (req, res, next) => {
  passport.authenticate("google", async (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).json({ status: 'fail', message: 'Authentication failed' });
    }

    try {
      // Here, you have the authenticated user object
      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.TOKEN_SECRET,
        { expiresIn: process.env.JWT_EXPIRATION }
      );

      // Set JWT token in cookie
      res.cookie("jwt", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      });

      // Return JSON response
      res.status(200).json({
        status: "success",
        data: {
          token: token,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName, // Ensure these match the user object structure
            lastName: user.lastName,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  })(req, res, next);
});

// Facebook Authentication Routes
router.post("/facebook", async (req, res) => {
  const { accessToken } = req.body;
  console.log("accesstoken backend: ", accessToken);

  try {
    // Verify the access token with Facebook
    const fbResponse = await axios.get(
      `https://graph.facebook.com/me?access_token=${accessToken}&fields=id,name,email`
    );

    const { id, name, email } = fbResponse.data;
    if (!email) {
      return res
        .status(400)
        .json({ status: "fail", message: "Email not available from Facebook" });
    }

    // Find or create a user in your database
    let user = await userService.getOneByEmail(email);
    if (!user) {
      const nameParts = name.split(" ");
      user = await userService.create(
        nameParts[0], // firstName
        nameParts.slice(1).join(" "), // lastName
        email,
        null, // hashedPassword (since password is not needed for Facebook login)
        null, // salt (since password is not needed for Facebook login)
        true // verified
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.TOKEN_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRATION,
      }
    );

    res.status(200).json({
      status: "success",
      data: {
        token: token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.FirstName,
          lastName: user.LastName,
        },
      },
    });
  } catch (error) {
    console.error(
      "Facebook login error:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({ status: "fail", message: "Facebook login failed" });
  }
});

module.exports = router;
