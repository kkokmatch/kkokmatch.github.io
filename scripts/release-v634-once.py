from pathlib import Path
import json
import re

SOURCE = '6.33'
TARGET = '6.34'

js = Path(f'app-v{SOURCE}.js').read_text(encoding='utf-8')

# Canonical runtime markers.
replacements = [
    ('/* v6.33: show the revised iPhone install guide once after upgrade */',
     '/* v6.34: ordered session restore + global version renderer */'),
    ("window.__kokmatchStandalone='6.33';", "window.__kokmatchStandalone='6.34';"),
    ("window.__kokmatchVersionLock='6.33';", "window.__kokmatchVersionLock='6.34';"),
    ("sessionStorage.setItem('kokmatch_runtime_version','6.33')", "sessionStorage.setItem('kokmatch_runtime_version','6.34')"),
    ("const CURRENT633='6.33';", "const CURRENT633='6.34';"),
]
for old, new in replacements:
    if old not in js:
        raise SystemExit(f'missing patch anchor: {old}')
    js = js.replace(old, new, 1)

# A stored session must never build/focus the login form before restoration.
old = ';renderLoginName();renderNav()}'
if old not in js:
    raise SystemExit('renderShell anchor missing')
js = js.replace(old, ';if(!T)renderLoginName();renderNav()}', 1)

# Build only the shell at the old boot location. Session restoration happens after every
# migrated wrapper has registered, at the very end of the file.
old = 'setInterval(backgroundStatePollV617,10000);boot();'
new = """setInterval(backgroundStatePollV617,10000);
renderShell();
try{if(T)$('login')?.classList.add('hide');else $('login')?.classList.remove('hide')}catch{}
if('serviceWorker'in navigator)navigator.serviceWorker.register('/kokmatch-sw.js',{scope:'/',updateViaCache:'none'}).catch(()=>{});
window.__kokmatchShellReady634=true;"""
if old not in js:
    raise SystemExit('early boot anchor missing')
js = js.replace(old, new, 1)

# v6.34 becomes the single state-refresh owner on resume. Preserve v6.32's roster painter.
old = """window.addEventListener('pagehide',()=>{backgrounded632=true},{passive:true});
window.addEventListener('pageshow',e=>{if(e.persisted||backgrounded632)schedule632('pageshow',70)},{passive:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden){backgrounded632=true;return}if(backgrounded632)schedule632('visibility',90)},{passive:true});
window.addEventListener('focus',()=>{if(backgrounded632)schedule632('focus',120)},{passive:true});"""
if old not in js:
    raise SystemExit('v6.32 resume listener anchor missing')
js = js.replace(old, '/* v6.34: resume state refresh is centralized below; painter632 remains available. */', 1)

# Remove the old v46 visibility state refresh that otherwise races the final coordinator.
old = "document.addEventListener('visibilitychange',()=>{if(!document.hidden&&T){lastPoll46[currentView]=0;if(currentView==='members'&&memberSessionReady46()){if(typeof window.enterMembers42==='function')window.enterMembers42(false);return}loadState(true).catch(()=>{})}});"
if old not in js:
    raise SystemExit('v46 visibility listener anchor missing')
js = js.replace(old, '/* v6.34: visibility state refresh is handled by the final session coordinator. */', 1)

# Keep v6.33 update/roster protections, but route its version patch through the one final renderer.
pattern = r"function patchVersion633\(\)\{.*?\n\}\nfunction rosterNeedsCanonical633"
replacement = "function patchVersion633(){try{window.__kokmatchRenderGlobalVersion634?.()}catch{}}\nfunction rosterNeedsCanonical633"
js, count = re.subn(pattern, replacement, js, count=1, flags=re.S)
if count != 1:
    raise SystemExit(f'patchVersion633 replacement count={count}')

coordinator = r'''

/* KokMatch v6.34: one global version renderer + ordered session coordinator */
(()=>{
'use strict';
if(window.__kokmatchSessionCoordinator634)return;
window.__kokmatchSessionCoordinator634=true;
const BUILD634=Object.freeze({version:'6.34',label:'콕매치 v6.34 · 최신 운영본'});
window.__kokmatchBuildInfo=BUILD634;
window.__kokmatchGlobalVersion=BUILD634.version;
try{document.documentElement.dataset.kokmatchVersion=BUILD634.version;document.documentElement.dataset.kokmatchBuild='v'+BUILD634.version}catch{}
let versionSync634=false,sessionBusy634=false,resumeTimer634=0,startupRetry634=0,inflight634=null;
const sleep634=ms=>new Promise(r=>setTimeout(r,ms));
function token634(){try{return String(T||localStorage.getItem(TOKEN_KEY)||localStorage.getItem('kokmatch_token')||'').trim()}catch{return String(T||'').trim()}}
function ready634(){try{return !!(token634()&&me&&group&&currentGroupId)}catch{return false}}
function hideLogin634(){try{$('login')?.classList.add('hide')}catch{}}
function showLogin634(){try{const el=$('login');if(!el)return;el.classList.remove('hide');if(!$('loginName')&&!$('loginPin'))renderLoginName()}catch{}}
function versionCards634(box){return [...box.querySelectorAll(':scope > .card')].filter(c=>{const t=String(c.textContent||'');return t.includes('프로그램 버전')||!!c.querySelector('#forceUpdateBtn,#kokmatchGlobalVersion634,#kokmatchRuntimeVersion633')})}
function renderGlobalVersion634(){
 if(versionSync634)return;
 versionSync634=true;
 try{
  window.__kokmatchStandalone=BUILD634.version;window.__kokmatchVersionLock=BUILD634.version;window.__kokmatchBuild='v'+BUILD634.version;
  const oldBadge=document.getElementById('kokmatchRuntimeVersion633');if(oldBadge)oldBadge.remove();
  const box=$('settings');if(!box)return;
  let cards=versionCards634(box),card=cards.shift()||null;
  for(const extra of cards)extra.remove();
  if(!card){
   card=document.createElement('div');card.className='card kmGlobalVersionCard634';
   card.innerHTML='<div class="between"><div><b>프로그램 버전</b><div id="kokmatchGlobalVersion634" class="meta"></div></div><span class="tag">운영본</span></div><button id="forceUpdateBtn" class="btn pri" style="width:100%;margin-top:10px" onclick="forceUpdateApp()">↻ 최신 버전으로 새로고침</button>';
   const home=[...box.querySelectorAll(':scope > .card')].find(c=>String(c.textContent||'').includes('홈 화면에 추가'));
   if(home)box.insertBefore(card,home);else box.appendChild(card);
  }
  card.classList.add('kmGlobalVersionCard634');
  let meta=card.querySelector('#kokmatchGlobalVersion634')||card.querySelector('.meta');
  if(!meta){meta=document.createElement('div');meta.className='meta';const holder=[...card.querySelectorAll('div')].find(d=>[...d.children].some(x=>x.tagName==='B'&&String(x.textContent||'').includes('프로그램 버전')))||card;holder.appendChild(meta)}
  meta.id='kokmatchGlobalVersion634';
  if(meta.textContent!==BUILD634.label)meta.textContent=BUILD634.label;
  if(!card.querySelector('#forceUpdateBtn')){const b=document.createElement('button');b.id='forceUpdateBtn';b.className='btn pri';b.style.cssText='width:100%;margin-top:10px';b.textContent='↻ 최신 버전으로 새로고침';b.onclick=()=>forceUpdateApp();card.appendChild(b)}
  for(const el of document.querySelectorAll('.meta')){if(el===meta)continue;const t=String(el.textContent||'').trim();if(/^콕매치\s+v\d+(?:\.\d+)+/.test(t))el.remove()}
 }catch(e){console.warn('KokMatch v6.34 global version render',e)}finally{versionSync634=false}
}
window.__kokmatchRenderGlobalVersion634=renderGlobalVersion634;
function armVersionObserver634(){
 const box=$('settings');if(!box||box.__kokmatchVersionObserver634)return;
 const mo=new MutationObserver(()=>{if(!versionSync634)queueMicrotask(renderGlobalVersion634)});
 mo.observe(box,{subtree:true,childList:true,characterData:true});box.__kokmatchVersionObserver634=mo;
}
try{const baseSettings634=renderSettings;renderSettings=function(...args){const r=baseSettings634.apply(this,args);renderGlobalVersion634();armVersionObserver634();return r};window.renderSettings=renderSettings}catch{}
try{const baseAll634=renderAll;renderAll=function(...args){const r=baseAll634.apply(this,args);renderGlobalVersion634();armVersionObserver634();return r};window.renderAll=renderAll}catch{}
try{const baseGoView634=goView;goView=function(...args){const r=baseGoView634.apply(this,args);if(args[0]==='settings')renderGlobalVersion634();return r};window.goView=goView}catch{}

/* Same token + group state loads share one promise, preventing competing render orders. */
try{
 const baseLoadState634=loadState;
 loadState=async function(...args){
  const key=token634()+'|'+String(currentGroupId||'');
  if(inflight634&&inflight634.key===key)return inflight634.promise;
  const p=(async()=>{const r=await baseLoadState634.apply(this,args);if(ready634())hideLogin634();renderGlobalVersion634();return r})();
  inflight634={key,promise:p};
  try{return await p}finally{if(inflight634?.promise===p)inflight634=null}
 };
 window.loadState=loadState;
}catch{}

async function syncSession634(reason='startup'){
 if(sessionBusy634)return false;
 if(!token634()){if(reason==='startup')showLogin634();return false}
 hideLogin634();sessionBusy634=true;
 try{
  let last=null;const waits=reason==='startup'?[0,220,650]:[0];
  for(const wait of waits){
   if(wait)await sleep634(wait);
   try{await loadState(true);if(ready634()){hideLogin634();renderGlobalVersion634();startupRetry634=0;return true}}catch(e){last=e;if(!token634())break}
  }
  if(!token634()){if(!reloginBusy)showLogin634();return false}
  if(ready634()){hideLogin634();renderGlobalVersion634();return true}
  if(reason==='startup'&&startupRetry634<2){startupRetry634++;setTimeout(()=>syncSession634('startup'),700*startupRetry634)}
  if(last)console.warn('KokMatch v6.34 session restore pending',reason,last);
  return false;
 }finally{sessionBusy634=false}
}
function scheduleSession634(reason,delay=120){clearTimeout(resumeTimer634);resumeTimer634=setTimeout(()=>{if(document.hidden)return;if(token634()){hideLogin634();syncSession634(reason)}},delay)}
try{const baseSubmit634=submitLogin;submitLogin=async function(...args){const r=await baseSubmit634.apply(this,args);if(token634())hideLogin634();if(ready634())renderGlobalVersion634();return r};window.submitLogin=submitLogin}catch{}
window.addEventListener('pageshow',()=>scheduleSession634('pageshow',100),{passive:true});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)scheduleSession634('visible',120)},{passive:true});
window.addEventListener('focus',()=>{if(!document.hidden)scheduleSession634('focus',160)},{passive:true});
window.__kokmatchSyncSession634=syncSession634;
armVersionObserver634();
queueMicrotask(()=>syncSession634('startup'));
})();
'''
js += coordinator
Path('app-v6.34.js').write_text(js, encoding='utf-8')

css = Path('app-v6.33.css').read_text(encoding='utf-8')
Path('app-v6.34.css').write_text(css + '\n/* v6.34 global version renderer uses existing settings card styles. */\n', encoding='utf-8')

idx = Path('index.html').read_text(encoding='utf-8')
idx = idx.replace('data-kokmatch-version="6.33"', 'data-kokmatch-version="6.34"')
idx = idx.replace('data-kokmatch-build="v6.33"', 'data-kokmatch-build="v6.34"')
idx = idx.replace('<title>콕매치 v6.33</title>', '<title>콕매치 v6.34</title>')
idx = idx.replace('/manifest.webmanifest?v=6.33', '/manifest.webmanifest?v=6.34')
idx = idx.replace('/icons/kokmatch-180.png?v=6.33', '/icons/kokmatch-180.png?v=6.34')
idx = idx.replace('/app-v6.33.css?v=6.33', '/app-v6.34.css?v=6.34')
idx = idx.replace("window.__kokmatchStandalone='6.33';", "window.__kokmatchStandalone='6.34';")
idx = idx.replace("window.__kokmatchVersionLock='6.33';", "window.__kokmatchVersionLock='6.34';")
idx = idx.replace("window.__kokmatchBuild='v6.33';", "window.__kokmatchBuild='v6.34';")
idx = idx.replace('/app-v6.33.js?v=6.33', '/app-v6.34.js?v=6.34')
old = """    let hiddenAt=0;
    document.addEventListener('visibilitychange',()=>{
      if(document.hidden){hiddenAt=Date.now();return;}
      if(hiddenAt&&Date.now()-hiddenAt>30000){const u=new URL(location.href);u.searchParams.set('_km',Date.now().toString(36));location.replace(u.pathname+u.search+u.hash)}
    });
    addEventListener('pageshow',e=>{if(e.persisted){const u=new URL(location.href);u.searchParams.set('_km',Date.now().toString(36));location.replace(u.pathname+u.search+u.hash)}});"""
if old not in idx:
    raise SystemExit('index resume reload anchor missing')
idx = idx.replace(old, "    window.__kokmatchEntryResumeMode='session-coordinator-v634';", 1)
Path('index.html').write_text(idx, encoding='utf-8')

latest = {
    'version': 74,
    'label': 'v6.34',
    'semanticVersion': '6.34',
    'build': 'v6.34',
    'updatedAt': '2026-09-03T12:05:00+09:00',
    'note': 'v6.34 전역 버전표시 단일화 · 초기 세션복원 최종 렌더러 이후 실행 · 앱 복귀 강제 새로고침 제거 · 상태 렌더 직렬화'
}
Path('latest-version.json').write_text(json.dumps(latest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

manifest = Path('manifest.webmanifest').read_text(encoding='utf-8').replace('kmv=6.33', 'kmv=6.34')
Path('manifest.webmanifest').write_text(manifest, encoding='utf-8')

sw = Path('kokmatch-sw.js').read_text(encoding='utf-8')
if "KOKMATCH_SW_VERSION='6.33'" not in sw:
    raise SystemExit('service worker version anchor missing')
Path('kokmatch-sw.js').write_text(sw.replace("KOKMATCH_SW_VERSION='6.33'", "KOKMATCH_SW_VERSION='6.34'", 1), encoding='utf-8')
Path('sw.js').write_text("/* Stable compatibility entry for older KokMatch installations. */\nimportScripts('/kokmatch-sw.js?v=6.34');\n", encoding='utf-8')

Path('diag-v634.txt').unlink(missing_ok=True)
print('BUILT v6.34')
