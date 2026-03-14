import { getUserStats, getChapters, getAllWordData } from '../modules/storage.js'
import { getLevelProgress, BADGES } from '../modules/gamification.js'
import { navigate } from '../router.js'

export function renderStats() {
  const stats = getUserStats()
  const chapters = getChapters()
  const { pct, current, needed } = getLevelProgress(stats)

  const accuracy = stats.totalStudied > 0
    ? Math.round((stats.totalCorrect / stats.totalStudied) * 100)
    : 0

  // Per-chapter breakdown
  const chapterRows = chapters.map(ch => {
    const wd = getAllWordData(ch.id)
    const total = ch.words.length
    const mastered  = ch.words.filter(w => wd[w.id]?.mastery === 'mastered').length
    const learning  = ch.words.filter(w => ['learning','review'].includes(wd[w.id]?.mastery)).length
    const newCount  = total - mastered - learning
    const p = total > 0 ? Math.round((mastered / total) * 100) : 0
    return { name: ch.name, total, mastered, learning, newCount, p }
  })

  const allBadges = BADGES.map(b => ({
    ...b, earned: stats.badges.includes(b.id)
  }))

  return `
<div class="view stats-view">
  <div class="view-header"><h2>통계</h2><span></span></div>

  <div class="stat-grid">
    <div class="stat-card">
      <div class="stat-big">${stats.totalStudied.toLocaleString()}</div>
      <div class="stat-lbl">총 학습</div>
    </div>
    <div class="stat-card">
      <div class="stat-big">${accuracy}%</div>
      <div class="stat-lbl">정확도</div>
    </div>
    <div class="stat-card">
      <div class="stat-big">${stats.streak}</div>
      <div class="stat-lbl">연속 일수</div>
    </div>
    <div class="stat-card">
      <div class="stat-big">Lv.${stats.level}</div>
      <div class="stat-lbl">${stats.xp} XP</div>
    </div>
  </div>

  <div class="section-title">레벨 진행</div>
  <div class="xp-card">
    <div class="xp-top">
      <div class="level-circle">Lv.${stats.level}</div>
      <div class="xp-info">
        <div class="xp-total">${stats.xp} XP</div>
        <div class="xp-sub">${needed > 0 ? `다음 레벨까지 ${needed} XP` : '🏆 최고 레벨'}</div>
      </div>
    </div>
    <div class="xp-bar-wrap">
      <div class="xp-bar-fill" style="width:${Math.min(pct,100)}%"></div>
    </div>
  </div>

  ${chapterRows.length > 0 ? `
    <div class="section-title">챕터별 현황</div>
    <div class="chapter-stats-list">
      ${chapterRows.map(r => `
      <div class="cstat-row">
        <div class="cstat-name">${r.name}</div>
        <div class="cstat-chips">
          <span class="stat-chip new">${r.newCount}신규</span>
          <span class="stat-chip learning">${r.learning}학습중</span>
          <span class="stat-chip mastered">${r.mastered}완료</span>
        </div>
        <div class="mini-progress">
          <div class="mini-fill" style="width:${r.p}%"></div>
        </div>
      </div>`).join('')}
    </div>` : ''}

  <div class="section-title">뱃지</div>
  <div class="badge-grid">
    ${allBadges.map(b => `
    <div class="badge-cell ${b.earned ? 'earned' : 'locked'}" title="${b.name}">
      <div class="badge-icon">${b.earned ? b.icon : '🔒'}</div>
      <div class="badge-label">${b.name}</div>
    </div>`).join('')}
  </div>
</div>`
}

export function setupStats() {}
