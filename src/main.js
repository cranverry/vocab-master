import './style.css'
import { navigate } from './router.js'

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
