/* eslint-disable func-names */
/* eslint-disable no-unused-vars */
/* eslint-disable no-param-reassign */
import bcrypt from 'bcrypt';

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
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    pickups: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    deliveries: {
      type: DataTypes.INTEGER,
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
  },

  {
    underscored: true,
    tableName: 'Couriers',
    timestamps: true,
  });

  Courier.beforeCreate(async (courier) => {
    // eslint-disable-next-line require-atomic-updates
    courier.password = await courier.encryptPassword();
  });

  Courier.prototype.encryptPassword = async function encryptPassword() {
    const saltRounds = 8;
    return bcrypt.hash(this.password, saltRounds);
  };

  Courier.prototype.decryptPassword = async function decryptPassword(password) {
    return bcrypt.compare(password, this.password);
  };
  Courier.prototype.getSafeDataValues = function getSafeDataValues() {
    const { password, ...data } = this.dataValues;
    return data;
  };


  Courier.associate = function (models) {
    // associations can be defined here
    Courier.hasMany(models.Packages, {
      as: 'Dispatcher',
      foreignKey: 'dispatcher_id',
    });
  };
  return Courier;
};
