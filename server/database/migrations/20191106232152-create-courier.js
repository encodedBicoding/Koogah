
module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.createTable('Couriers', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.BIGINT,
    },
    first_name: {
      type: Sequelize.STRING,
    },
    last_name: {
      type: Sequelize.STRING,
    },
    email: {
      type: Sequelize.STRING,
    },
    password: {
      type: Sequelize.STRING,
    },
    mobile_number: {
      type: Sequelize.STRING,
    },
    state: {
      type: Sequelize.STRING,
    },
    town: {
      type: Sequelize.STRING,
    },
    address: {
      type: Sequelize.TEXT,
    },
    nationality: {
      type: Sequelize.STRING,
    },
    sex: {
      type: Sequelize.STRING,
    },
    bvn: {
      type: Sequelize.STRING,
    },
    profile_image: {
      type: Sequelize.TEXT,
    },
    virtual_balance: {
      type: Sequelize.DECIMAL(10, 2),
    },
    rating: {
      type: Sequelize.DECIMAL(10, 1),
    },
    no_of_raters: {
      type: Sequelize.BIGINT,
    },
    pickups: {
      type: Sequelize.BIGINT,
    },
    deliveries: {
      type: Sequelize.BIGINT,
    },
    pending: {
      type: Sequelize.INTEGER,
    },
    is_verified: {
      type: Sequelize.BOOLEAN,
    },
    verify_token: {
      type: Sequelize.TEXT,
    },
    verification_code: {
      type: Sequelize.STRING,
    },
    is_active: {
      type: Sequelize.BOOLEAN,
    },
    account_number: {
      type: Sequelize.STRING,
    },
    bank_name: {
      type: Sequelize.STRING,
    },
    last_payout: {
      type: Sequelize.DECIMAL(10, 2),
    },
    total_payouts: {
      type: Sequelize.DECIMAL(10, 2),
    },
    approval_code: {
      type: Sequelize.TEXT,
    },
    is_approved: {
      type: Sequelize.BOOLEAN,
    },
    is_courier: {
      type: Sequelize.BOOLEAN,
    },
    is_admin: {
      type: Sequelize.BOOLEAN,
    },
    referal_id: {
      type: Sequelize.STRING,
    },
    refered_by: {
      type: Sequelize.STRING,
    },
    ws_connected_channels: {
      type: Sequelize.ARRAY(Sequelize.STRING)
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
  down: (queryInterface) => queryInterface.dropTable('Couriers'),
};
