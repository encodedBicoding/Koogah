'use strict'
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('MultipleDeliveries', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      type_of_dispatch: {
        type: Sequelize.ENUM('inter-state', 'intra-state', 'international'),
        defaultValue: 'intra-state',
      },
      master_delivery_key: {
        type: Sequelize.STRING,
      },
      pickup_address: {
        type: Sequelize.TEXT,
      },
      dispatcher_id: {
        type: Sequelize.BIGINT,
      },
      pending_dispatchers: {
        type: Sequelize.ARRAY(Sequelize.BIGINT),
      },
      customer_id: {
        type: Sequelize.BIGINT,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      status: {
        type: Sequelize.STRING,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    })
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('MultipleDeliveries')
  },
}
