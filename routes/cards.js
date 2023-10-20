var express = require("express");
var router = express.Router();
const isAuth = require("./middleware/isAuth");
const generateCardUrl = require("./middleware/generateCardUrl");
var db = require("../models");
var CardService = require("../services/CardService");
var cardService = new CardService(db);
var CardProfileService = require("../services/CardProfileService");
var cardProfileService = new CardProfileService(db);
var jsend = require("jsend");

router.use(jsend.middleware);

/* GET users listing. */
router.get("/", isAuth, async (req, res, next) => {
  // #swagger.tags = ['Card']
  // #swagger.description = "get the users cards."
  try {
    const userId = req.user?.id ?? 0;
    const cards = await cardService.getAll(userId);
    if (cards.success) {
      res.jsend.success({ statusCode: 200, result: cards });
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
      message: "An error occurred while fetching cards",
      data: error.message,
    });
  }
});

// Add a new card the logged in user
router.post("/", isAuth, async (req, res) => {
  // #swagger.tags = ['Card']
  // #swagger.description = "Creates a new card for the logged in user."
  /* #swagger.parameters['body'] =  {
      "name": "body",
      "in": "body",
        "schema": {
          $ref: "#/definitions/Card"
        }
      }
    */
  const { name } = req.body;
  const userId = req.user?.id ?? 0;
  const userName = req.user?.name ?? 00;

  var cardExists = await cardService.getOne(name);
  if (cardExists.card != null) {
    return res.jsend.fail({ email: "Provided card name already exists." });
  }

  try {
    const newCard = await cardService.create(name, userId);
    //Generate unique card URL
    const cardUrl = generateCardUrl(userId, userName);

    const newCardUrl = await cardService.createCardUrl(
      newCard.data.id,
      userId,
      cardUrl
    );

    if (newCard.success && newCardUrl.success) {
      res.jsend.success({
        statusCode: 201, // Use 201 for resource creation
        result: newCard,
      });
    } else {
      res.jsend.fail({
        statusCode: 404,
        message: newCard.message,
        data: newCard.error,
      });
    }
  } catch (error) {
    res.jsend.error({
      statusCode: 500,
      message: "An error occurred while creating a new card",
      data: error.message,
    });
  }
});

// POST endpoint to add a new cardProfile to a card
router.post("/:cardId", isAuth, async (req, res) => {
  // #swagger.tags = ['CardProfile']
  // #swagger.description = "Create a new cardProfile for a specific card."

  const cardId = req.params.cardId;
  const {
    name,
    title,
    firstName,
    lastName,
    image,
    birthday,
    phone,
    email,
    website,
    website2,
  } = req.body;
  const userId = req.user?.id ?? 0;

  // Check if the card exists and belongs to the user
  const card = await cardService.getOneById(cardId);

  if (!card.card) {
    return res.jsend.fail({
      statusCode: 404,
      message: "This card does not exist.",
    });
  }
  if (card.card.UserId !== userId) {
    return res.jsend.fail({
      statusCode: 401,
      message: "This card does not belong to you.",
    });
  }

  // Check if a cardProfile with the same Name already exists for the card
  const existingCardProfile = await cardProfileService.getByName(cardId, name);
  if (existingCardProfile.card) {
    return res.jsend.fail({
      message: "A cardProfile with the same Name already exists for this card.",
    });
  }

  // Create a new cardProfile
  const newCardProfile = await cardProfileService.create(
    cardId,
    name,
    title,
    firstName,
    lastName,
    image,
    birthday,
    phone,
    email,
    website,
    website2
  );

  // Check if there are any card profiles associated with the card
  const existingCardProfiles = await cardProfileService.getAll(cardId);

  if (
    existingCardProfiles.success &&
    existingCardProfiles.cardProfiles.length === 0
  ) {
    await cardProfileService.updateActiveCardProfile(cardId, newCardProfile.id);
  }

  res.jsend.success({
    statusCode: 201,
    result: newCardProfile,
  });
});

// GET endpoint to retrieve cardProfiles for a specific card
router.get("/:cardId", isAuth, async (req, res) => {
  // #swagger.tags = ['CardProfile']
  // #swagger.description = "Retrieve cardProfiles for a specific card."

  const cardId = req.params.cardId;
  const userId = req.user?.id ?? 0;

  // Check if the card exists and belongs to the user
  const card = await cardService.getOneById(cardId);

  if (!card.card) {
    return res.jsend.fail({
      statusCode: 404,
      message: "This card does not exist.",
    });
  }
  if (card.card.UserId !== userId) {
    return res.jsend.fail({
      statusCode: 401,
      message: "This card does not belong to you.",
    });
  }

  // Retrieve all cardProfiles for the card
  const cardProfiles = await cardProfileService.getAll(cardId);

  res.jsend.success({
    statusCode: 200,
    result: cardProfiles,
  });
});

module.exports = router;
