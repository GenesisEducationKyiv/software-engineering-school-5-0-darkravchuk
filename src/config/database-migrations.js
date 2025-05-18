require('dotenv').config();

module.exports = {
    development: {
        username: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'qwerty',
        database: process.env.DB_NAME || 'weather_db',
        host: process.env.DB_HOST || 'db',
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: false,
    },
};