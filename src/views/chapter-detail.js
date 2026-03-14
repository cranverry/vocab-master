import { getChapter, getAllWordData } from '../modules/storage.js'
import { masteryLabel, masteryColor, isDue } from '../modules/srs.js'
import { navigate } from '../router.js'

export function renderChapterDetail({ id } = {}) {
  const ch = getChapter(id)
  if (!ch) return `<div class="view"><p>챕터를 찾을 수 없어요</p></div>`
  const wd = getAllWordData(id)

  const total    = ch.words.length
  const mastered = ch.words.filter(w => wd[w.id]?.mastery === 'mastered').length
  const due      = ch.words.filter(w => isDue(wd[w.id])).length
  const pct      = total > 0 ? Math.round((mastered / total) * 100) : 0

  return `
<div class="view detail-view">
  <div class="view-header">
    <button class="back-btn" id="btn-back">‹</button>
    <h2>${ch.name}</h2>
    <span></span>
  </div>

  <div class="detail-stats">
    <div class="dstat">
      <div class="dstat-num">${total}</div>
      <div class="dstat-label">전체</div>
    </div>
    <div class="dstat">
      <div class="dstat-num" style="color:#22c55e">${mastered}</div>
      <div class="dstat-label">완료</div>
    </div>
    <div class="dstat">
      <div class="dstat-num" style="color:#f59e0b">${due}</div>
      <div class="dstat-label">복습 필요</div>
    </div>
    <div class="dstat">
      <div class="dstat-num">${pct}%</div>
      <div class="dstat-label">마스터</div>
    </div>
  </div>

  <div class="progress-bar-wrap">
    <div class="progress-bar-fill" style="width:${pct}%"></div>
  </div>

  <div class="study-btns">
    <button class="study-btn flashcard" data-mode="flashcard" data-id="${id}">
      <span>🃏</span><span>플래시카드</span>
    </button>
    <button class="study-btn copy" data-mode="copy" data-id="${id}">
      <span>✍️</span><span>쓰기 연습 (보면서 타이핑)</span>
    </button>
    <button class="study-btn triple" data-mode="triple" data-id="${id}">
      <span>🎯</span><span>3방향 테스트 (단어↔뜻↔동의어)</span>
    </button>
    <button class="study-btn typing" data-mode="typing" data-id="${id}">
      <span>⌨️</span><span>타이핑 테스트 (뜻→단어)</span>
    </button>
    <button class="study-btn srs ${due === 0 ? 'disabled' : ''}" data-mode="srs" data-id="${id}" ${due === 0 ? 'disabled' : ''}>
      <span>🔄</span><span>SRS 복습 ${due > 0 ? `(${due})` : '(없음)'}</span>
    </button>
  </div>

  <div class="word-list">
    ${ch.words.map(w => {
      const d = wd[w.id] || {}
      const ml = masteryLabel(d.mastery)
      const mc = masteryColor(d.mastery)
      return `
      <div class="word-item">
        <div class="word-item-main">
          <div class="word-en">${w.word}</div>
          <div class="word-ko">${w.meaning}</div>
          ${w.synonym ? `<div class="word-syn">= ${w.synonym}</div>` : ''}
        </div>
        <div class="mastery-dot" style="background:${mc}" title="${ml}"></div>
      </div>`
    }).join('')}
  </div>
</div>`
}

export function setupChapterDetail({ id } = {}) {
  document.getElementById('btn-back')?.addEventListener('click', () => navigate('chapters'))
  document.querySelectorAll('.study-btn:not(.disabled)').forEach(btn => {
    btn.addEventListener('click', () => {
      navigate('study', { chapterId: btn.dataset.id, mode: btn.dataset.mode })
    })
  })
}
