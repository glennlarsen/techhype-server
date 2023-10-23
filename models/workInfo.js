module.exports = (sequelize, Sequelize) => {
  const WorkInfo = sequelize.define(
    "WorkInfo",
    {
      Company: Sequelize.DataTypes.STRING,
      Position: Sequelize.DataTypes.STRING,
      WorkPhone: Sequelize.DataTypes.STRING,
      WorkEmail: Sequelize.DataTypes.STRING,
      CardProfileId: {
        type: Sequelize.DataTypes.INTEGER,
        unique: true, // Add a unique constraint to ensure only one WorkInfo entry per CardProfile
      },
    },
    {
      timestamps: false,
    }
  );

  return WorkInfo;
};
