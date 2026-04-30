// public/sw.js
self.addEventListener('push', (event) => {
  const data = event.data.json();

  event.waitUntil(
    // Revisamos si hay ventanas de nuestra app abiertas
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // SI la app está abierta, NO mostramos la notificación de escritorio (la pestaña la gestionará por Socket)
      if (clientList.length > 0) {
        console.log("App abierta, el Service Worker no mostrará el push");
        return; 
      }

      // SI la app está cerrada, mostramos la notificación
      return self.registration.showNotification(data.title || 'Zenith Finance', {
        body: data.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        data: { url: 'http://localhost:5173' }
      });
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});