import pool from '../../db/db.js';
import winston from 'winston';

// Set up logging (could move this to a common utility file if necessary)
const dir = './logging/';
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'reset-daily-service' },
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

const resetDaily = async () => {
  try {
    // Execute the reset query
    const [result] = await pool.execute(
      `UPDATE playerInfo 
       SET totalKillsDaily = 0, 
           totalPointsSpentDaily = 0, 
           totalTimeDaily = 0 
       WHERE playerName IS NOT NULL`
    );

    // Logging the success message
    const message = 'Successfully reset total daily stats for all players.';
    console.log(message);
    logger.info(message);

    return result; // Return result of the query
  } catch (error) {
    const errorMessage = `Error resetting daily stats: ${error.message}`;
    console.error(errorMessage);
    logger.error(errorMessage);
    throw new Error(errorMessage); // Re-throw to handle elsewhere
  }
};

export default resetDaily;
