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

// Function to add a delay (for retry logic)
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const truncateTables = async (retries = 3, delayMs = 1000) => {
  const queries = [
    'TRUNCATE playersComparisonFirst;',
    'TRUNCATE playersComparisonSecond;',
  ];

  for (const query of queries) {
    let attempts = 0;

    while (attempts < retries) {
      try {
        await pool.execute(query);
        const message = `Successfully truncated table with query: ${query}`;
        logger.info(message);
        break; // Break the loop on success
      } catch (error) {
        attempts++;

        const errorMessage = `Error truncating table with query: ${query} - Attempt ${attempts} of ${retries} - Error: ${error.message}`;
        logger.error(errorMessage);

        // If the error is `ECONNRESET` or a transient network error, retry
        if (error.code === 'ECONNRESET' && attempts < retries) {
          console.warn(
            `Retrying truncation after ECONNRESET. Waiting for ${delayMs}ms before retrying...`
          );
          await delay(delayMs); // Wait before retrying
          delayMs *= 2; // Exponential backoff
        } else {
          throw new Error(
            `Failed to truncate table after ${attempts} attempts: ${error.message}`
          );
        }
      }
    }
  }
};

export default truncateTables;
