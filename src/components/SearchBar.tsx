import { useState, useRef, useEffect } from 'react'
import { Search, X, MapPin } from 'lucide-react'
import L from 'leaflet'

interface Location {
  name: string
  coords: [number, number]
  type: string
}

const LOCATIONS: Location[] = [
  { name: 'Angeles City',         coords: [15.1450, 120.5886], type: 'City' },
  { name: 'City of San Fernando', coords: [15.0244, 120.6928], type: 'Capital City' },
  { name: 'Apalit',               coords: [14.9517, 120.7597], type: 'Municipality' },
  { name: 'Arayat',               coords: [15.1523, 120.7694], type: 'Municipality' },
  { name: 'Bacolor',              coords: [14.9900, 120.6557], type: 'Municipality' },
  { name: 'Candaba',              coords: [15.0963, 120.8271], type: 'Municipality' },
  { name: 'Floridablanca',        coords: [14.9971, 120.4998], type: 'Municipality' },
  { name: 'Guagua',               coords: [14.9669, 120.6355], type: 'Municipality' },
  { name: 'Lubao',                coords: [14.9253, 120.5993], type: 'Municipality' },
  { name: 'Mabalacat',            coords: [15.2108, 120.5754], type: 'Municipality' },
  { name: 'Macabebe',             coords: [14.9086, 120.7154], type: 'Municipality' },
  { name: 'Magalang',             coords: [15.2109, 120.6634], type: 'Municipality' },
  { name: 'Masantol',             coords: [14.8900, 120.7280], type: 'Municipality' },
  { name: 'Mexico',               coords: [15.0653, 120.7224], type: 'Municipality' },
  { name: 'Minalin',              coords: [14.9760, 120.7474], type: 'Municipality' },
  { name: 'Porac',                coords: [15.1031, 120.5369], type: 'Municipality' },
  { name: 'San Luis',             coords: [15.0340, 120.7907], type: 'Municipality' },
  { name: 'San Simon',            coords: [15.0235, 120.7852], type: 'Municipality' },
  { name: 'Santa Ana',            coords: [15.0861, 120.7530], type: 'Municipality' },
  { name: 'Santa Rita',           coords: [15.0036, 120.6248], type: 'Municipality' },
  { name: 'Santo Tomas',          coords: [15.0517, 120.7447], type: 'Municipality' },
]

interface SearchBarProps {
  map: L.Map | null
}

function SearchBar({ map }: SearchBarProps) {
  const [query, setQuery]   = useState('')
  const [focused, setFocused] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef     = useRef<HTMLInputElement>(null)

  const filtered = query.trim().length > 0
    ? LOCATIONS.filter(l => l.name.toLowerCase().includes(query.toLowerCase()))
    : []

  // Prevent Leaflet panning/zooming when interacting with this overlay
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    L.DomEvent.disableClickPropagation(el)
    L.DomEvent.disableScrollPropagation(el)
  }, [])

  const handleSelect = (loc: Location) => {
    if (map) {
      map.flyTo(loc.coords, 13, { duration: 1.2, easeLinearity: 0.25 })
    }
    setQuery(loc.name)
    setFocused(false)
    inputRef.current?.blur()
  }

  const clearQuery = () => {
    setQuery('')
    inputRef.current?.focus()
  }

  const showDropdown = focused && filtered.length > 0

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '256px' }}>

      {/* ── Input ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: '#fff',
        border: `1.5px solid ${focused ? '#A2CB8B' : '#E8E6DA'}`,
        borderRadius: '12px',
        padding: '8px 12px',
        boxShadow: focused
          ? '0 2px 16px rgba(162,203,139,0.20), 0 1px 6px rgba(0,0,0,0.06)'
          : '0 2px 10px rgba(0,0,0,0.09)',
        transition: 'border-color 200ms ease, box-shadow 200ms ease',
      }}>
        <Search
          size={14}
          strokeWidth={2}
          style={{ flexShrink: 0, color: focused ? '#A2CB8B' : '#999', transition: 'color 200ms' }}
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 160)}
          placeholder="Search municipality…"
          className="ts-search-input"
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontSize: '13px',
            color: '#333',
            lineHeight: '1.4',
          }}
        />
        {query && (
          <button
            onMouseDown={e => { e.preventDefault(); clearQuery() }}
            style={{
              display: 'flex',
              alignItems: 'center',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: '#BBB',
              padding: 0,
              flexShrink: 0,
              transition: 'color 150ms',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#666' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#BBB' }}
          >
            <X size={13} strokeWidth={2.5} />
          </button>
        )}
      </div>

      {/* ── Autocomplete Dropdown ── */}
      {showDropdown && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0,
          right: 0,
          background: '#fff',
          border: '1px solid #E8E6DA',
          borderRadius: '12px',
          boxShadow: '0 8px 28px rgba(0,0,0,0.10)',
          overflow: 'hidden',
          zIndex: 2000,
        }}>
          {filtered.map(loc => (
            <DropdownItem key={loc.name} loc={loc} onSelect={handleSelect} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Dropdown row ──────────────────────────────────────────────────────────────
function DropdownItem({
  loc,
  onSelect,
}: {
  loc: Location
  onSelect: (loc: Location) => void
}) {
  const [hov, setHov] = useState(false)

  return (
    <button
      onMouseDown={(e) => { e.preventDefault(); onSelect(loc) }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        width: '100%',
        padding: '9px 14px',
        border: 'none',
        background: hov ? '#F6F4E8' : 'transparent',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background 120ms ease',
      }}
    >
      {/* Icon chip */}
      <span style={{
        flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '26px', height: '26px', borderRadius: '7px',
        background: hov ? '#A2CB8B' : '#F0EDE0',
        color: hov ? '#fff' : '#666',
        transition: 'background 150ms, color 150ms',
      }}>
        <MapPin size={12} strokeWidth={2} />
      </span>

      {/* Labels */}
      <div>
        <div style={{ fontSize: '13px', fontWeight: 500, color: '#333', lineHeight: 1.3 }}>
          {loc.name}
        </div>
        <div style={{ fontSize: '11px', color: '#999', marginTop: '1px' }}>
          {loc.type} · Pampanga
        </div>
      </div>
    </button>
  )
}

export default SearchBar