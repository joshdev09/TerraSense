/**
 * detectUrban.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Frontend client that calls the TerraSense backend (port 3001) to run the
 * nvidia/LocateAnything-3B urban-expansion detection pipeline.
 *
 * The backend fetches the satellite image and runs inference — the frontend
 * only receives the resulting GeoJSON FeatureCollection.
 */

const BACKEND_URL = 'http://localhost:3001'

export interface DetectionBBox {
  minLon?: number
  maxLon?: number
  minLat?: number
  maxLat?: number
  date?:   string   // ISO date string, e.g. "2024-06-01"
}

export interface DetectionResult {
  ok:   true
  data: GeoJSON.FeatureCollection
}

export interface DetectionError {
  ok:    false
  error: string
}

/**
 * Run urban expansion detection for the given bounding box.
 * Omit all params to use the default Pampanga province bbox.
 */
export async function detectUrban(opts: DetectionBBox = {}): Promise<GeoJSON.FeatureCollection> {
  // First check the backend is reachable
  try {
    const health = await fetch(`${BACKEND_URL}/api/health`, { signal: AbortSignal.timeout(3000) })
    if (!health.ok) throw new Error('Backend health check failed')
  } catch {
    throw new Error(
      'Cannot reach TerraSense backend on port 3001. ' +
      'Run: cd backend && npm install && npm start'
    )
  }

  const res = await fetch(`${BACKEND_URL}/api/detect`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(opts),
    signal:  AbortSignal.timeout(120_000),  // 2 min — model inference can be slow
  })

  const body: DetectionResult | DetectionError = await res.json()

  if (!body.ok) {
    throw new Error((body as DetectionError).error ?? 'Unknown backend error')
  }

  return (body as DetectionResult).data
}
