import { getChapters, getWordData, saveWordData, getUserStats, saveUserStats } from '../modules/storage.js'
import { sm2, isDue, QUALITY } from '../modules/srs.js'
import { addXP, updateStreak, checkBadges, XP } from '../modules/gamification.js'
import { navigate } from '../router.js'
import { showToast } from '../main.js'

// Cross-chapter SRS review (all due words)
let queue = [], idx = 0, flipped = false, sessionCorrect = 0, sessionTotal = 0

export function renderReview() {
  const chapters = getChapters()
  const all = []
  for (const ch of chapters) {
    for (const w of ch.words) {
      const wd = getWordData(ch.id, w.id)
      if (isDue(wd)) all.push({ ...w, chapterId: ch.id, chapterName: ch.name })
    }
  }
  queue = all.sort(() => Math.random() - 0.5)
  idx = 0; sessionCorrect = 0; sessionTotal = 0

  if (queue.length === 0) {
    return `<div class="view review-view">
      <div class="view-header"><h2>전체 복습</h2><span></span></div>
      <div class="empty-state">
        <div style="font-size:3rem">🎉</div>
        <p>복습할 단어가 없어요!<br>모두 완료했습니다.</p>
        <button class="btn-primary" id="btn-go-chapters">챕터 추가</button>
      </div>
    </div>`
  }

  return `
<div class="view review-view" id="review-root">
  <div class="view-header">
    <h2>전체 복습</h2>
    <span class="progress-text" id="progress-text">1/${queue.length}</span>
  </div>
  <div class="session-progress-bar">
    <div class="session-progress-fill" id="session-bar" style="width:0%"></div>
  </div>
  <div id="review-chapter-label" class="chapter-label"></div>
  <div id="card-area"></div>
</div>`
}

export function setupReview() {
  document.getElementById('btn-go-chapters')?.addEventListener('click', () => navigate('chapters'))
  if (queue.length > 0) renderCard()
}

function renderCard() {
  const area = document.getElementById('card-area')
  if (!area) return
  if (idx >= queue.length) { showSummary(); return }

  const w = queue[idx]
  const label = document.getElementById('review-chapter-label')
  if (label) label.textContent = `📚 ${w.chapterName}`

  updateBar()

  // Alternate flashcard / typing randomly
  if (Math.random() > 0.4) renderFlash(area, w)
  else renderTyping(area, w)
}

function renderFlash(area, w) {
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
      <button class="rating-btn again"  data-q="again">다시</button>
      <button class="rating-btn hard"   data-q="hard">어려움</button>
      <button class="rating-btn good"   data-q="good">좋음</button>
      <button class="rating-btn perfect" data-q="perfect">완벽</button>
    </div>
  </div>`

  document.getElementById('fc').addEventListener('click', () => {
    if (flipped) return; flipped = true
    document.querySelector('.fc-front').style.display = 'none'
    document.querySelector('.fc-back').style.display = 'flex'
    document.getElementById('rating-row').style.display = 'flex'
  })
  document.getElementById('rating-row').addEventListener('click', e => {
    const btn = e.target.closest('.rating-btn')
    if (!btn) return
    const q = btn.dataset.q
    processResult(w, QUALITY[q], QUALITY[q] >= 4 ? XP.flashcard_good : XP.flashcard_again, QUALITY[q] >= 3)
  })
}

function renderTyping(area, w) {
  area.innerHTML = `
  <div class="typing-wrap">
    <div class="typing-prompt">
      <div class="typing-meaning">${w.meaning}</div>
      ${w.synonym ? `<div class="typing-syn">동의어: ${w.synonym}</div>` : ''}
    </div>
    <div class="typing-input-wrap">
      <input type="text" id="typing-input" placeholder="영단어 입력..." autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"/>
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
    document.getElementById('hint-text').textContent = w.word.split('').map((c,i) => i < hintLevel ? c : '_').join(' ')
  })
  function check() {
    const isCorrect = input.value.trim().toLowerCase() === w.word.toLowerCase()
    const resultEl = document.getElementById('typing-result')
    resultEl.style.display = 'block'
    if (isCorrect) {
      resultEl.innerHTML = `<div class="result-correct">✅ 정답! <strong>${w.word}</strong></div>`
      const xp = hintLevel === 0 ? XP.typing_correct : XP.typing_hint
      setTimeout(() => processResult(w, QUALITY.good, xp, true), 900)
    } else {
      resultEl.innerHTML = `<div class="result-wrong">❌ 정답: <strong>${w.word}</strong></div>`
      setTimeout(() => processResult(w, QUALITY.again, XP.typing_wrong, false), 1200)
    }
    document.getElementById('btn-check').disabled = true
    input.disabled = true
  }
  document.getElementById('btn-check').addEventListener('click', check)
  input.addEventListener('keydown', e => { if (e.key === 'Enter') check() })
}

function processResult(word, quality, xpGain, isCorrect) {
  const prev = getWordData(word.chapterId, word.id)
  const next = sm2(quality, prev)
  saveWordData(word.chapterId, word.id, next)

  let stats = getUserStats()
  stats = updateStreak(stats)
  stats = addXP(stats, xpGain)
  stats.totalStudied++
  if (isCorrect) stats.totalCorrect++
  const { stats: s2, earned } = checkBadges(stats)
  saveUserStats(s2)
  earned.forEach(b => showToast(`🏅 뱃지: ${b.icon} ${b.name}`))

  sessionTotal++
  if (isCorrect) sessionCorrect++
  idx++
  renderCard()
}

function updateBar() {
  const pct = (idx / queue.length) * 100
  const bar = document.getElementById('session-bar')
  const txt = document.getElementById('progress-text')
  if (bar) bar.style.width = pct + '%'
  if (txt) txt.textContent = `${idx + 1}/${queue.length}`
}

function showSummary() {
  const pct = sessionTotal > 0 ? Math.round((sessionCorrect / sessionTotal) * 100) : 0
  const area = document.getElementById('card-area')
  if (!area) return
  area.innerHTML = `
  <div class="summary-card">
    <div class="summary-title">복습 완료! 🎉</div>
    <div class="summary-score">${pct}%</div>
    <div class="summary-detail">${sessionCorrect} / ${sessionTotal} 정답</div>
    <div class="summary-btns">
      <button class="btn-primary" id="btn-again">다시 복습</button>
      <button class="btn-secondary" id="btn-home">홈으로</button>
    </div>
  </div>`
  document.getElementById('btn-again')?.addEventListener('click', () => navigate('review'))
  document.getElementById('btn-home')?.addEventListener('click', () => navigate('home'))
}
