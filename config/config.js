require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DEV_DB_USERNAME,
    password: process.env.DEV_DB_PASSWORD,
    database: process.env.DEV_DB_NAME,
    host: process.env.DEV_DB_HOST,
    dialect: process.env.DB_DIALECT,
    logging: false,
  },
  test: {
    username: process.env.TEST_DB_USERNAME,
    password: process.env.TEST_DB_PASSWORD,
    database: process.env.TEXT_DB_NAME,
    host: process.env.TEST_DB_HOST,
    dialect: process.env.DB_DIALECT,
    logging: false,
  },
  production: {
    use_env_variable: 'DATABASE_URL',
    dialect: process.env.DB_DIALECT,
    logging: false,
  },
};
