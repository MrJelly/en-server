import type { Env } from './cloudflare/bindings.js'
import type { DailyRepository } from './services/dailyAllocator.js'
import { describe, expect, it } from 'vitest'
import { createWorkerHandler } from './worker.js'

function createRepository(): DailyRepository {
  let assignmentId = 0
  return {
    findDueReview: async () => null,
    listCandidates: async () => [{ lessonCardId: 7, sentenceId: 11, text: 'Could you help me?', translationZh: '你能帮我吗？' }],
    tryClaimNew: async ({ userId, localDate, card }) => ({
      kind: 'created',
      assignment: { id: ++assignmentId, userId, localDate, card, kind: 'new' },
    }),
  }
}

const env = { CORS_ORIGIN: 'https://mini.example' } as Env

describe('worker HTTP API', () => {
  it('reports the Cloudflare runtime health', async () => {
    const response = await createWorkerHandler(() => createRepository())(new Request('https://api.example/health'), env)
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ status: 'ok', runtime: 'cloudflare-workers' })
  })

  it('validates daily request parameters', async () => {
    const response = await createWorkerHandler(() => createRepository())(new Request('https://api.example/v1/daily?date=bad'), env)
    expect(response.status).toBe(400)
    expect((await response.json() as { code: string }).code).toBe('INVALID_USER_ID')
  })

  it('serves a daily assignment with CORS headers', async () => {
    const response = await createWorkerHandler(() => createRepository())(new Request('https://api.example/v1/daily?userId=tester&date=2026-07-10'), env)
    const body = await response.json() as { card: { sentenceId: number } }
    expect(response.status).toBe(200)
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://mini.example')
    expect(body.card.sentenceId).toBe(11)
  })

  it('maps D1 quota errors to a stable free-tier error', async () => {
    const response = await createWorkerHandler(() => ({
      findDueReview: async () => { throw new Error('D1 quota limit exceeded') },
      listCandidates: async () => [],
      tryClaimNew: async () => ({ kind: 'seen' }),
    }))(new Request('https://api.example/v1/daily?userId=tester'), env)
    expect(response.status).toBe(503)
    expect((await response.json() as { code: string }).code).toBe('FREE_TIER_LIMIT')
  })
})
