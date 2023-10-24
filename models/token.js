// Token model
module.exports = (sequelize, Sequelize) => {
  const Token = sequelize.define(
    "Token",
    {
      UserId: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false,
      },
      Token: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
      },
      Expiration: {
        type: Sequelize.DataTypes.DATE,
      },
    },
    {
      timestamps: false,
    }
  );

  Token.associate = function (models) {
    Token.belongsTo(models.User, { foreignKey: "UserId", onDelete: "CASCADE" });
  };

  return Token;
};
