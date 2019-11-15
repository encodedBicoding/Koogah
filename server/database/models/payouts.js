/* eslint-disable func-names */

module.exports = (sequelize, DataTypes) => {
  const Payouts = sequelize.define('Payouts', {
    dispatcher_first_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    dispatcher_last_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    dispatcher_email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    amount_requested: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    dispatcher_account_number: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    dispatcher_bank_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    reference_id: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
    },
  },
  {
    underscored: true,
    tableName: 'Payouts',
    timestamps: true,
  });
  Payouts.associate = function (models) {
    // associations can be defined here
    Payouts.belongsTo(models.Couriers, {
      foreignKey: 'dispatcher_email',
    });
  };
  return Payouts;
};
