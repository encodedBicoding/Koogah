/* eslint-disable func-names */
/* eslint-disable require-atomic-updates */
/* eslint-disable no-param-reassign */
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const CryptoJS  = require('crypto-js');

dotenv.config();

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
    virtual_allocated_balance: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    rating: {
      type: DataTypes.DECIMAL(10, 1),
      defaultValue: 0.0,
    },
    no_of_raters: {
      type: DataTypes.BIGINT,
      defaultValue: 0,
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
      allowNull: true,
    },
    state: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    town: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    nationality: {
      type: DataTypes.STRING,
      defaultValue: 'nigeria',
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
    referal_id: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    refered_by: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ws_connected_channels: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    koogah_coin: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    virtual_allocated_kc_balance: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    password_reset_token: {
      type: DataTypes.TEXT,
      allowNull: true
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
    return await bcrypt.hash(this.password, saltRounds);
  };

  Customers.prototype.encryptMainData = function encryptData(data) {
    const secret_key = process.env.SECRET_KEY;
    return CryptoJS.AES.encrypt(data, secret_key).toString();
  };

  Customers.prototype.decryptPassword = async function decryptPassword(password) {
    return await bcrypt.compare(password, this.password);
  };
  Customers.prototype.getSafeDataValues = function getSafeDataValues() {
    let { password, ...data } = this.dataValues;
    return data;
  };

  Customers.associate = function (models) {
    // associations can be defined here
    Customers.hasMany(models.Packages, {
      as: 'Owner',
      foreignKey: 'customer_id',
      onDelete: 'CASCADE',
    });
    Customers.hasMany(models.Transactions, {
      as: 'Customer',
      foreignKey: 'customer_id',
    });
  };
  return Customers;
};
