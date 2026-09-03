from pathlib import Path
import json

js=Path('app-v6.35.js').read_text(encoding='utf-8')
repls=[
    ("window.__kokmatchStandalone='6.35';","window.__kokmatchStandalone='6.36';"),
    ("window.__kokmatchVersionLock='6.35';","window.__kokmatchVersionLock='6.36';"),
    ("sessionStorage.setItem('kokmatch_runtime_version','6.35')","sessionStorage.setItem('kokmatch_runtime_version','6.36')"),
    ("const CURRENT633='6.35';","const CURRENT633='6.36';"),
    ("const BUILD634=Object.freeze({version:'6.35',label:'콕매치 v6.35 · 최신 운영본'});","const BUILD634=Object.freeze({version:'6.36',label:'콕매치 v6.36 · 최신 운영본'});"),
    ("const BUILD635='6.35';","const BUILD635='6.36';")
]
for old,new in repls:
    if old not in js:
        raise SystemExit(f'missing JS patch target: {old}')
    js=js.replace(old,new,1)
Path('app-v6.36.js').write_text(js,encoding='utf-8')

css=Path('app-v6.35.css').read_text(encoding='utf-8')
css += r'''

/* v6.36: Android tablet canonical roster controls stay in one fixed 3-slot row. */
@media(min-width:600px) and (max-width:1199px){
  #members .memberCard .kmRosterActions621{
    box-sizing:border-box!important;
    width:148px!important;
    min-width:148px!important;
    max-width:148px!important;
    justify-self:end!important;
    align-self:center!important;
    margin:0!important;
  }
  #members .memberCard .kmRosterActions621 .status{
    width:140px!important;
    margin:0 0 5px auto!important;
    text-align:center!important;
    white-space:nowrap!important;
  }
  #members .memberCard .kmRosterBtns621{
    display:grid!important;
    grid-template-columns:repeat(3,44px)!important;
    grid-auto-flow:column!important;
    align-items:center!important;
    justify-content:end!important;
    gap:4px!important;
    width:140px!important;
    min-width:140px!important;
    max-width:140px!important;
    margin:0 0 0 auto!important;
    flex-wrap:nowrap!important;
    overflow:visible!important;
  }
  #members .memberCard .kmRosterSlot621,
  #members .memberCard .kmRosterPlaceholder621,
  #members .memberCard .kmRosterAction621{
    box-sizing:border-box!important;
    width:44px!important;
    min-width:44px!important;
    max-width:44px!important;
    height:32px!important;
    min-height:32px!important;
    max-height:32px!important;
  }
  #members .memberCard .kmRosterSlot621{
    display:flex!important;
    align-items:center!important;
    justify-content:center!important;
  }
  #members .memberCard .kmRosterPlaceholder621{
    display:block!important;
    visibility:hidden!important;
    pointer-events:none!important;
  }
  #members .memberCard .kmRosterAction621{
    margin:0!important;
    padding:5px 2px!important;
    border-radius:9px!important;
    font-size:10px!important;
    line-height:1!important;
    white-space:nowrap!important;
  }
}
'''
Path('app-v6.36.css').write_text(css,encoding='utf-8')

idx=Path('index.html').read_text(encoding='utf-8')
idx=idx.replace('6.35','6.36').replace('app-v6.35.css','app-v6.36.css').replace('app-v6.35.js','app-v6.36.js')
Path('index.html').write_text(idx,encoding='utf-8')

latest={
  'version':76,
  'label':'v6.36',
  'semanticVersion':'6.36',
  'build':'v6.36',
  'updatedAt':'2026-09-03T14:35:00+09:00',
  'note':'v6.36 안드로이드 태블릿 회원명부 입장·퇴장·관람·수정 버튼 3칸 고정 정렬 · 아이폰 레이아웃 유지'
}
Path('latest-version.json').write_text(json.dumps(latest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

mf=Path('manifest.webmanifest').read_text(encoding='utf-8').replace('kmv=6.35','kmv=6.36')
Path('manifest.webmanifest').write_text(mf,encoding='utf-8')

sw=Path('kokmatch-sw.js').read_text(encoding='utf-8')
if "KOKMATCH_SW_VERSION='6.35'" not in sw: raise SystemExit('missing SW 6.35 marker')
sw=sw.replace("KOKMATCH_SW_VERSION='6.35'","KOKMATCH_SW_VERSION='6.36'",1)
Path('kokmatch-sw.js').write_text(sw,encoding='utf-8')
Path('sw.js').write_text("/* Stable compatibility entry for older KokMatch installations. */\nimportScripts('/kokmatch-sw.js?v=6.36');\n",encoding='utf-8')
