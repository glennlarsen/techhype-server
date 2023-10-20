module.exports = (sequelize, Sequelize) => {
  const CardUrl = sequelize.define(
    "CardUrl",
    {
      url: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
    },
    {
      timestamps: false,
    }
  );

  CardUrl.associate = function (models) {
    CardUrl.belongsTo(models.Card, { foreignKey: "cardId" });
    CardUrl.belongsTo(models.User, { foreignKey: "userId" });
  };

  return CardUrl;
};
