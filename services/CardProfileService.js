const { Op } = require("sequelize");

class CardProfileService {
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

  // Function to retrieve a card profile by ID
  async getProfileById(profileId) {
    return this.CardProfile.findByPk(profileId);
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

    // Function to update a card profile status active/inactive
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

  // Function to update a card profile
  async update(profileId, data, imageUrl) {
    try {
      // Fetch the card profile
      const profile = await this.getProfileById(profileId);

      if (!profile) {
        return {
          success: false,
          message: "Card profile not found.",
        };
      }

      // Update the card profile data
      profile.Name = data.name || profile.Name;
      profile.Title = data.title || profile.Title;
      profile.FirstName = data.firstName || profile.FirstName;
      profile.LastName = data.lastName || profile.LastName;
      profile.Image = imageUrl || profile.Image;
      profile.Birthday = data.birthday || profile.Birthday;
      profile.Phone = data.phone || profile.Phone;
      profile.Email = data.email || profile.Email;
      profile.Website = data.website || profile.Website;
      profile.Website2 = data.website2 || profile.Website2;

      // Save the updated card profile
      await profile.save();

      return {
        success: true,
        message: "Card profile updated successfully",
        cardProfile: profile,
      };
    } catch (error) {
      return {
        success: false,
        message: "Error updating card profile",
        error: error.message,
      };
    }
  }

  async delete(profileId) {
    try {
      // Fetch the card profile by ID
      const profile = await this.getProfileById(profileId);

      if (!profile) {
        return {
          success: false,
          message: "Card profile not found.",
        };
      }

      // Delete the associated address (if it exists)
      if (profile.Address) {
        await profile.Address.destroy();
      }

      // Delete the card profile
      await profile.destroy();

      return {
        success: true,
        message: "Card profile deleted successfully",
      };
    } catch (error) {
      return {
        success: false,
        message: "Error deleting card profile",
        error: error.message,
      };
    }
  }
}

module.exports = CardProfileService;
