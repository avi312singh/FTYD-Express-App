import pool from '../../db/db.js';
import winston from 'winston';

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

const resetDaily = async (chalk, keyword) => {
  try {
    // Execute the query to reset daily stats
    const [result] = await pool.execute(
      `UPDATE playerInfo SET totalKillsDaily = 0, totalPointsSpentDaily = 0, totalTimeDaily = 0 WHERE playerName IS NOT NULL`
    );

    // Log and print success message
    const message =
      'Reset totalKillsDaily, totalPointsSpentDaily, totalTimeDaily to 0';
    console.log(
      chalk.blue(
        `Reset totalKillsDaily, totalPointsSpentDaily, totalTimeDaily to ${chalk.whiteBright.underline(
          keyword('0')
        )}`
      )
    );
    logger.info(message);

    return message;
  } catch (error) {
    // Log the error and throw it
    logger.error(`Error resetting daily stats: ${error.message}`);
    console.error(error);
    throw new Error('Failed to reset daily stats.');
  }
};

export default resetDaily;
