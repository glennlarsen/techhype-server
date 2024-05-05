module.exports = (sequelize, Sequelize) => {
  const Card = sequelize.define(
    "Card",
    {
      Name: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
      },
      Active: {
        type: Sequelize.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      Designed: {
        type: Sequelize.DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      timestamps: false,
    }
  );
  Card.associate = function (models) {
    Card.belongsTo(models.User, { foreignKey: "UserId" });
    Card.hasMany(models.CardProfile, {
      foreignKey: "CardId",
      onDelete: "CASCADE",
    });
    Card.hasOne(models.CardUrl, { foreignKey: "cardId", onDelete: "CASCADE" });
  };

  return Card;
};
