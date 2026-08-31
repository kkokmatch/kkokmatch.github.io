import fs from 'node:fs';

const file='app-v6.0.js';
let src=fs.readFileSync(file,'utf8');
if(!src.includes("window.__kokmatchInteractionCore='6.0'"))throw new Error('v6 canonical interaction core must be installed first');

const constAnchor="const pageFnV6=typeof window.memberPageGo46==='function'?window.memberPageGo46:null;";
if(!src.includes('const legacyLogoutV6=')&&src.includes(constAnchor))src=src.replace(constAnchor,constAnchor+"\nconst legacyLogoutV6=typeof logout==='function'?logout:null;");

const helper=String.raw`
function installHeaderStyleV6(){
 let s=document.getElementById('kokmatchHeaderStyleV6');if(!s){s=document.createElement('style');s.id='kokmatchHeaderStyleV6';document.head.appendChild(s)}
 s.textContent='.toprow{gap:6px!important}.toprow>div:first-child{min-width:0;flex:1 1 auto}.toprow>#topActions50,.toprow>#topActions51,.toprow>#topActions52,.toprow>.logout{display:none!important}#topActionsV6{margin-left:auto;display:flex;align-items:center;justify-content:flex-end;gap:4px;position:relative;z-index:300;pointer-events:auto;min-width:0;flex:0 0 auto}#currentVersionV6{font-size:9.5px;font-weight:900;padding:5px 5px;border-radius:8px;background:rgba(255,255,255,.18);white-space:nowrap;flex:0 0 auto;letter-spacing:-.2px}#headerRefreshV6,#logoutV6{min-height:30px;padding:6px 7px;font-size:9.7px;font-weight:850;white-space:nowrap;border-radius:8px}#headerRefreshV6{max-width:128px}#logoutV6{flex:0 0 58px}@media(max-width:390px){#topActionsV6{gap:3px}#currentVersionV6{font-size:8.3px;padding:5px 3px}#headerRefreshV6{font-size:8.4px;padding:6px 4px;max-width:108px}#logoutV6{flex-basis:52px;width:52px;font-size:9px;padding:6px 3px}}';
}
function buildLabelV6(){
 const raw=String(window.__kokmatchBuild||document.documentElement.dataset.kokmatchBuild||'2026.08.31.standalone.10');
 const m=raw.match(/standalone\.\d+/i);return m?m[0]:raw;
}
async function forceLatestHeaderRefreshV6(){
 if(window.__kokmatchHeaderRefreshBusyV6)return false;window.__kokmatchHeaderRefreshBusyV6=true;
 const b=document.getElementById('headerRefreshV6');if(b){b.disabled=true;b.textContent='업데이트 중...'}
 try{
  try{typeof saveRefreshState==='function'&&saveRefreshState()}catch{}
  try{if('caches'in window){const ks=await caches.keys();await Promise.all(ks.map(k=>caches.delete(k)))}}catch{}
  try{if('serviceWorker'in navigator){const rs=await navigator.serviceWorker.getRegistrations();await Promise.all(rs.map(r=>r.unregister().catch(()=>{})))}}catch{}
  try{await fetch('https://kkokmatch.github.io/index.html?_probe='+Date.now(),{cache:'no-store',headers:{'cache-control':'no-cache'}})}catch{}
  const u=new URL('https://kkokmatch.github.io/');u.searchParams.set('_km',Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8));u.searchParams.set('_force','1');location.replace(u.href);return true;
 }finally{setTimeout(()=>{window.__kokmatchHeaderRefreshBusyV6=false;if(b){b.disabled=false;b.textContent='↻ 최신버전으로 새로고침'}},1200)}
}
async function explicitLogoutV6(){
 if(window.__kokmatchLogoutBusyV6)return false;window.__kokmatchLogoutBusyV6=true;
 try{if(typeof legacyLogoutV6==='function'){await legacyLogoutV6();return true}try{localStorage.removeItem('kokmatch_token')}catch{};location.replace('/');return true}
 finally{setTimeout(()=>{window.__kokmatchLogoutBusyV6=false},500)}
}
function blockLegacyLogoutV6(){
 const guard=function(){console.warn('콕매치 v6: 구형 로그아웃 호출 차단');return false};
 guard.__kokmatchV6Guard=true;
 try{logout=guard}catch{};try{window.logout=guard}catch{}
}
function normalizeHeaderV6(){
 installHeaderStyleV6();blockLegacyLogoutV6();
 const row=document.querySelector('.toprow');if(!row)return;
 row.querySelectorAll('#topActions50,#topActions51,#topActions52,:scope > .logout').forEach(el=>el.remove());
 let actions=document.getElementById('topActionsV6');
 if(!actions){actions=document.createElement('div');actions.id='topActionsV6';actions.innerHTML='<span id="currentVersionV6" title="현재 실행 버전">standalone.10</span><button id="headerRefreshV6" class="btn ghost" type="button">↻ 최신버전으로 새로고침</button><button id="logoutV6" type="button">로그아웃</button>';row.appendChild(actions);actions.querySelector('#headerRefreshV6')?.addEventListener('click',ev=>{ev.preventDefault();ev.stopPropagation();forceLatestHeaderRefreshV6()});actions.querySelector('#logoutV6')?.addEventListener('click',ev=>{ev.preventDefault();ev.stopPropagation();explicitLogoutV6()})}
 const ver=actions.querySelector('#currentVersionV6');if(ver){ver.textContent=buildLabelV6();ver.title='현재 실행 버전: '+String(window.__kokmatchBuild||buildLabelV6())+'\n실행 주소: '+location.href}
 document.title='콕매치 v6.0 · '+buildLabelV6();document.documentElement.dataset.kokmatchVersion='6.0';
}
`;

const helperAnchor='function memberControlHtmlV6(m){';
const helperPos=src.indexOf(helperAnchor);
if(helperPos<0)throw new Error('v6 member controls anchor not found');

const existingStart=src.indexOf('function installHeaderStyleV6(){');
if(existingStart>=0){
 const existingEnd=src.indexOf(helperAnchor,existingStart);
 if(existingEnd<0)throw new Error('existing v6 header section end not found');
 src=src.slice(0,existingStart)+helper+'\n'+src.slice(existingEnd);
}else{
 src=src.slice(0,helperPos)+helper+'\n'+src.slice(helperPos);
}

const old="try{const f=renderHeader;renderHeader=function(...a){const r=f.apply(this,a);laterV6();return r};window.renderHeader=renderHeader}catch{}";
const next="try{const f=renderHeader;renderHeader=function(...a){const r=f.apply(this,a);normalizeHeaderV6();laterV6();return r};window.renderHeader=renderHeader}catch{}";
if(src.includes(old))src=src.replace(old,next);
if(!src.includes('normalizeHeaderV6();laterV6()'))throw new Error('v6 renderHeader wrapper not canonical');

const startup="if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',laterV6,{once:true});else laterV6();";
const startupNext="if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{normalizeHeaderV6();laterV6()},{once:true});else{normalizeHeaderV6();laterV6()}";
if(src.includes(startup))src=src.replace(startup,startupNext);

fs.writeFileSync(file,src);
console.log('Canonical v6 header updated with visible build label and forced latest refresh.');
