from pathlib import Path
from datetime import datetime
from zoneinfo import ZoneInfo
import json, shutil

ROOT=Path('.')
OLD='6.57'; NEW='6.58'
old_js=ROOT/f'app-v{OLD}.js'; old_css=ROOT/f'app-v{OLD}.css'
new_js=ROOT/f'app-v{NEW}.js'; new_css=ROOT/f'app-v{NEW}.css'
assert old_js.exists() and old_css.exists(), 'v6.57 runtime missing'

arc=ROOT/'versions'/f'v{OLD}'
arc.mkdir(parents=True,exist_ok=True)
for p in [old_js,old_css,ROOT/'index.html',ROOT/'kokmatch-sw.js',ROOT/'sw.js',ROOT/'manifest.webmanifest',ROOT/'latest-version.json']:
    if p.exists(): shutil.copy2(p,arc/p.name)

js=old_js.read_text(encoding='utf-8').replace(OLD,NEW)
css=old_css.read_text(encoding='utf-8').replace(OLD,NEW)

addon=r'''

/* v6.58: waiting-screen auto controls, clean member badges, developer challenger frame, queue meta alignment. */
(()=>{
'use strict';
if(window.__kokmatchUiRefine658)return;
window.__kokmatchUiRefine658='6.58';

function staff658(){return !!me&&(me.globalAdmin===true||me.role==='manager'||me.role==='organizer')}
function role658(r){return r==='admin'?'개발자':r==='manager'?'모임장':r==='organizer'?'운영진':String(r||'')}
function e658(v){try{return typeof esc==='function'?esc(v):String(v??'')}catch{return String(v??'')}}
function cfg658(){const c=S?.autoGame&&typeof S.autoGame==='object'?S.autoGame:{};return {enabled:c.enabled===true,updatedBy:c.updatedBy&&typeof c.updatedBy==='object'?c.updatedBy:{}}}

function stripGeneral658(root=document){
 try{root.querySelectorAll?.('.roleBadge.role-member44').forEach(x=>x.remove())}catch{}
}
function devFrame658(root=document){
 try{
  root.querySelectorAll?.('.devChallenger658').forEach(x=>x.classList.remove('devChallenger658'));
  root.querySelectorAll?.('.roleBadge.role-global').forEach(b=>{
   const host=b.closest('.memberCard,.queueCard,.pendingSlot,.playingPlayer53,.p,.slot,.card');
   const av=host?.querySelector('.profileIdentity21,.profileAvatar53,.avatar,.profilePreview53');
   if(av)av.classList.add('devChallenger658');
  });
  if(me?.globalAdmin===true){
   const mine=document.querySelector('#profileCard53 .profilePreview53');
   if(mine)mine.classList.add('devChallenger658');
   document.querySelectorAll?.('[data-member-id]').forEach(el=>{
    const id=String(el.getAttribute('data-member-id')||''),m=typeof M==='function'?M(id):null;
    if(m&&String(m.role||'')==='admin')el.classList.add('devChallenger658');
   });
  }
 }catch{}
}

function moveQueueCount658(){
 const box=document.getElementById('queue');if(!box)return;
 box.querySelectorAll('.queueCard').forEach(card=>{
  const count=card.querySelector('.gamecnt');if(!count)return;
  const meta=[...card.querySelectorAll('.meta')].find(x=>/대기/.test(String(x.textContent||'')));
  if(!meta||count.parentElement===meta)return;
  meta.classList.add('queueWaitMeta658');
  const sep=document.createElement('span');sep.className='queueMetaSep658';sep.textContent='·';
  count.classList.add('queueGameCount658');
  meta.append(sep,count);
 });
}

function autoQueueHtml658(){
 const c=cfg658(),u=c.updatedBy||{},on=c.enabled;
 return `<div class="card autoGameCard656 autoGameQueue658 ${on?'on':'off'}">
   <div class="autoGameTop656"><div><div class="autoGameTitle656"><b>자동게임편성</b><span class="autoPill656">AI 자동 최적화</span></div><div class="meta">게임대기 운영 · 개발자 · 모임장 · 운영진</div></div>
   <button type="button" class="autoToggle656 ${on?'on':''}" onclick="toggleAutoGame656()"><span>${on?'ON':'OFF'}</span><i></i></button></div>
   <div class="autoGameDesc656">${on?'현재 대기상황을 분석해 필요한 게임을 자동으로 편성합니다.':'OFF · 직접 편성 모드입니다.'}</div>
   ${u.name?`<div class="meta autoBy656">마지막 설정 · ${e658(u.name)} · ${e658(u.roleLabel||role658(u.role))}</div>`:''}
   <button type="button" class="btn ghost autoSettingsBtn656" onclick="openAutoGameSettings656()">자동게임설정 보기</button>
  </div>`;
}
function paintAutoQueue658(){
 const box=document.getElementById('queue');if(!box)return;
 box.querySelector('.autoGameQueue658')?.remove();
 if(!staff658())return;
 const h=document.createElement('div');h.innerHTML=autoQueueHtml658();const card=h.firstElementChild;if(!card)return;
 const title=box.querySelector(':scope > .title');
 if(title)title.insertAdjacentElement('afterend',card);else box.prepend(card);
}
function removeSettingsAuto658(){document.querySelector('#settings .autoGameCard656')?.remove()}
function polish658(root=document){stripGeneral658(root);devFrame658(root);moveQueueCount658();paintAutoQueue658();removeSettingsAuto658()}
window.__kokmatchPolish658=polish658;

const membersBefore658=renderMembers;
renderMembers=function(...args){const r=membersBefore658.apply(this,args);stripGeneral658(document.getElementById('members')||document);devFrame658(document.getElementById('members')||document);return r};
const queueBefore658=renderQueue;
renderQueue=function(...args){const r=queueBefore658.apply(this,args);stripGeneral658(document.getElementById('queue')||document);moveQueueCount658();paintAutoQueue658();devFrame658(document.getElementById('queue')||document);return r};
if(typeof renderPlaying==='function'){
 const playingBefore658=renderPlaying;
 renderPlaying=function(...args){const r=playingBefore658.apply(this,args);stripGeneral658(document.getElementById('playing')||document);devFrame658(document.getElementById('playing')||document);return r};
}
const settingsBefore658=renderSettings;
renderSettings=function(...args){const r=settingsBefore658.apply(this,args);removeSettingsAuto658();devFrame658(document.getElementById('settings')||document);return r};

if(typeof window.toggleAutoGame656==='function'){
 const toggleBefore658=window.toggleAutoGame656;
 window.toggleAutoGame656=async function(...args){const r=await toggleBefore658.apply(this,args);removeSettingsAuto658();if(currentView==='queue')renderQueue();return r};
}

const renderAllBefore658=renderAll;
renderAll=function(...args){const r=renderAllBefore658.apply(this,args);polish658(document);return r};

const goViewBefore658=goView;
goView=function(id,...args){const r=goViewBefore658.call(this,id,...args);if(id==='queue')queueMicrotask(()=>{try{paintAutoQueue658();moveQueueCount658();stripGeneral658(document.getElementById('queue')||document);devFrame658(document.getElementById('queue')||document)}catch{}});if(id==='settings')queueMicrotask(removeSettingsAuto658);return r};

queueMicrotask(()=>{if(me)polish658(document)});
})();
'''
js += addon

css += r'''

/* v6.58 UI refinements */
.autoGameQueue658{margin:0 0 12px;border-color:#b8c7ef;background:linear-gradient(145deg,#ffffff,#f6f8ff)}
.autoGameQueue658.on{box-shadow:0 5px 18px rgba(36,83,212,.10)}
.autoGameQueue658 .autoGameDesc656{margin-top:8px}
.autoGameQueue658 .autoSettingsBtn656{width:100%;margin-top:9px}
.queueWaitMeta658{display:flex!important;align-items:center;gap:6px;flex-wrap:wrap}
.queueMetaSep658{color:#a0a9ba;font-weight:800}
.queueGameCount658{margin-left:0!important;vertical-align:middle!important;white-space:nowrap}
.devChallenger658{border:2px solid #f1d06b!important;outline:2px solid #3e3279!important;outline-offset:1px!important;box-shadow:0 0 0 4px rgba(79,64,153,.18),0 0 13px rgba(91,207,255,.70),0 0 22px rgba(234,190,71,.36),inset 0 0 7px rgba(255,232,153,.52)!important;animation:devChallengerPulse658 2.8s ease-in-out infinite;transform:translateZ(0)}
@keyframes devChallengerPulse658{0%,100%{box-shadow:0 0 0 4px rgba(79,64,153,.16),0 0 10px rgba(91,207,255,.52),0 0 18px rgba(234,190,71,.30),inset 0 0 6px rgba(255,232,153,.44)}50%{box-shadow:0 0 0 4px rgba(79,64,153,.25),0 0 17px rgba(91,207,255,.82),0 0 28px rgba(234,190,71,.50),inset 0 0 9px rgba(255,232,153,.64)}}
@media (prefers-reduced-motion:reduce){.devChallenger658{animation:none}}
@media(max-width:430px){.autoGameQueue658{padding:12px}.autoGameQueue658 .autoGameTitle656{gap:5px}.autoGameQueue658 .autoPill656{font-size:9px}}
'''

new_js.write_text(js,encoding='utf-8')
new_css.write_text(css,encoding='utf-8')

idx=(ROOT/'index.html').read_text(encoding='utf-8').replace(OLD,NEW)
idx=idx.replace('single-v657','single-v658').replace('session-coordinator-v657','session-coordinator-v658')
(ROOT/'index.html').write_text(idx,encoding='utf-8')
for name in ['kokmatch-sw.js','sw.js','manifest.webmanifest']:
    p=ROOT/name
    if p.exists():p.write_text(p.read_text(encoding='utf-8').replace(OLD,NEW),encoding='utf-8')

latest={
 'version':98,'label':'v6.58','semanticVersion':'6.58','build':'v6.58',
 'updatedAt':datetime.now(ZoneInfo('Asia/Seoul')).isoformat(timespec='seconds'),
 'note':'v6.58 자동편성 게임대기 화면 이동 · 일반회원 배지 제거 · 개발자 챌린저 프로필 프레임 · 대기시간 우측 게임횟수 배치'
}
(ROOT/'latest-version.json').write_text(json.dumps(latest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

assert "window.__kokmatchUiRefine658='6.58'" in js
assert 'autoGameQueue658' in js and 'queueGameCount658' in js and 'devChallenger658' in js
assert 'app-v6.58.js?v=6.58' in idx and 'app-v6.58.css?v=6.58' in idx
print('v6.58 UI refinement build OK')
