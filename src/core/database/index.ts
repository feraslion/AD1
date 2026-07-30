import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
import * as schema from './schema.ts';

const { Pool } = pkg;

export const createPool = () => {
  const isUnixSocket = process.env.SQL_HOST?.startsWith('/');
  return new Pool({
    host: process.env.SQL_HOST,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DB_NAME,
    port: process.env.SQL_PORT ? Number(process.env.SQL_PORT) : (isUnixSocket ? undefined : 5432),
    connectionTimeoutMillis: 15000,
    idleTimeoutMillis: 30000,
    max: 20
  });
};

const pool = createPool();

pool.on('error', (err) => {
  console.error('Unexpected error on idle SQL pool client:', err);
});

export const db = drizzle(pool, { schema });

// Cleanly export Supabase client from database infrastructure layer
export * from './supabase.ts';
