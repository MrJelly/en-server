import { describe, expect, it } from 'vitest'
import { D1DailyRepository } from './d1DailyRepository.js'

interface FakeState {
  firstRows: unknown[]
  allRows: unknown[]
  batches: number
}

function createFakeD1(state: FakeState): D1Database {
  const prepare = (sql: string) => ({
    bind: (..._values: unknown[]) => ({
      first: async () => state.firstRows.shift() ?? null,
      all: async () => ({ results: state.allRows }),
      run: async () => ({ success: true }),
      raw: async () => [],
      sql,
    }),
  })
  return {
    prepare,
    batch: async () => {
      state.batches += 1
      return []
    },
  } as unknown as D1Database
}

describe('d1 daily repository', () => {
  it('reads a bounded candidate bucket', async () => {
    const state: FakeState = {
      firstRows: [],
      allRows: [{ lesson_card_id: 2, sentence_id: 3, normalized_text: 'How are you?', translation_zh: '你好吗？' }],
      batches: 0,
    }
    const cards = await new D1DailyRepository(createFakeD1(state)).listCandidates(12, 10)
    expect(cards).toEqual([{ lessonCardId: 2, sentenceId: 3, text: 'How are you?', translationZh: '你好吗？' }])
  })

  it('claims assignment and history in one D1 batch', async () => {
    const assignment = { id: 9, user_id: 'tester', local_date: '2026-07-10', lesson_card_id: 2, sentence_id: 3, normalized_text: 'How are you?', translation_zh: '你好吗？' }
    const state: FakeState = { firstRows: [null, assignment], allRows: [], batches: 0 }
    const result = await new D1DailyRepository(createFakeD1(state)).tryClaimNew({
      userId: 'tester',
      localDate: '2026-07-10',
      card: { lessonCardId: 2, sentenceId: 3, text: 'How are you?', translationZh: '你好吗？' },
    })
    expect(state.batches).toBe(1)
    expect(result.kind).toBe('created')
  })
})
