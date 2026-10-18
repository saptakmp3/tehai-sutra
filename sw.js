/* Tehai Sutra service worker
   - pages: network-first (so a new index.html always wins), cached copy when offline
   - fonts, icon, manifest: cache-first with background refresh
   Bump CACHE when you want to force-clear old copies. */
const CACHE='tehai-sutra-v2';
const SHELL=['./','./manifest.webmanifest','./icon.svg'];

self.addEventListener('install',e=>{
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c=>Promise.allSettled(SHELL.map(u=>c.add(u)))));
});

self.addEventListener('activate',e=>{
  e.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET'||!req.url.startsWith('http'))return;

  if(req.mode==='navigate'){
    e.respondWith(
      fetch(req).then(res=>{
        if(res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy))}
        return res;
      }).catch(()=>caches.match(req).then(hit=>hit||caches.match('./')))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(hit=>{
      const net=fetch(req).then(res=>{
        if(res&&(res.ok||res.type==='opaque')){const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy))}
        return res;
      }).catch(()=>hit);
      return hit||net;
    })
  );
});
