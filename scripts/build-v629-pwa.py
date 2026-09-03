from pathlib import Path
import json
import struct
import zlib
import binascii
import textwrap

ROOT = Path(__file__).resolve().parent.parent

def read(name):
    return (ROOT / name).read_text(encoding='utf-8')

def write(name, data):
    p = ROOT / name
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(data, encoding='utf-8')

# 1) Clone the stable single-runtime assets.
js = read('app-v6.28.js')
css = read('app-v6.28.css')
if "window.__kokmatchStandalone='6.28'" not in js:
    raise SystemExit('v6.28 standalone marker not found')

# 2) Promote runtime marker to v6.29.
js = js.replace('6.28', '6.29')

# 3) Use one canonical PWA/push service worker.
old_boot = "navigator.serviceWorker.register('/sw.js').catch(()=>{})"
new_boot = "navigator.serviceWorker.register('/kokmatch-sw.js?v=6.29',{scope:'/',updateViaCache:'none'}).catch(()=>{})"
if old_boot not in js:
    raise SystemExit('legacy /sw.js boot registration not found')
js = js.replace(old_boot, new_boot)

# Preserve the push registration when login expires or a manual refresh is used.
old_unregister_1 = "const rs=await navigator.serviceWorker.getRegistrations();await Promise.all(rs.map(r=>r.unregister().catch(()=>{})))"
old_unregister_2 = "const rs=await navigator.serviceWorker.getRegistrations();await Promise.all(rs.map(r=>r.unregister().catch(()=>false)))"
keep_registration = "const r=await navigator.serviceWorker.getRegistration('/');if(r)await r.update().catch(()=>{})"
js = js.replace(old_unregister_1, keep_registration)
js = js.replace(old_unregister_2, keep_registration)
js = js.replace("navigator.serviceWorker.register('/kokmatch-sw.js?v=4.3',{scope:'/'})", "navigator.serviceWorker.register('/kokmatch-sw.js?v=6.29',{scope:'/',updateViaCache:'none'})")
js = js.replace("navigator.serviceWorker.register('/kokmatch-sw.js?v=4.4',{scope:'/'})", "navigator.serviceWorker.register('/kokmatch-sw.js?v=6.29',{scope:'/',updateViaCache:'none'})")

pwa_js = textwrap.dedent(r"""

/* KokMatch v6.29 PWA install + notification permission guide */
(()=>{
'use strict';
if(window.__kokmatchPwa629)return;
window.__kokmatchPwa629=true;
const DAY629=86400000;
let deferredInstall629=null;
let promptOpen629=false;
const isIOS629=()=>/iPad|iPhone|iPod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const standalone629=()=>window.matchMedia?.('(display-mode: standalone)')?.matches===true||navigator.standalone===true;
const loggedIn629=()=>{const l=document.getElementById('login');return !!l&&l.classList.contains('hide')&&!!document.querySelector('.app')};
const supportedPush629=()=>typeof Notification!=='undefined'&&(('serviceWorker'in navigator&&'PushManager'in window)||!!window.pushManager);
function closePrompt629(){document.getElementById('pwaPrompt629')?.remove();promptOpen629=false}
function modal629(title,body,primary,secondary,onPrimary,onSecondary){
 if(promptOpen629)return;promptOpen629=true;
 const d=document.createElement('div');d.id='pwaPrompt629';d.className='pwaPrompt629';
 d.innerHTML=`<div class="pwaPromptCard629" role="dialog" aria-modal="true" aria-labelledby="pwaPromptTitle629"><div class="pwaPromptIcon629">🏸</div><h3 id="pwaPromptTitle629">${title}</h3><div class="pwaPromptBody629">${body}</div><div class="pwaPromptBtns629"><button id="pwaPrimary629" class="btn pri" type="button">${primary}</button>${secondary?`<button id="pwaSecondary629" class="btn ghost" type="button">${secondary}</button>`:''}</div></div>`;
 document.body.appendChild(d);
 d.querySelector('#pwaPrimary629').onclick=async()=>{try{await onPrimary?.()}catch(e){if(typeof showError==='function')showError(e);else alert(e?.message||String(e))}};
 const s=d.querySelector('#pwaSecondary629');if(s)s.onclick=()=>{onSecondary?.();closePrompt629()};
}
function settingsHelp629(){
 const msg=isIOS629()
  ?'iPhone 설정 → 알림 → 콕매치 → 알림 허용을 켜주세요. 목록에 콕매치가 없다면 홈 화면의 콕매치 앱을 실행한 뒤 다시 확인해주세요.'
  :'휴대폰 설정 → 알림 → 앱 알림(또는 Chrome/콕매치)에서 콕매치 알림을 허용해주세요. 기종에 따라 메뉴 이름이 조금 다를 수 있습니다.';
 alert(msg);
}
async function enablePush629(){
 const fn=window.enableGamePush48||window.enableGamePush44||window.enableGamePush43;
 if(typeof fn!=='function')throw new Error('알림 기능을 아직 불러오는 중입니다. 잠시 후 다시 눌러주세요.');
 await fn();
 if(typeof Notification!=='undefined'&&Notification.permission==='granted'){
   try{localStorage.setItem('kokmatch_push_enabled_notice629','1')}catch{}
   closePrompt629();
 }
}
async function install629(){
 if(!deferredInstall629){closePrompt629();return}
 const p=deferredInstall629;deferredInstall629=null;
 p.prompt();
 try{await p.userChoice}catch{}
 closePrompt629();
}
function showInstall629(){
 if(standalone629()||promptOpen629)return false;
 if(isIOS629()){
   let last=0;try{last=Number(localStorage.getItem('kokmatch_ios_install_guide629')||0)}catch{}
   if(Date.now()-last<7*DAY629)return false;
   try{localStorage.setItem('kokmatch_ios_install_guide629',String(Date.now()))}catch{}
   modal629('콕매치를 앱처럼 설치하세요','Safari로 열기 → 공유 버튼 → <b>홈 화면에 추가</b>를 선택하면 콕매치가 일반 앱처럼 실행됩니다. 설치 후 홈 화면 아이콘으로 실행하면 게임 푸시 알림도 받을 수 있습니다.','확인','나중에',()=>closePrompt629(),()=>{});
   return true;
 }
 if(deferredInstall629){
   modal629('콕매치를 홈 화면에 설치하세요','앱스토어 설치 없이 홈 화면에서 바로 실행할 수 있고, 새 버전은 다시 설치하지 않아도 적용됩니다.','홈 화면에 설치','나중에',install629,()=>{try{sessionStorage.setItem('kokmatch_install_later629','1')}catch{}});
   return true;
 }
 return false;
}
function showPush629(){
 if(promptOpen629||!loggedIn629()||!supportedPush629())return;
 if(isIOS629()&&!standalone629())return;
 let perm='default';try{perm=Notification.permission}catch{return}
 if(perm==='granted')return;
 if(perm==='default'){
   try{if(sessionStorage.getItem('kokmatch_push_later629')==='1')return}catch{}
   modal629('콕매치 알림을 켜주세요','게임 편성, 편성대기조 배정, 경기 시작 알림을 바로 받을 수 있습니다. 알림은 이 휴대폰에서만 설정됩니다.','알림 켜기','나중에',enablePush629,()=>{try{sessionStorage.setItem('kokmatch_push_later629','1')}catch{}});
   return;
 }
 if(perm==='denied'){
   let last=0;try{last=Number(localStorage.getItem('kokmatch_push_denied_notice629')||0)}catch{}
   if(Date.now()-last<DAY629)return;
   try{localStorage.setItem('kokmatch_push_denied_notice629',String(Date.now()))}catch{}
   modal629('콕매치 알림이 꺼져 있습니다','이전에 알림을 차단해서 앱에서 권한창을 다시 띄울 수 없습니다. 휴대폰 설정에서 콕매치 알림을 허용해주세요.','설정 방법 보기','나중에',()=>{settingsHelp629();closePrompt629()},()=>{});
 }
}
function maybePrompt629(){
 if(promptOpen629)return;
 try{if(sessionStorage.getItem('kokmatch_install_later629')==='1'&&!standalone629()){}else if(!standalone629()&&showInstall629())return}catch{if(!standalone629()&&showInstall629())return}
 showPush629();
}
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstall629=e;setTimeout(maybePrompt629,500)});
window.addEventListener('appinstalled',()=>{deferredInstall629=null;closePrompt629();try{localStorage.setItem('kokmatch_installed629','1')}catch{}});
window.addEventListener('pageshow',()=>setTimeout(maybePrompt629,900));
document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(maybePrompt629,700)});
let tries629=0;const timer629=setInterval(()=>{tries629++;if(loggedIn629()){clearInterval(timer629);setTimeout(maybePrompt629,700)}else if(tries629>180)clearInterval(timer629)},500);
})();
""")
if 'window.__kokmatchPwa629' in js:
    raise SystemExit('v6.29 PWA controller unexpectedly already present')
js += pwa_js
write('app-v6.29.js', js)

css += textwrap.dedent(r"""

/* KokMatch v6.29 PWA prompt */
.pwaPrompt629{position:fixed;inset:0;z-index:99999;background:rgba(15,23,42,.48);display:flex;align-items:flex-end;justify-content:center;padding:18px max(14px,env(safe-area-inset-right)) calc(18px + env(safe-area-inset-bottom)) max(14px,env(safe-area-inset-left));backdrop-filter:blur(2px)}
.pwaPromptCard629{width:min(100%,440px);background:#fff;border-radius:22px;padding:20px;box-shadow:0 20px 60px rgba(15,23,42,.28);text-align:left}
.pwaPromptIcon629{width:48px;height:48px;border-radius:15px;background:#edf4ff;display:grid;place-items:center;font-size:25px;margin-bottom:10px}
.pwaPromptCard629 h3{margin:0 0 8px;font-size:20px;line-height:1.3;color:#10234a}
.pwaPromptBody629{font-size:14px;line-height:1.65;color:#52627a;word-break:keep-all}
.pwaPromptBtns629{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:17px}.pwaPromptBtns629 .btn{min-height:46px;border-radius:13px;font-size:14px;font-weight:800}
@media(max-width:380px){.pwaPromptCard629{padding:17px;border-radius:19px}.pwaPromptCard629 h3{font-size:18px}.pwaPromptBody629{font-size:13px}.pwaPromptBtns629{grid-template-columns:1fr}}
""")
write('app-v6.29.css', css)

# 4) PWA shell metadata and icons.
index = read('index.html').replace('6.28', '6.29')
if '/app-v6.29.js' not in index or '/app-v6.29.css' not in index:
    raise SystemExit('index version replacement failed')
manifest_link = '<link rel="manifest" href="/manifest.webmanifest?v=6.29">'
extra = manifest_link + '\n  <link rel="apple-touch-icon" sizes="180x180" href="/icons/kokmatch-180.png?v=6.29">\n  <meta name="application-name" content="콕매치">\n  <meta name="mobile-web-app-capable" content="yes">'
if manifest_link not in index:
    raise SystemExit('manifest link not found after version replacement')
index = index.replace(manifest_link, extra, 1)
write('index.html', index)

manifest = {
    'id': '/',
    'name': '콕매치 - 배드민턴 모임 운영',
    'short_name': '콕매치',
    'description': '배드민턴 모임 회원, 게임대기, 편성 및 운동통계를 실시간으로 관리하는 콕매치',
    'start_url': '/?source=pwa',
    'scope': '/',
    'display': 'standalone',
    'display_override': ['standalone', 'minimal-ui'],
    'background_color': '#f5f7fb',
    'theme_color': '#2453d4',
    'lang': 'ko-KR',
    'orientation': 'portrait-primary',
    'categories': ['sports', 'utilities'],
    'icons': [
        {'src': '/icons/kokmatch-192.png', 'sizes': '192x192', 'type': 'image/png', 'purpose': 'any'},
        {'src': '/icons/kokmatch-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'any'},
        {'src': '/icons/kokmatch-maskable-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'maskable'},
    ],
}
write('manifest.webmanifest', json.dumps(manifest, ensure_ascii=False, separators=(',', ':')))

# 5) Network-first canonical service worker: never hold stale app/runtime assets.
sw = textwrap.dedent(r"""
const KOKMATCH_SW_VERSION='6.29';
const KOKMATCH_CACHE_PREFIX='kokmatch-';
self.addEventListener('install',event=>{event.waitUntil(self.skipWaiting())});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{try{const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith(KOKMATCH_CACHE_PREFIX)).map(k=>caches.delete(k)))}catch{}await self.clients.claim()})())});
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('fetch',event=>{const req=event.request;if(req.method!=='GET')return;let url;try{url=new URL(req.url)}catch{return}if(url.origin!==self.location.origin)return;event.respondWith((async()=>{try{return await fetch(req,{cache:'no-store'})}catch(e){if(req.mode==='navigate')return new Response('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>콕매치</title><body style="font-family:system-ui;padding:32px;text-align:center"><h2>네트워크 연결을 확인해주세요.</h2><p>연결 후 콕매치를 다시 실행해주세요.</p></body>',{headers:{'content-type':'text/html; charset=utf-8'}});throw e}})())});
self.addEventListener('push',event=>{let payload={};try{payload=event.data?event.data.json():{}}catch{try{payload={body:event.data?.text?.()||''}}catch{payload={}}}const declared=payload.notification&&typeof payload.notification==='object'?payload.notification:{};const title=payload.title||declared.title||'콕매치';const body=payload.body||declared.body||'게임 알림이 도착했습니다.';const data=payload.data||{};const options={body,icon:'/icons/kokmatch-192.png',badge:'/icons/kokmatch-192.png',tag:payload.tag||('kokmatch-'+Date.now()),renotify:true,requireInteraction:true,silent:false,data,timestamp:Date.now()};event.waitUntil((async()=>{const clients=await self.clients.matchAll({type:'window',includeUncontrolled:true});for(const client of clients){try{client.postMessage({type:'KOKMATCH_PUSH_RECEIVED',payload:{title,body,tag:options.tag,data}})}catch{}}await self.registration.showNotification(title,options)})())});
self.addEventListener('notificationclick',event=>{event.notification.close();const data=event.notification.data||{};const view=data.view||'';const clubId=data.clubId||'';event.waitUntil((async()=>{const list=await self.clients.matchAll({type:'window',includeUncontrolled:true});if(list.length){const client=list[0];try{await client.focus()}catch{}try{client.postMessage({type:'KOKMATCH_PUSH_CLICK',view,data})}catch{}return}const p=new URLSearchParams();if(view)p.set('pushView',view);if(clubId)p.set('pushClub',clubId);await self.clients.openWindow('/'+(p.toString()?'?'+p.toString():''))})())});
""").lstrip()
write('kokmatch-sw.js', sw)
write('sw.js', "/* Compatibility entry for older KokMatch clients. */\nimportScripts('/kokmatch-sw.js?v=6.29');\n")

latest = {
    'version': 69,
    'label': 'v6.29',
    'semanticVersion': '6.29',
    'build': 'v6.29',
    'updatedAt': '2026-09-03T09:00:00+09:00',
    'note': 'v6.29 PWA 설치형 전환 · iOS/Android 홈화면 앱 · 알림 권한 안내 · 푸시 서비스워커 통합 · 네트워크 우선 최신화',
}
write('latest-version.json', json.dumps(latest, ensure_ascii=False, indent=2) + '\n')

# 6) Generate lightweight PNG app icons with stdlib only.
def png_chunk(kind, data):
    raw = kind + data
    return struct.pack('>I', len(data)) + raw + struct.pack('>I', binascii.crc32(raw) & 0xffffffff)

def write_icon(rel, n):
    bg = (36, 83, 212, 255)
    white = (255, 255, 255, 255)
    pale = (218, 230, 255, 255)
    rows = []
    cx = n / 2
    for y in range(n):
        row = bytearray([0])
        for x in range(n):
            px = bg
            if ((x-cx)**2/(n*.095)**2 + (y-n*.34)**2/(n*.07)**2) <= 1:
                px = white
            elif n*.40 < y < n*.72:
                half = (y-n*.38)*.35+n*.055
                if abs(x-cx) < half:
                    px = white if y > n*.54 else pale
            if n*.50 < y < n*.57 and abs(x-cx) < n*.18:
                px = white
            row.extend(px)
        rows.append(bytes(row))
    raw = b''.join(rows)
    data = b'\x89PNG\r\n\x1a\n' + png_chunk(b'IHDR', struct.pack('>IIBBBBB', n, n, 8, 6, 0, 0, 0)) + png_chunk(b'IDAT', zlib.compress(raw, 9)) + png_chunk(b'IEND', b'')
    p = ROOT / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_bytes(data)

write_icon('icons/kokmatch-180.png', 180)
write_icon('icons/kokmatch-192.png', 192)
write_icon('icons/kokmatch-512.png', 512)
write_icon('icons/kokmatch-maskable-512.png', 512)

print('Built KokMatch v6.29 PWA candidate')
