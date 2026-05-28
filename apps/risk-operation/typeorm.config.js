const { DataSource } = require('typeorm');
require('dotenv').config();

const ISDEVELOPMENT = process.env.NODE_ENV === 'development';

const entities = ISDEVELOPMENT
  ? [__dirname + '/src/models/**/*.entity.ts']
  : undefined;
const migrations = ISDEVELOPMENT
  ? [__dirname + '/migrations/**/*.ts']
  : [__dirname + '/migrations/**/*.js'];
const dataSourceOptions = {
  type: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT),
  database: "risk-operation",
  username: process.env.POSTGRES_USERNAME,
  password: process.env.POSTGRES_PASSWORD,
  entities,
  migrations,
};

const dataSource = new DataSource(dataSourceOptions);

module.exports = dataSource;
