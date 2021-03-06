'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.describeTable('Couriers').then(tableDefinition => {
      if (!tableDefinition['emergency_contact_one_name']){
          return queryInterface.addColumn('Couriers', 'emergency_contact_one_name', {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: ''
          });
      } else {
          return Promise.resolve(true);
      }
  });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn(
      'Couriers',
      'emergency_contact_one_name',
    );
  }
};