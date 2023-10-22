module.exports = (sequelize, Sequelize) => {
  const CardProfile = sequelize.define("CardProfile", {
    Name: {
      type: Sequelize.DataTypes.STRING,
      allowNull: false,
    },
    Active: {
      type: Sequelize.DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    Title: Sequelize.DataTypes.STRING,
    FirstName: Sequelize.DataTypes.STRING,
    LastName: Sequelize.DataTypes.STRING,
    Image: Sequelize.DataTypes.STRING,
    Birthday: Sequelize.DataTypes.DATEONLY,
    Phone: Sequelize.DataTypes.STRING,
    Email: Sequelize.DataTypes.STRING,
    Website: Sequelize.DataTypes.STRING,
    Website2: Sequelize.DataTypes.STRING,
  });
  CardProfile.associate = function (models) {
    CardProfile.belongsTo(models.Card, { foreignKey: "CardId" });

    // Associations with new models
    CardProfile.belongsToMany(models.User, {
      through: "UserCardProfile", // Junction table name
      foreignKey: "CardProfileId",
    });

    CardProfile.hasOne(models.SocialMedia, {
      foreignKey: "CardProfileId",
    });

    CardProfile.hasOne(models.Address, {
      foreignKey: "CardProfileId",
    });

    CardProfile.hasOne(models.WorkInfo, {
      foreignKey: "CardProfileId",
    });
  };

  return CardProfile;
};
