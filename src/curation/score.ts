const profanity = /\b(?:fuck\w*|shit\w*|bitch\w*|asshole\w*|damn\w*)\b/i
const narrativeMarkers = /\b(?:thereupon|whereupon|hitherto|thou|thee|hereinafter)\b/i
const likelyVerb = /\b(?:am|are|is|was|were|be|have|has|had|do|does|did|can|could|will|would|should|may|might|want|need|like|go|get|take|make|know|think|say|tell|give|come|feel|look|work|help|meet|call|pay|order)\b/i

export interface SpeakingScore {
  score: number
  eligibleForReview: boolean
  reasons: string[]
}

export function scoreSpeakingCandidate(text: string): SpeakingScore {
  const value = text.trim()
  const words = value.match(/[A-Z]+(?:'[A-Z]+)?/gi) ?? []
  const reasons: string[] = []
  let score = 0

  if (words.length < 3 || words.length > 18)
    reasons.push('word_count')
  else score += 25
  if (likelyVerb.test(value))
    score += 25
  else reasons.push('no_common_verb')
  if (/[?!.]$/.test(value))
    score += 10
  else reasons.push('missing_terminal_punctuation')
  if (/\b(?:I|you|we|they|he|she)\b/i.test(value))
    score += 15
  if (/\b(?:please|thanks|thank you|could|would|can I|do you|how|what|where)\b/i.test(value))
    score += 20
  if (profanity.test(value)) {
    score -= 80
    reasons.push('profanity')
  }
  if (narrativeMarkers.test(value)) {
    score -= 40
    reasons.push('literary_language')
  }
  if (!/[A-Z]/i.test(value)) {
    score -= 100
    reasons.push('no_english')
  }

  score = Math.max(0, Math.min(100, score))
  return { score, eligibleForReview: score >= 55 && reasons.length <= 1, reasons }
}
