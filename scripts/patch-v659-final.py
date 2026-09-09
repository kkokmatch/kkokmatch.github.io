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

# The v6.58 runtime has highly specific !important developer-profile rules. Append an even
# more specific v6.59 profile-only crest rule after the full build so the old 2px glow can
# never override the new Challenger gold/cyan ring while the crystal wings remain intact.
css=Path('app-v6.59.css')
c=css.read_text(encoding='utf-8')
c += r'''

/* v6.59 final Challenger crest specificity lock. */
html body #profileCard53 .profilePreview53.devChallenger659,
html body #members .memberCard .profileIdentity21.devChallenger659,
html body #members .memberCard .profileAvatar53.devChallenger659,
html body #members .memberCard .avatar.devChallenger659,
html body #queue .profileIdentity21.devChallenger659,
html body #queue .profileAvatar53.devChallenger659,
html body #queue .avatar.devChallenger659,
html body #playing .profileIdentity21.devChallenger659,
html body #playing .profileAvatar53.devChallenger659,
html body #playing .avatar.devChallenger659{
 position:relative!important;
 overflow:visible!important;
 isolation:isolate!important;
 border:3px solid transparent!important;
 outline:1px solid rgba(93,226,255,.88)!important;
 outline-offset:1px!important;
 background:linear-gradient(#fff,#fff) padding-box,conic-gradient(from 35deg,#51e8ff 0 9%,#0b4f91 12% 22%,#e3c260 27% 39%,#fff0a6 42% 49%,#b8842d 52% 61%,#0c4c8c 68% 82%,#55e7ff 88% 100%) border-box!important;
 box-shadow:0 0 0 1px rgba(8,40,73,.95),0 0 8px rgba(55,215,255,.72),0 0 15px rgba(38,112,231,.42),inset 0 0 5px rgba(255,235,153,.35)!important;
 animation:challengerRing659 2.9s ease-in-out infinite!important;
 transform:none!important;
 z-index:1!important;
}
@media(prefers-reduced-motion:reduce){html body #profileCard53 .profilePreview53.devChallenger659{animation:none!important}}
'''
css.write_text(c,encoding='utf-8')
print('v6.59 linked-role permission, borderless roster cards, and Challenger crest specificity stabilized')
