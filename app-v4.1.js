(()=>{
const VER42='4.2';
const FULL_STATE42='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-multi-api';
const DEV_NAME42='박태영';
let memberReady42=false,memberGroup42='',memberReq42=null,memberSeq42=0;
let latest42=VER42,refreshBusy42=false;

function developer42(){return !!me&&me.globalAdmin===true&&String(me.displayName||'').trim()===DEV_NAME42}
function adminMember42(m){return !!m&&String(m.name||'').trim()===DEV_NAME42&&roleOf(m)==='admin'}
function generalBadge42(){return '<span class="roleBadge role-member44">일반</span>'}
const roleBadgePrev42=roleBadge;
roleBadge=function(m){
 if(adminMember42(m)&&String(S?.adminBadgeVisibility||'all')==='hidden'&&!developer42())return generalBadge42();
 return roleBadgePrev42(m);
};

function showRosterLoading42(){
 const b=$('members');if(!b)return;
 const currentGroup=String(memberGroup42||'');
 if(currentGroup&&currentGroup!==String(currentGroupId||''))b.innerHTML='';
 if(!b.children.length)b.innerHTML='<div class="title"><h2>회원명부</h2></div><div class="empty">회원명단을 불러오는 중입니다...</div>';
}
function applyFull42(x,gid){
 if(gid!==currentGroupId)return false;
 S=x.data;me=x.user;group=x.group;groups=x.groups||groups;currentGroupId=group.groupId;localStorage.setItem(GROUP_KEY,currentGroupId);normalizeClient();
 memberReady42=true;memberGroup42=currentGroupId;return true;
}
async function fetchFull42(force=false){
 if(!T||!currentGroupId)return null;
 const gid=currentGroupId;
 if(!force&&memberReady42&&memberGroup42===gid)return {data:S};
 if(memberReq42&&memberGroup42===gid)return memberReq42;
 const seq=++memberSeq42;memberReady42=false;memberGroup42=gid;
 showRosterLoading42();
 memberReq42=(async()=>{
  const u=new URL(FULL_STATE42);u.searchParams.set('api','state');u.searchParams.set('groupId',gid);u.searchParams.set('t',Date.now());
  const r=await fetch(u,{headers:{authorization:'Bearer '+T},cache:'no-store'});const x=await r.json().catch(()=>({}));
  if(!r.ok){if(r.status===401){reloginLatest();throw new Error('로그인이 만료되었습니다.')}throw new Error(x.error||'전체 회원명단을 불러오지 못했습니다.')}
  if(seq!==memberSeq42||gid!==currentGroupId)return x;
  applyFull42(x,gid);return x;
 })().finally(()=>{if(seq===memberSeq42)memberReq42=null});
 return memberReq42;
}
function renderFullPage42(){
 if(currentView!=='members'||!memberReady42||memberGroup42!==currentGroupId)return;
 try{
  if(typeof window.resetMemberList46==='function')window.resetMemberList46();
  else if(typeof window.memberPageGo46==='function')window.memberPageGo46(1);
  else renderMembers();
  $('memberSearchInput46')?.blur();
 }catch(e){console.error('render full roster v4.2',e);try{renderMembers()}catch{}}
}
async function enterMembers42(force=true){
 try{await fetchFull42(force);renderFullPage42()}catch(e){
  if(currentView==='members'){const b=$('members');if(b)b.innerHTML=`<div class="title"><h2>회원명부</h2></div><div class="warn">${esc(e.message||'회원명단을 불러오지 못했습니다.')}</div><button class="btn pri" onclick="enterMembers42(true)">다시 불러오기</button>`}
 }
}
window.enterMembers42=enterMembers42;

const renderMembersPrev42=renderMembers;
renderMembers=function(){
 if(currentView==='members'&&(!memberReady42||memberGroup42!==currentGroupId)){
  showRosterLoading42();if(!memberReq42)enterMembers42(true);return;
 }
 return renderMembersPrev42();
};
window.refreshMembers46=function(){memberReady42=false;return enterMembers42(true)};

document.addEventListener('pointerdown',e=>{
 const btn=e.target.closest?.('#nav button[data-v="members"]');
 if(!btn||currentView==='members')return;
 memberReady42=false;memberSeq42++;
 queueMicrotask(()=>{if(currentView==='members')enterMembers42(true)});
},{capture:true,passive:true});
const goViewPrev42=goView;
goView=function(id){
 const target=String(id||''),prev=currentView;
 if(target==='members'&&prev!=='members'){memberReady42=false;memberSeq42++}
 const r=goViewPrev42(id);
 if(target==='members'&&prev!=='members')queueMicrotask(()=>{if(currentView==='members')enterMembers42(true)});
 return r;
};

const badgeSetPrev42=window.setAdminBadgeVisibility43;
if(typeof badgeSetPrev42==='function')window.setAdminBadgeVisibility43=async function(mode){
 await badgeSetPrev42(mode);memberReady42=false;memberSeq42++;
};

function stripVersionCard42(){
 const box=$('settings');if(!box)return;
 for(const c of [...box.querySelectorAll('.card')]){
  const t=String(c.textContent||'');
  if(t.includes('프로그램 버전')||c.querySelector('#forceUpdateBtn')||c.querySelector('a[href="/versions/"]')){c.remove();break}
 }
 box.querySelectorAll('#forceUpdateBtn,a[href="/versions/"]').forEach(el=>el.remove());
}
const renderSettingsPrev42=renderSettings;
renderSettings=function(){
 const r=renderSettingsPrev42();const box=$('settings');if(!box)return r;
 if(!developer42()){stripVersionCard42();return r}
 const card=[...box.querySelectorAll('.card')].find(c=>String(c.textContent||'').includes('프로그램 버전'));
 if(card){const m=card.querySelector('.meta');if(m)m.textContent='콕매치 v4.2 · 회원명부 동기화 안정화 · 개발자 전용 버전관리'}
 return r;
};

function cmp42(a,b){const A=String(a||'0').replace(/^v/i,'').split('.').map(Number),B=String(b||'0').replace(/^v/i,'').split('.').map(Number);for(let i=0;i<Math.max(A.length,B.length);i++){const x=A[i]||0,y=B[i]||0;if(x!==y)return x>y?1:-1}return 0}
function injectTop42(){if(document.getElementById('v42topStyle'))return;const s=document.createElement('style');s.id='v42topStyle';s.textContent='#topActions37,#topActions39,#topActions40,#topActions41{display:none!important}#topActions42{margin-left:auto;display:flex;align-items:center;justify-content:flex-end;gap:4px;position:relative;z-index:60;pointer-events:auto}#currentVersion42{font-size:10px;font-weight:900;padding:6px 5px;border-radius:8px;background:rgba(255,255,255,.18);white-space:nowrap}#headerRefresh42{max-width:170px;min-height:30px;padding:6px 8px;font-size:10.5px;font-weight:800;line-height:1.15;white-space:normal}#logout42{flex:0 0 64px;width:64px;min-width:64px;max-width:64px;min-height:30px;padding:6px 4px;font-size:11px;white-space:nowrap}.toprow>.logout{display:none!important}@media(max-width:380px){#currentVersion42{display:none}#headerRefresh42{max-width:135px;font-size:9.5px}#logout42{flex-basis:56px;width:56px;min-width:56px;max-width:56px;font-size:10px}}';document.head.appendChild(s)}
function updateTop42(){const v=document.getElementById('currentVersion42'),b=document.getElementById('headerRefresh42');if(v)v.textContent='v'+VER42;if(!b)return;const newer=cmp42(latest42,VER42)>0;b.textContent=refreshBusy42?'불러오는 중…':newer?`v${latest42} 업데이트 · 새로고침`:'↻ 새로고침'}
function ensureTop42(){injectTop42();const row=document.querySelector('.toprow');if(!row)return;let a=document.getElementById('topActions42');if(!a){a=document.createElement('div');a.id='topActions42';a.innerHTML=`<span id="currentVersion42">v${VER42}</span><button id="headerRefresh42" class="btn ghost" type="button">↻ 새로고침</button><button id="logout42" type="button">로그아웃</button>`;row.appendChild(a);a.querySelector('#headerRefresh42')?.addEventListener('click',()=>refreshApp42());a.querySelector('#logout42')?.addEventListener('click',()=>logout())}updateTop42()}
async function latestVer42(){try{const r=await fetch('/latest-version.json?t='+Date.now(),{cache:'no-store'});if(r.ok){const x=await r.json();latest42=String(x.semanticVersion||x.label||VER42).replace(/^v/i,'')||VER42}}catch{}updateTop42();return latest42}
window.refreshApp42=async function(target=''){if(refreshBusy42)return;refreshBusy42=true;updateTop42();try{const v=String(target||await latestVer42()||VER42).replace(/^v/i,'');location.replace('/?v='+encodeURIComponent(v)+'&refresh='+Date.now())}catch(e){refreshBusy42=false;updateTop42();showError(e)}};
window.refreshApp41=window.refreshApp42;window.refreshApp40=window.refreshApp42;window.refreshApp39=window.refreshApp42;window.refreshApp37=window.refreshApp42;
try{sessionStorage.setItem('kokmatch_auto_update_target_v40',VER42);sessionStorage.setItem('kokmatch_auto_update_target_v39',VER42)}catch{}
const renderHeaderPrev42=renderHeader;
renderHeader=function(){const r=renderHeaderPrev42();ensureTop42();return r};
setTimeout(()=>{ensureTop42();latestVer42();if(T&&me&&currentView==='members')enterMembers42(true)},0);setInterval(()=>latestVer42(),60000);
})();
