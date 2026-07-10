export interface DailyCard {
  lessonCardId: number
  sentenceId: number
  text: string
  translationZh: string
}

export interface DailyAssignment {
  id: number
  userId: string
  localDate: string
  card: DailyCard
  kind: 'new' | 'review'
}

export type ClaimResult
  = | { kind: 'created', assignment: DailyAssignment }
    | { kind: 'existing', assignment: DailyAssignment }
    | { kind: 'seen' }

export interface DailyRepository {
  findDueReview: (userId: string, localDate: string) => Promise<DailyAssignment | null>
  listCandidates: (bucket: number, limit: number) => Promise<DailyCard[]>
  tryClaimNew: (input: { userId: string, localDate: string, card: DailyCard }) => Promise<ClaimResult>
}

export type DailyResult = DailyAssignment | { kind: 'pool_exhausted', userId: string, localDate: string }

const MAX_BUCKET_ATTEMPTS = 5
const CANDIDATES_PER_BUCKET = 3

function bucketSequence(userId: string, localDate: string) {
  let hash = 2166136261
  for (const character of `${userId}:${localDate}`) {
    hash ^= character.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }
  const start = (hash >>> 0) % 1000
  return Array.from({ length: MAX_BUCKET_ATTEMPTS }, (_, index) => (start + index * 137) % 1000)
}

export class DailyAllocator {
  constructor(private readonly repository: DailyRepository) {}

  async getDaily(userId: string, localDate: string): Promise<DailyResult> {
    const review = await this.repository.findDueReview(userId, localDate)
    if (review)
      return review

    for (const bucket of bucketSequence(userId, localDate)) {
      const candidates = await this.repository.listCandidates(bucket, CANDIDATES_PER_BUCKET)
      for (const card of candidates) {
        const result = await this.repository.tryClaimNew({ userId, localDate, card })
        if (result.kind === 'created' || result.kind === 'existing')
          return result.assignment
      }
    }
    return { kind: 'pool_exhausted', userId, localDate }
  }
}

export class InMemoryDailyRepository implements DailyRepository {
  private readonly assignments = new Map<string, DailyAssignment>()
  private readonly seen = new Set<string>()
  private nextId = 1

  constructor(private readonly cardsByBucket: ReadonlyMap<number, readonly DailyCard[]>, private readonly dueReviews = new Map<string, DailyAssignment>()) {}

  async findDueReview(userId: string, localDate: string) {
    return this.dueReviews.get(`${userId}:${localDate}`) ?? null
  }

  async listCandidates(bucket: number, limit: number) {
    const singletonFallback = this.cardsByBucket.size === 1 ? this.cardsByBucket.values().next().value : undefined
    return [...(this.cardsByBucket.get(bucket) ?? singletonFallback ?? [])].slice(0, limit)
  }

  async tryClaimNew(input: { userId: string, localDate: string, card: DailyCard }): Promise<ClaimResult> {
    const dateKey = `${input.userId}:${input.localDate}`
    const existing = this.assignments.get(dateKey)
    if (existing)
      return { kind: 'existing', assignment: existing }

    const seenKey = `${input.userId}:${input.card.sentenceId}`
    if (this.seen.has(seenKey))
      return { kind: 'seen' }

    const assignment: DailyAssignment = {
      id: this.nextId++,
      userId: input.userId,
      localDate: input.localDate,
      card: input.card,
      kind: 'new',
    }
    this.assignments.set(dateKey, assignment)
    this.seen.add(seenKey)
    return { kind: 'created', assignment }
  }
}
