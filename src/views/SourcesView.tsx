import { BookOpen, Satellite, FlaskConical, Globe } from 'lucide-react'

const SOURCES = [
  {
    icon: Satellite,
    name: 'Philippine Space Agency (PhilSA)',
    desc: 'Satellite remote sensing standards and validation.',
    url: 'https://philsa.gov.ph',
  },
  {
    icon: Globe,
    name: 'Copernicus EMSN091',
    desc: 'Radar interferometry data for ground subsidence measurements.',
    url: 'https://emergency.copernicus.eu',
  },
  {
    icon: Globe,
    name: 'Project NOAH & UP LiPAD',
    desc: 'High-resolution DEMs and river basin flood simulations.',
    url: 'https://lipad.dream.upd.edu.ph',
  },
  {
    icon: Satellite,
    name: 'Sentinel-2 (ESA)',
    desc: 'Multispectral surface reflectance imagery for land cover classification.',
    url: 'https://sentinel.esa.int',
  },
  {
    icon: FlaskConical,
    name: 'Google Earth Engine',
    desc: 'Cloud platform for planetary-scale geospatial analysis and CART training.',
    url: 'https://earthengine.google.com',
  },
]

export default function SourcesView() {
  return (
    <div style={{
      flex: 1,
      background: '#F6F4E8',
      overflowY: 'auto',
      padding: '40px 20px',
    }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '44px', height: '44px', borderRadius: '14px',
            background: '#fff', border: '1px solid #E8E6DA',
            boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
            color: '#A2CB8B', flexShrink: 0,
          }}>
            <BookOpen size={20} strokeWidth={1.5} />
          </div>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1a1a1a', margin: '0 0 3px' }}>
              Sources &amp; Methodology
            </h1>
            <p style={{ fontSize: '12.5px', color: '#999', margin: 0, lineHeight: 1.5 }}>
              Geospatial data providers and scientific references used by TerraSense.
            </p>
          </div>
        </div>

        {/* Source cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {SOURCES.map(({ icon: Icon, name, desc, url }) => (
            <a
              key={name}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
                padding: '16px 18px',
                background: '#fff',
                border: '1px solid #E8E6DA',
                borderRadius: '14px',
                textDecoration: 'none',
                boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
                transition: 'box-shadow 180ms ease, border-color 180ms ease',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 4px 16px rgba(162,203,139,0.16)'
                ;(e.currentTarget as HTMLAnchorElement).style.borderColor = '#A2CB8B'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 1px 6px rgba(0,0,0,0.05)'
                ;(e.currentTarget as HTMLAnchorElement).style.borderColor = '#E8E6DA'
              }}
            >
              {/* Icon chip */}
              <span style={{
                flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '36px', height: '36px', borderRadius: '10px',
                background: '#F6F4E8', color: '#666',
              }}>
                <Icon size={16} strokeWidth={2} />
              </span>

              {/* Text */}
              <div>
                <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#1a1a1a', marginBottom: '3px' }}>
                  {name}
                </div>
                <div style={{ fontSize: '12.5px', color: '#888', lineHeight: 1.5 }}>
                  {desc}
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
