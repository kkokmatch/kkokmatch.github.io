from pathlib import Path

p=Path('app-v6.59.js')
s=p.read_text(encoding='utf-8')
old="function canAuto659(){return !!me&&(me.globalAdmin===true||me.role==='manager'||me.role==='organizer')}"
new="function canAuto659(){try{const linked=me?.memberId&&typeof M==='function'?M(String(me.memberId)):null;const roles=[String(me?.role||''),String(linked?.role||'')];return !!me&&(me.globalAdmin===true||roles.some(r=>r==='admin'||r==='manager'||r==='organizer'))}catch{return !!me&&(me.globalAdmin===true||me.role==='manager'||me.role==='organizer')}}"
if old not in s: raise SystemExit('canAuto659 target not found')
s=s.replace(old,new,1)
s += r'''

/* v6.59 final roster-card cleanup: no rectangular border/accent survives legacy render styles. */
(()=>{
 'use strict';
 function cleanRosterCards659(){
  try{
   document.querySelectorAll('#members .memberCard').forEach(card=>{
    card.style.setProperty('border','0','important');
    card.style.setProperty('border-left','0','important');
    card.style.setProperty('border-right','0','important');
    card.style.setProperty('border-top','0','important');
    card.style.setProperty('border-bottom','0','important');
    card.style.setProperty('outline','0','important');
    card.style.setProperty('box-shadow','none','important');
   });
  }catch{}
 }
 window.__kokmatchCleanRosterCards659=cleanRosterCards659;
 try{
  const prev=renderMembers;
  renderMembers=function(...args){const r=prev.apply(this,args);cleanRosterCards659();queueMicrotask(cleanRosterCards659);return r};
 }catch{}
 cleanRosterCards659();
})();
'''
p.write_text(s,encoding='utf-8')
print('v6.59 linked-role permission and borderless roster cards stabilized')
