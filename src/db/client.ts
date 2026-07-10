import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import { loadConfig } from '../config.js'
import * as schema from './schema.js'

export function createDatabase(databaseUrl = loadConfig().DATABASE_URL) {
  const client = mysql.createPool(databaseUrl)
  return drizzle({ client, schema, mode: 'default' })
}
