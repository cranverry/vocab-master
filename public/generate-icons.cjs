// Run: node generate-icons.cjs
// Requires: npm install canvas (only for local icon generation)
// Or just use the SVG icon — modern browsers support it fine.
// This file is optional. GitHub Actions will use the SVG.
const { createCanvas } = require('canvas')
const fs = require('fs')

function generateIcon(size) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')
  // Background
  ctx.fillStyle = '#7c3aed'
  const r = size * 0.2
  ctx.beginPath()
  ctx.moveTo(r, 0)
  ctx.lineTo(size - r, 0)
  ctx.quadraticCurveTo(size, 0, size, r)
  ctx.lineTo(size, size - r)
  ctx.quadraticCurveTo(size, size, size - r, size)
  ctx.lineTo(r, size)
  ctx.quadraticCurveTo(0, size, 0, size - r)
  ctx.lineTo(0, r)
  ctx.quadraticCurveTo(0, 0, r, 0)
  ctx.closePath()
  ctx.fill()
  // Text
  ctx.fillStyle = 'white'
  ctx.font = `bold ${size * 0.65}px Georgia`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('V', size / 2, size / 2 + size * 0.05)
  return canvas.toBuffer('image/png')
}

try {
  fs.writeFileSync(`${__dirname}/icon-192.png`, generateIcon(192))
  fs.writeFileSync(`${__dirname}/icon-512.png`, generateIcon(512))
  console.log('Icons generated!')
} catch (e) {
  console.log('canvas not available, using SVG icons only (that is fine)')
}
