const CACHE_NAME='kopi-genggam-online-v1';
const APP_SHELL=['./','./index.html','./app-online.html','./manifest.json'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(APP_SHELL).catch(()=>{})))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url);
  if(url.origin!==location.origin)return;
  e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE_NAME).then(c=>c.put(e.request,copy));return r}).catch(()=>caches.match(e.request)));
});