const { Op } = require("sequelize");

class AddressService {
  constructor(db) {
    this.client = db.sequelize;
    this.Address = db.Address;
  }
  async getByProfileId(profileId) {
    const address = await this.Address.findOne({
      where: { CardProfileId: profileId },
    });

    if (!address) {
      return {
        success: false,
        message: "Address not found",
      };
    }

    return {
      success: true,
      address,
    };
  }

  async getById(addressId) {
    return this.Address.findByPk(addressId);
  }

  async create(profileId, data) {
    const address = await this.Address.create({
      Country: data.country,
      Street: data.street,
      PostalCode: data.postalCode,
      State: data.state,
      City: data.city,
      CardProfileId: profileId,
    });
    return {
      success: true,
      address,
      message: "Address added",
    };
  }

  async update(profileId, data) {
    const address = await this.Address.findOne({
      where: { CardProfileId: profileId },
    });

    if (!address) {
      return {
        success: false,
        message: "Address not found",
      };
    }

    // Update only the fields that have changed
    const updatedFields = {
      Country: data.country || address.Country,
      Street: data.street || address.Street,
      PostalCode: data.postalCode || address.PostalCode,
      State: data.state || address.State,
      City: data.city || address.City,
      CardProfileId: profileId || address.CardProfileId,
    };

    await address.update(updatedFields);

    return {
      success: true,
      address,
      message: "Address updated successfully",
    };
  }

  async delete(profileId) {
    const address = await this.Address.findOne({
      where: { CardProfileId: profileId },
    });
    if (!address) {
      return {
        success: false,
        message: "Address not found",
      };
    }
    await address.destroy();
    return {
      success: true,
      message: "Address deleted successfully",
    };
  }
}

module.exports = AddressService;
