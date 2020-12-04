'use strict';
module.exports = (sequelize, DataTypes) => {
  const PackagesTracking = sequelize.define('PackagesTrackings', {
    package_id: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    customer_id: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    dispatcher_id: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    dispatcher_lat: {
      type: DataTypes.DECIMAL,
      allowNull: false
    },
    dispatcher_lng: {
      type: DataTypes.DECIMAL,
      allowNull: false
    },
    destination_lat: {
      type: DataTypes.DECIMAL,
      allowNull: false,
    },
    destination_lng: {
      type: DataTypes.DECIMAL,
      allowNull: false,
    }
  }, 
  {
    underscored: true,
    tableName: 'PackagesTrackings',
    timestamps: true,
  });
  PackagesTracking.associate = function(models) {
    // associations can be defined here
  };
  return PackagesTracking;
};