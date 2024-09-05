import pool from '../../db/db.js';
import winston from 'winston';

const dir = './logging/';
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'truncate-tables-service' },
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

const truncateTables = async () => {
  try {
    const queries = [
      'TRUNCATE playersComparisonFirst;',
      'TRUNCATE playersComparisonSecond;',
    ];

    for (const query of queries) {
      await pool.execute(query);
      const message = `Successfully truncated table with query: ${query}`;
      logger.info(message);
    }
  } catch (error) {
    const errorMessage = `Error truncating tables: ${error.message}`;
    console.error(errorMessage);
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }
};

export default truncateTables;
