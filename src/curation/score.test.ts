import { describe, expect, it } from 'vitest'
import { classifyCefr, classifyScene } from './classify.js'
import { canPromoteToDailyCard } from './promote.js'
import { scoreSpeakingCandidate } from './score.js'

describe('speaking candidate curation', () => {
  it('scores natural practical language above literary or unsafe text', () => {
    expect(scoreSpeakingCandidate('Could I get a latte, please?').score)
      .toBeGreaterThan(scoreSpeakingCandidate('Thereupon he wandered hitherto into the hall.').score)
    expect(scoreSpeakingCandidate('Could I get a latte, please?').eligibleForReview).toBe(true)
    expect(scoreSpeakingCandidate('This is fucking awful.').eligibleForReview).toBe(false)
  })

  it('assigns a provisional level and scene', () => {
    expect(classifyCefr('Could I get a latte?')).toBe('A1')
    expect(classifyScene('Could I order a coffee, please?')).toBe('coffee_and_food')
  })

  it('requires editorial approval and provenance before daily publication', () => {
    const source = { license: 'CC0-1.0', sourceUrl: 'https://tatoeba.org/en/downloads' }
    expect(canPromoteToDailyCard({
      ...source,
      sentenceId: 1,
      approved: true,
      translationZh: '我可以要一杯拿铁吗？',
      cefrLevel: 'A1',
      sceneKey: 'coffee_and_food',
    })).toBe(true)
    expect(canPromoteToDailyCard({
      ...source,
      sentenceId: 1,
      approved: false,
      translationZh: '我可以要一杯拿铁吗？',
      cefrLevel: 'A1',
      sceneKey: 'coffee_and_food',
    })).toBe(false)
  })
})
