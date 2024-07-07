var express = require("express");
var router = express.Router();
const passport = require("passport");
var db = require("../models");
var WorkInfoService = require("../services/WorkInfoService");
var workInfoService = new WorkInfoService(db);
var CardProfileService = require("../services/CardProfileService");
var cardProfileService = new CardProfileService(db);
var jsend = require("jsend");

router.use(jsend.middleware);

// Authenticate with JWT for all routes in this router
router.use(passport.authenticate('jwt', { session: false }));

// GET endpoint to retrieve the workInfo for a card profile
router.get("/:profileId", async (req, res) => {
  // #swagger.tags = ['WorkInfo']
  // #swagger.description = "get Work info for a card profile."
  const profileId = req.params.profileId;

  // Check if the card profile exists
  const cardProfile = await cardProfileService.getProfileById(profileId);
  if (!cardProfile) {
    return res.jsend.fail({
      statusCode: 404,
      message: "Card profile not found.",
    });
  }
  const workInfo = await workInfoService.getByProfileId(profileId);
  if (workInfo) {
    res.jsend.success({ statusCode: 200, result: workInfo });
  } else {
    res.jsend.fail({
      statusCode: 404,
      message: "Work Info not found",
    });
  }
});

// GET endpoint to retrieve the Work info by workInfo Id
router.get("/:workInfoId", async (req, res) => {
  // #swagger.tags = ['WorkInfo']
  // #swagger.description = "get Work info By using the WorkInfo ID."
  const workInfoId = req.params.workInfoId;
  const workInfo = await workInfoService.getById(workInfoId);
  if (workInfo) {
    res.jsend.success({ statusCode: 200, result: workInfo });
  } else {
    res.jsend.fail({
      statusCode: 404,
      message: "Work Info not found",
    });
  }
});

// POST/PUT endpoint to add or update workInfo for a card profile
router.post("/:profileId", async (req, res) => {
  // #swagger.tags = ['WorkInfo']
  // #swagger.description = "Add or update Work info for a card profile."
  /* #swagger.parameters['body'] =  {
      "name": "body",
      "in": "body",
        "schema": {
          $ref: "#/definitions/WorkInfo"
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

  let workInfo; // Initialize an Work info variable

  // Check if an work info already exists for the specified profileId
  const existingWorkInfo = await workInfoService.getByProfileId(profileId);
  if (existingWorkInfo.success) {
    // If a work info already exists, update it
    const updatedWorkInfo = await workInfoService.update(profileId, data);
    if (updatedWorkInfo.success) {
      res.jsend.success({ statusCode: 200, result: updatedWorkInfo });
    } else {
      res.jsend.fail({ statusCode: 400, result: updatedWorkInfo });
    }
  } else {
    // If no work info exists, create a new one
    workInfo = await workInfoService.create(profileId, data);
    if (workInfo.success) {
      res.jsend.success({ statusCode: 201, result: workInfo });
    } else {
      res.jsend.fail({ statusCode: 400, result: workInfo });
    }
  }
});

// DELETE endpoint to delete the workInfo for a card profile
router.delete("/:profileId", async (req, res) => {
  // #swagger.tags = ['WorkInfo']
  // #swagger.description = "Delete Work info for a card profile."
  const profileId = req.params.profileId;

  // Check if the card profile exists
  const cardProfile = await cardProfileService.getProfileById(profileId);
  if (!cardProfile) {
    return res.jsend.fail({
      statusCode: 404,
      message: "Card profile not found.",
    });
  }
  const result = await workInfoService.delete(profileId);
  if (result.success) {
    res.jsend.success({ statusCode: 200, message: result.message });
  } else {
    res.jsend.fail({ statusCode: 404, message: result.message });
  }
});

module.exports = router;
