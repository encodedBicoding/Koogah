'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.describeTable('Packages').then(tableDefinition => {
      if (!tableDefinition['value']){
        return queryInterface.addColumn('Packages', 'value', {
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
      'Packages',
      'value',
    );
  }
};
