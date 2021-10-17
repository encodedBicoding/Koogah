'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
      return queryInterface.describeTable('Packages').then(tableDefinition => {
        if (!tableDefinition['is_express_delivery']){
          return queryInterface.addColumn('Packages', 'is_express_delivery', {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
          });
        } else {
          return Promise.resolve(true);
        }
     });
    
  },

  down: (queryInterface, Sequelize) => {
      return queryInterface.removeColumn(
        'Packages',
        'is_express_delivery',
      );
  }
};
