// Service Worker para Calculadora Glucémica PWA
const CACHE_NAME = 'glucemica-pwa-v1';
const STATIC_CACHE = 'glucemica-static-v1';
const DYNAMIC_CACHE = 'glucemica-dynamic-v1';

// Recursos estáticos para cachear
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  'https://unpkg.com/quagga@0.12.1/dist/quagga.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js'
];

// URLs que no se deben cachear
const EXCLUDED_URLS = [
  'chrome-extension://',
  'extension://',
  'moz-extension://',
  'safari-extension://',
  'ms-browser-extension://',
  '/_next/webpack-hmr',
  '/_next/static/hmr/',
  '/api/revalidate',
  '__nextjs_original-stack-frame'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker instalando...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('📦 Cacheando recursos estáticos...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('✅ Service Worker instalado correctamente');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Error durante instalación:', error);
      })
  );
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activando...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        const deletePromises = cacheNames
          .filter(cacheName => 
            cacheName !== STATIC_CACHE && 
            cacheName !== DYNAMIC_CACHE &&
            cacheName.startsWith('glucemica-')
          )
          .map(cacheName => {
            console.log('🗑️ Eliminando cache obsoleto:', cacheName);
            return caches.delete(cacheName);
          });
        
        return Promise.all(deletePromises);
      })
      .then(() => {
        console.log('✅ Service Worker activado');
        return self.clients.claim();
      })
      .catch((error) => {
        console.error('❌ Error durante activación:', error);
      })
  );
});

// Estrategia de fetch
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Verificar si la URL debe ser excluida del cache
  const shouldExclude = EXCLUDED_URLS.some(excludedUrl => 
    request.url.includes(excludedUrl)
  );

  if (shouldExclude) {
    return; // Dejar que el navegador maneje la request normalmente
  }

  // Estrategia Cache First para recursos estáticos
  if (request.method === 'GET' && 
      (STATIC_ASSETS.includes(url.pathname) || 
       request.url.includes('_next/static') ||
       request.url.includes('fonts.googleapis') ||
       request.url.includes('cdnjs.cloudflare'))) {
    
    event.respondWith(
      caches.match(request)
        .then((response) => {
          if (response) {
            return response; // Servir desde cache
          }
          
          return fetch(request)
            .then((fetchResponse) => {
              if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
                return fetchResponse;
              }

              const responseToCache = fetchResponse.clone();
              caches.open(STATIC_CACHE)
                .then((cache) => cache.put(request, responseToCache));

              return fetchResponse;
            });
        })
        .catch(() => {
          // Fallback para páginas offline
          if (request.headers.get('accept').includes('text/html')) {
            return caches.match('/');
          }
        })
    );
    return;
  }

  // Estrategia Network First para contenido dinámico
  if (request.method === 'GET' && request.headers.get('accept').includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (!response || response.status !== 200) {
            return response;
          }

          const responseToCache = response.clone();
          caches.open(DYNAMIC_CACHE)
            .then((cache) => cache.put(request, responseToCache));

          return response;
        })
        .catch(() => {
          return caches.match(request)
            .then((response) => {
              return response || caches.match('/');
            });
        })
    );
    return;
  }

  // Estrategia Network Only para APIs y requests especiales
  if (request.url.includes('/api/') || 
      request.method !== 'GET' ||
      request.url.includes('hot-reload') ||
      request.url.includes('webpack')) {
    
    event.respondWith(fetch(request));
    return;
  }

  // Cache First para otros recursos
  event.respondWith(
    caches.match(request)
      .then((response) => {
        return response || fetch(request)
          .then((fetchResponse) => {
            if (fetchResponse.status === 200) {
              const responseToCache = fetchResponse.clone();
              caches.open(DYNAMIC_CACHE)
                .then((cache) => cache.put(request, responseToCache));
            }
            return fetchResponse;
          });
      })
  );
});

// Manejo de mensajes para actualizaciones
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    }).then(() => {
      event.ports[0].postMessage({ success: true });
    });
  }
});

// Manejo de sincronización en background
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Aquí se pueden sincronizar datos offline cuando se recupere la conexión
      console.log('🔄 Sincronización en background ejecutada')
    );
  }
});

// Manejo de notificaciones push (para futuras implementaciones)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || 'Nueva actualización disponible',
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey || '1'
      },
      actions: [
        {
          action: 'explore',
          title: 'Abrir app',
          icon: '/icon-192.png'
        },
        {
          action: 'close',
          title: 'Cerrar',
          icon: '/icon-192.png'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Calculadora Glucémica', options)
    );
  }
});

// Manejo de clicks en notificaciones
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      self.clients.openWindow('/')
    );
  }
});