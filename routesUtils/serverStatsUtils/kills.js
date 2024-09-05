import pool from '../../db/db.js';
import winston from 'winston';

const dir = './logging/';
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'kills-service' },
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

const killsUtil = async (name, kills) => {
  try {
    const query = `
      UPDATE playerInfo 
      SET totalKills = totalKills + ?, 
          totalKillsDaily = totalKillsDaily + ?, 
          totalKillsWeekly = totalKillsWeekly + ?, 
          totalKillsMonthly = totalKillsMonthly + ? 
      WHERE playerName = ?
    `;

    const values = [kills, kills, kills, kills, name];

    const [result] = await pool.execute(query, values);

    const message = `Updated kills for player: ${name}. Kills added: ${kills}`;
    console.log(message);
    logger.info(message);

    return { name, kills, result };
  } catch (error) {
    const errorMessage = `Error updating kills for player '${name}': ${error.message}`;
    console.error(errorMessage);
    logger.error(errorMessage);

    throw new Error(errorMessage);
  }
};

export default killsUtil;
