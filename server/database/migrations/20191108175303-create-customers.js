
module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.createTable('Customers', {
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
    business_name: {
      type: Sequelize.STRING,
    },
    has_business: {
      type: Sequelize.BOOLEAN,
    },
    is_courier: {
      type: Sequelize.BOOLEAN,
    },
    is_active: {
      type: Sequelize.BOOLEAN,
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
    verify_token: {
      type: Sequelize.TEXT,
    },
    mobile_number_one: {
      type: Sequelize.STRING,
    },
    mobile_number_two: {
      type: Sequelize.STRING,
    },
    verification_code: {
      type: Sequelize.STRING,
    },
    is_verified: {
      type: Sequelize.BOOLEAN,
    },
    profile_image: {
      type: Sequelize.TEXT,
    },
    address: {
      type: Sequelize.TEXT,
    },
    state: {
      type: Sequelize.STRING,
    },
    town: {
      type: Sequelize.STRING,
    },
    email: {
      type: Sequelize.STRING,
    },
    password: {
      type: Sequelize.STRING,
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
    created_at: {
      allowNull: false,
      type: Sequelize.DATE,
    },
    updated_at: {
      allowNull: false,
      type: Sequelize.DATE,
    },
  }),
  down: (queryInterface) => queryInterface.dropTable('Customers'),
};
