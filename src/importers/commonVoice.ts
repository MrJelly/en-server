import type { ImportedSentence, ImportSummary } from './types.js'
import { normalizeSentence, SentenceRejectedError } from './normalize.js'

const COMMON_VOICE_URL = 'https://commonvoice.mozilla.org/en/datasets'

export function parseCommonVoiceMetadata(tsv: string, sourceUrl = COMMON_VOICE_URL): ImportSummary {
  const [headerLine, ...lines] = tsv.split(/\r?\n/)
  const headers = headerLine?.split('\t') ?? []
  const pathIndex = headers.indexOf('path')
  const sentenceIndex = headers.indexOf('sentence')
  if (pathIndex < 0 || sentenceIndex < 0)
    throw new Error('Common Voice metadata must include path and sentence columns')

  const sentences: ImportedSentence[] = []
  let rejected = 0
  for (const line of lines) {
    if (!line)
      continue
    const columns = line.split('\t')
    const externalId = columns[pathIndex]
    const text = columns[sentenceIndex]
    if (!externalId || !text) {
      rejected++
      continue
    }
    try {
      const normalized = normalizeSentence({ text, license: 'CC0-1.0', sourceUrl })
      sentences.push({
        sourceCode: 'common_voice',
        externalId,
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
