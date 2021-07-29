'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn(
        'Packages',
        'receiver_contact_phone',
        {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: ''
        }
      ),
      queryInterface.addColumn(
        'Packages',
        'receiver_contact_fullname',
        {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: ''
        }
      ),
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('Packages', 'receiver_contact_phone'),
      queryInterface.removeColumn('Packages', 'receiver_contact_fullname'),
    ]);
  }
};
