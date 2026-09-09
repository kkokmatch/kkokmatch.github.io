from pathlib import Path

p=Path('app-v6.58.js')
s=p.read_text(encoding='utf-8')
s += r'''

/* v6.58 final ordinary-badge, developer-frame and personal queue metadata guard. */
(()=>{
'use strict';
if(window.__kokmatchNoGeneralBadge658)return;
window.__kokmatchNoGeneralBadge658=true;
let queued=false;
function queueMeta658(){
 try{
  const box=document.getElementById('queue');if(!box)return;
  const q=typeof sortedQueue==='function'?sortedQueue():[];
  [...box.querySelectorAll('.queueCard54,.queueCard53,.queueCard')].forEach((card,i)=>{
   const meta=card.querySelector('.queueInfo53 .compactMeta53')||card.querySelector('.queueInfo53 .meta')||[...card.querySelectorAll('.meta')].find(x=>/대기/.test(String(x.textContent||'')));
   if(!meta)return;
   if(!meta.classList.contains('queueWaitMeta658'))meta.classList.add('queueWaitMeta658');
   let count=card.querySelector('.gamecnt');
   if(!count){
    const id=String(q[i]||'');
    const n=id&&typeof dailyCount==='function'?Math.max(0,Number(dailyCount(id))||0):0;
    count=document.createElement('span');count.className='gamecnt queueGameCount658';count.textContent=`게임 ${n}회`;
   }else if(!count.classList.contains('queueGameCount658'))count.classList.add('queueGameCount658');
   const waitSep=meta.querySelector('.waitSep70');
   if(waitSep){
    let sep=meta.querySelector('.queueMetaSep658');
    const already=count.parentNode===meta&&count.nextSibling===waitSep&&sep&&sep.parentNode===meta&&sep.nextSibling===count;
    if(!already){
     if(!sep){sep=document.createElement('span');sep.className='queueMetaSep658';sep.textContent='·'}
     waitSep.before(sep,count);
    }
   }else if(count.parentElement!==meta){
    let sep=meta.querySelector('.queueMetaSep658');if(!sep){sep=document.createElement('span');sep.className='queueMetaSep658';sep.textContent='·'}
    meta.append(sep,count);
   }
  });
 }catch{}
}
function frame658(){
 try{
  const isDev=me?.globalAdmin===true,root=document.documentElement;
  if(root.classList.contains('kokmatchDeveloper658')!==isDev)root.classList.toggle('kokmatchDeveloper658',isDev);
  document.querySelectorAll('#members .devChallenger658,#queue .devChallenger658,#playing .devChallenger658').forEach(el=>{
   const host=el.closest('.memberCard,.queueCard,.pendingSlot,.playingPlayer53,.p,.slot,.card');
   if(host&&!host.querySelector('.roleBadge.role-global'))el.classList.remove('devChallenger658');
  });
  document.querySelectorAll('.roleBadge.role-global').forEach(b=>{
   const host=b.closest('.memberCard,.queueCard,.pendingSlot,.playingPlayer53,.p,.slot,.card');if(!host)return;
   const av=host.querySelector(':scope > .profileIdentity21,:scope > .avatar,.profileIdentity21,.profileAvatar53,.profilePreview53,.avatar');
   if(av&&!av.classList.contains('devChallenger658'))av.classList.add('devChallenger658');
  });
  if(isDev){const mine=document.querySelector('#profileCard53 .profilePreview53');if(mine&&!mine.classList.contains('devChallenger658'))mine.classList.add('devChallenger658')}
 }catch{}
}
function purge658(){
 queued=false;
 try{
  document.querySelectorAll('.roleBadge.role-member44').forEach(b=>{
   const host=b.closest('.memberCard,.queueCard,.pendingSlot,.playingPlayer53,.p,.slot,.card');
   b.remove();
   if(host&&!host.querySelector('.roleBadge.role-global')){
    host.classList.remove('devChallenger658');
    host.querySelectorAll('.devChallenger658').forEach(x=>x.classList.remove('devChallenger658'));
   }
  });
 }catch{}
 queueMeta658();
 frame658();
}
function schedule658(){if(queued)return;queued=true;queueMicrotask(purge658)}
function arm658(){
 purge658();
 const root=document.body||document.documentElement;
 if(root)new MutationObserver(schedule658).observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
}
if(typeof renderSettings==='function'){
 const settingsLast658=renderSettings;
 renderSettings=function(...args){
  const r=settingsLast658.apply(this,args);
  const fix=()=>{try{frame658()}catch{}};
  queueMicrotask(fix);requestAnimationFrame(fix);setTimeout(fix,40);setTimeout(fix,180);
  return r;
 };
}
if(document.body)arm658();else addEventListener('DOMContentLoaded',arm658,{once:true});
})();
'''
p.write_text(s,encoding='utf-8')

css=Path('app-v6.58.css')
c=css.read_text(encoding='utf-8')
c += r'''

/* v6.58 render-proof developer self-profile frame. */
html.kokmatchDeveloper658 #profileCard53 .profilePreview53{
 border:2px solid #f1d06b!important;
 outline:2px solid #3e3279!important;
 outline-offset:1px!important;
 box-shadow:0 0 0 4px rgba(79,64,153,.18),0 0 13px rgba(91,207,255,.70),0 0 22px rgba(234,190,71,.36),inset 0 0 7px rgba(255,232,153,.52)!important;
 animation:devChallengerPulse658 2.8s ease-in-out infinite;
}
@media (prefers-reduced-motion:reduce){html.kokmatchDeveloper658 #profileCard53 .profilePreview53{animation:none}}
'''
css.write_text(c,encoding='utf-8')
print('v6.58 final idempotent badge, developer frame and queue metadata guards appended')
