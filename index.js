import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import http from 'http';

import serverStats from './routes/serverstats.js';
import aggregatedStats from './routes/aggregatedstats.js';
import repeatedRequests from './routes/repeatedRequests.js';
import dbInteractions from './routes/dbInteractions.js';

const basicAuthUsername =
  process.env.BASICAUTHUSERNAME ||
  (() => {
    new Error('Provide a basic auth username in env vars');
  });
const basicAuthPassword =
  process.env.BASICAUTHPASSWORD ||
  (() => {
    new Error('Provide a basic auth password in env vars');
  });
const port =
  process.env.PORT ||
  (() => {
    new Error('Provide a basic auth password in env vars');
  });

const users = {};
users[basicAuthUsername] = basicAuthPassword;

const app = express();

const httpServer = http.createServer(app);

httpServer.listen(port, () => {
  console.log(`App is running, server is listening on port ${port}`);
});

app.get('/', function (request, response) {
  const result = 'App is running';
  response.status(200).json({ status: result });
});

app.use(cors());
app.use(helmet());

app.use('/serverStats', serverStats);
app.use('/aggregatedStats', aggregatedStats);
app.use('/repeatedRequests', repeatedRequests);
app.use('/dbInteractions', dbInteractions);
