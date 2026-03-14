const P = 'vm_'

function get(key, fallback = null) {
  try {
    const v = localStorage.getItem(P + key)
    return v !== null ? JSON.parse(v) : fallback
  } catch { return fallback }
}

function set(key, value) {
  localStorage.setItem(P + key, JSON.stringify(value))
}

// ── Chapters ──────────────────────────────────────────────

export function getChapters() {
  return get('chapters', [])
}

export function saveChapter(chapter) {
  const list = getChapters()
  const idx = list.findIndex(c => c.id === chapter.id)
  if (idx >= 0) list[idx] = chapter
  else list.push(chapter)
  set('chapters', list)
}

export function getChapter(id) {
  return getChapters().find(c => c.id === id) || null
}

export function deleteChapter(id) {
  set('chapters', getChapters().filter(c => c.id !== id))
  localStorage.removeItem(P + `wd_${id}`)
}

// ── Word SRS Data ──────────────────────────────────────────

export function getWordData(chapterId, wordId) {
  const all = get(`wd_${chapterId}`, {})
  return all[wordId] || { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: 0, mastery: 'new' }
}

export function saveWordData(chapterId, wordId, data) {
  const all = get(`wd_${chapterId}`, {})
  all[wordId] = data
  set(`wd_${chapterId}`, all)
}

export function getAllWordData(chapterId) {
  return get(`wd_${chapterId}`, {})
}

// ── User Stats ─────────────────────────────────────────────

export function getUserStats() {
  return get('stats', {
    xp: 0, level: 1, streak: 0,
    lastStudyDate: null,
    badges: [], totalStudied: 0, totalCorrect: 0
  })
}

export function saveUserStats(stats) {
  set('stats', stats)
}
