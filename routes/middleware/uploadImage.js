const multer = require("multer");
const multerS3 = require("multer-s3");
const { S3Client } = require("@aws-sdk/client-s3");
var path = require("path");

// create s3 instance using S3Client
// (this is how we create s3 instance in v3)
const s3 = new S3Client({
  credentials: {
    accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID, // store it in .env file to keep it safe
    secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY,
  },
  region: process.env.MY_AWS_REGION, // this is the region that you select in AWS account
});

const s3Storage = multerS3({
  s3: s3, // s3 instance
  bucket: process.env.MY_AWS_BUCKET_NAME, // Amazon s3 bucket name
  acl: "public-read", // storage access type
  metadata: (req, file, cb) => {
    cb(null, { fieldname: file.fieldname });
  },
  key: (req, file, cb) => {
    const fileName =
      Date.now() + "_" + file.fieldname + "_" + file.originalname;
    cb(null, fileName);
  },
});

// function to sanitize files and send error for unsupported files
function sanitizeFile(file, cb) {
  // Define the allowed extension
  const fileExts = [".png", ".jpg", ".jpeg", ".gif"];

  // Check allowed extensions
  const isAllowedExt = fileExts.includes(
    path.extname(file.originalname.toLowerCase())
  );

  // Mime type must be an image
  const isAllowedMimeType = file.mimetype.startsWith("image/");

  if (isAllowedExt && isAllowedMimeType) {
    return cb(null, true); // no errors
  } else {
    // pass error msg to callback, which can be displaye in frontend
    cb("Error: File type not allowed!");
  }
}

// our middleware
const uploadImageMiddleware = multer({
  storage: s3Storage,
  fileFilter: (req, file, callback) => {
    sanitizeFile(file, callback);
  },
  limits: {
    fileSize: 1024 * 1024 * 2, // 2mb file size
  },
}).array("image", 10); // "images" is the field name for your images in the form data, and 10 is the maximum number of files allowed.

// Add error handling to the uploadImage middleware
const uploadImage = (req, res, next) => {
  uploadImageMiddleware(req, res, (err) => {
    if (
      err instanceof multer.MulterError &&
      err.code === "LIMIT_UNEXPECTED_FILE"
    ) {
      // Handle the unexpected field name error here
      return res
        .status(400)
        .json({
          error: "Incorrect field name for image, field must be 'image'.",
        });
    } else if (err) {
      // Handle other Multer errors, if needed
      return res.status(400).json({ error: "Multer error occurred." });
    }
    // No errors, continue to the next middleware or route
    next();
  });
};
module.exports = uploadImage;
