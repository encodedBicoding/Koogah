'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all(
      [
        queryInterface.addColumn(
          'Couriers',
          'owns_automobile',
          {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
          }
        ),
        queryInterface.addColumn(
          'Couriers',
          'done_dispatch_before',
          {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
          }
        ),
      ]
    );
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('Couriers', 'owns_automobile'),
      queryInterface.removeColumn('Couriers', 'done_dispatch_before'),
    ]);
  }
};
