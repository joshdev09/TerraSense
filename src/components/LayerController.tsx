import { useRef, useEffect } from 'react'
import { Layers, Leaf, Droplets, TrendingDown } from 'lucide-react'
import L from 'leaflet'

// ── Public types ──────────────────────────────────────────────────────────────
export interface LayerState {
  urbanExpansion: boolean
  agriculture:    boolean
  floodDepth:     boolean
  subsidence:     boolean
}

interface LayerControllerProps {
  map:              L.Map | null
  layers:           LayerState
  onToggle:         (key: keyof LayerState) => void
  timelineYear:     number
  onTimelineChange: (year: number) => void
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
  onToggle,
  timelineYear,
  onTimelineChange,
}: LayerControllerProps) {
  const containerRef = useRef<HTMLDivElement>(null)

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
        width: '214px',
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
                  paddingBottom: '10px',
                  paddingLeft: '40px',
                  paddingRight: '4px',
                  animation: 'tsSlideDown 240ms ease',
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '6px',
                  }}>
                    <span style={{ fontSize: '10.5px', fontWeight: 500, color: '#999' }}>Timeline</span>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: activeColor }}>{timelineYear}</span>
                  </div>

                  <input
                    type="range"
                    min={2018}
                    max={2026}
                    step={1}
                    value={timelineYear}
                    onChange={e => onTimelineChange(Number(e.target.value))}
                    className="ts-range"
                    style={{ color: activeColor, accentColor: activeColor }}
                  />

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px' }}>
                    <span style={{ fontSize: '9.5px', color: '#BBB' }}>2018</span>
                    <span style={{ fontSize: '9.5px', color: '#BBB' }}>2026</span>
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
