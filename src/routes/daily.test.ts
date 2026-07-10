import { describe, expect, it } from 'vitest'
import { buildServer } from '../index.js'

describe('daily API route', () => {
  it('serves a local development assignment and is idempotent', async () => {
    const app = buildServer()
    const first = await app.inject('/v1/daily?userId=tester&date=2026-07-10')
    const second = await app.inject('/v1/daily?userId=tester&date=2026-07-10')
    expect(first.statusCode).toBe(200)
    expect(second.json()).toEqual(first.json())
    await app.close()
  })
})
