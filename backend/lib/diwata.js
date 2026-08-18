/**
 * diwata.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Fetches raw satellite imagery from the DIWATA-2 public data portal.
 * DIWATA-2 is operated by the Philippine Space Agency (PhilSA).
 * Public portal: https://diwata.psa.gov.ph / https://phivolcs.dost.gov.ph
 *
 * NOTE: The DIWATA-2 data portal may require registration. If direct tile
 * access is unavailable, this module falls back to the ESA Sentinel-2 L2A
 * open-access archive via the Copernicus Data Space Ecosystem, which also
 * covers Pampanga at 10m resolution.
 */

const DIWATA_BASE = 'https://api.diwata.psa.gov.ph/v1/imagery'
const SENTINEL_BASE = 'https://catalogue.dataspace.copernicus.eu/odata/v1'

/**
 * Fetch a satellite scene for the given bounding box.
 * Returns an object with { imageUrl, source, date }.
 *
 * @param {object} opts
 * @param {number} opts.minLon  West longitude  (e.g. 120.30)
 * @param {number} opts.maxLon  East longitude  (e.g. 121.05)
 * @param {number} opts.minLat  South latitude  (e.g. 14.70)
 * @param {number} opts.maxLat  North latitude  (e.g. 15.40)
 * @param {string} [opts.date]  Target date ISO string (defaults to latest)
 */
export async function fetchSatelliteScene({ minLon, maxLon, minLat, maxLat, date }) {
  const bbox = `${minLon},${minLat},${maxLon},${maxLat}`
  const targetDate = date ?? new Date().toISOString().split('T')[0]

  // ── Attempt 1: DIWATA-2 portal ───────────────────────────────────────────
  try {
    const url = `${DIWATA_BASE}/scenes?bbox=${bbox}&date=${targetDate}&sensor=MFC`
    const res = await fetch(url, { headers: { Accept: 'application/json' } })
    if (res.ok) {
      const data = await res.json()
      if (data?.scenes?.length > 0) {
        return {
          imageUrl: data.scenes[0].download_url,
          source:   'DIWATA-2 (PhilSA)',
          date:     data.scenes[0].date,
        }
      }
    }
  } catch {
    // Fall through to Sentinel-2
  }

  // ── Fallback: Copernicus Sentinel-2 L2A ──────────────────────────────────
  const sentinelUrl =
    `${SENTINEL_BASE}/Products?$filter=` +
    `Collection/Name eq 'SENTINEL-2' and ` +
    `ContentDate/Start gt ${targetDate}T00:00:00.000Z and ` +
    `OData.CSC.Intersects(area=geography'SRID=4326;POLYGON((` +
    `${minLon} ${minLat},${maxLon} ${minLat},${maxLon} ${maxLat},${minLon} ${maxLat},${minLon} ${minLat}` +
    `))')&$top=1&$orderby=ContentDate/Start desc`

  const sentRes = await fetch(sentinelUrl, { headers: { Accept: 'application/json' } })
  if (!sentRes.ok) throw new Error(`Sentinel-2 catalogue query failed: ${sentRes.status}`)

  const sentData = await sentRes.json()
  if (!sentData?.value?.length) {
    throw new Error('No satellite scenes found for the given bounding box and date.')
  }

  const scene = sentData.value[0]
  return {
    imageUrl: `https://catalogue.dataspace.copernicus.eu/odata/v1/Products(${scene.Id})/$value`,
    source:   'Sentinel-2 L2A (Copernicus)',
    date:     scene.ContentDate?.Start,
  }
}
