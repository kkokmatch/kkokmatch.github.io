from pathlib import Path
import json, shutil

OLD='6.62'; NEW='6.63'

# Archive current production runtime before switching.
archive=Path('versions/v6.62'); archive.mkdir(parents=True, exist_ok=True)
for name in ['app-v6.62.js','app-v6.62.css','index.html','latest-version.json','manifest.webmanifest','kokmatch-sw.js','sw.js']:
    src=Path(name)
    if src.exists(): shutil.copy2(src, archive/src.name)

# Build from current production only.
js=Path('app-v6.62.js').read_text(encoding='utf-8').replace(OLD,NEW)
Path('app-v6.63.js').write_text(js,encoding='utf-8')

css=Path('app-v6.62.css').read_text(encoding='utf-8').replace(OLD,NEW)
css += r'''

/* v6.63: developer badge uses the exact same geometry/type scale as organizer and manager badges. */
.roleBadge.role-global{
 --km-dev-badge-v663:1;
 display:inline-block!important;
 position:relative!important;
 box-sizing:border-box!important;
 border-radius:999px!important;
 padding:3px 7px!important;
 margin-left:4px!important;
 vertical-align:middle!important;
 font-family:inherit!important;
 font-size:11px!important;
 font-weight:900!important;
 font-style:normal!important;
 line-height:normal!important;
 letter-spacing:normal!important;
 white-space:nowrap!important;
 gap:0!important;
 min-width:0!important;
 min-height:0!important;
 height:auto!important;
 overflow:hidden!important;
 color:#f7fdff!important;
 border:1px solid rgba(124,218,255,.78)!important;
 background-color:#168edc!important;
 background-image:
   linear-gradient(116deg,rgba(255,255,255,.45) 0 10%,transparent 11% 39%,rgba(255,255,255,.12) 40% 52%,transparent 53%),
   linear-gradient(135deg,#0869c8 0%,#38d5ff 33%,#189de9 62%,#075db8 100%)!important;
 box-shadow:inset 0 1px 0 rgba(255,255,255,.62),inset 0 -1px 0 rgba(5,73,151,.18),0 1px 2px rgba(14,111,190,.10)!important;
 text-shadow:0 1px 1px rgba(0,68,130,.20)!important;
}
/* Remove the v6.62 diamond glyph so it no longer changes badge width/shape. */
.roleBadge.role-global::before{
 content:none!important;
 display:none!important;
 width:0!important;
 height:0!important;
 margin:0!important;
 padding:0!important;
}
/* Keep only a very subtle crystal sheen; it does not participate in layout. */
.roleBadge.role-global::after{
 content:''!important;
 display:block!important;
 position:absolute!important;
 left:-24%!important;
 top:-70%!important;
 width:34%!important;
 height:240%!important;
 background:linear-gradient(90deg,transparent,rgba(255,255,255,.23),transparent)!important;
 transform:rotate(18deg)!important;
 opacity:.28!important;
 pointer-events:none!important;
}
'''
Path('app-v6.63.css').write_text(css,encoding='utf-8')

idx=Path('index.html').read_text(encoding='utf-8').replace(OLD,NEW).replace('single-v662','single-v663').replace('session-coordinator-v662','session-coordinator-v663')
Path('index.html').write_text(idx,encoding='utf-8')

latest={
 'version':103,
 'label':'v6.63',
 'semanticVersion':'6.63',
 'build':'v6.63',
 'updatedAt':'2026-09-09T16:08:00+09:00',
 'note':'v6.63 개발자 배지 규격 통일 · 모임장/운영진과 동일 크기·폰트·알약형 · 블루 크리스털 재질 유지'
}
Path('latest-version.json').write_text(json.dumps(latest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

for name in ['manifest.webmanifest','kokmatch-sw.js','sw.js']:
    p=Path(name)
    if p.exists(): p.write_text(p.read_text(encoding='utf-8').replace(OLD,NEW),encoding='utf-8')

print('v6.63 developer badge geometry-normalized build prepared')
