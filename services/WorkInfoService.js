const { Op } = require("sequelize");

class WorkInfoService {
  constructor(db) {
    this.client = db.sequelize;
    this.WorkInfo = db.WorkInfo;
  }
  async getByProfileId(profileId) {
    const workInfo = await this.WorkInfo.findOne({
      where: { CardProfileId: profileId },
    });
    if (!workInfo) {
      return {
        success: false,
        message: "workInfo not found",
      };
    }
    return {
      success: true,
      workInfo,
    };
  }

  async getById(workInfoId) {
    return this.WorkInfo.findByPk(workInfoId);
  }

  async create(profileId, data) {
    const workInfo = await this.WorkInfo.create({
      Company: data.company,
      Position: data.position,
      WorkPhone: data.workPhone,
      WorkEmail: data.workEmail,
      CardProfileId: profileId,
    });
    return {
      success: true,
      workInfo,
      message: "Work info added",
    };
  }

  async update(profileId, data) {
    const workInfo = await this.WorkInfo.findOne({
      where: { CardProfileId: profileId },
    });

    if (!workInfo) {
      return {
        success: false,
        message: "Work info not found",
      };
    }

    // Update only the fields that have changed
    const updatedFields = {
      Company: data.company || address.Company,
      Position: data.position || address.Position,
      WorkPhone: data.workPhone || address.WorkPhone,
      WorkEmail: data.workEmail || address.WorkEmail,
      CardProfileId: profileId || address.CardProfileId,
    };

    await workInfo.update(updatedFields);

    return {
      success: true,
      workInfo,
      message: "Work info updated successfully",
    };
  }

  async delete(profileId) {
    const workInfo = await this.WorkInfo.findOne({
      where: { CardProfileId: profileId },
    });
    if (!workInfo) {
      return {
        success: false,
        message: "Work info not found",
      };
    }
    await workInfo.destroy();
    return {
      success: true,
      message: "Work info deleted successfully",
    };
  }
}

module.exports = WorkInfoService;
