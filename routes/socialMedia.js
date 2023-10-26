var express = require("express");
var router = express.Router();
const isAuth = require("./middleware/isAuth");
var db = require("../models");
var SocialMediaService = require("../services/SocialMediaService");
var socialMediaService = new SocialMediaService(db);
var CardProfileService = require("../services/CardProfileService");
var cardProfileService = new CardProfileService(db);
var jsend = require("jsend");

router.use(jsend.middleware);

// GET endpoint to retrieve the social media links for a card profile
router.get("/:profileId", isAuth, async (req, res) => {
  // #swagger.tags = ['SocialMedia']
  // #swagger.description = "get Social media for a card profile."
  const profileId = req.params.profileId;

  // Check if the card profile exists
  const cardProfile = await cardProfileService.getProfileById(profileId);
  if (!cardProfile) {
    return res.jsend.fail({
      statusCode: 404,
      message: "Card profile not found.",
    });
  }
  const socialMedia = await socialMediaService.getByProfileId(profileId);
  if (socialMedia) {
    res.jsend.success({ statusCode: 200, result: socialMedia });
  } else {
    res.jsend.fail({
      statusCode: 404,
      message: "social Media links not found",
    });
  }
});

// GET endpoint to retrieve the social media links by social media Id
router.get("/:socialMediaId", isAuth, async (req, res) => {
  // #swagger.tags = ['SocialMedia']
  // #swagger.description = "get Social media by using the socialmedia ID."
  const socialMediaId = req.params.socialMediaId;
  const socialMedia = await socialMediaService.getById(socialMediaId);
  if (socialMedia) {
    res.jsend.success({ statusCode: 200, result: socialMedia });
  } else {
    res.jsend.fail({
      statusCode: 404,
      message: "social Media links not found",
    });
  }
});

// POST/PUT endpoint to add or update an address for a card profile
router.post("/:profileId", isAuth, async (req, res) => {
  // #swagger.tags = ['SocialMedia']
  // #swagger.description = "Add or update a social media for a card profile."
  /* #swagger.parameters['body'] =  {
      "name": "body",
      "in": "body",
        "schema": {
          $ref: "#/definitions/SocialMedia"
        }
      }
    */
  const profileId = req.params.profileId;
  const data = req.body;

  // Check if the card profile exists
  const cardProfile = await cardProfileService.getProfileById(profileId);
  if (!cardProfile) {
    return res.jsend.fail({
      statusCode: 404,
      message: "Card profile not found.",
    });
  }

  // Check if an socialMedia already exists for the specified profileId
  const existingSocialMedia = await socialMediaService.getByProfileId(
    profileId
  );

  if (existingSocialMedia.success) {
    // If an socialMedia already exists, update it
    const updatedSocialMedia = await socialMediaService.update(profileId, data);
    if (updatedSocialMedia.success) {
      res.jsend.success({ statusCode: 200, result: updatedSocialMedia });
    } else {
      res.jsend.fail({ statusCode: 400, result: updatedSocialMedia });
    }
  } else {
    // If no socialMedia exists, create a new one
    const newSocialMedia = await socialMediaService.create(profileId, data);
    if (newSocialMedia.success) {
      res.jsend.success({ statusCode: 201, result: newSocialMedia });
    } else {
      res.jsend.fail({ statusCode: 400, result: newSocialMedia });
    }
  }
});

// DELETE endpoint to delete the socialMedia for a card profile
router.delete("/:profileId", isAuth, async (req, res) => {
  // #swagger.tags = ['SocialMedia']
  // #swagger.description = "Delete a social media for a card profile."
  const profileId = req.params.profileId;

  // Check if the card profile exists
  const cardProfile = await cardProfileService.getProfileById(profileId);
  if (!cardProfile) {
    return res.jsend.fail({
      statusCode: 404,
      message: "Card profile not found.",
    });
  }
  const result = await socialMediaService.delete(profileId);
  if (result.success) {
    res.jsend.success({ statusCode: 200, message: result.message });
  } else {
    res.jsend.fail({ statusCode: 404, message: result.message });
  }
});

module.exports = router;
