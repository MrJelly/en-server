import type { ImportedSentence, ImportSummary } from './types.js'
import { normalizeSentence, SentenceRejectedError } from './normalize.js'

export interface OancDocument {
  externalId: string
  text: string
  license: string
  sourceUrl: string
}

export function parseOancSpokenDocuments(documents: readonly OancDocument[]): ImportSummary {
  const sentences: ImportedSentence[] = []
  let rejected = 0

  for (const document of documents) {
    for (const [index, text] of document.text.split(/(?<=[.!?])\s+/).entries()) {
      try {
        const normalized = normalizeSentence({ text, license: document.license, sourceUrl: document.sourceUrl })
        sentences.push({
          sourceCode: 'oanc',
          externalId: `${document.externalId}:${index + 1}`,
          documentExternalId: document.externalId,
          rawText: text,
          ...normalized,
          language: 'en',
          license: document.license,
          sourceUrl: document.sourceUrl,
        })
      }
      catch (error) {
        if (!(error instanceof SentenceRejectedError))
          throw error
        rejected++
      }
    }
  }
  return { accepted: sentences.length, rejected, sentences }
}
