'use strict';
module.exports = (sequelize, DataTypes) => {
  const CompanyAwaitings = sequelize.define('CompanyAwaitings', {
    first_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    nin: {
      type: DataTypes.STRING,
      allowNull: false
    },
    user_email: {
      type: DataTypes.STRING,
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false
    },
    business_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    business_country: {
      type: DataTypes.STRING,
      allowNull: false
    },
    approval_link: {
      type: DataTypes.TEXT,
      allowNull: false
    },
  }, {
    underscored: true,
    tableName: 'CompanyAwaitings',
    timestamps: true,
  });
  CompanyAwaitings.associate = function(models) {
    // associations can be defined here
  };
  return CompanyAwaitings;
};