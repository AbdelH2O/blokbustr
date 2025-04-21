import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

// Check if the connection string exists
if (!process.env.DATABASE_URL) {
  console.error('Missing POSTGRES_URL environment variable');
}

const connectionString = process.env.DATABASE_URL || '';

const sql = neon(connectionString);

export default sql;