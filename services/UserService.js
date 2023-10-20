const { Op } = require("sequelize");

class UserService {
  constructor(db) {
    this.client = db.sequelize;
    this.User = db.User;
    this.Card = db.Card;
    this.CardProfile = db.CardProfile;
  }

  async create(firstName, lastName, email, encryptedPassword, salt) {
    return this.User.create({
      FirstName: firstName,
      LastName: lastName,
      Email: email,
      EncryptedPassword: encryptedPassword,
      Salt: salt,
    });
  }

  async getAll() {
    return this.User.findAll({
      where: {},
    });
  }

  async getOne(userId) {
    try {
      const user = await this.User.findOne({
        where: { id: userId },
        include: [
          {
            model: this.Card,
            include: this.CardProfile,
          },
        ],
      });

      if (!user) {
        return {
          success: false,
          message: "User not found",
        };
      }

      return {
        success: true,
        user
      };
    } catch (error) {
      // You can handle the error here or re-throw it
      return {
        success: false,
        message: error,
      };
    }
  }

  async getOneByEmail(email) {
    return await this.User.findOne({
      where: { Email: email },
    });
  }

  async deleteUser(userId) {
    return this.User.destroy({
      where: {
        id: userId,
        Role: {
          [Op.not]: "Admin",
        },
      },
    });
  }
}
module.exports = UserService;
