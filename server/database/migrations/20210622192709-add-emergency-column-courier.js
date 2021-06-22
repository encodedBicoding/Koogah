'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn(
        'Couriers',
        'emergency_contact_one_name',
        {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: ''
        }
      ),
      queryInterface.addColumn(
        'Couriers',
        'emergency_contact_one_phone',
        {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: ''
        }
      ),
      queryInterface.addColumn(
        'Couriers',
        'emergency_contact_two_name',
        {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: ''
        }
      ),
      queryInterface.addColumn(
        'Couriers',
        'emergency_contact_two_phone',
        {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: ''
        }
      )
    ])
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn(
        'Couriers',
        'emergency_contact_one_name',
      ),
      queryInterface.removeColumn(
        'Couriers',
        'emergency_contact_one_phone',
      ),
      queryInterface.removeColumn(
        'Couriers',
        'emergency_contact_two_name',
      ),
      queryInterface.removeColumn(
        'Couriers',
        'emergency_contact_two_phone',
      )
    ]);
  }
};