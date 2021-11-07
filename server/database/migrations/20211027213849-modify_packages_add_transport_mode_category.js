'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.describeTable('Packages').then(tableDefinition => {
      if (!tableDefinition['transport_mode_category']){
        return queryInterface.addColumn('Packages', 'transport_mode_category', {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: 'sm',
        });
      } else {
        return Promise.resolve(true);
      }
   });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn(
      'Packages',
      'transport_mode_category',
    );
  }
};
