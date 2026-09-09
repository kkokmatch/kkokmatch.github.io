from pathlib import Path
import json, shutil

OLD='6.67'
NEW='6.68'

archive=Path('versions/v6.67')
archive.mkdir(parents=True,exist_ok=True)
for name in ['app-v6.67.js','app-v6.67.css','index.html','latest-version.json','manifest.webmanifest','kokmatch-sw.js','sw.js']:
    p=Path(name)
    if p.exists():
        shutil.copy2(p,archive/p.name)

Path('app-v6.68.js').write_text(
    Path('app-v6.67.js').read_text(encoding='utf-8').replace(OLD,NEW),
    encoding='utf-8'
)

css=Path('app-v6.67.css').read_text(encoding='utf-8').replace(OLD,NEW)
css += '''

/* v6.68: manager profile aura only — deeper yellow-gold on white cards. */
html body img.roleAuraManagerImg664{
 --km-manager-frame-v668:1;
 opacity:.40!important;
 filter:sepia(1) saturate(8.5) hue-rotate(350deg) brightness(.93) contrast(1.12) drop-shadow(0 0 4px rgba(188,126,0,.24)) drop-shadow(0 0 10px rgba(224,164,18,.16))!important;
}
@media(max-width:430px){
 html body img.roleAuraManagerImg664{
  opacity:.38!important;
 }
}
'''
Path('app-v6.68.css').write_text(css,encoding='utf-8')

idx=Path('index.html').read_text(encoding='utf-8')
idx=idx.replace(OLD,NEW).replace('single-v667','single-v668').replace('session-coordinator-v667','session-coordinator-v668')
Path('index.html').write_text(idx,encoding='utf-8')

Path('latest-version.json').write_text(json.dumps({
    'version':108,
    'label':'v6.68',
    'semanticVersion':'6.68',
    'build':'v6.68',
    'updatedAt':'2026-09-09T20:04:00+09:00',
    'note':'v6.68 모임장 프로필 테두리만 진한 골드/노란색으로 강화'
},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

for name in ['manifest.webmanifest','kokmatch-sw.js','sw.js']:
    p=Path(name)
    p.write_text(p.read_text(encoding='utf-8').replace(OLD,NEW),encoding='utf-8')

print('prepared v6.68')
