from pathlib import Path
p=Path('app-v6.77.js')
s=p.read_text(encoding='utf-8')
s += r'''

/* v6.77: make legacy roster finalizer idempotent so operational polling cannot recreate avatars. */
(()=>{
'use strict';
if(window.__kokmatchRosterFinalizerStable677)return;
const original=window.__kokmatchFinalizeRoster22;
if(typeof original!=='function')return;
window.__kokmatchRosterFinalizerStable677='6.77';
let last='';
function sig677(){
 try{
  const rows=(Array.isArray(S?.members)?S.members:[]).map(m=>[
   String(m?.id||''),String(m?.name||''),Number(m?.year)||0,String(m?.age||''),String(m?.gender||''),String(m?.cls||''),
   String(m?.type||'member'),String(m?.role||'member'),String(m?.inviter||''),String(m?.tempOrganizerDay||''),
   String(m?.partnerId||''),String(m?.partnerDay||''),String(m?.memberSince||'')
  ]);
  return JSON.stringify([String(currentGroupId||''),String(me?.role||''),!!me?.globalAdmin,!!me?.tempOrganizer,rows]);
 }catch{return ''}
}
window.__kokmatchFinalizeRoster22=function(...args){
 const next=sig677(),box=document.getElementById('members'),has=!!box?.querySelector('.memberCard[data-member-id22],.memberCard[data-member-id46],.memberCard');
 if(has&&next&&next===last)return;
 const r=original.apply(this,args);last=next;return r;
};
/* The current visible roster is already finalized before this tail patch loads. */
if(document.getElementById('members')?.querySelector('.memberCard'))last=sig677();
window.__kokmatchRosterFinalizerSig677=()=>last;
})();
'''
p.write_text(s,encoding='utf-8')
print('stabilized legacy roster finalizer')
