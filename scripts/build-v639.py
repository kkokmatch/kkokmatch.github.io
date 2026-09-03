from pathlib import Path
import json,re

OLD='6.38'
NEW='6.39'
root=Path('.')

js=(root/f'app-v{OLD}.js').read_text(encoding='utf-8').replace(OLD,NEW)
(root/f'app-v{NEW}.js').write_text(js,encoding='utf-8')

css=(root/f'app-v{OLD}.css').read_text(encoding='utf-8')
css += r'''

/* KokMatch v6.39: calmer grade distinction in member roster */
#members .memberCard[data-grade-v6]{
  border-color:#dfe5ef!important;
  border-left-width:5px!important;
  border-left-style:solid!important;
  box-shadow:0 1px 2px rgba(22,32,51,.035)!important;
}
#members .memberCard[data-grade-v6="A"]{background:#faf0f9!important;border-left-color:#A60093!important}
#members .memberCard[data-grade-v6="B"]{background:#f0fcfc!important;border-left-color:#00CFC6!important}
#members .memberCard[data-grade-v6="C"]{background:#f1fcf0!important;border-left-color:#10D400!important}
#members .memberCard[data-grade-v6="D"]{background:#fdf9f9!important;border-left-color:#DE9999!important}
#members .memberCard[data-grade-v6="E"]{background:#fefdf0!important;border-left-color:#EBE202!important}
/* Keep the grade badge itself vivid so level scanning stays fast. */
#members .memberCard .grade-a50{background:#A60093!important;color:#fff!important}
#members .memberCard .grade-b50{background:#00CFC6!important;color:#073937!important}
#members .memberCard .grade-c50{background:#10D400!important;color:#063b00!important}
#members .memberCard .grade-d50{background:#DE9999!important;color:#4b2020!important}
#members .memberCard .grade-e50{background:#EBE202!important;color:#3b3800!important}
'''
(root/f'app-v{NEW}.css').write_text(css,encoding='utf-8')

index=(root/'index.html').read_text(encoding='utf-8').replace(OLD,NEW)
(root/'index.html').write_text(index,encoding='utf-8')
manifest=(root/'manifest.webmanifest').read_text(encoding='utf-8').replace(OLD,NEW)
(root/'manifest.webmanifest').write_text(manifest,encoding='utf-8')
ksw=(root/'kokmatch-sw.js').read_text(encoding='utf-8').replace(OLD,NEW)
(root/'kokmatch-sw.js').write_text(ksw,encoding='utf-8')
sw=(root/'sw.js').read_text(encoding='utf-8')
sw=re.sub(r"kokmatch-sw\.js\?v=\d+(?:\.\d+)+",f"kokmatch-sw.js?v={NEW}",sw)
(root/'sw.js').write_text(sw,encoding='utf-8')
latest={
  'version':79,
  'label':'v6.39',
  'semanticVersion':'6.39',
  'build':'v6.39',
  'updatedAt':'2026-09-03T17:32:00+09:00',
  'note':'v6.39 회원명부 급수별 카드 배경을 저채도 틴트로 완화 · 왼쪽 5px 급수 포인트선 추가 · 급수배지 원색 유지'
}
(root/'latest-version.json').write_text(json.dumps(latest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

assert f'/app-v{NEW}.js?v={NEW}' in index and f'/app-v{NEW}.css?v={NEW}' in index
assert f'kmv={NEW}' in manifest
assert f"KOKMATCH_SW_VERSION='{NEW}'" in ksw
assert f'kokmatch-sw.js?v={NEW}' in sw
assert 'border-left-width:5px' in css and '#faf0f9' in css and '#fefdf0' in css
print('built v6.39')
