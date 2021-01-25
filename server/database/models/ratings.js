'use strict';
module.exports = (sequelize, DataTypes) => {
  const Ratings = sequelize.define('Ratings', {
    package_id: DataTypes.TEXT,
    rate_value: DataTypes.INTEGER,
    user_type: DataTypes.STRING,
    customer_id: DataTypes.BIGINT,
    dispatcher_id: DataTypes.BIGINT
  }, {
    underscored: true,
    tableName: 'Ratings',
    timestamps: true,
  });
  Ratings.associate = function(models) {
    // associations can be defined here
  };
  return Ratings;
};