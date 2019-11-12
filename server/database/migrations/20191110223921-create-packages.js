
module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.createTable('Packages', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER,
    },
    customer_id: {
      type: Sequelize.INTEGER,
    },
    dispatcher_id: {
      type: Sequelize.INTEGER,
    },
    pending_dispatcher_id: {
      type: Sequelize.INTEGER,
    },
    weight: {
      type: Sequelize.STRING,
    },
    pending_weight: {
      type: Sequelize.STRING,
    },
    distance: {
      type: Sequelize.STRING,
    },
    type_of_dispatch: {
      type: Sequelize.ENUM('inter-state', 'intra-state', 'international'),
    },
    description: {
      type: Sequelize.TEXT,
    },
    from_state: {
      type: Sequelize.STRING,
    },
    to_state: {
      type: Sequelize.STRING,
    },
    from_town: {
      type: Sequelize.STRING,
    },
    to_town: {
      type: Sequelize.STRING,
    },
    from_country: {
      type: Sequelize.STRING,
    },
    to_country: {
      type: Sequelize.STRING,
    },
    pickup_address: {
      type: Sequelize.TEXT,
    },
    dropoff_address: {
      type: Sequelize.STRING,
    },
    status: {
      type: Sequelize.ENUM('picked-up', 'not-picked', 'delivered'),
    },
    pickup_time: {
      type: Sequelize.DATE,
    },
    dropoff_time: {
      type: Sequelize.DATE,
    },
    delivery_price: {
      type: Sequelize.DECIMAL(10, 2),
    },
    pending_delivery_price: {
      type: Sequelize.DECIMAL(10, 2),
    },
    package_id: {
      type: Sequelize.TEXT,
    },
    created_at: {
      allowNull: false,
      type: Sequelize.DATE,
    },
    updated_at: {
      allowNull: false,
      type: Sequelize.DATE,
    },
  }),
  down: (queryInterface) => queryInterface.dropTable('Packages'),
};
