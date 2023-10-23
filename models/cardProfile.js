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

    CardProfile.hasOne(models.SocialMedia, {
      foreignKey: "CardProfileId",
      onDelete: "CASCADE", // This ensures that when a CardProfile is deleted, the associated Address is also deleted
    });

    CardProfile.hasOne(models.Address, {
      foreignKey: "CardProfileId",
      onDelete: "CASCADE", // This ensures that when a CardProfile is deleted, the associated Address is also deleted
    });

    CardProfile.hasOne(models.WorkInfo, {
      foreignKey: "CardProfileId",
      onDelete: "CASCADE", // This ensures that when a CardProfile is deleted, the associated Address is also deleted
    });
  };

  return CardProfile;
};
