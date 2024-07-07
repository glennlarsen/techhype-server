module.exports = (err, req, res, next) => {
  if (err.name === 'UnauthorizedError' || err.name === 'AuthenticationError') {
    return res.status(401).jsend.fail({
      statusCode: 401,
      message: "Unauthorized access"
    });
  }
  next(err);
};
