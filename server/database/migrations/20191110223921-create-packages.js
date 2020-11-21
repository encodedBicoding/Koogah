
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
    pending_dispatchers: {
      type: Sequelize.ARRAY(Sequelize.BIGINT),
    },
    is_currently_tracking: {
      type: Sequelize.BOOLEAN
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
    nearest_busstop: {
      type: Sequelize.TEXT,
    },
    landmark: {
      type: Sequelize.TEXT,
    },
    status: {
      type: Sequelize.STRING,
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
    payment_mode: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    delivery_key: {
      type: Sequelize.STRING,
      allowNull: false
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
