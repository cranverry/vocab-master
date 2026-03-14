import './style.css'
import { navigate } from './router.js'
import { getChapters, saveChapter } from './modules/storage.js'
import { DEFAULT_CHAPTERS } from './data/default-chapters.js'

// Seed default chapters on first load
if (getChapters().length === 0) {
  DEFAULT_CHAPTERS.forEach(ch => saveChapter(ch))
}

// Bottom nav routing
document.getElementById('bottom-nav').addEventListener('click', e => {
  const btn = e.target.closest('.nav-btn')
  if (btn) navigate(btn.dataset.route)
})

// Toast utility
export function showToast(msg, duration = 2500) {
  const tc = document.getElementById('toast-container')
  const t = document.createElement('div')
  t.className = 'toast'
  t.textContent = msg
  tc.appendChild(t)
  requestAnimationFrame(() => t.classList.add('show'))
  setTimeout(() => {
    t.classList.remove('show')
    setTimeout(() => t.remove(), 300)
  }, duration)
}

// Start
navigate('home')
