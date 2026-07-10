import type { DailyAssignment, DailyCard } from './dailyAllocator.js'
import { describe, expect, it } from 'vitest'
import { DailyAllocator, InMemoryDailyRepository } from './dailyAllocator.js'

const card: DailyCard = { lessonCardId: 1, sentenceId: 11, text: 'Could I get a latte, please?', translationZh: '我可以要一杯拿铁吗？' }

describe('dailyAllocator', () => {
  it('returns one idempotent assignment under concurrent requests', async () => {
    const repository = new InMemoryDailyRepository(new Map([[0, [card]]]))
    const allocator = new DailyAllocator(repository)
    const [first, second] = await Promise.all([
      allocator.getDaily('u1', '2026-07-10'),
      allocator.getDaily('u1', '2026-07-10'),
    ])
    expect(first).toMatchObject({ kind: 'new', card })
    expect(second).toEqual(first)
  })

  it('returns a due review before trying to create a new card', async () => {
    const review: DailyAssignment = { id: 3, userId: 'u1', localDate: '2026-07-10', card, kind: 'review' }
    const repository = new InMemoryDailyRepository(new Map([[0, [card]]]), new Map([['u1:2026-07-10', review]]))
    await expect(new DailyAllocator(repository).getDaily('u1', '2026-07-10')).resolves.toEqual(review)
  })

  it('does not return a new card twice after it has been assigned', async () => {
    const repository = new InMemoryDailyRepository(new Map([[0, [card]]]))
    const allocator = new DailyAllocator(repository)
    await allocator.getDaily('u1', '2026-07-10')
    await expect(allocator.getDaily('u1', '2026-07-11')).resolves.toMatchObject({ kind: 'pool_exhausted' })
  })
})
