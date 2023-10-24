const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: "smtp.titan.email",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: "glenn@techhype.no",
      pass: "G28h29b14!",
    },
  });

module.exports = transporter;
