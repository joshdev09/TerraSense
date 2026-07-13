import { useState, useEffect, useRef } from 'react'
import {
  BarChart2,
  Download,
  MessageSquare,
  BookOpen,
  X,
  Menu,
} from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Analytics & Reports', icon: BarChart2 },
  { label: 'LGU Data Export Hub', icon: Download },
  { label: 'Community Reports', icon: MessageSquare },
  { label: 'Sources', icon: BookOpen },
]

function BurgerMenuNav() {
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

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      {/* ── Burger Button (lives in Nav bar) ── */}
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
          background: 'rgba(0,0,0,0.35)',
          backdropFilter: 'blur(2px)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 300ms ease',
        }}
      />

      {/* ── Sidebar Drawer ── */}
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
          <span style={{
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            color: '#999',
          }}>
            Menu
          </span>

          <button
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: 'none',
              background: 'transparent',
              color: '#666',
              cursor: 'pointer',
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

        {/* Nav Items */}
        <nav style={{ flex: 1, padding: '12px 12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {NAV_ITEMS.map(({ label, icon: Icon }, i) => (
            <NavItem
              key={label}
              label={label}
              icon={<Icon size={15} strokeWidth={2} />}
              delay={open ? 60 + i * 45 : 0}
              visible={open}
            />
          ))}
        </nav>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #EEEAE0',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '11px', color: '#BBB', letterSpacing: '0.04em' }}>
            © 2026 TerraSense
          </p>
        </div>
      </div>
    </>
  )
}

// Extracted nav item to cleanly handle hover state
function NavItem({
  label,
  icon,
  delay,
  visible,
}: {
  label: string
  icon: React.ReactNode
  delay: number
  visible: boolean
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        width: '100%',
        padding: '11px 14px',
        borderRadius: '10px',
        border: 'none',
        textAlign: 'left',
        fontSize: '14px',
        fontWeight: 500,
        color: hovered ? '#1a1a1a' : '#333',
        background: hovered ? '#F0EDE0' : 'transparent',
        cursor: 'pointer',
        transform: visible ? 'translateX(0)' : 'translateX(-14px)',
        opacity: visible ? 1 : 0,
        transition: `transform 300ms ease ${delay}ms, opacity 280ms ease ${delay}ms, background 150ms ease, color 150ms ease`,
      }}
    >
      {/* Icon chip */}
      <span style={{
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '30px',
        height: '30px',
        borderRadius: '8px',
        background: hovered ? '#A2CB8B' : '#F6F4E8',
        color: hovered ? '#fff' : '#666',
        transition: 'background 200ms ease, color 200ms ease',
      }}>
        {icon}
      </span>
      {label}
    </button>
  )
}

export default BurgerMenuNav