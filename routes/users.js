var express = require("express");
var router = express.Router();
const passport = require("passport");
var db = require("../models");
var UserService = require("../services/UserService");
var authenticateToken = require("./middleware/authMiddleware");
var userService = new UserService(db);
var bodyParser = require("body-parser");
var jsonParser = bodyParser.json();
var jsend = require("jsend");

router.use(jsend.middleware);


/* GET users listing. */
// Use Firebase authentication middleware
router.get("/", authenticateToken, async (req, res, next) => {
  console.log("User info from Firebase: ", req.user);

  try {
    const userId = req.user?.uid; // Firebase ID is in `uid`
    if (!userId) {
      return res.jsend.fail({
        statusCode: 401,
        message: "User not authenticated.",
      });
    }

    const user = await userService.getOne(userId);
    if (user.success) {
      return res.jsend.success({ statusCode: 200, result: user });
    } else {
      return res.jsend.fail({
        statusCode: 404,
        message: user.message,
        error: user.error,
      });
    }
  } catch (error) {
    return res.jsend.error({
      statusCode: 500,
      message: "An error occurred while fetching users",
      data: error.message,
    });
  }
});

// PUT endpoint to update user's first name and last name
router.put("/update", jsonParser, authenticateToken, async (req, res) => {
  const userId = req.user?.uid; // Firebase ID is in `uid`
  const { firstName, lastName } = req.body;

  if (!userId) {
    return res.jsend.fail({
      statusCode: 401,
      message: "User not authenticated.",
    });
  }

  if (!firstName && !lastName) {
    return res.jsend.fail({
      statusCode: 400,
      message: "At least one of firstName or lastName must be provided.",
    });
  }

  if (firstName && !/^[\p{L} '\-]{2,30}$/u.test(firstName)) {
    return res.jsend.fail({
      statusCode: 400,
      message: "Invalid first name.",
    });
  }

  if (lastName && !/^[\p{L} '\-]{2,30}$/u.test(lastName)) {
    return res.jsend.fail({
      statusCode: 400,
      message: "Invalid last name.",
    });
  }

  try {
    const updatedUser = await userService.updateUserNames(userId, firstName, lastName);
    if (updatedUser.success) {
      return res.jsend.success({
        statusCode: 200,
        message: "User profile updated successfully.",
        user: updatedUser.user,
      });
    } else {
      return res.jsend.fail({
        statusCode: 400,
        message: updatedUser.message,
      });
    }
  } catch (error) {
    return res.jsend.error({
      statusCode: 500,
      message: "An error occurred while updating the user profile.",
      error: error.message,
    });
  }
});


module.exports = router;
