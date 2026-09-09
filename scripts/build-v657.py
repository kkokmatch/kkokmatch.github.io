from pathlib import Path
from datetime import datetime
from zoneinfo import ZoneInfo
import json, shutil

ROOT=Path('.')
OLD='6.56'; NEW='6.57'
old_js=ROOT/f'app-v{OLD}.js'; old_css=ROOT/f'app-v{OLD}.css'
assert old_js.exists() and old_css.exists(), 'v6.56 runtime missing'
arc=ROOT/'versions'/f'v{OLD}';arc.mkdir(parents=True,exist_ok=True)
for p in [old_js,old_css,ROOT/'index.html',ROOT/'manifest.webmanifest',ROOT/'kokmatch-sw.js',ROOT/'sw.js',ROOT/'latest-version.json']:
    if p.exists():shutil.copy2(p,arc/p.name)
js=old_js.read_text(encoding='utf-8').replace(OLD,NEW)
css=old_css.read_text(encoding='utf-8').replace(OLD,NEW)
# Creator provenance began with v6.56, so keep that historical boundary text unchanged.
js=js.replace('v6.57 이전 편성','v6.56 이전 편성')
old="if(!T||!currentGroupId||document.hidden||!autoEnabled656())return null;"
new="if(!T||!currentGroupId||document.hidden||!autoEnabled656()||!canControlAuto656())return null;"
assert old in js,'auto tick guard changed'
js=js.replace(old,new,1)
(ROOT/f'app-v{NEW}.js').write_text(js,encoding='utf-8')
(ROOT/f'app-v{NEW}.css').write_text(css,encoding='utf-8')
idx=(ROOT/'index.html').read_text(encoding='utf-8').replace(OLD,NEW).replace('single-v656','single-v657').replace('session-coordinator-v656','session-coordinator-v657')
(ROOT/'index.html').write_text(idx,encoding='utf-8')
for name in ['manifest.webmanifest','kokmatch-sw.js','sw.js']:
    p=ROOT/name
    if p.exists():p.write_text(p.read_text(encoding='utf-8').replace(OLD,NEW),encoding='utf-8')
latest={'version':97,'label':'v6.57','semanticVersion':'6.57','build':'v6.57','updatedAt':datetime.now(ZoneInfo('Asia/Seoul')).isoformat(timespec='seconds'),'note':'v6.57 자동게임편성 안정화 · 개발자·모임장·운영진 단말만 자동판단 실행 · 일반회원 불필요 요청 차단'}
(ROOT/'latest-version.json').write_text(json.dumps(latest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
assert '!canControlAuto656()' in js
assert 'v6.56 이전 편성' in js
assert f'app-v{NEW}.js?v={NEW}' in idx and f'app-v{NEW}.css?v={NEW}' in idx
print('v6.57 staff-only auto tick build OK')
