import pool from '../../db/db.js';
import winston from 'winston';

// Set up logging
const dir = './logging/';
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'server-info-service' },
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

const serverInfoUtil = async (
  playerCountToBeStored = 0,
  botCountToBeStored = 0,
  serverNameToBeStored = 'Not Online',
  mapNameToBeStored = 'Not Online'
) => {
  try {
    const query = `
      INSERT INTO serverInfo (playerCount, botCount, serverName, mapName) 
      VALUES (?, ?, ?, ?)
    `;

    const values = [
      playerCountToBeStored,
      botCountToBeStored,
      serverNameToBeStored,
      mapNameToBeStored,
    ];

    const [result] = await pool.execute(query, values);

    // Log success message
    const message = `Inserted server info with playerCount: ${playerCountToBeStored}, botCount: ${botCountToBeStored}, serverName: ${serverNameToBeStored}, mapName: ${mapNameToBeStored}`;
    console.log(message);
    logger.info(message);

    return {
      playerCount: playerCountToBeStored,
      botCount: botCountToBeStored,
      serverName: serverNameToBeStored,
      mapName: mapNameToBeStored,
    };
  } catch (error) {
    // Log and throw error
    const errorMessage = `Error inserting server info: ${error.message}`;
    console.error(errorMessage);
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }
};

export default serverInfoUtil;
