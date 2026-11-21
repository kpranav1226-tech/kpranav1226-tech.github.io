import { Fragment, useEffect, useMemo, useRef, type CSSProperties } from 'react'

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
    falls: [
      { x: 0.352, w: 0.022, y: 0.63, h: 0.32 },
      { x: 0.435, w: 0.04, y: 0.645, h: 0.31 },
      { x: 0.631, w: 0.027, y: 0.655, h: 0.26 },
    ],
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
      {scene.clouds.map((cloud, index) => {
        // A second, slower band runs the other way and sits a little lower, so
        // the sky reads as two depths of cloud instead of one wobbling sheet.
        const farY = Math.min(0.97, cloud.y + 0.07)
        return (
          <Fragment key={`cloud-${index}`}>
            <span
              className="scene-cloud"
              style={{
                top: `${cloud.y * 100}%`,
                height: `${cloud.h * 100}%`,
                animationDuration: `${cloud.duration}s`,
                animationDirection: cloud.reverse ? 'alternate-reverse' : 'alternate',
              }}
            />
            <span
              className="scene-cloud is-far"
              style={{
                top: `${farY * 100}%`,
                height: `${cloud.h * 100}%`,
                animationDuration: `${Math.round(cloud.duration * 1.6)}s`,
                animationDirection: cloud.reverse ? 'alternate' : 'alternate-reverse',
                animationDelay: `${-Math.round(cloud.duration * 0.4)}s`,
              }}
            />
          </Fragment>
        )
      })}
      {scene.falls.map((fall, index) => {
        const jitter = (scene.id.charCodeAt(0) % 5) * 0.07
        return (
          <span
            key={`fall-${index}`}
            className="scene-fall"
            style={
              {
                left: `${fall.x * 100}%`,
                width: `${fall.w * 100}%`,
                top: `${fall.y * 100}%`,
                height: `${fall.h * 100}%`,
                '--fall-delay': `${-(index * 0.31 + jitter)}s`,
              } as CSSProperties
            }
          >
            <i className="scene-spray" />
          </span>
        )
      })}
    </div>
  )
}

/** One hand-off between two paintings, measured from the incoming section. */
type Boundary = { from: string; to: string; section: HTMLElement; p: number; target: number }

export function SceneFlow({ onReady }: { onReady?: () => void }) {
  const flowRef = useRef<HTMLDivElement>(null)
  const layerA = useRef<HTMLDivElement>(null)
  const layerB = useRef<HTMLDivElement>(null)
  const readyRef = useRef(onReady)
  readyRef.current = onReady

  const motes = useMemo<Mote[]>(
    () =>
      Array.from({ length: 12 }, (_, index) => {
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
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const sceneById = new Map(SCENES.map((scene) => [scene.id, scene]))
    const ratios = new Map<string, number>([[SCENES[0].id, 1392 / 752]])
    // Cached so the per-frame path never has to ask the browser for layout.
    const view = { width: flow.clientWidth, height: flow.clientHeight }

    /** Size the cover frame to the painting so effects sit on the artwork. */
    const fitFrame = (layer: HTMLDivElement) => {
      const frameEl = layer.querySelector('.scene-frame') as HTMLDivElement | null
      if (!frameEl) return
      const viewWidth = view.width
      const viewHeight = view.height
      const id = layer.dataset.scene || 'home'
      const ratio = ratios.get(id) || 1392 / 752
      let width = viewWidth
      let height = viewWidth / ratio
      if (height < viewHeight) {
        height = viewHeight
        width = viewHeight * ratio
      }
      const scene = sceneById.get(id)
      const position =
        scene && viewWidth <= 820 ? scene.posMobile : scene ? scene.pos : ([0.5, 0.48] as [number, number])
      frameEl.style.width = `${Math.round(width)}px`
      frameEl.style.height = `${Math.round(height)}px`
      frameEl.style.transform = `translate3d(${-((width - viewWidth) * position[0])}px, ${-((height - viewHeight) * position[1])}px, 0)`
    }

    // The first painting is needed for the hand-off out of the loader, so it is
    // fetched right away. The rest are warmed one at a time once the page is
    // idle, so decoding five large images never competes with the first scroll.
    const warm = (scene: Scene) => {
      const preload = new Image()
      const settle = () => {
        if (!preload.naturalWidth || !preload.naturalHeight) return
        ratios.set(scene.id, preload.naturalWidth / preload.naturalHeight)
        layers.forEach(fitFrame)
      }
      preload.addEventListener('load', settle, { once: true })
      preload.src = scene.src
      if (preload.complete) settle()
      if (typeof preload.decode === 'function') preload.decode().catch(() => undefined)
    }
    warm(SCENES[0])
    SCENES.slice(1).forEach((scene, index) => {
      const run = () => warm(scene)
      const idle = window.requestIdleCallback
      if (typeof idle === 'function') idle(run, { timeout: 2500 })
      else window.setTimeout(run, 500 + index * 350)
    })

    /* ------------------------------------------------ scene boundaries */

    const sectionEls = Object.keys(SECTION_SCENE)
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => Boolean(element))

    const boundaries: Boundary[] = []
    sectionEls.forEach((element, index) => {
      const previous = sectionEls[index - 1]
      if (!previous) return
      const previousScene = SECTION_SCENE[previous.id]
      const scene = SECTION_SCENE[element.id]
      if (!scene || scene === previousScene) return
      boundaries.push({ from: previousScene, to: scene, section: element, p: 0, target: 0 })
    })

    const slot = { out: 0, in: 1 }
    let pairIndex = 0
    let activeSection = 'home'
    let shift = 0
    let shiftTarget = 0

    // Section offsets are measured on load and on resize, never while scrolling.
    const tops = new Map<string, { top: number; height: number }>()
    const measureSections = () => {
      sectionEls.forEach((element) => {
        const rect = element.getBoundingClientRect()
        tops.set(element.id, { top: rect.top + window.scrollY, height: rect.height })
      })
    }

    const setLayerScene = (index: number, id: string) => {
      const scene = sceneById.get(id)
      if (!scene) return
      const layer = layers[index]
      layer.dataset.scene = id
      const image = images[index]
      image.dataset.scene = id
      if (image.getAttribute('src') !== scene.src) image.src = scene.src
      fitFrame(layer)
    }

    const ensurePair = (index: number) => {
      pairIndex = index
      const boundary = boundaries[index]
      if (!boundary) return
      let outIndex = layers.findIndex((layer) => layer.dataset.scene === boundary.from)
      if (outIndex === -1) {
        const toHolder = layers.findIndex((layer) => layer.dataset.scene === boundary.to)
        outIndex = toHolder === -1 ? slot.out : 1 - toHolder
        setLayerScene(outIndex, boundary.from)
      }
      slot.out = outIndex
      slot.in = 1 - outIndex
      if (layers[slot.in].dataset.scene !== boundary.to) setLayerScene(slot.in, boundary.to)
    }

    // Chosen from the live scroll position, not the eased value, so a fast
    // flick still lands on the right painting.
    const activeIndex = () => {
      let index = 0
      for (let cursor = 0; cursor < boundaries.length; cursor += 1) {
        if (boundaries[cursor].target > 0.001) index = cursor
      }
      return index
    }

    const paint = () => {
      if (!boundaries.length) return
      const index = activeIndex()
      if (index !== pairIndex) ensurePair(index)
      const p = Math.max(0, Math.min(1, boundaries[index].p))
      const outLayer = layers[slot.out]
      const inLayer = layers[slot.in]
      flow.style.setProperty('--scene-shift', `${shift.toFixed(1)}px`)

      if (reduced) {
        outLayer.style.transform = 'none'
        inLayer.style.transform = 'none'
        outLayer.style.opacity = p < 0.5 ? '1' : '0'
        inLayer.style.opacity = p < 0.5 ? '0' : '1'
        return
      }

      // One progress value drives both paintings: the old one recedes toward
      // you as the next rises into place, so the journey reads as one flight.
      outLayer.style.transform = `translate3d(0, ${shift.toFixed(1)}px, 0) translateY(${(-6 * p).toFixed(2)}%) scale(${(
        1 + 0.35 * p
      ).toFixed(4)})`
      inLayer.style.transform = `translate3d(0, ${shift.toFixed(1)}px, 0) translateY(${(6 * (1 - p)).toFixed(2)}%) scale(${(
        0.82 + 0.18 * p
      ).toFixed(4)})`
      outLayer.style.opacity = `${(1 - p).toFixed(3)}`
      inLayer.style.opacity = `${p.toFixed(3)}`
    }

    /* -------------------------------------------------- scroll progress */

    let disposed = false
    let frameId = 0
    let resizeTimer = 0

    /** Every layout read happens here, before a single style is written. */
    const readScroll = () => {
      const height = window.innerHeight || 1
      const y = window.scrollY
      boundaries.forEach((boundary) => {
        const info = tops.get(boundary.section.id)
        if (!info) return
        const top = info.top - y
        boundary.target = Math.max(0, Math.min(1, (height * 0.95 - top) / (height * 0.83)))
      })
      const current = tops.get(activeSection)
      if (current) {
        const progress = (height * 0.5 - (current.top - y)) / Math.max(1, current.height)
        shiftTarget = Math.round((Math.max(0, Math.min(1, progress)) - 0.5) * 54)
      }
    }

    /** One easing loop: it runs only while something is still settling. */
    const step = () => {
      frameId = 0
      if (disposed) return
      readScroll()
      let moving = false
      boundaries.forEach((boundary) => {
        const delta = boundary.target - boundary.p
        if (reduced || Math.abs(delta) < 0.0004) {
          boundary.p = boundary.target
          return
        }
        boundary.p += delta * 0.16
        moving = true
      })
      const shiftDelta = shiftTarget - shift
      if (reduced || Math.abs(shiftDelta) < 0.05) shift = shiftTarget
      else {
        shift += shiftDelta * 0.16
        moving = true
      }
      paint()
      if (moving) frameId = window.requestAnimationFrame(step)
    }

    const kick = () => {
      if (frameId || disposed) return
      frameId = window.requestAnimationFrame(step)
    }

    const onResize = () => {
      view.width = flow.clientWidth
      view.height = flow.clientHeight
      layers.forEach(fitFrame)
      measureSections()
      kick()
    }

    const onResizeSoon = () => {
      window.clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(onResize, 120)
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          activeSection = entry.target.id
          kick()
        })
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 },
    )

    sectionEls.forEach((element) => observer.observe(element))

    ensurePair(0)
    measureSections()
    layers.forEach(fitFrame)
    kick()
    window.addEventListener('scroll', kick, { passive: true })
    window.addEventListener('resize', onResizeSoon)
    if (document.fonts?.ready) {
      document.fonts.ready
        .then(() => {
          measureSections()
          kick()
        })
        .catch(() => undefined)
    }

    const hero = images[0]
    const announce = () => readyRef.current?.()
    if (hero.complete && hero.naturalWidth > 0) announce()
    else hero.addEventListener('load', announce, { once: true })

    return () => {
      disposed = true
      observer.disconnect()
      hero.removeEventListener('load', announce)
      window.removeEventListener('scroll', kick)
      window.removeEventListener('resize', onResizeSoon)
      window.clearTimeout(resizeTimer)
      if (frameId) window.cancelAnimationFrame(frameId)
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
