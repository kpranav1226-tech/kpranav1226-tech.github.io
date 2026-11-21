/**
 * Static hosting (GitHub Pages, Netlify, etc.) has no server, so the owner
 * passphrase editor cannot work there. Build with VITE_STATIC_ONLY=1 to ship a
 * read-only portfolio: no owner link, no API calls, content baked into the build.
 */
export const STATIC_ONLY = import.meta.env.VITE_STATIC_ONLY === '1'
