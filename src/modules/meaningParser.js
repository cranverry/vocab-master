/**
 * Parse a meaning string into semantic units.
 *
 * Handles:
 *  - Numbered:   "1. 약속하다 2. 예약하다 3. 고용하다"  → ["약속하다", "예약하다", "고용하다"]
 *  - Semicolon:  "존경하다; 중하게 여기다"              → ["존경하다", "중하게 여기다"]
 *  - Single:     "주다"                                → ["주다"]
 */
export function parseMeaningParts(str) {
  if (!str || !str.trim()) return []

  // Numbered meanings: "1. ... 2. ... 3. ..."
  if (/\d+\.\s/.test(str)) {
    return str
      .split(/\d+\.\s+/)
      .map(s => s.trim().replace(/[;,]\s*$/, ''))
      .filter(Boolean)
  }

  // Semicolon-separated
  if (str.includes(';')) {
    return str.split(';').map(s => s.trim()).filter(Boolean)
  }

  // Single meaning
  return [str.trim()]
}

/**
 * Normalize a meaning unit for comparison.
 * Lowercases, collapses whitespace, trims.
 */
function normalizePart(s) {
  return s.toLowerCase().replace(/\s+/g, ' ').trim()
}

/**
 * Split user input into meaning parts using any common delimiter.
 * Accepts: semicolons, commas, numbered prefixes, double spaces
 */
function parseUserInput(str) {
  if (!str || !str.trim()) return []

  // Strip numbered prefixes
  let cleaned = str.replace(/\d+\.\s*/g, ' ')

  // Split by semicolons or commas
  const parts = cleaned.split(/[;,]/).map(s => s.trim()).filter(Boolean)

  if (parts.length > 1) return parts

  // Fallback: split by two or more spaces
  const bySpace = cleaned.split(/\s{2,}/).map(s => s.trim()).filter(Boolean)
  if (bySpace.length > 1) return bySpace

  return [cleaned.trim()]
}

/**
 * Check if user input contains all required meaning parts.
 * Returns { correct: boolean, missing: string[] }
 */
export function checkMeaning(userInput, correctMeaning) {
  const required = parseMeaningParts(correctMeaning)
  if (required.length === 0) return { correct: true, missing: [] }

  const userParts = parseUserInput(userInput)
  const userNorm = userParts.map(normalizePart)

  const missing = required.filter(req => {
    const rn = normalizePart(req)
    return !userNorm.some(u => u === rn)
  })

  return { correct: missing.length === 0, missing }
}
