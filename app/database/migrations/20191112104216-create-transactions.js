
module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.createTable('Transactions', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.BIGINT,
    },
    customer_id: {
      type: Sequelize.INTEGER,
    },
    dispatcher_id: {
      type: Sequelize.INTEGER,
    },
    amount_paid: {
      type: Sequelize.DECIMAL(10, 2),
    },
    reason: {
      type: Sequelize.STRING,
    },
    fees: {
      type: Sequelize.DECIMAL(10, 2),
    },
    reference_id: {
      type: Sequelize.STRING,
    },
    payment_mode: {
      type: Sequelize.STRING,
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
  down: (queryInterface) => queryInterface.dropTable('Transactions'),
};
