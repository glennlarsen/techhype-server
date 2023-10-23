const { Op } = require("sequelize");

class UserService {
  constructor(db) {
    this.client = db.sequelize;
    this.User = db.User;
    this.Token = db.Token;
    this.Card = db.Card;
    this.CardProfile = db.CardProfile;
  }

  async create(firstName, lastName, email, encryptedPassword, salt, verificationToken, expirationTime) {
    // First, create a new user
    const user = await this.User.create({
      FirstName: firstName,
      LastName: lastName,
      Email: email,
      EncryptedPassword: encryptedPassword,
      Salt: salt,
    });
  
    // Now, create a corresponding verification token and associate it with the user
    const token = await this.Token.create({
      UserId: user.id, // Associate the token with the user
      Token: verificationToken,
      Expiration: expirationTime,
    });
  
    // You can add error handling here to make sure both user and token creation were successful
  
    // Return the user (or other relevant information) if needed
    return user;
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
