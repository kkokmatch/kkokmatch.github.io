(()=>{
const CUR46='4.6';
let latest46=CUR46,refreshBusy46=false;
let memberForce46=true,memberRendering46=false,lastMemberSig46='',memberDeferred46=0,lastMemberScroll46=0;

function markLegacy46(v=CUR46){try{sessionStorage.setItem('kokmatch_auto_update_target_v39',v);sessionStorage.setItem('kokmatch_auto_update_target_v40',v)}catch{}}
markLegacy46(CUR46);

function cmp46(a,b){const A=String(a||'0').replace(/^v/i,'').split('.').map(n=>Number(n)||0),B=String(b||'0').replace(/^v/i,'').split('.').map(n=>Number(n)||0);for(let i=0;i<Math.max(A.length,B.length);i++){const x=A[i]||0,y=B[i]||0;if(x!==y)return x>y?1:-1}return 0}
function styleTop46(){if(document.getElementById('v46topStyle'))return;const s=document.createElement('style');s.id='v46topStyle';s.textContent=`
#topActions37,#topActions39,#topActions40,#topActions41,#topActions42,#topActions43,#topActions44,#topActions45{display:none!important}
#topActions46{margin-left:auto;display:flex;align-items:center;justify-content:flex-end;gap:4px;position:relative;z-index:100;pointer-events:auto;min-width:0}
#currentVersion46top{font-size:10px;font-weight:900;padding:6px 5px;border-radius:8px;background:rgba(255,255,255,.18);white-space:nowrap;flex:0 0 auto}
#headerRefresh46{flex:0 1 auto;min-width:0;max-width:170px;min-height:30px;padding:6px 8px;font-size:10.5px;font-weight:800;line-height:1.15;white-space:normal;overflow-wrap:anywhere}
#logout46top{flex:0 0 64px;width:64px;min-width:64px;max-width:64px;min-height:30px;padding:6px 4px;font-size:11px;white-space:nowrap}
.toprow>.logout{display:none!important}
@media(max-width:380px){#currentVersion46top{display:none}#headerRefresh46{max-width:135px;font-size:9.5px}#logout46top{flex-basis:56px;width:56px;min-width:56px;max-width:56px;font-size:10px}}
`;document.head.appendChild(s)}
function updateTop46(){const v=document.getElementById('currentVersion46top'),b=document.getElementById('headerRefresh46');if(v)v.textContent='v'+CUR46;if(!b)return;const newer=cmp46(latest46,CUR46)>0;b.textContent=refreshBusy46?'불러오는 중…':newer?`v${latest46} 업데이트 · 새로고침`:'↻ 새로고침';b.title=newer?`최신버전 v${latest46}이 있습니다. 눌러서 업데이트하세요.`:'현재 페이지를 안전하게 다시 불러옵니다.'}
function ensureTop46(){styleTop46();const row=document.querySelector('.toprow');if(!row)return;let a=document.getElementById('topActions46');if(!a){a=document.createElement('div');a.id='topActions46';a.innerHTML='<span id="currentVersion46top">v4.6</span><button id="headerRefresh46" class="btn ghost" type="button">↻ 새로고침</button><button id="logout46top" type="button">로그아웃</button>';row.appendChild(a);a.querySelector('#headerRefresh46')?.addEventListener('click',()=>refreshApp46());a.querySelector('#logout46top')?.addEventListener('click',()=>logout())}updateTop46()}
async function latestCheck46(){try{const r=await fetch('/latest-version.json?t='+Date.now(),{cache:'no-store'});if(r.ok){const x=await r.json();latest46=String(x.semanticVersion||x.label||CUR46).replace(/^v/i,'')||CUR46;markLegacy46(latest46)}}catch{}updateTop46();return latest46}
window.refreshApp46=async function(target=''){if(refreshBusy46)return;refreshBusy46=true;updateTop46();try{const v=String(target||await latestCheck46()||CUR46).replace(/^v/i,'');markLegacy46(v);try{if(typeof saveRefreshState==='function')saveRefreshState()}catch{}location.replace('/?v='+encodeURIComponent(v)+'&refresh='+Date.now())}catch(e){refreshBusy46=false;updateTop46();if(typeof showError==='function')showError(e);else alert(e?.message||'새로고침에 실패했습니다.')}};
window.refreshApp45=window.refreshApp46;window.refreshApp44=window.refreshApp46;window.refreshApp43=window.refreshApp46;window.refreshApp42=window.refreshApp46;window.refreshApp41=window.refreshApp46;window.refreshApp40=window.refreshApp46;window.refreshApp39=window.refreshApp46;window.refreshApp37=window.refreshApp46;

function memberSig46(){try{return JSON.stringify([currentGroupId,me?.role,me?.globalAdmin,(S?.members||[]).map(m=>[m.id,m.name,m.year,m.gender,m.cls,m.type,m.role,m.state,m.totalGames,m.joinedAt,m.inviter,m.tempOrganizerDay]),S?.queue||[],(S?.pendingGames||[]).map(g=>[g.id,g.players]),(S?.games||[]).map(g=>[g.id,g.court,g.players]),(S?.history||[]).length])}catch{return String(Date.now())}}
function memberIsMoving46(){return currentView==='members'&&Date.now()-lastMemberScroll46<160}
window.addEventListener('scroll',()=>{if(currentView==='members')lastMemberScroll46=Date.now()},{passive:true});
document.addEventListener('touchmove',()=>{if(currentView==='members')lastMemberScroll46=Date.now()},{passive:true,capture:true});
const renderMembersPrev46Safe=renderMembers;
renderMembers=function(){if(memberRendering46)return;const box=typeof $==='function'?$('members'):null,sig=memberSig46(),has=!!box?.children?.length,force=memberForce46;memberForce46=false;if(!force&&has&&sig===lastMemberSig46)return;if(has&&memberIsMoving46()){clearTimeout(memberDeferred46);memberDeferred46=setTimeout(()=>{memberForce46=true;renderMembers()},190);return}memberRendering46=true;try{renderMembersPrev46Safe();lastMemberSig46=sig}finally{memberRendering46=false}};
function forceMember46(){memberForce46=true;lastMemberSig46=''}
if(typeof window.memberPageGo46==='function'){const f=window.memberPageGo46;window.memberPageGo46=function(...a){forceMember46();return f.apply(this,a)}}
if(typeof window.searchMembers46==='function'){const f=window.searchMembers46;window.searchMembers46=function(...a){forceMember46();return f.apply(this,a)}}
if(typeof window.refreshMembers46==='function'){const f=window.refreshMembers46;window.refreshMembers46=function(...a){forceMember46();return f.apply(this,a)}}

const renderHeaderPrev46Safe=renderHeader;
renderHeader=function(){const r=renderHeaderPrev46Safe();ensureTop46();return r};
const goViewPrev46Safe=goView;
goView=function(id){if(String(id)==='members'&&currentView!=='members')forceMember46();return goViewPrev46Safe(id)};

setTimeout(()=>{markLegacy46(CUR46);ensureTop46();latestCheck46().catch(()=>{})},0);
setInterval(()=>latestCheck46().catch(()=>{}),60000);
})();
