module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.createTable('Notifications', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER,
    },
    email: {
      type: Sequelize.STRING,
    },
    type: {
      type: Sequelize.STRING,
    },
    message: {
      type: Sequelize.TEXT,
    },
    title: {
      type: Sequelize.STRING,
    },
    action_link: {
      type: Sequelize.TEXT,
    },
    is_read: {
      type: Sequelize.BOOLEAN,
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
  down: (queryInterface) => queryInterface.dropTable('Notifications'),
};
