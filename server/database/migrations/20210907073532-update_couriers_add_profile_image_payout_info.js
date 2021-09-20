'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all(
      [
        queryInterface.addColumn(
          'Companies',
          'profile_image',
          {
            type: Sequelize.TEXT,
            allowNull: true,
          }
        ),
        queryInterface.addColumn(
          'Companies',
          'total_payouts',
          {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.00,
          }
        ),
        queryInterface.addColumn(
          'Companies',
          'last_payout',
          {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.00,
          }
        ),
      ]
    );
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('Companies', 'profile_image'),
      queryInterface.removeColumn('Companies', 'total_payouts'),
      queryInterface.removeColumn('Companies', 'last_payout'),
    ]);
  }
};
