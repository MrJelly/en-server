import type { ImportedSentence, ImportSummary } from './types.js'
import { normalizeSentence, SentenceRejectedError } from './normalize.js'

const TATOEBA_CC0_EXPORT = 'https://tatoeba.org/en/downloads'

export function parseTatoebaCc0(tsv: string, sourceUrl = TATOEBA_CC0_EXPORT): ImportSummary {
  const sentences: ImportedSentence[] = []
  let rejected = 0

  for (const line of tsv.split(/\r?\n/)) {
    if (!line)
      continue
    const [id, language, text] = line.split('\t', 4)
    if (!id || language !== 'eng' || !text) {
      rejected++
      continue
    }
    try {
      const normalized = normalizeSentence({ text, license: 'CC0-1.0', sourceUrl })
      sentences.push({
        sourceCode: 'tatoeba',
        externalId: id,
        rawText: text,
        ...normalized,
        language: 'en',
        license: 'CC0-1.0',
        sourceUrl,
      })
    }
    catch (error) {
      if (!(error instanceof SentenceRejectedError))
        throw error
      rejected++
    }
  }
  return { accepted: sentences.length, rejected, sentences }
}
