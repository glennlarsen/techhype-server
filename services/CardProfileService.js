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

  async create(
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
  ) {
    const existingProfiles = await this.CardProfile.findAll({
      where: { CardId: cardId },
    });
    const cardProfile = await this.CardProfile.create({
      CardId: cardId,
      Name: name,
      Title: title,
      FirstName: firstName,
      LastName: lastName,
      Image: image,
      Birthday: birthday,
      Phone: phone,
      Email: email,
      Website: website,
      Website2: website2,
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
      await this.CardProfile.update({ Active: false }, {
        where: { CardId: cardId },
      });
  
      // Then, set the specified card profile as active
      await this.CardProfile.update({ Active: true }, {
        where: { id: cardProfileId },
      });
  
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