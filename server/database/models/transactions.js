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
      type: DataTypes.DECIMAL,
      allowNull: false,
      defaultValue: 0.00,
    },
    reference_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    payment_mode: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'card',
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
  };
  return Transactions;
};
