import { getChapters, saveChapter, deleteChapter, getAllWordData } from '../modules/storage.js'
import { parseVocabCSV } from '../modules/csv.js'
import { navigate } from '../router.js'
import { showToast } from '../main.js'

export function renderChapters() {
  const chapters = getChapters()
  return `
<div class="view chapters-view">
  <div class="view-header">
    <h2>챕터</h2>
    <button class="icon-btn" id="btn-upload" title="CSV 업로드">➕</button>
  </div>

  <input type="file" id="csv-input" accept=".csv" style="display:none" />

  ${chapters.length === 0
    ? `<div class="empty-state">
        <div style="font-size:3rem">📂</div>
        <p>아직 챕터가 없어요</p>
        <button class="btn-primary" id="btn-upload-main">CSV 업로드</button>
      </div>`
    : `<div class="chapter-list-full">
        ${chapters.map(ch => chapterRow(ch)).join('')}
      </div>`
  }
</div>`
}

function chapterRow(ch) {
  const wd = getAllWordData(ch.id)
  const total = ch.words.length
  const mastered = ch.words.filter(w => wd[w.id]?.mastery === 'mastered').length
  const learning = ch.words.filter(w => ['learning','review'].includes(wd[w.id]?.mastery)).length
  const pct = total > 0 ? Math.round((mastered / total) * 100) : 0

  return `
  <div class="chapter-row" data-id="${ch.id}">
    <div class="chapter-row-main">
      <div class="chapter-row-name">${ch.name}</div>
      <div class="chapter-row-stats">
        <span class="stat-chip new">${total - mastered - learning}신규</span>
        <span class="stat-chip learning">${learning}학습중</span>
        <span class="stat-chip mastered">${mastered}완료</span>
      </div>
      <div class="mini-progress">
        <div class="mini-fill" style="width:${pct}%"></div>
      </div>
    </div>
    <button class="delete-btn" data-del="${ch.id}" title="삭제">✕</button>
  </div>`
}

export function setupChapters() {
  const csvInput = document.getElementById('csv-input')

  function triggerUpload() { csvInput.click() }

  document.getElementById('btn-upload')?.addEventListener('click', triggerUpload)
  document.getElementById('btn-upload-main')?.addEventListener('click', triggerUpload)

  csvInput.addEventListener('change', async e => {
    const file = e.target.files[0]
    if (!file) return
    const text = await file.text()
    try {
      const words = parseVocabCSV(text)
      if (!words.length) { showToast('단어를 찾을 수 없어요'); return }
      const name = file.name.replace(/\.csv$/i, '')
      const chapter = { id: `ch_${Date.now()}`, name, words, createdAt: Date.now() }
      saveChapter(chapter)
      showToast(`"${name}" 챕터 추가 완료 (${words.length}단어)`)
      navigate('chapters')
    } catch (err) {
      showToast('CSV 파싱 오류: ' + err.message)
    }
    csvInput.value = ''
  })

  document.querySelectorAll('.chapter-row').forEach(row => {
    row.addEventListener('click', e => {
      if (e.target.closest('.delete-btn')) return
      navigate('chapter-detail', { id: row.dataset.id })
    })
  })

  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation()
      const id = btn.dataset.del
      const ch = getChapters().find(c => c.id === id)
      if (confirm(`"${ch?.name}" 챕터를 삭제할까요?`)) {
        deleteChapter(id)
        showToast('챕터 삭제됨')
        navigate('chapters')
      }
    })
  })
}
