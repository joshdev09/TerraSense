import { useRef, useEffect } from 'react'
import { Layers, Leaf, Droplets, TrendingDown, Map as MapIcon } from 'lucide-react'
import L from 'leaflet'
import { useIsMobile } from '../lib/useIsMobile'

const YEARS = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026]

const YEAR_SELECT: React.CSSProperties = {
  width: '100%', padding: '5px 8px',
  background: '#fff', border: '1px solid #E8E6DA',
  borderRadius: '8px', fontSize: '12px', color: '#333',
  cursor: 'pointer', outline: 'none', appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 8px center',
  paddingRight: '24px',
}

// ── Public types ──────────────────────────────────────────────────────────────
export interface LayerState {
  urbanExpansion: boolean
  agriculture:    boolean
  floodDepth:     boolean
  subsidence:     boolean
}

export type BasemapType = 'satellite' | 'standard'

interface LayerControllerProps {
  map:              L.Map | null
  layers:           LayerState
  basemap:          BasemapType
  onToggle:         (key: keyof LayerState) => void
  onBasemapChange:  (type: BasemapType) => void
  fromYear:         number
  toYear:           number
  onTimelineChange: (range: { from: number; to: number }) => void
}

// ── Layer definitions ─────────────────────────────────────────────────────────
const LAYER_DEFS = [
  {
    key:          'urbanExpansion' as keyof LayerState,
    label:        'Urban Expansion',
    sublabel:     'ML-classified · 2018–2026',
    Icon:         Layers,
    activeColor:  '#D97706',
    hasTimeline:  true,
  },
  {
    key:          'agriculture' as keyof LayerState,
    label:        'Remaining Agriculture',
    sublabel:     'Active cropland',
    Icon:         Leaf,
    activeColor:  '#A2CB8B',
    hasTimeline:  false,
  },
  {
    key:          'floodDepth' as keyof LayerState,
    label:        'Flood Depth',
    sublabel:     'Low / Medium / High',
    Icon:         Droplets,
    activeColor:  '#3B82F6',
    hasTimeline:  false,
  },
  {
    key:          'subsidence' as keyof LayerState,
    label:        'Subsidence',
    sublabel:     'Ground sinking zones',
    Icon:         TrendingDown,
    activeColor:  '#F59E0B',
    hasTimeline:  false,
  },
]

// ── Main component ────────────────────────────────────────────────────────────
export default function LayerController({
  map,
  layers,
  basemap,
  onToggle,
  onBasemapChange,
  fromYear,
  toYear,
  onTimelineChange,
}: LayerControllerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isMobile = useIsMobile(640)

  // Prevent map interaction when using the controller
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    L.DomEvent.disableClickPropagation(el)
    L.DomEvent.disableScrollPropagation(el)
  }, [map])

  return (
    <div
      ref={containerRef}
      style={{
        width: isMobile ? '100%' : '214px',
        maxHeight: isMobile ? 'calc(100dvh - 220px)' : undefined,
        overflowY: isMobile ? 'auto' : undefined,
        background: '#fff',
        border: '1px solid #E8E6DA',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.09)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '11px 14px 10px',
        borderBottom: '1px solid #EEEAE0',
      }}>
        <span style={{
          fontSize: '10.5px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
          color: '#999',
        }}>
          Map Layers
        </span>
      </div>

      {/* Layer rows */}
      <div style={{ padding: '6px 0 4px' }}>
        {LAYER_DEFS.map(({ key, label, sublabel, Icon, activeColor, hasTimeline }, index) => {
          const isActive = layers[key]

          return (
            <div key={key} style={{ padding: '0 10px' }}>

              {/* Row */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 4px',
              }}>
                {/* Icon chip */}
                <span style={{
                  flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '30px', height: '30px', borderRadius: '8px',
                  background: isActive ? activeColor : '#F6F4E8',
                  color: isActive ? '#fff' : '#666',
                  transition: 'background 220ms ease, color 220ms ease',
                }}>
                  <Icon size={14} strokeWidth={2} />
                </span>

                {/* Labels */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '12.5px',
                    fontWeight: 500,
                    color: isActive ? '#1a1a1a' : '#444',
                    lineHeight: 1.3,
                    transition: 'color 200ms',
                  }}>
                    {label}
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#999', marginTop: '1px', lineHeight: 1.2 }}>
                    {sublabel}
                  </div>
                </div>

                {/* Toggle */}
                <ToggleSwitch active={isActive} onChange={() => onToggle(key)} activeColor={activeColor} />
              </div>

              {/* Timeline (Urban Expansion only) */}
              {hasTimeline && isActive && (
                <div style={{
                  paddingBottom: '12px',
                  paddingLeft: '40px',
                  paddingRight: '4px',
                  animation: 'tsSlideDown 240ms ease',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <MapIcon size={14} color="#D97706" />
                    <h3 style={{ fontSize: '11px', fontWeight: 800, color: '#999', letterSpacing: '0.05em' }}>
                      BASEMAP
                    </h3>
                  </div>
        
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    <button
                      onClick={() => onBasemapChange('satellite')}
                      style={{
                        flex: 1, padding: '6px', fontSize: '11px', fontWeight: 600, borderRadius: '6px',
                        border: basemap === 'satellite' ? '1px solid #D97706' : '1px solid #333',
                        background: basemap === 'satellite' ? 'rgba(217, 119, 6, 0.1)' : 'transparent',
                        color: basemap === 'satellite' ? '#D97706' : '#999',
                        cursor: 'pointer'
                      }}
                    >
                      Satellite
                    </button>
                    <button
                      onClick={() => onBasemapChange('standard')}
                      style={{
                        flex: 1, padding: '6px', fontSize: '11px', fontWeight: 600, borderRadius: '6px',
                        border: basemap === 'standard' ? '1px solid #D97706' : '1px solid #333',
                        background: basemap === 'standard' ? 'rgba(217, 119, 6, 0.1)' : 'transparent',
                        color: basemap === 'standard' ? '#D97706' : '#999',
                        cursor: 'pointer'
                      }}
                    >
                      Standard
                    </button>
                  </div>

                  <h3 style={{ fontSize: '11px', fontWeight: 800, color: '#999', letterSpacing: '0.05em', marginBottom: '12px' }}>
                    TIME SETTINGS
                  </h3>
                  
                  <span style={{ fontSize: '10.5px', fontWeight: 600, color: '#999', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Timeframe
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {/* From year */}
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '9.5px', color: '#BBB', display: 'block', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>From</label>
                      <select
                        value={fromYear}
                        onChange={e => onTimelineChange({ from: Number(e.target.value), to: toYear })}
                        style={YEAR_SELECT}
                      >
                        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>

                    <span style={{ fontSize: '12px', color: '#CCC', marginTop: '12px', flexShrink: 0 }}>–</span>

                    {/* To year */}
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '9.5px', color: '#BBB', display: 'block', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>To</label>
                      <select
                        value={toYear}
                        onChange={e => onTimelineChange({ from: fromYear, to: Number(e.target.value) })}
                        style={YEAR_SELECT}
                      >
                        {YEARS.filter(y => y >= fromYear).map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Active range badge */}
                  <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ fontSize: '10px', color: '#BBB' }}>Showing:</span>
                    <span style={{
                      fontSize: '11px', fontWeight: 700, color: activeColor,
                      background: `${activeColor}18`, borderRadius: '5px',
                      padding: '1px 7px',
                    }}>
                      {fromYear === toYear ? `${fromYear}` : `${fromYear} – ${toYear}`}
                    </span>
                  </div>
                </div>
              )}

              {/* Divider (not after last item) */}
              {index < LAYER_DEFS.length - 1 && (
                <div style={{ borderBottom: '1px solid #F0EDE0', margin: '0 4px' }} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Toggle switch ─────────────────────────────────────────────────────────────
function ToggleSwitch({
  active,
  onChange,
  activeColor,
}: {
  active: boolean
  onChange: () => void
  activeColor: string
}) {
  return (
    <button
      onClick={onChange}
      role="switch"
      aria-checked={active}
      style={{
        flexShrink: 0,
        width: '34px',
        height: '20px',
        borderRadius: '10px',
        background: active ? activeColor : '#E8E6DA',
        border: 'none',
        cursor: 'pointer',
        position: 'relative',
        transition: 'background 220ms ease',
        padding: 0,
      }}
    >
      <span style={{
        position: 'absolute',
        top: '3px',
        left: active ? '17px' : '3px',
        width: '14px',
        height: '14px',
        borderRadius: '50%',
        background: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.20)',
        transition: 'left 220ms ease',
        display: 'block',
        pointerEvents: 'none',
      }} />
    </button>
  )
}
