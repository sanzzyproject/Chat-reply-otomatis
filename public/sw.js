self.addEventListener('install', (event) => {
  self.skipWaiting();
  console.log('Service Worker: Terinstal, background process ready.');
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
  console.log('Service Worker: Aktif berjalan di latar belakang.');
});

self.addEventListener('push', function(event) {
  // Push listener simulates fast background responses
  let data = {};
  if (event.data) {
    data = event.data.json();
  }
  
  const options = {
    body: data.message || 'Pesan otomatis berhasil terkirim dari server (< 1 detik).',
    icon: '/favicon.ico',
    badge: '/favicon.ico'
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Autoreply Aktif', options)
  );
});
