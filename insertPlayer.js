import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function insertPlayer() {
  const connection = await mysql.createConnection({
    host: process.env.DBENDPOINT,
    user: process.env.DBUSER,
    password: process.env.DBPASSWORD,
    database: process.env.DBNAME,
    port: process.env.DBPORT,
  });

  const insertQuery = `
    INSERT INTO playersComparisonFirst (name, time, score) 
    VALUES (?, ?, ?)
  `;

  const playerData = ['| avi312singh', 921.912841796875, 0];

  try {
    const [result] = await connection.execute(insertQuery, playerData);
    console.log('Insert successful, result:', result);
  } catch (error) {
    console.error('Error inserting player data:', error.message);
  } finally {
    await connection.end();
  }
}

insertPlayer();
