/**
 * toGeoJSON.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Converts LocateAnything-3B normalised bounding boxes into a GeoJSON
 * FeatureCollection suitable for rendering in MapLibre GL JS.
 *
 * The model returns bbox coordinates normalised to [0, 1] relative to the
 * image dimensions. We convert them back to geographic coordinates using
 * the scene's bounding box (minLon, minLat, maxLon, maxLat).
 */

/**
 * @param {Array<{label: string, score: number, bbox: [number,number,number,number]}>} detections
 * @param {{ minLon: number, maxLon: number, minLat: number, maxLat: number }} sceneBbox
 * @returns {GeoJSON.FeatureCollection}
 */
export function toGeoJSON(detections, sceneBbox) {
  const { minLon, maxLon, minLat, maxLat } = sceneBbox
  const lonSpan = maxLon - minLon
  const latSpan = maxLat - minLat

  const features = detections.map((det, idx) => {
    const [x1, y1, x2, y2] = det.bbox  // normalised [0,1]

    // Convert normalised image coords → geographic coords
    // Image y=0 is top (north), y=1 is bottom (south)
    const west  = minLon + x1 * lonSpan
    const east  = minLon + x2 * lonSpan
    const north = maxLat - y1 * latSpan
    const south = maxLat - y2 * latSpan

    return {
      type: 'Feature',
      id:   idx,
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [west,  north],
          [east,  north],
          [east,  south],
          [west,  south],
          [west,  north],
        ]],
      },
      properties: {
        label:    det.label,
        score:    Math.round((det.score ?? 1) * 100) / 100,
        category: 'urban_expansion',
      },
    }
  })

  return {
    type:     'FeatureCollection',
    features,
    metadata: {
      model:         'nvidia/LocateAnything-3B',
      generated_at:  new Date().toISOString(),
      feature_count: features.length,
      scene_bbox:    sceneBbox,
    },
  }
}
