import 'server-only';
import mysql from 'mysql2/promise';
import { getEnv } from '../config/env';

let pool: mysql.Pool | null = null;

export function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      uri: getEnv().DATABASE_URL,
      connectionLimit: 10,
      timezone: 'Z',
      namedPlaceholders: true,
    });
  }
  return pool;
}

export async function query<T>(sql: string, params: Record<string, unknown> = {}) {
  const [rows] = await getPool().execute(sql, params as Record<string, any>);
  return rows as T[];
}
