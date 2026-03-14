import { getUserStats, getChapters, getAllWordData } from '../modules/storage.js'
import { getLevelProgress, BADGES } from '../modules/gamification.js'
import { isDue } from '../modules/srs.js'
import { navigate } from '../router.js'

export function renderHome() {
  const stats = getUserStats()
  const chapters = getChapters()
  const { pct, needed } = getLevelProgress(stats)

  let dueCount = 0
  for (const ch of chapters) {
    const wd = getAllWordData(ch.id)
    for (const w of ch.words) {
      if (isDue(wd[w.id])) dueCount++
    }
  }

  const earnedBadges = BADGES.filter(b => stats.badges.includes(b.id))

  return `
<div class="view home-view">
  <div class="home-header">
    <h1 class="app-title">VocabMaster</h1>
    <div class="streak-badge ${stats.streak > 0 ? 'active' : ''}">
      ${stats.streak > 0 ? '🔥' : '❄️'} ${stats.streak}일 연속
    </div>
  </div>

  <div class="xp-card">
    <div class="xp-top">
      <div class="level-circle">Lv.${stats.level}</div>
      <div class="xp-info">
        <div class="xp-total">${stats.xp.toLocaleString()} XP</div>
        <div class="xp-sub">${needed > 0 ? `다음 레벨까지 ${needed} XP` : '🏆 최고 레벨'}</div>
      </div>
    </div>
    <div class="xp-bar-wrap">
      <div class="xp-bar-fill" style="width:${Math.min(pct,100)}%"></div>
    </div>
  </div>

  ${dueCount > 0
    ? `<div class="due-card" id="btn-go-review">
        <div class="due-left">
          <div class="due-icon">📬</div>
          <div>
            <div class="due-title">복습할 단어</div>
            <div class="due-count">${dueCount}개 대기중</div>
          </div>
        </div>
        <div class="due-arrow">›</div>
      </div>`
    : `<div class="done-card"><span>✅</span><span>오늘 복습 완료!</span></div>`
  }

  <div class="section-row">
    <div class="section-title">챕터</div>
    ${chapters.length > 3 ? `<button class="see-all-btn" id="btn-see-all">전체 →</button>` : ''}
  </div>

  ${chapters.length === 0
    ? `<div class="empty-card" id="btn-add-chapter">
        <span>📚</span>
        <p>CSV를 업로드해서 첫 챕터를 추가하세요</p>
      </div>`
    : `<div class="chapter-list">
        ${chapters.slice(0, 3).map(ch => chapterCard(ch)).join('')}
      </div>`
  }

  ${earnedBadges.length > 0 ? `
    <div class="section-title">획득한 뱃지</div>
    <div class="badge-row">
      ${earnedBadges.map(b => `
        <div class="badge-chip" title="${b.name}">
          <span>${b.icon}</span><span class="badge-name">${b.name}</span>
        </div>`).join('')}
    </div>` : ''}
</div>`
}

function chapterCard(ch) {
  const wd = getAllWordData(ch.id)
  const total = ch.words.length
  const mastered = ch.words.filter(w => wd[w.id]?.mastery === 'mastered').length
  const pct = total > 0 ? Math.round((mastered / total) * 100) : 0
  return `
  <div class="chapter-card" data-id="${ch.id}">
    <div class="chapter-card-info">
      <div class="chapter-card-name">${ch.name}</div>
      <div class="chapter-card-meta">${total}단어 · ${pct}% 완료</div>
    </div>
    <div class="mini-progress">
      <div class="mini-fill" style="width:${pct}%"></div>
    </div>
  </div>`
}

export function setupHome() {
  document.getElementById('btn-go-review')?.addEventListener('click', () => navigate('review'))
  document.getElementById('btn-see-all')?.addEventListener('click', () => navigate('chapters'))
  document.getElementById('btn-add-chapter')?.addEventListener('click', () => navigate('chapters'))
  document.querySelectorAll('.chapter-card').forEach(el => {
    el.addEventListener('click', () => navigate('chapter-detail', { id: el.dataset.id }))
  })
}
