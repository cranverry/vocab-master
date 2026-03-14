/**
 * SM-2 Spaced Repetition Algorithm
 * quality: 0 = again, 3 = hard, 4 = good, 5 = perfect
 */
export function sm2(quality, state = {}) {
  let { easeFactor = 2.5, interval = 0, repetitions = 0 } = state

  let newInterval, newRepetitions
  if (quality >= 3) {
    if (repetitions === 0) newInterval = 1
    else if (repetitions === 1) newInterval = 6
    else newInterval = Math.round(interval * easeFactor)
    newRepetitions = repetitions + 1
  } else {
    newInterval = 1
    newRepetitions = 0
  }

  const newEF = Math.max(1.3, easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))

  let mastery
  if (newRepetitions === 0) mastery = 'learning'
  else if (newRepetitions < 3) mastery = 'review'
  else mastery = 'mastered'

  return {
    easeFactor: newEF,
    interval: newInterval,
    repetitions: newRepetitions,
    nextReview: Date.now() + newInterval * 86400000,
    mastery
  }
}

export function isDue(wd) {
  if (!wd || wd.mastery === 'new') return true
  return Date.now() >= (wd.nextReview || 0)
}

export const QUALITY = { again: 0, hard: 3, good: 4, perfect: 5 }

export function masteryLabel(mastery) {
  return { new: '신규', learning: '학습중', review: '복습중', mastered: '완료' }[mastery] || '신규'
}

export function masteryColor(mastery) {
  return { new: '#888', learning: '#f59e0b', review: '#3b82f6', mastered: '#22c55e' }[mastery] || '#888'
}
