from pathlib import Path
import json, shutil

ROOT=Path('.')
OLD='6.45'; NEW='6.46'
old_js=ROOT/f'app-v{OLD}.js'; old_css=ROOT/f'app-v{OLD}.css'
new_js=ROOT/f'app-v{NEW}.js'; new_css=ROOT/f'app-v{NEW}.css'
assert old_js.exists() and old_css.exists()

# Archive the exact current production runtime first.
arc=ROOT/'versions'/f'v{OLD}'
arc.mkdir(parents=True, exist_ok=True)
shutil.copy2(old_js, arc/old_js.name)
shutil.copy2(old_css, arc/old_css.name)
shutil.copy2(ROOT/'index.html', arc/'index.html')

js=old_js.read_text(encoding='utf-8')

# S is the highest normal member grade. This updates the canonical member editor,
# roster/queue badge renderers and legacy fallback member forms in one controlled pass.
js=js.replace("['A','B','C','D','E']", "['S','A','B','C','D','E']")
js=js.replace('["A","B","C","D","E"]', '["S","A","B","C","D","E"]')
js=js.replace('급수는 A~E로 선택해주세요.', '급수는 S/A/B/C/D/E 중에서 선택해주세요.')
js=js.replace('급수는 A~E로 입력해주세요.', '급수는 S/A/B/C/D/E 중에서 입력해주세요.')

# Bulk member registration gets an S-capable backend.
js=js.replace(
 'https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-bulk-v44',
 'https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-bulk-v646'
)

# Canonical v6.21 member_save gets an S-capable focused backend while all other
# v60 actions continue using the existing stable endpoint.
needle="""  const API='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-v60-api';
  const actionBusy=new Set();"""
replacement="""  const API='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-v60-api';
  const MEMBER_API646='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-member-v646';
  const actionBusy=new Set();"""
assert needle in js
js=js.replace(needle,replacement,1)
needle2="""  async function stableApi(op,body={}){
    const t=token();
    const r=await fetch(API,{"""
replacement2="""  async function stableApi(op,body={}){
    const t=token();
    const endpoint=op==='member_save'?MEMBER_API646:API;
    const r=await fetch(endpoint,{"""
assert needle2 in js
js=js.replace(needle2,replacement2,1)

# Attendance-poll guest creation still uses its existing backend, so do not expose
# S in that guest-only selector yet. Existing S-grade members still display as S.
js=js.replace(
 '<select id=\\"pollGuestCls623\\">${[\'S\',\'A\',\'B\',\'C\',\'D\',\'E\'].map',
 '<select id=\\"pollGuestCls623\\">${[\'A\',\'B\',\'C\',\'D\',\'E\'].map'
)
old_grade_tag="""function gradeTag623(m){return `<span class=\"pollGrade623\">${esc(String(m?.age||'30'))}${esc(String(m?.cls||'C'))}</span>`}"""
new_grade_tag="""function gradeTag623(m){const c=String(m?.cls||'C').trim().toUpperCase();return `<span class=\"pollGrade623${c==='S'?' grade-s50':''}\">${esc(String(m?.age||'30'))}${esc(c)}</span>`}"""
if old_grade_tag in js: js=js.replace(old_grade_tag,new_grade_tag,1)

# Runtime release labels only; numeric suffix identifiers such as 645 remain untouched.
js=js.replace(OLD, NEW)
new_js.write_text(js, encoding='utf-8')

css=old_css.read_text(encoding='utf-8').replace(OLD, NEW)
css += r'''

/* KokMatch v6.46: S grade badge. Badge only; card backgrounds/layout remain unchanged. */
.grade-s50,
#members .grade-s50,
#queue .grade-s50,
#playing .grade-s50,
#stats .grade-s50,
#modal .grade-s50{
  background-color:#7c3aed!important;
  background-image:linear-gradient(110deg,#ff3b30 0%,#ff9500 17%,#ffd60a 34%,#34c759 50%,#00b7ff 67%,#5856d6 83%,#af52de 100%)!important;
  color:#fff!important;
  border-color:transparent!important;
  text-shadow:0 1px 1px rgba(0,0,0,.32)!important;
  box-shadow:inset 0 0 0 1px rgba(255,255,255,.28),0 1px 2px rgba(0,0,0,.12)!important;
}
'''
new_css.write_text(css, encoding='utf-8')

# Switch entry point and cache-busting labels.
idx=(ROOT/'index.html').read_text(encoding='utf-8').replace(OLD, NEW)
(ROOT/'index.html').write_text(idx, encoding='utf-8')
for p in ['manifest.webmanifest','kokmatch-sw.js','sw.js']:
    q=ROOT/p
    if q.exists(): q.write_text(q.read_text(encoding='utf-8').replace(OLD,NEW),encoding='utf-8')

latest={
  'version':86,
  'label':'v6.46',
  'semanticVersion':'6.46',
  'build':'v6.46',
  'updatedAt':'2026-09-04T12:00:00+09:00',
  'note':'v6.46 S급 추가 · 회원 등록/수정 및 일괄등록 S/A/B/C/D/E 지원 · S 급수배지 무지개 그라데이션'
}
(ROOT/'latest-version.json').write_text(json.dumps(latest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

# Targeted release assertions.
assert "['S','A','B','C','D','E']" in js
assert "MEMBER_API646='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-member-v646'" in js
assert 'kokmatch-bulk-v646' in js
assert '급수는 S/A/B/C/D/E 중에서 선택해주세요.' in js
assert 'grade-s50' in css and 'linear-gradient(110deg' in css
assert f'app-v{NEW}.js' in idx and f'app-v{NEW}.css' in idx
print('v6.46 build assertions OK')
