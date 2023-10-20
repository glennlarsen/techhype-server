module.exports = (sequelize, Sequelize) => {
  const SocialMedia = sequelize.define(
    "SocialMedia",
    {
      FacebookLink: Sequelize.DataTypes.STRING,
      LinkedinLink: Sequelize.DataTypes.STRING,
      SnapLink: Sequelize.DataTypes.STRING,
      InstagramLink: Sequelize.DataTypes.STRING,
    },
    {
      timestamps: false,
    }
  );

  return SocialMedia;
};
