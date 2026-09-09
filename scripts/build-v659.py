from pathlib import Path
import json, shutil

OLD='6.58'; NEW='6.59'
root=Path('.')

# Archive the exact live v6.58 runtime before producing the next standalone build.
arc=root/'versions'/'v6.58'
arc.mkdir(parents=True,exist_ok=True)
for src,name in [
    ('app-v6.58.js','app-v6.58.js'),('app-v6.58.css','app-v6.58.css'),
    ('index.html','index.html'),('latest-version.json','latest-version.json'),
    ('manifest.webmanifest','manifest.webmanifest'),('kokmatch-sw.js','kokmatch-sw.js'),('sw.js','sw.js')]:
    p=root/src
    if p.exists() and not (arc/name).exists(): shutil.copy2(p,arc/name)

# Copy the current single runtime, then bump only the visible/runtime version literals.
js=(root/'app-v6.58.js').read_text(encoding='utf-8').replace(OLD,NEW)
css=(root/'app-v6.58.css').read_text(encoding='utf-8').replace(OLD,NEW)

# Replace the game-waiting automatic assignment card with a compact, button-first single row.
start=js.find('function autoQueueHtml658(){')
end=js.find('\nfunction paintAutoQueue658(){',start)
if start<0 or end<0: raise SystemExit('autoQueueHtml658 block not found')
compact=r'''function autoQueueHtml658(){
 const c=cfg658(),on=c.enabled;
 return `<div class="card autoGameCard656 autoGameQueue658 compactAuto659 ${on?'on':'off'}">
   <div class="autoGameCompact659">
    <b class="autoGameLabel659">자동게임편성</b>
    <div class="autoGameActions659">
     <button type="button" class="btn ghost autoSettingsBtn656 autoSettingsBtn659" onclick="openAutoGameSettings656()">설정</button>
     <button type="button" class="autoToggle656 ${on?'on':''}" onclick="toggleAutoGame656()" aria-label="자동게임편성 ${on?'켜짐':'꺼짐'}"><span>${on?'ON':'OFF'}</span><i></i></button>
    </div>
   </div>
  </div>`;
}'''
js=js[:start]+compact+js[end:]

# Add a new, isolated Challenger-inspired profile-only frame layer.
js += r'''

/* v6.59 compact auto control + Challenger crest profile frame. */
(()=>{
'use strict';
window.__kokmatchUiRefine659='6.59';
let frameQueued659=false;
function linkedDev659(){
 try{
  const linked=me?.memberId&&typeof M==='function'?M(String(me.memberId)):null;
  return me?.globalAdmin===true||String(me?.role||'')==='admin'||String(linked?.role||'')==='admin';
 }catch{return me?.globalAdmin===true||String(me?.role||'')==='admin'}
}
function profileTarget659(host){
 if(!host)return null;
 return host.querySelector(':scope > .profileIdentity21,:scope > .profileAvatar53,:scope > .avatar,.profileIdentity21,.profileAvatar53,.avatar,.profilePreview53');
}
function applyChallenger659(){
 frameQueued659=false;
 try{
  const isDev=linkedDev659();
  document.documentElement.classList.toggle('kokmatchDeveloper659',isDev);
  document.querySelectorAll('.devChallenger659').forEach(el=>{
   if(el.closest('#profileCard53')){if(!isDev)el.classList.remove('devChallenger659');return}
   const host=el.closest('.memberCard,.queueCard,.pendingSlot,.playingPlayer53,.p,.slot,.card');
   if(host&&!host.querySelector('.roleBadge.role-global'))el.classList.remove('devChallenger659');
  });
  document.querySelectorAll('.roleBadge.role-global').forEach(b=>{
   const host=b.closest('.memberCard,.queueCard,.pendingSlot,.playingPlayer53,.p,.slot,.card');
   const target=profileTarget659(host);if(target)target.classList.add('devChallenger659');
  });
  const mine=document.querySelector('#profileCard53 .profilePreview53');
  if(mine)mine.classList.toggle('devChallenger659',isDev);
 }catch{}
}
function queueFrame659(){if(frameQueued659)return;frameQueued659=true;queueMicrotask(applyChallenger659)}
window.__kokmatchApplyChallenger659=applyChallenger659;
for(const name of ['renderMembers','renderQueue','renderPlaying','renderSettings']){
 try{
  const prev=eval(name);if(typeof prev!=='function')continue;
  const wrapped=function(...args){const r=prev.apply(this,args);queueFrame659();return r};
  eval(name+'=wrapped');
 }catch{}
}
try{paintAutoQueue658()}catch{}
applyChallenger659();
const root=document.body||document.documentElement;
if(root)new MutationObserver(queueFrame659).observe(root,{childList:true,subtree:true});
})();
'''

css += r'''

/* v6.59 compact waiting controls. */
.autoGameQueue658.compactAuto659{padding:9px 10px!important;margin:0 0 8px!important;border-radius:14px!important;background:linear-gradient(145deg,#fff,#f7f9ff)!important;box-shadow:none!important}
.autoGameQueue658.compactAuto659.on{background:linear-gradient(145deg,#fbfffd,#f2fbf6)!important}
.autoGameCompact659{display:flex;align-items:center;justify-content:space-between;gap:9px;min-height:40px}
.autoGameLabel659{font-size:13px;white-space:nowrap}
.autoGameActions659{display:flex;align-items:center;gap:7px;margin-left:auto}
.autoGameQueue658 .autoSettingsBtn659{width:auto!important;margin:0!important;padding:7px 10px!important;border-radius:10px!important;font-size:11px!important;line-height:1!important;white-space:nowrap}
.autoGameQueue658.compactAuto659 .autoToggle656{width:70px!important;min-width:70px!important;height:34px!important;padding-top:3px!important;padding-bottom:3px!important}
.autoGameQueue658.compactAuto659 .autoToggle656 i{width:28px!important;height:28px!important}
.autoGameQueue658.compactAuto659 .autoGameDesc656,.autoGameQueue658.compactAuto659 .autoBy656,.autoGameQueue658.compactAuto659 .autoPill656{display:none!important}
@media(max-width:370px){.autoGameQueue658.compactAuto659{padding:8px!important}.autoGameLabel659{font-size:12px}.autoGameActions659{gap:5px}.autoGameQueue658 .autoSettingsBtn659{padding:7px 8px!important}.autoGameQueue658.compactAuto659 .autoToggle656{width:66px!important;min-width:66px!important}}

/* v6.59 member list cards stay clean: no rectangular outline. */
#members .memberCard{border:0!important;box-shadow:none!important}
#members .memberCard.devChallenger658,#members .memberCard.devChallenger659{border:0!important;outline:0!important;box-shadow:none!important}

/* Neutralize the v6.58 glow so only the new profile-photo crest remains visible. */
.devChallenger658{border-color:transparent!important;outline:0!important;box-shadow:none!important;animation:none!important;transform:none!important}
html.kokmatchDeveloper658 #profileCard53 .profilePreview53{outline:0!important;box-shadow:none!important;animation:none!important}

/* v6.59 Challenger-inspired profile crest: gold ring + cyan/blue crystalline wings. */
.devChallenger659,#profileCard53 .profilePreview53.devChallenger659{
 position:relative!important;
 overflow:visible!important;
 isolation:isolate!important;
 border:3px solid transparent!important;
 outline:1px solid rgba(93,226,255,.88)!important;
 outline-offset:1px!important;
 background:linear-gradient(#fff,#fff) padding-box,conic-gradient(from 35deg,#51e8ff 0 9%,#0b4f91 12% 22%,#e3c260 27% 39%,#fff0a6 42% 49%,#b8842d 52% 61%,#0c4c8c 68% 82%,#55e7ff 88% 100%) border-box!important;
 box-shadow:0 0 0 1px rgba(8,40,73,.95),0 0 8px rgba(55,215,255,.72),0 0 15px rgba(38,112,231,.42),inset 0 0 5px rgba(255,235,153,.35)!important;
 animation:challengerRing659 2.9s ease-in-out infinite!important;
 z-index:1!important;
}
.devChallenger659::before,.devChallenger659::after{
 content:""!important;
 position:absolute!important;
 top:-16%!important;
 width:58%!important;
 height:132%!important;
 pointer-events:none!important;
 z-index:1!important;
 background:linear-gradient(152deg,rgba(96,239,255,.98) 0 6%,#123f77 7% 21%,#2b8ed0 22% 31%,#e7c665 32% 43%,#704b18 44% 50%,#114f8e 51% 66%,#55e9ff 67% 75%,#0a315f 76% 88%,rgba(79,220,255,.92) 89% 100%)!important;
 clip-path:polygon(100% 15%,74% 0,67% 23%,42% 10%,48% 39%,12% 28%,37% 55%,4% 59%,39% 72%,22% 88%,63% 79%,77% 100%,88% 70%,100% 62%)!important;
 filter:drop-shadow(0 0 2px rgba(80,230,255,.95)) drop-shadow(0 0 5px rgba(31,104,222,.52))!important;
 animation:challengerWing659 2.9s ease-in-out infinite!important;
}
.devChallenger659::before{left:-42%!important;transform:rotate(-4deg)!important;transform-origin:100% 55%!important}
.devChallenger659::after{right:-42%!important;transform:scaleX(-1) rotate(-4deg)!important;transform-origin:0 55%!important}
.devChallenger659>img,.devChallenger659>.profileFallback21,.devChallenger659>.genderPersonIcon21{position:relative!important;z-index:3!important;border-radius:50%!important}
@keyframes challengerRing659{0%,100%{box-shadow:0 0 0 1px rgba(8,40,73,.95),0 0 7px rgba(55,215,255,.58),0 0 13px rgba(38,112,231,.34),inset 0 0 4px rgba(255,235,153,.30)}50%{box-shadow:0 0 0 1px rgba(8,40,73,.95),0 0 11px rgba(78,230,255,.88),0 0 19px rgba(46,126,242,.52),inset 0 0 7px rgba(255,239,168,.46)}}
@keyframes challengerWing659{0%,100%{filter:drop-shadow(0 0 2px rgba(80,230,255,.82)) drop-shadow(0 0 4px rgba(31,104,222,.42))}50%{filter:drop-shadow(0 0 4px rgba(103,240,255,1)) drop-shadow(0 0 8px rgba(38,116,239,.68))}}
@media(prefers-reduced-motion:reduce){.devChallenger659,.devChallenger659::before,.devChallenger659::after{animation:none!important}}
'''

(root/'app-v6.59.js').write_text(js,encoding='utf-8')
(root/'app-v6.59.css').write_text(css,encoding='utf-8')

# Update the standalone entry, PWA metadata and both service-worker entries.
idx=(root/'index.html').read_text(encoding='utf-8').replace('6.58','6.59').replace('v658','v659')
(root/'index.html').write_text(idx,encoding='utf-8')
for name in ['manifest.webmanifest','kokmatch-sw.js','sw.js']:
    p=root/name
    p.write_text(p.read_text(encoding='utf-8').replace('6.58','6.59'),encoding='utf-8')

latest={
 'version':99,'label':'v6.59','semanticVersion':'6.59','build':'v6.59',
 'updatedAt':'2026-09-09T12:23:00+09:00',
 'note':'v6.59 자동편성 카드 초슬림화 · 회원명부 카드 외곽선 제거 · LoL 챌린저 크레스트형 개발자 프로필 프레임'
}
(root/'latest-version.json').write_text(json.dumps(latest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('v6.59 build prepared')
