import { useState, useCallback, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Rectangle, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import SearchBar from './SearchBar'
import LayerController from './LayerController'
import type { LayerState } from './LayerController'

// ── Map constants ─────────────────────────────────────────────────────────────
const PAMPANGA_CENTER: [number, number] = [15.0794, 120.6200]
const PAMPANGA_BOUNDS: [[number, number], [number, number]] = [
  [14.70, 120.30],
  [15.40, 121.05],
]

// ── Mock overlay patches (stub – swap with real GeoJSON when data is ready) ──
const URBAN_PATCHES: [[number, number], [number, number]][] = [
  [[15.13, 120.56], [15.22, 120.64]],  // Mabalacat–Angeles north
  [[15.08, 120.57], [15.14, 120.64]],  // Angeles south
  [[15.01, 120.67], [15.09, 120.75]],  // San Fernando
  [[15.15, 120.47], [15.24, 120.56]],  // Porac–Angeles west
]

const AGRI_PATCHES: [[number, number], [number, number]][] = [
  [[14.99, 120.73], [15.17, 120.88]],  // Candaba–Mexico corridor
  [[14.83, 120.68], [14.97, 120.82]],  // Macabebe–Masantol lowlands
  [[15.17, 120.68], [15.30, 120.85]],  // Arayat–Magalang farmland
]

const FLOOD_PATCHES: [[number, number], [number, number]][] = [
  [[14.84, 120.63], [15.03, 120.80]],  // Guagua–Bacolor–Masantol basin
  [[15.03, 120.75], [15.17, 120.92]],  // Mexico–San Luis–Candaba delta
]

const SUBSIDENCE_PATCHES: [[number, number], [number, number]][] = [
  [[14.90, 120.58], [15.22, 120.83]],  // Central alluvial plain
]

// ── Bridge: captures the Leaflet map instance from inside MapContainer ────────
function MapCapture({ onMapReady }: { onMapReady: (m: L.Map) => void }) {
  const map = useMap()
  const captured = useRef(false)
  useEffect(() => {
    if (captured.current) return
    captured.current = true
    onMapReady(map)
  }, [map, onMapReady])
  return null
}

// ── Main component ────────────────────────────────────────────────────────────
export default function PampangaMap() {
  const [map, setMap] = useState<L.Map | null>(null)

  const [layers, setLayers] = useState<LayerState>({
    urbanExpansion: false,
    agriculture:    false,
    floodDepth:     false,
    subsidence:     false,
  })
  const [timelineYear, setTimelineYear] = useState(2026)

  const handleToggle = useCallback((key: keyof LayerState) => {
    setLayers(prev => ({ ...prev, [key]: !prev[key] }))
  }, [])

  // Scale urban opacity with timeline year (more built-up toward 2026)
  const urbanFillOpacity = 0.10 + 0.28 * ((timelineYear - 2018) / 8)

  return (
    <div style={{
      flexGrow: 1,
      height: '100%',
      width: '100%',
      position: 'relative',
      zIndex: 0,
      isolation: 'isolate',
    }}>
      {/* ── Map ── */}
      <MapContainer
        center={PAMPANGA_CENTER}
        zoom={11}
        minZoom={10}
        maxZoom={18}
        maxBounds={PAMPANGA_BOUNDS}
        maxBoundsViscosity={1.0}
        scrollWheelZoom={true}
        zoomControl={false}
        attributionControl={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Capture map instance */}
        <MapCapture onMapReady={setMap} />

        {/* ── Urban Expansion overlay ── */}
        {layers.urbanExpansion && URBAN_PATCHES.map((bounds, i) => (
          <Rectangle
            key={`urban-${i}`}
            bounds={bounds}
            pathOptions={{
              color:       '#D97706',
              fillColor:   '#D97706',
              fillOpacity: urbanFillOpacity,
              weight:      1.2,
              opacity:     0.45,
            }}
          />
        ))}

        {/* ── Remaining Agriculture overlay ── */}
        {layers.agriculture && AGRI_PATCHES.map((bounds, i) => (
          <Rectangle
            key={`agri-${i}`}
            bounds={bounds}
            pathOptions={{
              color:       '#A2CB8B',
              fillColor:   '#A2CB8B',
              fillOpacity: 0.28,
              weight:      1.2,
              opacity:     0.45,
            }}
          />
        ))}

        {/* ── Flood Depth overlay ── */}
        {layers.floodDepth && FLOOD_PATCHES.map((bounds, i) => (
          <Rectangle
            key={`flood-${i}`}
            bounds={bounds}
            pathOptions={{
              color:       '#3B82F6',
              fillColor:   '#3B82F6',
              fillOpacity: 0.25,
              weight:      1.5,
              opacity:     0.50,
            }}
          />
        ))}

        {/* ── Subsidence overlay ── */}
        {layers.subsidence && SUBSIDENCE_PATCHES.map((bounds, i) => (
          <Rectangle
            key={`sub-${i}`}
            bounds={bounds}
            pathOptions={{
              color:       '#F59E0B',
              fillColor:   '#F59E0B',
              fillOpacity: 0.18,
              weight:      1,
              opacity:     0.40,
            }}
          />
        ))}
      </MapContainer>

      {/* ── Floating UI (top-right, above the map canvas) ── */}
      <div style={{
        position: 'absolute',
        top: '14px',
        right: '14px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'row',
        gap: '10px',
        alignItems: 'flex-start',
        pointerEvents: 'none',   // let clicks fall through to the map by default
      }}>
        {/* Search bar sits to the left of the layer panel */}
        <div style={{ pointerEvents: 'auto' }}>
          <SearchBar map={map} />
        </div>

        {/* Layer controller on the right edge */}
        <div style={{ pointerEvents: 'auto' }}>
          <LayerController
            map={map}
            layers={layers}
            onToggle={handleToggle}
            timelineYear={timelineYear}
            onTimelineChange={setTimelineYear}
          />
        </div>
      </div>
    </div>
  )
}