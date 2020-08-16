
module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.createTable('Packages', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.BIGINT,
    },
    customer_id: {
      type: Sequelize.BIGINT,
    },
    dispatcher_id: {
      type: Sequelize.BIGINT,
    },
    pending_dispatcher_id: {
      type: Sequelize.BIGINT,
    },
    weight: {
      type: Sequelize.STRING,
    },
    pending_weight: {
      type: Sequelize.STRING,
    },
    image_urls: {
      type: Sequelize.ARRAY(Sequelize.TEXT),
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
      type: Sequelize.TEXT,
    },
    dropoff_time: {
      type: Sequelize.TEXT,
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
    pickup_decline_cause: {
      type: Sequelize.TEXT
    },
    is_paid_for: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
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
