import express from 'express';
import moment from 'moment';
import winston from 'winston';
import allRowsUtil from '../routesUtils/dbInteractionsUtils/allRows.js';
import resetDailyUtil from '../routesUtils/dbInteractionsUtils/resetDaily.js';
import chalk from 'chalk';

const router = express.Router();

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

router.use(function timeLog(req, res, next) {
  const timestampForRequest = moment().format('YYYY-MM-DD HH:mm:ss');
  logger.log({
    level: 'info',
    message: `Request received at: ${timestampForRequest} + ' from IP address: ' + ${
      req.headers['x-forwarded-for'] || req.connection.remoteAddress || null
    }`,
  });
  next();
});

const recognisedTableNames = [
  'aggregatedInfo',
  'playerInfo',
  'playersComparisonFirst',
  'playersComparisonSecond',
  'serverInfo',
];

router.get('/resetDaily', async (req, res) => {
  resetDailyUtil(chalk, keyword)
    .then((result) => {
      res.status(200).json({ message: result });
      console.log(
        chalk.blue(
          'Reset totalKillsDaily, totalPointsSpentDaily, totalTimeDaily to ' +
            chalk.whiteBright.underline(keyword('0')) +
            ' for /resetDaily GET'
        )
      );
    })
    .catch((result) => {
      console.log(chalk.red(result));
      res.status(400).json({ message: result });
    });
});

router.get('/allRows', async (req, res) => {
  allRowsUtil(req.query.tableName, recognisedTableNames)
    .then((result) => {
      res.status(200).json({ result });
      console.log(
        chalk.blue(
          'Successfully got all data from ' +
            chalk.whiteBright.underline(keyword(req.query.tableName)) +
            ' for /allRows GET'
        )
      );
    })
    .catch((result) => {
      console.log(chalk.red(result));
      res.status(400).json({ message: result });
    });
});

export default router;
