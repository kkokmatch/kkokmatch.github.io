(()=>{
const ROSTER42='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-roster-v47';
const DEV_NAME42='박태영';
let memberReady42=false,memberGroup42='',memberReq42=null,memberReqGroup42='',memberLoadedAt42=0;

function developer42(){return !!me&&me.globalAdmin===true&&String(me.displayName||'').trim()===DEV_NAME42}
function adminMember42(m){return !!m&&String(m.name||'').trim()===DEV_NAME42&&roleOf(m)==='admin'}
function generalBadge42(){return '<span class="roleBadge role-member44">일반</span>'}
const roleBadgePrev42=roleBadge;
roleBadge=function(m){if(adminMember42(m)&&String(S?.adminBadgeVisibility||'all')==='hidden'&&!developer42())return generalBadge42();return roleBadgePrev42(m)};

function invalidateMembers42(){memberReady42=false;memberLoadedAt42=0}
function hasFullRoster42(){const got=Array.isArray(S?.members)?S.members.length:0,expected=Number(window.__kokmatchMemberCount46||0);return got>0&&(!expected||got>=expected)}
function showRosterLoading42(){const b=$('members');if(!b||hasFullRoster42())return;b.innerHTML='<div class="title"><h2>회원명부</h2></div><div class="empty">회원명단을 불러오는 중입니다...</div>'}
function applyRoster42(x,gid){
 if(String(gid)!==String(currentGroupId||''))return false;
 const members=Array.isArray(x?.members)?x.members:[];
 S={...(S||{}),members,adminBadgeVisibility:String(x?.adminBadgeVisibility||S?.adminBadgeVisibility||'all')};
 window.__kokmatchMemberCount46=Number(x?.memberCount||members.length);normalizeClient();memberReady42=true;memberGroup42=gid;memberLoadedAt42=Date.now();return true;
}
async function fetchRoster42(force=false){
 if(!T||!currentGroupId)return null;const gid=String(currentGroupId);
 if(!force&&memberReady42&&memberGroup42===gid&&Date.now()-memberLoadedAt42<30000)return {members:S.members,memberCount:S.members?.length||0};
 if(memberReq42&&memberReqGroup42===gid)return memberReq42;
 memberGroup42=gid;if(!hasFullRoster42())showRosterLoading42();
 const promise=(async()=>{
  const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),8000);
  try{
   const u=new URL(ROSTER42);u.searchParams.set('groupId',gid);u.searchParams.set('t',Date.now());
   const r=await fetch(u,{headers:{authorization:'Bearer '+T},cache:'no-store',signal:ctl.signal});const x=await r.json().catch(()=>({}));
   if(!r.ok){if(r.status===401){reloginLatest();throw new Error('로그인이 만료되었습니다.')}throw new Error(x.error||'회원명단을 불러오지 못했습니다.')}
   if(String(currentGroupId||'')!==gid)return x;applyRoster42(x,gid);return x;
  }catch(e){if(e?.name==='AbortError')throw new Error('회원명단 응답이 지연되고 있습니다. 다시 시도해주세요.');throw e}finally{clearTimeout(timer)}
 })();
 memberReq42=promise;memberReqGroup42=gid;
 try{return await promise}finally{if(memberReq42===promise){memberReq42=null;memberReqGroup42=''}}
}
function renderFullPage42(){
 if(currentView!=='members'||!memberReady42||memberGroup42!==String(currentGroupId||''))return;
 try{if(typeof window.resetMemberList46==='function')window.resetMemberList46();else renderMembers();$('memberSearchInput46')?.blur()}catch(e){console.error('render roster v4.7',e);try{renderMembers()}catch{}}
}
async function enterMembers42(force=true){
 try{await fetchRoster42(force);renderFullPage42()}catch(e){if(currentView==='members'){const b=$('members');if(b)b.innerHTML=`<div class="title"><h2>회원명부</h2></div><div class="warn">${esc(e.message||'회원명단을 불러오지 못했습니다.')}</div><button class="btn pri" onclick="enterMembers42(true)">다시 불러오기</button>`}}
}
window.enterMembers42=enterMembers42;

const renderMembersPrev42=renderMembers;
renderMembers=function(){
 if(currentView==='members'&&(!memberReady42||memberGroup42!==String(currentGroupId||''))){
  if(hasFullRoster42()){memberReady42=true;memberGroup42=String(currentGroupId||'');memberLoadedAt42=Date.now();return renderMembersPrev42()}
  showRosterLoading42();if(!memberReq42)enterMembers42(true);return;
 }
 return renderMembersPrev42();
};
window.refreshMembers46=function(){invalidateMembers42();return enterMembers42(true)};

const goViewPrev42=goView;
goView=function(id){
 const target=String(id||''),prev=currentView;if(target==='members'&&prev!=='members')invalidateMembers42();
 const r=goViewPrev42(id);
 if(target==='members'&&prev!=='members')queueMicrotask(()=>{if(currentView==='members')enterMembers42(false)});
 return r;
};

const badgeSetPrev42=window.setAdminBadgeVisibility43;
if(typeof badgeSetPrev42==='function')window.setAdminBadgeVisibility43=async function(mode){await badgeSetPrev42(mode);invalidateMembers42()};

function stripVersionCard42(){
 const box=$('settings');if(!box)return;
 for(const c of [...box.querySelectorAll('.card')]){const t=String(c.textContent||'');if(t.includes('프로그램 버전')||c.querySelector('#forceUpdateBtn')||c.querySelector('a[href="/versions/"]')){c.remove();break}}
 box.querySelectorAll('#forceUpdateBtn,a[href="/versions/"]').forEach(el=>el.remove());
}
const renderSettingsPrev42=renderSettings;
renderSettings=function(){const r=renderSettingsPrev42();const box=$('settings');if(!box)return r;if(!developer42()){stripVersionCard42();return r}return r};

setTimeout(()=>{if(T&&me&&currentView==='members')enterMembers42(false)},0);
})();
