/*
module.exports = (err, req, res, next) => {
  if (err.name === 'UnauthorizedError' || err.name === 'AuthenticationError') {
    return res.status(401).jsend.fail({
      statusCode: 401,
      message: "Unauthorized access"
    });
  }
  next(err);
};
*/

// middleware/authMiddleware.js
const admin = require("firebase-admin");

// Ensure Firebase is initialized in app.js and imported here
const authenticateToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ status: 'error', message: 'No token provided' });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken; // Add user info to request
    next();
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(401).json({ status: 'error', message: 'Invalid or expired token' });
  }
};

module.exports = authenticateToken;
