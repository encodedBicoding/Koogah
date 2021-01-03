'use strict';
module.exports = (sequelize, DataTypes) => {
  const TransactionHistory = sequelize.define('TransactionHistory', {
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    image_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false
    },
    user_type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    transaction_id: {
      type: DataTypes.STRING,
      allowNull: false
    },
    user_id: {
      type: DataTypes.STRING,
      allowNull: false
    }
  },
    {
    underscored: true,
    tableName: 'TransactionHistory',
    timestamps: true,
  });
  TransactionHistory.associate = function(models) {
    // associations can be defined here
    TransactionHistory.belongsTo(models.Transactions, {
      foreignKey: 'transaction_id',
    });

  };
  return TransactionHistory;
};