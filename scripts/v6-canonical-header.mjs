import fs from 'node:fs';

const file='app-v6.0.js';
let src=fs.readFileSync(file,'utf8');
if(!src.includes("window.__kokmatchInteractionCore='6.0'"))throw new Error('v6 canonical interaction core must be installed first');
if(src.includes('function normalizeHeaderV6(')){console.log('v6 header already canonical');process.exit(0)}

const constAnchor="const pageFnV6=typeof window.memberPageGo46==='function'?window.memberPageGo46:null;";
if(!src.includes(constAnchor))throw new Error('v6 core const anchor not found');
src=src.replace(constAnchor,constAnchor+"\nconst legacyLogoutV6=typeof logout==='function'?logout:null;");

const helperAnchor='function memberControlHtmlV6(m){';
const pos=src.indexOf(helperAnchor);
if(pos<0)throw new Error('v6 member controls anchor not found');
const helper=String.raw`
function installHeaderStyleV6(){
 if(document.getElementById('kokmatchHeaderStyleV6'))return;
 const s=document.createElement('style');s.id='kokmatchHeaderStyleV6';s.textContent='.toprow>#topActions50,.toprow>#topActions51,.toprow>#topActions52,.toprow>.logout{display:none!important}#topActionsV6{margin-left:auto;display:flex;align-items:center;justify-content:flex-end;gap:5px;position:relative;z-index:300;pointer-events:auto;min-width:0}#currentVersionV6{font-size:10px;font-weight:900;padding:6px 5px;border-radius:8px;background:rgba(255,255,255,.18);white-space:nowrap;flex:0 0 auto}#headerRefreshV6,#logoutV6{min-height:30px;padding:6px 8px;font-size:10.5px;font-weight:850;white-space:nowrap}#logoutV6{flex:0 0 64px}@media(max-width:380px){#currentVersionV6{display:none}#headerRefreshV6{max-width:120px;font-size:9.5px}#logoutV6{flex-basis:56px;width:56px;padding:6px 4px}}';document.head.appendChild(s)
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
 if(!actions){actions=document.createElement('div');actions.id='topActionsV6';actions.innerHTML='<span id="currentVersionV6">v6.0</span><button id="headerRefreshV6" class="btn ghost" type="button">↻ 새로고침</button><button id="logoutV6" type="button">로그아웃</button>';row.appendChild(actions);actions.querySelector('#headerRefreshV6')?.addEventListener('click',ev=>{ev.preventDefault();try{typeof saveRefreshState==='function'&&saveRefreshState()}catch{};location.reload()});actions.querySelector('#logoutV6')?.addEventListener('click',ev=>{ev.preventDefault();ev.stopPropagation();explicitLogoutV6()})}
 const ver=actions.querySelector('#currentVersionV6');if(ver)ver.textContent='v6.0';
 document.title='콕매치 v6.0';document.documentElement.dataset.kokmatchVersion='6.0';
}
`;
src=src.slice(0,pos)+helper+'\n'+src.slice(pos);

const old="try{const f=renderHeader;renderHeader=function(...a){const r=f.apply(this,a);laterV6();return r};window.renderHeader=renderHeader}catch{}";
const next="try{const f=renderHeader;renderHeader=function(...a){const r=f.apply(this,a);normalizeHeaderV6();laterV6();return r};window.renderHeader=renderHeader}catch{}";
if(!src.includes(old))throw new Error('v6 renderHeader wrapper not found');
src=src.replace(old,next);
const startup="if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',laterV6,{once:true});else laterV6();";
const startupNext="if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{normalizeHeaderV6();laterV6()},{once:true});else{normalizeHeaderV6();laterV6()}";
if(!src.includes(startup))throw new Error('v6 startup anchor not found');
src=src.replace(startup,startupNext);

fs.writeFileSync(file,src);
console.log('Moved runtime header/refresh/logout ownership into v6 canonical source.');
