const jwt = require("jsonwebtoken");
function isAdmin(req, res, next) {
  const userRole = req.user.role;
  if (userRole === "Admin") {
    try {
      next();
    } catch (error) {
      res.status(401).json({
        status: "fail",
        statusCode: 401,
        error: "Authentication failed",
      });
    }
  } else {
    res.status(401).json({
      status: "fail",
      statusCode: 401,
      error: "Only Admin role have access.",
    });
  }
}

module.exports = isAdmin;
