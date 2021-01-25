'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Ratings', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      package_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      rate_value: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      user_type: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      customer_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      dispatcher_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
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
    return queryInterface.dropTable('Ratings');
  }
};