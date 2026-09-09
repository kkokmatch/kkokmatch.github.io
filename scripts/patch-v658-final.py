from pathlib import Path

p=Path('app-v6.58.js')
s=p.read_text(encoding='utf-8')
s += r'''

/* v6.58 final ordinary-badge guard: older post-render layers may reinsert it. */
(()=>{
'use strict';
if(window.__kokmatchNoGeneralBadge658)return;
window.__kokmatchNoGeneralBadge658=true;
let queued=false;
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
print('v6.58 final ordinary badge guard appended')
