from pathlib import Path
import json, shutil

OLD='6.63'
NEW='6.64'

# Archive the exact v6.63 production runtime before switching the entrypoint.
archive=Path('versions/v6.63')
archive.mkdir(parents=True,exist_ok=True)
for name in ['app-v6.63.js','app-v6.63.css','index.html','latest-version.json','manifest.webmanifest','kokmatch-sw.js','sw.js']:
    p=Path(name)
    if p.exists(): shutil.copy2(p,archive/p.name)

js=Path('app-v6.63.js').read_text(encoding='utf-8').replace(OLD,NEW)
js += r'''

/* v6.64: manager gold aura + organizer silver aura */
(()=>{
'use strict';
if(window.__kokmatchRoleAura664)return;
window.__kokmatchRoleAura664='6.64';
const SRC='/assets/dev-prism-frame-v662.webp?v=6.64';
let queued=false;
function role664(id){
 try{const m=typeof M==='function'?M(String(id||'')):null;const r=String(m?.role||'');return r==='manager'||r==='organizer'?r:''}catch{return ''}
}
function target664(host){
 if(!host)return null;
 return host.querySelector(':scope > .profileIdentity21,:scope > .profileAvatar53,:scope > .avatar,.profileIdentity21,.profileAvatar53,.avatar,.profilePreview53');
}
function id664(host,target){
 return String(target?.getAttribute?.('data-member-id')||host?.getAttribute?.('data-member-id')||host?.getAttribute?.('data-member-id22')||host?.getAttribute?.('data-member-id46')||host?.getAttribute?.('data-member-id80')||'');
}
function ensure664(target,role){
 if(!target)return;
 const active=role==='manager'||role==='organizer';
 target.classList.toggle('roleAuraManager664',role==='manager');
 target.classList.toggle('roleAuraOrganizer664',role==='organizer');
 const frames=[...target.querySelectorAll(':scope > img.roleAura664')];
 if(!active){frames.forEach(x=>x.remove());return}
 let frame=frames[0]||null;frames.slice(1).forEach(x=>x.remove());
 if(!frame){frame=document.createElement('img');frame.alt='';frame.setAttribute('aria-hidden','true');frame.draggable=false;frame.decoding='async';target.appendChild(frame)}
 frame.className='roleAura664 '+(role==='manager'?'roleAuraManagerImg664':'roleAuraOrganizerImg664');
 frame.dataset.roleAura664=role;
 if(frame.getAttribute('src')!==SRC)frame.src=SRC;
}
function sync664(){
 queued=false;
 try{
  const seen=new Set();
  document.querySelectorAll('.memberCard,.queueCard,.pendingSlot,.playingPlayer53,.p,.slot').forEach(host=>{
   const target=target664(host);if(!target||seen.has(target))return;seen.add(target);
   let role=role664(id664(host,target));
   if(!role){if(host.querySelector('.roleBadge.role-manager'))role='manager';else if(host.querySelector('.roleBadge.role-organizer'))role='organizer'}
   ensure664(target,role);
  });
  document.querySelectorAll('.profileIdentity21[data-member-id],.profileAvatar53[data-member-id],.avatar[data-member-id]').forEach(target=>{if(seen.has(target))return;seen.add(target);ensure664(target,role664(target.getAttribute('data-member-id')))});
  const mine=document.querySelector('#profileCard53 .profilePreview53');
  if(mine){const linked=me?.memberId&&typeof M==='function'?M(String(me.memberId)):null;const r=String(linked?.role||me?.role||'');ensure664(mine,r==='manager'||r==='organizer'?r:'')}
  document.querySelectorAll('img.roleAura664').forEach(img=>{const p=img.parentElement;if(!p||(!p.classList.contains('roleAuraManager664')&&!p.classList.contains('roleAuraOrganizer664')))img.remove()});
 }catch{}
}
function schedule664(){if(queued)return;queued=true;requestAnimationFrame(sync664)}
window.__kokmatchSyncRoleAura664=sync664;
const boot=()=>{try{new MutationObserver(schedule664).observe(document.body,{childList:true,subtree:true})}catch{}schedule664();setTimeout(schedule664,120);setTimeout(schedule664,450)};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
'''
Path('app-v6.64.js').write_text(js,encoding='utf-8')

css=Path('app-v6.63.css').read_text(encoding='utf-8').replace(OLD,NEW)
css += r'''

/* v6.64: soft gold/silver role aura; developer rainbow prism remains unchanged. */
html body .roleAuraManager664,html body .roleAuraOrganizer664{position:relative!important;overflow:visible!important}
html body img.roleAura664{position:absolute!important;left:50%!important;top:50%!important;transform:translate(-50%,-50%)!important;width:138%!important;height:138%!important;object-fit:contain!important;pointer-events:none!important;z-index:20!important;border:0!important;border-radius:0!important;background:transparent!important}
html body img.roleAuraManagerImg664{opacity:.34!important;filter:sepia(1) saturate(4.6) hue-rotate(345deg) brightness(1.12) drop-shadow(0 0 4px rgba(241,188,68,.14)) drop-shadow(0 0 10px rgba(255,218,125,.10))!important}
html body img.roleAuraOrganizerImg664{opacity:.31!important;filter:grayscale(1) brightness(1.36) contrast(.84) drop-shadow(0 0 4px rgba(210,220,235,.14)) drop-shadow(0 0 10px rgba(232,239,250,.09))!important}
@media(max-width:430px){html body img.roleAuraManagerImg664{width:136%!important;height:136%!important;opacity:.32!important}html body img.roleAuraOrganizerImg664{width:136%!important;height:136%!important;opacity:.29!important}}

/* v6.64: manager/organizer badges join the developer crystal-material family. */
.roleBadge.role-manager,.roleBadge.role-organizer{--km-role-crystal-v664:1;display:inline-block!important;position:relative!important;box-sizing:border-box!important;border-radius:999px!important;padding:3px 7px!important;font-size:11px!important;font-weight:900!important;line-height:normal!important;margin-left:4px!important;vertical-align:middle!important;overflow:hidden!important}
.roleBadge.role-manager{background-color:#3e5eb8!important;background-image:linear-gradient(112deg,rgba(255,255,255,.46) 0 8%,transparent 9% 31%,rgba(255,255,255,.13) 32% 47%,transparent 48%),linear-gradient(135deg,#244b9b 0%,#7bcaff 32%,#4d80ce 60%,#294f9f 100%)!important;color:#f8fdff!important;border:1px solid rgba(151,215,255,.78)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.65),inset 0 -1px 0 rgba(25,65,140,.23),0 1px 3px rgba(38,89,168,.13)!important;text-shadow:0 1px 1px rgba(20,61,128,.24)!important}
.roleBadge.role-organizer{background-color:#b85d00!important;background-image:linear-gradient(112deg,rgba(255,255,255,.45) 0 8%,transparent 9% 31%,rgba(255,255,255,.13) 32% 47%,transparent 48%),linear-gradient(135deg,#a54906 0%,#ffc17b 33%,#e9852c 61%,#a54a08 100%)!important;color:#fffaf5!important;border:1px solid rgba(245,181,112,.82)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.61),inset 0 -1px 0 rgba(130,59,0,.22),0 1px 3px rgba(158,73,12,.13)!important;text-shadow:0 1px 1px rgba(103,45,0,.23)!important}
'''
Path('app-v6.64.css').write_text(css,encoding='utf-8')

idx=Path('index.html').read_text(encoding='utf-8').replace(OLD,NEW).replace('single-v663','single-v664').replace('session-coordinator-v663','session-coordinator-v664')
Path('index.html').write_text(idx,encoding='utf-8')
Path('latest-version.json').write_text(json.dumps({'version':104,'label':'v6.64','semanticVersion':'6.64','build':'v6.64','updatedAt':'2026-09-09T16:34:00+09:00','note':'v6.64 모임장 금빛 오라 · 운영진 은빛 오라 · 역할 배지 크리스털 질감 통일'},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
for name in ['manifest.webmanifest','kokmatch-sw.js','sw.js']:
 p=Path(name);p.write_text(p.read_text(encoding='utf-8').replace(OLD,NEW),encoding='utf-8')
print('prepared v6.64')
