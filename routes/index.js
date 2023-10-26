const uploadImage = require("./middleware/uploadImage"); // Import both multer and uploadManager
var express = require("express");
var router = express.Router();
var jsend = require("jsend");

router.use(jsend.middleware);

/* GET home page. */
router.get("/", function (req, res, next) {
  // #swagger.tags = ['Index']
  // #swagger.description = "Landing page of the Server."
  res.jsend.success({ statusCode: 200, result: "Server is running!" });
});

// Handle POST request with file upload to Amazon s3 techhype-bucket
router.post("/upload", (req, res, next) => {
  // #swagger.tags = ['FileUpload']
  // #swagger.description = "Upload files to AWS s3"
  /* #swagger.parameters['body'] = {
    in: 'formData',
    name: 'image',
    description: 'image upload to AWS s3',
    required: true,
    type: 'file',
    schema: {
      $ref: '#/definitions/FileUpload'
    }
} */
  try {
    uploadImage(req, res, async (err) => {
      if (err) {
        console.error("Error uploading files:", err);
        return res.status(500).json({ error: "File upload failed" });
      }

      console.log("Received file upload request");
      const uploadedFiles = req.files;

      // Handle each uploaded file
      const fileUrls = uploadedFiles.map((file) => {
        return {
          fieldname: file.fieldname,
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          bucket: file.bucket,
          key: file.key,
          location: file.location,
        };
      });

      console.log("File upload succeeded: ", fileUrls);

      // HERE IS YOUR LOGIC TO UPDATE THE DATA IN DATABASE

      // Respond with a JSON message including the uploaded file's URLs
      res.json({ message: "Files uploaded successfully", fileUrls });
    });
  } catch (error) {
    // Handle any other errors that may occur
    console.error("Error:", error);
    res.status(500).json({ error: "File upload failed" });
  }
});

module.exports = router;
