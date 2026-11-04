const CACHE_NAME = 'audinoo-shell-v1'
const APP_SHELL = ['/', '/favicon.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith('audinoo-shell-') && key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin) return
  // Never intercept audio, authenticated API calls, Firebase or generated media.
  if (url.pathname.startsWith('/api/') || /\.(mp3|wav|m4a|ogg|aac|webm)$/i.test(url.pathname)) return
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then((response) => {
      if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put('/', response.clone()))
      return response
    }).catch(async () => (await caches.match('/')) || Response.error()))
    return
  }
  if (url.pathname === '/favicon.svg') {
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request)))
  }
})
