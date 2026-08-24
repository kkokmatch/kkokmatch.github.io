(()=>{
const VER40='4.0';
const AUTO40='kokmatch_auto_update_target_v40';
let latest40=VER40,latestAt40=0,latestBusy40=null,refreshBusy40=false,autoTimer40=0;
let memberForce40=true,memberRendering40=false,lastMemberSig40='',memberDeferred40=0,lastMemberScroll40=0;

function cmp40(a,b){const A=String(a||'0').replace(/^v/i,'').split('.').map(n=>Number(n)||0),B=String(b||'0').replace(/^v/i,'').split('.').map(n=>Number(n)||0);for(let i=0;i<Math.max(A.length,B.length);i++){const x=A[i]||0,y=B[i]||0;if(x!==y)return x>y?1:-1}return 0}
function injectStyle40(){if(document.getElementById('v40style'))return;const s=document.createElement('style');s.id='v40style';s.textContent=`
 #topActions37,#topActions39{display:none!important}
 .toprow{display:flex!important;align-items:flex-start!important;gap:6px!important;min-width:0!important}
 .toprow>div:first-child{flex:1 1 auto!important;min-width:0!important}
 #topActions40{margin-left:auto;display:flex;align-items:center;justify-content:flex-end;gap:4px;flex:0 1 auto;min-width:0;position:relative;z-index:40;pointer-events:auto;touch-action:manipulation}
 #currentVersion40{flex:0 0 auto;font-size:10px;font-weight:900;line-height:1;padding:6px 5px;border-radius:8px;background:rgba(255,255,255,.18);white-space:nowrap}
 #headerRefresh40{flex:0 1 auto;min-width:0;max-width:170px;min-height:30px;padding:6px 8px;font-size:10.5px;font-weight:800;line-height:1.15;white-space:normal;overflow-wrap:anywhere;text-align:center;touch-action:manipulation}
 #headerRefresh40.update40{box-shadow:0 0 0 2px rgba(255,255,255,.38) inset}
 #logout40{flex:0 0 64px;width:64px;min-width:64px;max-width:64px;min-height:30px;padding:6px 4px;font-size:11px;white-space:nowrap;text-align:center;touch-action:manipulation}
 .toprow>.logout,.topActions39 .logout{display:none!important}
 @media(max-width:420px){#topActions40{gap:3px}#currentVersion40{font-size:9px;padding:5px 4px}#headerRefresh40{max-width:145px;font-size:9.5px;padding:5px 6px}#logout40{flex-basis:58px;width:58px;min-width:58px;max-width:58px;font-size:10px}}
 @media(max-width:360px){#currentVersion40{display:none}#headerRefresh40{max-width:132px}#logout40{flex-basis:56px;width:56px;min-width:56px;max-width:56px}}
 `;document.head.appendChild(s)}
function updateTop40(){const v=document.getElementById('currentVersion40'),b=document.getElementById('headerRefresh40');if(v)v.textContent=`v${VER40}`;if(!b)return;const newer=cmp40(latest40,VER40)>0;b.classList.toggle('update40',newer);b.textContent=refreshBusy40?'불러오는 중…':newer?`v${latest40} 업데이트 · 새로고침`:'↻ 새로고침';b.title=newer?`최신버전 v${latest40}이 있습니다. 새로고침하면 로그인 상태를 유지한 채 업데이트합니다.`:'현재 버전을 안전하게 다시 불러옵니다.'}
function ensureTop40(){injectStyle40();const row=document.querySelector('.toprow');if(!row)return;let a=document.getElementById('topActions40');if(!a){a=document.createElement('div');a.id='topActions40';a.innerHTML=`<span id="currentVersion40">v${VER40}</span><button id="headerRefresh40" class="btn ghost" type="button">↻ 새로고침</button><button id="logout40" class="logout40" type="button">로그아웃</button>`;row.appendChild(a);a.querySelector('#headerRefresh40')?.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();refreshApp40()});a.querySelector('#logout40')?.addEventListener('click',async e=>{e.preventDefault();e.stopPropagation();if(e.currentTarget)e.currentTarget.disabled=true;try{await logout()}catch(err){if(e.currentTarget)e.currentTarget.disabled=false;showError(err)}})}updateTop40()}
async function latestVersion40(force=false){const now=Date.now();if(!force&&latestAt40&&now-latestAt40<15000)return latest40;if(latestBusy40)return latestBusy40;latestBusy40=(async()=>{try{const r=await fetch('/latest-version.json?t='+now,{cache:'no-store'});if(r.ok){const x=await r.json();latest40=String(x.semanticVersion||x.label||VER40).replace(/^v/i,'')||VER40;latestAt40=Date.now();updateTop40()}return latest40}catch{return latest40}finally{latestBusy40=null}})();return latestBusy40}
async function deployed40(v){try{const r=await fetch('/?probe40='+Date.now(),{cache:'no-store'});if(!r.ok)return false;const t=await r.text();return t.includes(`/app-v${v}.js?v=${v}`)||t.includes(`콕매치 v${v}`)}catch{return false}}
window.refreshApp40=async function(target=''){if(refreshBusy40)return;refreshBusy40=true;ensureTop40();updateTop40();try{const v=String(target||await latestVersion40(true)||VER40).replace(/^v/i,'');if(!(await deployed40(v)))throw new Error(`v${v} 배포가 아직 준비되지 않았습니다. 잠시 후 다시 눌러주세요.`);try{if(typeof saveRefreshState==='function')saveRefreshState()}catch{}location.replace('/?v='+encodeURIComponent(v)+'&refresh='+Date.now())}catch(e){refreshBusy40=false;updateTop40();if(typeof showError==='function')showError(e);else alert(e?.message||'새로고침에 실패했습니다.')}};
/* v3.9 may still schedule its updater. Route it through the safe v4.0 path and mark v4.0 as already current. */
try{sessionStorage.setItem('kokmatch_auto_update_target_v39',VER40)}catch{}
window.refreshApp39=window.refreshApp40;
window.refreshApp37=window.refreshApp40;
async function autoUpdate40(){if(!T||!me)return;const v=await latestVersion40(true);if(cmp40(v,VER40)<=0)return;let done='';try{done=sessionStorage.getItem(AUTO40)||''}catch{}if(done===v)return;if(!(await deployed40(v)))return;try{sessionStorage.setItem(AUTO40,v)}catch{}refreshApp40(v)}
function scheduleAuto40(){clearTimeout(autoTimer40);autoTimer40=setTimeout(()=>autoUpdate40().catch(()=>{}),450)}

function memberSig40(){try{return JSON.stringify([currentGroupId,me?.role,me?.globalAdmin,(S?.members||[]).map(m=>[m.id,m.name,m.year,m.gender,m.cls,m.type,m.role,m.state,m.totalGames,m.joinedAt,m.inviter,m.tempOrganizerDay]),S?.queue||[],(S?.pendingGames||[]).map(g=>[g.id,g.players]),(S?.games||[]).map(g=>[g.id,g.court,g.players]),(S?.history||[]).length])}catch{return String(Date.now())}}
function memberIsMoving40(){return currentView==='members'&&Date.now()-lastMemberScroll40<160}
window.addEventListener('scroll',()=>{if(currentView==='members')lastMemberScroll40=Date.now()},{passive:true});
document.addEventListener('touchmove',()=>{if(currentView==='members')lastMemberScroll40=Date.now()},{passive:true,capture:true});
const renderMembersPrev40=renderMembers;
renderMembers=function(){if(memberRendering40)return;const box=$('members'),sig=memberSig40(),has=!!box?.children?.length,force=memberForce40;memberForce40=false;if(!force&&has&&sig===lastMemberSig40)return;if(has&&memberIsMoving40()){clearTimeout(memberDeferred40);memberDeferred40=setTimeout(()=>{memberForce40=true;renderMembers()},190);return}memberRendering40=true;try{renderMembersPrev40();lastMemberSig40=sig}finally{memberRendering40=false}};
function forceMemberNext40(){memberForce40=true;lastMemberSig40=''}
if(typeof window.memberPageGo46==='function'){const p=window.memberPageGo46;window.memberPageGo46=function(...a){forceMemberNext40();return p.apply(this,a)}}
if(typeof window.searchMembers46==='function'){const s=window.searchMembers46;window.searchMembers46=function(...a){forceMemberNext40();return s.apply(this,a)}}
if(typeof window.refreshMembers46==='function'){const r=window.refreshMembers46;window.refreshMembers46=function(...a){forceMemberNext40();return r.apply(this,a)}}

const renderHeaderPrev40=renderHeader;
renderHeader=function(){const r=renderHeaderPrev40();ensureTop40();return r};
const loadStatePrev40=loadState;
loadState=async function(...args){const r=await loadStatePrev40(...args);ensureTop40();if(T&&me)scheduleAuto40();return r};
const goViewPrev40=goView;
goView=function(id){const prev=currentView;if(String(id)==='members'&&prev!=='members')forceMemberNext40();return goViewPrev40(id)};

setInterval(()=>latestVersion40(true).catch(()=>{}),60000);
setTimeout(()=>{ensureTop40();latestVersion40(true).then(()=>{if(T&&me)scheduleAuto40()}).catch(()=>{})},0);
})();
