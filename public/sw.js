self.addEventListener('install', (event) => {
  self.skipWaiting();
  console.log('Service Worker: Terinstal, background process ready.');
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
  console.log('Service Worker: Aktif berjalan di latar belakang.');
});

let activeRules = [];
let activeContacts = { replyTo: 'all', enableGroups: true };

// Menerima sinkronisasi aturan atau pesan masuk
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SYNC') {
    activeRules = event.data.rules || [];
    activeContacts = event.data.contacts || { replyTo: 'all', enableGroups: true };
    console.log('SW: Aturan sinkron untuk latar belakang.');
  } 
  else if (event.data && event.data.type === 'TEST_MESSAGE') {
    // Memproses pesan yang masuk seolah ditarik dari notifikasi
    const { message, isGroup } = event.data;
    let finalReply = null;

    if (isGroup && !activeContacts.enableGroups) {
      // Diabaikan karena aturan grup nonaktif
    } else {
      for (const rule of activeRules) {
        const msgLower = message.toLowerCase();
        const kwLower = rule.keyword.toLowerCase();
        
        if (rule.matchType === 'exact' && msgLower === kwLower) {
          finalReply = rule.reply;
          break;
        } else if (rule.matchType === 'contains' && msgLower.includes(kwLower)) {
          finalReply = rule.reply;
          break;
        }
      }
    }

    if (finalReply) {
      // Eksekusi kilat (Super Cepat < 1 dtk)
      self.registration.showNotification('⚡ Membalas Otomatis (< 1 dtk)', {
        body: `Balasan terkirim: "${finalReply}"\nKepada tujuan otomatis.`,
        icon: '/favicon.ico',
        badge: '/favicon.ico'
      });

      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ reply: finalReply, speed: 'instant' });
      }
    } else {
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ reply: null });
      }
    }
  }
});
