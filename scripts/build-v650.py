from pathlib import Path
from datetime import datetime
from zoneinfo import ZoneInfo
import json, shutil

ROOT=Path('.')
OLD='6.49'; NEW='6.50'
old_js=ROOT/f'app-v{OLD}.js'; old_css=ROOT/f'app-v{OLD}.css'
new_js=ROOT/f'app-v{NEW}.js'; new_css=ROOT/f'app-v{NEW}.css'
assert old_js.exists() and old_css.exists()

arc=ROOT/'versions'/f'v{OLD}'
arc.mkdir(parents=True, exist_ok=True)
shutil.copy2(old_js, arc/old_js.name)
shutil.copy2(old_css, arc/old_css.name)
shutil.copy2(ROOT/'index.html', arc/'index.html')

js=old_js.read_text(encoding='utf-8').replace(OLD,NEW)
new_js.write_text(js,encoding='utf-8')

css=old_css.read_text(encoding='utf-8').replace(OLD,NEW)
css += r'''

/* KokMatch v6.50: make the S rainbow stripe visibly occupy the same 5px border area as A-E.
   No pseudo-element offset; no card geometry or interaction changes. */
#members .memberCard[data-grade-v6="S"]::before,
#queue .queueCard54[data-queue-grade642="S"]::before{
  content:none!important;
  display:none!important;
}
#members .memberCard[data-grade-v6="S"]{
  border-left-width:5px!important;
  border-left-style:solid!important;
  border-left-color:transparent!important;
  background:
    linear-gradient(#fff,#fff) padding-box,
    linear-gradient(to bottom,#ff3b30 0%,#ff9500 17%,#ffd60a 34%,#34c759 50%,#00b7ff 67%,#5856d6 83%,#af52de 100%) border-box!important;
}
#queue .queueCard54[data-queue-grade642="S"]{
  border-right-width:5px!important;
  border-right-style:solid!important;
  border-right-color:transparent!important;
  background:
    linear-gradient(#fff,#fff) padding-box,
    linear-gradient(to bottom,#ff3b30 0%,#ff9500 17%,#ffd60a 34%,#34c759 50%,#00b7ff 67%,#5856d6 83%,#af52de 100%) border-box!important;
}
'''
new_css.write_text(css,encoding='utf-8')

idx=(ROOT/'index.html').read_text(encoding='utf-8').replace(OLD,NEW)
(ROOT/'index.html').write_text(idx,encoding='utf-8')
for p in ['manifest.webmanifest','kokmatch-sw.js','sw.js']:
    q=ROOT/p
    if q.exists(): q.write_text(q.read_text(encoding='utf-8').replace(OLD,NEW),encoding='utf-8')

latest={
  'version':90,
  'label':'v6.50',
  'semanticVersion':'6.50',
  'build':'v6.50',
  'updatedAt':datetime.now(ZoneInfo('Asia/Seoul')).isoformat(timespec='seconds'),
  'note':'v6.50 S급 무지개띠 실제 표시 수정 · A~E와 동일한 5px 테두리 영역 사용 · 레이아웃/권한 유지'
}
(ROOT/'latest-version.json').write_text(json.dumps(latest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

assert 'content:none!important' in css
assert 'linear-gradient(#fff,#fff) padding-box' in css
assert 'border-box!important' in css
assert f'app-v{NEW}.js?v={NEW}' in idx and f'app-v{NEW}.css?v={NEW}' in idx
print('v6.50 build assertions OK')
