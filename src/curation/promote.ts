import type { CefrLevel } from './classify.js'

export interface EditorialOverride {
  sentenceId: number
  approved: boolean
  translationZh: string
  cefrLevel: CefrLevel
  sceneKey: string
  teachingNoteZh?: string
}

export function canPromoteToDailyCard(input: EditorialOverride & { license: string, sourceUrl: string }) {
  return input.approved
    && input.translationZh.trim().length > 0
    && input.license.trim().length > 0
    && input.sourceUrl.trim().length > 0
}
