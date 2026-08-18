import { useState, useRef } from 'react'
import {
  FileText, Table, Map, CheckSquare,
  Square, Loader, Download,
  AlertTriangle, TrendingUp, Shield, Lightbulb,
} from 'lucide-react'
import GroupedLocationPicker, {
  ALL_SELECTION,
  type LocationSelection,
} from '../components/GroupedLocationPicker'
import { generateGeminiSummary, type GeminiSummary } from '../lib/geminiExport'

interface Layers {
  agriLoss:   boolean
  floodRisk:  boolean
  subsidence: boolean
}

const YEARS = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026]

const SELECT_STYLE: React.CSSProperties = {
  width: '100%', padding: '9px 12px',
  background: '#fff', border: '1px solid #E8E6DA',
  borderRadius: '10px', fontSize: '13px', color: '#333',
  cursor: 'pointer', outline: 'none', appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  paddingRight: '32px',
}


// ── View ──────────────────────────────────────────────────────────────────────
export default function ExportView() {
  const [scope, setScope]               = useState<LocationSelection>(ALL_SELECTION)
  const [fromYear, setFromYear]         = useState(2018)
  const [toYear, setToYear]             = useState(2026)
  const [layers, setLayers]             = useState<Layers>({ agriLoss: true, floodRisk: true, subsidence: true })
  const [isGenerating, setIsGenerating] = useState(false)
  const [generated, setGenerated]       = useState(false)
  const [geminiSummary, setGeminiSummary] = useState<GeminiSummary | null>(null)
  const [geminiError,   setGeminiError]   = useState<string | null>(null)
  const reportRef = useRef<HTMLDivElement>(null)

  const handleFromYear = (y: number) => {
    setFromYear(y)
    if (y > toYear) setToYear(y)
  }

  const dateRange = fromYear === toYear ? `${fromYear}` : `${fromYear}–${toYear}`

  const toggleLayer = (key: keyof Layers) => {
    setLayers(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    setGenerated(false)
    setGeminiSummary(null)
    setGeminiError(null)
    try {
      const summary = await generateGeminiSummary({
        location: scope.label,
        fromYear,
        toYear,
        layers,
      })
      setGeminiSummary(summary)
      setGenerated(true)
    } catch (err) {
      setGeminiError(err instanceof Error ? err.message : String(err))
      setGenerated(false)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownloadPDF = () => {
    window.print()
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
            <GroupedLocationPicker value={scope} onChange={setScope} minWidth="256px" />
          </FormField>

          {/* Timeframe — From / To year */}
          <FormField label="Timeframe">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '10px', color: '#BBB', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>From</label>
                <select
                  value={fromYear}
                  onChange={e => handleFromYear(Number(e.target.value))}
                  style={SELECT_STYLE}
                >
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <span style={{ fontSize: '14px', color: '#BBB', marginTop: '14px' }}>–</span>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '10px', color: '#BBB', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>To</label>
                <select
                  value={toYear}
                  onChange={e => setToYear(Number(e.target.value))}
                  style={SELECT_STYLE}
                >
                  {YEARS.filter(y => y >= fromYear).map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
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
        {!isGenerating && !generated && !geminiError && (
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

        {/* Gemini API error banner */}
        {geminiError && !isGenerating && (
          <div style={{
            maxWidth: '760px', margin: '0 auto',
            background: '#FEF2F2', border: '1px solid #FECACA',
            borderRadius: '14px', padding: '18px 22px',
            display: 'flex', gap: '14px', alignItems: 'flex-start',
          }}>
            <AlertTriangle size={20} color="#DC2626" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#DC2626', margin: '0 0 4px' }}>Report generation failed</p>
              <p style={{ fontSize: '12.5px', color: '#7F1D1D', margin: 0, lineHeight: 1.6, wordBreak: 'break-word' }}>{geminiError}</p>
              <p style={{ fontSize: '11.5px', color: '#B91C1C', margin: '8px 0 0' }}>
                Make sure <code style={{ background: '#FEE2E2', padding: '1px 5px', borderRadius: '4px' }}>VITE_GEMINI_API_KEY</code> is set in your <code style={{ background: '#FEE2E2', padding: '1px 5px', borderRadius: '4px' }}>.env</code> file and restart the dev server.
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
        {generated && !isGenerating && geminiSummary && (
          <div style={{ maxWidth: '760px', margin: '0 auto' }}>

            {/* Document card — wrapped in ref for PDF print */}
            <div ref={reportRef} style={{
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
                  Official Environmental Briefing · TerraSense Geospatial Analysis
                </div>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1a1a1a', margin: '0 0 8px', lineHeight: 1.3 }}>
                  Pampanga Land Use &amp; Hazard Analysis<br />
                  <span style={{ fontWeight: 500, color: '#666' }}>{scope.label} · {dateRange}</span>
                </h2>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  {[
                    ['Generated', timestamp],
                    ['Classification', 'Public Disclosure'],
                    ['Source', 'TerraSense Remote Sensing Data'],
                  ].map(([label, val]) => (
                    <div key={label}>
                      <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#BBB', display: 'block', letterSpacing: '0.04em' }}>{label}</span>
                      <span style={{ fontSize: '12px', color: '#555' }}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Map snapshot */}
              <div style={{
                height: '180px', 
                background: '#E8E6DA url("https://images.unsplash.com/photo-1504608524841-42fe6f0f5b07?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80") center/cover no-repeat',
                borderBottom: '1px solid #EEEAE0', position: 'relative', overflow: 'hidden',
              }}>
              </div>

              {/* Key Metrics Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderBottom: '1px solid #EEEAE0', background: '#fff' }}>
                <div style={{ padding: '18px 28px', borderRight: '1px solid #EEEAE0' }}>
                  <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>Total Farmland Lost</div>
                  <div style={{ fontSize: '22px', fontWeight: 700, color: '#1a1a1a', lineHeight: 1 }}>4,820 ha</div>
                  <div style={{ fontSize: '11.5px', color: '#DC2626', fontWeight: 600, marginTop: '6px' }}>−23.4% since 2018</div>
                </div>
                <div style={{ padding: '18px 28px', borderRight: '1px solid #EEEAE0' }}>
                  <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>Rate of Expansion</div>
                  <div style={{ fontSize: '22px', fontWeight: 700, color: '#1a1a1a', lineHeight: 1 }}>602 ha / yr</div>
                  <div style={{ fontSize: '11.5px', color: '#D97706', fontWeight: 600, marginTop: '6px' }}>+8.3% vs. last year</div>
                </div>
                <div style={{ padding: '18px 28px' }}>
                  <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>Remaining Arable Land</div>
                  <div style={{ fontSize: '22px', fontWeight: 700, color: '#1a1a1a', lineHeight: 1 }}>38.2%</div>
                  <div style={{ fontSize: '11.5px', color: '#DC2626', fontWeight: 600, marginTop: '6px' }}>−5.1 pp since 2018</div>
                </div>
              </div>

              {/* Live Gemini AI Summary sections */}
              <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                <AISummarySection Icon={TrendingUp} iconColor="#D97706" title="The Situation" body={geminiSummary.situation} />
                <AISummarySection Icon={AlertTriangle} iconColor="#DC2626"  title="The Impact"    body={geminiSummary.impact}    />
                <AISummarySection Icon={Shield}       iconColor="#3B82F6"  title="The Risk"      body={geminiSummary.risk}      />

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
                    {geminiSummary.recommendations.map((rec, i) => (
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
                <DownloadRow
                  Icon={FileText} label="Official Briefing (PDF)" sub="AI narrative + map + charts"
                  color="#DC2626" bg="#FEF2F2" onDownload={handleDownloadPDF}
                />
                <DownloadRow Icon={Table} label="Tabular Metrics (.csv)"   sub="Barangay-level raw data"   color="#16A34A" bg="#F0FDF4" />
                <DownloadRow Icon={Map}   label="Spatial Layer (.geojson)"  sub="Vector geometries for GIS" color="#2563EB" bg="#EFF6FF" />
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
  Icon, label, sub, color, bg, onDownload,
}: {
  Icon: React.ElementType; label: string; sub: string; color: string; bg: string; onDownload?: () => void
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
      <button
        onClick={onDownload}
        style={{
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
