/**
 * GroupedLocationPicker
 * Reusable grouped city + barangay dropdown with internal search.
 * Used by AnalyticsView and ExportView.
 */
import { useState, useRef, useEffect } from 'react'
import { MapPin, ChevronDown, Search, X } from 'lucide-react'
import { PAMPANGA_LOCATIONS, PAMPANGA_CITIES } from '../data/pampangaLocations'

export interface LocationSelection {
  type:       'all' | 'city' | 'barangay'
  label:      string
  city?:      string
  barangay?:  string
}

export const ALL_SELECTION: LocationSelection = {
  type: 'all', label: 'All Pampanga',
}

// Pre-build barangays per city
const BARANGAYS_BY_CITY: Record<string, string[]> = {}
PAMPANGA_CITIES.forEach(city => {
  BARANGAYS_BY_CITY[city] = PAMPANGA_LOCATIONS
    .filter(l => l.type === 'Barangay' && l.parentCity === city)
    .map(l => l.name)
})

interface Props {
  value:     LocationSelection
  onChange:  (s: LocationSelection) => void
  minWidth?: string
}

export default function GroupedLocationPicker({ value, onChange, minWidth = '240px' }: Props) {
  const [open,   setOpen]   = useState(false)
  const [search, setSearch] = useState('')
  const wrapRef   = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  // Auto-focus search when opened
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50)
  }, [open])

  // Close on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false); setSearch('')
      }
    }
    if (open) document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [open])

  const select = (s: LocationSelection) => { onChange(s); setOpen(false); setSearch('') }

  // Search-mode results (capped at 12)
  const q = search.toLowerCase().trim()
  const searchResults = q
    ? PAMPANGA_LOCATIONS
        .filter(l => l.name.toLowerCase().includes(q) || l.parentCity.toLowerCase().includes(q))
        .slice(0, 12)
    : []

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>

      {/* ── Trigger ── */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', padding: '8px 14px', gap: '8px',
          background: '#fff', border: `1px solid ${open ? '#A2CB8B' : '#E8E6DA'}`,
          borderRadius: '10px', cursor: 'pointer',
          fontSize: '13px', fontWeight: 500, color: '#333',
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          transition: 'border-color 150ms',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#A2CB8B' }}
        onMouseLeave={e => { if (!open) (e.currentTarget as HTMLButtonElement).style.borderColor = '#E8E6DA' }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '7px', minWidth: 0 }}>
          <MapPin size={13} color="#A2CB8B" style={{ flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {value.label}
          </span>
        </span>
        <ChevronDown size={13} color="#999" style={{
          flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 200ms',
        }} />
      </button>

      {/* ── Dropdown panel ── */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)',
          left: 0, minWidth, maxWidth: 'calc(100vw - 32px)',
          background: '#fff', border: '1px solid #E8E6DA',
          borderRadius: '14px', boxShadow: '0 10px 32px rgba(0,0,0,0.11)',
          zIndex: 300, overflow: 'hidden',
        }}>

          {/* Internal search */}
          <div style={{ padding: '10px 12px', borderBottom: '1px solid #EEEAE0' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              background: '#F6F4E8', borderRadius: '8px', padding: '6px 10px',
            }}>
              <Search size={12} color="#999" style={{ flexShrink: 0 }} />
              <input
                ref={searchRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search city or barangay…"
                style={{
                  flex: 1, border: 'none', outline: 'none',
                  background: 'transparent', fontSize: '12.5px', color: '#333',
                }}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#BBB', padding: 0, display: 'flex' }}
                >
                  <X size={11} />
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>

            {q ? (
              /* ── Search results ── */
              searchResults.length > 0 ? (
                searchResults.map(loc => (
                  <PickerRow
                    key={`${loc.type}-${loc.name}-${loc.parentCity}`}
                    label={loc.name}
                    sub={loc.type === 'Barangay' ? `Barangay · ${loc.parentCity}` : 'City · Pampanga'}
                    active={
                      loc.type === 'City'
                        ? value.type === 'city' && value.city === loc.name
                        : value.type === 'barangay' && value.barangay === loc.name && value.city === loc.parentCity
                    }
                    indent={false}
                    isHeader={false}
                    onSelect={() => select(
                      loc.type === 'City'
                        ? { type: 'city',     label: loc.name,                        city: loc.name }
                        : { type: 'barangay', label: `${loc.name}, ${loc.parentCity}`, city: loc.parentCity, barangay: loc.name }
                    )}
                  />
                ))
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: '#BBB', fontSize: '12.5px' }}>
                  No results for &ldquo;{search}&rdquo;
                </div>
              )
            ) : (
              /* ── Grouped mode ── */
              <>
                <PickerRow
                  label="All Pampanga"
                  sub="All cities and barangays"
                  active={value.type === 'all'}
                  indent={false}
                  isHeader={false}
                  onSelect={() => select(ALL_SELECTION)}
                />
                <Divider />

                {PAMPANGA_CITIES.map((city, ci) => (
                  <div key={city}>
                    {/* City row */}
                    <PickerRow
                      label={city}
                      sub="City · Pampanga"
                      active={value.type === 'city' && value.city === city}
                      indent={false}
                      isHeader={true}
                      onSelect={() => select({ type: 'city', label: city, city })}
                    />
                    {/* Barangay rows */}
                    {BARANGAYS_BY_CITY[city].map(brgy => (
                      <PickerRow
                        key={brgy}
                        label={brgy}
                        sub=""
                        active={value.type === 'barangay' && value.barangay === brgy && value.city === city}
                        indent={true}
                        isHeader={false}
                        onSelect={() => select({ type: 'barangay', label: `${brgy}, ${city}`, city, barangay: brgy })}
                      />
                    ))}
                    {ci < PAMPANGA_CITIES.length - 1 && <Divider />}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────
function PickerRow({
  label, sub, active, indent, isHeader, onSelect,
}: {
  label: string; sub: string; active: boolean
  indent: boolean; isHeader: boolean; onSelect: () => void
}) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onSelect}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left',
        padding: indent ? '5px 14px 5px 28px' : '8px 14px',
        background: active ? '#F0FDF4' : hov ? '#FAFAF7' : 'transparent',
        transition: 'background 100ms',
      }}
    >
      {/* Active indicator dot */}
      <span style={{
        width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0,
        background: active ? '#A2CB8B' : 'transparent',
      }} />

      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{
          fontSize: indent ? '12px' : '13px',
          fontWeight: active ? 700 : (isHeader ? 600 : 400),
          color: active ? '#1a1a1a' : (isHeader ? '#222' : '#555'),
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          lineHeight: 1.4,
        }}>
          {label}
        </div>
        {sub && !indent && (
          <div style={{ fontSize: '10.5px', color: '#BBB', marginTop: '1px' }}>{sub}</div>
        )}
      </div>
    </button>
  )
}

function Divider() {
  return <div style={{ height: '1px', background: '#F0EDE0', margin: '3px 0' }} />
}
