import * as THREE from 'three'

export type WorldSettings = {
  mobile: boolean
  reducedMotion: boolean
  onProgress: (progress: number) => void
}

type Keyframe = { pos: [number, number, number]; target: [number, number, number] }

/* Pre-allocated so the animation loop never creates garbage per frame. */
const SKY_BOTTOM_COOL = new THREE.Color('#ffd49b')
const SKY_BOTTOM_WARM = new THREE.Color('#ffb573')
const SKY_MID_COOL = new THREE.Color('#f7a98f')
const SKY_MID_WARM = new THREE.Color('#ef9490')

/** Camera keyframes — one per portfolio section, all orbiting the same world. */
const KEYFRAMES: Keyframe[] = [
  { pos: [0, 9, 34], target: [-6, 2.4, 0] }, // hero
  { pos: [-11, 6.5, 20], target: [-2, 2.4, 0] }, // about
  { pos: [13, 7, 19], target: [2.4, 2.2, -1] }, // projects
  { pos: [2, 13, 19], target: [0, 3.2, 0] }, // skills
  { pos: [-3, -7, 21], target: [1, -2, 0] }, // certificates
  { pos: [-13, 7, 19], target: [-21, 2.5, 0] }, // journey
  { pos: [15, 8, 15], target: [4, 3.2, -2] }, // interests
  { pos: [0, 3.6, 34], target: [0, 2.2, -8] }, // contact
]

const ISLAND_RADIUS = 6
const PLATEAU = ISLAND_RADIUS * 0.42

function cloudTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 128
  const ctx = canvas.getContext('2d')
  if (ctx) {
    const gradient = ctx.createRadialGradient(64, 64, 4, 64, 64, 62)
    gradient.addColorStop(0, 'rgba(255,255,255,0.95)')
    gradient.addColorStop(0.42, 'rgba(255,255,255,0.45)')
    gradient.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 128, 128)
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function dotTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 64
  const ctx = canvas.getContext('2d')
  if (ctx) {
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
    gradient.addColorStop(0, 'rgba(255,255,255,1)')
    gradient.addColorStop(0.35, 'rgba(200,230,255,0.55)')
    gradient.addColorStop(1, 'rgba(160,200,255,0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 64, 64)
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function makeSky() {
  const uniforms = {
    uTop: { value: new THREE.Color('#5b8ed6') },
    uMid: { value: new THREE.Color('#f7a98f') },
    uBottom: { value: new THREE.Color('#ffd49b') },
    uSunColor: { value: new THREE.Color('#fff2c9') },
    uSunDir: { value: new THREE.Vector3(-0.42, 0.2, -1).normalize() },
    uWarm: { value: 0 },
  }
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms,
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uTop;
      uniform vec3 uMid;
      uniform vec3 uBottom;
      uniform vec3 uSunColor;
      uniform vec3 uSunDir;
      uniform float uWarm;
      varying vec3 vDir;

      void main() {
        vec3 dir = normalize(vDir);
        float h = clamp(dir.y * 0.5 + 0.5, 0.0, 1.0);
        vec3 col = mix(uBottom, uMid, smoothstep(0.24, 0.52, h));
        col = mix(col, uTop, smoothstep(0.52, 1.0, h));

        // warm horizon band
        float band = smoothstep(0.30, 0.44, h) * (1.0 - smoothstep(0.44, 0.64, h));
        col += uSunColor * band * (0.26 + uWarm * 0.2);

        // soft sun glow + hot core
        float sun = pow(max(0.0, 1.0 - distance(dir, normalize(uSunDir))), 42.0);
        float core = pow(max(0.0, 1.0 - distance(dir, normalize(uSunDir))), 420.0);
        col += uSunColor * (sun * 1.05 + core * 1.4);

        gl_FragColor = vec4(col, 1.0);
      }
    `,
  })
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(420, 32, 24), material)
  mesh.renderOrder = -10
  return { mesh, uniforms }
}

function makeIsland(radius: number, detail: number, seed = 0): THREE.Group {
  const group = new THREE.Group()
  const geometry = new THREE.IcosahedronGeometry(radius, detail)
  const position = geometry.attributes.position as THREE.BufferAttribute
  const colors = new Float32Array(position.count * 3)
  const v = new THREE.Vector3()
  const plateau = radius * 0.42

    const grassA = new THREE.Color('#7cc46b')
    const grassB = new THREE.Color('#a9d97e')
    const rockA = new THREE.Color('#c79a72')
    const rockB = new THREE.Color('#7b5847')

  for (let i = 0; i < position.count; i++) {
    v.fromBufferAttribute(position, i)
    const n = v.clone().normalize()
    const bump =
      1 +
      0.16 * Math.sin(n.x * 4.3 + n.y * 2.1 + seed) +
      0.11 * Math.sin(n.z * 5.1 - 1.3 + seed) +
      0.06 * Math.sin(n.x * 8.7 + n.z * 6.3)

    v.multiplyScalar(bump)
    if (v.y > plateau) v.y = plateau + (v.y - plateau) * 0.16
    if (v.y < 0) {
      const taper = Math.max(0.05, 1 + v.y / (radius * 1.45))
      v.x *= taper
      v.z *= taper
      v.y *= 1.9
    }
    position.setXYZ(i, v.x, v.y, v.z)

    if (v.y > plateau * 0.72) {
      const grass = grassA.clone().lerp(grassB, Math.random() * 0.9)
      colors[i * 3] = grass.r
      colors[i * 3 + 1] = grass.g
      colors[i * 3 + 2] = grass.b
    } else {
      const depth = Math.min(1, Math.abs(v.y) / (radius * 2.1))
      const rock = rockA.clone().lerp(rockB, depth)
      colors[i * 3] = rock.r
      colors[i * 3 + 1] = rock.g
      colors[i * 3 + 2] = rock.b
    }
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geometry.computeVertexNormals()

  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    flatShading: true,
    roughness: 0.94,
    metalness: 0.02,
  })
  group.add(new THREE.Mesh(geometry, material))
  return group
}

function makeTree(scale: number): THREE.Group {
  const group = new THREE.Group()
  const trunkMaterial = new THREE.MeshStandardMaterial({
    color: '#7a5334',
    roughness: 1,
    flatShading: true,
  })
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.16, 1.1, 6), trunkMaterial)
  trunk.position.y = 0.55
  group.add(trunk)

  const leaves = ['#5da84f', '#7cc45f', '#4b8c46']
  const blobs: Array<[number, number, number, number]> = [
    [0, 1.2, 0, 0.46],
    [0.3, 1.42, 0.1, 0.32],
    [-0.28, 1.36, -0.12, 0.3],
    [0.05, 1.62, -0.05, 0.26],
  ]
  blobs.forEach(([x, y, z, r], i) => {
    const material = new THREE.MeshStandardMaterial({
      color: leaves[i % leaves.length],
      roughness: 0.9,
      flatShading: true,
    })
    const blob = new THREE.Mesh(new THREE.SphereGeometry(r, 7, 6), material)
    blob.position.set(x, y, z)
    blob.scale.y = 0.85
    group.add(blob)
  })

  group.scale.setScalar(scale)
  return group
}

function makeStructure(): THREE.Group {
  const group = new THREE.Group()
  const glass = new THREE.MeshStandardMaterial({
    color: '#e6f3ff',
    transparent: true,
    opacity: 0.34,
    roughness: 0.06,
    metalness: 0.45,
    side: THREE.DoubleSide,
  })
  const glow = new THREE.MeshStandardMaterial({
    color: '#ffe9c4',
    emissive: new THREE.Color('#ffab5c'),
    emissiveIntensity: 2.4,
    roughness: 0.4,
  })
  const trim = new THREE.MeshStandardMaterial({
    color: '#8ff4ff',
    emissive: new THREE.Color('#41d8ff'),
    emissiveIntensity: 1.6,
    roughness: 0.4,
  })

  const deck = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.16, 1.9), glass)
  deck.position.y = 0.3
  group.add(deck)

  const backWall = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.9, 0.1), glass)
  backWall.position.set(0, 1.4, -0.7)
  group.add(backWall)

  const roof = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.1, 2.1), glass)
  roof.position.y = 2.5
  group.add(roof)

  ;[-1.35, 1.35].forEach((x) => {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.3, 0.1), glass)
    pillar.position.set(x, 1.4, 0.7)
    group.add(pillar)
  })

  const strip = new THREE.Mesh(new THREE.BoxGeometry(2.95, 0.05, 1.95), glow)
  strip.position.y = 0.27
  group.add(strip)

  const beam = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.06, 0.06), trim)
  beam.position.set(0, 2.44, 0.72)
  group.add(beam)

  // floating glass shard above the structure
  const shard = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), glass)
  shard.position.set(0.9, 3.1, 0.2)
  shard.rotation.set(0.4, 0.6, 0.2)
  group.add(shard)

  return group
}

function makeCrystal(color: string, size: number): THREE.Mesh {
  const material = new THREE.MeshStandardMaterial({
    color,
    emissive: new THREE.Color(color),
    emissiveIntensity: 1.4,
    roughness: 0.18,
    metalness: 0.35,
    transparent: true,
    opacity: 0.9,
  })
  const mesh = new THREE.Mesh(new THREE.OctahedronGeometry(size, 0), material)
  mesh.scale.y = 1.7
  return mesh
}

function makeGlassCube(): THREE.Group {
  const group = new THREE.Group()
  const material = new THREE.MeshStandardMaterial({
    color: '#d8ecff',
    transparent: true,
    opacity: 0.26,
    roughness: 0.05,
    metalness: 0.5,
    side: THREE.DoubleSide,
  })
  const cube = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.7, 1.7), material)
  group.add(cube)

  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(cube.geometry),
    new THREE.LineBasicMaterial({ color: '#ffd7a3', transparent: true, opacity: 0.9 }),
  )
  group.add(edges)

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.55, 0.018, 8, 96),
    new THREE.MeshStandardMaterial({
      color: '#9fe8ff',
      emissive: new THREE.Color('#57d9ff'),
      emissiveIntensity: 2.2,
      roughness: 0.3,
    }),
  )
  ring.rotation.set(1.22, 0.2, 0.15)
  group.add(ring)
  group.userData.ring = ring

  return group
}

function makeWaterfall(width: number, height: number, opacity = 1) {
  const uniforms = {
    uTime: { value: 0 },
    uOpacity: { value: opacity },
  }
  const geometry = new THREE.PlaneGeometry(width, height, 1, 1)
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uOpacity;
      varying vec2 vUv;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(41.0, 289.0))) * 45871.0);
      }
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }

      void main() {
        float flow = uTime * 0.6;
        float n = noise(vec2(vUv.x * 9.0, vUv.y * 4.0 - flow * 3.2)) * 0.6
                + noise(vec2(vUv.x * 26.0 + 3.0, vUv.y * 10.0 - flow * 5.4)) * 0.4;
        float streak = smoothstep(0.42, 0.95, n);
        float edges = smoothstep(0.0, 0.2, vUv.x) * (1.0 - smoothstep(0.8, 1.0, vUv.x));
        float vertical = smoothstep(0.0, 0.22, vUv.y) * (1.0 - smoothstep(0.9, 1.0, vUv.y));
        float alpha = (0.28 + streak * 0.72) * edges * vertical * uOpacity;
        vec3 col = mix(vec3(0.74, 0.88, 1.0), vec3(1.0), streak);
        col += vec3(0.42, 0.26, 0.1) * smoothstep(0.72, 1.0, vUv.y);
        gl_FragColor = vec4(col, alpha);
      }
    `,
  })
  const mesh = new THREE.Mesh(geometry, material)
  return { mesh, uniforms }
}

function makeDroplets(count: number, width: number, span: number, pixelRatio: number) {
  const geometry = new THREE.BufferGeometry()
  const positions = new Float32Array(count * 3)
  const speeds = new Float32Array(count)
  const sizes = new Float32Array(count)

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * width
    positions[i * 3 + 1] = Math.random() * span
    positions[i * 3 + 2] = (Math.random() - 0.5) * 0.8
    speeds[i] = 0.6 + Math.random() * 1.4
    sizes[i] = 1.4 + Math.random() * 3.2
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1))
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))

  const uniforms = {
    uTime: { value: 0 },
    uPixelRatio: { value: pixelRatio },
    uSpan: { value: span },
  }

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms,
    vertexShader: /* glsl */ `
      attribute float aSpeed;
      attribute float aSize;
      uniform float uTime;
      uniform float uPixelRatio;
      uniform float uSpan;
      varying float vAlpha;

      void main() {
        vec3 p = position;
        float span = uSpan;
        float fall = mod(position.y - uTime * aSpeed * 4.5, span);
        p.y = -fall;
        p.x += sin(uTime * 0.8 + position.z * 3.0) * 0.18;

        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = aSize * uPixelRatio * (90.0 / max(-mv.z, 0.5));
        vAlpha = smoothstep(-span, -span * 0.72, p.y) * smoothstep(-1.0, 1.0, -fall);
      }
    `,
    fragmentShader: /* glsl */ `
      varying float vAlpha;
      void main() {
        vec2 c = gl_PointCoord - 0.5;
        float d = length(c);
        if (d > 0.5) discard;
        gl_FragColor = vec4(vec3(0.85, 0.94, 1.0), vAlpha * (1.0 - d * 2.0) * 0.85);
      }
    `,
  })

  return { points: new THREE.Points(geometry, material), uniforms }
}

function makeCloudLayer(
  texture: THREE.Texture,
  count: number,
  options: { y: number; spread: number; scale: number; color: string; opacity: number; drift: number },
) {
  const group = new THREE.Group()
  const material = new THREE.SpriteMaterial({
    map: texture,
    color: new THREE.Color(options.color),
    transparent: true,
    opacity: options.opacity,
    depthWrite: false,
  })
  const sprites: THREE.Sprite[] = []

  for (let i = 0; i < count; i++) {
    const sprite = new THREE.Sprite(material)
    const angle = Math.random() * Math.PI * 2
    const radius = 8 + Math.random() * options.spread
    sprite.position.set(
      Math.cos(angle) * radius,
      options.y + (Math.random() - 0.5) * options.spread * 0.16,
      Math.sin(angle) * radius,
    )
    const scale = options.scale * (0.6 + Math.random() * 0.9)
    sprite.scale.set(scale, scale * 0.52, 1)
    group.add(sprite)
    sprites.push(sprite)
  }

  return { group, sprites, material, drift: options.drift }
}

function makeMotes(count: number, texture: THREE.Texture) {
  const geometry = new THREE.BufferGeometry()
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 120
    positions[i * 3 + 1] = -8 + Math.random() * 46
    positions[i * 3 + 2] = (Math.random() - 0.5) * 120
  }
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const material = new THREE.PointsMaterial({
    map: texture,
    color: new THREE.Color('#fff3da'),
    size: 0.42,
    transparent: true,
    opacity: 0.75,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  })
  return new THREE.Points(geometry, material)
}

function makeBirds(count: number) {
  const group = new THREE.Group()
  const material = new THREE.LineBasicMaterial({ color: '#6d4a41', transparent: true, opacity: 0.5 })
  for (let i = 0; i < count; i++) {
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-0.42, 0.1, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.42, 0.1, 0),
    ])
    const bird = new THREE.LineSegments(geometry, material)
    bird.userData = {
      radius: 14 + Math.random() * 18,
      speed: 0.06 + Math.random() * 0.06,
      phase: Math.random() * Math.PI * 2,
      height: 10 + Math.random() * 14,
      scale: 0.7 + Math.random() * 0.8,
    }
    bird.scale.setScalar(bird.userData.scale)
    group.add(bird)
  }
  return group
}

export class World {
  private readonly renderer: THREE.WebGLRenderer
  private readonly scene = new THREE.Scene()
  private readonly camera: THREE.PerspectiveCamera
  private readonly clock = new THREE.Clock()
  private readonly settings: WorldSettings
  private readonly pixelRatio: number

  private raf = 0
  private hidden = false
  private quality = 1
  private readonly frameCosts: number[] = []
  private scroll = 0
  private scrollSmooth = 0
  private readonly pointer = new THREE.Vector2()
  private readonly pointerSmooth = new THREE.Vector2()
  private readonly camTarget = new THREE.Vector3(0, 1.6, 0)
  private readonly tmpPos = new THREE.Vector3()
  private readonly tmpTarget = new THREE.Vector3()
  private readonly tmpA = new THREE.Vector3()
  private readonly tmpB = new THREE.Vector3()
  private lastFrame = 0

  private readonly updaters: Array<(time: number, delta: number) => void> = []
  private skyUniforms: Record<string, THREE.IUniform> | null = null
  private waterfallUniforms: Array<Record<string, THREE.IUniform>> = []

  constructor(canvas: HTMLCanvasElement, settings: WorldSettings) {
    this.settings = settings
    this.pixelRatio = Math.min(window.devicePixelRatio || 1, settings.mobile ? 1 : 1.5)

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !settings.mobile,
      alpha: false,
      powerPreference: 'high-performance',
    })
    this.renderer.setPixelRatio(this.pixelRatio)
    this.renderer.setSize(window.innerWidth, window.innerHeight, false)
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.12
    this.renderer.outputColorSpace = THREE.SRGBColorSpace

    this.camera = new THREE.PerspectiveCamera(
      48,
      window.innerWidth / window.innerHeight,
      0.1,
      900,
    )
    this.camera.position.set(...KEYFRAMES[0].pos)

    this.build()
    this.loop()

    window.addEventListener('resize', this.handleResize)
    window.addEventListener('pointermove', this.handlePointer, { passive: true })
    document.addEventListener('visibilitychange', this.handleVisibility)
  }

  private handleVisibility = () => {
    if (document.hidden) {
      this.hidden = true
      cancelAnimationFrame(this.raf)
      this.raf = 0
      return
    }
    this.hidden = false
    this.clock.getDelta()
    if (!this.raf) this.raf = requestAnimationFrame(this.loop)
  }

  private build() {
    const { onProgress, mobile, reducedMotion } = this.settings
    const scene = this.scene
    scene.fog = new THREE.FogExp2(new THREE.Color('#f8c9a3'), 0.0042)

    // ---------- sky ----------
    const sky = makeSky()
    this.skyUniforms = sky.uniforms
    scene.add(sky.mesh)
    onProgress(0.08)

    // ---------- lights ----------
    const hemisphere = new THREE.HemisphereLight(0xfff1dc, 0xe7a878, 1.5)
    scene.add(hemisphere)

    const sun = new THREE.DirectionalLight(0xfff0cf, 2.4)
    sun.position.set(-24, 13, -16)
    scene.add(sun)

    const fill = new THREE.DirectionalLight(0xc2dcff, 0.85)
    fill.position.set(16, 10, 18)
    scene.add(fill)

    scene.add(new THREE.AmbientLight(0xffd9bd, 0.6))
    onProgress(0.14)

    // ---------- clouds ----------
    const puffs = cloudTexture()
    const cloudLayers = [
      makeCloudLayer(puffs, mobile ? 22 : 44, {
        y: -8,
        spread: 70,
        scale: 16,
        color: '#fff4e3',
        opacity: 0.55,
        drift: 0.35,
      }),
      makeCloudLayer(puffs, mobile ? 16 : 34, {
        y: -14,
        spread: 110,
        scale: 26,
        color: '#ffd9bb',
        opacity: 0.5,
        drift: 0.22,
      }),
      makeCloudLayer(puffs, mobile ? 10 : 20, {
        y: -3,
        spread: 46,
        scale: 9,
        color: '#fffaf1',
        opacity: 0.42,
        drift: 0.5,
      }),
      makeCloudLayer(puffs, mobile ? 8 : 16, {
        y: 16,
        spread: 90,
        scale: 18,
        color: '#ffe3c8',
        opacity: 0.34,
        drift: 0.18,
      }),
    ]
    cloudLayers.forEach((layer) => scene.add(layer.group))
    onProgress(0.22)

    // ---------- distant islands ----------
    const distant: Array<[number, number, number, number]> = [
      [-15, 7.5, -20, 3.0],
      [14, 6.2, -24, 2.6],
      [-24, 2.4, -12, 2.2],
      [21, 3.4, -14, 2.4],
      [-9, 13, -40, 3.4],
      [12, 11.5, -44, 3.0],
      [-30, -2, -30, 2.8],
      [26, -1, -34, 2.2],
      [0, 15, -56, 4.2],
    ]
    distant.forEach(([x, y, z, r], index) => {
      const island = makeIsland(r, mobile ? 2 : 3, index * 1.7)
      island.position.set(x, y, z)
      scene.add(island)

      const tree = makeTree(r * 0.34)
      tree.position.set(x + r * 0.1, y + r * 0.36, z + r * 0.1)
      scene.add(tree)

      if (index % 3 === 0) {
        const fall = makeWaterfall(r * 0.34, r * 3.4, 0.75)
        fall.mesh.position.set(x + r * 0.42, y + r * 0.34 - (r * 3.4) / 2, z + r * 0.1)
        scene.add(fall.mesh)
        this.waterfallUniforms.push(fall.uniforms)
      }
    })
    onProgress(0.34)

    // ---------- main island ----------
    const island = makeIsland(ISLAND_RADIUS, mobile ? 3 : 4)
    scene.add(island)

    // hero tree
    const heroTree = makeTree(2.5)
    heroTree.position.set(-1.5, PLATEAU * 0.98, -0.4)
    scene.add(heroTree)

    // vegetation
    const treeCount = mobile ? 5 : 9
    for (let i = 0; i < treeCount; i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = 1.4 + Math.random() * 3.4
      const tree = makeTree(0.75 + Math.random() * 0.65)
      tree.position.set(
        Math.cos(angle) * radius,
        PLATEAU * 0.98 - 0.1,
        Math.sin(angle) * radius * 0.85,
      )
      scene.add(tree)
    }

    // rocks
    for (let i = 0; i < (mobile ? 5 : 9); i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = 2 + Math.random() * 3.4
      const rock = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.16 + Math.random() * 0.34, 0),
        new THREE.MeshStandardMaterial({ color: '#b3906f', roughness: 1, flatShading: true }),
      )
      rock.position.set(
        Math.cos(angle) * radius,
        PLATEAU * 0.98 - 0.05,
        Math.sin(angle) * radius * 0.9,
      )
      rock.rotation.set(Math.random(), Math.random(), Math.random())
      scene.add(rock)
    }

    // futuristic structure
    const structure = makeStructure()
    structure.position.set(2.1, PLATEAU * 0.98, -1.7)
    structure.rotation.y = -0.35
    scene.add(structure)

    // crystals
    const crystalColors = ['#8ff2ff', '#ffdca0', '#b6ffd6']
    for (let i = 0; i < (mobile ? 4 : 7); i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = 2.6 + Math.random() * 2.6
      const color = crystalColors[i % crystalColors.length]
      const crystal = makeCrystal(color, 0.2 + Math.random() * 0.22)
      crystal.position.set(
        Math.cos(angle) * radius,
        PLATEAU * 0.98 + 0.35,
        Math.sin(angle) * radius * 0.9,
      )
      crystal.rotation.z = (Math.random() - 0.5) * 0.4
      const baseY = crystal.position.y
      const speed = 0.6 + Math.random()
      const phase = Math.random() * Math.PI * 2
      this.updaters.push((time) => {
        crystal.position.y = baseY + Math.sin(time * speed + phase) * 0.16
        crystal.rotation.y += 0.004
        const material = crystal.material as THREE.MeshStandardMaterial
        material.emissiveIntensity = 1.1 + Math.sin(time * speed + phase) * 0.45
      })
      scene.add(crystal)
    }

    const crystalLight = new THREE.PointLight(0x6fe9ff, 22, 16, 2)
    crystalLight.position.set(1.4, PLATEAU + 1.2, 1.6)
    scene.add(crystalLight)

    // floating holographic glass cube
    const cube = makeGlassCube()
    cube.position.set(4.4, PLATEAU + 2.4, 2.4)
    scene.add(cube)
    const ring = cube.userData.ring as THREE.Mesh
    this.updaters.push((time) => {
      cube.position.y = PLATEAU + 2.4 + Math.sin(time * 0.7) * 0.22
      cube.rotation.y = time * 0.24
      cube.rotation.x = Math.sin(time * 0.35) * 0.08
      ring.rotation.z = time * 0.5
    })

    // holographic rings above the island
    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(5.4, 0.012, 6, 128),
      new THREE.MeshStandardMaterial({
        color: '#cbb4ff',
        emissive: new THREE.Color('#ffcf8f'),
        emissiveIntensity: 1.8,
      }),
    )
    halo.position.set(0, PLATEAU + 0.5, -0.2)
    halo.rotation.set(0.22, 0, 0)
    scene.add(halo)
    this.updaters.push((time) => {
      halo.rotation.z = Math.sin(time * 0.2) * 0.12
    })
    onProgress(0.5)

    // ---------- waterfall ----------
    const fallHeight = 26
    const fall = makeWaterfall(2.9, fallHeight)
    const fallGroup = new THREE.Group()
    fallGroup.position.set(4.2, PLATEAU * 0.95, 2.6)
    fallGroup.rotation.y = 0.3
    fall.mesh.position.y = -fallHeight / 2
    fallGroup.add(fall.mesh)

    // secondary sheet for depth
    const inner = makeWaterfall(1.6, fallHeight * 0.92, 0.55)
    inner.mesh.position.set(0.1, -fallHeight * 0.47, 0.35)
    fallGroup.add(inner.mesh)
    this.waterfallUniforms.push(fall.uniforms, inner.uniforms)

    // falling droplets
    const droplets = makeDroplets(mobile ? 260 : 620, 3.4, fallHeight + 3, this.pixelRatio)
    fallGroup.add(droplets.points)

    // mist
    const mistMaterial = new THREE.SpriteMaterial({
      map: puffs,
      color: new THREE.Color('#fff4e2'),
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    })
    const mistTop = new THREE.Sprite(mistMaterial)
    mistTop.position.set(0, -0.4, 0.2)
    mistTop.scale.set(5, 2.4, 1)
    fallGroup.add(mistTop)

    const mistBottom = new THREE.Sprite(mistMaterial)
    mistBottom.position.set(0, -fallHeight * 0.78, 0.4)
    mistBottom.scale.set(8, 4.4, 1)
    fallGroup.add(mistBottom)

    scene.add(fallGroup)
    this.updaters.push((time) => {
      droplets.uniforms.uTime.value = time
      mistTop.position.y = -0.4 + Math.sin(time * 0.5) * 0.1
    })
    onProgress(0.62)

    // ---------- floating platforms (journey path) ----------
    const platforms: Array<[number, number, number]> = [
      [-17, 4.6, 1],
      [-19, 2.2, 3.6],
      [-22, 4.0, -1.2],
      [-24, 1.4, 2.4],
    ]
    platforms.forEach(([x, y, z], index) => {
      const plate = makeIsland(1.25, mobile ? 1 : 2, index * 2.4)
      plate.position.set(x, y, z)
      scene.add(plate)
      const plinth = new THREE.Mesh(
        new THREE.CylinderGeometry(0.62, 0.5, 0.08, 6),
        new THREE.MeshStandardMaterial({
          color: '#b7d7ff',
          emissive: new THREE.Color('#5fc9ff'),
          emissiveIntensity: 0.8,
          transparent: true,
          opacity: 0.55,
        }),
      )
      plinth.position.set(x, y + 0.6, z)
      scene.add(plinth)
    })

    // ---------- motes & birds ----------
    const motes = makeMotes(mobile ? 220 : 520, dotTexture())
    scene.add(motes)
    this.updaters.push((time) => {
      motes.rotation.y = time * 0.012
      motes.position.y = Math.sin(time * 0.14) * 0.4
    })

    const birds = makeBirds(mobile ? 4 : 8)
    scene.add(birds)
    this.updaters.push((time) => {
      birds.children.forEach((bird) => {
        const data = bird.userData as {
          radius: number
          speed: number
          phase: number
          height: number
        }
        const angle = data.phase + time * data.speed
        bird.position.set(
          Math.cos(angle) * data.radius,
          data.height + Math.sin(time * 0.6 + data.phase) * 0.8,
          Math.sin(angle) * data.radius * 0.8 - 6,
        )
        bird.rotation.y = -angle + Math.PI / 2
      })
    })

    // ---------- scroll / sun tint ----------
    if (!reducedMotion) {
      this.updaters.push((time) => {
        this.waterfallUniforms.forEach((uniforms) => {
          uniforms.uTime.value = time
        })
      })
    } else {
      this.waterfallUniforms.forEach((uniforms) => {
        uniforms.uTime.value = 4
      })
    }

    onProgress(0.78)
  }

  private handleResize = () => {
    const width = window.innerWidth
    const height = window.innerHeight
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, this.settings.mobile ? 1 : 1.5) * this.quality,
    )
    this.renderer.setSize(width, height, false)
  }

  private handlePointer = (event: PointerEvent) => {
    this.pointer.set(
      (event.clientX / window.innerWidth) * 2 - 1,
      (event.clientY / window.innerHeight) * 2 - 1,
    )
  }

  setScroll(progress: number) {
    this.scroll = Math.min(1, Math.max(0, progress))
  }

  private updateCamera(delta: number) {
    const total = KEYFRAMES.length - 1
    const scaled = Math.min(0.9999, Math.max(0, this.scrollSmooth)) * total
    const index = Math.floor(scaled)
    const fraction = scaled - index
    const ease = fraction * fraction * (3 - 2 * fraction)
    const from = KEYFRAMES[index]
    const to = KEYFRAMES[Math.min(total, index + 1)]

    this.tmpPos.set(...from.pos).lerp(this.tmpTarget.set(...to.pos), ease)
    this.tmpA.set(...from.target).lerp(this.tmpB.set(...to.target), ease)

    if (!this.settings.reducedMotion) {
      this.tmpPos.x += this.pointerSmooth.x * 1.1
      this.tmpPos.y += -this.pointerSmooth.y * 0.8
      this.tmpPos.y += Math.sin(this.clock.elapsedTime * 0.45) * 0.12
    }

    const smoothing = this.settings.reducedMotion ? 1 : 1 - Math.exp(-delta * 3.6)
    this.camera.position.lerp(this.tmpPos, smoothing)
    this.camTarget.lerp(this.tmpA, smoothing)
    this.camera.lookAt(this.camTarget)
  }

  private updateEnvironment(time: number) {
    const warm = Math.min(1, Math.max(0, (this.scrollSmooth - 0.72) / 0.28))
    if (this.skyUniforms) {
      ;(this.skyUniforms.uWarm.value as number) = warm
      ;(this.skyUniforms.uBottom.value as THREE.Color).lerpColors(
        SKY_BOTTOM_COOL,
        SKY_BOTTOM_WARM,
        warm,
      )
      ;(this.skyUniforms.uMid.value as THREE.Color).lerpColors(
        SKY_MID_COOL,
        SKY_MID_WARM,
        warm,
      )
    }
  }

  private loop = () => {
    if (this.hidden) {
      this.raf = 0
      return
    }
    const now = performance.now()
    if (this.settings.mobile && now - this.lastFrame < 30) {
      this.raf = requestAnimationFrame(this.loop)
      return
    }
    this.lastFrame = now
    const start = performance.now()
    const delta = Math.min(this.clock.getDelta(), 0.05)
    const time = this.clock.elapsedTime
    this.scrollSmooth += (this.scroll - this.scrollSmooth) * Math.min(1, delta * 5.5)
    this.pointerSmooth.lerp(this.pointer, Math.min(1, delta * 3.5))

    this.updateCamera(delta)
    if (!this.settings.reducedMotion) {
      for (const update of this.updaters) update(time, delta)
    }
    this.updateEnvironment(time)
    this.renderer.render(this.scene, this.camera)

    // Adaptive quality: if this device cannot keep up, draw fewer pixels rather than stutter.
    if (this.settings.mobile && this.quality > 0.62) {
      this.frameCosts.push(performance.now() - start)
      if (this.frameCosts.length >= 50) {
        const average = this.frameCosts.reduce((sum, cost) => sum + cost, 0) / this.frameCosts.length
        this.frameCosts.length = 0
        if (average > 24) {
          this.quality *= 0.8
          this.renderer.setPixelRatio(this.pixelRatio * this.quality)
          this.renderer.setSize(window.innerWidth, window.innerHeight, false)
        }
      }
    }

    this.raf = requestAnimationFrame(this.loop)
  }

  dispose() {
    cancelAnimationFrame(this.raf)
    window.removeEventListener('resize', this.handleResize)
    window.removeEventListener('pointermove', this.handlePointer)
    document.removeEventListener('visibilitychange', this.handleVisibility)
    this.scene.traverse((object) => {
      const mesh = object as THREE.Mesh
      if (mesh.geometry) mesh.geometry.dispose()
      const material = (mesh as THREE.Mesh).material
      if (Array.isArray(material)) material.forEach((item) => this.disposeMaterial(item))
      else if (material) this.disposeMaterial(material)
    })
    this.renderer.dispose()
  }

  private disposeMaterial(material: THREE.Material) {
    const withMap = material as THREE.Material & { map?: THREE.Texture | null }
    if (withMap.map) withMap.map.dispose()
    material.dispose()
  }
}
