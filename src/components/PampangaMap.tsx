/**
 * PampangaMap.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Main satellite map powered by MapLibre GL JS (via react-map-gl v8).
 * Basemap: Esri World Imagery (no API key required).
 *
 * Layers (via MapLibre sources + layers):
 *   • Urban Expansion   — GeoJSON fill, from LocateAnything-3B or stub patches
 *   • Agriculture       — GeoJSON fill stub
 *   • Flood Depth       — raster tiles from Project NOAH / LiPAD public endpoint
 *   • Subsidence        — raster tiles from Copernicus EMSN091 public endpoint
 */

import { useState, useCallback, useRef } from 'react'
import Map, { Source, Layer, type MapRef, NavigationControl } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import SearchBar from './SearchBar'
import LayerController from './LayerController'
import type { LayerState } from './LayerController'
import { detectUrban } from '../lib/detectUrban'

// ── Map constants ─────────────────────────────────────────────────────────────
const PAMPANGA_CENTER: [number, number] = [120.6200, 15.0794]   // [lng, lat] for MapLibre
const PAMPANGA_BOUNDS: [number, number, number, number] = [120.30, 14.70, 121.05, 15.40]

// ── Esri World Imagery basemap style (no API key required) ────────────────────
const ESRI_STYLE = {
  version: 8 as const,
  sources: {
    'esri-satellite': {
      type: 'raster' as const,
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      attribution:
        'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    },
  },
  layers: [
    {
      id:      'satellite-layer',
      type:    'raster' as const,
      source:  'esri-satellite',
      minzoom: 0,
      maxzoom: 22,
    },
  ],
}

// ── Stub GeoJSON patches (replaced by LocateAnything-3B results on detection) ─
const makePolygon = (
  west: number, south: number, east: number, north: number,
  props: Record<string, unknown> = {}
): GeoJSON.Feature<GeoJSON.Polygon> => ({
  type: 'Feature',
  geometry: {
    type: 'Polygon',
    coordinates: [[[west,south],[east,south],[east,north],[west,north],[west,south]]],
  },
  properties: props,
})

const URBAN_STUB: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    makePolygon(120.56, 15.13, 120.64, 15.22, { label: 'Mabalacat–Angeles north', year: 2019 }),
    makePolygon(120.57, 15.08, 120.64, 15.14, { label: 'Angeles south', year: 2021 }),
    makePolygon(120.67, 15.01, 120.75, 15.09, { label: 'San Fernando', year: 2023 }),
    makePolygon(120.47, 15.15, 120.56, 15.24, { label: 'Porac–Angeles west', year: 2025 }),
    makePolygon(120.70, 14.95, 120.73, 14.98, { label: 'Santo Tomas industrial', year: 2020 }),
    makePolygon(120.50, 14.90, 120.55, 14.95, { label: 'Guagua residential', year: 2024 }),
  ],
}

const AGRI_STUB: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    // This one stays mostly agriculture
    makePolygon(120.73, 14.99, 120.88, 15.17, { label: 'Candaba–Mexico corridor', year_cleared: 2030 }),
    // This one is converted to urban in 2022
    makePolygon(120.68, 14.83, 120.82, 14.97, { label: 'Macabebe–Masantol lowlands', year_cleared: 2022 }),
    // Converted in 2025
    makePolygon(120.68, 15.17, 120.85, 15.30, { label: 'Arayat–Magalang farmland', year_cleared: 2025 }),
  ],
}

// ── Main component ────────────────────────────────────────────────────────────
export default function PampangaMap() {
  const mapRef = useRef<MapRef>(null)

  const [layers, setLayers] = useState<LayerState>({
    urbanExpansion: false,
    agriculture:    false,
    floodDepth:     false,
    subsidence:     false,
  })
  const [fromYear, setFromYear] = useState(2018)
  const [toYear,   setToYear]   = useState(2026)

  // LocateAnything-3B detection state
  const [detecting,    setDetecting]    = useState(false)
  const [detectError,  setDetectError]  = useState<string | null>(null)
  const [urbanGeoJSON, setUrbanGeoJSON] = useState<GeoJSON.FeatureCollection>(URBAN_STUB)

  const handleToggle = useCallback((key: keyof LayerState) => {
    setLayers(prev => ({ ...prev, [key]: !prev[key] }))
  }, [])

  const handleTimelineChange = useCallback(({ from, to }: { from: number; to: number }) => {
    setFromYear(from)
    setToYear(to < from ? from : to)
  }, [])

  // Urban opacity scales with selected year range (more built-up toward 2026)
  const urbanFillOpacity = 0.10 + 0.28 * ((toYear - 2018) / 8)

  const handleRunDetection = async () => {
    setDetecting(true)
    setDetectError(null)
    try {
      const geojson = await detectUrban()
      setUrbanGeoJSON(geojson)
      // Auto-enable the Urban Expansion layer so results are immediately visible
      setLayers(prev => ({ ...prev, urbanExpansion: true }))
    } catch (err) {
      setDetectError(err instanceof Error ? err.message : String(err))
    } finally {
      setDetecting(false)
    }
  }

  return (
    <div style={{ flexGrow: 1, height: '100%', width: '100%', position: 'relative', isolation: 'isolate' }}>

      {/* ── MapLibre GL Map ── */}
      <Map
        ref={mapRef}
        mapStyle={ESRI_STYLE}
        initialViewState={{
          longitude: PAMPANGA_CENTER[0],
          latitude:  PAMPANGA_CENTER[1],
          zoom:      11,
        }}
        minZoom={10}
        maxZoom={18}
        maxBounds={PAMPANGA_BOUNDS}
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
      >
        {/* Zoom controls */}
        <NavigationControl position="bottom-right" showCompass={false} />

        {/* ── Urban Expansion layer (GeoJSON — LocateAnything-3B or stub) ── */}
        {layers.urbanExpansion && (
          <Source id="urban" type="geojson" data={urbanGeoJSON}>
            <Layer
              id="urban-fill"
              type="fill"
              filter={['<=', ['get', 'year'], toYear]}
              paint={{
                'fill-color':   '#D97706',
                'fill-opacity': urbanFillOpacity,
              }}
            />
            <Layer
              id="urban-outline"
              type="line"
              filter={['<=', ['get', 'year'], toYear]}
              paint={{
                'line-color':   '#D97706',
                'line-opacity': 0.6,
                'line-width':   1.5,
              }}
            />
          </Source>
        )}

        {/* ── Remaining Agriculture layer (stub GeoJSON) ── */}
        {layers.agriculture && (
          <Source id="agri" type="geojson" data={AGRI_STUB}>
            <Layer
              id="agri-fill"
              type="fill"
              filter={['>', ['get', 'year_cleared'], toYear]}
              paint={{ 'fill-color': '#A2CB8B', 'fill-opacity': 0.30 }}
            />
            <Layer
              id="agri-outline"
              type="line"
              filter={['>', ['get', 'year_cleared'], toYear]}
              paint={{ 'line-color': '#5A8E4C', 'line-opacity': 0.5, 'line-width': 1.2 }}
            />
          </Source>
        )}

        {/* ── Flood Depth — Project NOAH / LiPAD raster tiles ── */}
        {layers.floodDepth && (
          <Source
            id="flood"
            type="raster"
            tiles={[
              // LiPAD public WMS endpoint (UP NOAH Center)
              'https://lipad-drrm.s3.amazonaws.com/fhm/tiles/fhm_100yr/{z}/{x}/{y}.png',
            ]}
            tileSize={256}
            attribution="© UP NOAH Center / LiPAD"
          >
            <Layer
              id="flood-raster"
              type="raster"
              paint={{ 'raster-opacity': 0.55 }}
            />
          </Source>
        )}

        {/* ── Subsidence — Copernicus EMSN091 raster tiles ── */}
        {layers.subsidence && (
          <Source
            id="subsidence"
            type="raster"
            tiles={[
              // Copernicus EMSN091 public WMS — ground subsidence Central Luzon
              'https://emergency.copernicus.eu/mapping/wms?SERVICE=WMS&VERSION=1.3.0' +
              '&REQUEST=GetMap&LAYERS=emsn091_01PAMPANGA_DELINEATION_MONIT01' +
              '&FORMAT=image/png&TRANSPARENT=true' +
              '&CRS=EPSG:3857&BBOX={bbox-epsg-3857}&WIDTH=256&HEIGHT=256',
            ]}
            tileSize={256}
            attribution="© Copernicus EMS EMSN091"
          >
            <Layer
              id="subsidence-raster"
              type="raster"
              paint={{ 'raster-opacity': 0.50 }}
            />
          </Source>
        )}
      </Map>

      {/* ── Floating UI overlay (top-right) ── */}
      <div style={{
        position: 'absolute', top: '14px', right: '14px',
        zIndex: 10,
        display: 'flex', flexDirection: 'row', gap: '10px', alignItems: 'flex-start',
        pointerEvents: 'none',
      }}>
        <div style={{ pointerEvents: 'auto' }}>
          <SearchBar map={mapRef.current} />
        </div>
        <div style={{ pointerEvents: 'auto' }}>
          <LayerController
            map={mapRef.current}
            layers={layers}
            onToggle={handleToggle}
            fromYear={fromYear}
            toYear={toYear}
            onTimelineChange={handleTimelineChange}
          />
        </div>
      </div>

      {/* ── LocateAnything-3B detection button (bottom-left) ── */}
      <div style={{
        position: 'absolute', bottom: '52px', left: '14px',
        zIndex: 10, pointerEvents: 'auto',
      }}>
        <button
          onClick={handleRunDetection}
          disabled={detecting}
          title="Run NVIDIA LocateAnything-3B urban expansion detection on latest Diwata-2 imagery"
          style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            padding: '9px 14px', borderRadius: '12px',
            background: detecting ? '#E8E6DA' : '#1a1a1a',
            border: 'none', cursor: detecting ? 'not-allowed' : 'pointer',
            fontSize: '12px', fontWeight: 700, color: detecting ? '#999' : '#fff',
            boxShadow: '0 2px 10px rgba(0,0,0,0.18)',
            transition: 'background 200ms',
            letterSpacing: '0.02em',
          }}
          onMouseEnter={e => { if (!detecting) (e.currentTarget as HTMLButtonElement).style.background = '#D97706' }}
          onMouseLeave={e => { if (!detecting) (e.currentTarget as HTMLButtonElement).style.background = '#1a1a1a' }}
        >
          {detecting ? (
            <>
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', border: '2px solid #999', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
              Detecting…
            </>
          ) : (
            <>
              <span style={{ fontSize: '14px' }}>🛰️</span>
              Run AI Detection
            </>
          )}
        </button>

        {/* Detection error inline */}
        {detectError && (
          <div style={{
            marginTop: '8px', background: '#FEF2F2', border: '1px solid #FECACA',
            borderRadius: '10px', padding: '9px 12px',
            fontSize: '11.5px', color: '#DC2626', maxWidth: '280px', lineHeight: 1.5,
          }}>
            {detectError}
          </div>
        )}
      </div>

      {/* Spin keyframe */}
      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}