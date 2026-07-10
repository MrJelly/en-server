import { describe, expect, it } from 'vitest'
import {
  corpusSentences,
  schemaMetadata,
  userDailyAssignments,
  userSentenceHistory,
} from './schema.js'

describe('corpus schema invariants', () => {
  it('defines provenance requirements for imported sentences', () => {
    expect(schemaMetadata.provenanceFields).toEqual(expect.arrayContaining([
      'license',
      'source_url',
      'source_id',
      'import_batch_id',
    ]))
    expect(corpusSentences.license.notNull).toBe(true)
    expect(corpusSentences.sourceUrl.notNull).toBe(true)
  })

  it('defines a durable non-repeat assignment constraint', () => {
    expect(schemaMetadata.nonRepeatConstraint).toBe('user_daily_assignments_user_sentence_unique')
    expect(userDailyAssignments.userId.notNull).toBe(true)
    expect(userDailyAssignments.sentenceId.notNull).toBe(true)
    expect(userSentenceHistory.userId.notNull).toBe(true)
  })

  it('defines the indexed fields used by the allocator', () => {
    expect(schemaMetadata.candidateIndex).toBe('corpus_sentences_candidate_idx')
    expect(corpusSentences.sampleBucket.notNull).toBe(true)
  })
})
