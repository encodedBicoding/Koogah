'use strict';

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
        'Notifications',
        'entity_id',
        {
          type: Sequelize.STRING,
          allowNull: true
        }
      ),
      queryInterface.addColumn(
        'Notifications',
        'is_viewable',
        {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false
        }
      )
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
      queryInterface.removeColumn('Notifications', 'entity_id'),
      queryInterface.removeColumn('Notifications', 'is_viewable'),
    ])
  }
};
