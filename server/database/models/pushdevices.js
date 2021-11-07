'use strict';
module.exports = (sequelize, DataTypes) => {
  const PushDevices = sequelize.define('PushDevices', {
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    user_type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    token: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    platform: {
      type: DataTypes.STRING,
      allowNull: false
    },
    current_state_location: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
    {
    underscored: true,
    tableName: 'PushDevices',
    timestamps: true,
  });
  PushDevices.associate = function(models) {
    // associations can be defined here
  };
  return PushDevices;
};