module.exports = (sequelize, Sequelize) => {
  const User = sequelize.define(
    "User",
    {
      FirstName: Sequelize.DataTypes.STRING,
      LastName: Sequelize.DataTypes.STRING,
      Email: {
        type: Sequelize.DataTypes.STRING,
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
        type: Sequelize.DataTypes.STRING,
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
