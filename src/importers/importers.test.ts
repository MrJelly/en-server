import { describe, expect, it } from 'vitest'
import { parseCommonVoiceMetadata } from './commonVoice.js'
import { importApprovedClassic } from './gutenbergReview.js'
import { parseOancSpokenDocuments } from './oanc.js'
import { parseTatoebaCc0 } from './tatoeba.js'

describe('official corpus importers', () => {
  it('preserves Tatoeba CC0 sentence provenance', () => {
    const result = parseTatoebaCc0('1\teng\tCould I get a latte?\t2026-01-01\n2\tcmn\t你好\t2026-01-01')
    expect(result).toMatchObject({ accepted: 1, rejected: 1 })
    expect(result.sentences[0]).toMatchObject({ sourceCode: 'tatoeba', externalId: '1', license: 'CC0-1.0' })
  })

  it('imports only provided OANC spoken documents with their license', () => {
    const result = parseOancSpokenDocuments([{
      externalId: 'switchboard-01',
      text: 'How are you? I am doing well.',
      license: 'OANC-1.0',
      sourceUrl: 'https://anc.org/data/oanc/',
    }])
    expect(result.accepted).toBe(2)
    expect(result.sentences.every(item => item.documentExternalId === 'switchboard-01')).toBe(true)
  })

  it('imports Common Voice metadata without downloading audio', () => {
    const result = parseCommonVoiceMetadata('path\tsentence\tclient_id\na.mp3\tPlease take a seat.\tclient')
    expect(result.sentences[0]).toMatchObject({ sourceCode: 'common_voice', externalId: 'a.mp3', license: 'CC0-1.0' })
  })

  it('rejects classic works that have not passed global rights review', () => {
    expect(() => importApprovedClassic({
      workId: 'pg-1',
      title: 'Example',
      reviewStatus: 'approved',
      rightsStatus: 'public_domain_us_only',
      license: 'Public Domain',
      sourceUrl: 'https://www.gutenberg.org/',
    }, ['This is a classic sentence.'])).toThrow('global public-domain')
  })
})
