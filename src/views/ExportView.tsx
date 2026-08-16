import { useState } from 'react'
import {
  FileText, Table, Map, CheckSquare,
  Square, Loader, Download, ChevronDown,
  AlertTriangle, TrendingUp, Shield, Lightbulb,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────
interface Layers {
  agriLoss:   boolean
  floodRisk:  boolean
  subsidence: boolean
}

// ── Mock AI content ───────────────────────────────────────────────────────────
const AI_SUMMARY = {
  situation: `From 2018 to 2026, Pampanga province experienced an unprecedented rate of urban sprawl,
with an estimated 4,820 hectares of prime agricultural land converted to built-up areas.
The most intensive conversion corridors are concentrated in the northern municipalities of
San Fernando, Angeles City, and Mabalacat — where proximity to NLEX interchange infrastructure
catalysed commercial and residential expansion beginning in 2021.`,

  impact: `The province has lost approximately 23.4% of its 2018 agricultural baseline,
reducing remaining arable land to 38.2% of total municipal territory.
At the current annual rate of 602 ha/yr, Pampanga is projected to breach the NEDA
Food Security Threshold (25% minimum arable land) within 3–5 years without
immediate zoning intervention.`,

  risk: `Spatial intersection analysis reveals that 120 ha of new development in San Fernando
and 210 ha in Macabebe lie within designated 100-year flood inundation zones (Project NOAH).
Additionally, 85 ha of recent urban development in Guagua overlaps with active ground subsidence
corridors identified in the Copernicus EMSN091 dataset, indicating elevated structural
risk for newly constructed infrastructure.`,

  recommendations: [
    'Immediate moratorium on agricultural land conversion permits in flood-zone-adjacent areas.',
    'Mandatory drainage impact assessments for commercial developments >2 ha within 500 m of classified waterways.',
    'Establish a Pampanga Agricultural Land Bank to track real-time conversion permits against zoning compliance.',
    'Expedited revision of the Provincial Comprehensive Land Use Plan (CLUP) to incorporate updated ML-classified urban expansion boundaries.',
  ],
}

const MUNICIPALITIES = [
  'All Pampanga', 'City of San Fernando', 'Angeles City', 'Bacolor',
  'Candaba', 'Guagua', 'Mabalacat', 'Macabebe', 'Mexico',
]

// ── View ──────────────────────────────────────────────────────────────────────
export default function ExportView() {
  const [scope, setScope]             = useState('All Pampanga')
  const [scopeOpen, setScopeOpen]     = useState(false)
  const [dateRange, setDateRange]     = useState('2018–2026')
  const [layers, setLayers]           = useState<Layers>({ agriLoss: true, floodRisk: true, subsidence: true })
  const [isGenerating, setIsGenerating] = useState(false)
  const [generated, setGenerated]     = useState(false)

  const toggleLayer = (key: keyof Layers) => {
    setLayers(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleGenerate = () => {
    setIsGenerating(true)
    setGenerated(false)
    setTimeout(() => {
      setIsGenerating(false)
      setGenerated(true)
    }, 2200)
  }

  const timestamp = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

      {/* ── Left: Config panel ── */}
      <div style={{
        width: '284px', flexShrink: 0,
        background: '#fff', borderRight: '1px solid #E8E6DA',
        overflowY: 'auto', padding: '24px 20px',
        display: 'flex', flexDirection: 'column', gap: '20px',
      }}>
        <div>
          <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#1a1a1a', margin: '0 0 3px' }}>
            LGU Data Export Hub
          </h2>
          <p style={{ fontSize: '11.5px', color: '#999', margin: 0, lineHeight: 1.5 }}>
            Configure scope and generate an official municipal report.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Geographic Scope */}
          <FormField label="Geographic Scope">
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setScopeOpen(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  width: '100%', padding: '9px 12px',
                  background: '#fff', border: '1px solid #E8E6DA',
                  borderRadius: '10px', cursor: 'pointer',
                  fontSize: '13px', color: '#333', fontWeight: 500,
                  transition: 'border-color 150ms',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#A2CB8B' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#E8E6DA' }}
              >
                {scope}
                <ChevronDown size={13} color="#999" style={{ transform: scopeOpen ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }} />
              </button>
              {scopeOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                  background: '#fff', border: '1px solid #E8E6DA',
                  borderRadius: '10px', boxShadow: '0 8px 20px rgba(0,0,0,0.09)',
                  zIndex: 50, overflow: 'hidden',
                }}>
                  {MUNICIPALITIES.map(m => (
                    <button
                      key={m}
                      onClick={() => { setScope(m); setScopeOpen(false) }}
                      style={{
                        display: 'block', width: '100%', padding: '8px 12px',
                        border: 'none', textAlign: 'left', cursor: 'pointer',
                        fontSize: '13px', fontWeight: m === scope ? 600 : 400,
                        color: m === scope ? '#1a1a1a' : '#333',
                        background: m === scope ? '#F6F4E8' : 'transparent',
                        transition: 'background 100ms',
                      }}
                      onMouseEnter={e => { if (m !== scope) (e.currentTarget as HTMLButtonElement).style.background = '#F6F4E8' }}
                      onMouseLeave={e => { if (m !== scope) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </FormField>

          {/* Timeframe */}
          <FormField label="Timeframe">
            <select
              value={dateRange}
              onChange={e => setDateRange(e.target.value)}
              style={{
                width: '100%', padding: '9px 12px',
                background: '#fff', border: '1px solid #E8E6DA',
                borderRadius: '10px', fontSize: '13px', color: '#333',
                cursor: 'pointer', outline: 'none', appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 12px center',
                paddingRight: '32px',
              }}
            >
              {['2018–2026', '2022–2026', '2024–2026', '2025–2026'].map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </FormField>

          {/* Data layers */}
          <FormField label="Data Layers">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
              {([
                ['agriLoss',  'Agricultural Land Loss (ML Data)'],
                ['floodRisk', 'Flood Risk Vulnerability (NOAH)'],
                ['subsidence','Land Subsidence (Copernicus)'],
              ] as [keyof Layers, string][]).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => toggleLayer(key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '9px',
                    background: 'transparent', border: 'none',
                    cursor: 'pointer', padding: 0, textAlign: 'left',
                  }}
                >
                  {layers[key]
                    ? <CheckSquare size={16} color="#A2CB8B" strokeWidth={2} />
                    : <Square size={16} color="#CCC" strokeWidth={2} />}
                  <span style={{ fontSize: '12.5px', color: '#444', lineHeight: 1.3 }}>{label}</span>
                </button>
              ))}
            </div>
          </FormField>
        </div>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          style={{
            marginTop: 'auto', padding: '12px 16px',
            background: isGenerating ? '#E8E6DA' : '#1a1a1a',
            border: 'none', borderRadius: '12px',
            color: isGenerating ? '#999' : '#fff',
            fontSize: '13.5px', fontWeight: 700, cursor: isGenerating ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            transition: 'background 200ms',
            letterSpacing: '0.02em',
          }}
          onMouseEnter={e => { if (!isGenerating) (e.currentTarget as HTMLButtonElement).style.background = '#A2CB8B' }}
          onMouseLeave={e => { if (!isGenerating) (e.currentTarget as HTMLButtonElement).style.background = '#1a1a1a' }}
        >
          {isGenerating
            ? <><Loader size={14} strokeWidth={2} style={{ animation: 'spin 1s linear infinite' }} /> Generating…</>
            : 'Generate Official Report'}
        </button>
      </div>

      {/* ── Right: Preview ── */}
      <div style={{ flex: 1, background: '#F6F4E8', overflowY: 'auto', padding: '24px' }}>

        {/* Empty state */}
        {!isGenerating && !generated && (
          <div style={{
            height: '100%', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: '16px', padding: '40px',
          }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '16px',
              background: '#fff', border: '1px solid #E8E6DA',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#CCC', boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            }}>
              <FileText size={22} strokeWidth={1.5} />
            </div>
            <div style={{ textAlign: 'center', maxWidth: '300px' }}>
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#666', margin: '0 0 6px' }}>
                No report generated yet
              </p>
              <p style={{ fontSize: '12.5px', color: '#BBB', margin: 0, lineHeight: 1.6 }}>
                Configure the scope and layers on the left, then click <strong>Generate Official Report</strong>.
              </p>
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {isGenerating && (
          <div style={{ maxWidth: '760px', margin: '0 auto' }}>
            <SkeletonBlock height={32} width="60%" mb={20} />
            <SkeletonBlock height={16} width="90%" mb={8} />
            <SkeletonBlock height={16} width="75%" mb={28} />
            <SkeletonBlock height={180} mb={20} />
            {[1,2,3].map(i => (
              <div key={i} style={{ marginBottom: '20px' }}>
                <SkeletonBlock height={18} width="40%" mb={10} />
                <SkeletonBlock height={14} mb={6} />
                <SkeletonBlock height={14} width="85%" mb={6} />
                <SkeletonBlock height={14} width="70%" />
              </div>
            ))}
          </div>
        )}

        {/* Generated document */}
        {generated && !isGenerating && (
          <div style={{ maxWidth: '760px', margin: '0 auto' }}>

            {/* Document card */}
            <div style={{
              background: '#fff', border: '1px solid #E8E6DA',
              borderRadius: '16px', overflow: 'hidden',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              marginBottom: '16px',
            }}>
              {/* Doc header */}
              <div style={{
                padding: '22px 28px 18px',
                borderBottom: '1px solid #EEEAE0',
                background: '#FAFAF7',
              }}>
                <div style={{ fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#A2CB8B', marginBottom: '6px' }}>
                  Official Environmental Briefing
                </div>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1a1a1a', margin: '0 0 8px', lineHeight: 1.3 }}>
                  Pampanga Land Use &amp; Hazard Analysis<br />
                  <span style={{ fontWeight: 500, color: '#666' }}>{scope} · {dateRange}</span>
                </h2>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  {[
                    ['Generated', timestamp],
                    ['Classification', 'Public Disclosure'],
                    ['Source', 'TerraSense AI v1.0'],
                  ].map(([label, val]) => (
                    <div key={label}>
                      <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#BBB', display: 'block', letterSpacing: '0.04em' }}>{label}</span>
                      <span style={{ fontSize: '12px', color: '#555' }}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Map snapshot placeholder */}
              <div style={{
                height: '180px', background: 'linear-gradient(135deg, #E8E6DA 0%, #F0EDE0 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderBottom: '1px solid #EEEAE0', position: 'relative', overflow: 'hidden',
              }}>
                {/* Fake map grid lines */}
                <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.3 }} viewBox="0 0 760 180" preserveAspectRatio="none">
                  {[60,120,180,240,300,360,420,480,540,600,660].map(x => <line key={x} x1={x} y1={0} x2={x} y2={180} stroke="#999" strokeWidth={0.5} />)}
                  {[36,72,108,144].map(y => <line key={y} x1={0} y1={y} x2={760} y2={y} stroke="#999" strokeWidth={0.5} />)}
                  <rect x={180} y={50} width={140} height={80} rx={3} fill="#D9773060" />
                  <rect x={340} y={70} width={200} height={70} rx={3} fill="#3B82F640" />
                  <rect x={240} y={100} width={180} height={60} rx={3} fill="#F59E0B30" />
                </svg>
                <div style={{ textAlign: 'center', zIndex: 1 }}>
                  <Map size={22} color="#999" strokeWidth={1.5} />
                  <p style={{ fontSize: '11.5px', color: '#999', margin: '5px 0 0' }}>High-resolution map snapshot · Pampanga Province</p>
                </div>
              </div>

              {/* AI Summary sections */}
              <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                <AISummarySection
                  Icon={TrendingUp}
                  iconColor="#D97706"
                  title="The Situation"
                  body={AI_SUMMARY.situation}
                />
                <AISummarySection
                  Icon={AlertTriangle}
                  iconColor="#DC2626"
                  title="The Impact"
                  body={AI_SUMMARY.impact}
                />
                <AISummarySection
                  Icon={Shield}
                  iconColor="#3B82F6"
                  title="The Risk"
                  body={AI_SUMMARY.risk}
                />

                {/* Recommendations */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <span style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: '26px', height: '26px', borderRadius: '8px',
                      background: '#F0FDF4', color: '#16A34A', flexShrink: 0,
                    }}>
                      <Lightbulb size={13} strokeWidth={2} />
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#1a1a1a' }}>Recommendations</span>
                  </div>
                  <ol style={{ margin: 0, padding: '0 0 0 18px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
                    {AI_SUMMARY.recommendations.map((rec, i) => (
                      <li key={i} style={{ fontSize: '13px', color: '#444', lineHeight: 1.6 }}>{rec}</li>
                    ))}
                  </ol>
                </div>

              </div>
            </div>

            {/* Download buttons */}
            <div style={{
              background: '#fff', border: '1px solid #E8E6DA',
              borderRadius: '14px', padding: '16px 20px',
              boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
            }}>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#999', marginBottom: '12px' }}>
                Asset Download Center
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { icon: FileText, label: 'Official Briefing (PDF)', sub: 'AI narrative + map + charts', color: '#DC2626', bg: '#FEF2F2' },
                  { icon: Table,    label: 'Tabular Metrics (.csv)',  sub: 'Barangay-level raw data',    color: '#16A34A', bg: '#F0FDF4' },
                  { icon: Map,      label: 'Spatial Layer (.geojson)', sub: 'Vector geometries for GIS',  color: '#2563EB', bg: '#EFF6FF' },
                ].map(({ icon: Icon, label, sub, color, bg }) => (
                  <DownloadRow key={label} Icon={Icon} label={label} sub={sub} color={color} bg={bg} />
                ))}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Spinner keyframe */}
      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────
function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#666', marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function SkeletonBlock({ height, width = '100%', mb = 0 }: { height: number; width?: string | number; mb?: number }) {
  return (
    <div style={{
      height, width, marginBottom: mb,
      background: 'linear-gradient(90deg, #E8E6DA 25%, #F0EDE0 50%, #E8E6DA 75%)',
      backgroundSize: '400% 100%',
      borderRadius: '8px',
      animation: 'shimmer 1.4s ease-in-out infinite',
    }} />
  )
}

function AISummarySection({
  Icon, iconColor, title, body,
}: {
  Icon: React.ElementType; iconColor: string; title: string; body: string
}) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '26px', height: '26px', borderRadius: '8px',
          background: `${iconColor}18`, color: iconColor, flexShrink: 0,
        }}>
          <Icon size={13} strokeWidth={2} />
        </span>
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#1a1a1a' }}>{title}</span>
      </div>
      <p style={{ fontSize: '13px', color: '#444', lineHeight: 1.7, margin: 0, paddingLeft: '34px' }}>
        {body.trim()}
      </p>
    </div>
  )
}

function DownloadRow({
  Icon, label, sub, color, bg,
}: {
  Icon: React.ElementType; label: string; sub: string; color: string; bg: string
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '10px 12px', borderRadius: '10px',
      border: '1px solid #EEEAE0', background: '#FAFAF7',
    }}>
      <span style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '32px', height: '32px', borderRadius: '9px',
        background: bg, color: color, flexShrink: 0,
      }}>
        <Icon size={15} strokeWidth={2} />
      </span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a1a' }}>{label}</div>
        <div style={{ fontSize: '11.5px', color: '#999' }}>{sub}</div>
      </div>
      <button style={{
        display: 'flex', alignItems: 'center', gap: '5px',
        padding: '7px 12px', borderRadius: '8px',
        background: '#1a1a1a', border: 'none', cursor: 'pointer',
        fontSize: '12px', fontWeight: 600, color: '#fff',
        transition: 'background 150ms',
      }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#A2CB8B' }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#1a1a1a' }}
      >
        <Download size={12} strokeWidth={2.5} />
        Download
      </button>
    </div>
  )
}

// shimmer keyframe
const _shimmerStyle = document.createElement('style')
_shimmerStyle.textContent = `@keyframes shimmer { 0%{background-position:100% 0} 100%{background-position:-100% 0} }`
document.head.appendChild(_shimmerStyle)
