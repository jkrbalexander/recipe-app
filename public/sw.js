const CACHE = 'recipe-box-v1'
const ASSETS = ['/', '/index.html']

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)))
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(clients.claim())
})

self.addEventListener('fetch', (e) => {
  // Let navigation requests go to the network so Firebase redirect auth works
  if (e.request.mode === 'navigate') return
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
  )
})
