module.exports = (sequelize, Sequelize) => {
  const WorkInfo = sequelize.define(
    "WorkInfo",
    {
      Company: Sequelize.DataTypes.STRING,
      Position: Sequelize.DataTypes.STRING,
      WorkPhone: Sequelize.DataTypes.STRING,
      WorkEmail: Sequelize.DataTypes.STRING,
    },
    {
      timestamps: false,
    }
  );

  return WorkInfo;
};
