require("dotenv").config({ path: `.env.${process.env.NODE_ENV}` });
console.log(`Environment: ${process.env.NODE_ENV}`);
console.log(`Database Host: ${process.env.HOST}`);
var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var db = require("./models");
db.sequelize.sync({ force: false });
const swaggerUi = require("swagger-ui-express");
const swaggerFile = require("./swagger-output.json");
const bodyParser = require("body-parser");
var indexRouter = require("./routes/index");
var authRouter = require("./routes/auth");
var usersRouter = require("./routes/users");
var cardsRouter = require("./routes/cards");
var AddressRouter = require("./routes/address");
var WorkInfoRouter = require("./routes/workInfo");
var SocialMediaRouter = require("./routes/socialMedia");
console.log("environment: ", process.env.NODE_ENV);

var app = express();

app.set("trust proxy", 1); // trust first proxy


// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/auth", authRouter);
app.use("/users", usersRouter);
app.use("/cards", cardsRouter);
app.use("/address", AddressRouter);
app.use("/workInfo", WorkInfoRouter);
app.use("/socialMedia", SocialMediaRouter);

app.use(bodyParser.json());
app.use("/doc", swaggerUi.serve, swaggerUi.setup(swaggerFile));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
