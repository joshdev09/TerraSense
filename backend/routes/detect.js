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

// Fallback stub to use if HuggingFace API is unreachable (e.g. DNS block)
const getFallbackStub = (bbox) => ({
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[120.56, 15.13], [120.64, 15.13], [120.64, 15.22], [120.56, 15.22], [120.56, 15.13]]] }, properties: { label: 'Mabalacat–Angeles north (Fallback)', score: 0.99, category: 'urban_expansion' } },
    { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[120.57, 15.08], [120.64, 15.08], [120.64, 15.14], [120.57, 15.14], [120.57, 15.08]]] }, properties: { label: 'Angeles south (Fallback)', score: 0.95, category: 'urban_expansion' } },
    { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[120.67, 15.01], [120.75, 15.01], [120.75, 15.09], [120.67, 15.09], [120.67, 15.01]]] }, properties: { label: 'San Fernando (Fallback)', score: 0.92, category: 'urban_expansion' } },
    { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[120.47, 15.15], [120.56, 15.15], [120.56, 15.24], [120.47, 15.24], [120.47, 15.15]]] }, properties: { label: 'Porac–Angeles west (Fallback)', score: 0.88, category: 'urban_expansion' } },
  ],
  metadata: {
    model: 'nvidia/LocateAnything-3B (Mock Fallback)',
    generated_at: new Date().toISOString(),
    feature_count: 4,
    scene_bbox: bbox,
  }
})

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

    let geojson
    try {
      const detections = await detectUrbanExpansion(scene.imageUrl)
      console.log(`[detect] Got ${detections.length} detections`)
      geojson = toGeoJSON(detections, bbox)
    } catch (apiErr) {
      console.warn(`[detect] HF API Error (${apiErr.message}) — using fallback stub.`)
      geojson = getFallbackStub(bbox)
    }

    geojson.metadata.satellite_source = scene.source
    geojson.metadata.satellite_date   = scene.date

    res.json({ ok: true, data: geojson })
  } catch (err) {
    console.error('[detect] Error:', err.message)
    res.status(500).json({ ok: false, error: err.message })
  }
})

export default router
