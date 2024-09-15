module.exports = (sequelize, Sequelize) => {
  const User = sequelize.define(
    "User",
    {
      FirebaseUID: {
        type: Sequelize.DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      FirstName: {
        type: Sequelize.DataTypes.STRING(255),
        allowNull: false,
      },
      LastName: {
        type: Sequelize.DataTypes.STRING(255),
        allowNull: false,
      },
      Email: {
        type: Sequelize.DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      Role: {
        type: Sequelize.DataTypes.STRING(50),
        defaultValue: "User",
      },
      Verified: {
        type: Sequelize.DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      timestamps: false,
    }
  );

  User.associate = function (models) {
    User.hasMany(models.Card, { foreignKey: "UserId", onDelete: "CASCADE" });
  };

  return User;
};
