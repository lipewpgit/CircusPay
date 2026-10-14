self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('push',event=>{
  let data={title:'CircusPay — teste',body:'Nova notificação de teste.',url:'/'};
  try {if(event.data) data={...data,...event.data.json()};} catch {}
  event.waitUntil(Promise.all([
    self.registration.showNotification(data.title,{body:data.body,icon:'/circuspay-original-notification-v5.png',tag:data.tag || 'circus-test',data:{url:'/'}}),
    self.clients.matchAll({type:'window',includeUncontrolled:true}).then(clients=>Promise.all(clients.map(client=>client.postMessage({type:'refresh'}))))
  ]));
});
self.addEventListener('notificationclick',event=>{
  event.notification.close();
  event.waitUntil((async()=>{
    const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    for(const client of windows){if(new URL(client.url).origin===self.location.origin){await client.focus();client.postMessage({type:'refresh'});return;}}
    await self.clients.openWindow('/');
  })());
});
