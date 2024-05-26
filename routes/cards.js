var express = require("express");
var router = express.Router();
const { requiresAuth } = require("express-openid-connect");
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
router.get("/", requiresAuth(), async (req, res, next) => {
  // #swagger.tags = ['Card']
  // #swagger.description = "get all the logged in users cards."
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

// GET endpoint to retrieve cardProfiles for a specific card and user.
router.get("/:cardId", requiresAuth(), async (req, res) => {
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

// Add a new card the logged in user
router.post("/", requiresAuth(), async (req, res) => {
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

// Update an existing card for the logged in user
router.put("/:cardId", requiresAuth(), async (req, res) => {
  // #swagger.tags = ['Card']
  // #swagger.description = "Update an existing card for the logged in user."
  /* #swagger.parameters['body'] =  {
        "name": "body",
        "in": "body",
        "schema": {
          $ref: "#/definitions/Card"
        }
      }
    */
  const cardId = req.params.cardId;
  const { name, active, designed } = req.body;

  try {
    // Check if the card exists and belongs to the user
    const card = await cardService.getOneById(cardId);

    if (!card.card) {
      return res.jsend.fail({
        statusCode: 404,
        message: "This card does not exist.",
      });
    }

    // Optionally, you can add a check to ensure the card belongs to the user here.
    // This depends on your specific requirements and how cards are associated with users.

    // Update the card details
    const updatedCard = await cardService.updateCard(cardId, name, active, designed);

    if (updatedCard.success) {
      res.jsend.success({
        statusCode: 200, // Use 200 for successful updates
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
router.delete("/:cardId", requiresAuth(), async (req, res) => {
  // #swagger.tags = ['Card']
  // #swagger.description = "Delete a card and its associated card profiles."

  const cardId = req.params.cardId;
  const userId = req.user?.id ?? 0;

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
router.post("/:cardId", requiresAuth(), uploadImage, async (req, res) => {
  // #swagger.tags = ['CardProfile']
  // #swagger.description = "Create a new cardProfile for a specific card with an image upload."
  // #swagger.consumes = ['multipart/form-data']
  /* #swagger.parameters['formData'] = {
  in: 'formData',
  name: 'image',
  description: 'Upload profile image.',
  type: 'file',
} */
  /* #swagger.parameters['name'] = {
  in: 'formData',
  name: 'name',
   type: 'string',
} */
  /* #swagger.parameters['title'] = {
  in: 'formData',
  name: 'title',
   type: 'string',
} */
  /* #swagger.parameters['firstName'] = {
  in: 'formData',
  name: 'firstName',
   type: 'string',
} */
  /* #swagger.parameters['lastName'] = {
  in: 'formData',
  name: 'lastName',
   type: 'string',
} */
  /* #swagger.parameters['birthday'] = {
  in: 'formData',
  name: 'birthday',
   type: 'string',
} */
  /* #swagger.parameters['phone'] = {
  in: 'formData',
  name: 'phone',
   type: 'string',
} */
  /* #swagger.parameters['email'] = {
  in: 'formData',
  name: 'email',
   type: 'string',
} */
  /* #swagger.parameters['website'] = {
  in: 'formData',
  name: 'website',
   type: 'string',
} */
  /* #swagger.parameters['website2'] = {
  in: 'formData',
  name: 'website2',
   type: 'string',
} */

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

// PUT endpoint to update a cardProfile
router.put("/:cardId/:profileId", requiresAuth(), uploadImage, async (req, res) => {
  // #swagger.tags = ['CardProfile']
  // #swagger.description = "Updates a cardProfile for a specific card."
  // #swagger.consumes = ['multipart/form-data']
  /* #swagger.parameters['formData'] = {
  in: 'formData',
  name: 'image',
  description: 'Upload profile image.',
  type: 'file',
} */
  /* #swagger.parameters['name'] = {
  in: 'formData',
  name: 'name',
   type: 'string',
} */
  /* #swagger.parameters['title'] = {
  in: 'formData',
  name: 'title',
   type: 'string',
} */
  /* #swagger.parameters['firstName'] = {
  in: 'formData',
  name: 'firstName',
   type: 'string',
} */
  /* #swagger.parameters['lastName'] = {
  in: 'formData',
  name: 'lastName',
   type: 'string',
} */
  /* #swagger.parameters['birthday'] = {
  in: 'formData',
  name: 'birthday',
   type: 'string',
} */
  /* #swagger.parameters['phone'] = {
  in: 'formData',
  name: 'phone',
   type: 'string',
} */
  /* #swagger.parameters['email'] = {
  in: 'formData',
  name: 'email',
   type: 'string',
} */
  /* #swagger.parameters['website'] = {
  in: 'formData',
  name: 'website',
   type: 'string',
} */
  /* #swagger.parameters['website2'] = {
  in: 'formData',
  name: 'website2',
   type: 'string',
} */
  const { cardId, profileId } = req.params;
  const userId = req.user?.id ?? 0;
  const { active } = req.body;
  const isActive = active === "true";

  try {
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

    const profile = await cardProfileService.getProfileById(profileId);

    if (!profile) {
      return res.jsend.fail({
        statusCode: 404,
        message: "Card profile not found.",
      });
    }

    // Handle image upload success here
    const uploadedFiles = req.files;

    // Extract image URL from uploadedFiles
    const imageUrl = uploadedFiles[0]?.location; // Assuming a single image upload
    const updateData = { ...req.body, imageUrl };

    // Update the card profile
    const updatedCardProfile = await cardProfileService.update(
      profileId,
      updateData
    );
    if (!updatedCardProfile.success) {
      return res.jsend.fail({ statusCode: 400, result: updatedCardProfile });
    }

    // Conditionally update active status if specified
    if (typeof active !== "undefined") {
      const activeUpdateResult =
        await cardProfileService.updateActiveCardProfile(
          cardId,
          profileId,
          isActive
        );
      if (!activeUpdateResult.success) {
        return res.jsend.fail({ statusCode: 400, result: activeUpdateResult });
      }
    }

    res.jsend.success({
      statusCode: 200,
      result: updatedCardProfile,
    });
  } catch (error) {
    res.jsend.error({
      statusCode: 500,
      message: error.message,
    });
  }
});

// DELETE endpoint to delete a card profile
router.delete("/:cardId/:profileId", requiresAuth(), async (req, res) => {
  // #swagger.tags = ['CardProfile']
  // #swagger.description = "Delete a card profile for a specific card."

  const cardId = req.params.cardId;
  const profileId = req.params.profileId;
  const userId = req.user?.id ?? 0;

  try {
    // Check if the card exists and belongs to the user
    const card = await cardService.getOneById(cardId);

    console.log("card: ", card.card);

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

    const profile = await cardProfileService.getProfileById(profileId);

    if (!profile) {
      return res.jsend.fail({
        statusCode: 404,
        message: "Card profile not found.",
      });
    }

    // Delete the card profile
    const result = await cardProfileService.delete(profileId);

    if (result.success) {
      res.jsend.success({
        statusCode: 200,
        message: "Card profile deleted successfully.",
      });
    } else {
      res.jsend.fail({
        statusCode: 400,
        message: result.message,
      });
    }
  } catch (error) {
    res.jsend.error(error.message);
  }
});

module.exports = router;
