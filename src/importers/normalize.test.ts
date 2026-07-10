import { describe, expect, it } from 'vitest'
import { normalizeSentence, SentenceRejectedError } from './normalize.js'

const provenance = { license: 'CC0-1.0', sourceUrl: 'https://tatoeba.org/en/sentences/show/1' }

describe('normalizeSentence', () => {
  it('normalizes text and creates a deterministic hash and sample bucket', () => {
    const first = normalizeSentence({ ...provenance, text: '  Could   I get a latte?  ' })
    const second = normalizeSentence({ ...provenance, text: 'Could I get a latte?' })

    expect(first.normalizedText).toBe('Could I get a latte?')
    expect(first.wordCount).toBe(5)
    expect(first.textSha256.equals(second.textSha256)).toBe(true)
    expect(first.sampleBucket).toBe(second.sampleBucket)
    expect(first.sampleBucket).toBeGreaterThanOrEqual(0)
    expect(first.sampleBucket).toBeLessThan(1000)
  })

  it.each([
    { ...provenance, text: 'Hi', expected: 'length' },
    { ...provenance, text: 'See https://example.com', expected: 'URL' },
    { ...provenance, text: '<p>Hello</p>', expected: 'markup' },
    { ...provenance, text: 'Hello\u0000there', expected: 'control' },
    { text: 'Hello there.', license: '', sourceUrl: provenance.sourceUrl, expected: 'license' },
  ])('rejects unsafe or unusable corpus rows: $expected', ({ expected, ...input }) => {
    expect(() => normalizeSentence(input)).toThrow(SentenceRejectedError)
  })
})
