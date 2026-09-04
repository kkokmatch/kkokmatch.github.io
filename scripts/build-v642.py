from pathlib import Path
import json

ROOT = Path('.')
OLD='6.41'
NEW='6.42'

js_old=(ROOT/f'app-v{OLD}.js').read_text(encoding='utf-8')
css_old=(ROOT/f'app-v{OLD}.css').read_text(encoding='utf-8')
index_old=(ROOT/'index.html').read_text(encoding='utf-8')
manifest_old=(ROOT/'manifest.webmanifest').read_text(encoding='utf-8')
sw_old=(ROOT/'kokmatch-sw.js').read_text(encoding='utf-8')
compat_old=(ROOT/'sw.js').read_text(encoding='utf-8')

js=js_old.replace(OLD,NEW)
js += r'''

/* KokMatch v6.42: white member/queue cards + right-side queue grade stripe. */
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

css=css_old + r'''

/* KokMatch v6.42: neutral white cards; member stripe stays left, personal queue stripe moves to right. */
#members .memberCard,
#members .memberCard[data-grade-v6],
#queue .queueCard,
#queue .queueCard53,
#queue .queueCard54{
  background:#fff!important;
}

#queue .queueCard54[data-queue-grade642]{
  border-right-width:5px!important;
  border-right-style:solid!important;
}
#queue .queueCard54[data-queue-grade642="A"]{border-right-color:#A60093!important}
#queue .queueCard54[data-queue-grade642="B"]{border-right-color:#00CFC6!important}
#queue .queueCard54[data-queue-grade642="C"]{border-right-color:#10D400!important}
#queue .queueCard54[data-queue-grade642="D"]{border-right-color:#DE9999!important}
#queue .queueCard54[data-queue-grade642="E"]{border-right-color:#EBE202!important}
'''

(ROOT/f'app-v{NEW}.js').write_text(js,encoding='utf-8')
(ROOT/f'app-v{NEW}.css').write_text(css,encoding='utf-8')

# Archive the current operating entry before switching.
archive=ROOT/'versions'/f'v{OLD}'
archive.mkdir(parents=True,exist_ok=True)
archived_index=index_old.replace('href="/','href="../../').replace('src="/','src="../../').replace("register('/kokmatch-sw.js'","register('../../kokmatch-sw.js'")
(archive/'index.html').write_text(archived_index,encoding='utf-8')

index_new=index_old.replace(OLD,NEW)
(ROOT/'index.html').write_text(index_new,encoding='utf-8')
(ROOT/'manifest.webmanifest').write_text(manifest_old.replace(OLD,NEW),encoding='utf-8')
(ROOT/'kokmatch-sw.js').write_text(sw_old.replace(OLD,NEW),encoding='utf-8')
(ROOT/'sw.js').write_text(compat_old.replace(OLD,NEW),encoding='utf-8')

latest={
 'version':82,
 'label':'v6.42',
 'semanticVersion':'6.42',
 'build':'v6.42',
 'updatedAt':'2026-09-04T11:15:00+09:00',
 'note':'v6.42 회원명부·개인게임대기 카드 흰색 통일 · 회원명부 왼쪽 급수띠 유지 · 개인게임대기 오른쪽 급수띠 표시'
}
(ROOT/'latest-version.json').write_text(json.dumps(latest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
