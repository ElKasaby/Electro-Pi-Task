import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function initDb() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: 'postgres', // connect to default db first
  });

  try {
    await client.connect();
    console.log('[DB Init]: Connected to default postgres database.');
    
    const dbName = process.env.DB_NAME || 'taskmanager';
    // Check if database exists
    const res = await client.query(`SELECT 1 FROM pg_database WHERE datname=$1`, [dbName]);
    
    if (res.rowCount === 0) {
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log(`[DB Init]: Database "${dbName}" created successfully.`);
    } else {
      console.log(`[DB Init]: Database "${dbName}" already exists.`);
    }
  } catch (error: any) {
    console.error('[DB Init] Error:', error.message);
  } finally {
    await client.end();
  }
}

initDb();
