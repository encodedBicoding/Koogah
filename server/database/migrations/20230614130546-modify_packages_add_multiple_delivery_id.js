'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.createTable('users', { id: Sequelize.INTEGER });
    */
    return Promise.all([
      queryInterface.addColumn(
        'Packages', // table name
        'is_active', // new field name
        {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
        },
      ),

      queryInterface.addColumn(
        'Packages', // table name
        'multiple_delivery_id', // new field name
        {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
      ),
    ])
  },

  down: (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
    return Promise.all([
      queryInterface.removeColumn('Packages', 'is_active'),
      queryInterface.removeColumn('Packages', 'multiple_delivery_id'),
    ])
  },
}
