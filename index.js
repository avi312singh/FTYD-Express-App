import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import http from 'http';
import nodemailer from 'nodemailer';

import serverStats from './routes/serverstats.js';
import aggregatedStats from './routes/aggregatedstats.js';
import repeatedRequests from './routes/repeatedRequests.js';
import dbInteractions from './routes/dbInteractions.js';

const gmailPassword =
  process.env.GMAILPASSWORD ||
  (() => {
    throw new Error('Provide a Gmail password in env vars');
  })();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'avi312singh@gmail.com',
    pass: gmailPassword,
  },
});

const port =
  process.env.PORT ||
  (() => {
    new Error('Provide a basic auth password in env vars');
  });

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

const sendErrorEmail = (subject, message) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: 'youremail@example.com', // Your email
    subject: subject,
    text: message,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.error('Error while sending email:', error);
    }
    console.log('Email sent:', info.response);
  });
};

// Catch uncaught exceptions and unhandled rejections
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  sendErrorEmail('Server Crashed', `The server crashed due to: ${err.message}`);
  process.exit(1); // Ensure the server exits after crash
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  sendErrorEmail('Server Crashed', `Unhandled rejection: ${reason}`);
  process.exit(1);
});

// You can also listen for an exit event
process.on('exit', (code) => {
  if (code !== 0) {
    sendErrorEmail('Server Crashed', `The server exited with code: ${code}`);
  }
});
