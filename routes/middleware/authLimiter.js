const rateLimit = require("express-rate-limit");

// Define a rate limit configuration
const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10, // Limit each IP to 5 requests per windowMs
  message: "To many wrong attempts. Please wait before trying again.",
});

module.exports = authLimiter;