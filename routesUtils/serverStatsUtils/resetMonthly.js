import pool from '../../db/db.js';
import winston from 'winston';

// Set up logging (could move this to a common utility file if necessary)
const dir = './logging/';
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'reset-monthly-service' },
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

const resetMonthly = async () => {
  try {
    // Execute the query to reset monthly stats
    const [result] = await pool.execute(`
      UPDATE playerInfo 
      SET totalKillsMonthly = 0, 
          totalPointsSpentMonthly = 0, 
          totalTimeMonthly = 0 
      WHERE playerName IS NOT NULL
    `);

    // Log success
    const message = 'Successfully reset monthly stats for all players.';
    console.log(message);
    logger.info(message);

    return result;
  } catch (error) {
    // Log error and re-throw
    const errorMessage = `Error resetting monthly data: ${error.message}`;
    console.error(errorMessage);
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }
};

export default resetMonthly;
