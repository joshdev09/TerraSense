import { useState, useEffect, useRef } from 'react'
import {
  BarChart2,
  Download,
  MessageSquare,
  BookOpen,
  X,
  Menu,
  Map,
} from 'lucide-react'

export type AppView = 'map' | 'analytics' | 'export' | 'community' | 'sources'

interface BurgerMenuNavProps {
  onNavigate: (view: AppView) => void
  activeView: AppView
}

const NAV_ITEMS: { label: string; icon: React.ElementType; view: AppView }[] = [
  { label: 'Map View',            icon: Map,          view: 'map'       },
  { label: 'Analytics & Reports', icon: BarChart2,    view: 'analytics' },
  { label: 'LGU Data Export Hub', icon: Download,     view: 'export'    },
  { label: 'Community Reports',   icon: MessageSquare, view: 'community' },
  { label: 'Sources',             icon: BookOpen,     view: 'sources'   },
]

function BurgerMenuNav({ onNavigate, activeView }: BurgerMenuNavProps) {
  const [open, setOpen] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [open])

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const handleNavClick = (view: AppView) => {
    onNavigate(view)
    setOpen(false)
  }

  return (
    <>
      {/* ── Burger button ── */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        className="
          p-2 rounded-lg z-10 relative
          text-[#333] hover:bg-[#F0EDE0]
          transition-colors duration-200
          focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A2CB8B]
          cursor-pointer
        "
      >
        <Menu size={22} strokeWidth={2} />
      </button>

      {/* ── Backdrop ── */}
      <div
        onClick={() => setOpen(false)}
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 40,
          background: 'rgba(0,0,0,0.30)',
          backdropFilter: 'blur(2px)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 300ms ease',
        }}
      />

      {/* ── Sidebar drawer ── */}
      <div
        ref={sidebarRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 50,
          height: '100dvh',
          width: '280px',
          background: '#fff',
          boxShadow: '4px 0 24px rgba(0,0,0,0.12)',
          display: 'flex',
          flexDirection: 'column',
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 320ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 20px 16px 24px',
          borderBottom: '1px solid #EEEAE0',
        }}>
          <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#999' }}>
            Menu
          </span>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '32px', height: '32px', borderRadius: '8px',
              border: 'none', background: 'transparent',
              color: '#666', cursor: 'pointer',
              transition: 'background 200ms ease, color 200ms ease',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = '#F0EDE0'
              ;(e.currentTarget as HTMLButtonElement).style.color = '#222'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
              ;(e.currentTarget as HTMLButtonElement).style.color = '#666'
            }}
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '12px 12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {NAV_ITEMS.map(({ label, icon: Icon, view }, i) => (
            <NavItem
              key={view}
              label={label}
              icon={<Icon size={15} strokeWidth={2} />}
              isActive={activeView === view}
              delay={open ? 60 + i * 45 : 0}
              visible={open}
              onClick={() => handleNavClick(view)}
            />
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #EEEAE0', textAlign: 'center' }}>
          <p style={{ fontSize: '11px', color: '#BBB', letterSpacing: '0.04em' }}>
            © 2026 TerraSense
          </p>
        </div>
      </div>
    </>
  )
}

// ── Nav item row ──────────────────────────────────────────────────────────────
function NavItem({
  label,
  icon,
  isActive,
  delay,
  visible,
  onClick,
}: {
  label: string
  icon: React.ReactNode
  isActive: boolean
  delay: number
  visible: boolean
  onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        width: '100%',
        padding: '11px 14px',
        borderRadius: '10px',
        border: isActive ? '1px solid #E8E6DA' : 'none',
        textAlign: 'left',
        fontSize: '14px',
        fontWeight: isActive ? 600 : 500,
        color: isActive ? '#1a1a1a' : (hovered ? '#1a1a1a' : '#333'),
        background: isActive ? '#F6F4E8' : (hovered ? '#F0EDE0' : 'transparent'),
        cursor: 'pointer',
        transform: visible ? 'translateX(0)' : 'translateX(-14px)',
        opacity: visible ? 1 : 0,
        transition: `transform 300ms ease ${delay}ms, opacity 280ms ease ${delay}ms, background 150ms ease, color 150ms ease`,
      }}
    >
      {/* Icon chip */}
      <span style={{
        flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '30px', height: '30px', borderRadius: '8px',
        background: isActive ? '#A2CB8B' : (hovered ? '#A2CB8B' : '#F6F4E8'),
        color: isActive ? '#fff' : (hovered ? '#fff' : '#666'),
        transition: 'background 200ms ease, color 200ms ease',
      }}>
        {icon}
      </span>
      {label}
    </button>
  )
}

export default BurgerMenuNav