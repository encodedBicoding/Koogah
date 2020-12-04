/* eslint-disable func-names */
/* eslint-disable no-unused-vars */

module.exports = (sequelize, DataTypes) => {
  const Awaiting = sequelize.define('Awaitings', {
    first_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    bvn: {
      type: DataTypes.STRING,
      allowNull: false
    },
    user_email: {
      type: DataTypes.STRING,
      allowNull: false
    },
    mobile_number: {
      type: DataTypes.STRING,
      allowNull: false
    },
    sex: {
      type: DataTypes.STRING,
      allowNull: false
    },
    approval_link: {
      type: DataTypes.TEXT,
      allowNull: false
    },
  }, {
    underscored: true,
    tableName: 'Awaitings',
    timestamps: true,
  });
  Awaiting.associate = function (models) {
    // associations can be defined here
  };
  return Awaiting;
};
