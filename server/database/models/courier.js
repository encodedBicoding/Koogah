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
      allowNull: false,
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
      defaultValue: 'nigerian',
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

  Courier.beforeCreate(async (courier) => {
    // eslint-disable-next-line require-atomic-updates
    courier.password = await courier.encryptPassword();
    // courier.first_name = courier.encryptMainData(courier.first_name);
    // courier.last_name = courier.encryptMainData(courier.last_name);
    // courier.address = courier.encryptMainData(courier.address);
    // courier.nationality = courier.encryptMainData(courier.nationality);
    // courier.mobile_number = courier.encryptMainData(courier.mobile_number);

  });

  Courier.prototype.encryptPassword = async function encryptPassword() {
    const saltRounds = 8;
    return bcrypt.hash(this.password, saltRounds);
  };

  Courier.encryptMainData = function encryptMainData(data) {
    const secret_key = process.env.SECRET_KEY;
    return CryptoJS.AES.encrypt(data, secret_key).toString();
  }

  Courier.prototype.decryptPassword = async function decryptPassword(password) {
    return bcrypt.compare(password, this.password);
  };
  Courier.prototype.getSafeDataValues = function getSafeDataValues() {
    let secret_key = process.env.SECRET_KEY;
    let { password, ...data } = this.dataValues;
    // data = Object.keys(data).reduce((acc, curr) => {
    //   acc = this.dataValues;
    //   if (curr === 'first_name') {
    //     acc[curr] = CryptoJS.AES.decrypt(this.dataValues[curr], secret_key).toString(CryptoJS.enc.Utf8);
    //   }
    //   if (curr === 'last_name') {
    //     acc[curr] = CryptoJS.AES.decrypt(this.dataValues[curr], secret_key).toString(CryptoJS.enc.Utf8);
    //   }
    //   if (curr === 'address') {
    //     acc[curr] = CryptoJS.AES.decrypt(this.dataValues[curr], secret_key).toString(CryptoJS.enc.Utf8);
    //   }
    //   if (curr === 'nationality') {
    //     acc[curr] = CryptoJS.AES.decrypt(this.dataValues[curr], secret_key).toString(CryptoJS.enc.Utf8);
    //   }
    //   if (curr === 'mobile_number') {
    //     acc[curr] = CryptoJS.AES.decrypt(this.dataValues[curr], secret_key).toString(CryptoJS.enc.Utf8);
    //   }
    //   return acc;
    // }, {})
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
