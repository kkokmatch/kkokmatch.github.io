from pathlib import Path
import json, shutil
OLD='6.66'; NEW='6.67'
archive=Path('versions/v6.66'); archive.mkdir(parents=True,exist_ok=True)
for name in ['app-v6.66.js','app-v6.66.css','index.html','latest-version.json','manifest.webmanifest','kokmatch-sw.js','sw.js']:
    p=Path(name)
    if p.exists(): shutil.copy2(p,archive/p.name)
Path('app-v6.67.js').write_text(Path('app-v6.66.js').read_text(encoding='utf-8').replace(OLD,NEW),encoding='utf-8')
css=Path('app-v6.66.css').read_text(encoding='utf-8').replace(OLD,NEW)
css += '''

/* v6.67: improve manager badge text contrast on bright gold crystal surface. */
.roleBadge.role-manager{
 --km-manager-text-v667:1;
 color:#5a3600!important;
 text-shadow:0 1px 0 rgba(255,255,255,.55)!important;
}
'''
Path('app-v6.67.css').write_text(css,encoding='utf-8')
idx=Path('index.html').read_text(encoding='utf-8').replace(OLD,NEW).replace('single-v666','single-v667').replace('session-coordinator-v666','session-coordinator-v667')
Path('index.html').write_text(idx,encoding='utf-8')
Path('latest-version.json').write_text(json.dumps({'version':107,'label':'v6.67','semanticVersion':'6.67','build':'v6.67','updatedAt':'2026-09-09T20:00:00+09:00','note':'v6.67 모임장 골드 배지 글씨 대비 개선 · 짙은 브라운 골드 텍스트'},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
for name in ['manifest.webmanifest','kokmatch-sw.js','sw.js']:
    p=Path(name); p.write_text(p.read_text(encoding='utf-8').replace(OLD,NEW),encoding='utf-8')
print('prepared v6.67')
