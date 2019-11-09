/* eslint-disable func-names */
/* eslint-disable no-unused-vars */
/* eslint-disable require-atomic-updates */
/* eslint-disable no-param-reassign */
import bcrypt from 'bcrypt';

module.exports = (sequelize, DataTypes) => {
  const Customers = sequelize.define('Customers', {
    first_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    business_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    has_business: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    is_courier: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    virtual_balance: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    verify_token: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: 'not_verified',
    },
    mobile_number_one: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    mobile_number_two: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    verification_code: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'XXXXX',
    },
    is_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    profile_image: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    state: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    town: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    is_admin: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    underscored: true,
    tableName: 'Customers',
    timestamps: true,
  });

  Customers.beforeCreate(async (customer) => {
    customer.password = await customer.encryptPassword();
  });

  Customers.prototype.encryptPassword = async function encryptPassword() {
    const saltRounds = 8;
    return bcrypt.hash(this.password, saltRounds);
  };

  Customers.prototype.decryptPassword = async function decryptPassword(password) {
    return bcrypt.compare(password, this.password);
  };
  Customers.prototype.getSafeDataValues = function getSafeDataValues() {
    const { password, ...data } = this.dataValues;
    return data;
  };

  Customers.associate = function (models) {
    // associations can be defined here
  };
  return Customers;
};