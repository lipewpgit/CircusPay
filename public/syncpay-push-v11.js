self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));

self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

self.addEventListener('push', event => {
  let data = { url: '/dashboard' };

  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {}

  const title = data.kind === 'pending' ? 'Venda pendente!' : 'Venda aprovada!';

  event.waitUntil(Promise.all([
    self.registration.showNotification(title, {
      body: typeof data.body === 'string' ? data.body : undefined,
      icon: '/syncpay-logo-192.png?v=11',
      badge: '/syncpay-logo-192.png?v=11',
      tag: data.tag || 'syncpay-sale',
      data: { url: data.url || '/dashboard' },
    }),
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(clients => Promise.all(clients.map(client => client.postMessage({ type: 'refresh' })))),
  ]));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of windows) {
      if (new URL(client.url).origin === self.location.origin) {
        await client.focus();
        client.postMessage({ type: 'refresh' });
        return;
      }
    }
    await self.clients.openWindow(event.notification.data?.url || '/dashboard');
  })());
});
