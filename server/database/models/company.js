/* eslint-disable func-names */
/* eslint-disable no-unused-vars */
/* eslint-disable no-param-reassign */
const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
  const Company = sequelize.define('Companies', {
    business_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    nin: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    first_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    is_verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    is_approved: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    bank_account_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    bank_account_number: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    verify_token: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: 'not_verified',
    },
    approval_code: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: 'not_approved',
    },
    business_address: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    business_state: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    business_town: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    password_reset_token: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    verification_code: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'XXXXX',
    },
    business_country: {
      type: DataTypes.STRING,
      allowNull: false,
    }
  },
  {
    underscored: true,
    tableName: 'Companies',
    timestamps: true,
  });
  
  Company.prototype.encryptPassword = async function encryptPassword() {
    const saltRounds = 8;
    return bcrypt.hash(this.password, saltRounds);
  };
  Company.prototype.decryptPassword = async function decryptPassword(password) {
    return bcrypt.compare(password, this.password);
  };
  Company.prototype.getSafeDataValues = function getSafeDataValues() {
    let { password, ...data } = this.dataValues;
    return data;
  };

  Company.associate = function(models) {
    // associations can be defined here
    Company.hasMany(models.Couriers, {
      as: 'Dispatchers',
      onDelete: 'CASCADE',
      foreignKey: 'company_id'
    })
  };
  return Company;
};