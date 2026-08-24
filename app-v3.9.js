(()=>{
const VER39='3.9';
const RETURN_KEY39='kokmatch_update_return_v39';
const AUTO_KEY39='kokmatch_auto_update_target_v39';
let latest39=VER39,latestCheckedAt39=0,latestBusy39=null,autoScheduled39=false,refreshBusy39=false;

function vcmp39(a,b){
 const A=String(a||'0').replace(/^v/i,'').split('.').map(n=>Number(n)||0),B=String(b||'0').replace(/^v/i,'').split('.').map(n=>Number(n)||0);
 for(let i=0;i<Math.max(A.length,B.length);i++){const x=A[i]||0,y=B[i]||0;if(x!==y)return x>y?1:-1}return 0;
}
function injectTopStyle39(){
 if(document.getElementById('v39topStyle'))return;
 const s=document.createElement('style');s.id='v39topStyle';s.textContent=`
 .toprow{display:flex!important;align-items:flex-start!important;gap:6px!important;min-width:0!important}
 .toprow>div:first-child{flex:1 1 auto!important;min-width:0!important}
 #topActions37{display:none!important}
 .topActions39{margin-left:auto;display:flex;align-items:center;justify-content:flex-end;gap:4px;flex:0 1 auto;min-width:0;max-width:calc(100% - 92px)}
 .versionChip39{flex:0 0 auto;font-size:10px;font-weight:800;line-height:1;padding:6px 5px;border-radius:8px;background:rgba(255,255,255,.18);white-space:nowrap}
 #headerRefresh39{flex:0 1 auto;min-width:0;max-width:min(44vw,180px);padding:6px 8px;min-height:30px;font-size:10.5px;line-height:1.15;white-space:normal;overflow-wrap:anywhere;text-align:center}
 #headerRefresh39.update39{font-weight:900;box-shadow:0 0 0 2px rgba(255,255,255,.35) inset}
 .topActions39 .logout{flex:0 0 62px!important;width:62px!important;min-width:62px!important;max-width:62px!important;margin-left:0!important;white-space:nowrap!important;text-align:center!important;padding-left:4px!important;padding-right:4px!important}
 @media(max-width:380px){.topActions39{gap:3px;max-width:calc(100% - 78px)}.versionChip39{font-size:9px;padding:5px 4px}#headerRefresh39{font-size:9px;padding:5px 6px;max-width:38vw}.topActions39 .logout{flex-basis:56px!important;width:56px!important;min-width:56px!important;max-width:56px!important;font-size:10px!important}}
 `;document.head.appendChild(s);
}
function neutralizeLegacyTop39(){
 const row=document.querySelector('.toprow');if(!row)return null;
 const logout=row.querySelector('.logout');
 const old=document.getElementById('topActions37');
 if(old){if(logout&&old.contains(logout))row.appendChild(logout);old.remove()}
 let blocker=document.getElementById('topActions37');
 if(!blocker){blocker=document.createElement('span');blocker.id='topActions37';blocker.style.display='none';row.appendChild(blocker)}
 return {row,logout};
}
function updateTop39(){
 const b=document.getElementById('headerRefresh39'),v=document.getElementById('currentVersion39');if(v)v.textContent=`v${VER39}`;if(!b)return;
 const newer=vcmp39(latest39,VER39)>0;
 b.classList.toggle('update39',newer);
 b.textContent=refreshBusy39?'불러오는 중…':newer?`v${latest39} 업데이트 · 새로고침`:'↻ 새로고침';
 b.title=newer?`최신버전 v${latest39}이 있습니다. 눌러 새로고침하세요.`:'현재 버전을 안전하게 다시 불러옵니다.';
}
function ensureTopActions39(){
 injectTopStyle39();const x=neutralizeLegacyTop39();if(!x?.row||!x.logout)return;
 let a=document.getElementById('topActions39');
 if(!a){a=document.createElement('div');a.id='topActions39';a.className='topActions39';a.innerHTML=`<span id="currentVersion39" class="versionChip39">v${VER39}</span><button id="headerRefresh39" class="btn ghost" type="button" onclick="refreshApp39()">↻ 새로고침</button>`;x.row.appendChild(a)}
 if(!a.contains(x.logout))a.appendChild(x.logout);
 updateTop39();
}
async function checkLatest39(force=false){
 const now=Date.now();if(!force&&latestCheckedAt39&&now-latestCheckedAt39<15000)return latest39;if(latestBusy39)return latestBusy39;
 latestBusy39=(async()=>{try{const r=await fetch('/latest-version.json?t='+now,{cache:'no-store'});if(r.ok){const x=await r.json();latest39=String(x.semanticVersion||x.label||VER39).replace(/^v/i,'')||VER39;latestCheckedAt39=Date.now();updateTop39()}return latest39}catch{return latest39}finally{latestBusy39=null}})();
 return latestBusy39;
}
function saveReturn39(){try{sessionStorage.setItem(RETURN_KEY39,JSON.stringify({view:currentView||'members',groupId:currentGroupId||'',y:Math.max(0,window.scrollY||0),at:Date.now()}))}catch{}}
function restoreReturn39(){
 let x=null;try{x=JSON.parse(sessionStorage.getItem(RETURN_KEY39)||'null')}catch{}if(!x||Date.now()-Number(x.at||0)>120000)return false;
 try{sessionStorage.removeItem(RETURN_KEY39)}catch{}
 if(x.groupId&&x.groupId!==currentGroupId){localStorage.setItem(GROUP_KEY,x.groupId);currentGroupId=x.groupId}
 const view=String(x.view||'members');setTimeout(()=>{try{goView(view);window.scrollTo(0,Number(x.y)||0)}catch{}},80);return true;
}
async function indexHasVersion39(target){
 try{const r=await fetch('/?update_probe='+Date.now(),{cache:'no-store'});if(!r.ok)return false;const t=await r.text();return t.includes(`/app-v${target}.js?v=${target}`)||t.includes(`콕매치 v${target}`)}catch{return false}
}
window.refreshApp39=async function(targetVersion=''){
 if(refreshBusy39)return;refreshBusy39=true;ensureTopActions39();updateTop39();
 try{
  const target=String(targetVersion||await checkLatest39(true)||VER39).replace(/^v/i,'');
  if(!(await indexHasVersion39(target))){throw new Error(`v${target} 배포가 아직 준비되지 않았습니다. 잠시 후 다시 눌러주세요.`)}
  saveReturn39();
  const url='/?v='+encodeURIComponent(target)+'&update='+Date.now();
  location.replace(url);
 }catch(e){refreshBusy39=false;updateTop39();if(typeof showError==='function')showError(e);else alert(e?.message||'새로고침에 실패했습니다.')}
};
async function maybeAutoUpdate39(){
 if(!T||!me)return;const target=await checkLatest39(true);if(vcmp39(target,VER39)<=0)return;
 let done='';try{done=sessionStorage.getItem(AUTO_KEY39)||''}catch{}if(done===target)return;
 if(!(await indexHasVersion39(target)))return;
 try{sessionStorage.setItem(AUTO_KEY39,target)}catch{}
 setTimeout(()=>refreshApp39(target),120);
}
function scheduleAuto39(){if(autoScheduled39)return;autoScheduled39=true;setTimeout(()=>{autoScheduled39=false;maybeAutoUpdate39().catch(()=>{})},250)}

const renderHeaderPrev39=renderHeader;
renderHeader=function(){const r=renderHeaderPrev39();ensureTopActions39();return r};
const loadStatePrev39=loadState;
loadState=async function(...args){const r=await loadStatePrev39(...args);ensureTopActions39();if(T&&me){restoreReturn39();scheduleAuto39()}return r};

setInterval(()=>{checkLatest39(true).catch(()=>{})},60000);
setTimeout(()=>{ensureTopActions39();checkLatest39(true).then(()=>{if(T&&me)scheduleAuto39()}).catch(()=>{})},0);
})();
