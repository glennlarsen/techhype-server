require("dotenv").config({ path: `.env.${process.env.NODE_ENV}` });
console.log(`Environment: ${process.env.NODE_ENV}`);
console.log(`Database Host: ${process.env.HOST}`);

var createError = require("http-errors");
var express = require("express");
const cors = require("cors");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var db = require("./models");
const passport = require('passport');
require('./config/passport-config');

const swaggerUi = require("swagger-ui-express");
const swaggerFile = require("./swagger-output.json");
const bodyParser = require("body-parser");

var indexRouter = require("./routes/index");
var authRouter = require("./routes/auth");
var usersRouter = require("./routes/users");
var cardsRouter = require("./routes/cards");
var addressRouter = require("./routes/address");
var workInfoRouter = require("./routes/workInfo");
var socialMediaRouter = require("./routes/socialMedia");

db.sequelize.sync({ force: false })
  .then(() => {
    console.log("Database synchronized");
  })
  .catch((err) => {
    console.error("Database synchronization error:", err);
  });

var app = express();

app.set("trust proxy", 1); // trust first proxy

const corsOptions = {
  origin: [
    "http://localhost:3000",
    "https://localhost:3001",
    "https://localhost:3002",
    "https://techhype.netlify.app",
    "https://techhype.no",
    "https://techhype-server-06db1c82ee3e.herokuapp.com",
    "https://techhype-server-06db1c82ee3e.herokuapp.com/auth/facebook",
  ],
  preflightContinue: false,
  optionsSuccessStatus: 204,
  allowedHeaders: ["Content-Type", "Authorization"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use(bodyParser.json());

app.use("/", indexRouter);
app.use("/auth", authRouter);
app.use("/users", usersRouter);
app.use("/cards", cardsRouter);
app.use("/address", addressRouter);
app.use("/workInfo", workInfoRouter);
app.use("/socialMedia", socialMediaRouter);

app.use("/doc", swaggerUi.serve, swaggerUi.setup(swaggerFile));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  res.status(err.status || 500);
  res.status(500).json({ status: 'error', message: 'Internal Server Error' });
});

module.exports = app;
