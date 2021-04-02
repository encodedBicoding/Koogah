'use strict';
module.exports = (sequelize, DataTypes) => {
  const HistoryTransaction = sequelize.define('HistoryTransactions', {
    user_id: DataTypes.BIGINT,
    type: DataTypes.STRING,
    amount: DataTypes.DECIMAL(10,2),
    title: DataTypes.STRING,
    description: DataTypes.STRING,
    user_type: DataTypes.STRING,
    transaction_id: DataTypes.BIGINT,
    image_url: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    }
  }, {
    underscored: true,
    tableName: 'HistoryTransactions',
    timestamps: true,
  });
  HistoryTransaction.associate = function(models) {
    // associations can be defined here
  };
  return HistoryTransaction;
};