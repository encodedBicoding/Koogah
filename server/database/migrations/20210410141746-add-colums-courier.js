'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.describeTable('Couriers').then(tableDefinition => {
      if (!tableDefinition['identification_number']){
          return queryInterface.addColumn('Couriers', 'identification_number', {
            type: Sequelize.STRING,
            allowNull: true,
          });
      } else {
          return Promise.resolve(true);
      }
  });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn(
      'Couriers',
      'identification_number',
    );
  }
};