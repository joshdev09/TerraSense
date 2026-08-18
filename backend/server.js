/**
 * server.js  —  TerraSense Backend
 * ─────────────────────────────────────────────────────────────────────────────
 * Express server exposing:
 *   POST /api/detect  → LocateAnything-3B urban expansion detection pipeline
 *
 * Start: node server.js  (or: npm run dev  for watch mode)
 * Requires: backend/.env  with HF_API_TOKEN set
 */

import 'dotenv/config'
import express from 'express'
import cors    from 'cors'
import detectRouter from './routes/detect.js'

const app  = express()
const PORT = process.env.PORT ?? 3001

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:4173'] }))
app.use(express.json({ limit: '10mb' }))

// ── Routes ─────────────────────────────────────────────────────────────────
app.use('/api/detect', detectRouter)

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    ok:      true,
    service: 'TerraSense Backend',
    version: '1.0.0',
    env: {
      hf_token_set: !!(process.env.HF_API_TOKEN && process.env.HF_API_TOKEN !== 'your_huggingface_token_here'),
    },
  })
})

// ── Start ──────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🌿 TerraSense Backend running on http://localhost:${PORT}`)
  console.log(`   POST /api/detect  — Urban expansion detection`)
  console.log(`   GET  /api/health  — Health check\n`)

  if (!process.env.HF_API_TOKEN || process.env.HF_API_TOKEN === 'your_huggingface_token_here') {
    console.warn('⚠️  HF_API_TOKEN is not set. Copy backend/.env.example → backend/.env and add your token.\n')
  }
})
