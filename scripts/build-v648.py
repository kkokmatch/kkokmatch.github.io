from pathlib import Path
import json, shutil

ROOT=Path('.')
OLD='6.47'; NEW='6.48'
old_js=ROOT/f'app-v{OLD}.js'; old_css=ROOT/f'app-v{OLD}.css'
new_js=ROOT/f'app-v{NEW}.js'; new_css=ROOT/f'app-v{NEW}.css'
assert old_js.exists() and old_css.exists()

arc=ROOT/'versions'/f'v{OLD}'
arc.mkdir(parents=True, exist_ok=True)
shutil.copy2(old_js, arc/old_js.name)
shutil.copy2(old_css, arc/old_css.name)
shutil.copy2(ROOT/'index.html', arc/'index.html')

js=old_js.read_text(encoding='utf-8')
# Existing personal-queue stripe decorator from v6.42: extend A-E to S/A-E only.
old_grade="return /^[A-E]$/.test(g)?g:'';"
new_grade="return /^(?:S|[A-E])$/.test(g)?g:'';"
assert old_grade in js
js=js.replace(old_grade,new_grade,1)
js=js.replace(OLD,NEW)
new_js.write_text(js,encoding='utf-8')

css=old_css.read_text(encoding='utf-8').replace(OLD,NEW)
css += r'''

/* KokMatch v6.48: S-grade rainbow edge stripes + rainbow developer badge.
   Visual-only: no grid, spacing, size, click, or permission changes. */

/* Member roster S stripe: same left-edge location as A-E, rendered as a rainbow surface. */
#members .memberCard[data-grade-v6="S"]{
  border-left-color:transparent!important;
  background-color:#fff!important;
  background-image:linear-gradient(to bottom,#ff3b30 0%,#ff9500 17%,#ffd60a 34%,#34c759 50%,#00b7ff 67%,#5856d6 83%,#af52de 100%)!important;
  background-size:5px 100%!important;
  background-position:left top!important;
  background-repeat:no-repeat!important;
}

/* Personal queue S stripe: same right-edge location as A-E; keep v6.47 S watermark intact. */
#queue .queueCard54[data-queue-grade642="S"]{
  border-right-color:transparent!important;
  background-color:#fff!important;
  background-image:linear-gradient(to bottom,#ff3b30 0%,#ff9500 17%,#ffd60a 34%,#34c759 50%,#00b7ff 67%,#5856d6 83%,#af52de 100%)!important;
  background-size:5px 100%!important;
  background-position:right top!important;
  background-repeat:no-repeat!important;
}

/* Developer role badge: visual change only; role/permission logic remains untouched. */
.roleBadge.role-global{
  background-color:#7c3aed!important;
  background-image:linear-gradient(110deg,#ff3b30 0%,#ff9500 17%,#ffd60a 34%,#34c759 50%,#00b7ff 67%,#5856d6 83%,#af52de 100%)!important;
  color:#fff!important;
  border-color:transparent!important;
  text-shadow:0 1px 1px rgba(0,0,0,.32)!important;
  box-shadow:inset 0 0 0 1px rgba(255,255,255,.3),0 1px 2px rgba(0,0,0,.12)!important;
}
'''
new_css.write_text(css,encoding='utf-8')

idx=(ROOT/'index.html').read_text(encoding='utf-8').replace(OLD,NEW)
(ROOT/'index.html').write_text(idx,encoding='utf-8')
for p in ['manifest.webmanifest','kokmatch-sw.js','sw.js']:
    q=ROOT/p
    if q.exists(): q.write_text(q.read_text(encoding='utf-8').replace(OLD,NEW),encoding='utf-8')

latest={
  'version':88,
  'label':'v6.48',
  'semanticVersion':'6.48',
  'build':'v6.48',
  'updatedAt':'2026-09-04T13:29:00+09:00',
  'note':'v6.48 S급 회원명부/개인게임대기 무지개 급수띠 추가 · 개발자 배지 무지개 그라데이션 적용 · 권한/레이아웃 유지'
}
(ROOT/'latest-version.json').write_text(json.dumps(latest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

assert "return /^(?:S|[A-E])$/.test(g)?g:'';" in js
assert '#members .memberCard[data-grade-v6="S"]' in css
assert '#queue .queueCard54[data-queue-grade642="S"]' in css
assert '.roleBadge.role-global' in css
assert 'linear-gradient(110deg' in css
assert f'app-v{NEW}.js?v={NEW}' in idx and f'app-v{NEW}.css?v={NEW}' in idx
print('v6.48 build assertions OK')
