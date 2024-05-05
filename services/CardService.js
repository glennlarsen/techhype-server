const { Op } = require("sequelize");

class CardService {
  constructor(db) {
    this.client = db.sequelize;
    this.User = db.User;
    this.Card = db.Card;
    this.CardUrl = db.CardUrl;
    this.CardProfile = db.CardProfile;
  }

  async getAll(userId) {
    const cards = await this.Card.findAll({
      where: { UserId: userId },
    });
    return {
      success: true,
      cards,
    };
  }

  async getOne(name) {
    const card = await this.Card.findOne({
      where: { Name: name },
    });
    return {
      success: true,
      card,
    };
  }

  async getOneById(cardId) {
    const card = await this.Card.findOne({
      where: { id: cardId },
    });
    return {
      success: true,
      card,
    };
  }

  async create(name, userId) {
    // Check that all fields are provided
    if (!name) {
      return {
        success: false,
        message: "Name is required.",
      };
    }

    if (name && typeof name !== "string") {
      return {
        success: false,
        message: "Name must be a string",
      };
    }

    const createdCard = await this.Card.create({
      Name: name,
      UserId: userId,
    });

    return {
      success: true,
      message: "Card created successfully",
      data: createdCard,
    };
  }

  async createCardUrl(cardId, userId, url) {
    if (!cardId || !userId || !url) {
      return {
        success: false,
        message: "cardId, userId, and url are required.",
      };
    }

    // Check if the card URL already exists
    const existingCardUrl = await this.CardUrl.findOne({
      where: { url: url },
    });

    if (existingCardUrl) {
      return {
        success: false,
        message: "Card URL already exists, please try again.",
      };
    }

    const createdCardUrl = await this.CardUrl.create({
      cardId: cardId,
      userId: userId,
      url: url,
    });

    return {
      success: true,
      message: "CardUrl created successfully",
      data: createdCardUrl,
    };
  }

  async updateCard(cardId, name, active, designed) {
    // Check that all fields are provided
    if (!cardId) {
      return {
        success: false,
        message: "cardId is required for the update.",
      };
    }

    try {
      // Check if the card exists
      const existingCard = await this.Card.findOne({
        where: { id: cardId },
      });

      if (!existingCard) {
        return {
          success: false,
          message: "Card does not exist.",
        };
      }

      // Define the fields to update
      const updatedFields = {};

      if (existingCard.Designed === false) {
        updatedFields.Designed = designed;
      }

      if (existingCard.Designed === true) {
        return {
          success: false,
          message:
            "Card design is already sent. You will receive your card shortly. Please contact us as soon as possible if you want to change your card design.",
        };
      }

      // Check if the name field is different
      if (name && name !== existingCard.Name) {
        updatedFields.Name = name;
      }

      // Check if the active field is different
      if (active !== undefined && active !== existingCard.Active) {
        updatedFields.Active = active;
      }

      // Check if no fields are different
      if (Object.keys(updatedFields).length === 0) {
        return {
          success: false,
          message: "No fields were changed.",
        };
      }

      // Update the card details
      const updatedCard = await this.Card.update(updatedFields, {
        where: { id: cardId },
      });

      if (updatedCard[0] === 1) {
        // The update was successful
        return {
          success: true,
          message: "Card updated successfully",
          updatedFields,
        };
      } else {
        return {
          success: false,
          message: "Card update failed",
        };
      }
    } catch (error) {
      return {
        success: false,
        message: "An error occurred while updating the card",
        error: error.message,
      };
    }
  }

  async deleteCard(cardId, userId) {
    // Check that cardId is provided
    if (!cardId) {
      return {
        success: false,
        message: "cardId is required for deletion.",
      };
    }

    try {
      // Check if the card exists
      const existingCard = await this.Card.findOne({
        where: { id: cardId },
      });

      if (!existingCard) {
        return {
          success: false,
          message: "Card does not exist.",
        };
      }

      // Check if the card belongs to the user
      if (existingCard.UserId !== userId) {
        return {
          success: false,
          message: "This card does not belong to you.",
        };
      }

      // Delete the card
      await this.Card.destroy({
        where: { id: cardId },
      });

      return {
        success: true,
        message:
          "Card, associated CardProfiles, and CardUrls deleted successfully.",
      };
    } catch (error) {
      return {
        success: false,
        message: "An error occurred while deleting the card",
        error: error.message,
      };
    }
  }
}
module.exports = CardService;
