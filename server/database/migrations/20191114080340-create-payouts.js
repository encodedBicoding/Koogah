
module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.createTable('Payouts', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER,
    },
    dispatcher_first_name: {
      type: Sequelize.STRING,
    },
    dispatcher_last_name: {
      type: Sequelize.STRING,
    },
    dispatcher_email: {
      type: Sequelize.STRING,
    },
    amount_requested: {
      type: Sequelize.DECIMAL(10, 2),
    },
    dispatcher_account_number: {
      type: Sequelize.STRING,
    },
    dispatcher_bank_name: {
      type: Sequelize.STRING,
    },
    status: {
      type: Sequelize.STRING,
    },
    reference_id: {
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
  down: (queryInterface) => queryInterface.dropTable('Payouts'),
};
