import pool from '../../db/db.js';
import winston from 'winston';

// Set up logging
const dir = './logging/';
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'reset-weekly-service' },
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

const resetWeekly = async () => {
  try {
    // Execute the query to reset weekly stats
    const [result] = await pool.execute(`
      UPDATE playerInfo 
      SET totalKillsWeekly = 0, 
          totalPointsSpentWeekly = 0, 
          totalTimeWeekly = 0 
      WHERE playerName IS NOT NULL
    `);

    // Log success message
    const message = 'Successfully reset weekly stats for all players.';
    console.log(message);
    logger.info(message);

    return result;
  } catch (error) {
    // Log and throw error
    const errorMessage = `Error resetting weekly data: ${error.message}`;
    console.error(errorMessage);
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }
};

export default resetWeekly;
