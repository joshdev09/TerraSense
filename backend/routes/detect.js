/**
 * detect.js  —  POST /api/detect
 * ─────────────────────────────────────────────────────────────────────────────
 * Orchestrates the full urban-expansion detection pipeline:
 *   1. Fetch satellite image from DIWATA-2 / Sentinel-2
 *   2. Pass image to nvidia/LocateAnything-3B via Hugging Face
 *   3. Convert bounding boxes to GeoJSON
 *   4. Return GeoJSON FeatureCollection to the frontend
 */

import { Router } from 'express'
import { fetchSatelliteScene } from '../lib/diwata.js'
import { detectUrbanExpansion } from '../lib/huggingface.js'
import { toGeoJSON } from '../lib/toGeoJSON.js'

const router = Router()

// Default Pampanga province bounding box
const PAMPANGA_BBOX = {
  minLon: 120.30,
  maxLon: 121.05,
  minLat: 14.70,
  maxLat: 15.40,
}

/**
 * POST /api/detect
 * Body (optional): { minLon, maxLon, minLat, maxLat, date }
 * Returns: GeoJSON FeatureCollection
 */
router.post('/', async (req, res) => {
  try {
    const bbox = {
      minLon: req.body.minLon ?? PAMPANGA_BBOX.minLon,
      maxLon: req.body.maxLon ?? PAMPANGA_BBOX.maxLon,
      minLat: req.body.minLat ?? PAMPANGA_BBOX.minLat,
      maxLat: req.body.maxLat ?? PAMPANGA_BBOX.maxLat,
    }
    const date = req.body.date ?? null

    console.log(`[detect] Fetching satellite scene for bbox:`, bbox)
    const scene = await fetchSatelliteScene({ ...bbox, date })
    console.log(`[detect] Scene fetched from: ${scene.source} (${scene.date})`)
    console.log(`[detect] Running LocateAnything-3B inference...`)

    const detections = await detectUrbanExpansion(scene.imageUrl)
    console.log(`[detect] Got ${detections.length} detections`)

    const geojson = toGeoJSON(detections, bbox)
    geojson.metadata.satellite_source = scene.source
    geojson.metadata.satellite_date   = scene.date

    res.json({ ok: true, data: geojson })
  } catch (err) {
    console.error('[detect] Error:', err.message)
    res.status(500).json({ ok: false, error: err.message })
  }
})

export default router
