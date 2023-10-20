var express = require("express");
var router = express.Router();
const isAuth = require("./middleware/isAuth");
var db = require("../models");
var UserService = require("../services/UserService");
var userService = new UserService(db);
var jsend = require("jsend");

router.use(jsend.middleware);

/* GET users listing. */
router.get("/", isAuth, async (req, res, next) => {
  // #swagger.tags = ['User']
  // #swagger.description = "Get the logged in user."
  try {
    const userId = req.user?.id ?? 0;
    const user = await userService.getOne(userId);
    if (user.success) {
      res.jsend.success({ statusCode: 200, result: user });
    } else {
      res.jsend.fail({
        statusCode: 404,
        message: user.message,
        error: user.error,
      });
    }
  } catch (error) {
    res.jsend.error({
      statusCode: 500,
      message: "An error occurred while fetching users",
      data: error.message,
    });
  }
});

module.exports = router;
