from pathlib import Path
import json, re
from datetime import datetime
from zoneinfo import ZoneInfo

root=Path('.')
js42=(root/'app-v6.42.js').read_text(encoding='utf-8')
css42=(root/'app-v6.42.css').read_text(encoding='utf-8')

# Archive v6.42 before producing the next single runtime.
archive=root/'versions'/'v6.42'
archive.mkdir(parents=True,exist_ok=True)
(archive/'app-v6.42.js').write_text(js42,encoding='utf-8')
(archive/'app-v6.42.css').write_text(css42,encoding='utf-8')
idx42=(root/'index.html').read_text(encoding='utf-8')
arch_idx=idx42.replace('/app-v6.42.css?v=6.42','./app-v6.42.css?v=6.42').replace('/app-v6.42.js?v=6.42','./app-v6.42.js?v=6.42')
(archive/'index.html').write_text(arch_idx,encoding='utf-8')

# Start from the current single runtime.
js43=js42.replace('v6.42 early resume guard','v6.43 early resume guard').replace("window.__kokmatchStandalone='6.42'","window.__kokmatchStandalone='6.43'").replace("window.__kokmatchVersionLock='6.42'","window.__kokmatchVersionLock='6.43'").replace("sessionStorage.setItem('kokmatch_runtime_version','6.42')","sessionStorage.setItem('kokmatch_runtime_version','6.43')")

old='''/* KokMatch v6.42: white member/queue cards + right-side queue grade stripe. */
(()=>{
'use strict';
if(window.__kokmatchQueueGrade642)return;
window.__kokmatchQueueGrade642=true;
function grade642(m){
 const g=String(m?.cls||'').trim().toUpperCase();
 return /^[A-E]$/.test(g)?g:'';
}
function decorateQueueGrade642(){
 const box=document.getElementById('queue');if(!box)return;
 let ids=[];try{ids=typeof sortedQueue==='function'?sortedQueue():[]}catch{ids=[]}
 const cards=[...box.querySelectorAll('.queueCard54')];
 cards.forEach((card,i)=>{
  const id=ids[i],m=id&&typeof M==='function'?M(id):null,g=grade642(m);
  if(g)card.dataset.queueGrade642=g;else delete card.dataset.queueGrade642;
 });
}
const renderQueue641=renderQueue;
renderQueue=function(...args){const r=renderQueue641.apply(this,args);decorateQueueGrade642();return r};
window.__kokmatchDecorateQueueGrade642=decorateQueueGrade642;
try{if(me)decorateQueueGrade642()}catch{}
})();
'''
new='''/* KokMatch v6.43: unified white cards + grade stripe + faint grade watermark. */
(()=>{
'use strict';
if(window.__kokmatchGradeCards643)return;
window.__kokmatchGradeCards643=true;
function grade643(m){
 const g=String(m?.cls||'').trim().toUpperCase();
 return /^[A-E]$/.test(g)?g:'';
}
function setGrade643(el,g){
 if(!el)return;
 if(g)el.dataset.grade643=g;else delete el.dataset.grade643;
}
function decorateGradeCards643(){
 const members=document.getElementById('members');
 if(members){
  [...members.querySelectorAll('.memberCard')].forEach(card=>{
   let g=String(card.dataset.gradeV6||card.dataset.grade22||'').trim().toUpperCase();
   if(!/^[A-E]$/.test(g)){
    const id=String(card.dataset.memberId22||card.dataset.memberId||card.dataset.memberId46||'');
    g=grade643(id&&typeof M==='function'?M(id):null);
   }
   setGrade643(card,g);
  });
 }
 const box=document.getElementById('queue');if(!box)return;
 let ids=[];try{ids=typeof sortedQueue==='function'?sortedQueue():[]}catch{ids=[]}
 [...box.querySelectorAll('.queueCard54')].forEach((card,i)=>{
  const id=ids[i],m=id&&typeof M==='function'?M(id):null;
  setGrade643(card,grade643(m));
 });
 [...box.querySelectorAll('.composer54 .slot54')].forEach((slot,i)=>{
  const id=Array.isArray(draft)?draft[i]:null;
  setGrade643(slot,grade643(id&&typeof M==='function'?M(id):null));
 });
 [...box.querySelectorAll('.pendingCard54')].forEach((card,gi)=>{
  const pg=Array.isArray(S?.pendingGames)?S.pendingGames[gi]:null;
  const filled=[...card.querySelectorAll('.pendingSlot54:not(.emptySlot)')];
  filled.forEach((slot,pi)=>setGrade643(slot,grade643(typeof M==='function'?M(pg?.players?.[pi]):null)));
 });
}
const renderMembers642=renderMembers;
renderMembers=function(...args){const r=renderMembers642.apply(this,args);decorateGradeCards643();return r};
const renderQueue642=renderQueue;
renderQueue=function(...args){const r=renderQueue642.apply(this,args);decorateGradeCards643();return r};
window.__kokmatchDecorateGradeCards643=decorateGradeCards643;
try{if(me)decorateGradeCards643()}catch{}
})();
'''
if old not in js43:
    raise SystemExit('v6.42 grade decorator block not found')
js43=js43.replace(old,new,1)
(root/'app-v6.43.js').write_text(js43,encoding='utf-8')

# Remove the old v6.42 card-style tail and replace it with one canonical v6.43 block.
marker='/* KokMatch v6.42: neutral white cards; member stripe stays left, personal queue stripe moves to right. */'
pos=css42.rfind(marker)
if pos<0:
    raise SystemExit('v6.42 CSS marker not found')
base_css=css42[:pos].rstrip()+"\n\n"
css43=base_css+r'''/* KokMatch v6.43: unified white grade cards. */
#members .memberCard[data-grade643],
#queue .queueCard54[data-grade643],
#queue .composer54 .slot54.filled[data-grade643],
#queue .pendingCard54 .pendingSlot54:not(.emptySlot)[data-grade643]{
  background:#fff!important;
  position:relative!important;
  overflow:hidden!important;
  isolation:isolate!important;
  box-shadow:0 1px 2px rgba(22,32,51,.035)!important;
}

/* Member roster keeps the grade stripe on the left. */
#members .memberCard[data-grade643]{
  border-color:#dfe5ef!important;
  border-left-width:5px!important;
  border-left-style:solid!important;
}
#members .memberCard[data-grade643="A"]{border-left-color:#A60093!important}
#members .memberCard[data-grade643="B"]{border-left-color:#00CFC6!important}
#members .memberCard[data-grade643="C"]{border-left-color:#10D400!important}
#members .memberCard[data-grade643="D"]{border-left-color:#DE9999!important}
#members .memberCard[data-grade643="E"]{border-left-color:#EBE202!important}

/* Queue, new-game composer and pending groups use a matching stripe on the right. */
#queue .queueCard54[data-grade643],
#queue .composer54 .slot54.filled[data-grade643],
#queue .pendingCard54 .pendingSlot54:not(.emptySlot)[data-grade643]{
  border-right-width:5px!important;
  border-right-style:solid!important;
}
#queue [data-grade643="A"]{border-right-color:#A60093!important}
#queue [data-grade643="B"]{border-right-color:#00CFC6!important}
#queue [data-grade643="C"]{border-right-color:#10D400!important}
#queue [data-grade643="D"]{border-right-color:#DE9999!important}
#queue [data-grade643="E"]{border-right-color:#EBE202!important}

/* Large, bold, very faint grade watermark behind the visible card content. */
#members .memberCard[data-grade643]::after,
#queue .queueCard54[data-grade643]::after,
#queue .composer54 .slot54.filled[data-grade643]::after,
#queue .pendingCard54 .pendingSlot54:not(.emptySlot)[data-grade643]::after{
  content:attr(data-grade643);
  position:absolute!important;
  right:16px!important;
  top:50%!important;
  transform:translateY(-50%)!important;
  font-size:48px!important;
  line-height:1!important;
  font-weight:1000!important;
  letter-spacing:-.04em!important;
  pointer-events:none!important;
  user-select:none!important;
  z-index:0!important;
}
#members .memberCard[data-grade643="A"]::after,#queue [data-grade643="A"]::after{color:rgba(166,0,147,.085)!important}
#members .memberCard[data-grade643="B"]::after,#queue [data-grade643="B"]::after{color:rgba(0,207,198,.105)!important}
#members .memberCard[data-grade643="C"]::after,#queue [data-grade643="C"]::after{color:rgba(16,212,0,.090)!important}
#members .memberCard[data-grade643="D"]::after,#queue [data-grade643="D"]::after{color:rgba(222,153,153,.150)!important}
#members .memberCard[data-grade643="E"]::after,#queue [data-grade643="E"]::after{color:rgba(235,226,2,.155)!important}

#members .memberCard[data-grade643] > *,
#queue .queueCard54[data-grade643] > *,
#queue .composer54 .slot54.filled[data-grade643] > *,
#queue .pendingCard54 .pendingSlot54:not(.emptySlot)[data-grade643] > *{
  position:relative!important;
  z-index:1!important;
}

@media(max-width:430px){
  #members .memberCard[data-grade643]::after,
  #queue .queueCard54[data-grade643]::after,
  #queue .composer54 .slot54.filled[data-grade643]::after,
  #queue .pendingCard54 .pendingSlot54:not(.emptySlot)[data-grade643]::after{
    font-size:42px!important;
    right:11px!important;
  }
}
'''
(root/'app-v6.43.css').write_text(css43,encoding='utf-8')

# Switch all entry/update metadata to v6.43.
for name in ['index.html','manifest.webmanifest','kokmatch-sw.js','sw.js']:
    p=root/name
    text=p.read_text(encoding='utf-8').replace('6.42','6.43')
    p.write_text(text,encoding='utf-8')

latest={
  'version':83,
  'label':'v6.43',
  'semanticVersion':'6.43',
  'build':'v6.43',
  'updatedAt':datetime.now(ZoneInfo('Asia/Seoul')).isoformat(timespec='seconds'),
  'note':'v6.43 회원명부·개인게임대기·새게임편성·편성대기조 흰색 카드 통일 · 급수띠 표시 · 연한 대형 A~E 급수 워터마크'
}
(root/'latest-version.json').write_text(json.dumps(latest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
