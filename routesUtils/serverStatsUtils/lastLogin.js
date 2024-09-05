import pool from '../../db/db.js';
import moment from 'moment';
import winston from 'winston';

const dir = './logging/';
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'lastLogin-service' },
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

const lastLoginUtil = async (encodedNameToBeStored) => {
  const timestampForLastLogin = moment().format('YYYY-MM-DD HH:mm:ss');

  try {
    if (encodedNameToBeStored) {
      const name = decodeURIComponent(encodedNameToBeStored);

      const query = `
        UPDATE playerInfo 
        SET online = 0, 
            totalTime = totalTime + 0.25, 
            totalTimeDaily = totalTimeDaily + 0.25, 
            totalTimeWeekly = totalTimeWeekly + 0.25, 
            totalTimeMonthly = totalTimeMonthly + 0.25, 
            lastLogin = ? 
        WHERE playerName = ? 
        LIMIT 1;
      `;

      const values = [timestampForLastLogin, name];

      const [result] = await pool.execute(query, values);

      const message = `Player '${name}' logged out, time updated, last login set to ${timestampForLastLogin}`;
      console.log(message);
      logger.info(message);

      return {
        name,
        lastLogin: timestampForLastLogin,
        online: false,
        result,
      };
    } else {
      throw new Error('Name is empty in query params');
    }
  } catch (error) {
    const errorMessage = `Error updating last login for '${encodedNameToBeStored}': ${error.message}`;
    console.error(errorMessage);
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }
};

export default lastLoginUtil;
