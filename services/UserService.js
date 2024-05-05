const { Op } = require("sequelize");
const Sequelize = require("sequelize");

class UserService {
  constructor(db) {
    this.client = db.sequelize;
    this.User = db.User;
    this.Token = db.Token;
    this.Card = db.Card;
    this.CardProfile = db.CardProfile;
  }

  async create(
    firstName,
    lastName,
    email,
    encryptedPassword,
    salt,
    verificationToken,
    expirationTime
  ) {
    // First, create a new user
    const user = await this.User.create({
      FirstName: firstName,
      LastName: lastName,
      Email: email,
      EncryptedPassword: encryptedPassword,
      Salt: salt,
    });

    // Now, create a corresponding verification token and associate it with the user
    const token = await this.createToken(
      user.id,
      verificationToken,
      expirationTime
    );

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
        user,
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

  async createToken(userId, verificationToken, expirationTime) {
    const token = await this.Token.create({
      UserId: userId, // Associate the token with the user
      Token: verificationToken,
      Expiration: expirationTime,
    });

    return token;
  }

  async verifyToken(token) {
    // Find the token in the Token table
    const tokenRecord = await this.Token.findOne({
      where: {
        Token: token,
        Expiration: {
          [Sequelize.Op.gt]: new Date(),
        },
      },
      include: [{ model: this.User }],
    });

    if (tokenRecord) {
      return tokenRecord.User; // Return the associated user
    } else {
      return null; // Token not found or has expired
    }
  }

  async getToken(token) {
    // Find the token in the Token table
    const tokenRecord = await this.Token.findOne({
      where: {
        Token: token,
        Expiration: {
          [Sequelize.Op.gt]: new Date(),
        },
      },
    });

    if (tokenRecord) {
      return tokenRecord; // Return the token
    } else {
      return null; // Token not found or has expired
    }
  }

  async getUserFromToken(token) {
    try {
      // Find the token in the Token model
      const tokenRecord = await this.Token.findOne({
        where: {
          Token: token,
        },
      });

      if (tokenRecord) {
        // Get the associated user from the User model
        const user = await this.User.findByPk(tokenRecord.UserId);
        return user; // Return the associated user
      } else {
        return null; // Token not found
      }
    } catch (error) {
      console.error("Error getting user from token:", error);
      return null; // An error occurred while getting the user from the token
    }
  }

  async clearToken(token) {
    try {
      // Find the token in the Token model
      const tokenRecord = await this.Token.findOne({
        where: {
          Token: token,
        },
      });

      if (tokenRecord) {
        await tokenRecord.destroy(); // Delete the token
        return true; // Token cleared successfully
      } else {
        return false; // Token not found
      }
    } catch (error) {
      console.error("Error clearing reset token:", error);
      return false; // An error occurred while clearing the token
    }
  }

  async updateUserNames(userId, firstName, lastName) {
    try {
      const user = await this.User.findByPk(userId);
      if (!user) {
        return { success: false, message: "User not found" };
      }

      // Update fields if provided
      if (firstName) user.FirstName = firstName;
      if (lastName) user.LastName = lastName;

      await user.save();
      return {
        success: true,
        user: user,
        message: "User updated successfully",
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to update user",
        error: error.message,
      };
    }
  }
}
module.exports = UserService;
