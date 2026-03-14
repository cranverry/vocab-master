/**
 * Parse synonym string into groups for display and matching.
 *
 * Patterns handled:
 *  - Numbered:   "1. promise, contract 2. reserve, book"  → ["promise, contract", "reserve, book"]
 *  - Semicolon:  "probability, likelihood; opportunity"   → ["probability, likelihood", "opportunity"]
 *  - Simple:     "provide, give, grant"                   → ["provide, give, grant"]
 */
export function parseSynonymGroups(str) {
  if (!str || !str.trim()) return []

  // Numbered groups: starts with "1." or contains " 2."
  if (/\d+\.\s/.test(str)) {
    return str
      .split(/\d+\.\s+/)
      .map(s => s.trim().replace(/,\s*$/, ''))
      .filter(Boolean)
  }

  // Semicolon-separated groups
  if (str.includes(';')) {
    return str.split(';').map(s => s.trim()).filter(Boolean)
  }

  // Single group
  return [str.trim()]
}

/**
 * Normalize a string for comparison: lowercase, collapse spaces, trim.
 */
export function normalize(s) {
  return s.toLowerCase().replace(/\s+/g, ' ').trim()
}

/**
 * Check if user input matches a synonym group (exact after normalization).
 */
export function matchesGroup(input, target) {
  return normalize(input) === normalize(target)
}
