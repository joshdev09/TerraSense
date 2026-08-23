/**
 * detect.js  —  POST /api/detect
 * ─────────────────────────────────────────────────────────────────────────────
 * Orchestrates the full urban-expansion detection pipeline:
 *   1. Receives WebGL canvas snapshot (Base64) from the React frontend
 *   2. Forwards image to the custom NVIDIA LocateAnything-3B Colab Server
 *   3. Returns raw pixel bounding boxes to the frontend for GeoJSON projection
 * 
 * NOTE: Legacy DIWATA-2/Sentinel-2 and Hugging Face API logic has been 
 * removed in favor of the Canvas Extraction + Colab GPU method.
 */

import { Router } from 'express'
import fetch from 'node-fetch'
import fs from 'fs'
import fsp from 'fs/promises'
import { toGeoJSON } from '../lib/toGeoJSON.js'

const router = Router()

// Default Pampanga province bounding box
const PAMPANGA_BBOX = {
  minLon: 120.30,
  maxLon: 121.05,
  minLat: 14.70,
  maxLat: 15.40,
}

// Colab requests can stall indefinitely on a dead tunnel — bail out instead of hanging forever
const COLAB_TIMEOUT_MS = 30_000

// Ensure the capture folder exists once at startup, not on every request
const CAPTURE_DIR = 'satellite-captured'
if (!fs.existsSync(CAPTURE_DIR)) {
  fs.mkdirSync(CAPTURE_DIR, { recursive: true })
}

// Fallback bounding boxes used whenever the Colab GPU server can't be reached
// (dead tunnel, timeout, 5xx, malformed response) so the UI/demo keeps working
// instead of showing a raw error.
function mockDetections(prompt) {
  return [
    { label: prompt, score: 0.98, bbox: [0.45, 0.45, 0.55, 0.55] },
    { label: prompt, score: 0.91, bbox: [0.60, 0.30, 0.70, 0.40] },
    { label: prompt, score: 0.88, bbox: [0.35, 0.65, 0.42, 0.72] }
  ]
}

/**
 * Persist the raw capture to disk for audit/debug purposes. This is
 * unrelated to the response the frontend is waiting on, so it runs off
 * the request's critical path and never blocks the event loop.
 */
function saveCaptureInBackground(imageBase64) {
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '')
  const imageBuffer = Buffer.from(base64Data, 'base64')
  const filePath = `${CAPTURE_DIR}/satellite_capture_${Date.now()}.jpg`

  fsp.writeFile(filePath, imageBuffer)
    .then(() => console.log(`[SYSTEM]   💾 Saved snapshot locally as: ${filePath}`))
    .catch(err => console.log(`[SYSTEM]   ⚠️ Could not save image to folder: ${err.message}`))
}

router.post('/', async (req, res) => {
  try {
    const { 
      imageBase64, 
      prompt = 'rectangular metal rooftops. residential building. house. warehouse. informal settlement. construction site. cleared land. paved road.',
      minLon = PAMPANGA_BBOX.minLon,
      maxLon = PAMPANGA_BBOX.maxLon,
      minLat = PAMPANGA_BBOX.minLat,
      maxLat = PAMPANGA_BBOX.maxLat
    } = req.body
    
    const sceneBbox = { minLon, maxLon, minLat, maxLat }
    
    // 1. Log the incoming request from React
    console.log(`\n==================================================`)
    console.log(`[${new Date().toISOString()}] 🛰️ INCOMING SATELLITE SCAN`)
    console.log(`==================================================`)
    console.log(`[FRONTEND] 📸 Received WebGL Canvas Extraction...`)
    console.log(`[FRONTEND] 🎯 Target Feature: "${prompt}"`)
    
    if (!imageBase64) {
      console.log(`[ERROR]    ❌ No image payload received.`);
      return res.status(400).json({ ok: false, error: 'Missing imageBase64 payload' });
    }

    console.log(`[DATA]     📦 Image Payload Size: ${(imageBase64.length / 1024).toFixed(2)} KB`)

    // Fire-and-forget: don't make the frontend wait on a disk write
    // that has nothing to do with the detection result.
    saveCaptureInBackground(imageBase64)

    // Read the dynamic URL from .env so the user doesn't hit dead tunnels (502 Bad Gateway)
    const apiUrl = process.env.COLAB_ENDPOINT_URL
    if (!apiUrl) {
      throw new Error("COLAB_ENDPOINT_URL is not set in backend/.env")
    }
    
    // 2. Log the hand-off to the Colab Server
    console.log(`\n[NETWORK]  🚀 Routing to NVIDIA LocateAnything-3B GPU Cluster...`)
    console.log(`[NETWORK]  🔗 Endpoint: ${apiUrl}`)
    
    const startTime = Date.now()

    // Talk to the Colab GPU server, but never let its failure break the demo:
    // any network error, timeout, 5xx, or malformed response falls back to
    // mock detections instead of surfacing a 500 to the frontend.
    let normalisedDetections = null
    let usedFallback = false
    let fallbackReason = null

    try {
      const timeoutController = new AbortController()
      const timeoutId = setTimeout(() => timeoutController.abort(), COLAB_TIMEOUT_MS)

      let response
      try {
        response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Bypass-Tunnel-Reminder": "true",
          },
          body: JSON.stringify({
            image: imageBase64,
            text: prompt
          }),
          signal: timeoutController.signal,
        })
      } finally {
        clearTimeout(timeoutId)
      }

      const responseText = await response.text()

      if (!response.ok) {
        throw new Error(`AI server responded ${response.status}: ${responseText.substring(0, 80)}`)
      }

      let data
      try {
        data = JSON.parse(responseText)
      } catch (e) {
        throw new Error(`AI server returned a non-JSON response (${response.status}): ${responseText.substring(0, 80)}`)
      }

      if (!data.detections) {
        throw new Error(data.error || data.detail || 'AI server response had no detections field')
      }

      const inferenceTime = ((Date.now() - startTime) / 1000).toFixed(2)
      console.log(`[NETWORK]  ✅ 200 OK: Inference completed in ${inferenceTime} seconds.`)
      console.log(`\n[AI MODEL] 🧠 Raw Output Tensors (Pixel Bounding Boxes):`)
      console.log(data.detections)

      // Convert Colab box {x1, y1, x2, y2} objects to arrays [x1, y1, x2, y2]
      // Important: LocateAnything-3B outputs integer coordinates in [0, 1000] bins.
      // We must divide by 1000 to normalise them to [0, 1] before passing to toGeoJSON.
      normalisedDetections = data.detections.map(d => {
        if (!d.box && !d.bbox) return { label: d.label, score: d.score, bbox: [0,0,1,1] };

        let [x1, y1, x2, y2] = d.box ? [d.box.x1, d.box.y1, d.box.x2, d.box.y2] : d.bbox;

        if (x1 > 1 || y1 > 1 || x2 > 1 || y2 > 1) {
          x1 /= 1000; y1 /= 1000; x2 /= 1000; y2 /= 1000;
        }

        return {
          label: d.label,
          score: d.score,
          bbox: [x1, y1, x2, y2]
        }
      })

      // If the AI found absolutely nothing (or the Colab python regex failed to parse it),
      // inject realistic mock detections so the demo always succeeds.
      if (normalisedDetections.length === 0) {
        usedFallback = true
        fallbackReason = 'AI server returned 0 detections'
      }
    } catch (colabErr) {
      usedFallback = true
      fallbackReason = colabErr.name === 'AbortError'
        ? `Colab endpoint timed out after ${COLAB_TIMEOUT_MS / 1000}s — the tunnel may be dead.`
        : colabErr.message
    }

    if (usedFallback) {
      console.log(`[BACKEND]  ⚠️ Falling back to mock detections: ${fallbackReason}`)
      normalisedDetections = mockDetections(prompt)
    }

    console.log(`\n[BACKEND]  🗺️ Sending pixel coordinates back to React for GPS projection...`)

    // Convert normal coordinates to physical Map Coordinates
    const geojson = toGeoJSON(normalisedDetections, sceneBbox)
    geojson.metadata.demo_mode = usedFallback
    if (usedFallback) geojson.metadata.fallback_reason = fallbackReason

    console.log(`[BACKEND]  ✅ Generated ${geojson.features.length} GeoJSON Features!${usedFallback ? ' (demo mode)' : ''}`)
    console.log(`==================================================\n`)

    return res.status(200).json({ ok: true, data: geojson, demoMode: usedFallback })

  } catch (err) {
    console.log(`[FATAL]    🚨 Pipeline Crash: ${err.message}`)
    return res.status(500).json({ ok: false, error: err.message })
  }
})

export default router