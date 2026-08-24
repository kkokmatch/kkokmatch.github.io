(()=>{
const VER41='4.1';
const FULL_STATE41='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-multi-api';
const DEV_NAME41='박태영';
let rosterFull41=false,rosterLoading41=false,rosterGroup41='',rosterReq41=null,latest41=VER41,refreshBusy41=false;

function developer41(){return !!me&&me.globalAdmin===true&&String(me.displayName||'').trim()===DEV_NAME41}
function adminMember41(m){return !!m&&String(m.name||'').trim()===DEV_NAME41&&roleOf(m)==='admin'}
function generalBadge41(){return '<span class="roleBadge role-member44">일반</span>'}
const roleBadgePrev41=roleBadge;
roleBadge=function(m){
 if(adminMember41(m)&&String(S?.adminBadgeVisibility||'all')==='hidden'&&!developer41())return generalBadge41();
 return roleBadgePrev41(m);
};

function loadingRoster41(){
 const b=$('members');if(!b)return;
 b.innerHTML='<div class="title"><h2>회원명부</h2></div><div class="empty">전체 회원명단을 불러오는 중입니다...</div>';
}
async function fetchFullRoster41(force=false){
 if(!T||!currentGroupId)return null;
 const gid=currentGroupId;
 if(!force&&rosterFull41&&rosterGroup41===gid)return {data:S};
 if(rosterReq41&&rosterGroup41===gid)return rosterReq41;
 rosterLoading41=true;rosterGroup41=gid;if(currentView==='members')loadingRoster41();
 rosterReq41=(async()=>{
  const u=new URL(FULL_STATE41);u.searchParams.set('api','state');u.searchParams.set('groupId',gid);u.searchParams.set('t',Date.now());
  const r=await fetch(u,{headers:{authorization:'Bearer '+T},cache:'no-store'});const x=await r.json().catch(()=>({}));
  if(!r.ok){if(r.status===401){reloginLatest();throw new Error('로그인이 만료되었습니다.')}throw new Error(x.error||'전체 회원명단을 불러오지 못했습니다.')}
  if(gid!==currentGroupId)return x;
  S=x.data;me=x.user;group=x.group;groups=x.groups||groups;currentGroupId=group.groupId;localStorage.setItem(GROUP_KEY,currentGroupId);normalizeClient();
  rosterFull41=true;rosterGroup41=currentGroupId;return x;
 })().finally(()=>{rosterLoading41=false;rosterReq41=null});
 return rosterReq41;
}
async function showFullMembers41(force=false){
 try{
  await fetchFullRoster41(force);
  if(currentView!=='members')return;
  try{if(typeof window.searchMembers46==='function')window.searchMembers46('')}catch{}
  try{if(typeof window.memberPageGo46==='function')window.memberPageGo46(1);else renderMembers()}catch{renderMembers()}
 }catch(e){if(currentView==='members'){const b=$('members');if(b)b.innerHTML=`<div class="title"><h2>회원명부</h2></div><div class="warn">${esc(e.message||'회원명단을 불러오지 못했습니다.')}</div><button class="btn pri" onclick="showFullMembers41(true)">다시 불러오기</button>`}}
}
window.showFullMembers41=showFullMembers41;

const renderMembersPrev41=renderMembers;
renderMembers=function(){
 if(currentView==='members'&&(!rosterFull41||rosterGroup41!==currentGroupId||rosterLoading41)){loadingRoster41();if(!rosterLoading41)showFullMembers41(true);return}
 return renderMembersPrev41();
};
const loadStatePrev41=loadState;
loadState=async function(...args){
 const before=currentView,r=await loadStatePrev41(...args);
 if(before==='members'||currentView==='members'){
  rosterFull41=false;await fetchFullRoster41(true);if(currentView==='members')renderMembers();
 }else rosterFull41=false;
 return r;
};
const goViewPrev41=goView;
goView=function(id){
 const target=String(id||''),prev=currentView;
 if(target==='members'&&prev!=='members'){rosterFull41=false;rosterLoading41=true;loadingRoster41()}
 const r=goViewPrev41(id);
 if(target==='members'&&prev!=='members'){
  try{if(typeof window.searchMembers46==='function')window.searchMembers46('')}catch{}
  rosterLoading41=false;showFullMembers41(true);
 }
 return r;
};
window.refreshMembers46=async function(){rosterFull41=false;await showFullMembers41(true)};

const badgeSetPrev41=window.setAdminBadgeVisibility43;
if(typeof badgeSetPrev41==='function')window.setAdminBadgeVisibility43=async function(mode){
 await badgeSetPrev41(mode);rosterFull41=false;await fetchFullRoster41(true).catch(()=>{});if(currentView==='settings')renderSettings();
};

function stripVersionCard41(){
 const box=$('settings');if(!box)return;
 const cards=[...box.querySelectorAll('.card')];
 for(const c of cards){const t=String(c.textContent||'');if(t.includes('프로그램 버전')||c.querySelector('#forceUpdateBtn')||c.querySelector('a[href="/versions/"]')){c.remove();break}}
 box.querySelectorAll('#forceUpdateBtn,a[href="/versions/"]').forEach(el=>el.remove());
}
const renderSettingsPrev41=renderSettings;
renderSettings=function(){
 const r=renderSettingsPrev41();const box=$('settings');if(!box)return r;
 if(!developer41()){stripVersionCard41();return r}
 const card=[...box.querySelectorAll('.card')].find(c=>String(c.textContent||'').includes('프로그램 버전'));
 if(card){const m=card.querySelector('.meta');if(m)m.textContent='콕매치 v4.1 · 전체 회원명단 보호 · 개발자 권한/배지 분리'}
 return r;
};

function cmp41(a,b){const A=String(a||'0').replace(/^v/i,'').split('.').map(Number),B=String(b||'0').replace(/^v/i,'').split('.').map(Number);for(let i=0;i<Math.max(A.length,B.length);i++){const x=A[i]||0,y=B[i]||0;if(x!==y)return x>y?1:-1}return 0}
function injectTop41(){if(document.getElementById('v41style'))return;const s=document.createElement('style');s.id='v41style';s.textContent='#topActions37,#topActions39,#topActions40{display:none!important}#topActions41{margin-left:auto;display:flex;align-items:center;justify-content:flex-end;gap:4px;position:relative;z-index:50;pointer-events:auto}#currentVersion41{font-size:10px;font-weight:900;padding:6px 5px;border-radius:8px;background:rgba(255,255,255,.18);white-space:nowrap}#headerRefresh41{max-width:170px;min-height:30px;padding:6px 8px;font-size:10.5px;font-weight:800;line-height:1.15;white-space:normal}#logout41{flex:0 0 64px;width:64px;min-width:64px;max-width:64px;min-height:30px;padding:6px 4px;font-size:11px;white-space:nowrap}.toprow>.logout{display:none!important}@media(max-width:380px){#currentVersion41{display:none}#headerRefresh41{max-width:135px;font-size:9.5px}#logout41{flex-basis:56px;width:56px;min-width:56px;max-width:56px;font-size:10px}}';document.head.appendChild(s)}
function updateTop41(){const v=document.getElementById('currentVersion41'),b=document.getElementById('headerRefresh41');if(v)v.textContent='v'+VER41;if(!b)return;const newer=cmp41(latest41,VER41)>0;b.textContent=refreshBusy41?'불러오는 중…':newer?`v${latest41} 업데이트 · 새로고침`:'↻ 새로고침'}
function ensureTop41(){injectTop41();const row=document.querySelector('.toprow');if(!row)return;let a=document.getElementById('topActions41');if(!a){a=document.createElement('div');a.id='topActions41';a.innerHTML=`<span id="currentVersion41">v${VER41}</span><button id="headerRefresh41" class="btn ghost" type="button">↻ 새로고침</button><button id="logout41" type="button">로그아웃</button>`;row.appendChild(a);a.querySelector('#headerRefresh41')?.addEventListener('click',()=>refreshApp41());a.querySelector('#logout41')?.addEventListener('click',()=>logout())}updateTop41()}
async function latestVer41(){try{const r=await fetch('/latest-version.json?t='+Date.now(),{cache:'no-store'});if(r.ok){const x=await r.json();latest41=String(x.semanticVersion||x.label||VER41).replace(/^v/i,'')||VER41}}catch{}updateTop41();return latest41}
window.refreshApp41=async function(target=''){if(refreshBusy41)return;refreshBusy41=true;updateTop41();try{const v=String(target||await latestVer41()||VER41).replace(/^v/i,'');location.replace('/?v='+encodeURIComponent(v)+'&refresh='+Date.now())}catch(e){refreshBusy41=false;updateTop41();showError(e)}};
window.refreshApp40=window.refreshApp41;window.refreshApp39=window.refreshApp41;window.refreshApp37=window.refreshApp41;
try{sessionStorage.setItem('kokmatch_auto_update_target_v40',VER41);sessionStorage.setItem('kokmatch_auto_update_target_v39',VER41)}catch{}
const renderHeaderPrev41=renderHeader;
renderHeader=function(){const r=renderHeaderPrev41();ensureTop41();return r};
setTimeout(()=>{ensureTop41();latestVer41()},0);setInterval(()=>latestVer41(),60000);
})();
