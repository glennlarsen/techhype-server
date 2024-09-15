var express = require("express");
var router = express.Router();
const generateCardUrl = require("./middleware/generateCardUrl");
const uploadImage = require("./middleware/uploadImage");
var db = require("../models");
var CardService = require("../services/CardService");
var cardService = new CardService(db);
var CardProfileService = require("../services/CardProfileService");
var cardProfileService = new CardProfileService(db);
var jsend = require("jsend");

router.use(jsend.middleware);


// GET endpoint to retrieve Cards for a specific user
router.get("/", async (req, res) => {
  try {
    const userId = req.user?.user?.dataValues?.id ?? 0;

    const cards = await cardService.getAll(userId);
    if (cards.success) {
      res.jsend.success({ statusCode: 200, result: cards });
    } else {
      res.jsend.fail({
        statusCode: 404,
        message: cards.message,
        error: cards.error,
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

// GET endpoint to retrieve cardProfiles for a specific card and user.
router.get("/:cardId", async (req, res) => {
  const cardId = req.params.cardId;
  const userId = req.user?.user?.dataValues?.id ?? 0;
  console.log("card id and user id: ", cardId, userId);

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

  const cardProfiles = await cardProfileService.getAll(cardId);

  res.jsend.success({
    statusCode: 200,
    result: cardProfiles,
  });
});

// Add a new card the logged in user
router.post("/", async (req, res) => {
  const { name } = req.body;
  const userId = req.user?.user?.dataValues?.id ?? 0;
  const userName = req.user?.user?.dataValues?.FirstName ?? '';

  const cardExists = await cardService.getOne(name, userId);
  if (cardExists.card != null) {
    return res.jsend.fail({ email: "Provided card name already exists for this user." });
  }

  try {
    const newCard = await cardService.create(name, userId);
    const cardUrl = generateCardUrl(userId, userName);

    const newCardUrl = await cardService.createCardUrl(
      newCard.data.id,
      userId,
      cardUrl
    );

    if (newCard.success && newCardUrl.success) {
      res.jsend.success({
        statusCode: 201,
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

// Update an existing card for the logged in user
router.put("/:cardId", async (req, res) => {
  const cardId = req.params.cardId;
  const { name, active, designed } = req.body;

  try {
    const card = await cardService.getOneById(cardId);

    if (!card.card) {
      return res.jsend.fail({
        statusCode: 404,
        message: "This card does not exist.",
      });
    }

    const updatedCard = await cardService.updateCard(cardId, name, active, designed);

    if (updatedCard.success) {
      res.jsend.success({
        statusCode: 200,
        result: updatedCard,
      });
    } else {
      res.jsend.fail({
        statusCode: 404,
        message: updatedCard.message,
        data: updatedCard.error,
      });
    }
  } catch (error) {
    res.jsend.error({
      statusCode: 500,
      message: "An error occurred while updating the card",
      data: error.message,
    });
  }
});

// DELETE endpoint to delete a card
router.delete("/:cardId", async (req, res) => {
  const cardId = req.params.cardId;
  const userId = req.user?.user?.dataValues?.id ?? 0;

  try {
    const result = await cardService.deleteCard(cardId, userId);

    if (result.success) {
      res.jsend.success({
        statusCode: 200,
        message: "Card and associated card profiles deleted successfully.",
      });
    } else {
      res.jsend.fail({
        statusCode: 404,
        message: result.message,
      });
    }
  } catch (error) {
    res.jsend.error({
      statusCode: 500,
      message: "An error occurred while deleting the card",
      data: error.message,
    });
  }
});

// POST endpoint to add a new cardProfile to a card
router.post("/:cardId", uploadImage, async (req, res) => {
  const cardId = req.params.cardId;
  const userId = req.user?.user?.dataValues?.id ?? 0;

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

  // Handle image upload success here
  const uploadedFiles = req.files;

  console.log("uploaded files: ", uploadedFiles);

  // Extract image URL from uploadedFiles
  const imageUrl = uploadedFiles[0]?.location; // Assuming a single image upload

  const {
    name,
    title,
    firstName,
    lastName,
    birthday,
    phone,
    email,
    website,
    website2,
  } = req.body;

  // Check if a cardProfile with the same Name already exists for the card
  if (name) {
    const existingCardProfile = await cardProfileService.getByName(
      cardId,
      name
    );
    if (existingCardProfile.card) {
      return res.jsend.fail({
        statusCode: 404,
        message:
          "A cardProfile with the same Name already exists for this card.",
      });
    }
  } else {
    return res.jsend.fail({
      statusCode: 404,
      message: "Name is required",
    });
  }

  // Create a new cardProfile with the obtained image URL if it exists
  const newCardProfileData = {
    cardId,
    name,
    title,
    firstName,
    lastName,
    birthday,
    phone,
    email,
    website,
    website2,
  };

  if (imageUrl) {
    newCardProfileData.imageUrl = imageUrl;
  }

  const newCardProfile = await cardProfileService.create(newCardProfileData);

  // Check if there are any card profiles associated with the card
  const existingCardProfiles = await cardProfileService.getAll(cardId);

  if (
    existingCardProfiles.success &&
    existingCardProfiles.cardProfiles.length === 0
  ) {
    await cardProfileService.updateActiveCardProfile(cardId, newCardProfile.id);
  }
  if (newCardProfile.success) {
    res.jsend.success({
      statusCode: 201,
      result: newCardProfile,
    });
  } else {
    res.jsend.fail({
      statusCode: 404,
      result: newCardProfile,
    });
  }
});

module.exports = router;
