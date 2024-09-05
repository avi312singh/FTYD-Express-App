import pool from '../../db/db.js';
import winston from 'winston';

// Set up logging
const dir = './logging/';
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'temporary-data-service' },
  transports: [
    new winston.transports.File({
      filename: `${dir}logging.log`,
      level: 'info',
      maxsize: 7000,
    }),
    new winston.transports.File({
      filename: `${dir}error.log`,
      level: 'error',
    }),
  ],
});

const temporaryDataUtil = async (
  name,
  time,
  score,
  tableName,
  recognisedTables
) => {
  try {
    logger.info(`Attempting to insert data into ${tableName}`);
    if (!recognisedTables.includes(tableName)) {
      throw new Error(`Table '${tableName}' is not recognised.`);
    }

    const queryStr = `INSERT INTO \`${tableName}\` (name, time, score) VALUES (?, ?, ?)`;

    const [result] = await pool.execute(queryStr, [
      decodeURIComponent(name),
      time,
      score,
    ]);

    logger.info(`Successfully inserted data into ${tableName}`);
    return { name, time, score, tableName };
  } catch (error) {
    logger.error(`Error inserting data into ${tableName}: ${error.message}`);
    throw error;
  }
};

export default temporaryDataUtil;
