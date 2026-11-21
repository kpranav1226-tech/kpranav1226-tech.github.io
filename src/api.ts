import { mergeContent, type Content } from './content'

const TOKEN_KEY = 'pranav-owner-token-v1'

export type UnlockResult = { ok: boolean; message?: string }

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* ignore */
  }
}

/** The published content, or null when the site has never been edited. */
export async function fetchRemoteContent(): Promise<Content | null> {
  try {
    const response = await fetch('/api/content', { headers: { accept: 'application/json' } })
    if (!response.ok) return null
    const data = (await response.json()) as { content?: Partial<Content> | null }
    if (!data?.content || typeof data.content !== 'object') return null
    return mergeContent(data.content)
  } catch {
    return null
  }
}

export async function unlockOwner(key: string): Promise<UnlockResult> {
  try {
    const response = await fetch('/api/owner/unlock', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ key }),
    })

    if (response.ok) {
      const data = (await response.json()) as { token?: string }
      if (data?.token) {
        setToken(data.token)
        return { ok: true }
      }
      return { ok: false, message: 'The server did not return a session.' }
    }

    if (response.status === 503) {
      return {
        ok: false,
        message:
          'Owner editing is not switched on yet. Add a secret named OWNER_KEY in Sites → Secrets, then try again.',
      }
    }
    if (response.status === 401) return { ok: false, message: 'That passphrase did not match.' }
    return { ok: false, message: 'Could not sign in. Please try again.' }
  } catch {
    return { ok: false, message: 'Could not reach the server.' }
  }
}

export async function verifyOwner(): Promise<boolean> {
  const token = getToken()
  if (!token) return false
  try {
    const response = await fetch('/api/owner/session', {
      headers: { authorization: `Bearer ${token}` },
    })
    if (!response.ok) {
      setToken(null)
      return false
    }
    const data = (await response.json()) as { owner?: boolean }
    if (!data.owner) {
      setToken(null)
      return false
    }
    return true
  } catch {
    return false
  }
}

export async function saveRemoteContent(content: Content): Promise<boolean> {
  const token = getToken()
  if (!token) return false
  try {
    const response = await fetch('/api/content', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({ content }),
    })
    if (response.status === 401) setToken(null)
    return response.ok
  } catch {
    return false
  }
}
