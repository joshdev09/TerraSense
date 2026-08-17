import { useState, useRef, useEffect } from 'react'
import { Search, X, MapPin } from 'lucide-react'
import L from 'leaflet'
import { PAMPANGA_LOCATIONS, type PampangaLocation } from '../data/pampangaLocations'

interface SearchBarProps {
  map: L.Map | null
}

function SearchBar({ map }: SearchBarProps) {
  const [query,   setQuery]   = useState('')
  const [focused, setFocused] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef     = useRef<HTMLInputElement>(null)

  // Filter: match name OR parentCity, cap at 8 results to keep the list compact
  const filtered: PampangaLocation[] = query.trim().length > 0
    ? PAMPANGA_LOCATIONS.filter(l =>
        l.name.toLowerCase().includes(query.toLowerCase()) ||
        l.parentCity.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : []

  // Prevent map consuming scroll events inside this overlay
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const stop = (e: WheelEvent) => e.stopPropagation()
    el.addEventListener('wheel', stop, { passive: false })
    return () => el.removeEventListener('wheel', stop)
  }, [])

  const handleSelect = (loc: PampangaLocation) => {
    if (map) {
      // Leaflet flyTo: center is [lat, lng]
      map.flyTo(
        [loc.coords[0], loc.coords[1]],
        loc.zoom,
        { duration: 1.2 }
      )
    }
    // Set the full name in the input
    setQuery(loc.type === 'Barangay' ? `${loc.name}, ${loc.parentCity}` : loc.name)
    setFocused(false)
  }

  const clearQuery = () => {
    setQuery('')
    inputRef.current?.focus()
  }

  const showDropdown = focused && filtered.length > 0

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '272px' }}>

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
          placeholder="Search city or barangay…"
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
            <DropdownItem
              key={`${loc.type}-${loc.name}-${loc.parentCity}`}
              loc={loc}
              query={query}
              onSelect={handleSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Dropdown row ──────────────────────────────────────────────────────────────
function DropdownItem({
  loc,
  query,
  onSelect,
}: {
  loc: PampangaLocation
  query: string
  onSelect: (loc: PampangaLocation) => void
}) {
  const [hov, setHov] = useState(false)

  // Bold-highlight matching portion of the name
  const highlight = (text: string) => {
    const idx = text.toLowerCase().indexOf(query.toLowerCase())
    if (idx === -1) return <>{text}</>
    return (
      <>
        {text.slice(0, idx)}
        <strong style={{ color: '#1a1a1a', fontWeight: 700 }}>
          {text.slice(idx, idx + query.length)}
        </strong>
        {text.slice(idx + query.length)}
      </>
    )
  }

  const subtitle = loc.type === 'Barangay'
    ? `Barangay · ${loc.parentCity}`
    : loc.parentCity === 'City of San Fernando'
      ? 'Capital City · Pampanga'
      : 'City · Pampanga'

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
        width: '28px', height: '28px', borderRadius: '8px',
        background: hov
          ? (loc.type === 'City' ? '#92B57B' : '#A2CB8B')
          : '#F0EDE0',
        color: hov ? '#fff' : (loc.type === 'City' ? '#444' : '#666'),
        transition: 'background 150ms, color 150ms',
        fontSize: '10px',
        fontWeight: 800,
      }}>
        {loc.type === 'City'
          ? <MapPin size={13} strokeWidth={2} />
          : <MapPin size={11} strokeWidth={2} />}
      </span>

      {/* Labels */}
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontSize: '13px', fontWeight: 500, color: '#444',
          lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {highlight(loc.name)}
        </div>
        <div style={{ fontSize: '11px', color: '#BBB', marginTop: '1px' }}>
          {subtitle}
        </div>
      </div>
    </button>
  )
}

export default SearchBar