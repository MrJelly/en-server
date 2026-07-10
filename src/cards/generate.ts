import type { EditorialOverride } from '../curation/promote.js'
import { canPromoteToDailyCard } from '../curation/promote.js'

export interface ApprovedSentence {
  id: number
  normalizedText: string
  license: string
  sourceUrl: string
}

export interface LessonCardDraft {
  sentenceId: number
  titleZh: string
  translationZh: string
  teachingNoteZh?: string
  drills: Array<{ kind: 'shadow' | 'substitution', promptEn: string, promptZh: string }>
}

export function createLessonCard(sentence: ApprovedSentence, override: EditorialOverride): LessonCardDraft {
  if (sentence.id !== override.sentenceId)
    throw new Error('Editorial override does not match sentence')
  if (!canPromoteToDailyCard({ ...override, license: sentence.license, sourceUrl: sentence.sourceUrl }))
    throw new Error('Only reviewed sentences with complete provenance can create lesson cards')

  return {
    sentenceId: sentence.id,
    titleZh: override.sceneKey,
    translationZh: override.translationZh,
    teachingNoteZh: override.teachingNoteZh,
    drills: [
      { kind: 'shadow', promptEn: sentence.normalizedText, promptZh: '听一遍，然后跟读这句话。' },
      { kind: 'substitution', promptEn: sentence.normalizedText, promptZh: '替换一个关键词，再完整说一遍。' },
    ],
  }
}
