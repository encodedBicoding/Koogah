/* eslint-disable no-unused-vars */
module.exports = (sequelize, DataTypes) => {
  const Reports = sequelize.define('Reports', {
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    first_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    report: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    reporter_email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    reported_by: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    reporter_type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    underscored: true,
    tableName: 'Reports',
    timestamps: true,
  });
  Reports.associate = function (models) {
    // associations can be defined here
  };
  return Reports;
};
