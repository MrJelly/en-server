import { describe, expect, it } from 'vitest'
import { ZodError } from 'zod'
import { loadConfig } from './config.js'

describe('loadConfig', () => {
  it('parses a valid MySQL configuration', () => {
    expect(loadConfig({
      DATABASE_URL: 'mysql://speaking_app:secret@db.example.com:3306/speaking_planet',
      PORT: '3100',
      APP_TIMEZONE: 'Asia/Shanghai',
      CORS_ORIGIN: 'https://example.com',
    })).toEqual({
      DATABASE_URL: 'mysql://speaking_app:secret@db.example.com:3306/speaking_planet',
      PORT: 3100,
      APP_TIMEZONE: 'Asia/Shanghai',
      CORS_ORIGIN: 'https://example.com',
    })
  })

  it('rejects a non-MySQL database URL', () => {
    expect(() => loadConfig({ DATABASE_URL: 'postgres://user:secret@db.example.com:5432/app' }))
      .toThrow(ZodError)
  })

  it('rejects a missing database URL', () => {
    expect(() => loadConfig({})).toThrow(ZodError)
  })
})
