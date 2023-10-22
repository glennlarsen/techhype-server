const { Op } = require("sequelize");

class CardService {
  constructor(db) {
    this.client = db.sequelize;
    this.User = db.User;
    this.Card = db.Card;
    this.CardUrl = db.CardUrl;
    this.CardProfile = db.CardProfile;
  }

  async getAll(cardId) {
    const cardProfiles = await this.CardProfile.findAll({
      where: { CardId: cardId },
    });
    return {
      success: true,
      cardProfiles,
    };
  }

  async getByName(cardId, name) {
    const card = await this.CardProfile.findOne({
      where: { CardId: cardId, Name: name },
    });
    return {
      success: true,
      card,
    };
  }

  async create(data) {

    const existingProfiles = await this.CardProfile.findAll({
      where: { CardId: data.cardId },
    });

    if (!data.name) {
      return {
        success: false,
        message: "Name is required.",
      };
    }
    const cardProfile = await this.CardProfile.create({
      Name: data.name,
      Title: data.title,
      FirstName: data.firstName,
      LastName: data.lastName,
      Image: data.imageUrl,
      Birthday: data.birthday,
      Phone: data.phone,
      Email: data.email,
      Website: data.website,
      Website2: data.website2,
      CardId: data.cardId,
    });

    if (existingProfiles.length === 0) {
      // If this is the first profile, mark it as active
      await this.CardProfile.update(
        { Active: true },
        {
          where: { id: cardProfile.id },
        }
      );
    }

    return {
      success: true,
      cardProfile,
    };
  }

  async updateActiveCardProfile(cardId, cardProfileId) {
    try {
      // First, deactivate all card profiles for the given card
      await this.CardProfile.update(
        { Active: false },
        {
          where: { CardId: cardId },
        }
      );

      // Then, set the specified card profile as active
      await this.CardProfile.update(
        { Active: true },
        {
          where: { id: cardProfileId },
        }
      );

      return {
        success: true,
        message: "Active card profile updated successfully",
      };
    } catch (error) {
      return {
        success: false,
        message: "Error updating active card profile",
        error: error.message,
      };
    }
  }
}

module.exports = CardService;
