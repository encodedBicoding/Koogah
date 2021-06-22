'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.describeTable('Couriers').then(tableDefinition => {
      if (!tableDefinition['emergency_contact_two_phone']){
          return queryInterface.addColumn('Couriers', 'emergency_contact_two_phone', {
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
      'emergency_contact_two_phone',
    );
  }
};