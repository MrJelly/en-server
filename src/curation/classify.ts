export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2'

export function classifyCefr(text: string): CefrLevel {
  const words = text.match(/[A-Z]+(?:'[A-Z]+)?/gi) ?? []
  if (words.length <= 6)
    return 'A1'
  if (words.length <= 11)
    return 'A2'
  if (words.length <= 16)
    return 'B1'
  return 'B2'
}

export function classifyScene(text: string): string | null {
  const normalized = text.toLowerCase()
  if (/coffee|tea|menu|order|table|restaurant/.test(normalized))
    return 'coffee_and_food'
  if (/meeting|email|office|work|project|call/.test(normalized))
    return 'workplace'
  if (/train|bus|airport|ticket|hotel|map/.test(normalized))
    return 'getting_around'
  if (/name|nice to meet|how are you/.test(normalized))
    return 'meeting_people'
  return null
}
