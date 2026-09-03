from pathlib import Path
import json

src=Path('app-v6.34.js').read_text(encoding='utf-8')
js=src
repls=[
    ("window.__kokmatchStandalone='6.34';","window.__kokmatchStandalone='6.35';"),
    ("window.__kokmatchVersionLock='6.34';","window.__kokmatchVersionLock='6.35';"),
    ("sessionStorage.setItem('kokmatch_runtime_version','6.34')","sessionStorage.setItem('kokmatch_runtime_version','6.35')"),
    ("const CURRENT633='6.34';","const CURRENT633='6.35';"),
    ("const BUILD634=Object.freeze({version:'6.34',label:'콕매치 v6.34 · 최신 운영본'});","const BUILD634=Object.freeze({version:'6.35',label:'콕매치 v6.35 · 최신 운영본'});")
]
for old,new in repls:
    if old not in js: raise SystemExit(f'missing patch target: {old}')
    js=js.replace(old,new,1)

js += r'''

/* KokMatch v6.35: canonical top version + developer global forced update */
(()=>{
'use strict';
if(window.__kokmatchGlobalUpdate635)return;
window.__kokmatchGlobalUpdate635=true;
const BUILD635='6.35';
const ADMIN_REFRESH635='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-admin-refresh';
let topSync635=false;
function ensureTopVersion635(){
 if(topSync635)return;
 topSync635=true;
 try{
  const top=document.querySelector('.top');
  if(!top)return;
  const brand=top.querySelector('.brand');
  if(!brand)return;
  let badge=top.querySelector('#kokmatchTopVersion635');
  if(!badge){badge=document.createElement('span');badge.id='kokmatchTopVersion635';badge.className='kmTopVersion635';brand.appendChild(badge)}
  if(badge.textContent!=='v'+BUILD635)badge.textContent='v'+BUILD635;
  const walker=document.createTreeWalker(top,NodeFilter.SHOW_TEXT);const stale=[];let n=null;
  while((n=walker.nextNode())){
   if(badge.contains(n))continue;
   const t=String(n.nodeValue||'').trim();
   if(/^(?:버전\s*)?v\d+\.\d+$/.test(t))stale.push(n);
  }
  for(const node of stale)node.nodeValue='';
 }catch(e){console.warn('KokMatch v6.35 top version',e)}finally{topSync635=false}
}
window.__kokmatchEnsureTopVersion635=ensureTopVersion635;
function armTop635(){}
try{const baseHeader635=renderHeader;renderHeader=function(...args){const r=baseHeader635.apply(this,args);ensureTopVersion635();return r};window.renderHeader=renderHeader}catch{}
try{const baseAll635=renderAll;renderAll=function(...args){const r=baseAll635.apply(this,args);ensureTopVersion635();return r};window.renderAll=renderAll}catch{}

async function latest635(){
 try{const r=await fetch('/latest-version.json?km635='+Date.now(),{cache:'no-store',headers:{'cache-control':'no-cache'}});if(!r.ok)throw new Error('version '+r.status);const x=await r.json();return String(x?.semanticVersion||x?.label||BUILD635).replace(/^v/i,'')||BUILD635}catch{return BUILD635}
}
async function globalRefresh635(target,callerToken){
 const token=String(callerToken||T||'');
 const r=await fetch(ADMIN_REFRESH635,{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+token},body:JSON.stringify({latestVersion:target}),cache:'no-store'});
 const x=await r.json().catch(()=>({}));
 if(!r.ok)throw new Error(x.error||'전체 이용자 최신화에 실패했습니다.');
 return x;
}
forceUpdateApp=async function(){
 const b=document.getElementById('forceUpdateBtn');
 const isGlobalAdmin=!!me?.globalAdmin;
 const callerToken=String(T||'');
 if(b){b.disabled=true;b.textContent=isGlobalAdmin?'전체 이용자 로그아웃·최신화 중...':'최신 운영본 확인 중...'}
 try{
  const target=await latest635();
  let result=null;
  if(isGlobalAdmin){
   if(!callerToken)throw new Error('개발자 로그인 세션을 확인할 수 없습니다. 다시 로그인해주세요.');
   if(!confirm('접속 중인 다른 모든 이용자를 로그아웃하고 최신 앱 버전으로 다시 접속시키겠습니까?')){if(b){b.disabled=false;b.textContent='↻ 최신 버전으로 새로고침'};return}
   result=await globalRefresh635(target,callerToken);
   try{sessionStorage.setItem('kokmatch_last_global_refresh635',JSON.stringify({at:Date.now(),count:Number(result?.loggedOutSessions)||0,target}))}catch{}
  }
  if(typeof window.__kokmatchHardReload633==='function')return window.__kokmatchHardReload633(target,isGlobalAdmin?'admin-global-refresh':'manual-refresh');
  location.replace('/?kmv='+encodeURIComponent(target)+'&r='+Date.now().toString(36));
 }catch(e){
  if(b){b.disabled=false;b.textContent='↻ 최신 버전으로 새로고침'}
  try{showError(e)}catch{alert(e?.message||String(e))}
 }
};
window.forceUpdateApp=forceUpdateApp;

queueMicrotask(()=>ensureTopVersion635());
window.addEventListener('pageshow',()=>setTimeout(ensureTopVersion635,80),{passive:true});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(ensureTopVersion635,100)},{passive:true});
setTimeout(ensureTopVersion635,400);
})();
'''
Path('app-v6.35.js').write_text(js,encoding='utf-8')

css=Path('app-v6.34.css').read_text(encoding='utf-8')
css += "\n/* v6.35 canonical top version */\n.kmTopVersion635{display:inline-flex;align-items:center;margin-left:7px;padding:2px 7px;border:1px solid #ffffff55;border-radius:999px;background:#ffffff18;color:#fff;font-size:10px;font-weight:900;line-height:1.4;vertical-align:2px;white-space:nowrap}\n"
Path('app-v6.35.css').write_text(css,encoding='utf-8')

idx=Path('index.html').read_text(encoding='utf-8')
idx=idx.replace('6.34','6.35').replace('app-v6.34.css','app-v6.35.css').replace('app-v6.34.js','app-v6.35.js')
Path('index.html').write_text(idx,encoding='utf-8')

latest={
 'version':75,'label':'v6.35','semanticVersion':'6.35','build':'v6.35',
 'updatedAt':'2026-09-03T13:10:00+09:00',
 'note':'v6.35 개발자 전체 세션 강제종료 최신화 · 전 역할 최상단 버전 단일표시 · 구형 v6.20 상단표시 제거'
}
Path('latest-version.json').write_text(json.dumps(latest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

mf=Path('manifest.webmanifest').read_text(encoding='utf-8').replace('kmv=6.34','kmv=6.35')
Path('manifest.webmanifest').write_text(mf,encoding='utf-8')
sw=Path('kokmatch-sw.js').read_text(encoding='utf-8').replace("KOKMATCH_SW_VERSION='6.34'","KOKMATCH_SW_VERSION='6.35'",1)
Path('kokmatch-sw.js').write_text(sw,encoding='utf-8')
Path('sw.js').write_text("/* Stable compatibility entry for older KokMatch installations. */\nimportScripts('/kokmatch-sw.js?v=6.35');\n",encoding='utf-8')
