'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('CompanyAwaitings', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      first_name: {
        type: Sequelize.STRING
      },
      last_name: {
        type: Sequelize.STRING
      },
      nin: {
        type: Sequelize.STRING
      },
      user_email: {
        type: Sequelize.STRING
      },
      phone: {
        type: Sequelize.STRING
      },
      business_name: {
        type: Sequelize.STRING
      },
      business_country: {
        type: Sequelize.STRING
      },
      approval_link: {
        type: Sequelize.TEXT
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
    return queryInterface.dropTable('CompanyAwaitings');
  }
};