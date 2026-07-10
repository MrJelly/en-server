import type { ClaimResult, DailyAssignment, DailyCard, DailyRepository } from '../services/dailyAllocator.js'

interface AssignmentRow {
  id: number
  user_id: string
  local_date: string
  lesson_card_id: number
  sentence_id: number
  normalized_text: string
  translation_zh: string
}

interface CandidateRow {
  lesson_card_id: number
  sentence_id: number
  normalized_text: string
  translation_zh: string
}

function toCard(row: CandidateRow | AssignmentRow): DailyCard {
  return {
    lessonCardId: row.lesson_card_id,
    sentenceId: row.sentence_id,
    text: row.normalized_text,
    translationZh: row.translation_zh,
  }
}

function toAssignment(row: AssignmentRow, kind: 'new' | 'review', localDate = row.local_date): DailyAssignment {
  return {
    id: row.id,
    userId: row.user_id,
    localDate,
    card: toCard(row),
    kind,
  }
}

const assignmentSelect = `
  SELECT a.id, a.user_id, a.local_date, a.lesson_card_id, a.sentence_id,
         s.normalized_text, c.translation_zh
  FROM user_daily_assignments a
  JOIN lesson_cards c ON c.id = a.lesson_card_id
  JOIN corpus_sentences s ON s.id = a.sentence_id`

export class D1DailyRepository implements DailyRepository {
  constructor(private readonly db: D1Database) {}

  async findDueReview(userId: string, localDate: string) {
    const row = await this.db.prepare(`${assignmentSelect}
      WHERE a.user_id = ?1 AND a.next_review_at IS NOT NULL AND a.next_review_at <= ?2
      ORDER BY a.next_review_at, a.id LIMIT 1`).bind(userId, `${localDate}T23:59:59Z`).first<AssignmentRow>()
    return row ? toAssignment(row, 'review', localDate) : null
  }

  async listCandidates(bucket: number, limit: number) {
    const result = await this.db.prepare(`
      SELECT c.id AS lesson_card_id, s.id AS sentence_id,
             s.normalized_text, c.translation_zh
      FROM corpus_sentences s
      JOIN lesson_cards c ON c.sentence_id = s.id
      WHERE s.quality_status = 'approved' AND s.sample_bucket = ?1
        AND c.status = 'published' AND c.daily_eligible = 1
      ORDER BY s.id LIMIT ?2`).bind(bucket, Math.min(limit, 3)).all<CandidateRow>()
    return result.results.map(toCard)
  }

  async tryClaimNew(input: { userId: string, localDate: string, card: DailyCard }): Promise<ClaimResult> {
    const existing = await this.findForDate(input.userId, input.localDate)
    if (existing)
      return { kind: 'existing', assignment: existing }

    try {
      await this.db.batch([
        this.db.prepare(`
          INSERT INTO user_daily_assignments
            (user_id, local_date, lesson_card_id, sentence_id)
          VALUES (?1, ?2, ?3, ?4)`).bind(
          input.userId,
          input.localDate,
          input.card.lessonCardId,
          input.card.sentenceId,
        ),
        this.db.prepare(`
          INSERT INTO user_sentence_history
            (user_id, sentence_id, assignment_id)
          VALUES (?1, ?2, (
            SELECT id FROM user_daily_assignments
            WHERE user_id = ?1 AND local_date = ?3
          ))`).bind(input.userId, input.card.sentenceId, input.localDate),
      ])
    }
    catch {
      const concurrent = await this.findForDate(input.userId, input.localDate)
      if (concurrent)
        return { kind: 'existing', assignment: concurrent }
      return { kind: 'seen' }
    }

    const created = await this.findForDate(input.userId, input.localDate)
    if (!created)
      throw new Error('D1 claim succeeded without creating an assignment')
    return { kind: 'created', assignment: created }
  }

  private async findForDate(userId: string, localDate: string) {
    const row = await this.db.prepare(`${assignmentSelect}
      WHERE a.user_id = ?1 AND a.local_date = ?2 LIMIT 1`).bind(userId, localDate).first<AssignmentRow>()
    return row ? toAssignment(row, 'new') : null
  }
}
