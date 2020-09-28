/* eslint-disable func-names */
/* eslint-disable no-unused-vars */

module.exports = (sequelize, DataTypes) => {
  const Awaiting = sequelize.define('Awaitings', {
    first_name: DataTypes.STRING,
    last_name: DataTypes.STRING,
    bvn: DataTypes.STRING,
    user_email: DataTypes.STRING,
    mobile_number: DataTypes.STRING,
    sex: DataTypes.STRING,
    approval_link: DataTypes.TEXT,
  }, {
    underscored: true,
    tableName: 'Awaitings',
    timestamps: true,
  });
  Awaiting.associate = function (models) {
    // associations can be defined here
  };
  return Awaiting;
};
