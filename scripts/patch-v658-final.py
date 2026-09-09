from pathlib import Path

p=Path('app-v6.58.js')
s=p.read_text(encoding='utf-8')
s += r'''

/* v6.58 final ordinary-badge + personal queue metadata guard. */
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
   meta.classList.add('queueWaitMeta658');
   let count=card.querySelector('.gamecnt');
   if(!count){
    const id=String(q[i]||'');
    const n=id&&typeof dailyCount==='function'?Math.max(0,Number(dailyCount(id))||0):0;
    count=document.createElement('span');count.className='gamecnt';count.textContent=`게임 ${n}회`;
   }
   count.classList.add('queueGameCount658');
   if(count.parentElement!==meta){
    meta.querySelectorAll('.queueMetaSep658').forEach(x=>x.remove());
    const sep=document.createElement('span');sep.className='queueMetaSep658';sep.textContent='·';
    meta.append(sep,count);
   }
  });
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
}
function schedule658(){if(queued)return;queued=true;queueMicrotask(purge658)}
function arm658(){
 purge658();
 const root=document.body||document.documentElement;
 if(root)new MutationObserver(schedule658).observe(root,{childList:true,subtree:true});
}
if(document.body)arm658();else addEventListener('DOMContentLoaded',arm658,{once:true});
})();
'''
p.write_text(s,encoding='utf-8')
print('v6.58 final badge and queue metadata guards appended')
