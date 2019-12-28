/* eslint-disable func-names */
/* eslint-disable no-unused-vars */

module.exports = (sequelize, DataTypes) => {
  const Notifications = sequelize.define('Notifications', {
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    action_link: DataTypes.TEXT,
    is_read: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    underscored: true,
    tableName: 'Notifications',
    timestamps: true,
  });
  Notifications.associate = function (models) {
    // associations can be defined here
  };
  return Notifications;
};
