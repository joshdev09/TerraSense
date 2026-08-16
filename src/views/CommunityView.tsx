import { useState } from 'react'
import { MapContainer, TileLayer, Rectangle } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { ThumbsUp, AlertTriangle, Plus, Filter } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────
interface Zone {
  id:       string
  label:    string
  muni:     string
  bounds:   [[number, number], [number, number]]
  severity: 'high' | 'medium' | 'low'
  count:    number
}

interface Incident {
  id:       number
  zoneId:   string
  type:     string
  severity: 'high' | 'medium' | 'low'
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
  { id: 'sf',        label: 'San Fernando',  muni: 'City of San Fernando', bounds: [[15.01, 120.67], [15.09, 120.76]], severity: 'high',   count: 42 },
  { id: 'angeles',   label: 'Angeles City',  muni: 'Angeles City',         bounds: [[15.08, 120.56], [15.20, 120.64]], severity: 'medium', count: 28 },
  { id: 'bacolor',   label: 'Bacolor',       muni: 'Bacolor',              bounds: [[14.96, 120.62], [15.02, 120.69]], severity: 'high',   count: 35 },
  { id: 'guagua',    label: 'Guagua',        muni: 'Guagua',               bounds: [[14.93, 120.61], [14.97, 120.67]], severity: 'medium', count: 19 },
  { id: 'macabebe',  label: 'Macabebe',      muni: 'Macabebe',             bounds: [[14.87, 120.70], [14.92, 120.76]], severity: 'high',   count: 31 },
  { id: 'candaba',   label: 'Candaba',       muni: 'Candaba',              bounds: [[15.07, 120.80], [15.15, 120.88]], severity: 'low',    count: 12 },
  { id: 'mexico',    label: 'Mexico',        muni: 'Mexico',               bounds: [[15.03, 120.72], [15.09, 120.79]], severity: 'medium', count: 23 },
  { id: 'mabalacat', label: 'Mabalacat',     muni: 'Mabalacat',            bounds: [[15.14, 120.54], [15.22, 120.60]], severity: 'low',    count: 9  },
]

const ALL_INCIDENTS: Incident[] = [
  { id: 1,  zoneId: 'sf',       type: 'Flood',        severity: 'high',   barangay: 'Brgy San Jose',         time: '2h ago',  desc: 'Road impassable near market. Knee-high floodwater blocks vehicle access.',      upvotes: 24, verified: true  },
  { id: 2,  zoneId: 'bacolor',  type: 'Illegal Fill',  severity: 'medium', barangay: 'Brgy Dolores',          time: '5h ago',  desc: 'Agricultural land being fenced off. Warehouse construction spotted.',            upvotes: 18, verified: false },
  { id: 3,  zoneId: 'candaba',  type: 'Crop Loss',     severity: 'low',    barangay: 'Brgy San Isidro',       time: '1d ago',  desc: 'Drainage overflow destroyed an estimated 2 ha of rice paddies.',                upvotes: 11, verified: true  },
  { id: 4,  zoneId: 'macabebe', type: 'Flood',         severity: 'high',   barangay: 'Brgy San Nicolas',      time: '2d ago',  desc: 'Drainage canal overflowed, affecting 3 adjacent barangays.',                   upvotes: 31, verified: true  },
  { id: 5,  zoneId: 'angeles',  type: 'Land Fill',     severity: 'medium', barangay: 'Brgy Balibago',         time: '3d ago',  desc: 'Unauthorized landfill near designated agricultural area. Heavy machinery observed.', upvotes: 15, verified: false },
  { id: 6,  zoneId: 'sf',       type: 'Flood',         severity: 'high',   barangay: 'Brgy Sindalan',         time: '4d ago',  desc: 'Recurring flooding near active construction site affecting road drainage.',    upvotes: 28, verified: true  },
  { id: 7,  zoneId: 'guagua',   type: 'Subsidence',    severity: 'medium', barangay: 'Brgy Pulungbulo',       time: '5d ago',  desc: 'Ground cracking observed along residential road. ~15m crack length.',          upvotes: 9,  verified: false },
  { id: 8,  zoneId: 'mexico',   type: 'Illegal Fill',  severity: 'medium', barangay: 'Brgy San Antonio',      time: '6d ago',  desc: 'Farmland conversion without visible permit. Concrete foundation poured.',       upvotes: 22, verified: true  },
  { id: 9,  zoneId: 'macabebe', type: 'Flood',         severity: 'high',   barangay: 'Brgy San Isidro Sur',   time: '7d ago',  desc: 'Tidal flooding affecting coastal barangay. Storm surge risk elevated.',         upvotes: 37, verified: true  },
  { id: 10, zoneId: 'mabalacat', type: 'Crop Loss',    severity: 'low',    barangay: 'Brgy Atlu-Bola',        time: '8d ago',  desc: 'Pest outbreak following irrigation disruption. Reported by 4 farmers.',         upvotes: 6,  verified: false },
]

// ── Colours ───────────────────────────────────────────────────────────────────
const ZONE_FILL: Record<Zone['severity'], { fill: string; border: string }> = {
  high:   { fill: '#FCA5A5', border: '#DC2626' },
  medium: { fill: '#FCD34D', border: '#D97706' },
  low:    { fill: '#A2CB8B', border: '#5A8E4C' },
}

const INCIDENT_TYPE_COLOR: Record<string, { bg: string; text: string; border: string }> = {
  'Flood':       { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE' },
  'Illegal Fill':{ bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' },
  'Crop Loss':   { bg: '#F0FDF4', text: '#16A34A', border: '#BBF7D0' },
  'Land Fill':   { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' },
  'Subsidence':  { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' },
}

const SEVERITY_LABEL: Record<string, string> = { high: 'High', medium: 'Medium', low: 'Low' }

// ── View ──────────────────────────────────────────────────────────────────────
export default function CommunityView() {
  const [activeZone, setActiveZone]       = useState<string | null>(null)
  const [upvoted, setUpvoted]             = useState<Set<number>>(new Set())
  const [upvoteCounts, setUpvoteCounts]   = useState<Record<number, number>>({})
  const [filterType, setFilterType]       = useState<string>('All')

  const activeZoneObj = ZONES.find(z => z.id === activeZone)

  const incidents = ALL_INCIDENTS.filter(inc => {
    const zoneMatch = activeZone ? inc.zoneId === activeZone : true
    const typeMatch = filterType === 'All' ? true : inc.type === filterType
    return zoneMatch && typeMatch
  })

  const incidentTypes = ['All', ...Array.from(new Set(ALL_INCIDENTS.map(i => i.type)))]

  const handleUpvote = (id: number) => {
    setUpvoted(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        setUpvoteCounts(c => ({ ...c, [id]: (c[id] ?? 0) - 1 }))
      } else {
        next.add(id)
        setUpvoteCounts(c => ({ ...c, [id]: (c[id] ?? 0) + 1 }))
      }
      return next
    })
  }

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

      {/* ── Left: Choropleth map ── */}
      <div style={{ flex: '0 0 46%', position: 'relative', borderRight: '1px solid #E8E6DA', isolation: 'isolate' }}>
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
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />

          {ZONES.map(zone => {
            const cols = ZONE_FILL[zone.severity]
            const isSelected = activeZone === zone.id
            return (
              <Rectangle
                key={zone.id}
                bounds={zone.bounds}
                pathOptions={{
                  fillColor:   cols.fill,
                  fillOpacity: isSelected ? 0.75 : 0.45,
                  color:       cols.border,
                  weight:      isSelected ? 2.5 : 1.2,
                  opacity:     0.9,
                }}
                eventHandlers={{
                  click: () => setActiveZone(prev => prev === zone.id ? null : zone.id),
                }}
              />
            )
          })}
        </MapContainer>

        {/* Legend */}
        <div style={{
          position: 'absolute', bottom: '14px', left: '14px',
          background: '#fff', border: '1px solid #E8E6DA',
          borderRadius: '12px', padding: '10px 14px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.09)',
          zIndex: 1000,
        }}>
          <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#999', marginBottom: '7px' }}>
            Report Density
          </div>
          {([['high', '#DC2626', 'High (≥30)'], ['medium', '#D97706', 'Moderate (15–29)'], ['low', '#5A8E4C', 'Low (<15)']] as const).map(([, color, label]) => (
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
            position: 'absolute', top: '14px', left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(255,255,255,0.92)',
            border: '1px solid #E8E6DA', borderRadius: '10px',
            padding: '7px 14px', fontSize: '12px', color: '#666',
            backdropFilter: 'blur(4px)', boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            zIndex: 1000, whiteSpace: 'nowrap',
          }}>
            Click a zone to filter reports
          </div>
        )}
      </div>

      {/* ── Right: Incident feed ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#F6F4E8', overflow: 'hidden' }}>

        {/* Feed header */}
        <div style={{
          padding: '14px 18px 12px',
          background: '#fff', borderBottom: '1px solid #EEEAE0',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div>
              <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#1a1a1a', margin: '0 0 2px' }}>
                {activeZoneObj ? `${activeZoneObj.label}` : 'All Pampanga'}
              </h2>
              <p style={{ fontSize: '11.5px', color: '#999', margin: 0 }}>
                {incidents.length} incident{incidents.length !== 1 ? 's' : ''} · Community ground-truth feed
              </p>
            </div>
            <button style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '7px 12px', borderRadius: '9px',
              background: '#1a1a1a', border: 'none', cursor: 'pointer',
              fontSize: '12px', fontWeight: 600, color: '#fff',
              transition: 'background 150ms',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#A2CB8B' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#1a1a1a' }}
            >
              <Plus size={13} strokeWidth={2.5} />
              Submit Report
            </button>
          </div>

          {/* Type filter pills */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <Filter size={12} color="#BBB" style={{ marginTop: '2px' }} />
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
        </div>

        {/* Scrollable cards */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {incidents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#BBB', fontSize: '13px' }}>
              No incidents match the current filter.
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
  )
}

// ── Incident card ─────────────────────────────────────────────────────────────
function IncidentCard({
  incident, hasUpvoted, extraUpvotes, onUpvote,
}: {
  incident: Incident
  hasUpvoted: boolean
  extraUpvotes: number
  onUpvote: () => void
}) {
  const typeColor = INCIDENT_TYPE_COLOR[incident.type] ?? INCIDENT_TYPE_COLOR['Flood']
  const sevColor  = incident.severity === 'high' ? '#DC2626' : incident.severity === 'medium' ? '#D97706' : '#16A34A'
  const totalUpvotes = incident.upvotes + extraUpvotes

  return (
    <div style={{
      background: '#fff', border: '1px solid #E8E6DA',
      borderRadius: '14px', padding: '14px 16px',
      boxShadow: '0 1px 5px rgba(0,0,0,0.04)',
    }}>
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap' }}>
          {/* Type pill */}
          <span style={{
            padding: '3px 9px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
            background: typeColor.bg, color: typeColor.text, border: `1px solid ${typeColor.border}`,
          }}>
            {incident.type}
          </span>
          {/* Severity dot */}
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#999' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: sevColor, display: 'inline-block' }} />
            {SEVERITY_LABEL[incident.severity]}
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

      {/* Barangay */}
      <div style={{ fontSize: '12px', fontWeight: 600, color: '#666', marginBottom: '5px' }}>
        {incident.barangay}
      </div>

      {/* Description */}
      <p style={{ fontSize: '13px', color: '#333', lineHeight: 1.55, margin: '0 0 10px' }}>
        {incident.desc}
      </p>

      {/* Upvote row */}
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
          {totalUpvotes} Verified
        </button>
        {!incident.verified && (
          <span style={{ fontSize: '11px', color: '#BBB' }}>Awaiting verification</span>
        )}
      </div>
    </div>
  )
}

// Suppress unused-variable linter for AlertTriangle imported above (used in JSX)
void AlertTriangle
