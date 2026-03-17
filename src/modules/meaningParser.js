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
 * Normalize a meaning unit: lowercase, collapse whitespace, trim,
 * strip trailing punctuation.
 */
function norm(s) {
  return s.toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[.,;:!?]+$/, '')
    .trim()
}

/**
 * Normalize + remove ALL whitespace AND punctuation.
 * Used for fuzzy comparison:
 *   "행동원칙"       == "행동 원칙"       (공백 차이)
 *   "가득찬 수없이 많은" == "가득찬, 수없이 많은"  (쉼표 차이)
 */
function normStrip(s) {
  return norm(s).replace(/[\s,;:.!?·•\/|~\-()]+/g, '')
}

/**
 * Aggressively parse user input into parts.
 * Accepts all common separators:
 *   , ; / | · •  double-space  numbered prefixes
 */
function parseUserInput(str) {
  if (!str || !str.trim()) return []

  // 1. Strip numbered prefixes (e.g. "1.", "2.", "1)" )
  let cleaned = str
    .replace(/\d+[.)]\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  // 2. Try delimiter-based split
  const DELIMITERS = /[;,\/|·•]/
  const byDelim = cleaned.split(DELIMITERS).map(s => s.trim()).filter(Boolean)
  if (byDelim.length > 1) return byDelim

  // 3. Try two-or-more spaces
  const byDoubleSpace = cleaned.split(/\s{2,}/).map(s => s.trim()).filter(Boolean)
  if (byDoubleSpace.length > 1) return byDoubleSpace

  // 4. Return as single part (substring matching will handle rest)
  return [cleaned]
}

/**
 * Check if user input contains all required meaning parts.
 *
 * Strategy (in order):
 *   A. Exact match after delimiter-based split
 *   B. Substring match in full normalized input
 *      (handles single-space separated: "약속하다 예약하다 고용하다")
 *   C. Space-stripped substring match
 *      (handles "행동원칙" vs "행동 원칙", "make up" vs "makeup")
 *
 * Returns { correct: boolean, missing: string[] }
 */
export function checkMeaning(userInput, correctMeaning) {
  const required = parseMeaningParts(correctMeaning)
  if (required.length === 0) return { correct: true, missing: [] }

  const userParts    = parseUserInput(userInput).map(norm)
  const fullNorm     = norm(userInput)
  const fullNoSpace  = normStrip(userInput)

  const missing = required.filter(req => {
    const rn          = norm(req)
    const rnNoSpace   = normStrip(req)

    // A: exact part match (delimiter-split)
    if (userParts.some(u => u === rn)) return false

    // B: substring match in full normalized input
    if (fullNorm.includes(rn)) return false

    // C: space-stripped substring match
    //    "행동원칙" matches "행동 원칙", "格言행동원칙" matches "행동 원칙"
    if (rnNoSpace && fullNoSpace.includes(rnNoSpace)) return false

    return true
  })

  return { correct: missing.length === 0, missing }
}
