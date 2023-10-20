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
}
module.exports = CardService;
