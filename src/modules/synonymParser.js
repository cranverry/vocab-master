/**
 * Parse synonym string into structured groups of individual items.
 *
 * Returns: Array of groups, each group is an array of individual synonym strings.
 *
 * Examples:
 *  "provide, give, grant"
 *    → [["provide", "give", "grant"]]
 *
 *  "probability, likelihood; opportunity"
 *    → [["probability", "likelihood"], ["opportunity"]]
 *
 *  "1. promise, contract, pledge 2. reserve, book 3. hire, employ"
 *    → [["promise", "contract", "pledge"], ["reserve", "book"], ["hire", "employ"]]
 */
export function parseSynonymGroups(str) {
  if (!str || !str.trim()) return []

  let rawGroups = []

  // Numbered groups
  if (/\d+\.\s/.test(str)) {
    rawGroups = str
      .split(/\d+\.\s+/)
      .map(s => s.trim().replace(/,\s*$/, ''))
      .filter(Boolean)
  }
  // Semicolon groups
  else if (str.includes(';')) {
    rawGroups = str.split(';').map(s => s.trim()).filter(Boolean)
  }
  // Single group
  else {
    rawGroups = [str.trim()]
  }

  // Split each group by comma → individual items
  return rawGroups.map(group =>
    group.split(',').map(s => s.trim()).filter(Boolean)
  )
}

/**
 * Normalize a string for comparison: lowercase, collapse spaces, trim.
 */
export function normalize(s) {
  return s.toLowerCase().replace(/\s+/g, ' ').trim()
}

/**
 * Check if user input matches a synonym item (exact after normalization).
 */
export function matchesItem(input, target) {
  return normalize(input) === normalize(target)
}
