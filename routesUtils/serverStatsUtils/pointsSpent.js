import pool from '../../db/db.js';
import winston from 'winston';

const dir = './logging/';
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'pointsSpent-service' },
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

const pointsSpentUtil = async (encodedName, pointsSpent) => {
  try {
    const name = decodeURIComponent(encodedName);

    const query = `
      UPDATE playerInfo 
      SET totalPointsSpent = totalPointsSpent + ?, 
          totalPointsSpentDaily = totalPointsSpentDaily + ?, 
          totalPointsSpentWeekly = totalPointsSpentWeekly + ?, 
          totalPointsSpentMonthly = totalPointsSpentMonthly + ? 
      WHERE playerName = ? 
      LIMIT 1;
    `;

    const values = [pointsSpent, pointsSpent, pointsSpent, pointsSpent, name];

    const [result] = await pool.execute(query, values);

    const message = `Player '${name}' spent ${pointsSpent} points.`;
    console.log(message);
    logger.info(message);

    return { name, pointsSpent, result };
  } catch (error) {
    const errorMessage = `Error updating points spent for '${encodedName}': ${error.message}`;
    console.error(errorMessage);
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }
};

export default pointsSpentUtil;
