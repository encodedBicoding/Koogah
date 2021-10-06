'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('Customers', 'promo_code', {
        type: Sequelize.STRING,
        allowNull: true,
      }),
      queryInterface.addColumn('Customers', 'promo_code_amount', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0.0
      }),
    ]);
  },

  down: (queryInterface, Sequelize) => {
      return Promise.all([
        queryInterface.removeColumn('Customers', 'promo_code'),
        queryInterface.removeColumn('Customers', 'promo_code_amount'),
      ])
  }
};
