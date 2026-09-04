from pathlib import Path
import json, shutil

ROOT=Path('.')
OLD='6.46'; NEW='6.47'
old_js=ROOT/f'app-v{OLD}.js'; old_css=ROOT/f'app-v{OLD}.css'
new_js=ROOT/f'app-v{NEW}.js'; new_css=ROOT/f'app-v{NEW}.css'
assert old_js.exists() and old_css.exists()

# Archive the exact current production runtime.
arc=ROOT/'versions'/f'v{OLD}'
arc.mkdir(parents=True, exist_ok=True)
shutil.copy2(old_js, arc/old_js.name)
shutil.copy2(old_css, arc/old_css.name)
shutil.copy2(ROOT/'index.html', arc/'index.html')

js=old_js.read_text(encoding='utf-8').replace(OLD,NEW)
js += r'''

/* KokMatch v6.47: personal queue grade watermark only. No card layout mutation. */
(()=>{
'use strict';
if(window.__kokmatchQueueWatermark647)return;
window.__kokmatchQueueWatermark647=true;
function grade647(m){
 const g=String(m?.cls||'').trim().toUpperCase();
 return /^(?:S|[A-E])$/.test(g)?g:'';
}
function decorateQueueWatermark647(){
 const box=document.getElementById('queue');if(!box)return;
 let ids=[];try{ids=typeof sortedQueue==='function'?sortedQueue():[]}catch{ids=[]}
 [...box.querySelectorAll('.queueCard54')].forEach((card,i)=>{
  const id=ids[i],m=id&&typeof M==='function'?M(id):null,g=grade647(m);
  if(g)card.dataset.queueWatermark647=g;else delete card.dataset.queueWatermark647;
 });
}
const renderQueue646=renderQueue;
renderQueue=function(...args){const r=renderQueue646.apply(this,args);decorateQueueWatermark647();return r};
window.__kokmatchDecorateQueueWatermark647=decorateQueueWatermark647;
try{if(me)decorateQueueWatermark647()}catch{}
})();
'''
new_js.write_text(js,encoding='utf-8')

css=old_css.read_text(encoding='utf-8').replace(OLD,NEW)
css += r'''

/* KokMatch v6.47: personal game-waiting watermark only. Layout/grid/spacing stay unchanged. */
#queue .queueCard54[data-queue-watermark647]{
  position:relative!important;
  overflow:hidden!important;
  isolation:isolate!important;
}
#queue .queueCard54[data-queue-watermark647]::after{
  content:attr(data-queue-watermark647);
  position:absolute!important;
  right:14px!important;
  top:50%!important;
  transform:translateY(-50%)!important;
  margin:0!important;
  padding:0!important;
  font-size:54px!important;
  line-height:1!important;
  font-weight:1000!important;
  letter-spacing:-.05em!important;
  pointer-events:none!important;
  user-select:none!important;
  z-index:0!important;
  white-space:nowrap!important;
}
#queue .queueCard54[data-queue-watermark647] > *{
  position:relative!important;
  z-index:1!important;
}
#queue .queueCard54[data-queue-watermark647="A"]::after{color:rgba(166,0,147,.11)!important}
#queue .queueCard54[data-queue-watermark647="B"]::after{color:rgba(0,207,198,.13)!important}
#queue .queueCard54[data-queue-watermark647="C"]::after{color:rgba(16,212,0,.12)!important}
#queue .queueCard54[data-queue-watermark647="D"]::after{color:rgba(222,153,153,.19)!important}
#queue .queueCard54[data-queue-watermark647="E"]::after{color:rgba(235,226,2,.21)!important}
#queue .queueCard54[data-queue-watermark647="S"]::after{
  color:transparent!important;
  -webkit-text-fill-color:transparent!important;
  background-image:linear-gradient(110deg,#ff3b30 0%,#ff9500 17%,#ffd60a 34%,#34c759 50%,#00b7ff 67%,#5856d6 83%,#af52de 100%)!important;
  background-clip:text!important;
  -webkit-background-clip:text!important;
  opacity:.20!important;
}
@media(max-width:430px){
  #queue .queueCard54[data-queue-watermark647]::after{
    right:11px!important;
    font-size:46px!important;
  }
}
'''
new_css.write_text(css,encoding='utf-8')

idx=(ROOT/'index.html').read_text(encoding='utf-8').replace(OLD,NEW)
(ROOT/'index.html').write_text(idx,encoding='utf-8')
for p in ['manifest.webmanifest','kokmatch-sw.js','sw.js']:
    q=ROOT/p
    if q.exists(): q.write_text(q.read_text(encoding='utf-8').replace(OLD,NEW),encoding='utf-8')

latest={
  'version':87,
  'label':'v6.47',
  'semanticVersion':'6.47',
  'build':'v6.47',
  'updatedAt':'2026-09-04T13:29:00+09:00',
  'note':'v6.47 개인게임대기 회원카드 A/B/C/D/E/S 굵은 급수색 워터마크 추가 · 카드 레이아웃/구조 유지'
}
(ROOT/'latest-version.json').write_text(json.dumps(latest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

assert 'queueWatermark647' in js
assert '/^(?:S|[A-E])$/' in js
assert 'data-queue-watermark647="S"' in css
assert 'linear-gradient(110deg' in css
assert f'app-v{NEW}.js?v={NEW}' in idx and f'app-v{NEW}.css?v={NEW}' in idx
print('v6.47 build assertions OK')
