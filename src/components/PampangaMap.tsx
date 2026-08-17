import { useState, useCallback } from 'react'
import { MapContainer, TileLayer, WMSTileLayer, GeoJSON } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import SearchBar from './SearchBar'
import LayerController, { type BasemapType } from './LayerController'
import { detectUrban } from '../lib/detectUrban'

// Disable default icon paths for leaflet, as they sometimes break in Vite
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// ── Fallback stubs ────────────────────────────────────────────────────────────

const URBAN_STUB: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: []
}

const AGRI_STUB: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[120.65, 15.00], [120.70, 15.00], [120.70, 15.05], [120.65, 15.05], [120.65, 15.00]]] }, properties: { label: 'San Fernando cropland', year_cleared: 2024 } },
    { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[120.50, 15.10], [120.55, 15.10], [120.55, 15.15], [120.50, 15.15], [120.50, 15.10]]] }, properties: { label: 'Porac farmlands', year_cleared: 2026 } },
    { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[120.58, 15.18], [120.62, 15.18], [120.62, 15.22], [120.58, 15.22], [120.58, 15.18]]] }, properties: { label: 'Mabalacat fields', year_cleared: 2030 } },
    // New Clark City farmlands
    { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[120.50, 15.30], [120.57, 15.30], [120.57, 15.38], [120.50, 15.38], [120.50, 15.30]]] }, properties: { label: 'Capas/Bamban fields', year_cleared: 2022 } },
  ]
}

const PAMPANGA_CENTER: [number, number] = [15.0794, 120.6200]
const PAMPANGA_BOUNDS: [[number, number], [number, number]] = [[14.70, 120.30], [15.40, 121.05]]

export interface LayerState {
  urbanExpansion: boolean
  agriculture:    boolean
  floodDepth:     boolean
  subsidence:     boolean
}

export default function PampangaMap() {
  const [mapRef, setMapRef] = useState<L.Map | null>(null)
  
  const [layers, setLayers] = useState<LayerState>({
    urbanExpansion: false,
    agriculture:    false,
    floodDepth:     false,
    subsidence:     false,
  })

  const [basemap, setBasemap] = useState<BasemapType>('standard')
  const [fromYear, setFromYear] = useState(2018)
  const [toYear,   setToYear]   = useState(2026)

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

  const handleBasemapChange = useCallback((type: BasemapType) => {
    setBasemap(type)
  }, [])

  const handleRunDetection = async () => {
    setDetecting(true)
    setDetectError(null)
    try {
      const geojson = await detectUrban()
      setUrbanGeoJSON(geojson)
      // Auto-enable the Urban Expansion layer
      setLayers(prev => ({ ...prev, urbanExpansion: true }))
    } catch (err) {
      setDetectError(err instanceof Error ? err.message : String(err))
    } finally {
      setDetecting(false)
    }
  }

  // Pre-filter features
  const filteredUrbanGeoJSON = {
    ...urbanGeoJSON,
    features: urbanGeoJSON.features.filter((f) => {
      const year = f.properties?.year
      return year ? year <= toYear : true
    })
  }

  const filteredAgriGeoJSON = {
    ...AGRI_STUB,
    features: AGRI_STUB.features.filter((f) => {
      const cleared = f.properties?.year_cleared
      return cleared ? cleared > toYear : true
    })
  }

  const urbanFillOpacity = 0.2 + 0.5 * ((toYear - 2018) / 8)

  return (
    <div style={{ flexGrow: 1, height: '100%', width: '100%', position: 'relative', isolation: 'isolate' }}>

      <MapContainer
        center={PAMPANGA_CENTER}
        zoom={11}
        minZoom={9}
        maxZoom={18}
        maxBounds={PAMPANGA_BOUNDS}
        style={{ width: '100%', height: '100%' }}
        zoomControl={true}
        ref={setMapRef}
        attributionControl={false}
      >
        {/* Basemap logic */}
        {basemap === 'satellite' ? (
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution="&copy; Esri, Maxar, Earthstar Geographics"
            maxZoom={18}
          />
        ) : (
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution="&copy; OpenStreetMap contributors &copy; CARTO"
            maxZoom={19}
          />
        )}

        {/* Dynamic Vector Layers */}
        {layers.urbanExpansion && (
          <GeoJSON 
            key={`urban-${toYear}-${filteredUrbanGeoJSON.features.length}`}
            data={filteredUrbanGeoJSON}
            style={{
              fillColor: '#D97706',
              fillOpacity: urbanFillOpacity,
              color: '#D97706',
              weight: 2,
              opacity: 0.8
            }}
          />
        )}

        {layers.agriculture && (
          <GeoJSON 
            key={`agri-${toYear}-${filteredAgriGeoJSON.features.length}`}
            data={filteredAgriGeoJSON}
            style={{
              fillColor: '#A2CB8B',
              fillOpacity: 0.30,
              color: '#5A8E4C',
              weight: 1.5,
              opacity: 0.7
            }}
          />
        )}

        {/* Flood Depth */}
        {layers.floodDepth && (
          <TileLayer
            url="https://lipad-drrm.s3.amazonaws.com/fhm/tiles/fhm_100yr/{z}/{x}/{y}.png"
            opacity={0.55}
          />
        )}

        {/* Subsidence (WMS) */}
        {layers.subsidence && (
          <WMSTileLayer
            url="https://emergency.copernicus.eu/mapping/wms"
            layers="emsn091_01PAMPANGA_DELINEATION_MONIT01"
            format="image/png"
            transparent={true}
            opacity={0.50}
          />
        )}
      </MapContainer>

      {/* Floating UI overlay */}
      <div style={{
        position: 'absolute', top: '14px', right: '14px',
        zIndex: 1000,
        display: 'flex', flexDirection: 'row', gap: '10px', alignItems: 'flex-start',
        pointerEvents: 'none',
      }}>
        <div style={{ pointerEvents: 'auto' }}>
          <SearchBar map={mapRef} />
        </div>
        <div style={{ pointerEvents: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'stretch' }}>
          <LayerController
            map={mapRef}
            layers={layers}
            basemap={basemap}
            onToggle={handleToggle}
            onBasemapChange={handleBasemapChange}
            fromYear={fromYear}
            toYear={toYear}
            onTimelineChange={handleTimelineChange}
          />
          
          <button
            onClick={handleRunDetection}
            disabled={detecting}
            title="Run NVIDIA LocateAnything-3B urban expansion detection on latest Diwata-2 imagery"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
              padding: '9px 14px', borderRadius: '12px',
              background: detecting ? '#E8E6DA' : '#1a1a1a',
              border: 'none', cursor: detecting ? 'not-allowed' : 'pointer',
              fontSize: '12px', fontWeight: 700, color: detecting ? '#999' : '#fff',
              boxShadow: '0 2px 10px rgba(0,0,0,0.18)',
              transition: 'background 200ms',
              letterSpacing: '0.02em',
              width: '100%',
            }}
            onMouseEnter={e => { if (!detecting) (e.currentTarget as HTMLButtonElement).style.background = '#D97706' }}
            onMouseLeave={e => { if (!detecting) (e.currentTarget as HTMLButtonElement).style.background = '#1a1a1a' }}
          >
            {detecting ? (
              <>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', border: '2px solid #999', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                Detecting...
              </>
            ) : (
              'Run AI Detection'
            )}
          </button>

          {detectError && (
            <div style={{
              background: '#FEF2F2', border: '1px solid #FECACA',
              borderRadius: '10px', padding: '9px 12px',
              fontSize: '11.5px', color: '#DC2626', width: '100%', lineHeight: 1.5,
            }}>
              {detectError}
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}