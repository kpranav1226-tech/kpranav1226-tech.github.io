/*
 * Static asset serving + a tiny owner-only content API.
 *
 * Visitors: GET /api/content returns the published content (or null -> built-in defaults).
 * Owner:    POST /api/owner/unlock with the OWNER_KEY passphrase returns a signed token,
 *           POST /api/content with that token replaces the published content.
 * Only the owner can write; the passphrase lives in a Site secret and never ships to the browser.
 */

const TABLE = 'site_content'
const MAX_CONTENT_BYTES = 512 * 1024
const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000
const enc = new TextEncoder()

const json = (body, status = 200, extra = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...extra,
    },
  })

const b64url = (bytes) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

const fromB64url = (value) => {
  const normalised = value.replace(/-/g, '+').replace(/_/g, '/')
  return Uint8Array.from(atob(normalised), (char) => char.charCodeAt(0))
}

async function hmac(secret, value) {
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(value)))
}

function equalBytes(a, b) {
  if (!a || !b || a.length !== b.length) return false
  let diff = 0
  for (let index = 0; index < a.length; index += 1) diff |= a[index] ^ b[index]
  return diff === 0
}

async function equalText(a, b) {
  const [left, right] = await Promise.all([hmac('compare', a), hmac('compare', b)])
  return equalBytes(left, right)
}

async function makeToken(secret) {
  const expires = String(Date.now() + TOKEN_TTL_MS)
  return `${expires}.${b64url(await hmac(secret, expires))}`
}

async function tokenValid(secret, token) {
  if (!token) return false
  const [expires, signature] = token.split('.')
  if (!expires || !signature) return false
  if (!Number.isFinite(Number(expires)) || Number(expires) < Date.now()) return false
  let provided
  try {
    provided = fromB64url(signature)
  } catch {
    return false
  }
  return equalBytes(await hmac(secret, expires), provided)
}

const bearer = (request) => {
  const header = request.headers.get('authorization') || ''
  return header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : ''
}

function sameOrigin(request, url) {
  const origin = request.headers.get('origin')
  if (!origin) return true
  try {
    return new URL(origin).host === url.host
  } catch {
    return false
  }
}

let schemaReady = null
function ensureSchema(env) {
  if (!schemaReady) {
    schemaReady = env.DB.prepare(
      `CREATE TABLE IF NOT EXISTS ${TABLE} (id INTEGER PRIMARY KEY, json TEXT NOT NULL, updated_at TEXT NOT NULL)`,
    )
      .run()
      .catch((error) => {
        schemaReady = null
        throw error
      })
  }
  return schemaReady
}

async function readContent(env) {
  if (!env.DB) return null
  try {
    await ensureSchema(env)
    const row = await env.DB.prepare(`SELECT json FROM ${TABLE} WHERE id = 1`).first()
    if (!row || !row.json) return null
    return JSON.parse(row.json)
  } catch (error) {
    console.error('content read failed', error && error.message)
    return null
  }
}

async function handleApi(request, env, url) {
  const path = url.pathname

  if (path === '/api/content') {
    if (request.method === 'GET') {
      return json({ content: await readContent(env) })
    }

    if (request.method === 'POST') {
      if (!sameOrigin(request, url)) return json({ error: 'forbidden' }, 403)
      const ownerKey = env.OWNER_KEY
      if (!ownerKey) return json({ error: 'not-configured' }, 503)
      if (!(await tokenValid(ownerKey, bearer(request)))) return json({ error: 'unauthorized' }, 401)
      if (!env.DB) return json({ error: 'storage-missing' }, 503)

      let body
      try {
        body = await request.json()
      } catch {
        return json({ error: 'bad-json' }, 400)
      }
      const content = body && body.content
      if (!content || typeof content !== 'object' || Array.isArray(content)) {
        return json({ error: 'bad-content' }, 400)
      }

      const text = JSON.stringify(content)
      if (enc.encode(text).byteLength > MAX_CONTENT_BYTES) return json({ error: 'too-large' }, 413)

      try {
        await ensureSchema(env)
        await env.DB.prepare(
          `INSERT INTO ${TABLE} (id, json, updated_at) VALUES (1, ?, ?)
           ON CONFLICT(id) DO UPDATE SET json = excluded.json, updated_at = excluded.updated_at`,
        )
          .bind(text, new Date().toISOString())
          .run()
      } catch (error) {
        console.error('content write failed', error && error.message)
        return json({ error: 'write-failed' }, 500)
      }

      return json({ ok: true })
    }

    return json({ error: 'method-not-allowed' }, 405)
  }

  if (path === '/api/owner/unlock' && request.method === 'POST') {
    if (!sameOrigin(request, url)) return json({ error: 'forbidden' }, 403)
    const ownerKey = env.OWNER_KEY
    if (!ownerKey) return json({ error: 'not-configured' }, 503)

    let body
    try {
      body = await request.json()
    } catch {
      return json({ error: 'bad-json' }, 400)
    }
    const key = typeof body?.key === 'string' ? body.key : ''
    if (!key || !(await equalText(key, ownerKey))) return json({ error: 'unauthorized' }, 401)

    return json({ token: await makeToken(ownerKey), expiresAt: Date.now() + TOKEN_TTL_MS })
  }

  if (path === '/api/owner/session' && request.method === 'GET') {
    const ownerKey = env.OWNER_KEY
    if (!ownerKey) return json({ owner: false, configured: false })
    return json({ owner: await tokenValid(ownerKey, bearer(request)), configured: true })
  }

  return json({ error: 'not-found' }, 404)
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (url.pathname.startsWith('/api/')) {
      try {
        return await handleApi(request, env, url)
      } catch (error) {
        console.error('api failure', error && error.message)
        return json({ error: 'server-error' }, 500)
      }
    }

    const response = await env.ASSETS.fetch(request)
    if (response.status === 404 && request.method === 'GET') {
      if (!url.pathname.includes('.')) {
        return env.ASSETS.fetch(new Request(new URL('/index.html', url).toString(), request))
      }
    }
    return response
  },
}
