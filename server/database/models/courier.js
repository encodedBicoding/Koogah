/* eslint-disable func-names */
/* eslint-disable no-unused-vars */
/* eslint-disable no-param-reassign */
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const CryptoJS  = require('crypto-js');

module.exports = (sequelize, DataTypes) => {
  const Courier = sequelize.define('Couriers', {
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
    password: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    mobile_number: {
      type: DataTypes.STRING,
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
    address: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    nationality: {
      type: DataTypes.STRING,
      defaultValue: 'nigeria',
    },
    sex: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    bvn: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    identification_number: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    emergency_contact_one_name: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ''
    },
    emergency_contact_one_phone: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ''
    },
    emergency_contact_two_name: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ''
    },
    emergency_contact_two_phone: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ''
    },
    profile_image: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    virtual_balance: {
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
    pickups: {
      type: DataTypes.BIGINT,
      defaultValue: 0,
    },
    deliveries: {
      type: DataTypes.BIGINT,
      defaultValue: 0,
    },
    pending: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    is_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    verify_token: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: 'not_verified',
    },
    verification_code: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'XXXXX',
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    account_number: DataTypes.STRING,
    bank_name: DataTypes.STRING,
    last_payout: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    total_payouts: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    approval_code: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: 'not_approved',
    },
    password_reset_token: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    is_approved: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    is_courier: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    is_admin: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    is_currently_dispatching: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
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
  },

  {
    underscored: true,
    tableName: 'Couriers',
    timestamps: true,
  });

  Courier.prototype.encryptPassword = async function encryptPassword() {
    const saltRounds = 8;
    return bcrypt.hash(this.password, saltRounds);
  };

  Courier.prototype.decryptPassword = async function decryptPassword(password) {
    return bcrypt.compare(password, this.password);
  };
  Courier.prototype.getSafeDataValues = function getSafeDataValues() {
    let { password, ...data } = this.dataValues;
    return data;
  };


  Courier.associate = function (models) {
    // associations can be defined here
    Courier.hasMany(models.Packages, {
      as: 'Packages',
      foreignKey: 'dispatcher_id',
    });
    Courier.hasMany(models.Payouts, {
      as: 'Payouts',
      foreignKey: 'dispatcher_email',
    });
  };
  return Courier;
};
