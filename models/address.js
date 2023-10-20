module.exports = (sequelize, Sequelize) => {
  const Address = sequelize.define(
    "Address",
    {
      Country: Sequelize.DataTypes.STRING,
      Street: Sequelize.DataTypes.STRING,
      PostalCode: Sequelize.DataTypes.STRING,
      State: Sequelize.DataTypes.STRING,
      City: Sequelize.DataTypes.STRING,
    },
    {
      timestamps: false,
    }
  );

  return Address;
};
