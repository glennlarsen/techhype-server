const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).jsend.fail({
      message: "Refresh token is required",
    });
  }

  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).jsend.fail({
        message: "Invalid refresh token",
      });
    }

    req.user = decoded;
    next();
  });
};
