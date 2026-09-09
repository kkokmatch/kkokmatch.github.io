const KOKMATCH_SW_VERSION='6.62';
const KOKMATCH_CACHE_PREFIX='kokmatch-static-';
const KOKMATCH_STATIC_CACHE=KOKMATCH_CACHE_PREFIX+KOKMATCH_SW_VERSION;
const KOKMATCH_CORE=[
  '/assets/dev-prism-frame-v662.webp?v=6.62',
  '/app-v6.62.css?v=6.62',
  '/app-v6.62.js?v=6.62',
  '/manifest.webmanifest?v=6.62',
  '/icons/kokmatch-180.png?v=6.62',
  '/icons/kokmatch-192.png'
];
self.addEventListener('install',event=>{event.waitUntil((async()=>{const c=await caches.open(KOKMATCH_STATIC_CACHE);await Promise.allSettled(KOKMATCH_CORE.map(async u=>{const r=await fetch(u,{cache:'no-store'});if(r.ok)await c.put(u,r)}));await self.skipWaiting()})())});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{try{const keys=await caches.keys();await Promise.all(keys.filter(k=>(k.startsWith(KOKMATCH_CACHE_PREFIX)||/kkokmatch/i.test(k))&&k!==KOKMATCH_STATIC_CACHE).map(k=>caches.delete(k)))}catch{}await self.clients.claim()})())});
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting();if(event.data?.type==='CHECK_UPDATE')event.waitUntil(self.registration.update().catch(()=>{}))});
async function networkFirstNavigation(req){
 try{const r=await fetch(req,{cache:'no-store'});if(r?.ok){try{const c=await caches.open(KOKMATCH_STATIC_CACHE);await c.put('/__kokmatch_shell__',r.clone())}catch{}}return r}catch(e){
  const c=await caches.open(KOKMATCH_STATIC_CACHE),fallback=await c.match('/__kokmatch_shell__');if(fallback)return fallback;
  return new Response('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>콕매치</title><body style="font-family:system-ui;padding:32px;text-align:center"><h2>네트워크 연결을 확인해주세요.</h2><p>연결 후 콕매치를 다시 실행해주세요.</p></body>',{headers:{'content-type':'text/html; charset=utf-8'}})
 }
}
async function cachedStatic(req){const c=await caches.open(KOKMATCH_STATIC_CACHE),hit=await c.match(req);if(hit)return hit;const r=await fetch(req,{cache:'no-store'});if(r?.ok)try{await c.put(req,r.clone())}catch{}return r}
self.addEventListener('fetch',event=>{
 const req=event.request;if(req.method!=='GET')return;let url;try{url=new URL(req.url)}catch{return}if(url.origin!==self.location.origin)return;
 if(req.mode==='navigate'){event.waitUntil(self.registration.update().catch(()=>{}));event.respondWith(networkFirstNavigation(req));return}
 if(url.pathname==='/latest-version.json'||url.pathname==='/index.html'||url.pathname==='/kokmatch-sw.js'||url.pathname==='/sw.js'){event.respondWith(fetch(req,{cache:'no-store'}));return}
 const currentAsset=url.pathname===`/app-v${KOKMATCH_SW_VERSION}.js`||url.pathname===`/app-v${KOKMATCH_SW_VERSION}.css`||url.pathname==='/manifest.webmanifest'||url.pathname==='/assets/dev-prism-frame-v662.webp'||url.pathname.startsWith('/icons/');
 if(currentAsset){event.respondWith(cachedStatic(req));return}
 event.respondWith(fetch(req,{cache:'no-store'}));
});
self.addEventListener('push',event=>{let payload={};try{payload=event.data?event.data.json():{}}catch{try{payload={body:event.data?.text?.()||''}}catch{payload={}}}const declared=payload.notification&&typeof payload.notification==='object'?payload.notification:{};const title=payload.title||declared.title||'콕매치';const body=payload.body||declared.body||'게임 알림이 도착했습니다.';const data=payload.data||{};const options={body,icon:'/icons/kokmatch-192.png',badge:'/icons/kokmatch-192.png',tag:payload.tag||('kokmatch-'+Date.now()),renotify:true,requireInteraction:true,silent:false,data,timestamp:Date.now()};event.waitUntil((async()=>{const clients=await self.clients.matchAll({type:'window',includeUncontrolled:true});for(const client of clients){try{client.postMessage({type:'KOKMATCH_PUSH_RECEIVED',payload:{title,body,tag:options.tag,data}})}catch{}}await self.registration.showNotification(title,options)})())});
self.addEventListener('notificationclick',event=>{event.notification.close();const data=event.notification.data||{};const view=data.view||'';const clubId=data.clubId||'';event.waitUntil((async()=>{const list=await self.clients.matchAll({type:'window',includeUncontrolled:true});if(list.length){const client=list[0];try{await client.focus()}catch{}try{client.postMessage({type:'KOKMATCH_PUSH_CLICK',view,data})}catch{}return}const p=new URLSearchParams();if(view)p.set('pushView',view);if(clubId)p.set('pushClub',clubId);await self.clients.openWindow('/'+(p.toString()?'?'+p.toString():''))})())});
