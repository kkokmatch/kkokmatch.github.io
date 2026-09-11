from pathlib import Path
import json

OLD='6.78'; NEW='6.79'
js_old=Path(f'app-v{OLD}.js').read_text(encoding='utf-8')
css_old=Path(f'app-v{OLD}.css').read_text(encoding='utf-8')
js=js_old.replace(OLD,NEW)

js += r'''

/* v6.79: visible-shell resilience after PWA/service-worker updates. */
(()=>{
'use strict';
if(window.__kokmatchBootResilience679)return;window.__kokmatchBootResilience679='6.79';
function shellReady679(){return !!(document.body&&document.body.querySelector('.app')&&document.getElementById('login'))}
function ensureVisibleShell679(){
 if(shellReady679())return true;
 const fallback=document.getElementById('bootFallback679');
 if(fallback)return false;
 try{
  if(typeof renderShell==='function'){renderShell();return shellReady679()}
 }catch(e){console.warn('KokMatch v6.79 visible shell recovery',e)}
 return false;
}
window.__kokmatchShellReady679=shellReady679;
window.__kokmatchEnsureVisibleShell679=ensureVisibleShell679;
window.addEventListener('pageshow',()=>setTimeout(ensureVisibleShell679,80),{passive:true});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(ensureVisibleShell679,100)},{passive:true});
setTimeout(ensureVisibleShell679,900);
})();
'''
Path(f'app-v{NEW}.js').write_text(js,encoding='utf-8')

css=css_old.replace(OLD,NEW)
css += r'''

/* v6.79: keep the circular sequence marker, but center the actual member name exactly under the name header. */
.statsMonthlyTable628 td.statsName678,.statsMonthlyTable628 td.statsName679{
 position:relative!important;
 padding-left:27px!important;
 padding-right:27px!important;
 text-align:center!important;
}
.statsMonthlyTable628 td.statsName678>b,.statsMonthlyTable628 td.statsName679>b{
 display:block!important;
 width:100%!important;
 margin:0!important;
 text-align:center!important;
 white-space:nowrap!important;
 overflow:hidden!important;
 text-overflow:ellipsis!important;
}
.statsMonthlyTable628 .statsRank678{left:5px!important}
'''
Path(f'app-v{NEW}.css').write_text(css,encoding='utf-8')

# Fresh service worker: a new worker may activate only after mandatory JS/CSS are actually available.
sw=f'''const KOKMATCH_SW_VERSION='{NEW}';
const KOKMATCH_CACHE_PREFIX='kokmatch-static-';
const KOKMATCH_STATIC_CACHE=KOKMATCH_CACHE_PREFIX+KOKMATCH_SW_VERSION;
const KOKMATCH_SHELL_KEY='/__kokmatch_shell__';
const KOKMATCH_REQUIRED=[
  '/app-v{NEW}.css?v={NEW}',
  '/app-v{NEW}.js?v={NEW}'
];
const KOKMATCH_OPTIONAL=[
  '/assets/dev-prism-frame-v662.webp?v={NEW}',
  '/assets/organizer-silver-aura-v665.webp?v={NEW}',
  '/manifest.webmanifest?v={NEW}',
  '/icons/kokmatch-180.png?v={NEW}',
  '/icons/kokmatch-192.png'
];
async function fetchFresh679(url){{
 const r=await fetch(url,{{cache:'reload'}});
 if(!r||!r.ok)throw new Error('required asset '+url+' '+(r&&r.status));
 return r;
}}
self.addEventListener('install',event=>{{event.waitUntil((async()=>{{
 const c=await caches.open(KOKMATCH_STATIC_CACHE);
 for(const u of KOKMATCH_REQUIRED){{const r=await fetchFresh679(u);await c.put(u,r.clone())}}
 try{{const shell=await fetch('/?km-sw-precache={NEW}&t='+Date.now(),{{cache:'reload'}});if(shell&&shell.ok)await c.put(KOKMATCH_SHELL_KEY,shell.clone())}}catch{{}}
 await Promise.allSettled(KOKMATCH_OPTIONAL.map(async u=>{{const r=await fetch(u,{{cache:'reload'}});if(r&&r.ok)await c.put(u,r.clone())}}));
 await self.skipWaiting();
}})())}});
self.addEventListener('activate',event=>{{event.waitUntil((async()=>{{
 try{{const keys=await caches.keys();await Promise.all(keys.filter(k=>(k.startsWith(KOKMATCH_CACHE_PREFIX)||/kkokmatch/i.test(k))&&k!==KOKMATCH_STATIC_CACHE).map(k=>caches.delete(k)))}}catch{{}}
 await self.clients.claim();
 try{{const clients=await self.clients.matchAll({{type:'window',includeUncontrolled:true}});for(const client of clients)client.postMessage({{type:'KOKMATCH_SW_ACTIVATED',version:KOKMATCH_SW_VERSION}})}}catch{{}}
}})())}});
self.addEventListener('message',event=>{{
 if(event.data&&event.data.type==='SKIP_WAITING')self.skipWaiting();
 if(event.data&&event.data.type==='CHECK_UPDATE')event.waitUntil(self.registration.update().catch(()=>{{}}));
}});
async function networkFirstNavigation(req){{
 try{{const r=await fetch(req,{{cache:'no-store'}});if(r&&r.ok){{try{{const c=await caches.open(KOKMATCH_STATIC_CACHE);await c.put(KOKMATCH_SHELL_KEY,r.clone())}}catch{{}}}}return r}}catch(e){{
  const c=await caches.open(KOKMATCH_STATIC_CACHE),fallback=await c.match(KOKMATCH_SHELL_KEY);if(fallback)return fallback;
  return new Response('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>콕매치</title><body style="margin:0;background:#f5f7fb;font-family:-apple-system,BlinkMacSystemFont,system-ui;color:#172033"><main style="min-height:100vh;display:grid;place-items:center;padding:24px;box-sizing:border-box"><section style="max-width:360px;background:#fff;border:1px solid #dbe3f1;border-radius:20px;padding:24px;text-align:center"><h2 style="margin:0 0 10px">콕매치를 불러오지 못했어요</h2><p style="margin:0;color:#64748b;line-height:1.6">네트워크 연결을 확인한 뒤 앱을 다시 실행해주세요.</p></section></main></body>',{{headers:{{'content-type':'text/html; charset=utf-8'}}}})
 }}
}}
async function cachedStatic(req){{
 const c=await caches.open(KOKMATCH_STATIC_CACHE),hit=await c.match(req);if(hit)return hit;
 try{{const r=await fetch(req,{{cache:'no-store'}});if(r&&r.ok){{try{{await c.put(req,r.clone())}}catch{{}}}}return r}}catch(e){{
  const u=new URL(req.url);
  if(u.pathname.endsWith('.js'))return new Response("window.dispatchEvent(new CustomEvent('kokmatch-asset-error',{{detail:'js'}}));",{{headers:{{'content-type':'application/javascript; charset=utf-8','cache-control':'no-store'}}}});
  if(u.pathname.endsWith('.css'))return new Response('',{{headers:{{'content-type':'text/css; charset=utf-8','cache-control':'no-store'}}}});
  throw e;
 }}
}}
self.addEventListener('fetch',event=>{{
 const req=event.request;if(req.method!=='GET')return;let url;try{{url=new URL(req.url)}}catch{{return}}if(url.origin!==self.location.origin)return;
 if(req.mode==='navigate'){{event.waitUntil(self.registration.update().catch(()=>{{}}));event.respondWith(networkFirstNavigation(req));return}}
 if(url.pathname==='/latest-version.json'||url.pathname==='/index.html'||url.pathname==='/kokmatch-sw.js'||url.pathname==='/sw.js'){{event.respondWith(fetch(req,{{cache:'no-store'}}));return}}
 const currentAsset=url.pathname===`/app-v${{KOKMATCH_SW_VERSION}}.js`||url.pathname===`/app-v${{KOKMATCH_SW_VERSION}}.css`||url.pathname==='/manifest.webmanifest'||url.pathname==='/assets/dev-prism-frame-v662.webp'||url.pathname==='/assets/organizer-silver-aura-v665.webp'||url.pathname.startsWith('/icons/');
 if(currentAsset){{event.respondWith(cachedStatic(req));return}}
 event.respondWith(fetch(req,{{cache:'no-store'}}));
}});
self.addEventListener('push',event=>{{let payload={{}};try{{payload=event.data?event.data.json():{{}}}}catch{{try{{payload={{body:event.data&&event.data.text?event.data.text():''}}}}catch{{payload={{}}}}}}const declared=payload.notification&&typeof payload.notification==='object'?payload.notification:{{}};const title=payload.title||declared.title||'콕매치';const body=payload.body||declared.body||'게임 알림이 도착했습니다.';const data=payload.data||{{}};const options={{body,icon:'/icons/kokmatch-192.png',badge:'/icons/kokmatch-192.png',tag:payload.tag||('kokmatch-'+Date.now()),renotify:true,requireInteraction:true,silent:false,data,timestamp:Date.now()}};event.waitUntil((async()=>{{const clients=await self.clients.matchAll({{type:'window',includeUncontrolled:true}});for(const client of clients){{try{{client.postMessage({{type:'KOKMATCH_PUSH_RECEIVED',payload:{{title,body,tag:options.tag,data}}}})}}catch{{}}}}await self.registration.showNotification(title,options)}})())}});
self.addEventListener('notificationclick',event=>{{event.notification.close();const data=event.notification.data||{{}};const view=data.view||'';const clubId=data.clubId||'';event.waitUntil((async()=>{{const list=await self.clients.matchAll({{type:'window',includeUncontrolled:true}});if(list.length){{const client=list[0];try{{await client.focus()}}catch{{}}try{{client.postMessage({{type:'KOKMATCH_PUSH_CLICK',view,data}})}}catch{{}}return}}const p=new URLSearchParams();if(view)p.set('pushView',view);if(clubId)p.set('pushClub',clubId);await self.clients.openWindow('/'+(p.toString()?'?'+p.toString():''))}})())}});
'''
Path('kokmatch-sw.js').write_text(sw,encoding='utf-8')
Path('sw.js').write_text(f"/* Stable compatibility entry for older KokMatch installations. */\nimportScripts('/kokmatch-sw.js?v={NEW}');\n",encoding='utf-8')

# Index keeps a visible fallback even when the main bundle cannot execute, and heals one stale-update boot automatically.
index=Path('index.html').read_text(encoding='utf-8').replace(OLD,NEW)
guard=r'''  <script>
  (()=>{
    'use strict';
    const APP='6.79',BOOT_KEY='kokmatch_boot_recovery_679',SW_KEY='kokmatch_sw_controller_reload_679';
    const shellReady=()=>!!(document.body&&document.body.querySelector('.app')&&document.getElementById('login'));
    function showRecovery(msg){
      let el=document.getElementById('bootFallback679');
      if(!el){el=document.createElement('main');el.id='bootFallback679';document.body.appendChild(el)}
      el.style.cssText='min-height:100vh;display:grid;place-items:center;padding:24px;box-sizing:border-box;background:#f5f7fb;font-family:-apple-system,BlinkMacSystemFont,system-ui;color:#172033';
      el.innerHTML='<section style="width:min(360px,100%);background:#fff;border:1px solid #dbe3f1;border-radius:20px;padding:24px;text-align:center;box-shadow:0 6px 24px #233d8b14"><h2 style="margin:0 0 10px;font-size:20px">콕매치 업데이트 복구</h2><p style="margin:0 0 16px;color:#64748b;line-height:1.6;font-size:14px">'+(msg||'앱을 다시 불러오고 있어요.')+'</p><button onclick="location.reload()" style="border:0;border-radius:12px;padding:11px 18px;background:#2453d4;color:#fff;font-weight:800">다시 불러오기</button></section>';
    }
    async function heal(reason){
      if(shellReady())return;
      let tried=false;try{tried=sessionStorage.getItem(BOOT_KEY)==='1'}catch{}
      if(tried){showRecovery('최신 파일을 불러오지 못했어. 네트워크를 확인한 뒤 다시 불러오기를 눌러줘.');return}
      try{sessionStorage.setItem(BOOT_KEY,'1')}catch{}
      showRecovery('업데이트 파일을 다시 맞추는 중이야.');
      try{if('caches'in window){const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith('kokmatch-static-')||/kkokmatch/i.test(k)).map(k=>caches.delete(k)))}}catch{}
      try{if('serviceWorker'in navigator){const regs=await navigator.serviceWorker.getRegistrations();await Promise.all(regs.map(async r=>{try{await r.update();if(r.waiting)r.waiting.postMessage({type:'SKIP_WAITING'})}catch{}}))}}catch{}
      try{await fetch('/latest-version.json?boot679='+Date.now(),{cache:'no-store'})}catch{}
      location.replace('/?km-recover=679&t='+Date.now());
    }
    window.__kokmatchBootFailed679=heal;
    window.addEventListener('kokmatch-asset-error',()=>heal('asset'));
    window.addEventListener('error',e=>{const t=e&&e.target;if(t&&(t.tagName==='SCRIPT'||t.tagName==='LINK'))heal('resource')},true);
    document.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{if(shellReady()){try{sessionStorage.removeItem(BOOT_KEY)}catch{}}else heal('timeout')},4200),{once:true});
    if('serviceWorker'in navigator)navigator.serviceWorker.addEventListener('controllerchange',()=>{let done=false;try{done=sessionStorage.getItem(SW_KEY)==='1'}catch{}if(done)return;try{sessionStorage.setItem(SW_KEY,'1')}catch{}setTimeout(()=>location.reload(),80)});
  })();
  </script>
'''
needle=f'  <script defer src="/app-v{NEW}.js?v={NEW}"></script>'
index=index.replace(needle,guard+f'  <script defer src="/app-v{NEW}.js?v={NEW}" onerror="window.__kokmatchBootFailed679&&window.__kokmatchBootFailed679(\'script\')"></script>')
index=index.replace('<body></body>',r'''<body><main id="bootFallback679" style="min-height:100vh;display:grid;place-items:center;padding:24px;box-sizing:border-box;background:#f5f7fb;font-family:-apple-system,BlinkMacSystemFont,system-ui;color:#172033"><section style="width:min(360px,100%);background:#fff;border:1px solid #dbe3f1;border-radius:20px;padding:24px;text-align:center;box-shadow:0 6px 24px #233d8b14"><h2 style="margin:0 0 10px;font-size:20px">콕매치 불러오는 중</h2><p style="margin:0;color:#64748b;line-height:1.6;font-size:14px">업데이트 상태를 확인하고 있어.</p></section></main></body>''')
Path('index.html').write_text(index,encoding='utf-8')

manifest=Path('manifest.webmanifest').read_text(encoding='utf-8').replace(OLD,NEW)
Path('manifest.webmanifest').write_text(manifest,encoding='utf-8')
latest={
 'version':119,'label':'v6.79','semanticVersion':'6.79','build':'v6.79','updatedAt':'2026-09-11T17:20:00+09:00',
 'note':'v6.79 iPhone PWA 흰화면 자동복구 · 서비스워커 핵심자산 검증 · 업데이트 캐시 안전화 · 운동통계 이름 정렬 보정'
}
Path('latest-version.json').write_text(json.dumps(latest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('built v6.79')
