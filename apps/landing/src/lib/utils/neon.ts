import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const connectionString: string = process.env.POSTGRES_URL as string;

const sql = neon(connectionString);

export default sql;