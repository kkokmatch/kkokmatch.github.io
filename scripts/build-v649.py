from pathlib import Path
import json, shutil

ROOT=Path('.')
OLD='6.48'; NEW='6.49'
old_js=ROOT/f'app-v{OLD}.js'; old_css=ROOT/f'app-v{OLD}.css'
new_js=ROOT/f'app-v{NEW}.js'; new_css=ROOT/f'app-v{NEW}.css'
assert old_js.exists() and old_css.exists()

# Archive exact v6.48 production runtime.
arc=ROOT/'versions'/f'v{OLD}'
arc.mkdir(parents=True, exist_ok=True)
shutil.copy2(old_js, arc/old_js.name)
shutil.copy2(old_css, arc/old_css.name)
shutil.copy2(ROOT/'index.html', arc/'index.html')

js=old_js.read_text(encoding='utf-8').replace(OLD,NEW)
new_js.write_text(js,encoding='utf-8')

css=old_css.read_text(encoding='utf-8').replace(OLD,NEW)
css += r'''

/* KokMatch v6.49: normalize S rainbow stripe shape to the exact A-E 5px edge stripe geometry.
   Color remains rainbow; card size, grid, spacing, and interactions remain unchanged. */
#members .memberCard[data-grade-v6="S"]{
  position:relative!important;
  overflow:hidden!important;
  border-left-width:5px!important;
  border-left-style:solid!important;
  border-left-color:transparent!important;
  background:#fff!important;
  background-image:none!important;
}
#members .memberCard[data-grade-v6="S"]::before{
  content:"";
  position:absolute!important;
  left:-5px!important;
  top:-1px!important;
  bottom:-1px!important;
  width:5px!important;
  margin:0!important;
  padding:0!important;
  background:linear-gradient(to bottom,#ff3b30 0%,#ff9500 17%,#ffd60a 34%,#34c759 50%,#00b7ff 67%,#5856d6 83%,#af52de 100%)!important;
  border-radius:17px 0 0 17px!important;
  pointer-events:none!important;
  z-index:0!important;
}
#members .memberCard[data-grade-v6="S"] > *{position:relative!important;z-index:1!important}

#queue .queueCard54[data-queue-grade642="S"]{
  position:relative!important;
  overflow:hidden!important;
  border-right-width:5px!important;
  border-right-style:solid!important;
  border-right-color:transparent!important;
  background:#fff!important;
  background-image:none!important;
}
#queue .queueCard54[data-queue-grade642="S"]::before{
  content:"";
  position:absolute!important;
  right:-5px!important;
  top:-1px!important;
  bottom:-1px!important;
  width:5px!important;
  margin:0!important;
  padding:0!important;
  background:linear-gradient(to bottom,#ff3b30 0%,#ff9500 17%,#ffd60a 34%,#34c759 50%,#00b7ff 67%,#5856d6 83%,#af52de 100%)!important;
  border-radius:0 17px 17px 0!important;
  pointer-events:none!important;
  z-index:0!important;
}
#queue .queueCard54[data-queue-grade642="S"] > *{position:relative!important;z-index:1!important}
'''
new_css.write_text(css,encoding='utf-8')

idx=(ROOT/'index.html').read_text(encoding='utf-8').replace(OLD,NEW)
(ROOT/'index.html').write_text(idx,encoding='utf-8')
for p in ['manifest.webmanifest','kokmatch-sw.js','sw.js']:
    q=ROOT/p
    if q.exists(): q.write_text(q.read_text(encoding='utf-8').replace(OLD,NEW),encoding='utf-8')

latest={
  'version':89,
  'label':'v6.49',
  'semanticVersion':'6.49',
  'build':'v6.49',
  'updatedAt':'2026-09-04T13:42:00+09:00',
  'note':'v6.49 S급 무지개띠를 A~E와 동일한 5px 테두리 형태로 통일 · 레이아웃/권한 유지'
}
(ROOT/'latest-version.json').write_text(json.dumps(latest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

assert 'data-grade-v6="S"]::before' in css
assert 'data-queue-grade642="S"]::before' in css
assert 'width:5px!important' in css
assert 'background-image:none!important' in css
assert f'app-v{NEW}.js?v={NEW}' in idx and f'app-v{NEW}.css?v={NEW}' in idx
print('v6.49 build assertions OK')
