import { neon } from '@neondatabase/serverless';
import { POSTGRES_URL } from '$env/static/private';

const sql = neon(POSTGRES_URL);

export default sql;