'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all(
      [
        queryInterface.addColumn(
          'Couriers',
          'company_id',
          {
            type: Sequelize.INTEGER,
            allowNull: true,
          }
        ),
        queryInterface.addColumn(
          'Couriers',
          'is_cooperate',
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
        queryInterface.removeColumn('Couriers', 'company_id'),
        queryInterface.removeColumn('Couriers', 'is_cooperate'),
      ]);
  }
};
