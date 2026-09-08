from pathlib import Path
from datetime import datetime
from zoneinfo import ZoneInfo
import json, re, shutil

ROOT=Path('.')
OLD='6.50'; NEW='6.51'
old_js=ROOT/f'app-v{OLD}.js'; old_css=ROOT/f'app-v{OLD}.css'
new_js=ROOT/f'app-v{NEW}.js'; new_css=ROOT/f'app-v{NEW}.css'
assert old_js.exists() and old_css.exists()

# Preserve the currently deployed standalone before producing the next one.
arc=ROOT/'versions'/f'v{OLD}'
arc.mkdir(parents=True, exist_ok=True)
for p in [old_js,old_css,ROOT/'index.html',ROOT/'kokmatch-sw.js',ROOT/'sw.js',ROOT/'latest-version.json']:
    if p.exists(): shutil.copy2(p,arc/p.name)

js=old_js.read_text(encoding='utf-8').replace(OLD,NEW)

# 1) dailyCount used to scan all history for every member/card render. Cache once per history snapshot.
old_daily="function dailyCount(id){return S.history.filter(h=>Array.isArray(h.players)&&h.players.includes(id)).length}"
new_daily="""let dailyCountCacheRef651=null,dailyCountCacheLen651=-1,dailyCountCache651=new Map();
function rebuildDailyCount651(){
 const h=Array.isArray(S?.history)?S.history:[];
 if(h===dailyCountCacheRef651&&h.length===dailyCountCacheLen651)return;
 dailyCountCacheRef651=h;dailyCountCacheLen651=h.length;dailyCountCache651=new Map();
 for(const game of h){
  const seen=new Set(Array.isArray(game?.players)?game.players.map(String):[]);
  for(const id of seen)dailyCountCache651.set(id,(dailyCountCache651.get(id)||0)+1);
 }
}
function dailyCount(id){rebuildDailyCount651();return dailyCountCache651.get(String(id))||0}"""
assert js.count(old_daily)==1, 'dailyCount source changed'
js=js.replace(old_daily,new_daily,1)

# 2) v92 observer literally replaced '개발자' with the same word and walked the full DOM on mutations.
#    Keep the role label/version compatibility but remove the no-op full-document observer.
pat92=re.compile(r"/\* migrated into v6\.0: app-v92\.js \*/\n\(\(\)=>\{.*?\n\}\)\(\);\n\n/\* migrated into v6\.0: app-v93\.js \*/",re.S)
rep92="""/* migrated into v6.0: app-v92.js — v6.51 compacted no-op role observer */
(()=>{
roleLabel=function(r){return r==='admin'?'개발자':r==='manager'?'모임장':r==='organizer'?'운영진':'일반'};
const renderSettings91=renderSettings;
renderSettings=function(){renderSettings91();const box=$('settings');if(box)[...box.querySelectorAll('.meta')].forEach(el=>{if((el.textContent||'').includes('콕매치 v91'))el.textContent='콕매치 v92 · 역할명칭/편성화면 조정'})};
if(me)renderAll();
})();

/* migrated into v6.0: app-v93.js */"""
js,n92=pat92.subn(rep92,js,count=1)
assert n92==1, 'v92 no-op observer block not found'

# 3) Attendance is already optimistic. After changing one member, repaint only canonical roster rails/header
#    instead of rebuilding every app view twice.
old_att="""function snap31(m){return{state:m.state,joinedAt:m.joinedAt,queue:[...(S.queue||[])],draft:Array.isArray(draft)?[...draft]:[]}}
function restore31(id,s){const m=M(id);if(m){m.state=s.state;m.joinedAt=s.joinedAt}S.queue=[...s.queue];draft=[...s.draft];if(currentView==='members')renderMembers();try{renderHeader()}catch{}}
function local31(id,mode){const m=M(id);if(!m)return;S.queue=(S.queue||[]).filter(x=>String(x)!==String(id));if(Array.isArray(draft))draft=draft.map(x=>String(x)===String(id)?null:x);if(mode==='waiting'){if(!S.queue.some(x=>String(x)===String(id)))S.queue.push(id);m.state='waiting';m.joinedAt=Date.now()}else if(mode==='spectator'){m.state='spectator';m.joinedAt=null}else{m.state='out';m.joinedAt=null}}
setOther=async function(id,mode){const key=String(id);if(attendanceBusy31.has(key))return;const m=M(id);if(!m)return;const s=snap31(m);attendanceBusy31.add(key);local31(id,mode);if(currentView==='members')renderMembers();try{renderHeader()}catch{}
 try{const x=await atomic31('set_member_attendance',{memberId:id,mode});if(x?.data){S=x.data;normalizeClient();if(currentView==='members')renderMembers();try{renderHeader()}catch{}}}
 catch(e){restore31(id,s);showError(e)}finally{attendanceBusy31.delete(key)}};"""
new_att="""function snap31(m){return{state:m.state,joinedAt:m.joinedAt,queue:[...(S.queue||[])],draft:Array.isArray(draft)?[...draft]:[]}}
function refreshAttendance31(){
 if(currentView==='members'){
  try{if(typeof window.__kokmatchStabilizeRoster637==='function')window.__kokmatchStabilizeRoster637(true);else renderMembers()}catch{try{renderMembers()}catch{}}
 }
 try{renderHeader()}catch{}
}
function restore31(id,s){const m=M(id);if(m){m.state=s.state;m.joinedAt=s.joinedAt}S.queue=[...s.queue];draft=[...s.draft];refreshAttendance31()}
function local31(id,mode){const m=M(id);if(!m)return;S.queue=(S.queue||[]).filter(x=>String(x)!==String(id));if(Array.isArray(draft))draft=draft.map(x=>String(x)===String(id)?null:x);if(mode==='waiting'){if(!S.queue.some(x=>String(x)===String(id)))S.queue.push(id);m.state='waiting';m.joinedAt=Date.now()}else if(mode==='spectator'){m.state='spectator';m.joinedAt=null}else{m.state='out';m.joinedAt=null}}
setOther=async function(id,mode){const key=String(id);if(attendanceBusy31.has(key))return;const m=M(id);if(!m)return;const s=snap31(m);attendanceBusy31.add(key);local31(id,mode);refreshAttendance31();
 try{const x=await atomic31('set_member_attendance',{memberId:id,mode});if(x?.data){S=x.data;normalizeClient();refreshAttendance31()}}
 catch(e){restore31(id,s);showError(e)}finally{attendanceBusy31.delete(key)}};"""
assert js.count(old_att)==1, 'v3.1 attendance source changed'
js=js.replace(old_att,new_att,1)

# 4) The final roster MutationObserver already catches delayed DOM changes. Keep immediate/rAF/one tail
#    verification instead of four delayed scans on every member render.
old_sched="""function schedule637(force=false){
 clearTimeout(timer637);
 timer637=setTimeout(()=>{
  stabilize637(force);
  requestAnimationFrame(()=>stabilize637(false));
  setTimeout(()=>stabilize637(false),70);
  setTimeout(()=>stabilize637(false),220);
  setTimeout(()=>stabilize637(false),520);
 },0);
}"""
new_sched="""let raf637=0,tail637=0;
function schedule637(force=false){
 clearTimeout(timer637);clearTimeout(tail637);if(raf637)cancelAnimationFrame(raf637);
 timer637=setTimeout(()=>{
  stabilize637(force);
  raf637=requestAnimationFrame(()=>{raf637=0;stabilize637(false)});
  tail637=setTimeout(()=>stabilize637(false),140);
 },0);
}"""
assert js.count(old_sched)==1, 'v6.50 roster schedule source changed'
js=js.replace(old_sched,new_sched,1)

# 5) Version checking was triggered by pageshow + startup + visibility in quick succession.
#    Keep update freshness but coalesce checks within 30 seconds.
old_flag="let checking633=false,reloading633=false,rosterTimer633=0;"
new_flag="let checking633=false,reloading633=false,rosterTimer633=0,lastVersionCheck633=0;"
assert js.count(old_flag)==1
js=js.replace(old_flag,new_flag,1)
pat_check=re.compile(r"async function checkVersion633\(reason='startup'\)\{.*?\}\ntry\{forceUpdateApp=",re.S)
m=pat_check.search(js);assert m, 'checkVersion633 source changed'
old_func=m.group(0)[:-len("try{forceUpdateApp=")]
# Preserve the existing body logic by injecting only a throttle immediately after the function opening.
needle="async function checkVersion633(reason='startup'){if(checking633||reloading633)return false;checking633=true;"
assert needle in old_func
new_func=old_func.replace(needle,"async function checkVersion633(reason='startup'){if(checking633||reloading633)return false;const now633=Date.now();if(lastVersionCheck633&&now633-lastVersionCheck633<30000){patchVersion633();return false}lastVersionCheck633=now633;checking633=true;",1)
js=js[:m.start()]+new_func+"try{forceUpdateApp="+js[m.end():]

new_js.write_text(js,encoding='utf-8')

# CSS remains functionally identical; only the standalone version marker changes.
css=old_css.read_text(encoding='utf-8').replace(OLD,NEW)
new_css.write_text(css,encoding='utf-8')

idx=(ROOT/'index.html').read_text(encoding='utf-8').replace(OLD,NEW)
idx=idx.replace("<link rel=\"stylesheet\" href=\"/app-v6.51.css?v=6.51\">","<link rel=\"preconnect\" href=\"https://wjelumpbjklfrdjxbesj.supabase.co\" crossorigin>\n  <link rel=\"dns-prefetch\" href=\"//wjelumpbjklfrdjxbesj.supabase.co\">\n  <link rel=\"stylesheet\" href=\"/app-v6.51.css?v=6.51\">")
idx=idx.replace("navigator.serviceWorker.register('/kokmatch-sw.js',{scope:'/',updateViaCache:'none'}).then(async r=>{try{await r.update()}catch{};try{r.waiting?.postMessage({type:'SKIP_WAITING'})}catch{}}).catch(()=>{});","navigator.serviceWorker.register('/kokmatch-sw.js',{scope:'/',updateViaCache:'none'}).then(r=>{try{r.waiting?.postMessage({type:'SKIP_WAITING'})}catch{}}).catch(()=>{});")
idx=idx.replace("document.documentElement.dataset.kokmatchEntry='single-v628';","document.documentElement.dataset.kokmatchEntry='single-v651';")
idx=idx.replace("window.__kokmatchEntryResumeMode='session-coordinator-v634';","window.__kokmatchEntryResumeMode='session-coordinator-v651';")
(ROOT/'index.html').write_text(idx,encoding='utf-8')

# Static assets are immutable by version. Cache those, while HTML/version checks remain network-first/no-store.
sw=f"""const KOKMATCH_SW_VERSION='{NEW}';
const KOKMATCH_CACHE_PREFIX='kokmatch-static-';
const KOKMATCH_STATIC_CACHE=KOKMATCH_CACHE_PREFIX+KOKMATCH_SW_VERSION;
const KOKMATCH_CORE=[
  '/app-v{NEW}.css?v={NEW}',
  '/app-v{NEW}.js?v={NEW}',
  '/manifest.webmanifest?v={NEW}',
  '/icons/kokmatch-180.png?v={NEW}',
  '/icons/kokmatch-192.png'
];
self.addEventListener('install',event=>{{event.waitUntil((async()=>{{const c=await caches.open(KOKMATCH_STATIC_CACHE);await Promise.allSettled(KOKMATCH_CORE.map(async u=>{{const r=await fetch(u,{{cache:'no-store'}});if(r.ok)await c.put(u,r)}}));await self.skipWaiting()}})())}});
self.addEventListener('activate',event=>{{event.waitUntil((async()=>{{try{{const keys=await caches.keys();await Promise.all(keys.filter(k=>(k.startsWith(KOKMATCH_CACHE_PREFIX)||/kkokmatch/i.test(k))&&k!==KOKMATCH_STATIC_CACHE).map(k=>caches.delete(k)))}}catch{{}}await self.clients.claim()}})())}});
self.addEventListener('message',event=>{{if(event.data?.type==='SKIP_WAITING')self.skipWaiting();if(event.data?.type==='CHECK_UPDATE')event.waitUntil(self.registration.update().catch(()=>{{}}))}});
async function networkFirstNavigation(req){{
 try{{const r=await fetch(req,{{cache:'no-store'}});if(r?.ok){{try{{const c=await caches.open(KOKMATCH_STATIC_CACHE);await c.put('/__kokmatch_shell__',r.clone())}}catch{{}}}}return r}}catch(e){{
  const c=await caches.open(KOKMATCH_STATIC_CACHE),fallback=await c.match('/__kokmatch_shell__');if(fallback)return fallback;
  return new Response('<!doctype html><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>콕매치</title><body style=\"font-family:system-ui;padding:32px;text-align:center\"><h2>네트워크 연결을 확인해주세요.</h2><p>연결 후 콕매치를 다시 실행해주세요.</p></body>',{{headers:{{'content-type':'text/html; charset=utf-8'}}}})
 }}
}}
async function cachedStatic(req){{const c=await caches.open(KOKMATCH_STATIC_CACHE),hit=await c.match(req);if(hit)return hit;const r=await fetch(req,{{cache:'no-store'}});if(r?.ok)try{{await c.put(req,r.clone())}}catch{{}}return r}}
self.addEventListener('fetch',event=>{{
 const req=event.request;if(req.method!=='GET')return;let url;try{{url=new URL(req.url)}}catch{{return}}if(url.origin!==self.location.origin)return;
 if(req.mode==='navigate'){{event.waitUntil(self.registration.update().catch(()=>{{}}));event.respondWith(networkFirstNavigation(req));return}}
 if(url.pathname==='/latest-version.json'||url.pathname==='/index.html'||url.pathname==='/kokmatch-sw.js'||url.pathname==='/sw.js'){{event.respondWith(fetch(req,{{cache:'no-store'}}));return}}
 const currentAsset=url.pathname===`/app-v${{KOKMATCH_SW_VERSION}}.js`||url.pathname===`/app-v${{KOKMATCH_SW_VERSION}}.css`||url.pathname==='/manifest.webmanifest'||url.pathname.startsWith('/icons/');
 if(currentAsset){{event.respondWith(cachedStatic(req));return}}
 event.respondWith(fetch(req,{{cache:'no-store'}}));
}});
self.addEventListener('push',event=>{{let payload={{}};try{{payload=event.data?event.data.json():{{}}}}catch{{try{{payload={{body:event.data?.text?.()||''}}}}catch{{payload={{}}}}}}const declared=payload.notification&&typeof payload.notification==='object'?payload.notification:{{}};const title=payload.title||declared.title||'콕매치';const body=payload.body||declared.body||'게임 알림이 도착했습니다.';const data=payload.data||{{}};const options={{body,icon:'/icons/kokmatch-192.png',badge:'/icons/kokmatch-192.png',tag:payload.tag||('kokmatch-'+Date.now()),renotify:true,requireInteraction:true,silent:false,data,timestamp:Date.now()}};event.waitUntil((async()=>{{const clients=await self.clients.matchAll({{type:'window',includeUncontrolled:true}});for(const client of clients){{try{{client.postMessage({{type:'KOKMATCH_PUSH_RECEIVED',payload:{{title,body,tag:options.tag,data}}}})}}catch{{}}}}await self.registration.showNotification(title,options)}})())}});
self.addEventListener('notificationclick',event=>{{event.notification.close();const data=event.notification.data||{{}};const view=data.view||'';const clubId=data.clubId||'';event.waitUntil((async()=>{{const list=await self.clients.matchAll({{type:'window',includeUncontrolled:true}});if(list.length){{const client=list[0];try{{await client.focus()}}catch{{}}try{{client.postMessage({{type:'KOKMATCH_PUSH_CLICK',view,data}})}}catch{{}}return}}const p=new URLSearchParams();if(view)p.set('pushView',view);if(clubId)p.set('pushClub',clubId);await self.clients.openWindow('/'+(p.toString()?'?'+p.toString():''))}})())}});
"""
(ROOT/'kokmatch-sw.js').write_text(sw,encoding='utf-8')
(ROOT/'sw.js').write_text(f"/* Stable compatibility entry for older KokMatch installations. */\nimportScripts('/kokmatch-sw.js?v={NEW}');\n",encoding='utf-8')

for p in ['manifest.webmanifest']:
    q=ROOT/p
    if q.exists(): q.write_text(q.read_text(encoding='utf-8').replace(OLD,NEW),encoding='utf-8')

latest={
 'version':91,'label':f'v{NEW}','semanticVersion':NEW,'build':f'v{NEW}',
 'updatedAt':datetime.now(ZoneInfo('Asia/Seoul')).isoformat(timespec='seconds'),
 'note':'v6.51 안정화/속도개선 · 정적자산 PWA 캐시 · 출석 부분갱신 · 게임횟수 캐시 · 중복 DOM 감시/재검사 축소'
}
(ROOT/'latest-version.json').write_text(json.dumps(latest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

# Builder guards: fail before release if any targeted invariant was not produced.
assert f'app-v{NEW}.js?v={NEW}' in idx and f'app-v{NEW}.css?v={NEW}' in idx
assert 'rel="preconnect" href="https://wjelumpbjklfrdjxbesj.supabase.co"' in idx
assert "dataset.kokmatchEntry='single-v651'" in idx
assert 'dailyCountCache651' in js
assert 'refreshAttendance31' in js
assert "ROLE_REPLACE92=[['개발자','개발자']]" not in js
assert 'setTimeout(()=>stabilize637(false),520)' not in js
assert "KOKMATCH_STATIC_CACHE=KOKMATCH_CACHE_PREFIX+KOKMATCH_SW_VERSION" in sw
print('v6.51 build assertions OK')
