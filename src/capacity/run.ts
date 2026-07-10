import type { DailyAssignment, DailyCard, DailyRepository } from '../services/dailyAllocator.js'
import { performance } from 'node:perf_hooks'
import process from 'node:process'
import { DailyAllocator } from '../services/dailyAllocator.js'

const CARD_COUNT = 1_000_000
const REQUEST_COUNT = 100

class SyntheticMillionCardRepository implements DailyRepository {
  private readonly assignments = new Map<string, DailyAssignment>()
  private readonly history = new Set<string>()
  private nextId = 1

  async findDueReview() { return null }
  async listCandidates(bucket: number, limit: number) {
    return Array.from({ length: limit }, (_, offset): DailyCard => {
      const sentenceId = bucket * 1000 + offset + 1
      return { lessonCardId: sentenceId, sentenceId, text: `Synthetic sentence ${sentenceId}`, translationZh: `合成测试句 ${sentenceId}` }
    }).filter(card => card.sentenceId <= CARD_COUNT)
  }

  async tryClaimNew({ userId, localDate, card }: { userId: string, localDate: string, card: DailyCard }) {
    const dateKey = `${userId}:${localDate}`
    const existing = this.assignments.get(dateKey)
    if (existing)
      return { kind: 'existing' as const, assignment: existing }
    const historyKey = `${userId}:${card.sentenceId}`
    if (this.history.has(historyKey))
      return { kind: 'seen' as const }
    const assignment = { id: this.nextId++, userId, localDate, card, kind: 'new' as const }
    this.assignments.set(dateKey, assignment)
    this.history.add(historyKey)
    return { kind: 'created' as const, assignment }
  }

  get historySize() { return this.history.size }
}

async function main() {
  const repository = new SyntheticMillionCardRepository()
  const allocator = new DailyAllocator(repository)
  const date = '2026-07-10'
  const started = performance.now()
  const latencies: number[] = []
  const assignments = await Promise.all(Array.from({ length: REQUEST_COUNT }, async (_, index) => {
    const requestStart = performance.now()
    const result = await allocator.getDaily(`capacity-user-${index}`, date)
    latencies.push(performance.now() - requestStart)
    return result
  }))
  const collisionResults = await Promise.all(Array.from({ length: REQUEST_COUNT }, () => allocator.getDaily('collision-user', date)))
  const assignmentIds = assignments.map(result => result.kind === 'pool_exhausted' ? -1 : result.id)
  const collisionIds = collisionResults.map(result => result.kind === 'pool_exhausted' ? -1 : result.id)
  const sorted = [...latencies].sort((a, b) => a - b)
  const p95 = sorted[Math.ceil(sorted.length * 0.95) - 1]

  if (new Set(assignmentIds).size !== REQUEST_COUNT)
    throw new Error('Distinct users did not receive distinct assignments')
  if (new Set(collisionIds).size !== 1)
    throw new Error('Concurrent same-user/date requests were not idempotent')
  if (repository.historySize !== REQUEST_COUNT + 1)
    throw new Error(`Expected ${REQUEST_COUNT + 1} history rows, received ${repository.historySize}`)

  console.log(JSON.stringify({ syntheticEligibleCards: CARD_COUNT, concurrentRequests: REQUEST_COUNT, uniqueAssignments: new Set(assignmentIds).size, collisionAssignmentIds: new Set(collisionIds).size, historyRows: repository.historySize, p95Ms: Number(p95.toFixed(2)), totalMs: Number((performance.now() - started).toFixed(2)) }, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
