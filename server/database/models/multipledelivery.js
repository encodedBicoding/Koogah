'use strict'
module.exports = (sequelize, DataTypes) => {
  const MultipleDelivery = sequelize.define(
    'MultipleDeliveries',
    {
      type_of_dispatch: {
        type: DataTypes.ENUM('inter-state', 'intra-state', 'international'),
        allowNull: false,
        defaultValue: 'intra-state',
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      customer_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      dispatcher_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        defaultValue: null,
      },
      pending_dispatchers: {
        type: DataTypes.ARRAY(DataTypes.BIGINT),
        allowNull: true,
        defaultValue: [],
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'not-picked',
      },
    },
    {
      underscored: true,
      tableName: 'MultipleDeliveries',
      timestamps: true,
    },
  )
  MultipleDelivery.associate = function (models) {
    // associations can be defined here
    MultipleDelivery.hasMany(models.Packages, {
      onDelete: 'CASCADE',
    })
  }
  return MultipleDelivery
}
