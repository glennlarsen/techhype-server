module.exports = (sequelize, Sequelize) => {
  const SocialMedia = sequelize.define(
    "SocialMedia",
    {
      FacebookLink: Sequelize.DataTypes.STRING,
      LinkedinLink: Sequelize.DataTypes.STRING,
      SnapLink: Sequelize.DataTypes.STRING,
      InstagramLink: Sequelize.DataTypes.STRING,
      CardProfileId: {
        type: Sequelize.DataTypes.INTEGER,
        unique: true, // Add a unique constraint to ensure only one SocialMedia entry per CardProfile
      },
    },
    {
      timestamps: false,
    }
  );

  return SocialMedia;
};
