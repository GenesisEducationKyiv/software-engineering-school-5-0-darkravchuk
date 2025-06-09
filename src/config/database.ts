import { Sequelize } from 'sequelize';
import 'dotenv/config';

const sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'qwerty',
    database: process.env.DB_NAME || 'weather_db',
    logging: false,
});

export default sequelize;