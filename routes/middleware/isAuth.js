const jwt = require("jsonwebtoken");

// Middleware function to determine if the API endpoint request is from an authenticated user
function isAuth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  console.log("Received Token:", token); // Log the received token
  if (token) {
    try {
      const decodedToken = jwt.verify(token, process.env.TOKEN_SECRET);
      req.user = decodedToken; // Attach user data to the request object
      next();
    } catch (error) {
      res.status(401).json({ status: "fail", statusCode: 401, error: "Authentication failed" });
    }
  } else {
    res.status(401).json({ status: "fail", statusCode: 401, error: "No token provided" });
  }
}

module.exports = isAuth;
