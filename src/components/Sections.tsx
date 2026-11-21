import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Certificate, Content, Interest, Milestone, Project } from '../content'
import { uid } from '../content'
import { Icon } from './Icon'

type SectionProps = {
  content: Content
  update: (patch: Partial<Content>) => void
  onOpenCustomize: () => void
  canEdit?: boolean
  onUndo?: (message: string, restore: () => void) => void
}

/* ------------------------------------------------------------------ modal */

export function Modal({
  title,
  description,
  onClose,
  children,
  className = '',
}: {
  title: string
  description?: string
  onClose: () => void
  children: ReactNode
  className?: string
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [onClose])

  return (
    <div
      className={`modal-backdrop ${className}`}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="modal">
        <div className="modal-head">
          <div>
            <h2 className="modal-title">{title}</h2>
            {description && <p className="modal-desc">{description}</p>}
          </div>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Close dialog">
            <Icon name="close" size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------- hero */

export function Hero({ content }: { content: Content }) {
  const roles = content.headline.split('·').map((role) => role.trim()).filter(Boolean)

  return (
    <section id="home" className="section hero" aria-label="Introduction">
      <div className="section-inner">
        <div className="glass hero-panel" data-reveal>
          <span className="eyebrow">
            <Icon name="sparkle" size={13} /> Portfolio
          </span>
          <h1>
            Hi, I&apos;m <span className="gradient-text">{content.shortName}</span>{' '}
            <span className="wave" aria-hidden="true">
              👋
            </span>
          </h1>
          <p className="roles">
            {roles.map((role, index) => (
              <span key={role}>
                {index > 0 && <span className="dot">·</span>}
                {role}
              </span>
            ))}
          </p>
          <p className="lede">{content.tagline}</p>

          <div className="hero-actions">
            <a className="btn primary" href="#projects">
              View Projects <Icon name="arrow" size={17} />
            </a>
            <a className="btn ghost" href="#about">
              About Me
            </a>
          </div>

          <div className="hero-meta">
            <span>
              <Icon name="location" size={14} /> {content.location}
            </span>
            <a href={content.linkedin} target="_blank" rel="noreferrer noopener">
              <span>
                <Icon name="linkedin" size={14} /> LinkedIn profile
              </span>
            </a>
          </div>
        </div>
      </div>

      <a className="scroll-cue" href="#about" aria-label="Scroll to explore the portfolio">
        <span>Scroll to explore</span>
        <span className="mouse" aria-hidden="true" />
      </a>
    </section>
  )
}

/* ------------------------------------------------------------------ about */

export function About({ content, canEdit = false, onOpenCustomize }: SectionProps) {
  return (
    <section id="about" className="section" aria-label="About">
      <div className="section-inner">
        <div className="section-head" data-reveal>
          <span className="eyebrow">01 — About</span>
          <h2 className="section-title">Beyond the Screen</h2>
        </div>

        <div className="about-grid">
          <div className="glass panel" data-reveal>
            <p className="about-body">{content.about}</p>
            {canEdit && (
              <p className="about-note">
                <strong style={{ color: 'rgba(226,236,255,.9)', fontWeight: 500 }}>Note · </strong>
                {content.aboutNote}{' '}
                <button type="button" className="settings-link" onClick={onOpenCustomize}>
                  Edit
                </button>
              </p>
            )}
          </div>

          <div className="stat-list" data-reveal>
            <div className="glass stat">
              <div className="stat-label">Based in</div>
              <div className="stat-value">{content.location}</div>
            </div>
            <div className="glass stat">
              <div className="stat-label">Focus</div>
              <div className="stat-value">Artificial intelligence &amp; machine learning</div>
            </div>
            <div className="glass stat">
              <div className="stat-label">Certificates</div>
              <div className="stat-value">{content.certificates.length} listed</div>
            </div>
            <a className="glass stat" href={content.linkedin} target="_blank" rel="noreferrer noopener">
              <div className="stat-label">Profile</div>
              <div className="stat-value">
                LinkedIn <Icon name="external" size={13} />
              </div>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

/* --------------------------------------------------------------- projects */

const emptyProject = {
  title: '',
  category: '',
  description: '',
  stack: '',
  status: 'In progress',
  github: '',
  live: '',
}

export function Projects({ content, update, canEdit = false, onOpenCustomize, onUndo }: SectionProps) {
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState({ ...emptyProject })
  const [selected, setSelected] = useState<Project | null>(null)
  const [error, setError] = useState('')

  const save = () => {
    if (!draft.title.trim() || !draft.description.trim()) {
      setError('A project needs a title and a description.')
      return
    }
    const project: Project = {
      id: uid(),
      title: draft.title.trim(),
      category: draft.category.trim() || 'Project',
      description: draft.description.trim(),
      stack: draft.stack
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      status: draft.status.trim() || 'In progress',
      github: draft.github.trim() || undefined,
      live: draft.live.trim() || undefined,
    }
    update({ projects: [project, ...content.projects] })
    setDraft({ ...emptyProject })
    setError('')
    setAdding(false)
    setSelected(project)
  }

  return (
    <section id="projects" className="section" aria-label="Projects">
      <div className="section-inner">
        <div className="section-head" data-reveal>
          <span className="eyebrow">02 — Work</span>
          <h2 className="section-title">Things I&apos;ve Built</h2>
          <p className="section-sub">
            Only projects you add appear here — nothing is invented or imported.
          </p>
        </div>

        {content.projects.length === 0 ? (
          <div className="empty" data-reveal>
            <strong>{canEdit ? 'The showcase is ready and empty.' : 'Projects are on the way.'}</strong>
            <p>
              {canEdit
                ? 'This collection is intentionally blank until you add real work. Add a project here and it goes live on the site for every visitor.'
                : 'Real projects will appear here as they are finished — nothing here is invented or imported.'}
            </p>
            {canEdit && (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button type="button" className="btn primary" onClick={() => setAdding(true)}>
                  <Icon name="plus" size={16} /> Add your first project
                </button>
                <button type="button" className="btn ghost" onClick={onOpenCustomize}>
                  Edit profile details
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="grid cards">
              {content.projects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  className="card"
                  onClick={() => setSelected(project)}
                  data-reveal
                >
                  <span className="card-tag">{project.category}</span>
                  <h3>{project.title}</h3>
                  <p>{project.description}</p>
                  {project.stack.length > 0 && (
                    <div className="stack">
                      {project.stack.map((tech) => (
                        <span key={tech}>{tech}</span>
                      ))}
                    </div>
                  )}
                  <div className="card-links">
                    <span>{project.status}</span>
                  </div>
                </button>
              ))}
            </div>
            {canEdit && (
              <div style={{ marginTop: 18 }}>
                <button type="button" className="btn ghost" onClick={() => setAdding(true)}>
                  <Icon name="plus" size={16} /> Add project
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {adding && (
        <Modal
          title="Add a project"
          description="Stored locally in this browser. Add a real project you have built."
          onClose={() => setAdding(false)}
        >
          <div className="grid" style={{ gap: 12 }}>
            <div className="field">
              <label htmlFor="p-title">Title *</label>
              <input
                id="p-title"
                className="input"
                value={draft.title}
                onChange={(event) => setDraft({ ...draft, title: event.target.value })}
              />
            </div>
            <div className="form-row">
              <div className="field">
                <label htmlFor="p-category">Category</label>
                <input
                  id="p-category"
                  className="input"
                  placeholder="Web app, AI, experiment…"
                  value={draft.category}
                  onChange={(event) => setDraft({ ...draft, category: event.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="p-status">Status</label>
                <input
                  id="p-status"
                  className="input"
                  value={draft.status}
                  onChange={(event) => setDraft({ ...draft, status: event.target.value })}
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor="p-desc">Description *</label>
              <textarea
                id="p-desc"
                className="input"
                value={draft.description}
                onChange={(event) => setDraft({ ...draft, description: event.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="p-stack">Tech stack (comma separated)</label>
              <input
                id="p-stack"
                className="input"
                placeholder="Python, Flask, OpenAI API"
                value={draft.stack}
                onChange={(event) => setDraft({ ...draft, stack: event.target.value })}
              />
            </div>
            <div className="form-row">
              <div className="field">
                <label htmlFor="p-github">GitHub URL</label>
                <input
                  id="p-github"
                  className="input"
                  placeholder="https://github.com/…"
                  value={draft.github}
                  onChange={(event) => setDraft({ ...draft, github: event.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="p-live">Live demo URL</label>
                <input
                  id="p-live"
                  className="input"
                  placeholder="https://…"
                  value={draft.live}
                  onChange={(event) => setDraft({ ...draft, live: event.target.value })}
                />
              </div>
            </div>
            {error && (
              <p className="error-text" role="alert">
                {error}
              </p>
            )}
            <div className="modal-actions">
              <button type="button" className="btn ghost" onClick={() => setAdding(false)}>
                Cancel
              </button>
              <button type="button" className="btn primary" onClick={save}>
                Save project
              </button>
            </div>
          </div>
        </Modal>
      )}

      {selected && (
        <Modal title={selected.title} description={selected.category} onClose={() => setSelected(null)}>
          <p style={{ color: 'rgba(233,241,255,.88)' }}>{selected.description}</p>
          {selected.stack.length > 0 && (
            <div className="stack" style={{ marginTop: 14 }}>
              {selected.stack.map((tech) => (
                <span key={tech}>{tech}</span>
              ))}
            </div>
          )}
          <p className="field-help" style={{ marginTop: 14 }}>
            Status · {selected.status}
          </p>
          <div className="card-links" style={{ marginTop: 16 }}>
            {selected.github && (
              <a href={selected.github} target="_blank" rel="noreferrer noopener">
                Repository
              </a>
            )}
            {selected.live && (
              <a href={selected.live} target="_blank" rel="noreferrer noopener">
                Live demo
              </a>
            )}
          </div>
          <div className="modal-actions">
            {canEdit && (
              <button
                type="button"
                className="btn ghost"
                onClick={() => {
                  const previous = content.projects
                  update({ projects: previous.filter((item) => item.id !== selected.id) })
                  onUndo?.(`Project “${selected.title}” removed`, () =>
                    update({ projects: previous }),
                  )
                  setSelected(null)
                }}
              >
                Remove project
              </button>
            )}
            <button type="button" className="btn primary" onClick={() => setSelected(null)}>
              Close
            </button>
          </div>
        </Modal>
      )}
    </section>
  )
}

/* ----------------------------------------------------------------- skills */

export function Skills({ content, canEdit = false, onOpenCustomize }: SectionProps) {
  const total = content.skillGroups.reduce((sum, group) => sum + group.items.length, 0)

  return (
    <section id="skills" className="section" aria-label="Skills">
      <div className="section-inner">
        <div className="section-head" data-reveal>
          <span className="eyebrow">03 — Skills</span>
          <h2 className="section-title">My Technical Universe</h2>
          <p className="section-sub">
            Listed exactly as they appear on your LinkedIn profile — {total} skills, no invented
            percentages.
          </p>
        </div>

        <div className="skill-groups">
          {content.skillGroups.map((group) => (
            <div className="skill-group glass" key={group.category} data-reveal>
              <h3>{group.category}</h3>
              <div className="chips">
                {group.items.map((item) => (
                  <span className="chip" key={item}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {canEdit && (
          <p className="about-note" style={{ marginTop: 20 }} data-reveal>
            Skills are imported from LinkedIn.{' '}
            <button type="button" className="settings-link" onClick={onOpenCustomize}>
              Edit your skills
            </button>
          </p>
        )}
      </div>
    </section>
  )
}

/* ----------------------------------------------------------- certificates */

const emptyCert = { title: '', issuer: '', date: '', credentialId: '', url: '' }

export function Certificates({ content, update, canEdit = false, onUndo }: SectionProps) {
  const [selected, setSelected] = useState<Certificate | null>(null)
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState({ ...emptyCert })
  const [error, setError] = useState('')

  const save = () => {
    if (!draft.title.trim() || !draft.issuer.trim()) {
      setError('A certificate needs a title and an issuing organisation.')
      return
    }
    const certificate: Certificate = {
      id: uid(),
      title: draft.title.trim(),
      issuer: draft.issuer.trim(),
      date: draft.date.trim() || undefined,
      credentialId: draft.credentialId.trim() || undefined,
      url: draft.url.trim() || undefined,
    }
    update({ certificates: [certificate, ...content.certificates] })
    setDraft({ ...emptyCert })
    setError('')
    setAdding(false)
  }

  return (
    <section id="certificates" className="section" aria-label="Certificates">
      <div className="section-inner">
        <div className="section-head" data-reveal>
          <span className="eyebrow">04 — Learning</span>
          <h2 className="section-title">Proof of Learning</h2>
          <p className="section-sub">
            Certificates from your LinkedIn profile and posts. Select one to see its credentials.
          </p>
        </div>

        <div className="grid cards">
          {content.certificates.map((certificate) => (
            <button
              key={certificate.id}
              type="button"
              className="card cert-card"
              onClick={() => setSelected(certificate)}
              data-reveal
              aria-label={`View ${certificate.title} certificate details`}
            >
              <span className="cert-issuer">{certificate.issuer}</span>
              <h3>{certificate.title}</h3>
              <div className="card-links">
                {certificate.date && <span className="cert-date">{certificate.date}</span>}
                {certificate.url && <span style={{ color: '#a9d8ff' }}>Credential available</span>}
              </div>
            </button>
          ))}
        </div>

        {canEdit && (
          <div style={{ marginTop: 18 }}>
            <button type="button" className="btn ghost" onClick={() => setAdding(true)}>
              <Icon name="plus" size={16} /> Add certificate
            </button>
          </div>
        )}
      </div>

      {selected && (
        <Modal title={selected.title} description={selected.issuer} onClose={() => setSelected(null)}>
          <div className="stat-list">
            <div className="stat">
              <div className="stat-label">Issued by</div>
              <div className="stat-value">{selected.issuer}</div>
            </div>
            {selected.date && (
              <div className="stat">
                <div className="stat-label">Issue date</div>
                <div className="stat-value">{selected.date}</div>
              </div>
            )}
            {selected.credentialId && (
              <div className="stat">
                <div className="stat-label">Credential ID</div>
                <div className="stat-value">{selected.credentialId}</div>
              </div>
            )}
            {selected.note && (
              <div className="stat">
                <div className="stat-label">Detail</div>
                <div className="stat-value">{selected.note}</div>
              </div>
            )}
          </div>
          <div className="modal-actions">
            {canEdit && (
              <button
                type="button"
                className="btn ghost"
                onClick={() => {
                  const previous = content.certificates
                  update({ certificates: previous.filter((item) => item.id !== selected.id) })
                  onUndo?.(`Certificate “${selected.title}” removed`, () =>
                    update({ certificates: previous }),
                  )
                  setSelected(null)
                }}
              >
                Remove
              </button>
            )}
            {selected.url ? (
              <a className="btn primary" href={selected.url} target="_blank" rel="noreferrer noopener">
                View credential <Icon name="external" size={15} />
              </a>
            ) : (
              <button type="button" className="btn primary" onClick={() => setSelected(null)}>
                Close
              </button>
            )}
          </div>
        </Modal>
      )}

      {adding && (
        <Modal
          title="Add a certificate"
          description="Only real certificates please — these appear on your public portfolio."
          onClose={() => setAdding(false)}
        >
          <div className="grid" style={{ gap: 12 }}>
            <div className="field">
              <label htmlFor="c-title">Certificate title *</label>
              <input
                id="c-title"
                className="input"
                value={draft.title}
                onChange={(event) => setDraft({ ...draft, title: event.target.value })}
              />
            </div>
            <div className="form-row">
              <div className="field">
                <label htmlFor="c-issuer">Issued by *</label>
                <input
                  id="c-issuer"
                  className="input"
                  value={draft.issuer}
                  onChange={(event) => setDraft({ ...draft, issuer: event.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="c-date">Issue date</label>
                <input
                  id="c-date"
                  className="input"
                  placeholder="Sep 2026"
                  value={draft.date}
                  onChange={(event) => setDraft({ ...draft, date: event.target.value })}
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor="c-id">Credential ID</label>
              <input
                id="c-id"
                className="input"
                value={draft.credentialId}
                onChange={(event) => setDraft({ ...draft, credentialId: event.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="c-url">Credential URL</label>
              <input
                id="c-url"
                className="input"
                placeholder="https://…"
                value={draft.url}
                onChange={(event) => setDraft({ ...draft, url: event.target.value })}
              />
            </div>
            {error && (
              <p className="error-text" role="alert">
                {error}
              </p>
            )}
            <div className="modal-actions">
              <button type="button" className="btn ghost" onClick={() => setAdding(false)}>
                Cancel
              </button>
              <button type="button" className="btn primary" onClick={save}>
                Save certificate
              </button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  )
}

/* ---------------------------------------------------------------- journey */

const emptyMilestone = { title: '', org: '', period: '', description: '' }

export function Journey({ content, update, canEdit = false }: SectionProps) {
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState({ ...emptyMilestone })
  const [error, setError] = useState('')

  const save = () => {
    if (!draft.title.trim()) {
      setError('Give the milestone a title.')
      return
    }
    const milestone: Milestone = {
      id: uid(),
      title: draft.title.trim(),
      org: draft.org.trim() || undefined,
      period: draft.period.trim() || undefined,
      description: draft.description.trim() || undefined,
    }
    update({ milestones: [milestone, ...content.milestones] })
    setDraft({ ...emptyMilestone })
    setError('')
    setAdding(false)
  }

  return (
    <section id="journey" className="section" aria-label="Journey">
      <div className="section-inner">
        <div className="section-head" data-reveal>
          <span className="eyebrow">05 — Journey</span>
          <h2 className="section-title">Every Step Shapes the Future</h2>
          <p className="section-sub">
            Built only from the milestones recorded on your LinkedIn profile.
          </p>
        </div>

        <div className="timeline">
          {content.milestones.map((milestone) => (
            <article className="timeline-item" key={milestone.id} data-reveal>
              {milestone.period && <div className="timeline-period">{milestone.period}</div>}
              <h3>{milestone.title}</h3>
              {milestone.org && <div className="timeline-org">{milestone.org}</div>}
              {milestone.description && <p>{milestone.description}</p>}
            </article>
          ))}
        </div>

        {canEdit && (
          <div style={{ marginTop: 18 }}>
            <button type="button" className="btn ghost" onClick={() => setAdding(true)}>
              <Icon name="plus" size={16} /> Add milestone
            </button>
          </div>
        )}
      </div>

      {adding && (
        <Modal
          title="Add a milestone"
          description="Study, work, or a course — only add things that actually happened."
          onClose={() => setAdding(false)}
        >
          <div className="grid" style={{ gap: 12 }}>
            <div className="field">
              <label htmlFor="m-title">Title *</label>
              <input
                id="m-title"
                className="input"
                placeholder="B.Tech in Artificial Intelligence"
                value={draft.title}
                onChange={(event) => setDraft({ ...draft, title: event.target.value })}
              />
            </div>
            <div className="form-row">
              <div className="field">
                <label htmlFor="m-org">Organisation</label>
                <input
                  id="m-org"
                  className="input"
                  value={draft.org}
                  onChange={(event) => setDraft({ ...draft, org: event.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="m-period">Period</label>
                <input
                  id="m-period"
                  className="input"
                  placeholder="2024 — Present"
                  value={draft.period}
                  onChange={(event) => setDraft({ ...draft, period: event.target.value })}
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor="m-desc">Description</label>
              <textarea
                id="m-desc"
                className="input"
                value={draft.description}
                onChange={(event) => setDraft({ ...draft, description: event.target.value })}
              />
            </div>
            {error && (
              <p className="error-text" role="alert">
                {error}
              </p>
            )}
            <div className="modal-actions">
              <button type="button" className="btn ghost" onClick={() => setAdding(false)}>
                Cancel
              </button>
              <button type="button" className="btn primary" onClick={save}>
                Save milestone
              </button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  )
}

/* -------------------------------------------------------------- interests */

const emptyInterest = { title: '', description: '' }

export function Interests({ content, update, canEdit = false }: SectionProps) {
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState({ ...emptyInterest })
  const [error, setError] = useState('')

  const save = () => {
    if (!draft.title.trim() || !draft.description.trim()) {
      setError('Add a topic and a short description.')
      return
    }
    const interest: Interest = {
      id: uid(),
      title: draft.title.trim(),
      description: draft.description.trim(),
    }
    update({ interests: [interest, ...content.interests] })
    setDraft({ ...emptyInterest })
    setError('')
    setAdding(false)
  }

  return (
    <section id="interests" className="section" aria-label="Interests">
      <div className="section-inner">
        <div className="section-head" data-reveal>
          <span className="eyebrow">06 — Curiosity</span>
          <h2 className="section-title">Curiosity Has No Limits</h2>
          <p className="section-sub">
            The areas your profile points to — AI, Python and continuous learning.
          </p>
        </div>

        <div className="grid cards">
          {content.interests.map((interest) => (
            <div className="card" key={interest.id} data-reveal>
              <span className="card-tag">Interest</span>
              <h3>{interest.title}</h3>
              <p>{interest.description}</p>
            </div>
          ))}
        </div>

        {canEdit && (
          <div style={{ marginTop: 18 }}>
            <button type="button" className="btn ghost" onClick={() => setAdding(true)}>
              <Icon name="plus" size={16} /> Add interest
            </button>
          </div>
        )}
      </div>

      {adding && (
        <Modal title="Add an interest" onClose={() => setAdding(false)}>
          <div className="grid" style={{ gap: 12 }}>
            <div className="field">
              <label htmlFor="i-title">Topic *</label>
              <input
                id="i-title"
                className="input"
                value={draft.title}
                onChange={(event) => setDraft({ ...draft, title: event.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="i-desc">Short description *</label>
              <textarea
                id="i-desc"
                className="input"
                value={draft.description}
                onChange={(event) => setDraft({ ...draft, description: event.target.value })}
              />
            </div>
            {error && (
              <p className="error-text" role="alert">
                {error}
              </p>
            )}
            <div className="modal-actions">
              <button type="button" className="btn ghost" onClick={() => setAdding(false)}>
                Cancel
              </button>
              <button type="button" className="btn primary" onClick={save}>
                Save interest
              </button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  )
}

/* ---------------------------------------------------------------- contact */

type FormState = { name: string; email: string; subject: string; message: string; company: string }
const emptyForm: FormState = { name: '', email: '', subject: '', message: '', company: '' }

export function Contact({ content, canEdit = false, onOpenCustomize }: SectionProps) {
  const [form, setForm] = useState<FormState>({ ...emptyForm })
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [status, setStatus] = useState<{ kind: 'info' | 'warn'; text: string } | null>(null)

  const socials = useMemo(
    () =>
      [
        content.email && { label: content.email, href: `mailto:${content.email}`, icon: 'mail' as const },
        content.linkedin && {
          label: 'LinkedIn',
          href: content.linkedin,
          icon: 'linkedin' as const,
        },
        content.github && { label: 'GitHub', href: content.github, icon: 'github' as const },
        content.instagram && {
          label: 'Instagram',
          href: content.instagram,
          icon: 'instagram' as const,
        },
      ].filter(Boolean) as Array<{ label: string; href: string; icon: 'mail' | 'linkedin' | 'github' | 'instagram' }>,
    [content],
  )

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (form.company) return // honeypot — silently ignore bots

    const next: Partial<Record<keyof FormState, string>> = {}
    if (!form.name.trim()) next.name = 'Please add your name.'
    if (!form.email.trim()) next.email = 'Please add your email.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim()))
      next.email = 'That email address does not look complete.'
    if (!form.message.trim()) next.message = 'Please write a message.'
    setErrors(next)
    if (Object.keys(next).length > 0) {
      setStatus(null)
      return
    }

    if (content.email) {
      const subject = encodeURIComponent(form.subject.trim() || `Hello from ${form.name.trim()}`)
      const body = encodeURIComponent(`${form.message.trim()}\n\n— ${form.name.trim()} (${form.email.trim()})`)
      window.location.href = `mailto:${content.email}?subject=${subject}&body=${body}`
      setStatus({
        kind: 'info',
        text: 'Your email app should open with the message ready to send. This page has no server, so nothing is sent automatically.',
      })
    } else {
      setStatus({
        kind: 'warn',
        text: 'Nothing was sent: this form has no email address or server connected yet. Add your email in Edit content and the form will open a pre-filled draft in your mail app.',
      })
    }
  }

  return (
    <section id="contact" className="section" aria-label="Contact">
      <div className="section-inner">
        <div className="section-head" data-reveal>
          <span className="eyebrow">07 — Contact</span>
          <h2 className="section-title">Let&apos;s Create Something Meaningful</h2>
          <p className="section-sub">
            Have an idea, an opportunity or something interesting to discuss? Let&apos;s connect.
          </p>
        </div>

        <div className="contact-grid">
          <div className="glass panel" data-reveal>
            <p style={{ color: 'rgba(233,241,255,.85)' }}>
              The fastest way to reach me is on LinkedIn. Every link below comes from your saved
              content — no invented addresses.
            </p>
            <div className="contact-list">
              {socials.map((social) => (
                <a
                  className="contact-link"
                  key={social.label}
                  href={social.href}
                  target={social.icon === 'mail' ? undefined : '_blank'}
                  rel={social.icon === 'mail' ? undefined : 'noreferrer noopener'}
                >
                  <Icon name={social.icon} size={17} />
                  <span>{social.label}</span>
                </a>
              ))}
              {socials.length === 1 && canEdit && (
                <button type="button" className="contact-link" onClick={onOpenCustomize}>
                  <Icon name="plus" size={17} />
                  <span>Add email, GitHub or Instagram</span>
                </button>
              )}
            </div>
          </div>

          <form className="glass panel" onSubmit={submit} noValidate data-reveal>
            <div className="form-row">
              <div className="field">
                <label htmlFor="contact-name">Name</label>
                <input
                  id="contact-name"
                  className="input"
                  value={form.name}
                  autoComplete="name"
                  aria-invalid={Boolean(errors.name)}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                />
                {errors.name && <span className="error-text">{errors.name}</span>}
              </div>
              <div className="field">
                <label htmlFor="contact-email">Email</label>
                <input
                  id="contact-email"
                  className="input"
                  type="email"
                  value={form.email}
                  autoComplete="email"
                  aria-invalid={Boolean(errors.email)}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                />
                {errors.email && <span className="error-text">{errors.email}</span>}
              </div>
            </div>
            <div className="field">
              <label htmlFor="contact-subject">Subject</label>
              <input
                id="contact-subject"
                className="input"
                value={form.subject}
                onChange={(event) => setForm({ ...form, subject: event.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="contact-message">Message</label>
              <textarea
                id="contact-message"
                className="input"
                value={form.message}
                aria-invalid={Boolean(errors.message)}
                onChange={(event) => setForm({ ...form, message: event.target.value })}
              />
              {errors.message && <span className="error-text">{errors.message}</span>}
            </div>

            <div className="honeypot" aria-hidden="true">
              <label htmlFor="contact-company">Company</label>
              <input
                id="contact-company"
                tabIndex={-1}
                autoComplete="off"
                value={form.company}
                onChange={(event) => setForm({ ...form, company: event.target.value })}
              />
            </div>

            <button type="submit" className="btn primary" style={{ justifySelf: 'start' }}>
              Send message <Icon name="arrow" size={16} />
            </button>

            {status && (
              <p
                className={`form-status${status.kind === 'warn' ? ' warn' : ''}`}
                role="status"
                aria-live="polite"
              >
                {status.text}
              </p>
            )}
            {!status && (
              <p className="field-help">
                This form is a draft composer: it validates your message and opens a pre-filled email.
                No data leaves your browser until you send it yourself.
              </p>
            )}
          </form>
        </div>
      </div>
    </section>
  )
}
