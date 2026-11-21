import { useCallback, useEffect, useRef, useState } from 'react'
import { defaultContent, resetContent, type Content } from './content'
import { fetchRemoteContent, saveRemoteContent, setToken, unlockOwner, verifyOwner } from './api'
import { STATIC_ONLY } from './mode'
import { Nav } from './components/Nav'
import { SceneFlow } from './components/SceneFlow'
import {
  BackToTop,
  Customize,
  Loader,
  MusicPlayer,
  OwnerUnlock,
  UndoToast,
} from './components/Chrome'
import {
  About,
  Certificates,
  Contact,
  Hero,
  Interests,
  Journey,
  Projects,
  Skills,
} from './components/Sections'

const SECTIONS = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'projects', label: 'Projects' },
  { id: 'skills', label: 'Skills' },
  { id: 'certificates', label: 'Certificates' },
  { id: 'journey', label: 'Journey' },
  { id: 'contact', label: 'Contact' },
]

export type SaveState = 'idle' | 'saving' | 'saved' | 'error'

export default function App() {
  const [progress, setProgress] = useState(0)
  const [content, setContent] = useState<Content>(() => ({ ...defaultContent }))
  const [customizeOpen, setCustomizeOpen] = useState(false)
  const [unlockOpen, setUnlockOpen] = useState(false)
  const [owner, setOwner] = useState(false)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [undo, setUndo] = useState<{ message: string; restore: () => void } | null>(null)
  const undoTimer = useRef<number | null>(null)
  const saveTimer = useRef<number | null>(null)
  const pendingSave = useRef<Content | null>(null)

  /* --------------------------------------------------------- owner editing */

  const persist = useCallback((next: Content) => {
    pendingSave.current = next
    if (saveTimer.current) window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => {
      const value = pendingSave.current
      if (!value) return
      setSaveState('saving')
      void saveRemoteContent(value).then((ok) => {
        setSaveState(ok ? 'saved' : 'error')
      })
    }, 500)
  }, [])

  const update = useCallback(
    (patch: Partial<Content>) => {
      if (!owner) return
      setContent((current) => {
        const next = { ...current, ...patch }
        persist(next)
        return next
      })
    },
    [owner, persist],
  )

  const offerUndo = useCallback((message: string, restore: () => void) => {
    setUndo({ message, restore })
    if (undoTimer.current) window.clearTimeout(undoTimer.current)
    undoTimer.current = window.setTimeout(() => setUndo(null), 10000)
  }, [])

  const undoRemoval = useCallback(() => {
    if (!undo) return
    if (undoTimer.current) window.clearTimeout(undoTimer.current)
    undo.restore()
    setUndo(null)
  }, [undo])

  useEffect(
    () => () => {
      if (undoTimer.current) window.clearTimeout(undoTimer.current)
      if (saveTimer.current) window.clearTimeout(saveTimer.current)
    },
    [],
  )

  /* ------------------------------------------------- published content sync */

  useEffect(() => {
    if (STATIC_ONLY) return
    let active = true
    const load = async () => {
      const remote = await fetchRemoteContent()
      if (!active) return
      if (remote) setContent(remote)
      const isOwner = await verifyOwner()
      if (active) setOwner(isOwner)
    }
    void load()
    return () => {
      active = false
    }
  }, [])

  const handleUnlock = useCallback(async (key: string) => {
    const result = await unlockOwner(key)
    if (result.ok) {
      setOwner(true)
      setUnlockOpen(false)
      setSaveState('idle')
      const remote = await fetchRemoteContent()
      if (remote) setContent(remote)
    }
    return result
  }, [])

  const signOut = useCallback(() => {
    setToken(null)
    setOwner(false)
    setCustomizeOpen(false)
    setSaveState('idle')
    setUndo(null)
  }, [])

  const resetToDefaults = useCallback(() => {
    const fresh = resetContent()
    setContent(fresh)
    if (owner) persist(fresh)
    setUndo(null)
    setCustomizeOpen(false)
  }, [owner, persist])

  /* ----------------------------------------------- painted scene backdrop */

  const sceneReady = useCallback(() => setProgress(1), [])

  useEffect(() => {
    // Never hold the page behind the loader if a backdrop image is slow.
    const timer = window.setTimeout(() => setProgress(1), 1300)
    return () => window.clearTimeout(timer)
  }, [])

  /* ------------------------------------------------ reveal animations (gsap) */

  useEffect(() => {
    let cleanup: (() => void) | undefined
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'))

    if (reducedMotion) {
      elements.forEach((element) => {
        element.style.opacity = '1'
        element.style.transform = 'none'
      })
      return
    }

    void (async () => {
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ])
      gsap.registerPlugin(ScrollTrigger)
      const tweens = elements
        .filter((element) => element.getBoundingClientRect().top > window.innerHeight * 0.92)
        .map((element) =>
          gsap.fromTo(
            element,
            { y: 34, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.9,
              ease: 'power3.out',
              scrollTrigger: { trigger: element, start: 'top 88%', once: true },
            },
          ),
        )
      cleanup = () => {
        tweens.forEach((tween) => {
          tween.scrollTrigger?.kill()
          tween.kill()
        })
      }
    })()

    return () => cleanup?.()
  }, [content.projects.length, content.milestones.length, content.interests.length])

  const canEdit = owner

  return (
    <>
      <SceneFlow onReady={sceneReady} />

      <Loader progress={progress} />

      <Nav
        sections={SECTIONS}
        initials={content.initials}
        name={content.shortName}
        canEdit={canEdit}
        onOpenCustomize={() => setCustomizeOpen(true)}
      />

      <div className="site">
        <main>
          <Hero content={content} />
          <About
            content={content}
            update={update}
            canEdit={canEdit}
            onOpenCustomize={() => setCustomizeOpen(true)}
          />
          <Projects
            content={content}
            update={update}
            canEdit={canEdit}
            onOpenCustomize={() => setCustomizeOpen(true)}
            onUndo={offerUndo}
          />
          <Skills
            content={content}
            update={update}
            canEdit={canEdit}
            onOpenCustomize={() => setCustomizeOpen(true)}
          />
          <Certificates
            content={content}
            update={update}
            canEdit={canEdit}
            onOpenCustomize={() => setCustomizeOpen(true)}
            onUndo={offerUndo}
          />
          <Journey
            content={content}
            update={update}
            canEdit={canEdit}
            onOpenCustomize={() => setCustomizeOpen(true)}
          />
          <Interests
            content={content}
            update={update}
            canEdit={canEdit}
            onOpenCustomize={() => setCustomizeOpen(true)}
          />
          <Contact
            content={content}
            update={update}
            canEdit={canEdit}
            onOpenCustomize={() => setCustomizeOpen(true)}
          />
        </main>
        <footer className="footer">
          <p>
            © {new Date().getFullYear()} {content.name} · A personal digital world, painted and built
            with React.
          </p>
          {!STATIC_ONLY &&
            (owner ? (
              <button type="button" className="owner-link" onClick={signOut}>
                Owner mode · sign out
              </button>
            ) : (
              <button type="button" className="owner-link" onClick={() => setUnlockOpen(true)}>
                Owner
              </button>
            ))}
        </footer>
      </div>

      <MusicPlayer />
      <BackToTop />

      {undo && (
        <UndoToast
          message={undo.message}
          onUndo={undoRemoval}
          onDismiss={() => setUndo(null)}
        />
      )}

      {unlockOpen && (
        <OwnerUnlock onUnlock={handleUnlock} onClose={() => setUnlockOpen(false)} />
      )}

      {customizeOpen && canEdit && (
        <Customize
          content={content}
          onChange={update}
          saveState={saveState}
          onClose={() => setCustomizeOpen(false)}
          onReset={resetToDefaults}
        />
      )}
    </>
  )
}
