import { useState, useRef, useEffect } from 'react'
import { MapContainer, TileLayer, Rectangle } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import {
  ThumbsUp, Plus, Filter,
  ChevronLeft, ChevronRight, MessageSquare, MapPin, X,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────
interface Zone {
  id:       string
  label:    string
  bounds:   [[number, number], [number, number]]
  severity: 'high' | 'medium' | 'low'
  count:    number
}

interface Incident {
  id:       number
  zoneId:   string
  type:     string
  severity: 'high' | 'medium' | 'low'
  city:     string
  barangay: string
  time:     string
  desc:     string
  upvotes:  number
  verified: boolean
}

// ── Mock data ─────────────────────────────────────────────────────────────────
const PAMPANGA_CENTER: [number, number] = [15.0794, 120.6200]
const PAMPANGA_BOUNDS: [[number, number], [number, number]] = [[14.70, 120.30], [15.40, 121.05]]

const ZONES: Zone[] = [
  { id: 'sf',        label: 'San Fernando',  bounds: [[15.01, 120.67], [15.09, 120.76]], severity: 'high',   count: 42 },
  { id: 'angeles',   label: 'Angeles City',  bounds: [[15.08, 120.56], [15.20, 120.64]], severity: 'medium', count: 28 },
  { id: 'bacolor',   label: 'Bacolor',       bounds: [[14.96, 120.62], [15.02, 120.69]], severity: 'high',   count: 35 },
  { id: 'guagua',    label: 'Guagua',        bounds: [[14.93, 120.61], [14.97, 120.67]], severity: 'medium', count: 19 },
  { id: 'macabebe',  label: 'Macabebe',      bounds: [[14.87, 120.70], [14.92, 120.76]], severity: 'high',   count: 31 },
  { id: 'candaba',   label: 'Candaba',       bounds: [[15.07, 120.80], [15.15, 120.88]], severity: 'low',    count: 12 },
  { id: 'mexico',    label: 'Mexico',        bounds: [[15.03, 120.72], [15.09, 120.79]], severity: 'medium', count: 23 },
  { id: 'mabalacat', label: 'Mabalacat',     bounds: [[15.14, 120.54], [15.22, 120.60]], severity: 'low',    count: 9  },
]

const ALL_INCIDENTS: Incident[] = [
  { id: 1,  zoneId: 'sf',        type: 'Flood',        severity: 'high',   city: 'City of San Fernando', barangay: 'San Jose',        time: '2h ago',  desc: 'Road impassable near market. Knee-high floodwater blocks vehicle access.',            upvotes: 24, verified: true  },
  { id: 2,  zoneId: 'bacolor',   type: 'Illegal Fill', severity: 'medium', city: 'Bacolor',              barangay: 'Dolores',          time: '5h ago',  desc: 'Agricultural land being fenced off. Warehouse construction spotted.',                 upvotes: 18, verified: false },
  { id: 3,  zoneId: 'candaba',   type: 'Crop Loss',    severity: 'low',    city: 'Candaba',              barangay: 'San Isidro',       time: '1d ago',  desc: 'Drainage overflow destroyed an estimated 2 ha of rice paddies.',                    upvotes: 11, verified: true  },
  { id: 4,  zoneId: 'macabebe',  type: 'Flood',        severity: 'high',   city: 'Macabebe',             barangay: 'San Nicolas',      time: '2d ago',  desc: 'Drainage canal overflowed, affecting 3 adjacent barangays.',                        upvotes: 31, verified: true  },
  { id: 5,  zoneId: 'angeles',   type: 'Land Fill',    severity: 'medium', city: 'Angeles City',         barangay: 'Balibago',         time: '3d ago',  desc: 'Unauthorized landfill near designated agricultural area. Heavy machinery observed.', upvotes: 15, verified: false },
  { id: 6,  zoneId: 'sf',        type: 'Flood',        severity: 'high',   city: 'City of San Fernando', barangay: 'Sindalan',         time: '4d ago',  desc: 'Recurring flooding near active construction site affecting road drainage.',          upvotes: 28, verified: true  },
  { id: 7,  zoneId: 'guagua',    type: 'Subsidence',   severity: 'medium', city: 'Guagua',               barangay: 'Pulungbulo',       time: '5d ago',  desc: 'Ground cracking observed along residential road. ~15m crack length.',              upvotes: 9,  verified: false },
  { id: 8,  zoneId: 'mexico',    type: 'Illegal Fill', severity: 'medium', city: 'Mexico',               barangay: 'San Antonio',      time: '6d ago',  desc: 'Farmland conversion without visible permit. Concrete foundation poured.',           upvotes: 22, verified: true  },
  { id: 9,  zoneId: 'macabebe',  type: 'Flood',        severity: 'high',   city: 'Macabebe',             barangay: 'San Isidro Sur',   time: '7d ago',  desc: 'Tidal flooding affecting coastal barangay. Storm surge risk elevated.',             upvotes: 37, verified: true  },
  { id: 10, zoneId: 'mabalacat', type: 'Crop Loss',    severity: 'low',    city: 'Mabalacat City',       barangay: 'Atlu-Bola',        time: '8d ago',  desc: 'Pest outbreak following irrigation disruption. Reported by 4 farmers.',             upvotes: 6,  verified: false },
  { id: 11, zoneId: 'angeles',   type: 'Flood',        severity: 'medium', city: 'Angeles City',         barangay: 'Lourdes Sur',      time: '9d ago',  desc: 'Street flooding near residential compound. Water level rising after rainfall.',      upvotes: 19, verified: true  },
  { id: 12, zoneId: 'sf',        type: 'Illegal Fill', severity: 'medium', city: 'City of San Fernando', barangay: 'Del Pilar',        time: '10d ago', desc: 'Suspected unauthorized fill on classified agricultural lot. LGU notified.',          upvotes: 14, verified: false },
]

// ── Pre-compute location options ───────────────────────────────────────────────
const UNIQUE_CITIES = Array.from(new Set(ALL_INCIDENTS.map(i => i.city))).sort()
const LOCATION_OPTIONS: string[] = [
  'All Locations',
  ...UNIQUE_CITIES.flatMap(city => {
    const brgys = Array.from(
      new Set(ALL_INCIDENTS.filter(i => i.city === city).map(i => `${i.city}, ${i.barangay}`))
    ).sort()
    return [city, ...brgys]
  }),
]

// ── Colours ───────────────────────────────────────────────────────────────────
const ZONE_FILL: Record<Zone['severity'], { fill: string; border: string }> = {
  high:   { fill: '#FCA5A5', border: '#DC2626' },
  medium: { fill: '#FCD34D', border: '#D97706' },
  low:    { fill: '#A2CB8B', border: '#5A8E4C' },
}
const TYPE_COLOR: Record<string, { bg: string; text: string; border: string }> = {
  'Flood':        { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE' },
  'Illegal Fill': { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' },
  'Crop Loss':    { bg: '#F0FDF4', text: '#16A34A', border: '#BBF7D0' },
  'Land Fill':    { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' },
  'Subsidence':   { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' },
}
const SEV_COLOR: Record<string, string> = { high: '#DC2626', medium: '#D97706', low: '#16A34A' }
const SEV_LABEL: Record<string, string>  = { high: 'High', medium: 'Medium', low: 'Low' }

// ── View ──────────────────────────────────────────────────────────────────────
export default function CommunityView() {
  const [activeZone,    setActiveZone]    = useState<string | null>(null)
  const [upvoted,       setUpvoted]       = useState<Set<number>>(new Set())
  const [upvoteCounts,  setUpvoteCounts]  = useState<Record<number, number>>({})
  const [filterType,    setFilterType]    = useState('All')
  const [filterLoc,     setFilterLoc]     = useState('All Locations')
  const [locOpen,       setLocOpen]       = useState(false)
  const [panelOpen,     setPanelOpen]     = useState(true)
  const locRef = useRef<HTMLDivElement>(null)

  // Close location dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (locRef.current && !locRef.current.contains(e.target as Node)) setLocOpen(false)
    }
    if (locOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [locOpen])

  const incidents = ALL_INCIDENTS.filter(inc => {
    const zoneMatch = activeZone ? inc.zoneId === activeZone : true
    const typeMatch = filterType === 'All' ? true : inc.type === filterType
    const locMatch  =
      filterLoc === 'All Locations'                       ? true :
      filterLoc === inc.city                              ? true :
      filterLoc === `${inc.city}, ${inc.barangay}`        ? true : false
    return zoneMatch && typeMatch && locMatch
  })

  const incidentTypes = ['All', ...Array.from(new Set(ALL_INCIDENTS.map(i => i.type)))]

  const handleUpvote = (id: number) => {
    setUpvoted(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id); setUpvoteCounts(c => ({ ...c, [id]: (c[id] ?? 0) - 1 })) }
      else               { next.add(id);    setUpvoteCounts(c => ({ ...c, [id]: (c[id] ?? 0) + 1 })) }
      return next
    })
  }

  const activeLocLabel = filterLoc === 'All Locations' ? null : filterLoc
  const hasActiveFilters = filterType !== 'All' || filterLoc !== 'All Locations'

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

      {/* ── Left: Map section (flex:1 — expands when panel closes) ── */}
      <div style={{ flex: 1, position: 'relative', isolation: 'isolate', minWidth: 0 }}>

        {/* Leaflet map fills the section */}
        <MapContainer
          center={PAMPANGA_CENTER}
          zoom={11}
          minZoom={10}
          maxZoom={16}
          maxBounds={PAMPANGA_BOUNDS}
          maxBoundsViscosity={1.0}
          scrollWheelZoom={true}
          zoomControl={false}
          attributionControl={false}
          style={{ position: 'absolute', inset: 0, height: '100%', width: '100%' }}
        >
          <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
          {ZONES.map(zone => {
            const cols = ZONE_FILL[zone.severity]
            const isSel = activeZone === zone.id
            return (
              <Rectangle
                key={zone.id}
                bounds={zone.bounds}
                pathOptions={{
                  fillColor: cols.fill, fillOpacity: isSel ? 0.75 : 0.45,
                  color: cols.border,   weight: isSel ? 2.5 : 1.2, opacity: 0.9,
                }}
                eventHandlers={{ click: () => setActiveZone(p => p === zone.id ? null : zone.id) }}
              />
            )
          })}
        </MapContainer>

        {/* ── UI overlay (pointer-events:none wrapper → interactive children opt-in) ── */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1000 }}>

          {/* Legend */}
          <div style={{
            pointerEvents: 'auto',
            position: 'absolute', bottom: 14, left: 14,
            background: '#fff', border: '1px solid #E8E6DA',
            borderRadius: '12px', padding: '10px 14px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.09)',
          }}>
            <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#999', marginBottom: '7px' }}>
              Report Density
            </div>
            {([['#DC2626', 'High (≥30)'], ['#D97706', 'Moderate (15–29)'], ['#5A8E4C', 'Low (<15)']] as const).map(([color, label]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '4px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: color, flexShrink: 0 }} />
                <span style={{ fontSize: '11px', color: '#555' }}>{label}</span>
              </div>
            ))}
            {activeZone && (
              <button
                onClick={() => setActiveZone(null)}
                style={{
                  marginTop: '8px', width: '100%', padding: '5px 8px',
                  border: '1px solid #E8E6DA', borderRadius: '7px',
                  fontSize: '11px', color: '#666', background: '#F6F4E8',
                  cursor: 'pointer', fontWeight: 500,
                }}
              >
                Clear filter
              </button>
            )}
          </div>

          {/* Click hint */}
          {!activeZone && (
            <div style={{
              position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(255,255,255,0.92)', border: '1px solid #E8E6DA',
              borderRadius: '10px', padding: '7px 14px', fontSize: '12px', color: '#666',
              backdropFilter: 'blur(4px)', boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              whiteSpace: 'nowrap',
            }}>
              Click a zone to filter reports
            </div>
          )}

          {/* Panel toggle tab — right edge of map */}
          <button
            onClick={() => setPanelOpen(v => !v)}
            title={panelOpen ? 'Hide comments' : 'Show comments'}
            style={{
              pointerEvents: 'auto',
              position: 'absolute', right: 0, top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px',
              padding: '12px 8px',
              background: '#fff',
              border: '1px solid #E8E6DA', borderRight: 'none',
              borderRadius: '12px 0 0 12px',
              cursor: 'pointer',
              boxShadow: '-3px 0 12px rgba(0,0,0,0.07)',
              transition: 'background 150ms',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#F6F4E8' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#fff' }}
          >
            <MessageSquare size={14} color="#A2CB8B" strokeWidth={2} />
            <span style={{
              fontSize: '9.5px', fontWeight: 700, color: '#999',
              textTransform: 'uppercase', letterSpacing: '0.06em',
              writingMode: 'vertical-lr', transform: 'rotate(180deg)', lineHeight: 1,
            }}>
              Comments
            </span>
            {panelOpen
              ? <ChevronRight size={12} color="#BBB" strokeWidth={2.5} />
              : <ChevronLeft  size={12} color="#BBB" strokeWidth={2.5} />}
          </button>
        </div>
      </div>

      {/* ── Right: Collapsible incident panel ── */}
      {/* Outer: fixed width transition + clips content */}
      <div style={{
        width: panelOpen ? '420px' : '0px',
        flexShrink: 0,
        overflow: 'hidden',
        transition: 'width 320ms cubic-bezier(0.4,0,0.2,1)',
        borderLeft: panelOpen ? '1px solid #E8E6DA' : 'none',
      }}>
        {/* Inner: fixed width so it doesn't squish during animation */}
        <div style={{
          width: '420px', height: '100%',
          display: 'flex', flexDirection: 'column',
          background: '#F6F4E8',
          opacity: panelOpen ? 1 : 0,
          transition: 'opacity 180ms ease',
        }}>

          {/* ── Feed header ── */}
          <div style={{
            padding: '14px 18px 12px',
            background: '#fff', borderBottom: '1px solid #EEEAE0',
            flexShrink: 0,
          }}>
            {/* Title row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div>
                <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#1a1a1a', margin: '0 0 2px' }}>
                  {activeZone ? ZONES.find(z => z.id === activeZone)?.label : 'All Pampanga'}
                </h2>
                <p style={{ fontSize: '11.5px', color: '#999', margin: 0 }}>
                  {incidents.length} incident{incidents.length !== 1 ? 's' : ''} · Community ground-truth feed
                </p>
              </div>
              <button
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '7px 12px', borderRadius: '9px',
                  background: '#1a1a1a', border: 'none', cursor: 'pointer',
                  fontSize: '12px', fontWeight: 600, color: '#fff',
                  transition: 'background 150ms', flexShrink: 0,
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#A2CB8B' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#1a1a1a' }}
              >
                <Plus size={13} strokeWidth={2.5} />
                Submit Report
              </button>
            </div>

            {/* Type filter pills */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '8px' }}>
              <Filter size={12} color="#BBB" style={{ flexShrink: 0 }} />
              {incidentTypes.map(t => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  style={{
                    padding: '3px 10px', borderRadius: '20px',
                    border: `1px solid ${filterType === t ? '#A2CB8B' : '#E8E6DA'}`,
                    background: filterType === t ? '#A2CB8B' : 'transparent',
                    color: filterType === t ? '#fff' : '#666',
                    fontSize: '11.5px', fontWeight: 500, cursor: 'pointer',
                    transition: 'all 150ms',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Location filter */}
            <div ref={locRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setLocOpen(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '5px 11px', borderRadius: '20px',
                  border: `1px solid ${activeLocLabel ? '#A2CB8B' : '#E8E6DA'}`,
                  background: activeLocLabel ? '#F0FDF4' : 'transparent',
                  color: activeLocLabel ? '#16A34A' : '#666',
                  fontSize: '11.5px', fontWeight: 500, cursor: 'pointer',
                  transition: 'all 150ms',
                }}
              >
                <MapPin size={11} strokeWidth={2} />
                {activeLocLabel
                  ? <span style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activeLocLabel}</span>
                  : 'Location'}
                {activeLocLabel && (
                  <span
                    onClick={e => { e.stopPropagation(); setFilterLoc('All Locations') }}
                    style={{ display: 'flex', cursor: 'pointer', marginLeft: '2px' }}
                  >
                    <X size={10} strokeWidth={2.5} />
                  </span>
                )}
              </button>

              {locOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 6px)', left: 0,
                  background: '#fff', border: '1px solid #E8E6DA',
                  borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
                  zIndex: 200, maxHeight: '240px', overflowY: 'auto',
                  minWidth: '220px',
                }}>
                  {LOCATION_OPTIONS.map(opt => {
                    const isCity   = !opt.includes(',') && opt !== 'All Locations'
                    const isActive = filterLoc === opt
                    return (
                      <button
                        key={opt}
                        onClick={() => { setFilterLoc(opt); setLocOpen(false) }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '7px',
                          width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left',
                          padding: isCity ? '8px 14px' : (opt === 'All Locations' ? '8px 14px' : '5px 14px 5px 28px'),
                          background: isActive ? '#F0FDF4' : 'transparent',
                          transition: 'background 100ms',
                        }}
                        onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = '#F6F4E8' }}
                        onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
                      >
                        {isActive && <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#A2CB8B', flexShrink: 0 }} />}
                        <span style={{
                          fontSize: isCity ? '12.5px' : '12px',
                          fontWeight: isCity ? 600 : (isActive ? 600 : 400),
                          color: isActive ? '#16A34A' : (isCity ? '#222' : '#555'),
                        }}>
                          {opt}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Active filter chips */}
            {hasActiveFilters && (
              <div style={{ marginTop: '8px', display: 'flex', gap: '5px', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '10.5px', color: '#BBB' }}>Active:</span>
                {filterType !== 'All' && (
                  <ActiveChip label={filterType} onRemove={() => setFilterType('All')} />
                )}
                {filterLoc !== 'All Locations' && (
                  <ActiveChip label={filterLoc} onRemove={() => setFilterLoc('All Locations')} />
                )}
              </div>
            )}
          </div>

          {/* ── Scrollable incident cards ── */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {incidents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#BBB', fontSize: '13px' }}>
                No incidents match the current filters.
              </div>
            ) : incidents.map(inc => (
              <IncidentCard
                key={inc.id}
                incident={inc}
                hasUpvoted={upvoted.has(inc.id)}
                extraUpvotes={upvoteCounts[inc.id] ?? 0}
                onUpvote={() => handleUpvote(inc.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────
function ActiveChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '2px 8px', borderRadius: '5px',
      background: '#F0FDF4', border: '1px solid #BBF7D0',
      fontSize: '11px', color: '#16A34A', fontWeight: 500,
    }}>
      {label}
      <button onClick={onRemove} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: '#16A34A' }}>
        <X size={10} strokeWidth={2.5} />
      </button>
    </span>
  )
}

function IncidentCard({
  incident, hasUpvoted, extraUpvotes, onUpvote,
}: {
  incident: Incident; hasUpvoted: boolean; extraUpvotes: number; onUpvote: () => void
}) {
  const typeColor  = TYPE_COLOR[incident.type] ?? TYPE_COLOR['Flood']
  const sevColor   = SEV_COLOR[incident.severity]
  const totalVotes = incident.upvotes + extraUpvotes

  return (
    <div style={{
      background: '#fff', border: '1px solid #E8E6DA',
      borderRadius: '14px', padding: '13px 15px',
      boxShadow: '0 1px 5px rgba(0,0,0,0.04)',
    }}>
      {/* Top row: type + severity + verified + time */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '7px', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{
            padding: '3px 9px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
            background: typeColor.bg, color: typeColor.text, border: `1px solid ${typeColor.border}`,
          }}>
            {incident.type}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#999' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: sevColor }} />
            {SEV_LABEL[incident.severity]}
          </span>
          {incident.verified && (
            <span style={{
              padding: '2px 7px', borderRadius: '5px', fontSize: '10.5px', fontWeight: 600,
              background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0',
            }}>
              ✔ Verified
            </span>
          )}
        </div>
        <span style={{ fontSize: '11px', color: '#BBB', flexShrink: 0 }}>{incident.time}</span>
      </div>

      {/* Location — City, Barangay */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '5px' }}>
        <MapPin size={11} color="#A2CB8B" strokeWidth={2} style={{ flexShrink: 0 }} />
        <span style={{ fontSize: '12px', fontWeight: 600, color: '#555' }}>
          {incident.city}, {incident.barangay}
        </span>
      </div>

      {/* Description */}
      <p style={{ fontSize: '13px', color: '#333', lineHeight: 1.55, margin: '0 0 10px' }}>
        {incident.desc}
      </p>

      {/* Upvote */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={onUpvote}
          style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '5px 11px', borderRadius: '8px',
            border: `1px solid ${hasUpvoted ? '#A2CB8B' : '#E8E6DA'}`,
            background: hasUpvoted ? '#A2CB8B' : 'transparent',
            cursor: 'pointer', fontSize: '12px', fontWeight: 600,
            color: hasUpvoted ? '#fff' : '#666',
            transition: 'all 180ms ease',
          }}
        >
          <ThumbsUp size={12} strokeWidth={2} />
          {totalVotes} Verified
        </button>
        {!incident.verified && (
          <span style={{ fontSize: '11px', color: '#BBB' }}>Awaiting verification</span>
        )}
      </div>
    </div>
  )
}
