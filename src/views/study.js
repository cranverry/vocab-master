import { getChapter, getWordData, saveWordData, getUserStats, saveUserStats } from '../modules/storage.js'
import { sm2, isDue, QUALITY } from '../modules/srs.js'
import { addXP, updateStreak, checkBadges, XP } from '../modules/gamification.js'
import { navigate } from '../router.js'
import { showToast } from '../main.js'

let queue = [], idx = 0, flipped = false, mode = '', chapterId = ''
let sessionCorrect = 0, sessionTotal = 0

export function renderStudy({ chapterId: cid, mode: m } = {}) {
  chapterId = cid; mode = m
  const ch = getChapter(cid)
  if (!ch) return `<div class="view"><p>챕터 없음</p></div>`

  // Build queue
  if (m === 'srs') {
    queue = ch.words.filter(w => isDue(getWordData(cid, w.id)))
  } else {
    queue = [...ch.words].sort(() => Math.random() - 0.5)
  }
  idx = 0; sessionCorrect = 0; sessionTotal = 0

  if (queue.length === 0) {
    return `<div class="view study-view">
      <div class="view-header">
        <button class="back-btn" id="btn-back">‹</button>
        <h2>${ch.name}</h2><span></span>
      </div>
      <div class="empty-state"><div style="font-size:3rem">✅</div><p>복습할 단어가 없어요!</p></div>
    </div>`
  }

  return `
<div class="view study-view" id="study-root">
  <div class="view-header">
    <button class="back-btn" id="btn-back">‹</button>
    <h2>${ch.name} · ${modeLabel(m)}</h2>
    <span class="progress-text" id="progress-text">1/${queue.length}</span>
  </div>
  <div class="session-progress-bar">
    <div class="session-progress-fill" id="session-bar" style="width:0%"></div>
  </div>
  <div id="card-area"></div>
</div>`
}

function modeLabel(m) {
  return { flashcard: '플래시카드', typing: '타이핑', srs: 'SRS 복습' }[m] || m
}

export function setupStudy({ chapterId: cid, mode: m } = {}) {
  document.getElementById('btn-back')?.addEventListener('click', () => navigate('chapter-detail', { id: cid }))
  if (queue.length > 0) renderCard()
}

// ── Card Renderer ─────────────────────────────────────────

function renderCard() {
  const area = document.getElementById('card-area')
  if (!area) return
  if (idx >= queue.length) { showSummary(); return }

  const w = queue[idx]
  updateProgressBar()

  if (mode === 'typing') {
    renderTypingCard(area, w)
  } else {
    renderFlashCard(area, w)
  }
}

// ── Flashcard ─────────────────────────────────────────────

function renderFlashCard(area, w) {
  flipped = false
  area.innerHTML = `
  <div class="flashcard-wrap">
    <div class="flashcard" id="fc">
      <div class="fc-front">
        <div class="fc-word">${w.word}</div>
        <div class="fc-hint">탭하여 뒤집기</div>
      </div>
      <div class="fc-back" style="display:none">
        <div class="fc-meaning">${w.meaning}</div>
        ${w.synonym ? `<div class="fc-syn">동의어: ${w.synonym}</div>` : ''}
      </div>
    </div>
    <div class="rating-row" id="rating-row" style="display:none">
      <button class="rating-btn again"  data-q="again">다시<br><small>0xp</small></button>
      <button class="rating-btn hard"   data-q="hard">어려움<br><small>+1xp</small></button>
      <button class="rating-btn good"   data-q="good">좋음<br><small>+5xp</small></button>
      <button class="rating-btn perfect" data-q="perfect">완벽<br><small>+5xp</small></button>
    </div>
  </div>`

  document.getElementById('fc').addEventListener('click', () => {
    if (flipped) return
    flipped = true
    document.querySelector('.fc-front').style.display = 'none'
    document.querySelector('.fc-back').style.display = 'flex'
    document.getElementById('rating-row').style.display = 'flex'
  })

  document.getElementById('rating-row').addEventListener('click', e => {
    const btn = e.target.closest('.rating-btn')
    if (!btn) return
    const q = btn.dataset.q
    const quality = QUALITY[q]
    const xpGain = quality >= 4 ? XP.flashcard_good : XP.flashcard_again
    processResult(w, quality, xpGain, quality >= 3)
  })
}

// ── Typing Card ───────────────────────────────────────────

function renderTypingCard(area, w) {
  area.innerHTML = `
  <div class="typing-wrap">
    <div class="typing-prompt">
      <div class="typing-meaning">${w.meaning}</div>
      ${w.synonym ? `<div class="typing-syn">동의어: ${w.synonym}</div>` : ''}
    </div>
    <div class="typing-input-wrap">
      <input type="text" id="typing-input" placeholder="영단어를 입력하세요..." autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" />
      <button class="hint-btn" id="btn-hint">힌트</button>
    </div>
    <div class="hint-text" id="hint-text"></div>
    <button class="btn-primary" id="btn-check">확인</button>
    <div class="typing-result" id="typing-result" style="display:none"></div>
  </div>`

  const input = document.getElementById('typing-input')
  input.focus()

  let hintLevel = 0
  document.getElementById('btn-hint').addEventListener('click', () => {
    hintLevel++
    const hint = w.word.split('').map((c, i) => i < hintLevel ? c : '_').join(' ')
    document.getElementById('hint-text').textContent = hint
  })

  function check() {
    const answer = input.value.trim().toLowerCase()
    const correct = w.word.toLowerCase()
    const isCorrect = answer === correct

    const resultEl = document.getElementById('typing-result')
    resultEl.style.display = 'block'

    if (isCorrect) {
      resultEl.innerHTML = `<div class="result-correct">✅ 정답! <strong>${w.word}</strong></div>`
      const xpGain = hintLevel === 0 ? XP.typing_correct : XP.typing_hint
      setTimeout(() => processResult(w, QUALITY.good, xpGain, true), 900)
    } else {
      resultEl.innerHTML = `<div class="result-wrong">❌ 오답 — 정답: <strong>${w.word}</strong></div>`
      setTimeout(() => processResult(w, QUALITY.again, XP.typing_wrong, false), 1200)
    }
    document.getElementById('btn-check').disabled = true
    input.disabled = true
  }

  document.getElementById('btn-check').addEventListener('click', check)
  input.addEventListener('keydown', e => { if (e.key === 'Enter') check() })
}

// ── Process Result ────────────────────────────────────────

function processResult(word, quality, xpGain, isCorrect) {
  // Update SRS
  const prev = getWordData(chapterId, word.id)
  const next = sm2(quality, prev)
  saveWordData(chapterId, word.id, next)

  // Update stats
  let stats = getUserStats()
  stats = updateStreak(stats)
  stats = addXP(stats, xpGain)
  stats.totalStudied++
  if (isCorrect) stats.totalCorrect++
  const { stats: s2, earned } = checkBadges(stats)
  saveUserStats(s2)

  if (xpGain > 0) showXPPopup(xpGain)
  earned.forEach(b => showToast(`🏅 뱃지 획득: ${b.icon} ${b.name}`))

  sessionTotal++
  if (isCorrect) sessionCorrect++
  idx++
  renderCard()
}

function showXPPopup(amount) {
  const el = document.createElement('div')
  el.className = 'xp-popup'
  el.textContent = `+${amount} XP`
  document.getElementById('card-area')?.appendChild(el)
  setTimeout(() => el.remove(), 1000)
}

function updateProgressBar() {
  const pct = (idx / queue.length) * 100
  const bar = document.getElementById('session-bar')
  const txt = document.getElementById('progress-text')
  if (bar) bar.style.width = pct + '%'
  if (txt) txt.textContent = `${idx + 1}/${queue.length}`
}

// ── Summary ───────────────────────────────────────────────

function showSummary() {
  const pct = sessionTotal > 0 ? Math.round((sessionCorrect / sessionTotal) * 100) : 0
  const area = document.getElementById('card-area')
  if (!area) return
  area.innerHTML = `
  <div class="summary-card">
    <div class="summary-title">세션 완료! 🎉</div>
    <div class="summary-score">${pct}%</div>
    <div class="summary-detail">${sessionCorrect} / ${sessionTotal} 정답</div>
    <div class="summary-btns">
      <button class="btn-primary" id="btn-again">다시 학습</button>
      <button class="btn-secondary" id="btn-home">홈으로</button>
    </div>
  </div>`

  document.getElementById('btn-again').addEventListener('click', () => {
    navigate('study', { chapterId, mode })
  })
  document.getElementById('btn-home').addEventListener('click', () => navigate('home'))
}
