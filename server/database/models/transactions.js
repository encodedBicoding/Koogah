/* eslint-disable func-names */


module.exports = (sequelize, DataTypes) => {
  const Transactions = sequelize.define('Transactions', {
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    dispatcher_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    amount_paid: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    reason: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fees: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    reference_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    payment_mode: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'card',
    },
    package_id: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    underscored: true,
    tableName: 'Transactions',
    timestamps: true,
  });
  Transactions.associate = function (models) {
    // associations can be defined here
    Transactions.belongsTo(models.Customers, {
      foreignKey: 'customer_id',
    });
    Transactions.hasMany(models.TransactionHistory, {
      as: 'Transaction'
    })
  };
  return Transactions;
};
