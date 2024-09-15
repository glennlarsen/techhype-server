const express = require("express");
var router = express.Router();
const firebaseAdmin = require("firebase-admin");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const crypto = require("crypto");
const transporter = require("./middleware/nodemailer");
const db = require("../models");
const jsend = require("jsend");
const UserService = require("../services/UserService");
const userService = new UserService(db);
const bodyParser = require("body-parser");
const verifyRefreshToken = require("./middleware/verifyRefreshToken");
const jsonParser = bodyParser.json();

router.use(jsend.middleware);


// User sign-up
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
    // Create a user in Firebase
    const userRecord = await firebaseAdmin.auth().createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`,
    });

    // Save the user in MySQL
    const firebaseUID = userRecord.uid;
    await userService.create(firstName, lastName, email, firebaseUID, false); // Set `verified` to true or based on your requirements

    // Send a verification email
    const verificationLink = await firebaseAdmin.auth().generateEmailVerificationLink(email);
    const mailOptions = {
      from: process.env.NODEMAILER_USER,
      to: email,
      subject: "Email Verification - Techhype",
      html: `
      <table width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td align="center">
            <h1 style="color: black;">Thank you for signing up on Techhype!</h1>
            <p style="color: black;">To verify your email, please click the button below:</p>
            <a href="${verificationLink}" style="text-decoration: none; background-color: #54d4c6; color: black; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; display: inline-block; font-weight: bold;">
              Verify Email
            </a>
          </td>
        </tr>
      </table>
    `,
    };

    await transporter.sendMail(mailOptions);

    res.jsend.success({
      statusCode: 201,
      result:
        "You created an account. Please check your email for verification instructions.",
    });
  } catch (error) {
    console.error("Sign-up error:", error);
    res.jsend.fail({
      statusCode: 401,
      result: error.message,
    });
  }
});

// Email verification is handled by Firebase itself, no need for a separate route

// User login
router.post("/login", jsonParser, async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.jsend.fail({
      statusCode: 400,
      result: "Email and password are required",
    });
  }

  try {
    // Authenticate with Firebase
    const response = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`,
      {
        email: email,
        password: password,
        returnSecureToken: true,
      }
    );

    const { idToken, refreshToken, localId, displayName } = response.data;

    // Get user record from Firebase
    const userRecord = await firebaseAdmin.auth().getUser(localId);

    // Check if email is verified
    if (!userRecord.emailVerified) {
      return res.jsend.fail({
        statusCode: 400,
        result: "Please verify your email before logging in.",
      });
    }

    // Optionally store Firebase tokens or details in cookies (if needed)
    res.cookie("idToken", idToken, { httpOnly: true, secure: true });
    res.cookie("refreshToken", refreshToken, { httpOnly: true, secure: true });

    res.jsend.success({
      result: "You are logged in",
      token: idToken,
      refreshToken: refreshToken,
      uid: localId,
      email: email,
      name: displayName,
    });
  } catch (error) {
    console.error("Login error:", error.response ? error.response.data : error.message);
    res.jsend.fail({
      statusCode: 401,
      result: error.response ? error.response.data.error.message : "Incorrect email or password",
    });
  }
});



// Logout route
router.post("/logout", async (req, res) => {
  try {
    res.clearCookie("jwt");
    res.clearCookie("refreshToken");
    res.jsend.success({
      statusCode: 200,
      message: "User logged out successfully.",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.jsend.error({
      statusCode: 500,
      message: "An error occurred during logout.",
      error: error.message,
    });
  }
});

// Refresh token
router.post("/refresh-token", verifyRefreshToken, async (req, res) => {
  const { uid } = req.user;

  try {
    // Verify the user and generate new tokens
    const userRecord = await firebaseAdmin.auth().getUser(uid);

    const newToken = jwt.sign(
      { uid: userRecord.uid, email: userRecord.email },
      process.env.TOKEN_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION }
    );

    const newRefreshToken = jwt.sign(
      { uid: userRecord.uid },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION_LONG }
    );

    res.cookie("jwt", newToken, { httpOnly: true, secure: true });
    res.cookie("refreshToken", newRefreshToken, { httpOnly: true, secure: true });

    res.jsend.success({
      token: newToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(401).jsend.fail({
      message: "Invalid refresh token",
    });
  }
});

// Forgot password
router.post("/forgotpassword", jsonParser, async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.jsend.fail({ statusCode: 400, message: "Email is required." });
  }

  try {
    await firebaseAdmin.auth().sendPasswordResetEmail(email);

    res.jsend.success({
      statusCode: 200,
      message: "Password reset link sent to your email.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.jsend.fail({
      statusCode: 500,
      message: "Failed to send password reset email.",
    });
  }
});

// Reset password
router.post("/resetpassword/:oobCode", jsonParser, async (req, res) => {
  const { oobCode } = req.params; // oobCode is the code sent in the password reset email
  const { newPassword } = req.body;

  const passwordPattern =
    /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*\W)(?!.* ).{8,16}$/;

  if (!newPassword) {
    return res.jsend.fail({
      statusCode: 400,
      message: "New password is required.",
    });
  }

  if (!passwordPattern.test(newPassword)) {
    return res.jsend.fail({
      statusCode: 400,
      message:
        "Password requirements not met. It must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
    });
  }

  try {
    await firebaseAdmin.auth().confirmPasswordReset(oobCode, newPassword);

    res.jsend.success({
      statusCode: 200,
      message:
        "Password reset successful. You can now log in with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.jsend.fail({
      statusCode: 500,
      message: "Failed to reset the password.",
    });
  }
});

// Endpoint to update user verification status
router.post('/update-verification-status', async (req, res) => {
  const { firebaseUID, verified } = req.body;

  try {
    const result = await userService.updateUserVerified(firebaseUID, verified);

    if (result.success) {
      res.status(200).json({ message: result.message });
    } else {
      res.status(400).json({ message: result.message });
    }
  } catch (error) {
    console.error('Error updating verification status:', error);
    res.status(500).json({ message: 'Failed to update verification status.' });
  }
});


module.exports = router;
