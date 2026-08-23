import { useState } from 'react'
import {
  TrendingDown, Activity, Leaf,
  AlertTriangle, ArrowDown, ArrowUp,
} from 'lucide-react'
import GroupedLocationPicker, {
  ALL_SELECTION,
  type LocationSelection,
} from '../components/GroupedLocationPicker'

// ── Types ─────────────────────────────────────────────────────────────────────
interface WatchlistRow {
  barangay:     string
  municipality: string
  hectares:     number
  type:         string
  risk:         'high' | 'medium' | 'low'
}

interface RiskProfile {
  municipality:    string
  floodRisk:       string
  subsidenceRisk:  string
  score:           'Critical' | 'Moderate'
  exposure:        string
  alert:           string
}

// ── Mock data ─────────────────────────────────────────────────────────────────
const WATCHLIST: WatchlistRow[] = [
  // City of San Fernando
  { barangay: 'Dolores',        municipality: 'City of San Fernando', hectares: 680, type: 'Commercial Sprawl',       risk: 'high'   },
  { barangay: 'Del Pilar',      municipality: 'City of San Fernando', hectares: 545, type: 'Industrial Zone',         risk: 'high'   },
  { barangay: 'Sindalan',       municipality: 'City of San Fernando', hectares: 390, type: 'Residential Expansion',   risk: 'medium' },
  { barangay: 'Telabastagan',   municipality: 'City of San Fernando', hectares: 360, type: 'Mixed Use Development',   risk: 'medium' },
  { barangay: 'Quebiawan',      municipality: 'City of San Fernando', hectares: 275, type: 'Residential Subdivision', risk: 'low'    },
  // Angeles City
  { barangay: 'Balibago',       municipality: 'Angeles City',         hectares: 480, type: 'Commercial Sprawl',       risk: 'high'   },
  { barangay: 'Anunas',         municipality: 'Angeles City',         hectares: 310, type: 'Commercial / Mixed Use',  risk: 'medium' },
  { barangay: 'Pulung Cacutud', municipality: 'Angeles City',         hectares: 230, type: 'Residential Expansion',   risk: 'low'    },
  // Mabalacat City
  { barangay: 'Dau',            municipality: 'Mabalacat City',       hectares: 420, type: 'Commercial / Industrial', risk: 'high'   },
  { barangay: 'Atlu-Bola',      municipality: 'Mabalacat City',       hectares: 295, type: 'Mixed Use Development',   risk: 'medium' },
  { barangay: 'Bundagul',       municipality: 'Mabalacat City',       hectares: 215, type: 'Residential Subdivision', risk: 'low'    },
  { barangay: 'Mawaque',        municipality: 'Mabalacat City',       hectares: 185, type: 'Residential',             risk: 'low'    },
]

const TREND_DATA = [
  { year: 2018, ha: 180 }, { year: 2019, ha: 242 }, { year: 2020, ha: 294 },
  { year: 2021, ha: 381 }, { year: 2022, ha: 478 }, { year: 2023, ha: 542 },
  { year: 2024, ha: 590 }, { year: 2025, ha: 610 }, { year: 2026, ha: 602 },
]

const RISK_PROFILES: RiskProfile[] = [
  {
    municipality:   'City of San Fernando',
    floodRisk:      'High',
    subsidenceRisk: 'Moderate',
    score:          'Critical',
    exposure:       '120 ha of new development in Dolores & Del Pilar within the 100-year flood inundation zone',
    alert:          'Drainage and zoning audit recommended immediately',
  },
  {
    municipality:   'Angeles City',
    floodRisk:      'Moderate',
    subsidenceRisk: 'Low',
    score:          'Moderate',
    exposure:       '85 ha of commercial sprawl in Balibago & Anunas intersect with drainage overflow corridors',
    alert:          'Stormwater impact assessment required for new commercial developments',
  },
  {
    municipality:   'Mabalacat City',
    floodRisk:      'High',
    subsidenceRisk: 'High',
    score:          'Critical',
    exposure:       '210 ha in Dau & Atlu-Bola exposed to combined flood + subsidence dual-hazard zones',
    alert:          'Immediate zoning intervention advised — development moratorium proposed',
  },
]

// ── Semantic colours ──────────────────────────────────────────────────────────
const RISK_COLOR = {
  high:     { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' },
  medium:   { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A' },
  low:      { bg: '#F0FDF4', text: '#16A34A', border: '#BBF7D0' },
  Critical: { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' },
  Moderate: { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A' },
} as const

// ── Main view ─────────────────────────────────────────────────────────────────
export default function AnalyticsView() {
  const [selection, setSelection] = useState<LocationSelection>(ALL_SELECTION)

  // Filter watchlist based on selection type
  const rows: WatchlistRow[] = (() => {
    if (selection.type === 'all')      return WATCHLIST
    if (selection.type === 'city')     return WATCHLIST.filter(w => w.municipality === selection.city)
    if (selection.type === 'barangay') {
      const exact = WATCHLIST.filter(w => w.barangay === selection.barangay && w.municipality === selection.city)
      // If the barangay has a watchlist entry, show it; otherwise show the parent city's rows
      return exact.length > 0 ? exact : WATCHLIST.filter(w => w.municipality === selection.city)
    }
    return WATCHLIST
  })()

  const noExactBarangay =
    selection.type === 'barangay' &&
    !WATCHLIST.some(w => w.barangay === selection.barangay)

  return (
    <div style={{ flex: 1, background: '#F6F4E8', overflowY: 'auto', padding: '24px' }}>
      <div style={{ maxWidth: '1160px', margin: '0 auto' }}>

        {/* ── Header ── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px',
        }}>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1a1a1a', margin: '0 0 3px' }}>
              Analytics &amp; Reports
            </h1>
            <p style={{ fontSize: '12.5px', color: '#999', margin: 0 }}>
              Pampanga Province · Land Conversion &amp; Hazard Analysis · 2018–2026
            </p>
          </div>

          {/* Location filter */}
          <div style={{ width: '240px', maxWidth: '100%' }}>
            <GroupedLocationPicker value={selection} onChange={setSelection} />
          </div>
        </div>

        {/* ── KPI cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '16px' }}>
          <KPICard
            label="Total Farmland Lost"
            value="4,820 ha"
            trend="−23.4%"
            trendDir="down"
            since="since 2018"
            icon={<TrendingDown size={17} strokeWidth={2} />}
            iconColor="#DC2626"
          />
          <KPICard
            label="Rate of Expansion"
            value="602 ha / yr"
            trend="+8.3%"
            trendDir="up"
            since="vs. last year"
            icon={<Activity size={17} strokeWidth={2} />}
            iconColor="#D97706"
          />
          <KPICard
            label="Remaining Arable Land"
            value="38.2%"
            trend="−5.1 pp"
            trendDir="down"
            since="since 2018"
            icon={<Leaf size={17} strokeWidth={2} />}
            iconColor="#A2CB8B"
          />
        </div>

        {/* ── Main grid: table + chart ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px', marginBottom: '14px', alignItems: 'flex-start' }}>

          {/* Watchlist table */}
          <div style={{
            background: '#fff', border: '1px solid #E8E6DA',
            borderRadius: '16px', overflow: 'hidden',
            boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
          }}>
            <div style={{
              padding: '14px 20px 12px', borderBottom: '1px solid #EEEAE0',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#999' }}>
                Barangay Watchlist
              </span>
              {selection.type !== 'all' && (
                <span style={{
                  fontSize: '11px', color: '#A2CB8B', fontWeight: 600,
                  background: '#F0FDF4', border: '1px solid #BBF7D0',
                  padding: '2px 8px', borderRadius: '5px',
                }}>
                  {selection.label}
                </span>
              )}
            </div>

            {/* Info banner when showing parent city due to no barangay row */}
            {noExactBarangay && (
              <div style={{
                padding: '9px 20px', background: '#FFFBEB',
                borderBottom: '1px solid #FDE68A',
                fontSize: '12px', color: '#D97706',
              }}>
                No direct watchlist entry for <strong>{selection.barangay}</strong> — showing all {selection.city} data.
              </div>
            )}

            <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: '480px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#FAFAF7' }}>
                  {['Barangay', 'Municipality', 'Ha Lost', 'Conversion Type', 'Risk'].map(col => (
                    <th key={col} style={{
                      padding: '9px 16px', textAlign: 'left',
                      fontSize: '10.5px', fontWeight: 700, color: '#999',
                      textTransform: 'uppercase', letterSpacing: '0.04em',
                      borderBottom: '1px solid #EEEAE0',
                    }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length > 0 ? rows.map((row, i, arr) => (
                  <tr key={i} style={{ borderBottom: i < arr.length - 1 ? '1px solid #F0EDE0' : 'none' }}>
                    <td style={{ padding: '11px 16px', fontSize: '13px', fontWeight: 600, color: '#1a1a1a' }}>{row.barangay}</td>
                    <td style={{ padding: '11px 16px', fontSize: '12.5px', color: '#666' }}>{row.municipality}</td>
                    <td style={{ padding: '11px 16px', fontSize: '13px', fontWeight: 700, color: '#D97706' }}>
                      {row.hectares.toLocaleString()}
                    </td>
                    <td style={{ padding: '11px 16px', fontSize: '12.5px', color: '#666' }}>{row.type}</td>
                    <td style={{ padding: '11px 16px' }}><RiskBadge level={row.risk} /></td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} style={{ padding: '28px', textAlign: 'center', color: '#BBB', fontSize: '13px' }}>
                      No watchlist data for this location.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
          </div>

          {/* Trend chart card */}
          <div style={{
            background: '#fff', border: '1px solid #E8E6DA',
            borderRadius: '16px', padding: '16px 20px',
            boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
            display: 'flex', flexDirection: 'column',
          }}>
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#999' }}>
              Urban Expansion (ha/yr)
            </span>
            <BarChart data={TREND_DATA} />
            <div style={{
              marginTop: '14px', padding: '10px 12px',
              background: '#F6F4E8', borderRadius: '10px',
              fontSize: '12px', color: '#666', lineHeight: 1.6,
            }}>
              Expansion accelerated by{' '}
              <strong style={{ color: '#D97706' }}>+15%</strong> following NLEX interchange
              developments in 2021, driving the 2022–2024 surge.
            </div>
          </div>
        </div>

        {/* ── Risk profiles ── */}
        <div style={{
          background: '#fff', border: '1px solid #E8E6DA',
          borderRadius: '16px', overflow: 'hidden',
          boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
        }}>
          <div style={{
            padding: '14px 20px 12px', borderBottom: '1px solid #EEEAE0',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <AlertTriangle size={13} color="#D97706" strokeWidth={2} />
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#999' }}>
              Risk Profiles — Hazard Intersections
            </span>
          </div>
          <div style={{
            padding: '16px 20px',
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px',
          }}>
            {RISK_PROFILES.map(r => <RiskProfileCard key={r.municipality} profile={r} />)}
          </div>
        </div>

      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────
interface KPICardProps {
  label: string; value: string; trend: string
  trendDir: 'up' | 'down'; since: string
  icon: React.ReactNode; iconColor: string
}

function KPICard({ label, value, trend, trendDir, since, icon, iconColor }: KPICardProps) {
  const isDown = trendDir === 'down'
  return (
    <div style={{
      background: '#fff', border: '1px solid #E8E6DA',
      borderRadius: '16px', padding: '18px 20px',
      boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <span style={{ fontSize: '12.5px', fontWeight: 500, color: '#999' }}>{label}</span>
        <span style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '34px', height: '34px', borderRadius: '10px',
          background: `${iconColor}18`, color: iconColor,
        }}>
          {icon}
        </span>
      </div>
      <div style={{ fontSize: '26px', fontWeight: 700, color: '#1a1a1a', lineHeight: 1 }}>{value}</div>
      <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '2px',
          fontSize: '11.5px', fontWeight: 600,
          color: isDown ? '#DC2626' : '#16A34A',
        }}>
          {isDown ? <ArrowDown size={11} strokeWidth={2.5} /> : <ArrowUp size={11} strokeWidth={2.5} />}
          {trend}
        </span>
        <span style={{ fontSize: '11px', color: '#BBB' }}>{since}</span>
      </div>
    </div>
  )
}

function RiskBadge({ level }: { level: 'high' | 'medium' | 'low' }) {
  const c = RISK_COLOR[level]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 8px', borderRadius: '6px',
      fontSize: '11px', fontWeight: 700,
      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
    }}>
      {level === 'high' ? 'High' : level === 'medium' ? 'Medium' : 'Low'}
    </span>
  )
}

function RiskProfileCard({ profile }: { profile: RiskProfile }) {
  const c = RISK_COLOR[profile.score]
  return (
    <div style={{
      background: '#FAFAF7', border: '1px solid #EEEAE0',
      borderRadius: '14px', padding: '14px 16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', gap: '8px' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a1a', lineHeight: 1.3 }}>{profile.municipality}</span>
        <span style={{
          flexShrink: 0, padding: '3px 9px', borderRadius: '6px',
          fontSize: '11px', fontWeight: 700,
          background: c.bg, color: c.text, border: `1px solid ${c.border}`,
        }}>
          {profile.score}
        </span>
      </div>
      <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
        <span style={{ padding: '2px 7px', borderRadius: '5px', fontSize: '10.5px', fontWeight: 600, background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
          Flood: {profile.floodRisk}
        </span>
        <span style={{ padding: '2px 7px', borderRadius: '5px', fontSize: '10.5px', fontWeight: 600, background: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A' }}>
          Subsidence: {profile.subsidenceRisk}
        </span>
      </div>
      <p style={{ fontSize: '12px', color: '#666', margin: '0 0 10px', lineHeight: 1.55 }}>
        {profile.exposure}
      </p>
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: '7px',
        padding: '8px 10px', borderRadius: '9px',
        background: c.bg, border: `1px solid ${c.border}`,
      }}>
        <AlertTriangle size={12} color={c.text} strokeWidth={2} style={{ marginTop: '1px', flexShrink: 0 }} />
        <span style={{ fontSize: '11px', color: c.text, fontWeight: 500, lineHeight: 1.45 }}>
          {profile.alert}
        </span>
      </div>
    </div>
  )
}

function BarChart({ data }: { data: { year: number; ha: number }[] }) {
  const max = Math.max(...data.map(d => d.ha))
  return (
    <div style={{ marginTop: '16px', flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', height: '88px', gap: '5px' }}>
        {data.map((d, i) => {
          const pct = (d.ha / max) * 100
          const isLast = i === data.length - 1
          return (
            <div
              key={d.year}
              title={`${d.year}: ${d.ha} ha/yr`}
              style={{
                flex: 1, height: `${pct}%`,
                borderRadius: '4px 4px 0 0',
                background: isLast ? '#A2CB8B' : '#D97706',
                opacity: isLast ? 0.9 : 0.65,
                minHeight: '4px', cursor: 'default',
                transition: 'opacity 150ms',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.opacity = '1' }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.opacity = isLast ? '0.9' : '0.65' }}
            />
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
        {data.map((d, i) => (
          <div key={d.year} style={{ flex: 1, textAlign: 'center' }}>
            <span style={{ fontSize: '9px', color: '#BBB' }}>
              {i === 0 || i === data.length - 1 ? `'${String(d.year).slice(2)}` : ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
