import process from 'node:process'
import { z } from 'zod'

const mysqlUrl = z.string().url().refine(value => value.startsWith('mysql://'), {
  message: 'DATABASE_URL must use the mysql:// scheme',
})

const configSchema = z.object({
  DATABASE_URL: mysqlUrl,
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  APP_TIMEZONE: z.string().min(1).default('Asia/Shanghai'),
  CORS_ORIGIN: z.string().url().default('http://localhost:9000'),
})

export type AppConfig = z.infer<typeof configSchema>

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  return configSchema.parse(env)
}
