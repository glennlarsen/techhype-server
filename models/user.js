module.exports = (sequelize, Sequelize) => {
    const User = sequelize.define('User', {
        FirstName: Sequelize.DataTypes.STRING,
        LastName: Sequelize.DataTypes.STRING,
        Email: {
            type: Sequelize.DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        EncryptedPassword: {
            type: Sequelize.DataTypes.BLOB,
            allowNull: false            
        },
        Salt: {
            type: Sequelize.DataTypes.BLOB,
            allowNull: false            
        },
        Role: {
           type: Sequelize.DataTypes.STRING,
           defaultValue: "User" 
        }
    },{
        timestamps: false
    });
    User.associate = function (models) {
        User.hasMany(models.Card, { foreignKey: 'UserId' });
        User.belongsToMany(models.CardProfile, {
          through: 'UserCardProfile', // Junction table name
          foreignKey: 'UserId',
        });
      };
      
	return User
}