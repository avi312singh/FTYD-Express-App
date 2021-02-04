const express = require('express');
const router = express.Router();
const axios = require('axios');
const mysql = require('mysql');
const chalk = require('chalk');
const utf8 = require('utf8');
const moment = require('moment');
const _ = require('underscore');
const winston = require('winston');

let timestampForRequest;        // can be made const

const serverIp = process.env.SERVERIP || (() => { new Error("Provide a server IP in env vars") });
const endpoint = process.env.APIENDPOINT || (() => { new Error("Provide a api endpoint in env vars") });
const dbHost = process.env.DBENDPOINT || (() => { new Error("Provide a db endpoint in env vars") });
const dbPassword = process.env.DBPASSWORD || (() => { new Error("Provide a db password in env vars") });
const dbUsername = process.env.DBUSER || (() => { new Error("Provide a db username in env vars") });
const dbName = process.env.DBNAME || (() => { new Error("Provide a db username in env vars") });

const keyword = keyword => chalk.keyword('blue')(keyword)

const dir = './logging/'

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: { service: 'user-service' },
    transports: [
        new winston.transports.File({ filename: `${dir}logging.log`, level: 'info', maxsize: 7000 }),
        new winston.transports.File({ filename: `${dir}error.log`, level: 'error' }),
    ],
});

const pool = mysql.createPool({
    connectionLimit: 20,
    host: dbHost,
    user: dbUsername,
    password: dbPassword,
    database: dbName,
    dateStrings: ['DATE', 'DATETIME']
});

// middleware that is specific to this router
router.use(function timeLog(req, res, next) {
    timestampForRequest = moment().format('YYYY-MM-DD HH:mm:ss')
    logger.log({
        level: 'info',
        message: `'Request received at: ', ${timestampForRequest + ' from IP address: ' + req.headers['x-forwarded-for'] || req.connection.remoteAddress || null}`,
    });
    next()
})
// define the home page route
router.get('/', async (req, res) => {
    const timestamp = moment().format('YYYY-MM-DD HH:mm:ss')
    res.status(200).json({ message: "Seems to be ok.. ", timestamp })
})

router.get('/playerCount', async (req, res) => {
    const duration = req.query.duration ? req.query.duration : 288
pool.getConnection((err, connection) => {
            if (err) console.log(err);
            connection.query(`SELECT time, playerCount FROM sys.serverInfo ORDER BY time ASC limit ${duration};`, (err, result, fields) => {
                if (err) console.log(err);
                if (result) {
                    res.status(200).json({
                        duration,
                        response: result
                    })
                    console.log(chalk.blue('Query for ' + chalk.whiteBright.underline(duration) + " records", JSON.stringify(result, null, 4)))
                }
            });
    connection.release();
    if (err) throw err;
        });
})

// TODO: Do we need post for playerCount?

// router.post('/playerCount', async (req, res) => {
//     const duration = req.query.duration ? req.query.duration : 288
//     const connection = mysql.createConnection({
//         host: dbHost,
//         user: dbUsername,
//         password: dbPassword,
//         database: dbName
//     });
//     connection.connect((err) => {
//         if (err) console.log(err);
//         connection.query(`SELECT time, playerCount FROM sys.serverInfo limit ${duration};`, (err, result, fields) => {
//             if (err) console.log(err);
//             if (result) {
//                 res.status(200).json({
//                     duration,
//                     response: result
//                 })
//                 console.log(chalk.blue('Query for ' + chalk.whiteBright.underline(duration) + " records"))
//             }
//             if (fields) console.log(fields);
//         });
//         connection.end((err) => {
//             if (err)
//                 console.log("Error when closing connection", err)
//         });
//     });
// })

module.exports = router