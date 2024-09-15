var express = require("express");
var router = express.Router();
const passport = require("passport");
var db = require("../models");
var AddressService = require("../services/AddressService");
var addressService = new AddressService(db);
var CardProfileService = require("../services/CardProfileService");
var cardProfileService = new CardProfileService(db);
var jsend = require("jsend");

router.use(jsend.middleware);


// GET endpoint to retrieve the address for a card profile
router.get("/:profileId", async (req, res) => {
  // #swagger.tags = ['Address']
  // #swagger.description = "get address for a card profile."
  const profileId = req.params.profileId;

  // Check if the card profile exists
  const cardProfile = await cardProfileService.getProfileById(profileId);
  if (!cardProfile) {
    return res.jsend.fail({
      statusCode: 404,
      message: "Card profile not found.",
    });
  }
  const address = await addressService.getByProfileId(profileId);
  if (address) {
    res.jsend.success({ statusCode: 200, result: address });
  } else {
    res.jsend.fail({
      statusCode: 404,
      message: "Address not found",
    });
  }
});

// GET endpoint to retrieve the address by address Id (not working, does same as the one above)
router.get("/:addressId", async (req, res) => {
  // #swagger.tags = ['Address']
  // #swagger.description = "get address By using the address ID."
  const addressId = req.params.addressId;
  const address = await addressService.getById(addressId);
  if (address) {
    res.jsend.success({ statusCode: 200, result: address });
  } else {
    res.jsend.fail({
      statusCode: 404,
      message: "Address not found",
    });
  }
});

// POST/PUT endpoint to add or update an address for a card profile
router.post("/:profileId", async (req, res) => {
  // #swagger.tags = ['Address']
  // #swagger.description = "Add or update an address for a card profile."
  /* #swagger.parameters['body'] =  {
      "name": "body",
      "in": "body",
        "schema": {
          $ref: "#/definitions/Address"
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

  // Check if an address already exists for the specified profileId
  const existingAddress = await addressService.getByProfileId(profileId);

  if (existingAddress.success) {
    // If an address already exists, update it
    const updatedAddress = await addressService.update(profileId, data);
    if (updatedAddress.success) {
      res.jsend.success({ statusCode: 200, result: updatedAddress });
    } else {
      res.jsend.fail({ statusCode: 400, result: updatedAddress });
    }
  } else {
    // If no address exists, create a new one
    const newAddress = await addressService.create(profileId, data);
    if (newAddress.success) {
      res.jsend.success({ statusCode: 201, result: newAddress });
    } else {
      res.jsend.fail({ statusCode: 400, result: newAddress });
    }
  }
});

// DELETE endpoint to delete the address for a card profile
router.delete("/:profileId", async (req, res) => {
  // #swagger.tags = ['Address']
  // #swagger.description = "Delete an address for a card profile."
  const profileId = req.params.profileId;

  // Check if the card profile exists
  const cardProfile = await cardProfileService.getProfileById(profileId);
  if (!cardProfile) {
    return res.jsend.fail({
      statusCode: 404,
      message: "Card profile not found.",
    });
  }
  const result = await addressService.delete(profileId);
  if (result.success) {
    res.jsend.success({ statusCode: 200, message: result.message });
  } else {
    res.jsend.fail({ statusCode: 404, message: result.message });
  }
});

module.exports = router;
