from pathlib import Path
import json

OLD='6.76'; NEW='6.77'
js=Path(f'app-v{OLD}.js').read_text(encoding='utf-8').replace(OLD,NEW)
patch=r'''

/* v6.77: roster no-flash, restored green queue game badge, persistent auto/manual conflict modal. */
(()=>{
'use strict';
if(window.__kokmatchUiStability677)return;window.__kokmatchUiStability677='6.77';

/* 1) Member roster: keep the existing card/avatar DOM when only live state or game totals change. */
const renderMembersBefore677=renderMembers;
let memberStructSig677='';
function memberStructure677(){
 try{
  const members=(Array.isArray(S?.members)?S.members:[]).map(m=>[
   String(m?.id||''),String(m?.name||''),Number(m?.year)||0,String(m?.age||''),String(m?.gender||''),String(m?.cls||''),
   String(m?.type||'member'),String(m?.role||'member'),String(m?.inviter||''),String(m?.tempOrganizerDay||''),
   String(m?.partnerId||''),String(m?.partnerDay||''),String(m?.memberSince||'')
  ]);
  return JSON.stringify([String(currentGroupId||''),String(me?.role||''),!!me?.globalAdmin,!!me?.tempOrganizer,
   typeof memberQuery46==='undefined'?'':String(memberQuery46||''),typeof memberPage46==='undefined'?1:Number(memberPage46)||1,members]);
 }catch{return String(Date.now())}
}
function stampMemberState677(){
 const box=document.getElementById('members');if(!box)return;
 box.querySelectorAll('.memberCard[data-member-id22]').forEach(card=>{
  const id=String(card.getAttribute('data-member-id22')||''),m=typeof M==='function'?M(id):null;if(!m)return;
  card.dataset.liveState677=String(m.state||'out');
 });
}
function patchMemberDynamics677(){
 const box=document.getElementById('members');if(!box)return false;
 const cards=[...box.querySelectorAll('.memberCard[data-member-id22]')];if(!cards.length)return false;
 for(const card of cards){
  const id=String(card.getAttribute('data-member-id22')||''),m=typeof M==='function'?M(id):null;if(!m)continue;
  const game=[...card.querySelectorAll('.gamecnt')].find(x=>/총\s*게임/.test(String(x.textContent||'')));
  const gameText=`총 게임 ${Math.max(0,Number(m.totalGames)||0)}회`;if(game&&String(game.textContent||'')!==gameText)game.textContent=gameText;
  const nextState=String(m.state||'out'),oldState=String(card.dataset.liveState677||'');
  if(oldState!==nextState){
   try{
    const holder=document.createElement('div');holder.innerHTML=memberControls(m);const next=holder.firstElementChild;
    const current=card.children[card.children.length-1];if(next&&current&&current!==card.children[1])current.replaceWith(next);
   }catch{}
   card.dataset.liveState677=nextState;
  }else{
   const status=card.querySelector('.status');const text=stateLabel(m.state);if(status&&status.textContent!==text)status.textContent=text;
  }
 }
 try{typeof decorateResponsive48==='function'&&decorateResponsive48()}catch{}
 try{window.__kokmatchFinalizeRoster22?.()}catch{}
 return true;
}
renderMembers=function(...args){
 const box=document.getElementById('members'),sig=memberStructure677();
 if(box?.querySelector('.memberCard[data-member-id22]')&&sig===memberStructSig677&&patchMemberDynamics677())return;
 const r=renderMembersBefore677.apply(this,args);memberStructSig677=sig;stampMemberState677();return r;
};

/* 2) Queue: show exactly one original green game-count badge immediately after the current wait text. */
function paintQueueGameBadge677(){
 try{
  const box=document.getElementById('queue');if(!box)return;
  const ids=typeof sortedQueue==='function'?sortedQueue():[];
  const cards=[...box.querySelectorAll('.queueCard54,.queueCard53,.queueCard')];
  cards.forEach((card,i)=>{
   const id=String(ids[i]||''),m=id&&typeof M==='function'?M(id):null;if(!m)return;
   const meta=card.querySelector('.queueInfo53 .compactMeta53')||card.querySelector('.queueInfo53 .meta')||[...card.querySelectorAll('.meta')].find(x=>/대기/.test(String(x.textContent||'')));
   if(!meta)return;meta.classList.add('queueWaitMeta658','queueWaitMeta677');
   const waitText=`현재 ${Math.max(0,typeof waitMins==='function'?Number(waitMins(m))||0:0)}분 대기중`;
   const count=Math.max(0,typeof dailyCount==='function'?Number(dailyCount(id))||0:0),countText=`게임 ${count}회`;
   let wait=meta.querySelector('.waitCurrent677');let badge=meta.querySelector('.queueGameCount677');
   if(!wait||!badge){
    wait=document.createElement('span');wait.className='waitCurrent70 waitCurrent677';
    badge=document.createElement('span');badge.className='gamecnt queueGameCount658 queueGameCount677';
    meta.replaceChildren(wait,badge);
   }
   if(wait.textContent!==waitText)wait.textContent=waitText;
   if(badge.textContent!==countText)badge.textContent=countText;
   [...card.querySelectorAll('.gamecnt')].forEach(x=>{if(x!==badge)x.remove()});
  });
 }catch{}
}
try{decorateWait70=paintQueueGameBadge677}catch{}
try{moveQueueCount658=paintQueueGameBadge677}catch{}
try{positionQueueGameBadges674=paintQueueGameBadge677}catch{}
const renderQueueBefore677=renderQueue;
renderQueue=function(...args){const r=renderQueueBefore677.apply(this,args);paintQueueGameBadge677();return r};
window.__kokmatchPaintQueueGameBadge677=paintQueueGameBadge677;
setInterval(()=>{if(me&&currentView==='queue')paintQueueGameBadge677()},30000);

/* 3) While automatic matching keeps running, the manual-conflict choice modal must stay open until the user chooses. */
let conflictLock677=false,conflictHtml677='';
const openModalBefore677=openModal,closeModalBefore677=closeModal;
openModal=function(html,...args){
 const text=String(html||''),isConflict=text.includes('autoManualKeep673')&&text.includes('autoManualDisable673');
 if(isConflict){conflictLock677=true;conflictHtml677=text}
 return openModalBefore677.call(this,html,...args);
};
closeModal=function(...args){
 if(conflictLock677){const modal=document.getElementById('modal'),sheet=document.getElementById('modalSheet');if(modal)modal.classList.add('on');if(sheet&&!sheet.querySelector('#autoManualKeep673')&&conflictHtml677)sheet.innerHTML=conflictHtml677;return}
 return closeModalBefore677.apply(this,args);
};
document.addEventListener('click',ev=>{
 const t=ev.target instanceof Element?ev.target.closest('#autoManualKeep673,#autoManualDisable673'):null;
 if(t){conflictLock677=false;conflictHtml677=''}
},true);
const modal677=document.getElementById('modal');
if(modal677)new MutationObserver(()=>{
 if(!conflictLock677)return;
 const sheet=document.getElementById('modalSheet');
 if(!modal677.classList.contains('on'))modal677.classList.add('on');
 if(sheet&&!sheet.querySelector('#autoManualKeep673')&&conflictHtml677)sheet.innerHTML=conflictHtml677;
}).observe(modal677,{attributes:true,attributeFilter:['class'],childList:true,subtree:true});
window.__kokmatchConflictModalLocked677=()=>conflictLock677;

if(me){try{if(currentView==='members'){memberStructSig677=memberStructure677();stampMemberState677()}if(currentView==='queue')paintQueueGameBadge677()}catch{}}
})();
'''
Path(f'app-v{NEW}.js').write_text(js+patch,encoding='utf-8')

css=Path(f'app-v{OLD}.css').read_text(encoding='utf-8').replace(OLD,NEW)
css+=r'''

/* v6.77: exact queue wait + original green game-count badge; override old v6.68 hide rule. */
#queue .queueCard .queueWaitMeta658,#queue .queueCard .queueWaitMeta677{display:flex!important;align-items:center!important;gap:5px!important;flex-wrap:wrap!important;min-width:0!important}
#queue .queueCard .queueWaitMeta658 .gamecnt.queueGameCount677,#queue .queueCard .queueWaitMeta677 .gamecnt.queueGameCount677{display:inline-flex!important;align-items:center!important;background:#eef8f2!important;color:var(--green)!important;border:0!important;border-radius:999px!important;padding:3px 7px!important;font-size:11px!important;font-weight:900!important;line-height:1.2!important;margin:0 0 0 3px!important;vertical-align:middle!important;white-space:nowrap!important;flex:0 0 auto!important}
#queue .queueCard .queueWaitMeta677 .waitSep70,#queue .queueCard .queueWaitMeta677 .waitTotal70{display:none!important}
'''
Path(f'app-v{NEW}.css').write_text(css,encoding='utf-8')

for name in ['index.html','manifest.webmanifest','kokmatch-sw.js','sw.js']:
 p=Path(name)
 if p.exists():
  s=p.read_text(encoding='utf-8').replace(f'app-v{OLD}.js?v={OLD}',f'app-v{NEW}.js?v={NEW}').replace(f'app-v{OLD}.css?v={OLD}',f'app-v{NEW}.css?v={NEW}').replace(OLD,NEW)
  p.write_text(s,encoding='utf-8')

latest={
 'version':117,'label':'v6.77','semanticVersion':'6.77','build':'v6.77','updatedAt':'2026-09-11T15:30:00+09:00',
 'note':'v6.77 회원명부 무점멸 갱신 · 대기중 우측 녹색 게임횟수 배지 복원 · 자동편성 중 수동조작 팝업 유지'
}
Path('latest-version.json').write_text(json.dumps(latest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('built v6.77')
