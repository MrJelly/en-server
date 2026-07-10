import type { Buffer } from 'node:buffer'

export interface ImportedSentence {
  sourceCode: 'tatoeba' | 'oanc' | 'common_voice' | 'classic'
  externalId: string
  rawText: string
  normalizedText: string
  textSha256: Buffer
  wordCount: number
  sampleBucket: number
  language: 'en'
  license: string
  attribution?: string
  sourceUrl: string
  documentExternalId?: string
}

export interface ImportSummary {
  accepted: number
  rejected: number
  sentences: ImportedSentence[]
}
