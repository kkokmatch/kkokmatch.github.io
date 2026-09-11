from pathlib import Path
p=Path('app-v6.77.js')
s=p.read_text(encoding='utf-8')
s += r'''

/* v6.77: final member-view renderAll gate. Legacy v22 calls finalizeRoster22 directly, so bypass that chain for operational-only updates. */
(()=>{
'use strict';
if(window.__kokmatchMemberRenderGate677)return;
window.__kokmatchMemberRenderGate677='6.77';
const baseRenderAll677=renderAll;
let lastSig677='';
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
function hasRoster677(){return !!document.getElementById('members')?.querySelector('.memberCard[data-member-id22],.memberCard[data-member-id46],.memberCard')}
function lightweight677(){
 try{renderHeader()}catch{}
 try{renderNav()}catch{}
 try{renderMembers()}catch{}
 try{window.__kokmatchPaintQueueGameBadge677?.()}catch{}
}
renderAll=function(...args){
 const next=sig677();
 if(currentView==='members'&&hasRoster677()&&next&&lastSig677&&next===lastSig677){lightweight677();return}
 const r=baseRenderAll677.apply(this,args);
 if(currentView==='members')lastSig677=next||sig677();
 return r;
};
window.renderAll=renderAll;
/* Seed after existing initial roster settles. */
queueMicrotask(()=>{if(currentView==='members'&&hasRoster677())lastSig677=sig677()});
setTimeout(()=>{if(currentView==='members'&&hasRoster677())lastSig677=sig677()},250);
window.__kokmatchMemberRenderSig677=()=>lastSig677;
})();
'''
p.write_text(s,encoding='utf-8')
print('installed final member renderAll gate')
