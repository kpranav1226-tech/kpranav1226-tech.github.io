import { useEffect, useMemo, useRef, type CSSProperties } from 'react'

const BASE = import.meta.env.BASE_URL

/** A waterfall the painting shows, in image coordinates (0–1). */
type Fall = { x: number; w: number; y: number; h: number }

/** A band of cloud that should drift, in image coordinates (0–1). */
type Cloud = { y: number; h: number; duration: number; reverse?: boolean }

type Scene = {
  id: string
  src: string
  /** Desktop framing, as an object-position pair. */
  pos: [number, number]
  /** Framing on tall, narrow screens. */
  posMobile: [number, number]
  clouds: Cloud[]
  falls: Fall[]
}

/** The painted world, one scene per stop on the journey. */
const SCENES: Scene[] = [
  {
    id: 'home',
    src: `${BASE}scenes/01-home-hero.jpg`,
    pos: [0.5, 0.48],
    posMobile: [0.5, 0.46],
    clouds: [
      { y: 0.5, h: 0.18, duration: 58 },
      { y: 0.64, h: 0.2, duration: 74, reverse: true },
      { y: 0.8, h: 0.24, duration: 92 },
    ],
    falls: [],
  },
  {
    id: 'projects',
    src: `${BASE}scenes/02-projects.jpg`,
    pos: [0.5, 0.48],
    posMobile: [0.3, 0.56],
    clouds: [
      { y: 0.54, h: 0.18, duration: 66 },
      { y: 0.7, h: 0.22, duration: 84, reverse: true },
      { y: 0.86, h: 0.2, duration: 104 },
    ],
    falls: [
      { x: 0.198, w: 0.013, y: 0.775, h: 0.2 },
      { x: 0.366, w: 0.014, y: 0.755, h: 0.23 },
      { x: 0.697, w: 0.018, y: 0.655, h: 0.25 },
      { x: 0.758, w: 0.013, y: 0.6, h: 0.26 },
    ],
  },
  {
    id: 'skills',
    src: `${BASE}scenes/03-skills.jpg`,
    pos: [0.5, 0.48],
    posMobile: [0.5, 0.54],
    clouds: [
      { y: 0.56, h: 0.2, duration: 70 },
      { y: 0.74, h: 0.24, duration: 96, reverse: true },
    ],
    falls: [
      { x: 0.214, w: 0.015, y: 0.475, h: 0.43 },
      { x: 0.278, w: 0.013, y: 0.485, h: 0.4 },
      { x: 0.388, w: 0.014, y: 0.495, h: 0.37 },
      { x: 0.588, w: 0.018, y: 0.465, h: 0.39 },
      { x: 0.812, w: 0.014, y: 0.465, h: 0.37 },
    ],
  },
  {
    id: 'about',
    src: `${BASE}scenes/04-about.jpg`,
    pos: [0.5, 0.48],
    posMobile: [0.74, 0.54],
    clouds: [
      { y: 0.54, h: 0.18, duration: 68 },
      { y: 0.7, h: 0.2, duration: 88, reverse: true },
      { y: 0.86, h: 0.18, duration: 108 },
    ],
    falls: [],
  },
  {
    id: 'contact',
    src: `${BASE}scenes/05-contact.jpg`,
    pos: [0.5, 0.48],
    posMobile: [0.5, 0.58],
    clouds: [
      { y: 0.56, h: 0.18, duration: 72 },
      { y: 0.72, h: 0.2, duration: 94, reverse: true },
    ],
    falls: [
      { x: 0.428, w: 0.018, y: 0.715, h: 0.24 },
      { x: 0.598, w: 0.016, y: 0.73, h: 0.22 },
    ],
  },
]

/** Sections that share a scene are painted as one continuous place. */
const SECTION_SCENE: Record<string, string> = {
  home: 'home',
  about: 'about',
  projects: 'projects',
  skills: 'skills',
  certificates: 'skills',
  journey: 'about',
  interests: 'about',
  contact: 'contact',
}

type Mote = { left: number; delay: number; duration: number; size: number }

function SceneFx({ scene }: { scene: Scene }) {
  return (
    <div className={`scene-fx fx-${scene.id}`}>
      {scene.clouds.map((cloud, index) => (
        <span
          key={`cloud-${index}`}
          className="scene-cloud"
          style={{
            top: `${cloud.y * 100}%`,
            height: `${cloud.h * 100}%`,
            animationDuration: `${cloud.duration}s`,
            animationDirection: cloud.reverse ? 'alternate-reverse' : 'alternate',
          }}
        />
      ))}
      {scene.falls.map((fall, index) => (
        <span
          key={`fall-${index}`}
          className="scene-fall"
          style={
            {
              left: `${fall.x * 100}%`,
              width: `${fall.w * 100}%`,
              top: `${fall.y * 100}%`,
              height: `${fall.h * 100}%`,
              '--fall-delay': `${-index * 0.31}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}

export function SceneFlow({ onReady }: { onReady?: () => void }) {
  const flowRef = useRef<HTMLDivElement>(null)
  const layerA = useRef<HTMLDivElement>(null)
  const layerB = useRef<HTMLDivElement>(null)
  const readyRef = useRef(onReady)
  readyRef.current = onReady

  const motes = useMemo<Mote[]>(
    () =>
      Array.from({ length: 20 }, (_, index) => {
        const seed = (index * 47 + 13) % 101
        return {
          left: (seed / 101) * 100,
          delay: -((index * 3.7) % 24),
          duration: 20 + ((index * 5) % 18),
          size: 3 + ((index * 7) % 5),
        }
      }),
    [],
  )

  useEffect(() => {
    const flow = flowRef.current
    const first = layerA.current
    const second = layerB.current
    if (!flow || !first || !second) return

    const layers = [first, second]
    const images = layers.map((layer) => layer.querySelector('img') as HTMLImageElement)

    /** Size the cover frame to the painting so effects sit on the artwork. */
    const fitFrame = (layer: HTMLDivElement) => {
      const frame = layer.querySelector('.scene-frame') as HTMLDivElement | null
      const image = layer.querySelector('img') as HTMLImageElement | null
      if (!frame || !image) return
      const viewWidth = flow.clientWidth
      const viewHeight = flow.clientHeight
      const ratio = image.naturalWidth && image.naturalHeight ? image.naturalWidth / image.naturalHeight : 1392 / 752
      let width = viewWidth
      let height = viewWidth / ratio
      if (height < viewHeight) {
        height = viewHeight
        width = viewHeight * ratio
      }
      const scene = SCENES.find((item) => item.id === (layer.dataset.scene || 'home'))
      const position = scene && viewWidth <= 820 ? scene.posMobile : scene ? scene.pos : ([0.5, 0.48] as [number, number])
      frame.style.width = `${Math.round(width)}px`
      frame.style.height = `${Math.round(height)}px`
      frame.style.transform = `translate3d(${-((width - viewWidth) * position[0])}px, ${-((height - viewHeight) * position[1])}px, 0)`
    }

    let visible = 0
    let activeId = 'home'
    let activeSection = 'home'
    let token = 0
    let frame = 0

    const shift = () => {
      const section = document.getElementById(activeSection)
      if (!section) return
      const rect = section.getBoundingClientRect()
      const progress = (window.innerHeight * 0.5 - rect.top) / Math.max(1, rect.height)
      const clamped = Math.max(0, Math.min(1, progress))
      flow.style.setProperty('--scene-shift', `${Math.round((clamped - 0.5) * 54)}px`)
    }

    const onScroll = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        frame = 0
        shift()
      })
    }

    const onResize = () => {
      layers.forEach(fitFrame)
      onScroll()
    }

    const show = (id: string) => {
      if (id === activeId) return
      const scene = SCENES.find((item) => item.id === id)
      if (!scene) return
      activeId = id
      const myToken = ++token
      const nextIndex = 1 - visible
      const nextLayer = layers[nextIndex]
      const nextImage = images[nextIndex]

      nextLayer.classList.remove('is-visible')
      nextLayer.dataset.scene = scene.id
      nextImage.dataset.scene = scene.id
      nextImage.src = scene.src

      const reveal = () => {
        if (myToken !== token) return
        fitFrame(nextLayer)
        // Register the cleared state before fading the new scene in.
        void nextLayer.offsetWidth
        layers[visible].classList.remove('is-visible')
        nextLayer.classList.add('is-visible')
        visible = nextIndex
        flow.classList.remove('is-flashing')
        void flow.offsetWidth
        flow.classList.add('is-flashing')
      }

      const paint = () => {
        // Decode off the main thread first so the crossfade never hitches.
        if (typeof nextImage.decode === 'function') {
          nextImage.decode().catch(() => undefined).then(() => window.requestAnimationFrame(reveal))
        } else {
          window.requestAnimationFrame(reveal)
        }
      }

      if (nextImage.complete && nextImage.naturalWidth > 0) {
        paint()
      } else {
        nextImage.addEventListener('load', paint, { once: true })
        nextImage.addEventListener('error', paint, { once: true })
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          activeSection = entry.target.id
          shift()
          const sceneId = SECTION_SCENE[activeSection]
          if (sceneId) show(sceneId)
        })
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 },
    )

    Object.keys(SECTION_SCENE).forEach((id) => {
      const section = document.getElementById(id)
      if (section) observer.observe(section)
    })

    const hero = images[0]
    const announce = () => readyRef.current?.()
    if (hero.complete && hero.naturalWidth > 0) announce()
    else hero.addEventListener('load', announce, { once: true })

    // Bring the rest of the journey in quietly, one at a time, so the first
    // scene and the page's own work are never competing with four big decodes.
    const rest = SCENES.slice(1).map((scene) => scene.src)
    let preloadTimer = 0
    const preloadNext = () => {
      const src = rest.shift()
      if (!src) return
      const preload = new Image()
      preload.src = src
      preloadTimer = window.setTimeout(preloadNext, 900)
    }
    preloadTimer = window.setTimeout(preloadNext, 1500)

    layers.forEach(fitFrame)
    shift()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)

    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      if (frame) window.cancelAnimationFrame(frame)
      window.clearTimeout(preloadTimer)
    }
  }, [])

  return (
    <div className="scene-flow" ref={flowRef} aria-hidden="true">
      <div className="scene-layer is-visible" ref={layerA} data-scene="home">
        <div className="scene-frame">
          <div className="scene-art">
            <img src={SCENES[0].src} data-scene="home" alt="" decoding="async" />
            {SCENES.map((scene) => (
              <SceneFx key={scene.id} scene={scene} />
            ))}
          </div>
        </div>
      </div>
      <div className="scene-layer" ref={layerB}>
        <div className="scene-frame">
          <div className="scene-art">
            <img alt="" decoding="async" />
            {SCENES.map((scene) => (
              <SceneFx key={scene.id} scene={scene} />
            ))}
          </div>
        </div>
      </div>

      <div className="scene-motes">
        {motes.map((mote, index) => (
          <span
            key={index}
            style={{
              left: `${mote.left}%`,
              width: `${mote.size}px`,
              height: `${mote.size}px`,
              animationDelay: `${mote.delay}s`,
              animationDuration: `${mote.duration}s`,
            }}
          />
        ))}
      </div>

      <div className="scene-bloom" />
      <div className="scene-veil" />
    </div>
  )
}
