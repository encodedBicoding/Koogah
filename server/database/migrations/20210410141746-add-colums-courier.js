'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'Couriers',
      'identification_number',
      {
        type: Sequelize.STRING,
        allowNull: true,
      }
    );
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn(
      'Couriers',
      'identification_number',
    );
  }
};