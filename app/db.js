// db.js - creates ONE shared connection pool to MySQL.
// Every route borrows a connection from this pool, so we never open
// a new connection per request.
//
// This file contains no SQL. All SQL lives in queries.js and is written by the team.

require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 5,
  // Lets queries use named parameters like :keyword instead of ?
  namedPlaceholders: true,
  // Return DATETIME columns as plain strings ("2024-03-01 12:00:00")
  dateStrings: true,
  // Encrypt the connection (SSL/TLS). Our Cloud SQL instance rejects
  // unencrypted logins with a misleading "Access denied" error.
  // rejectUnauthorized: false = encrypt, but don't verify Google's
  // certificate (fine for a class project; avoids downloading CA files).
  // Set DB_SSL=false in .env only if you point at a local MySQL without SSL.
  ssl: process.env.DB_SSL === 'false' ? undefined : { rejectUnauthorized: false },
});

// Checks that we can reach the database without running any SQL.
async function ping() {
  const conn = await pool.getConnection();
  try {
    await conn.ping();
  } finally {
    conn.release();
  }
}

module.exports = { pool, ping };
