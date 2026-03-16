import { getChapter, getWordData, saveWordData, getUserStats, saveUserStats } from '../modules/storage.js'
import { sm2, isDue, QUALITY } from '../modules/srs.js'
import { addXP, updateStreak, checkBadges, XP } from '../modules/gamification.js'
import { parseSynonymGroups, matchesItem, normalize } from '../modules/synonymParser.js'
import { navigate } from '../router.js'
import { showToast } from '../main.js'

let queue = [], idx = 0, flipped = false, mode = '', chapterId = ''
let sessionCorrect = 0, sessionTotal = 0

export function renderStudy({ chapterId: cid, mode: m } = {}) {
  chapterId = cid; mode = m
  const ch = getChapter(cid)
  if (!ch) return `<div class="view"><p>챕터 없음</p></div>`

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
  return {
    flashcard: '플래시카드',
    typing: '단어→뜻+동의어',
    triple: '동의어→전체',
    srs: 'SRS 복습',
    copy: '쓰기 연습'
  }[m] || m
}

export function setupStudy({ chapterId: cid, mode: m } = {}) {
  document.getElementById('btn-back')?.addEventListener('click', () => navigate('chapter-detail', { id: cid }))
  if (queue.length > 0) renderCard()
}

function renderCard() {
  const area = document.getElementById('card-area')
  if (!area) return
  if (idx >= queue.length) { showSummary(); return }
  const w = queue[idx]
  updateProgressBar()

  if (mode === 'typing') renderTypingMode(area, w)
  else if (mode === 'triple') renderTripleMode(area, w)
  else if (mode === 'copy') renderCopyCard(area, w)
  else renderFlashCard(area, w)
}

// ────────────────────────────────────────────────────────────
// FLASHCARD
// ────────────────────────────────────────────────────────────

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
      <button class="rating-btn again"  data-q="again">다시<br><small>+1xp</small></button>
      <button class="rating-btn hard"   data-q="hard">어려움<br><small>+1xp</small></button>
      <button class="rating-btn good"   data-q="good">좋음<br><small>+5xp</small></button>
      <button class="rating-btn perfect" data-q="perfect">완벽<br><small>+5xp</small></button>
    </div>
  </div>`

  document.getElementById('fc').addEventListener('click', () => {
    if (flipped) return; flipped = true
    document.querySelector('.fc-front').style.display = 'none'
    document.querySelector('.fc-back').style.display = 'flex'
    document.getElementById('rating-row').style.display = 'grid'
  })
  document.getElementById('rating-row').addEventListener('click', e => {
    const btn = e.target.closest('.rating-btn')
    if (!btn) return
    const q = QUALITY[btn.dataset.q]
    processResult(w, q, q >= 4 ? XP.flashcard_good : XP.flashcard_again, q >= 3)
  })
}

// ────────────────────────────────────────────────────────────
// TYPING MODE 1: 영단어 → 뜻 + 동의어 전부 입력
// ────────────────────────────────────────────────────────────

function renderTypingMode(area, w) {
  const synFlat = parseSynonymGroups(w.synonym).flat()

  const synFieldsHtml = synFlat.map((syn, i) => `
    <div class="test-field" id="tf-${i}">
      <input type="text" class="test-input" id="syn-inp-${i}"
        data-idx="${i}" data-target="${syn.replace(/"/g,'&quot;')}"
        placeholder="동의어 ${i+1}..."
        autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"
        ${i > 0 ? 'disabled' : ''} />
      <span class="field-status" id="syn-st-${i}"></span>
    </div>`).join('')

  area.innerHTML = `
  <div class="test-wrap">
    <div class="test-prompt-card">
      <div class="test-prompt-label">영단어</div>
      <div class="test-prompt-word">${w.word}</div>
    </div>

    <div class="test-section">
      <div class="test-section-label">뜻 입력</div>
      <div class="test-field">
        <input type="text" id="meaning-inp"
          placeholder="뜻을 입력하세요..."
          autocomplete="off" spellcheck="false" />
        <span class="field-status" id="meaning-st"></span>
      </div>
      <button class="btn-check-meaning" id="btn-check-meaning">확인</button>
      <div id="meaning-feedback"></div>
    </div>

    <div class="test-section" id="syn-section" style="display:none">
      <div class="test-section-label">동의어 전부 입력 (${synFlat.length}개)</div>
      ${synFieldsHtml}
    </div>

    <div id="test-done-area" style="display:none">
      <button class="btn-primary" id="btn-next">다음 →</button>
    </div>
  </div>`

  const meaningInp = document.getElementById('meaning-inp')
  meaningInp.focus()

  let meaningCorrect = false
  let synResults = new Array(synFlat.length).fill(false)

  function checkMeaning() {
    const fb = document.getElementById('meaning-feedback')
    meaningCorrect = normalize(meaningInp.value) === normalize(w.meaning)
    meaningInp.disabled = true
    document.getElementById('btn-check-meaning').style.display = 'none'
    document.getElementById('meaning-st').textContent = meaningCorrect ? '✅' : '❌'
    if (!meaningCorrect) {
      fb.innerHTML = `<div class="field-wrong-hint">정답: <strong>${w.meaning}</strong></div>`
    }
    if (synFlat.length > 0) {
      document.getElementById('syn-section').style.display = 'block'
      document.getElementById('syn-inp-0').focus()
    } else {
      finishTest()
    }
  }

  document.getElementById('btn-check-meaning').addEventListener('click', checkMeaning)
  meaningInp.addEventListener('keydown', e => { if (e.key === 'Enter') checkMeaning() })

  // Synonym inputs
  let synDone = 0
  document.querySelectorAll('.test-input').forEach(input => {
    input.addEventListener('keydown', e => { if (e.key === 'Enter') checkSyn(input) })
    input.addEventListener('input', () => {
      if (matchesItem(input.value, input.dataset.target)) checkSyn(input)
    })
  })

  function checkSyn(input) {
    const i = parseInt(input.dataset.idx)
    const isCorrect = matchesItem(input.value, input.dataset.target)
    synResults[i] = isCorrect
    input.disabled = true
    const st = document.getElementById(`syn-st-${i}`)
    if (isCorrect) {
      st.textContent = '✅'
      input.classList.add('inp-correct')
    } else {
      st.innerHTML = `❌ <small>${input.dataset.target}</small>`
      input.classList.add('inp-wrong')
    }
    synDone++
    const next = document.getElementById(`syn-inp-${i + 1}`)
    if (next) { next.disabled = false; next.focus() }
    else finishTest()
  }

  function finishTest() {
    const allSynCorrect = synResults.every(Boolean)
    const allCorrect = meaningCorrect && (synFlat.length === 0 || allSynCorrect)
    document.getElementById('test-done-area').style.display = 'block'
    document.getElementById('btn-next').textContent =
      allCorrect ? '✅ 정답! 다음 →' : '❌ 오답 — 다음 →'
    document.getElementById('btn-next').addEventListener('click', () => {
      const q = allCorrect ? QUALITY.good : QUALITY.again
      processResult(w, q, allCorrect ? XP.typing_correct : XP.typing_wrong, allCorrect)
    })
  }
}

// ────────────────────────────────────────────────────────────
// TRIPLE MODE: 동의어 1개 → 영단어 + 뜻 + 나머지 동의어 전부
// ────────────────────────────────────────────────────────────

function renderTripleMode(area, w) {
  const allSyns = parseSynonymGroups(w.synonym).flat()
  const promptSyn = allSyns.length > 0
    ? allSyns[Math.floor(Math.random() * allSyns.length)]
    : null
  const remainingSyns = allSyns.filter(s => s !== promptSyn)

  if (!promptSyn) {
    // 동의어 없으면 typing mode로 대체
    renderTypingMode(area, w)
    return
  }

  const remFieldsHtml = remainingSyns.map((syn, i) => `
    <div class="test-field" id="rtf-${i}">
      <input type="text" class="test-input rem-input" id="rem-inp-${i}"
        data-idx="${i}" data-target="${syn.replace(/"/g,'&quot;')}"
        placeholder="동의어 ${i+1}..."
        autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"
        ${i > 0 ? 'disabled' : ''} />
      <span class="field-status" id="rem-st-${i}"></span>
    </div>`).join('')

  area.innerHTML = `
  <div class="test-wrap">
    <div class="test-prompt-card">
      <div class="test-prompt-label">동의어</div>
      <div class="test-prompt-word">${promptSyn}</div>
    </div>

    <div class="test-section">
      <div class="test-section-label">영단어 입력</div>
      <div class="test-field">
        <input type="text" id="word-inp"
          placeholder="영단어..."
          autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" />
        <span class="field-status" id="word-st"></span>
      </div>
    </div>

    <div class="test-section" id="meaning-section" style="display:none">
      <div class="test-section-label">뜻 입력</div>
      <div class="test-field">
        <input type="text" id="meaning-inp2"
          placeholder="뜻을 입력하세요..."
          autocomplete="off" spellcheck="false" />
        <span class="field-status" id="meaning-st2"></span>
      </div>
      <button class="btn-check-meaning" id="btn-check-meaning2">확인</button>
      <div id="meaning-feedback2"></div>
    </div>

    ${remainingSyns.length > 0 ? `
    <div class="test-section" id="rem-section" style="display:none">
      <div class="test-section-label">나머지 동의어 전부 입력 (${remainingSyns.length}개)</div>
      ${remFieldsHtml}
    </div>` : ''}

    <div id="test-done-area" style="display:none">
      <button class="btn-primary" id="btn-next">다음 →</button>
    </div>
  </div>`

  let wordCorrect = false, meaningCorrect = false
  let remResults = new Array(remainingSyns.length).fill(false)

  // ── Word input ──
  const wordInp = document.getElementById('word-inp')
  wordInp.focus()

  function checkWord() {
    wordCorrect = normalize(wordInp.value) === normalize(w.word)
    wordInp.disabled = true
    document.getElementById('word-st').textContent = wordCorrect ? '✅' : `❌`
    if (!wordCorrect) {
      document.getElementById('word-st').innerHTML = `❌ <small>${w.word}</small>`
    }
    document.getElementById('meaning-section').style.display = 'block'
    document.getElementById('meaning-inp2').focus()
  }

  wordInp.addEventListener('input', () => {
    if (normalize(wordInp.value) === normalize(w.word)) checkWord()
  })
  wordInp.addEventListener('keydown', e => { if (e.key === 'Enter') checkWord() })

  // ── Meaning input ──
  function checkMeaning() {
    const inp = document.getElementById('meaning-inp2')
    meaningCorrect = normalize(inp.value) === normalize(w.meaning)
    inp.disabled = true
    document.getElementById('btn-check-meaning2').style.display = 'none'
    document.getElementById('meaning-st2').textContent = meaningCorrect ? '✅' : '❌'
    if (!meaningCorrect) {
      document.getElementById('meaning-feedback2').innerHTML =
        `<div class="field-wrong-hint">정답: <strong>${w.meaning}</strong></div>`
    }
    if (remainingSyns.length > 0) {
      document.getElementById('rem-section').style.display = 'block'
      document.getElementById('rem-inp-0').focus()
    } else {
      finishTest()
    }
  }

  document.getElementById('btn-check-meaning2').addEventListener('click', checkMeaning)
  document.getElementById('meaning-inp2').addEventListener('keydown', e => {
    if (e.key === 'Enter') checkMeaning()
  })

  // ── Remaining synonyms ──
  let remDone = 0
  document.querySelectorAll('.rem-input').forEach(input => {
    input.addEventListener('input', () => {
      if (matchesItem(input.value, input.dataset.target)) checkRem(input)
    })
    input.addEventListener('keydown', e => { if (e.key === 'Enter') checkRem(input) })
  })

  function checkRem(input) {
    const i = parseInt(input.dataset.idx)
    const isCorrect = matchesItem(input.value, input.dataset.target)
    remResults[i] = isCorrect
    input.disabled = true
    const st = document.getElementById(`rem-st-${i}`)
    if (isCorrect) {
      st.textContent = '✅'; input.classList.add('inp-correct')
    } else {
      st.innerHTML = `❌ <small>${input.dataset.target}</small>`
      input.classList.add('inp-wrong')
    }
    remDone++
    const next = document.getElementById(`rem-inp-${i + 1}`)
    if (next) { next.disabled = false; next.focus() }
    else finishTest()
  }

  function finishTest() {
    const allCorrect = wordCorrect && meaningCorrect &&
      (remainingSyns.length === 0 || remResults.every(Boolean))
    document.getElementById('test-done-area').style.display = 'block'
    document.getElementById('btn-next').textContent =
      allCorrect ? '✅ 정답! 다음 →' : '❌ 오답 — 다음 →'
    document.getElementById('btn-next').addEventListener('click', () => {
      const q = allCorrect ? QUALITY.good : QUALITY.again
      processResult(w, q, allCorrect ? XP.typing_correct : XP.typing_wrong, allCorrect)
    })
  }
}

// ────────────────────────────────────────────────────────────
// COPY PRACTICE: 보면서 단어 + 동의어 순차 타이핑
// ────────────────────────────────────────────────────────────

function renderCopyCard(area, w) {
  const groups = parseSynonymGroups(w.synonym)
  const items = []
  groups.forEach((group, gi) => {
    group.forEach((item, ii) => {
      items.push({ groupIdx: gi, itemIdx: ii, target: item,
        inputId: `syn-input-${gi}-${ii}`, charsId: `syn-chars-${gi}-${ii}` })
    })
  })

  const synStepHtml = items.length > 0 ? `
    <div class="copy-step copy-step-syn" id="copy-step-syn" style="display:none">
      <div class="copy-step-label">Step 2 — 동의어 타이핑 (총 ${items.length}개)</div>
      ${groups.map((group, gi) => `
        <div class="copy-syn-group">
          ${groups.length > 1 ? `<div class="copy-group-label">그룹 ${gi + 1}</div>` : ''}
          ${group.map((item, ii) => `
            <div class="copy-item-wrap" id="item-wrap-${gi}-${ii}">
              <div class="copy-chars" id="syn-chars-${gi}-${ii}">
                ${item.split('').map(c => `<span class="copy-char">${c}</span>`).join('')}
              </div>
              <div class="copy-input-row">
                <input type="text" class="syn-input"
                  id="syn-input-${gi}-${ii}"
                  data-gi="${gi}" data-ii="${ii}"
                  placeholder="${item}"
                  autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"
                  disabled />
                <span class="item-check" id="item-check-${gi}-${ii}"></span>
              </div>
            </div>`).join('')}
        </div>`).join('')}
    </div>` : ''

  area.innerHTML = `
  <div class="copy-wrap">
    <div class="copy-ref-card">
      <div class="copy-ref-row"><span class="copy-ref-label">단어</span><span class="copy-ref-val en">${w.word}</span></div>
      <div class="copy-ref-row"><span class="copy-ref-label">뜻</span><span class="copy-ref-val">${w.meaning}</span></div>
      ${items.length > 0 ? `<div class="copy-ref-row"><span class="copy-ref-label">동의어</span><span class="copy-ref-val">${w.synonym}</span></div>` : ''}
    </div>
    <div class="copy-step" id="copy-step-word">
      <div class="copy-step-label">Step 1 — 영단어 타이핑</div>
      <div class="copy-chars" id="word-chars">
        ${w.word.split('').map(c => `<span class="copy-char">${c}</span>`).join('')}
      </div>
      <div class="copy-input-wrap">
        <input type="text" id="word-input" placeholder="${w.word}"
          autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" />
      </div>
    </div>
    ${synStepHtml}
  </div>`

  const wordInput = document.getElementById('word-input')
  wordInput.focus()

  wordInput.addEventListener('input', () => {
    updateCharFeedback('word-chars', wordInput.value, w.word)
    if (normalize(wordInput.value) === normalize(w.word)) {
      wordInput.classList.add('copy-done'); wordInput.disabled = true
      if (items.length > 0) {
        setTimeout(() => {
          document.getElementById('copy-step-syn').style.display = 'block'
          activateCopyItem(0)
        }, 400)
      } else {
        setTimeout(() => processResult(w, QUALITY.good, XP.typing_correct, true), 600)
      }
    }
  })

  let currentItemIdx = 0
  function activateCopyItem(idx) {
    if (idx >= items.length) {
      setTimeout(() => processResult(w, QUALITY.good, XP.typing_correct, true), 700)
      return
    }
    const { inputId } = items[idx]
    const input = document.getElementById(inputId)
    if (input) { input.disabled = false; input.focus() }
  }

  document.querySelectorAll('.syn-input').forEach(input => {
    input.addEventListener('input', () => {
      const gi = parseInt(input.dataset.gi), ii = parseInt(input.dataset.ii)
      const flatIdx = items.findIndex(it => it.groupIdx === gi && it.itemIdx === ii)
      const { target, charsId } = items[flatIdx]
      updateCharFeedback(charsId, input.value, target)
      if (matchesItem(input.value, target)) {
        input.classList.add('copy-done'); input.disabled = true
        document.getElementById(`item-check-${gi}-${ii}`).textContent = '✅'
        currentItemIdx = flatIdx + 1
        activateCopyItem(currentItemIdx)
      }
    })
  })
}

function updateCharFeedback(charsId, val, target) {
  const chars = document.querySelectorAll(`#${charsId} .copy-char`)
  chars.forEach((span, i) => {
    span.classList.remove('correct', 'wrong', 'pending')
    if (i < val.length) span.classList.add(val[i].toLowerCase() === target[i]?.toLowerCase() ? 'correct' : 'wrong')
    else span.classList.add('pending')
  })
}

// ────────────────────────────────────────────────────────────
// PROCESS RESULT
// ────────────────────────────────────────────────────────────

function processResult(word, quality, xpGain, isCorrect) {
  const prev = getWordData(chapterId, word.id)
  const next = sm2(quality, prev)
  saveWordData(chapterId, word.id, next)

  let stats = getUserStats()
  stats = updateStreak(stats)
  stats = addXP(stats, xpGain)
  stats.totalStudied++
  if (isCorrect) stats.totalCorrect++
  const { stats: s2, earned } = checkBadges(stats)
  saveUserStats(s2)

  if (xpGain > 0) showXPPopup(xpGain)
  earned.forEach(b => showToast(`🏅 뱃지: ${b.icon} ${b.name}`))

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
  document.getElementById('btn-again').addEventListener('click', () => navigate('study', { chapterId, mode }))
  document.getElementById('btn-home').addEventListener('click', () => navigate('home'))
}
