const LEVELS = [0, 100, 250, 500, 900, 1400, 2000, 2800, 3800, 5000]

export const BADGES = [
  { id: 'first_word',   icon: '🌱', name: '첫 단어!',        check: s => s.totalStudied >= 1 },
  { id: 'ten_words',    icon: '🌿', name: '10단어 달성',      check: s => s.totalStudied >= 10 },
  { id: 'fifty_words',  icon: '🌳', name: '50단어 달성',      check: s => s.totalStudied >= 50 },
  { id: 'hundred',      icon: '💯', name: '100단어 달성',     check: s => s.totalStudied >= 100 },
  { id: 'streak3',      icon: '🔥', name: '3일 연속',         check: s => s.streak >= 3 },
  { id: 'streak7',      icon: '⚡', name: '7일 연속',         check: s => s.streak >= 7 },
  { id: 'streak30',     icon: '💫', name: '30일 연속',        check: s => s.streak >= 30 },
  { id: 'accuracy90',   icon: '🎯', name: '정확도 90%',       check: s => s.totalStudied > 20 && (s.totalCorrect / s.totalStudied) >= 0.9 },
  { id: 'level5',       icon: '⭐', name: 'Lv.5 달성',        check: s => s.level >= 5 },
  { id: 'level10',      icon: '🏆', name: 'Lv.10 달성 (MAX)', check: s => s.level >= 10 },
]

export function getLevelFromXP(xp) {
  let level = 1
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i]) { level = i + 1; break }
  }
  return level
}

export function getLevelProgress(stats) {
  const cur = LEVELS[stats.level - 1] || 0
  const next = LEVELS[stats.level] ?? null
  if (!next) return { pct: 100, current: stats.xp - cur, needed: 0 }
  return {
    pct: ((stats.xp - cur) / (next - cur)) * 100,
    current: stats.xp - cur,
    needed: next - stats.xp
  }
}

export function addXP(stats, amount) {
  stats.xp += amount
  stats.level = getLevelFromXP(stats.xp)
  return stats
}

export function updateStreak(stats) {
  const today = new Date().toDateString()
  const yesterday = new Date(Date.now() - 86400000).toDateString()
  if (stats.lastStudyDate === today) return stats
  stats.streak = stats.lastStudyDate === yesterday ? stats.streak + 1 : 1
  stats.lastStudyDate = today
  return stats
}

export function checkBadges(stats) {
  const earned = []
  for (const b of BADGES) {
    if (!stats.badges.includes(b.id) && b.check(stats)) {
      stats.badges.push(b.id)
      earned.push(b)
    }
  }
  return { stats, earned }
}

export const XP = { flashcard_good: 5, flashcard_again: 1, typing_correct: 12, typing_wrong: 2, typing_hint: 6 }
