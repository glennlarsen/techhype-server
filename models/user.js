module.exports = (sequelize, Sequelize) => {
  const User = sequelize.define(
    "User",
    {
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
      EncryptedPassword: {
        type: Sequelize.DataTypes.BLOB,
        allowNull: true, // Allow null for Facebook login
      },
      Salt: {
        type: Sequelize.DataTypes.BLOB,
        allowNull: true, // Allow null for Facebook login
      },
      Role: {
        type: Sequelize.DataTypes.STRING(50),
        defaultValue: "User",
      },
      Verified: {
        type: Sequelize.DataTypes.BOOLEAN,
        defaultValue: false, // Initially, email is not verified
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
