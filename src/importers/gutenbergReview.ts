import type { ImportedSentence } from './types.js'
import { normalizeSentence } from './normalize.js'

export interface ClassicReview {
  workId: string
  title: string
  reviewStatus: 'approved' | 'pending' | 'rejected'
  rightsStatus: 'public_domain_global' | 'public_domain_us_only' | 'unknown'
  license: string
  sourceUrl: string
}

export function importApprovedClassic(review: ClassicReview, paragraphs: readonly string[]): ImportedSentence[] {
  if (review.reviewStatus !== 'approved' || review.rightsStatus !== 'public_domain_global')
    throw new Error('Classic work requires approved global public-domain review')

  return paragraphs.flatMap((paragraph, paragraphIndex) => paragraph
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean)
    .map((text, sentenceIndex) => {
      const normalized = normalizeSentence({ text, license: review.license, sourceUrl: review.sourceUrl })
      return {
        sourceCode: 'classic' as const,
        externalId: `${review.workId}:${paragraphIndex + 1}:${sentenceIndex + 1}`,
        documentExternalId: review.workId,
        rawText: text,
        ...normalized,
        language: 'en' as const,
        license: review.license,
        attribution: review.title,
        sourceUrl: review.sourceUrl,
      }
    }))
}
