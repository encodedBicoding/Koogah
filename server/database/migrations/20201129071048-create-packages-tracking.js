'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('PackagesTrackings', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      package_id: {
        type: Sequelize.TEXT
      },
      customer_id: {
        type: Sequelize.BIGINT
      },
      dispatcher_id: {
        type: Sequelize.BIGINT
      },
      dispatcher_lat: {
        type: Sequelize.DECIMAL
      },
      dispatcher_lng: {
        type: Sequelize.DECIMAL
      },
      destination_lat: {
        type: Sequelize.DECIMAL
      },
      destination_lng: {
        type: Sequelize.DECIMAL
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('PackagesTrackings');
  }
};