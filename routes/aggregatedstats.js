import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mysql from 'mysql2/promise';
import chalk from 'chalk';
import moment from 'moment';
import winston from 'winston';

import playerCountUtil from '../routesUtils/aggregatedStatsUtils/playerCount.js';
import killCountUtil from '../routesUtils/aggregatedStatsUtils/killCount.js';
import durationUtil from '../routesUtils/aggregatedStatsUtils/duration.js';
import topPlayersUtil from '../routesUtils/aggregatedStatsUtils/topPlayers.js';
import pageCountUtil from '../routesUtils/aggregatedStatsUtils/pageCount.js';
import pageCountPutUtil from '../routesUtils/aggregatedStatsUtils/pageCountPut.js';

const router = express.Router();

const dbHost =
  process.env.DBENDPOINT ||
  (() => {
    throw new Error('Provide a db endpoint in env vars');
  })();
const dbPassword =
  process.env.DBPASSWORD ||
  (() => {
    throw new Error('Provide a db password in env vars');
  })();
const dbUsername =
  process.env.DBUSER ||
  (() => {
    throw new Error('Provide a db username in env vars');
  })();
const dbName =
  process.env.DBNAME ||
  (() => {
    throw new Error('Provide a db name in env vars');
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

const pool = mysql.createPool({
  connectionLimit: 40,
  host: dbHost,
  user: dbUsername,
  password: dbPassword,
  database: dbName,
  waitForConnections: true,
  queueLimit: 0,
  dateStrings: ['DATE', 'DATETIME'],
});

// Middleware that is specific to this router
router.use(function timeLog(req, res, next) {
  const timestampForRequest = moment().format('YYYY-MM-DD HH:mm:ss');
  logger.log({
    level: 'info',
    message: `'Request received at: ', ${
      timestampForRequest +
        ' from IP address: ' +
        req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress ||
      null
    }`,
  });
  next();
});

// Define the home page route
router.get('/', async (req, res) => {
  const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
  res.status(200).json({ message: 'Seems to be ok.. ', timestamp });
});

router.get('/playerCount', async (req, res) => {
  playerCountUtil(req.query.duration, pool)
    .then((result) => {
      res.status(200).json({ result });
      console.log(
        chalk.blue(
          'Completed query for ' +
            chalk.whiteBright.underline(result.duration) +
            ' records at aggregatedstats/playerCount GET'
        )
      );
    })
    .catch((result) => {
      console.log(chalk.red(result));
      res.status(400).json({ message: result });
    });
});

router.get('/killCount', async (req, res) => {
  killCountUtil(req.query.duration, pool)
    .then((result) => {
      res.status(200).json({ result });
      console.log(
        chalk.blue(
          'Completed query for ' +
            chalk.whiteBright.underline(result.duration) +
            ' records at aggregatedstats/killCount GET'
        )
      );
    })
    .catch((result) => {
      console.log(chalk.red(result));
      res.status(400).json({ message: result });
    });
});

router.get('/duration', async (req, res) => {
  durationUtil(req.query.duration, pool)
    .then((result) => {
      res.status(200).json({ result });
      console.log(
        chalk.blue(
          'Completed query for ' +
            chalk.whiteBright.underline(result.duration) +
            ' records at aggregatedstats/duration GET'
        )
      );
    })
    .catch((result) => {
      console.log(chalk.red(result));
      res.status(400).json({ message: result });
    });
});

router.get('/topPlayers', async (req, res) => {
  topPlayersUtil(req.query.duration, pool)
    .then((result) => {
      res.status(200).json({ result });
      console.log(
        chalk.blue(
          'Completed query for ' +
            chalk.whiteBright.underline(result.duration) +
            ' records at aggregatedstats/topPlayers GET'
        )
      );
    })
    .catch((result) => {
      console.log(chalk.red(result));
      res.status(400).json({ message: result });
    });
});

router.get('/pageCount', async (req, res) => {
  pageCountUtil(req.query.page, pool)
    .then((result) => {
      res.status(200).json({ result });
      console.log(
        chalk.blue(
          'Got page count for ' +
            chalk.whiteBright.underline(result.page) +
            ' at aggregatedstats/pageCount GET'
        )
      );
    })
    .catch((result) => {
      console.log(chalk.red(result));
      res.status(400).json({ message: result });
    });
});

router.put('/pageCount', async (req, res) => {
  pageCountPutUtil(req.query.page, pool)
    .then((result) => {
      res.status(200).json({
        message: `Incremented page count for ${result.page} at aggregatedstats/pageCount PUT`,
      });
      console.log(
        chalk.blue(
          'Incremented page count for ' +
            chalk.whiteBright.underline(result.page) +
            ' at aggregatedstats/pageCount PUT'
        )
      );
    })
    .catch((result) => {
      console.log(chalk.red(result));
      res.status(400).json({ message: result });
    });
});

export default router;
