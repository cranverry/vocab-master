import { renderHome, setupHome }               from './views/home.js'
import { renderChapters, setupChapters }       from './views/chapters.js'
import { renderChapterDetail, setupChapterDetail } from './views/chapter-detail.js'
import { renderStudy, setupStudy }             from './views/study.js'
import { renderReview, setupReview }           from './views/review.js'
import { renderStats, setupStats }             from './views/stats.js'

const ROUTES = {
  home:           { render: renderHome,          setup: setupHome,          nav: 'home' },
  chapters:       { render: renderChapters,      setup: setupChapters,      nav: 'chapters' },
  'chapter-detail': { render: renderChapterDetail, setup: setupChapterDetail, nav: 'chapters' },
  study:          { render: renderStudy,         setup: setupStudy,         nav: null },
  review:         { render: renderReview,        setup: setupReview,        nav: 'review' },
  stats:          { render: renderStats,         setup: setupStats,         nav: 'stats' },
}

let _params = {}

export function navigate(route, params = {}) {
  _params = params
  const def = ROUTES[route]
  if (!def) return

  const view = document.getElementById('view')
  view.innerHTML = def.render(params)
  def.setup?.(params)
  view.scrollTop = 0

  // Update bottom nav highlight
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.route === def.nav)
  })
}

export function getParams() { return _params }
