const { Op } = require("sequelize");

class SocialMediaService {
  constructor(db) {
    this.client = db.sequelize;
    this.SocialMedia = db.SocialMedia;
  }
  async getByProfileId(profileId) {
    const socialMedia = await this.SocialMedia.findOne({
      where: { CardProfileId: profileId },
    });

    if (!socialMedia) {
      return {
        success: false,
        message: "Social Media not found",
      };
    }

    return {
      success: true,
      socialMedia,
    };
  }

  async getById(socialMediaId) {
    return this.SocialMedia.findByPk(socialMediaId);
  }

  async create(profileId, data) {
    const socialMedia = await this.SocialMedia.create({
      FacebookLink: data.facebookLink,
      LinkedinLink: data.linkedinLink,
      SnapLink: data.snapLink,
      InstagramLink: data.instagramLink,
      CardProfileId: profileId,
    });
    return {
      success: true,
      socialMedia,
      message: "SocialMedia added",
    };
  }

  async update(profileId, data) {
    const socialMedia = await this.SocialMedia.findOne({
      where: { CardProfileId: profileId },
    });

    if (!socialMedia) {
      return {
        success: false,
        message: "Social Media not found",
      };
    }

    // Update only the fields that have changed
    const updatedFields = {
      FacebookLink: data.facebookLink || socialMedia.FacebookLink,
      LinkedinLink: data.linkedinLink || socialMedia.LinkedinLink,
      SnapLink: data.snapLink || socialMedia.SnapLink,
      InstagramLink: data.instagramLink || socialMedia.InstagramLink,
      CardProfileId: profileId || socialMedia.CardProfileId,
    };

    await socialMedia.update(updatedFields);

    return {
      success: true,
      socialMedia,
      message: "Social Media updated successfully",
    };
  }

  async delete(profileId) {
    const socialMedia = await this.SocialMedia.findOne({
      where: { CardProfileId: profileId },
    });
    if (!socialMedia) {
      return {
        success: false,
        message: "Social Media not found",
      };
    }
    await socialMedia.destroy();
    return {
      success: true,
      message: "Social Media deleted successfully",
    };
  }
}

module.exports = SocialMediaService;
