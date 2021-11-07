'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.describeTable('PushDevices').then(tableDefinition => {
      if (!tableDefinition['current_state_location']){
        return queryInterface.addColumn('PushDevices', 'current_state_location', {
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
      'PushDevices',
      'current_state_location',
    );
  }
};
