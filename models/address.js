module.exports = (sequelize, Sequelize) => {
  const Address = sequelize.define(
    "Address",
    {
      Country: Sequelize.DataTypes.STRING,
      Street: Sequelize.DataTypes.STRING,
      PostalCode: Sequelize.DataTypes.STRING,
      State: Sequelize.DataTypes.STRING,
      City: Sequelize.DataTypes.STRING,
      CardProfileId: {
        type: Sequelize.DataTypes.INTEGER,
        unique: true, // Add a unique constraint to ensure only one address per CardProfile
      },
    },
    {
      timestamps: false,
    }
  );

  return Address;
};
