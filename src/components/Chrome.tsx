import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { Content } from '../content'
import { Ambient } from '../audio/ambient'
import { Icon } from './Icon'
import { Modal } from './Sections'

/* ----------------------------------------------------------------- loader */

export function Loader({ progress }: { progress: number }) {
  const done = progress >= 1
  return (
    <div className={`loader${done ? ' done' : ''}`} aria-hidden={done} aria-live="polite">
      <div className="loader-inner">
        <div className="loader-glyph" aria-hidden="true">
          <Icon name="sparkle" size={26} />
        </div>
        <div>
          <p className="loader-title">Entering my digital world…</p>
          <p className="loader-sub">{done ? 'Ready' : 'Lighting the islands'}</p>
        </div>
        <div
          className="progress-track"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
        >
          <div className="progress-bar" style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------ music player */

export function MusicPlayer() {
  const ambient = useRef<Ambient | null>(null)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(0.55)

  useEffect(() => {
    ambient.current = new Ambient()
    return () => ambient.current?.stop()
  }, [])

  const play = async () => {
    const engine = ambient.current
    if (!engine) return
    await engine.start()
    engine.setVolume(muted ? 0 : volume)
    setPlaying(true)
  }

  const pause = () => {
    ambient.current?.stop()
    setPlaying(false)
  }

  const toggleMute = () => {
    const next = !muted
    setMuted(next)
    ambient.current?.setVolume(next ? 0 : volume)
  }

  return (
    <div className="music-player" aria-label="Ambient soundtrack">
      <button
        type="button"
        className="icon-btn"
        onClick={() => (playing ? pause() : void play())}
        aria-label={playing ? 'Pause ambient soundtrack' : 'Play ambient soundtrack'}
        aria-pressed={playing}
      >
        <Icon name={playing ? 'pause' : 'play'} size={15} />
      </button>

      <div className="music-meta">
        <span className="music-label">{playing ? 'Ambient · playing' : 'Ambient · off'}</span>
        <input
          className="volume"
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={muted ? 0 : volume}
          onChange={(event) => {
            const next = Number(event.target.value)
            setVolume(next)
            setMuted(next === 0)
            ambient.current?.setVolume(next)
          }}
          aria-label="Soundtrack volume"
          disabled={!playing}
        />
      </div>

      <button
        type="button"
        className="icon-btn"
        onClick={toggleMute}
        aria-label={muted ? 'Unmute soundtrack' : 'Mute soundtrack'}
        aria-pressed={muted}
      >
        <Icon name={muted ? 'volume-off' : 'volume'} size={16} />
      </button>
    </div>
  )
}

/* -------------------------------------------------------------- back to top */

export function BackToTop() {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 1.4)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <button
      type="button"
      className={`back-to-top${visible ? ' visible' : ''}`}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Back to top"
      tabIndex={visible ? 0 : -1}
    >
      <Icon name="arrow-up" size={17} />
    </button>
  )
}

/* ------------------------------------------------------------- undo toast */

export function UndoToast({
  message,
  onUndo,
  onDismiss,
}: {
  message: string
  onUndo: () => void
  onDismiss: () => void
}) {
  return (
    <div className="undo-toast" role="status" aria-live="polite">
      <span className="undo-text">{message}</span>
      <button type="button" className="btn primary undo-action" onClick={onUndo}>
        Undo
      </button>
      <button type="button" className="icon-btn undo-close" onClick={onDismiss} aria-label="Dismiss">
        <Icon name="close" size={14} />
      </button>
    </div>
  )
}

/* ----------------------------------------------------------- owner sign-in */

export function OwnerUnlock({
  onUnlock,
  onClose,
}: {
  onUnlock: (key: string) => Promise<{ ok: boolean; message?: string }>
  onClose: () => void
}) {
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!value.trim() || busy) return
    setBusy(true)
    setError('')
    const result = await onUnlock(value.trim())
    setBusy(false)
    if (!result.ok) setError(result.message ?? 'That passphrase did not match.')
  }

  return (
    <Modal
      title="Owner sign-in"
      description="Only the site owner can edit or add content. Everyone else sees a read-only portfolio."
      onClose={onClose}
    >
      <form className="grid" style={{ gap: 12 }} onSubmit={(event) => void submit(event)}>
        <div className="field">
          <label htmlFor="owner-key">Owner passphrase</label>
          <input
            id="owner-key"
            className="input"
            type="password"
            autoComplete="current-password"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            autoFocus
          />
          <span className="field-help">
            This is the OWNER_KEY secret you set for this site. It is checked on the server and never
            stored in the page.
          </span>
        </div>
        {error && (
          <p className="error-text" role="alert">
            {error}
          </p>
        )}
        <div className="modal-actions">
          <button type="button" className="btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn primary" disabled={busy}>
            {busy ? 'Checking…' : 'Unlock editing'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

/* --------------------------------------------------------------- customize */

type Props = {
  content: Content
  onChange: (patch: Partial<Content>) => void
  onClose: () => void
  onReset: () => void
  saveState?: 'idle' | 'saving' | 'saved' | 'error'
}

export function Customize({ content, onChange, onClose, onReset, saveState = 'idle' }: Props) {
  const saveLabel =
    saveState === 'saving'
      ? 'Saving to your live site…'
      : saveState === 'saved'
        ? 'Saved — visitors see this now.'
        : saveState === 'error'
          ? 'Could not save to the site. Your edits are kept in this browser; try again or sign in again.'
          : 'Changes publish to your live site for everyone.'

  return (
    <Modal
      title="Edit portfolio content"
      description="You are signed in as the owner, so these changes go live for every visitor."
      onClose={onClose}
      className="customize"
    >
      <div className="grid" style={{ gap: 12 }}>
        <div className="form-row">
          <div className="field">
            <label htmlFor="edit-name">Full name</label>
            <input
              id="edit-name"
              className="input"
              value={content.name}
              onChange={(event) => onChange({ name: event.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="edit-short">Display name</label>
            <input
              id="edit-short"
              className="input"
              value={content.shortName}
              onChange={(event) => onChange({ shortName: event.target.value })}
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="edit-headline">Headline · separate roles with ·</label>
          <input
            id="edit-headline"
            className="input"
            value={content.headline}
            onChange={(event) => onChange({ headline: event.target.value })}
          />
        </div>

        <div className="field">
          <label htmlFor="edit-tagline">Hero line</label>
          <input
            id="edit-tagline"
            className="input"
            value={content.tagline}
            onChange={(event) => onChange({ tagline: event.target.value })}
          />
        </div>

        <div className="field">
          <label htmlFor="edit-location">Location</label>
          <input
            id="edit-location"
            className="input"
            value={content.location}
            onChange={(event) => onChange({ location: event.target.value })}
          />
        </div>

        <div className="field">
          <label htmlFor="edit-about">About</label>
          <textarea
            id="edit-about"
            className="input"
            style={{ minHeight: 140 }}
            value={content.about}
            onChange={(event) => onChange({ about: event.target.value })}
          />
          <span className="field-help">Paste your LinkedIn About text here to use your own words.</span>
        </div>

        <div className="divider" />

        <div className="form-row">
          <div className="field">
            <label htmlFor="edit-email">Email</label>
            <input
              id="edit-email"
              className="input"
              type="email"
              placeholder="you@example.com"
              value={content.email}
              onChange={(event) => onChange({ email: event.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="edit-linkedin">LinkedIn URL</label>
            <input
              id="edit-linkedin"
              className="input"
              value={content.linkedin}
              onChange={(event) => onChange({ linkedin: event.target.value })}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor="edit-github">GitHub URL</label>
            <input
              id="edit-github"
              className="input"
              value={content.github}
              onChange={(event) => onChange({ github: event.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="edit-instagram">Instagram URL</label>
            <input
              id="edit-instagram"
              className="input"
              value={content.instagram}
              onChange={(event) => onChange({ instagram: event.target.value })}
            />
          </div>
        </div>

        <div className="divider" />

        <div className="field">
          <label htmlFor="edit-skills">Skills · one group per line, comma separated</label>
          <textarea
            id="edit-skills"
            className="input"
            style={{ minHeight: 120 }}
            value={content.skillGroups.map((group) => `${group.category}: ${group.items.join(', ')}`).join('\n')}
            onChange={(event) => {
              const groups = event.target.value
                .split('\n')
                .map((line) => {
                  const [category, rest = ''] = line.split(':')
                  return {
                    category: category.trim(),
                    items: rest
                      .split(',')
                      .map((item) => item.trim())
                      .filter(Boolean),
                  }
                })
                .filter((group) => group.category && group.items.length > 0)
              onChange({ skillGroups: groups })
            }}
          />
          <span className="field-help">Example — Programming: Python, JavaScript</span>
        </div>

        <p className="field-help">{content.sourceNote}</p>

        <p className={`save-state ${saveState}`} role="status" aria-live="polite">
          {saveLabel}
        </p>

        <div className="modal-actions">
          <button type="button" className="btn ghost" onClick={onReset}>
            Reset to LinkedIn data
          </button>
          <button type="button" className="btn primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </Modal>
  )
}
