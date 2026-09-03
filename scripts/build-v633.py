from pathlib import Path
import json,re

ROOT=Path(__file__).resolve().parent.parent

def read(name): return (ROOT/name).read_text(encoding='utf-8')
def write(name,text): (ROOT/name).write_text(text,encoding='utf-8')

js=read('app-v6.32.js')
css=read('app-v6.32.css')
if "window.__kokmatchVersionLock='6.32'" not in js:
    raise SystemExit('v6.32 runtime marker missing')
js=js.replace('6.32','6.33')
js=js.replace("'/kokmatch-sw.js?v=6.33'","'/kokmatch-sw.js'").replace('"/kokmatch-sw.js?v=6.33"','"/kokmatch-sw.js"')

js += r'''

/* KokMatch v6.33: installed-app update guard, accurate runtime version and final roster controls */
(()=>{
'use strict';
if(window.__kokmatchUpdateGuard633)return;
window.__kokmatchUpdateGuard633=true;
const CURRENT633='6.33';
let checking633=false,reloading633=false,rosterTimer633=0;
const sleep633=ms=>new Promise(r=>setTimeout(r,ms));
function runtime633(){return String(window.__kokmatchVersionLock||window.__kokmatchStandalone||CURRENT633).replace(/^v/,'')}
function cmp633(a,b){const aa=String(a||'').split('.').map(Number),bb=String(b||'').split('.').map(Number);for(let i=0;i<Math.max(aa.length,bb.length);i++){const d=(aa[i]||0)-(bb[i]||0);if(d)return d}return 0}
async function clearKokmatchCaches633(){if(!('caches'in window))return;try{const keys=await caches.keys();await Promise.all(keys.filter(k=>/kokmatch|kkokmatch/i.test(String(k))).map(k=>caches.delete(k)))}catch{}}
async function ensureLatestSw633(){
 if(!('serviceWorker'in navigator))return null;let reg=null;
 try{reg=await navigator.serviceWorker.register('/kokmatch-sw.js',{scope:'/',updateViaCache:'none'});await reg.update().catch(()=>{});if(reg.waiting)reg.waiting.postMessage({type:'SKIP_WAITING'});if(reg.installing){await Promise.race([new Promise(resolve=>{const w=reg.installing;const done=()=>{if(!w||['installed','activated','redundant'].includes(w.state)){try{w?.removeEventListener('statechange',done)}catch{}resolve()}};try{w?.addEventListener('statechange',done)}catch{resolve()};done()}),sleep633(1200)]);if(reg.waiting)reg.waiting.postMessage({type:'SKIP_WAITING'})}}catch(e){console.warn('KokMatch v6.33 service worker update',e)}
 return reg;
}
async function latest633(){try{const r=await fetch('/latest-version.json?kmv='+Date.now(),{cache:'no-store',headers:{'cache-control':'no-cache'}});if(!r.ok)throw new Error('version '+r.status);const x=await r.json();return String(x?.semanticVersion||x?.label||'').replace(/^v/,'')}catch{return ''}}
function cleanLegacyVersionUi633(){
 try{if(!document.body)return;const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);const nodes=[];let n=null;while((n=walker.nextNode()))nodes.push(n);for(const node of nodes){const raw=String(node.nodeValue||'');const next=raw.replace(/-?v(?:[1-5]\.\d+|6\.(?:[0-2]?\d|3[0-2]))(?=\b)/g,'');if(next!==raw)node.nodeValue=next}}catch{}
}
function patchVersion633(){
 const box=document.getElementById('settings');
 if(box){
  for(const el of box.querySelectorAll('.meta')){const t=String(el.textContent||'');if(/콕매치\s+v[0-9.]+/.test(t))el.remove()}
  let badge=box.querySelector('#kokmatchRuntimeVersion633');
  if(!badge){badge=document.createElement('div');badge.id='kokmatchRuntimeVersion633';badge.className='meta kokmatchRuntimeVersion633';const title=box.querySelector('h2,h3');if(title?.nextSibling)title.parentNode.insertBefore(badge,title.nextSibling);else box.prepend(badge)}
  badge.textContent='콕매치 v'+CURRENT633+' · 최신 운영본';
 }
 cleanLegacyVersionUi633();
}
function rosterNeedsCanonical633(){if(currentView!=='members')return false;const box=document.getElementById('members');if(!box)return false;for(const card of box.querySelectorAll('.memberCard')){const any=[...card.querySelectorAll('.memberBtns button')];if(any.some(b=>String(b.textContent||'').trim()==='운동'))return true;if(any.length&&any.some(b=>!b.classList.contains('kmRosterAction621')))return true}return false}
function paintRosterCanonical633(force=false){try{if(currentView!=='members')return;if(!force&&!rosterNeedsCanonical633())return;if(typeof window.__kokmatchPaintRosterControls632==='function')window.__kokmatchPaintRosterControls632();else if(typeof window.__kokmatchRepairRosterV6==='function')window.__kokmatchRepairRosterV6()}catch(e){console.warn('KokMatch v6.33 roster canonical paint',e)}}
function scheduleRosterCanonical633(force=false){clearTimeout(rosterTimer633);rosterTimer633=setTimeout(()=>{paintRosterCanonical633(force);setTimeout(()=>paintRosterCanonical633(false),90);setTimeout(()=>paintRosterCanonical633(false),260)},0)}
try{const baseRenderSettings633=renderSettings;renderSettings=function(...args){const r=baseRenderSettings633.apply(this,args);patchVersion633();return r};window.renderSettings=renderSettings}catch{}
try{const baseRenderMembers633=renderMembers;renderMembers=function(...args){const r=baseRenderMembers633.apply(this,args);scheduleRosterCanonical633(true);return r};window.renderMembers=renderMembers}catch{}
try{const baseSubmitLogin633=submitLogin;submitLogin=async function(...args){const r=await baseSubmitLogin633.apply(this,args);scheduleRosterCanonical633(true);setTimeout(()=>scheduleRosterCanonical633(true),450);return r};window.submitLogin=submitLogin}catch{}
async function hardReload633(target=CURRENT633,reason='update'){
 if(reloading633)return;reloading633=true;try{saveRefreshState?.()}catch{}await clearKokmatchCaches633();await ensureLatestSw633();try{await fetch('/index.html?kmv='+encodeURIComponent(target)+'&t='+Date.now(),{cache:'no-store',headers:{'cache-control':'no-cache'}})}catch{}
 const u=new URL(location.origin+'/');let standalone=false;try{standalone=window.matchMedia?.('(display-mode: standalone)')?.matches===true}catch{}u.searchParams.set('source',standalone?'pwa':'web');u.searchParams.set('kmv',String(target||CURRENT633));u.searchParams.set('r',Date.now().toString(36));location.replace(u.pathname+u.search);
}
async function checkVersion633(reason='startup'){if(checking633||reloading633)return false;checking633=true;try{await ensureLatestSw633();const latest=await latest633(),cur=runtime633();patchVersion633();if(latest&&cmp633(latest,cur)>0){const key='kokmatch_update_reload_'+latest;let last=0;try{last=Number(sessionStorage.getItem(key)||0)}catch{}if(Date.now()-last>5000){try{sessionStorage.setItem(key,String(Date.now()))}catch{};await hardReload633(latest,reason);return true}}return false}finally{checking633=false}}
try{forceUpdateApp=async function(){const b=document.getElementById('forceUpdateBtn');if(b){b.disabled=true;b.textContent='최신 운영본 확인 중...'}try{const latest=await latest633();await hardReload633(latest||CURRENT633,'manual')}catch(e){if(b){b.disabled=false;b.textContent='↻ 최신 버전으로 새로고침'};try{showError(e)}catch{alert(e?.message||String(e))}}};window.forceUpdateApp=forceUpdateApp}catch{}
window.__kokmatchCheckVersion633=checkVersion633;window.__kokmatchHardReload633=hardReload633;window.__kokmatchPaintRosterCanonical633=paintRosterCanonical633;
setTimeout(()=>{checkVersion633('startup');patchVersion633();scheduleRosterCanonical633(false)},250);
window.addEventListener('pageshow',()=>setTimeout(()=>{checkVersion633('pageshow');patchVersion633();scheduleRosterCanonical633(false)},150),{passive:true});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(()=>{checkVersion633('visible');patchVersion633();scheduleRosterCanonical633(false)},200)},{passive:true});
setTimeout(()=>{patchVersion633();scheduleRosterCanonical633(false)},600);setTimeout(()=>{patchVersion633();scheduleRosterCanonical633(false)},1400);
})();
'''

write('app-v6.33.js',js)
write('app-v6.33.css',css)

index=read('index.html').replace('6.32','6.33')
needle="    window.__kokmatchBuild='v6.33';\n"
insert="""    window.__kokmatchBuild='v6.33';\n    if('serviceWorker' in navigator){\n      navigator.serviceWorker.register('/kokmatch-sw.js',{scope:'/',updateViaCache:'none'}).then(async r=>{try{await r.update()}catch{};try{r.waiting?.postMessage({type:'SKIP_WAITING'})}catch{}}).catch(()=>{});\n    }\n"""
if needle not in index: raise SystemExit('index bootstrap insertion point missing')
index=index.replace(needle,insert,1)
write('index.html',index)

manifest=json.loads(read('manifest.webmanifest'));manifest['start_url']='/?source=pwa&kmv=6.33';write('manifest.webmanifest',json.dumps(manifest,ensure_ascii=False,separators=(',',':'))+'\n')

sw=r'''const KOKMATCH_SW_VERSION='6.33';
const KOKMATCH_CACHE_PREFIX='kokmatch-';
self.addEventListener('install',event=>{event.waitUntil(self.skipWaiting())});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{try{const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith(KOKMATCH_CACHE_PREFIX)||/kkokmatch/i.test(k)).map(k=>caches.delete(k)))}catch{}await self.clients.claim()})())});
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting();if(event.data?.type==='CHECK_UPDATE')event.waitUntil(self.registration.update().catch(()=>{}))});
self.addEventListener('fetch',event=>{const req=event.request;if(req.method!=='GET')return;let url;try{url=new URL(req.url)}catch{return}if(url.origin!==self.location.origin)return;if(req.mode==='navigate')event.waitUntil(self.registration.update().catch(()=>{}));event.respondWith((async()=>{try{return await fetch(req,{cache:'no-store'})}catch(e){if(req.mode==='navigate')return new Response('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>콕매치</title><body style="font-family:system-ui;padding:32px;text-align:center"><h2>네트워크 연결을 확인해주세요.</h2><p>연결 후 콕매치를 다시 실행해주세요.</p></body>',{headers:{'content-type':'text/html; charset=utf-8'}});throw e}})())});
self.addEventListener('push',event=>{let payload={};try{payload=event.data?event.data.json():{}}catch{try{payload={body:event.data?.text?.()||''}}catch{payload={}}}const declared=payload.notification&&typeof payload.notification==='object'?payload.notification:{};const title=payload.title||declared.title||'콕매치';const body=payload.body||declared.body||'게임 알림이 도착했습니다.';const data=payload.data||{};const options={body,icon:'/icons/kokmatch-192.png',badge:'/icons/kokmatch-192.png',tag:payload.tag||('kokmatch-'+Date.now()),renotify:true,requireInteraction:true,silent:false,data,timestamp:Date.now()};event.waitUntil((async()=>{const clients=await self.clients.matchAll({type:'window',includeUncontrolled:true});for(const client of clients){try{client.postMessage({type:'KOKMATCH_PUSH_RECEIVED',payload:{title,body,tag:options.tag,data}})}catch{}}await self.registration.showNotification(title,options)})())});
self.addEventListener('notificationclick',event=>{event.notification.close();const data=event.notification.data||{};const view=data.view||'';const clubId=data.clubId||'';event.waitUntil((async()=>{const list=await self.clients.matchAll({type:'window',includeUncontrolled:true});if(list.length){const client=list[0];try{await client.focus()}catch{}try{client.postMessage({type:'KOKMATCH_PUSH_CLICK',view,data})}catch{}return}const p=new URLSearchParams();if(view)p.set('pushView',view);if(clubId)p.set('pushClub',clubId);await self.clients.openWindow('/'+(p.toString()?'?'+p.toString():''))})())});
'''
write('kokmatch-sw.js',sw);write('sw.js',"/* Stable compatibility entry for older KokMatch installations. */\nimportScripts('/kokmatch-sw.js');\n")
latest={'version':73,'label':'v6.33','semanticVersion':'6.33','build':'v6.33','updatedAt':'2026-09-03T11:05:00+09:00','note':'v6.33 Android PWA 업데이트 복구 · 구형 버전표시 제거 · 최초 로그인 1회 안정화 · 태블릿 회원버튼 최신 3버튼 고정'}
write('latest-version.json',json.dumps(latest,ensure_ascii=False,indent=2)+'\n')
print('Built KokMatch v6.33 candidate')
