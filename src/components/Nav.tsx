import { useEffect, useRef, useState } from 'react'
import { Icon } from './Icon'

type Props = {
  sections: Array<{ id: string; label: string }>
  initials: string
  name: string
  canEdit?: boolean
  onOpenCustomize: () => void
}

export function Nav({ sections, name, canEdit = false, onOpenCustomize }: Props) {
  const [active, setActive] = useState(sections[0]?.id ?? 'home')
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const lastScroll = useRef(0)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id)
        })
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 },
    )
    sections.forEach(({ id }) => {
      const element = document.getElementById(id)
      if (element) observer.observe(element)
    })
    return () => observer.disconnect()
  }, [sections])

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setScrolled(y > 24)
      if (y > 260 && y > lastScroll.current) setHidden(true)
      else setHidden(false)
      lastScroll.current = y
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <header
        className="nav"
        style={{
          transform: hidden && !open ? 'translateY(-120%)' : 'none',
          opacity: scrolled ? 1 : 0.94,
        }}
      >
        <nav className="nav-inner" aria-label="Primary">
          <a className="brand" href="#home" aria-label={`${name} — home`}>
            <span className="brand-mark" aria-hidden="true">
              <Icon name="cube" size={22} strokeWidth={1.5} />
            </span>
            <span className="name">{name}</span>
          </a>

          <div className="nav-links">
            {sections.map((section) => (
              <a
                key={section.id}
                className={`nav-link${active === section.id ? ' active' : ''}`}
                href={`#${section.id}`}
                aria-current={active === section.id ? 'true' : undefined}
              >
                {section.label}
              </a>
            ))}
          </div>

          <div className="nav-actions">
            <a className="nav-cta" href="#contact">
              Contact <Icon name="arrow" size={15} />
            </a>
            {canEdit && (
              <button
                type="button"
                className="icon-btn"
                onClick={onOpenCustomize}
                aria-label="Edit portfolio content"
                title="Edit content"
              >
                <Icon name="sparkle" size={17} />
              </button>
            )}
            <button
              type="button"
              className="icon-btn menu-btn"
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              aria-controls="mobile-menu"
              onClick={() => setOpen((value) => !value)}
            >
              <Icon name={open ? 'close' : 'menu'} size={18} />
            </button>
          </div>
        </nav>
      </header>

      {open && (
        <div className="mobile-menu" id="mobile-menu">
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className={active === section.id ? 'active' : ''}
              onClick={() => setOpen(false)}
            >
              {section.label}
            </a>
          ))}
          <button
            type="button"
            className="icon-btn"
            style={{ display: 'none' }}
            aria-hidden="true"
            tabIndex={-1}
          />
        </div>
      )}
    </>
  )
}
