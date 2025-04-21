import { neon } from '@neondatabase/serverless';
import { env } from '$env/dynamic/private';

const sql = neon(env.POSTGRES_URL);

export default sql;