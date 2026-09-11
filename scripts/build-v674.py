from pathlib import Path
import json,re

root=Path('.')
js=(root/'app-v6.73.js').read_text(encoding='utf-8').replace('6.73','6.74')
css=(root/'app-v6.73.css').read_text(encoding='utf-8').replace('6.73','6.74')

# The deleted developer-visibility feature must have no surviving effect. All legacy
# canSeeGlobalXX gates now resolve visible, and the old direct hidden-state comparison is inert.
js=re.sub(r'function canSeeGlobal(\d+)\(\)\{.*?\}',lambda m:f'function canSeeGlobal{m.group(1)}(){{return true}}',js,flags=re.S)
js=js.replace("String(S?.adminBadgeVisibility||'all')==='hidden'","false")

# Personal waiting cards: move the green game-count pill off the name line and place it
# on the waiting-time line, immediately to the right of the wait information.
start=js.index('function moveQueueCount658(){')
end=js.index('\nfunction autoQueueHtml658(){',start)
move_queue=r'''function moveQueueCount658(){
 try{
  const box=document.getElementById('queue');if(!box)return;
  const q=typeof sortedQueue==='function'?sortedQueue():[];
  [...box.querySelectorAll('.queueCard54,.queueCard53,.queueCard')].forEach((card,i)=>{
   const name=card.querySelector('.name');
   const meta=card.querySelector('.queueInfo53 .compactMeta53')||card.querySelector('.queueInfo53 .meta')||[...card.querySelectorAll('.meta')].find(x=>/대기/.test(String(x.textContent||'')));
   if(!name||!meta)return;
   meta.classList.add('queueWaitMeta658');
   const counts=[...card.querySelectorAll('.gamecnt')];
   let badge=counts.find(x=>meta.contains(x))||counts.find(x=>name.contains(x))||counts[0]||null;
   const id=String(q[i]||'');
   const n=id&&typeof dailyCount==='function'?Math.max(0,Number(dailyCount(id))||0):0;
   if(!badge){badge=document.createElement('span');badge.className='gamecnt';badge.textContent=`게임 ${n}회`}
   else if(String(badge.textContent||'').trim()!==`게임 ${n}회`)badge.textContent=`게임 ${n}회`;
   counts.filter(x=>x!==badge).forEach(x=>x.remove());
   if(badge.parentElement!==meta){badge.remove();meta.appendChild(badge)}
   badge.classList.add('queueGameCount658');
   name.querySelectorAll('.gamecnt').forEach(x=>{if(x!==badge)x.remove()});
  });
 }catch{}
}'''
js=js[:start]+move_queue+js[end:]

# Restore the missing Challenger-frame helpers and make the developer identity canonical and
# visible to every viewer (developer/manager/organizer/member/guest) regardless of stale state.
restore=r'''

/* v6.74: canonical always-visible developer badge + restored Challenger frame. */
(()=>{
'use strict';
if(window.__kokmatchDeveloperVisible674)return;window.__kokmatchDeveloperVisible674='6.74';
const DEV_FRAME674='/assets/dev-prism-frame-v662.webp?v=6.74';
function forceDeveloperVisible674(){try{if(S&&typeof S==='object'&&S.adminBadgeVisibility!=='all')S.adminBadgeVisibility='all'}catch{}}
window.profileTarget659=function(host){
 if(!host)return null;
 return host.querySelector(':scope > .profileIdentity21,:scope > .profileAvatar53,:scope > .avatar,.profileIdentity21,.profileAvatar53,.avatar,.profilePreview53');
};
window.devMember661=function(id){try{const m=typeof M==='function'?M(String(id||'')):null;return !!m&&String(m.role||'')==='admin'}catch{return false}};
window.ensureDevFrame661=function(target){
 if(!target)return null;
 let frame=target.querySelector(':scope > img.devFrame661');
 const extras=[...target.querySelectorAll(':scope > img.devFrame661')];extras.slice(1).forEach(x=>x.remove());
 if(!frame){frame=document.createElement('img');frame.className='devFrame661';frame.alt='';frame.setAttribute('aria-hidden','true');frame.draggable=false;frame.decoding='async';target.appendChild(frame)}
 if(frame.getAttribute('src')!==DEV_FRAME674)frame.src=DEV_FRAME674;
 return frame;
};
function adminMembers674(){try{return (Array.isArray(S?.members)?S.members:[]).filter(m=>String(m?.role||'')==='admin')}catch{return[]}}
function hostId674(host,target){return String(target?.getAttribute?.('data-member-id')||host?.getAttribute?.('data-member-id')||host?.getAttribute?.('data-member-id22')||host?.getAttribute?.('data-member-id46')||host?.getAttribute?.('data-member-id80')||'')}
function hostName674(host){
 const n=host?.querySelector?.('.memberName45,.compactName53,.playingName53,.fillMain94 b,.slotName53 .compactName53,.slotName .compactName53');
 if(n)return String(n.textContent||'').trim();
 const line=host?.querySelector?.('.memberMainLine45,.queueMain47,.playingMain53,.slotName53,.slotName,.name');
 return String(line?.childNodes?.[0]?.textContent||line?.textContent||'').trim().split(/\s+/)[0]||'';
}
function memberForHost674(host,target){
 const id=hostId674(host,target);if(id){try{const m=M(id);if(m)return m}catch{}}
 const name=hostName674(host);if(!name)return null;
 return adminMembers674().find(m=>String(m.name||'').trim()===name)||null;
}
function badgeLine674(host){return host?.querySelector?.('.memberMainLine45,.queueMain47,.compactLine53,.playingMain53,.slotName53,.slotName,.name')||host}
function ensureDeveloperBadge674(host,m){
 if(!host||!m||String(m.role||'')!=='admin')return;
 host.querySelectorAll('.roleBadge.role-member44').forEach(x=>x.remove());
 let badge=host.querySelector('.roleBadge.role-global');
 if(!badge){badge=document.createElement('span');badge.className='roleBadge role-global';badge.textContent='개발자';badgeLine674(host)?.appendChild(badge)}
 else if(String(badge.textContent||'').trim()!=='개발자')badge.textContent='개발자';
}
function positionQueueGameBadges674(){
 try{
  const box=document.getElementById('queue');if(!box)return;
  const q=typeof sortedQueue==='function'?sortedQueue():[];
  [...box.querySelectorAll('.queueCard54,.queueCard53,.queueCard')].forEach((card,i)=>{
   const name=card.querySelector('.name,.queueMain47,.compactLine53');
   const meta=card.querySelector('.queueInfo53 .compactMeta53')||card.querySelector('.queueInfo53 .meta')||[...card.querySelectorAll('.meta')].find(x=>/대기/.test(String(x.textContent||'')));
   if(!meta)return;
   meta.classList.add('queueWaitMeta658');
   const all=[...card.querySelectorAll('.gamecnt')];
   let badge=all.find(x=>meta.contains(x))||all[0]||null;
   const id=String(q[i]||''),n=id&&typeof dailyCount==='function'?Math.max(0,Number(dailyCount(id))||0):0,txt=`게임 ${n}회`;
   if(!badge){badge=document.createElement('span');badge.className='gamecnt';badge.textContent=txt}
   else if(String(badge.textContent||'').trim()!==txt)badge.textContent=txt;
   all.filter(x=>x!==badge).forEach(x=>x.remove());
   if(badge.parentElement!==meta){badge.remove();meta.appendChild(badge)}
   badge.classList.add('gamecnt','queueGameCount658');
   name?.querySelectorAll?.('.gamecnt').forEach(x=>{if(x!==badge)x.remove()});
  });
 }catch{}
}
function syncDeveloper674(){
 forceDeveloperVisible674();
 try{
  const admins=adminMembers674();
  const hosts=document.querySelectorAll('.memberCard,.queueCard,.pendingSlot,.playingPlayer53,.p,.slot');
  hosts.forEach(host=>{
   const target=window.profileTarget659(host);let m=memberForHost674(host,target);
   if(!m&&host.querySelector('.roleBadge.role-global'))m=admins[0]||null;
   if(!m||String(m.role||'')!=='admin')return;
   ensureDeveloperBadge674(host,m);
   if(target){target.classList.add('devChallenger659');window.ensureDevFrame661(target)}
  });
  document.querySelectorAll('.profileIdentity21[data-member-id],.profileAvatar53[data-member-id],.avatar[data-member-id]').forEach(target=>{
   if(!window.devMember661(target.getAttribute('data-member-id')))return;
   const host=target.closest('.memberCard,.queueCard,.pendingSlot,.playingPlayer53,.p,.slot');if(host){const m=M(target.getAttribute('data-member-id'));ensureDeveloperBadge674(host,m)}
   target.classList.add('devChallenger659');window.ensureDevFrame661(target);
  });
  const linked=me?.memberId&&typeof M==='function'?M(String(me.memberId)):null;
  const isDev=me?.globalAdmin===true||String(me?.role||'')==='admin'||String(linked?.role||'')==='admin';
  document.documentElement.classList.toggle('kokmatchDeveloper659',isDev);
  const mine=document.querySelector('#profileCard53 .profilePreview53');if(mine&&isDev){mine.classList.add('devChallenger659');window.ensureDevFrame661(mine)}
  positionQueueGameBadges674();
 }catch{}
}
try{const prev=normalizeClient;normalizeClient=function(...args){const r=prev.apply(this,args);forceDeveloperVisible674();return r}}catch{}
for(const name of ['renderMembers','renderQueue','renderPlaying','renderSettings']){
 try{const prev=eval(name);if(typeof prev!=='function')continue;const wrapped=function(...args){forceDeveloperVisible674();const r=prev.apply(this,args);queueMicrotask(syncDeveloper674);return r};eval(name+'=wrapped')}catch{}
}
try{const prev=renderAll;renderAll=function(...args){forceDeveloperVisible674();const r=prev.apply(this,args);syncDeveloper674();queueMicrotask(syncDeveloper674);return r}}catch{}
window.__kokmatchSyncDeveloper674=syncDeveloper674;
window.__kokmatchPositionQueueGameBadges674=positionQueueGameBadges674;
forceDeveloperVisible674();
let observerQueued674=false;
function scheduleDeveloper674(){if(observerQueued674)return;observerQueued674=true;requestAnimationFrame(()=>{observerQueued674=false;syncDeveloper674()})}
const boot=()=>{syncDeveloper674();try{new MutationObserver(scheduleDeveloper674).observe(document.body,{childList:true,subtree:true})}catch{};setTimeout(syncDeveloper674,80);setTimeout(syncDeveloper674,350)};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
'''
js+=restore

css+=r'''

/* v6.74: green game count lives on the waiting-time row. */
#queue .queueWaitMeta658{display:flex!important;align-items:center!important;gap:5px!important;flex-wrap:wrap!important;min-width:0!important}
#queue .queueWaitMeta658 .queueGameCount658{margin-left:3px!important;vertical-align:middle!important;white-space:nowrap!important;flex:0 0 auto!important}
#queue .queueMain47>.gamecnt,#queue .compactLine53>.gamecnt,#queue .name>.gamecnt{display:none!important}
/* Developer visibility is no longer configurable: the badge and original Challenger frame are universal. */
html body .devChallenger659>img.devFrame661{display:block!important;visibility:visible!important}
'''

(root/'app-v6.74.js').write_text(js,encoding='utf-8')
(root/'app-v6.74.css').write_text(css,encoding='utf-8')
for name in ['index.html','manifest.webmanifest','kokmatch-sw.js','sw.js']:
 p=root/name;s=p.read_text(encoding='utf-8').replace('6.73','6.74');p.write_text(s,encoding='utf-8')
(root/'latest-version.json').write_text(json.dumps({
 'version':114,'label':'v6.74','semanticVersion':'6.74','build':'v6.74','updatedAt':'2026-09-11T13:51:00+09:00',
 'note':'v6.74 게임횟수 배지 대기시간 우측 이동 · 개발자 Challenger 테두리 복원 · 모든 역할에 개발자 배지/테두리 항상 표시'
},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('built v6.74 queue badge + universal developer badge/frame')
