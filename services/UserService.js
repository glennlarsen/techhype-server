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
    firstName, lastName, email, firebaseUID, verified = false
  ) {
    try {
    console.log("first name:", firstName);
    // First, create a new user
    const user = await this.User.create({
      FirstName: firstName,
      LastName: lastName,
      Email: email,
      FirebaseUID: firebaseUID, // Save Firebase UID
      Verified: verified // Set verified status
    });

    // Return the user (or other relevant information) if needed
    return user;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error; // Optionally handle or rethrow the error as per your application's error handling strategy
  }
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

  async updateUserVerified(firebaseUID, verified) {
    try {
      const user = await this.User.findOne({
        where: { FirebaseUID: firebaseUID }
      });

      if (!user) {
        return { success: false, message: "User not found" };
      }

      user.Verified = verified;
      await user.save();

      return { success: true, message: "User verification status updated" };
    } catch (error) {
      console.error("Error updating user verification status:", error);
      throw error;
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
