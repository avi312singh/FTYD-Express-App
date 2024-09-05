import express from 'express';
import chalk from 'chalk';
import moment from 'moment';
import winston from 'winston';
import pool from '../db/db.js'; // Updated to include file extension for import

import lastLoginUtil from '../routesUtils/serverStatsUtils/lastLogin.js';
import killsUtil from '../routesUtils/serverStatsUtils/kills.js';
import pointsSpentUtil from '../routesUtils/serverStatsUtils/pointsSpent.js';
import imageSrcUtil from '../routesUtils/serverStatsUtils/imageSrc.js';
import serverStatsUtil from '../routesUtils/serverStatsUtils/serverStats.js';
import temporaryDataUtil from '../routesUtils/serverStatsUtils/temporaryData.js';

const router = express.Router();

const serverIp =
  process.env.SERVERIP ||
  (() => {
    throw new Error('Provide a server IP in env vars');
  })();

const dir = './logging/';
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'user-service' },
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

const keyword = (keyword) => chalk.hex('blue')(keyword);

router.use((req, res, next) => {
  const timestampForRequest = moment().format('YYYY-MM-DD HH:mm:ss');
  logger.log({
    level: 'info',
    message: `Request received at: ${timestampForRequest} from IP: ${
      req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress ||
      'unknown'
    }`,
  });
  next();
});

router.get('/', async (req, res) => {
  try {
    const currentMapName = 'aocffa-ftyd_5_6_4';
    const currentServerName = '*** falltoyourdeathserver.com FTYD 24/7 ***';
    const response = await serverStatsUtil(
      currentMapName,
      currentServerName,
      serverIp
    );
    res.status(200).json({ response });
  } catch (error) {
    res
      .status(500)
      .json({ error: 'An error occurred while fetching server stats.' });
  }
});

router.post('/', async (req, res) => {
  const { name } = req.query;

  if (!name) {
    return res.status(400).json({ error: 'Name parameter is required' });
  }

  const decodedName = decodeURIComponent(name);
  let connection;

  try {
    connection = await pool.getConnection();
    console.log(`Attempting to insert/update player: ${decodedName}`);

    const query = `
      INSERT INTO playerInfo (playerName, online) 
      VALUES (?, 1) 
      ON DUPLICATE KEY UPDATE 
        totalTime = totalTime + 0.25, 
        totalTimeDaily = totalTimeDaily + 0.25, 
        totalTimeWeekly = totalTimeWeekly + 0.25, 
        totalTimeMonthly = totalTimeMonthly + 0.25
    `;

    console.log('Executing query:', query);
    const [result] = await connection.execute(query, [decodedName]);
    console.log('Query Result:', result); // Log the result to check if it runs successfully

    if (result.affectedRows > 0) {
      logger.log('info', `Player ${decodedName} added/updated successfully.`);
      res
        .status(201)
        .json({ message: `Player ${decodedName} added/updated successfully.` });
    } else {
      throw new Error(`Failed to insert/update player ${decodedName}`);
    }
  } catch (error) {
    logger.error(
      `Error adding/updating player ${decodedName}: ${error.message}`
    );
    console.error('Database Error:', error); // Log the error for debugging
    res.status(500).json({ error: 'Database error: ' + error.message });
  } finally {
    if (connection) connection.release();
  }
});

router.post('/imageSrc', async (req, res) => {
  const { name, imageSrc } = req.query;
  try {
    const result = await imageSrcUtil(name, imageSrc);
    res.status(201).json(result);
    logger.log('info', `Image source for ${name} updated.`);
  } catch (error) {
    res.status(500).json({ error: 'Image update failed' });
  }
});

router.post('/lastLogin', async (req, res) => {
  const { name } = req.query;
  try {
    const result = await lastLoginUtil(name);
    res.status(201).json(result);
    logger.log('info', `${name} last login updated.`);
  } catch (error) {
    res.status(500).json({ error: 'Last login update failed' });
  }
});

router.post('/kills', async (req, res) => {
  const { name, kills } = req.query;
  try {
    const result = await killsUtil(name, kills);
    res.status(201).json(result);
    logger.log('info', `${name} kill count updated.`);
  } catch (error) {
    res.status(500).json({ error: 'Kill count update failed' });
  }
});

router.post('/pointsSpent', async (req, res) => {
  const { name, pointsSpent } = req.query;
  try {
    const result = await pointsSpentUtil(name, pointsSpent);
    res.status(201).json(result);
    logger.log('info', `${name} points spent updated.`);
  } catch (error) {
    res.status(500).json({ error: 'Points spent update failed' });
  }
});

router.post('/temporaryData', async (req, res) => {
  const { name, time, score, tableName } = req.query;
  const recognisedTemporaryTableNames = [
    'playersComparisonFirst',
    'playersComparisonSecond',
  ];
  try {
    const result = await temporaryDataUtil(
      name,
      time,
      score,
      tableName,
      recognisedTemporaryTableNames
    );
    res
      .status(201)
      .json({ message: `Created temporary player inside ${result.tableName}` });
    logger.log(
      'info',
      `${name} added to ${result.tableName} with time ${time} and score ${score}`
    );
  } catch (error) {
    res.status(500).json({ error: 'Temporary data insertion failed' });
  }
});

export default router;
