import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function setupTables() {
  const connection = await mysql.createConnection({
    host: process.env.DBENDPOINT,
    user: process.env.DBUSER,
    password: process.env.DBPASSWORD,
    database: process.env.DBNAME,
    port: process.env.DBPORT,
  });

  const createTableQueries = [
    `
    CREATE TABLE IF NOT EXISTS playerInfo (
      id INT AUTO_INCREMENT PRIMARY KEY,
      playerName VARCHAR(255) NOT NULL,
      totalKills INT DEFAULT 0,
      totalKillsDaily INT DEFAULT 0,
      totalKillsWeekly INT DEFAULT 0,
      totalKillsMonthly INT DEFAULT 0,
      totalPointsSpent INT DEFAULT 0,
      totalPointsSpentDaily INT DEFAULT 0,
      totalPointsSpentWeekly INT DEFAULT 0,
      totalPointsSpentMonthly INT DEFAULT 0,
      online BOOLEAN DEFAULT FALSE,
      lastLogin TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      imageSrc VARCHAR(255) NULL
    )
    `,
    `
    CREATE TABLE IF NOT EXISTS serverInfo (
      id INT AUTO_INCREMENT PRIMARY KEY,
      playerCount INT NOT NULL,
      botCount INT NOT NULL,
      serverName VARCHAR(255) NOT NULL,
      mapName VARCHAR(255) NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    `,
    `
    CREATE TABLE IF NOT EXISTS pageCount (
      id INT AUTO_INCREMENT PRIMARY KEY,
      page VARCHAR(255) NOT NULL,
      hits INT DEFAULT 0,
      lastHit TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    `,
    `
    CREATE TABLE IF NOT EXISTS playersComparisonFirst (
      name VARCHAR(255) NOT NULL,
      time FLOAT NOT NULL,
      score FLOAT NOT NULL
    )
    `,
    `
    CREATE TABLE IF NOT EXISTS playersComparisonSecond (
      name VARCHAR(255) NOT NULL,
      time FLOAT NOT NULL,
      score FLOAT NOT NULL
    )
    `,
  ];

  try {
    for (const query of createTableQueries) {
      await connection.query(query);
    }
    console.log('Tables set up successfully!');
  } catch (error) {
    console.error('Error setting up tables:', error.message);
  } finally {
    await connection.end();
  }
}

setupTables();
