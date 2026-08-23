(()=>{
let memberResetQueued32=false;

function removeLegacyMemberPager32(){
 const box=$('members');if(!box)return;
 box.querySelectorAll('.memberPageHidden88').forEach(el=>el.classList.remove('memberPageHidden88'));
 box.querySelectorAll('.memberPager88').forEach(el=>el.remove());
}

/* v46 is the single source of truth for member paging. v88's second 50-card pager
   could hide part of the already-paged v46 result, so always neutralize it. */
const renderMembers31=renderMembers;
renderMembers=function(){
 const r=renderMembers31();
 removeLegacyMemberPager32();
 return r;
};

function resetMemberRoster32(){
 if(currentView!=='members')return;
 try{
  if(typeof window.memberPageGo46==='function')window.memberPageGo46(1);
  else renderMembers();
 }catch(e){console.error('member roster reset v3.2',e);try{renderMembers()}catch{}}
 removeLegacyMemberPager32();
}
function queueMemberReset32(){
 if(memberResetQueued32)return;memberResetQueued32=true;
 queueMicrotask(()=>{
  memberResetQueued32=false;
  if(currentView==='members')resetMemberRoster32();
 });
}

/* Fast navigation v2.5 switches views directly on pointerdown and bypasses v46's
   original goView reset. Restore the reset before the next paint. */
document.addEventListener('pointerdown',e=>{
 const btn=e.target.closest?.('#nav button[data-v="members"]');
 if(!btn||currentView==='members')return;
 queueMemberReset32();
},{capture:true,passive:true});

/* Keep programmatic navigation/group-switch paths safe too. */
const goView31=goView;
goView=function(id){
 const prev=currentView,r=goView31(id);
 if(String(id)==='members'&&prev!=='members')queueMemberReset32();
 return r;
};

const renderSettings31=renderSettings;
renderSettings=function(){
 renderSettings31();const b=$('settings');if(!b)return;
 [...b.querySelectorAll('.meta')].forEach(el=>{
  if(/콕매치 v(?:\d+|\d+\.\d+)/.test(el.textContent||''))el.textContent='콕매치 v3.2 · 회원명부 단일 페이지처리 · 재진입 1페이지 복원 · 일부목록 표시 오류수정';
 });
};

if(me&&currentView==='members')removeLegacyMemberPager32();
})();
