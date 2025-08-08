import { Sequelize } from 'sequelize';
import { appConfig } from './AppConfig';

const dbConfig = appConfig.getDatabaseConfig();

const sequelize = new Sequelize({
  dialect: 'postgres',
  host: dbConfig.host,
  port: dbConfig.port,
  username: dbConfig.username,
  password: dbConfig.password,
  database: dbConfig.database,
  logging: appConfig.isDevelopment(),
});

export default sequelize;