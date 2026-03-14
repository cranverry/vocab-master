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
  return { flashcard: '플래시카드', typing: '타이핑', srs: 'SRS 복습', triple: '3방향 테스트', copy: '쓰기 연습' }[m] || m
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
  } else if (mode === 'triple') {
    renderTripleCard(area, w)
  } else if (mode === 'copy') {
    renderCopyCard(area, w)
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
// Randomly picks one of two question types per card:
//   T1: 뜻 보여주고 → 단어 타이핑 + 동의어 1개 타이핑
//   T2: 동의어 1개 보여주고 → 단어 타이핑 + 뜻 자가평가

function renderTypingCard(area, w) {
  const oneSyn = pickOneSynonym(w)
  // If no synonym, always use T1
  const useT2 = oneSyn && Math.random() > 0.5
  if (useT2) renderTypingT2(area, w, oneSyn)
  else renderTypingT1(area, w, oneSyn)
}

// T1: 뜻 → 단어 타이핑 + 동의어 1개 타이핑
function renderTypingT1(area, w, oneSyn) {
  area.innerHTML = `
  <div class="typing-wrap">
    <div class="typing-prompt">
      <div class="t-badge">뜻 → 단어 + 동의어</div>
      <div class="typing-meaning">${w.meaning}</div>
    </div>

    <div class="typing-step" id="t1-step-word">
      <div class="step-label">영단어 타이핑</div>
      <div class="typing-input-wrap">
        <input type="text" id="t1-word-input" placeholder="영단어..." autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"/>
        <button class="hint-btn" id="btn-hint">힌트</button>
      </div>
      <div class="hint-text" id="hint-text"></div>
      <div class="typing-result" id="t1-word-result"></div>
    </div>

    ${oneSyn ? `
    <div class="typing-step" id="t1-step-syn" style="display:none">
      <div class="step-label">동의어 타이핑 (1개)</div>
      <div class="typing-input-wrap">
        <input type="text" id="t1-syn-input" placeholder="동의어..." autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"/>
      </div>
      <div class="typing-result" id="t1-syn-result"></div>
      <button class="btn-primary" id="btn-t1-check" style="margin-top:8px">확인</button>
    </div>` : `
    <button class="btn-primary" id="btn-t1-check-notsyn" style="display:none;margin-top:8px">다음</button>`}
  </div>`

  const wordInput = document.getElementById('t1-word-input')
  wordInput.focus()
  let hintLevel = 0

  document.getElementById('btn-hint').addEventListener('click', () => {
    hintLevel++
    document.getElementById('hint-text').textContent =
      w.word.split('').map((c, i) => i < hintLevel ? c : '_').join(' ')
  })

  function checkWord() {
    const isCorrect = normalize(wordInput.value) === normalize(w.word)
    const res = document.getElementById('t1-word-result')
    if (isCorrect) {
      res.innerHTML = `<div class="result-correct">✅ <strong>${w.word}</strong></div>`
      wordInput.disabled = true
      if (oneSyn) {
        document.getElementById('t1-step-syn').style.display = 'block'
        document.getElementById('t1-syn-input').focus()
      } else {
        const btn = document.getElementById('btn-t1-check-notsyn')
        if (btn) { btn.style.display = 'block' }
        else { setTimeout(() => processResult(w, QUALITY.good, hintLevel === 0 ? XP.typing_correct : XP.typing_hint, true), 700) }
      }
    } else {
      res.innerHTML = `<div class="result-wrong">❌ 정답: <strong>${w.word}</strong></div>`
      wordInput.disabled = true
      if (oneSyn) {
        document.getElementById('t1-step-syn').style.display = 'block'
        document.getElementById('t1-syn-input').focus()
      }
      // Mark as wrong for SRS regardless
      if (!oneSyn) setTimeout(() => processResult(w, QUALITY.again, XP.typing_wrong, false), 800)
    }
  }

  wordInput.addEventListener('keydown', e => { if (e.key === 'Enter') checkWord() })
  document.getElementById('btn-hint')?.addEventListener('click', () => {})

  // Auto-check on correct match while typing
  wordInput.addEventListener('input', () => {
    if (normalize(wordInput.value) === normalize(w.word)) checkWord()
  })

  if (oneSyn) {
    const synInput = document.getElementById('t1-syn-input')
    let wordCorrect = false

    // Re-evaluate after word step
    const origCheck = checkWord
    wordInput.addEventListener('input', () => {
      wordCorrect = normalize(wordInput.value) === normalize(w.word)
    })

    document.getElementById('btn-t1-check').addEventListener('click', () => {
      const synCorrect = matchesItem(synInput.value, oneSyn)
      const res = document.getElementById('t1-syn-result')
      if (synCorrect) {
        res.innerHTML = `<div class="result-correct">✅ <strong>${oneSyn}</strong></div>`
      } else {
        res.innerHTML = `<div class="result-wrong">❌ 정답: <strong>${oneSyn}</strong></div>`
      }
      synInput.disabled = true
      document.getElementById('btn-t1-check').disabled = true
      const wordWasCorrect = normalize(document.getElementById('t1-word-result').textContent).includes(w.word.toLowerCase()) &&
        !document.getElementById('t1-word-result').innerHTML.includes('result-wrong')
      const bothCorrect = wordWasCorrect && synCorrect
      const xp = bothCorrect ? (hintLevel === 0 ? XP.typing_correct : XP.typing_hint) : XP.typing_wrong
      setTimeout(() => processResult(w, bothCorrect ? QUALITY.good : QUALITY.again, xp, bothCorrect), 900)
    })

    synInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') document.getElementById('btn-t1-check').click()
    })
  }

  document.getElementById('btn-t1-check-notsyn')?.addEventListener('click', () => {
    processResult(w, QUALITY.good, hintLevel === 0 ? XP.typing_correct : XP.typing_hint, true)
  })
}

// T2: 동의어 1개 → 단어 타이핑 + 뜻 자가평가
function renderTypingT2(area, w, oneSyn) {
  area.innerHTML = `
  <div class="typing-wrap">
    <div class="typing-prompt">
      <div class="t-badge">동의어 → 단어 + 뜻</div>
      <div class="typing-meaning">${oneSyn}</div>
    </div>

    <div class="typing-step">
      <div class="step-label">영단어 타이핑</div>
      <div class="typing-input-wrap">
        <input type="text" id="t2-word-input" placeholder="영단어..." autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"/>
        <button class="hint-btn" id="btn-hint">힌트</button>
      </div>
      <div class="hint-text" id="hint-text"></div>
      <div class="typing-result" id="t2-word-result"></div>
    </div>

    <div class="typing-step" id="t2-step-meaning" style="display:none">
      <div class="step-label">뜻 — 알고 있었나요?</div>
      <button class="reveal-btn" id="btn-reveal-meaning">뜻 확인하기</button>
      <div class="meaning-text" id="t2-meaning-text" style="display:none">${w.meaning}</div>
    </div>

    <div class="rating-row" id="rating-row" style="display:none">
      <button class="rating-btn again"  data-q="again">몰랐음</button>
      <button class="rating-btn hard"   data-q="hard">어렴풋이</button>
      <button class="rating-btn good"   data-q="good">알았음</button>
      <button class="rating-btn perfect" data-q="perfect">완벽</button>
    </div>
  </div>`

  const input = document.getElementById('t2-word-input')
  input.focus()
  let hintLevel = 0
  let wordCorrect = false

  document.getElementById('btn-hint').addEventListener('click', () => {
    hintLevel++
    document.getElementById('hint-text').textContent =
      w.word.split('').map((c, i) => i < hintLevel ? c : '_').join(' ')
  })

  function checkWord() {
    wordCorrect = normalize(input.value) === normalize(w.word)
    const res = document.getElementById('t2-word-result')
    if (wordCorrect) {
      res.innerHTML = `<div class="result-correct">✅ <strong>${w.word}</strong></div>`
    } else {
      res.innerHTML = `<div class="result-wrong">❌ 정답: <strong>${w.word}</strong></div>`
    }
    input.disabled = true
    document.getElementById('t2-step-meaning').style.display = 'block'
  }

  input.addEventListener('input', () => {
    if (normalize(input.value) === normalize(w.word)) checkWord()
  })
  input.addEventListener('keydown', e => { if (e.key === 'Enter') checkWord() })

  document.getElementById('btn-reveal-meaning').addEventListener('click', () => {
    document.getElementById('btn-reveal-meaning').style.display = 'none'
    document.getElementById('t2-meaning-text').style.display = 'block'
    document.getElementById('rating-row').style.display = 'grid'
  })

  document.getElementById('rating-row').addEventListener('click', e => {
    const btn = e.target.closest('.rating-btn')
    if (!btn) return
    const q = QUALITY[btn.dataset.q]
    const finalCorrect = wordCorrect && q >= 3
    processResult(w, wordCorrect ? q : QUALITY.again,
      finalCorrect ? (hintLevel === 0 ? XP.typing_correct : XP.typing_hint) : XP.typing_wrong,
      finalCorrect)
  })
}

// ── Triple Mode (3-direction) ─────────────────────────────
//
// A. 단어 → 뜻+동의어   : 단어 보여줌 → 뜻 자가평가 + 동의어 타이핑
// B. 뜻  → 단어+동의어   : 뜻  보여줌 → 단어 타이핑 + 동의어 자가평가
// C. 동의어 → 단어+뜻    : 동의어 1개 보여줌 → 단어 타이핑 + 뜻 자가평가

const TRIPLE_TYPES = ['word2meaning', 'meaning2word', 'synonym2both']

function pickOneSynonym(w) {
  const groups = parseSynonymGroups(w.synonym)
  const flat = groups.flat()
  if (!flat.length) return null
  return flat[Math.floor(Math.random() * flat.length)]
}

function renderTripleCard(area, w) {
  const qType = TRIPLE_TYPES[idx % 3]
  // Always pick ONE synonym for this card
  const oneSyn = pickOneSynonym(w)

  if (qType === 'word2meaning') {
    renderTripleA(area, w, oneSyn)
  } else if (qType === 'meaning2word') {
    renderTripleB(area, w, oneSyn)
  } else {
    if (!oneSyn) renderTripleB(area, w, null)
    else renderTripleC(area, w, oneSyn)
  }
}

// A: 단어 → 뜻(자가평가) + 동의어 1개(타이핑)
function renderTripleA(area, w, oneSyn) {
  area.innerHTML = `
  <div class="triple-wrap">
    <div class="triple-type-badge">단어 → 뜻 + 동의어</div>
    <div class="triple-prompt-card">
      <div class="triple-prompt-label">단어</div>
      <div class="fc-word">${w.word}</div>
    </div>

    <div class="triple-section">
      <div class="triple-section-label">뜻 — 알고 있었나요?</div>
      <button class="reveal-btn" id="btn-reveal-meaning">뜻 확인하기</button>
      <div class="meaning-text" id="meaning-text" style="display:none">${w.meaning}</div>
    </div>

    ${oneSyn ? `
    <div class="triple-section" id="syn-section" style="display:none">
      <div class="triple-section-label">동의어 타이핑 (1개)</div>
      <div class="copy-chars" id="ta-chars">
        ${oneSyn.split('').map(c => `<span class="copy-char">${c}</span>`).join('')}
      </div>
      <div class="copy-input-wrap">
        <input type="text" id="ta-input" placeholder="${oneSyn}"
          autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"/>
      </div>
    </div>` : ''}

    <div class="rating-row" id="rating-row" style="display:none">
      <button class="rating-btn again"  data-q="again">몰랐음</button>
      <button class="rating-btn hard"   data-q="hard">어렴풋이</button>
      <button class="rating-btn good"   data-q="good">알았음</button>
      <button class="rating-btn perfect" data-q="perfect">완벽</button>
    </div>
  </div>`

  document.getElementById('btn-reveal-meaning').addEventListener('click', () => {
    document.getElementById('btn-reveal-meaning').style.display = 'none'
    document.getElementById('meaning-text').style.display = 'block'
    if (oneSyn) {
      document.getElementById('syn-section').style.display = 'block'
      document.getElementById('ta-input')?.focus()
    } else {
      document.getElementById('rating-row').style.display = 'grid'
    }
  })

  if (oneSyn) {
    document.getElementById('ta-input').addEventListener('input', e => {
      updateCharFeedback('ta-chars', e.target.value, oneSyn)
      if (matchesItem(e.target.value, oneSyn)) {
        e.target.classList.add('copy-done'); e.target.disabled = true
        document.getElementById('rating-row').style.display = 'grid'
      }
    })
  }

  document.getElementById('rating-row').addEventListener('click', e => {
    const btn = e.target.closest('.rating-btn')
    if (!btn) return
    const q = QUALITY[btn.dataset.q]
    processResult(w, q, q >= 4 ? XP.flashcard_good : XP.flashcard_again, q >= 3)
  })
}

// B: 뜻 → 단어(타이핑) + 동의어 1개(자가평가)
function renderTripleB(area, w, oneSyn) {
  area.innerHTML = `
  <div class="triple-wrap">
    <div class="triple-type-badge">뜻 → 단어 + 동의어</div>
    <div class="triple-prompt-card">
      <div class="triple-prompt-label">뜻</div>
      <div class="fc-meaning">${w.meaning}</div>
    </div>

    <div class="triple-section">
      <div class="triple-section-label">영단어 타이핑</div>
      <div class="copy-chars" id="b-chars">
        ${w.word.split('').map(c => `<span class="copy-char">${c}</span>`).join('')}
      </div>
      <div class="copy-input-wrap">
        <input type="text" id="b-word-input" placeholder="${w.word}"
          autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"/>
      </div>
    </div>

    ${oneSyn ? `
    <div class="triple-section" id="b-syn-section" style="display:none">
      <div class="triple-section-label">동의어 (1개) — 알고 있었나요?</div>
      <button class="reveal-btn" id="btn-reveal-syn">동의어 확인하기</button>
      <div class="meaning-text" id="syn-reveal-text" style="display:none">${oneSyn}</div>
    </div>` : ''}

    <div class="rating-row" id="rating-row" style="display:none">
      <button class="rating-btn again"  data-q="again">몰랐음</button>
      <button class="rating-btn hard"   data-q="hard">어렴풋이</button>
      <button class="rating-btn good"   data-q="good">알았음</button>
      <button class="rating-btn perfect" data-q="perfect">완벽</button>
    </div>
  </div>`

  const input = document.getElementById('b-word-input')
  input.focus()
  input.addEventListener('input', () => {
    updateCharFeedback('b-chars', input.value, w.word)
    if (normalize(input.value) === normalize(w.word)) {
      input.classList.add('copy-done'); input.disabled = true
      if (oneSyn) document.getElementById('b-syn-section').style.display = 'block'
      else document.getElementById('rating-row').style.display = 'grid'
    }
  })

  if (oneSyn) {
    document.getElementById('btn-reveal-syn').addEventListener('click', () => {
      document.getElementById('btn-reveal-syn').style.display = 'none'
      document.getElementById('syn-reveal-text').style.display = 'block'
      document.getElementById('rating-row').style.display = 'grid'
    })
  }

  document.getElementById('rating-row').addEventListener('click', e => {
    const btn = e.target.closest('.rating-btn')
    if (!btn) return
    const q = QUALITY[btn.dataset.q]
    processResult(w, q, q >= 4 ? XP.flashcard_good : XP.flashcard_again, q >= 3)
  })
}

// C: 동의어 1개 → 단어(타이핑) + 뜻(자가평가)
function renderTripleC(area, w, oneSyn) {
  area.innerHTML = `
  <div class="triple-wrap">
    <div class="triple-type-badge">동의어 → 단어 + 뜻</div>
    <div class="triple-prompt-card">
      <div class="triple-prompt-label">동의어</div>
      <div class="fc-syn-big">${oneSyn}</div>
    </div>

    <div class="triple-section">
      <div class="triple-section-label">영단어 타이핑</div>
      <div class="copy-chars" id="c-chars">
        ${w.word.split('').map(c => `<span class="copy-char">${c}</span>`).join('')}
      </div>
      <div class="copy-input-wrap">
        <input type="text" id="c-word-input" placeholder="${w.word}"
          autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"/>
      </div>
    </div>

    <div class="triple-section" id="c-meaning-section" style="display:none">
      <div class="triple-section-label">뜻 — 알고 있었나요?</div>
      <button class="reveal-btn" id="btn-reveal-c-meaning">뜻 확인하기</button>
      <div class="meaning-text" id="c-meaning-text" style="display:none">${w.meaning}</div>
    </div>

    <div class="rating-row" id="rating-row" style="display:none">
      <button class="rating-btn again"  data-q="again">몰랐음</button>
      <button class="rating-btn hard"   data-q="hard">어렴풋이</button>
      <button class="rating-btn good"   data-q="good">알았음</button>
      <button class="rating-btn perfect" data-q="perfect">완벽</button>
    </div>
  </div>`

  const input = document.getElementById('c-word-input')
  input.focus()
  input.addEventListener('input', () => {
    updateCharFeedback('c-chars', input.value, w.word)
    if (normalize(input.value) === normalize(w.word)) {
      input.classList.add('copy-done'); input.disabled = true
      document.getElementById('c-meaning-section').style.display = 'block'
    }
  })

  document.getElementById('btn-reveal-c-meaning').addEventListener('click', () => {
    document.getElementById('btn-reveal-c-meaning').style.display = 'none'
    document.getElementById('c-meaning-text').style.display = 'block'
    document.getElementById('c-syn-all-text').style.display = 'block'
    document.getElementById('rating-row').style.display = 'grid'
  })

  document.getElementById('rating-row').addEventListener('click', e => {
    const btn = e.target.closest('.rating-btn')
    if (!btn) return
    const q = QUALITY[btn.dataset.q]
    processResult(w, q, q >= 4 ? XP.flashcard_good : XP.flashcard_again, q >= 3)
  })
}

// ── Copy Practice Mode ────────────────────────────────────

function renderCopyCard(area, w) {
  // groups: Array<Array<string>>  e.g. [["promise","contract"], ["reserve","book"]]
  const groups = parseSynonymGroups(w.synonym)

  // Flatten to a sequential list of items with group/item indices
  // items: [{groupIdx, itemIdx, target, inputId, charsId}]
  const items = []
  groups.forEach((group, gi) => {
    group.forEach((item, ii) => {
      items.push({
        groupIdx: gi,
        itemIdx: ii,
        target: item,
        inputId: `syn-input-${gi}-${ii}`,
        charsId: `syn-chars-${gi}-${ii}`
      })
    })
  })
  const totalItems = items.length

  // Build synonym inputs HTML
  const synStepHtml = totalItems > 0 ? `
    <div class="copy-step copy-step-syn" id="copy-step-syn" style="display:none">
      <div class="copy-step-label">Step 2 — 동의어 타이핑 (총 ${totalItems}개)</div>
      ${groups.map((group, gi) => `
        <div class="copy-syn-group">
          ${groups.length > 1 ? `<div class="copy-group-label">그룹 ${gi + 1}</div>` : ''}
          ${group.map((item, ii) => `
            <div class="copy-item-wrap" id="item-wrap-${gi}-${ii}">
              <div class="copy-chars" id="syn-chars-${gi}-${ii}">
                ${item.split('').map((c, ci) =>
                  `<span class="copy-char" data-idx="${ci}">${c}</span>`
                ).join('')}
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
      <div class="copy-ref-row">
        <span class="copy-ref-label">단어</span>
        <span class="copy-ref-val en">${w.word}</span>
      </div>
      <div class="copy-ref-row">
        <span class="copy-ref-label">뜻</span>
        <span class="copy-ref-val">${w.meaning}</span>
      </div>
      ${totalItems > 0 ? `<div class="copy-ref-row">
        <span class="copy-ref-label">동의어</span>
        <span class="copy-ref-val">${w.synonym}</span>
      </div>` : ''}
    </div>

    <div class="copy-step" id="copy-step-word">
      <div class="copy-step-label">Step 1 — 영단어 타이핑</div>
      <div class="copy-chars" id="word-chars">
        ${w.word.split('').map((c, i) => `<span class="copy-char" data-idx="${i}">${c}</span>`).join('')}
      </div>
      <div class="copy-input-wrap">
        <input type="text" id="word-input" placeholder="${w.word}"
          autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" />
      </div>
    </div>

    ${synStepHtml}
  </div>`

  // ── Step 1: Word ──
  const wordInput = document.getElementById('word-input')
  wordInput.focus()

  wordInput.addEventListener('input', () => {
    updateCharFeedback('word-chars', wordInput.value, w.word)
    if (normalize(wordInput.value) === normalize(w.word)) {
      wordInput.classList.add('copy-done')
      wordInput.disabled = true
      if (totalItems > 0) {
        setTimeout(() => {
          document.getElementById('copy-step-syn').style.display = 'block'
          activateSynItem(0)
        }, 400)
      } else {
        setTimeout(() => processResult(w, QUALITY.good, XP.typing_correct, true), 600)
      }
    }
  })

  // ── Step 2: Individual synonym items ──
  let currentItemIdx = 0

  function activateSynItem(idx) {
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
      const gi = parseInt(input.dataset.gi)
      const ii = parseInt(input.dataset.ii)
      const flatIdx = items.findIndex(it => it.groupIdx === gi && it.itemIdx === ii)
      const { target, charsId } = items[flatIdx]

      updateCharFeedback(charsId, input.value, target)

      if (matchesItem(input.value, target)) {
        input.classList.add('copy-done')
        input.disabled = true
        const check = document.getElementById(`item-check-${gi}-${ii}`)
        if (check) check.textContent = '✅'
        currentItemIdx = flatIdx + 1
        activateSynItem(currentItemIdx)
      }
    })

    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !input.disabled) input.dispatchEvent(new Event('input'))
    })
  })
}

function updateCharFeedback(charsId, val, target) {
  const chars = document.querySelectorAll(`#${charsId} .copy-char`)
  chars.forEach((span, i) => {
    span.classList.remove('correct', 'wrong', 'pending')
    if (i < val.length) {
      span.classList.add(val[i].toLowerCase() === target[i]?.toLowerCase() ? 'correct' : 'wrong')
    } else {
      span.classList.add('pending')
    }
  })
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
