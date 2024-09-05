import pool from '../../db/db.js';
import winston from 'winston';

const dir = './logging/';
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'image-src-service' },
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

const imageSrcUtil = async (name, imageSrc) => {
  try {
    const [result] = await pool.execute(
      `UPDATE playerInfo 
       SET imageSrc = ? 
       WHERE playerName = ?`,
      [imageSrc, name]
    );

    const message = `Updated imageSrc for player: ${name}`;
    console.log(message);
    logger.info(message);

    return { name, imageSrc };
  } catch (error) {
    const errorMessage = `Error updating imageSrc for player '${name}': ${error.message}`;
    console.error(errorMessage);
    logger.error(errorMessage);

    throw new Error(errorMessage);
  }
};

export default imageSrcUtil;
