const C='swingmom-v3';
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(['./','index.html','config.js','esquema.js','lab.js','icon.svg'])));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))))});
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(u.origin!==location.origin)return; // datos siempre en vivo
 e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)))});
// Avisos push (Web Push): el servidor manda {t:título, b:cuerpo, u:ruta, tag}
self.addEventListener('push',e=>{let d={};try{d=e.data.json()}catch(x){d={t:'SwingMom',b:e.data?e.data.text():''}}
 e.waitUntil(self.registration.showNotification(d.t||'SwingMom',{body:d.b||'',tag:d.tag||'swingmom',data:{u:d.u||'./'}}))});
self.addEventListener('notificationclick',e=>{e.notification.close();const u=new URL((e.notification.data&&e.notification.data.u)||'./',self.registration.scope).href;
 e.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(l=>{for(const c of l){if('focus' in c)return c.focus()}return clients.openWindow(u)}))});
