from pathlib import Path
import json
import shutil

OLD='6.59'
NEW='6.60'
OLD_BUILD='v6.59'
NEW_BUILD='v6.60'

# Preserve the exact previous live bundle for rollback/reference.
archive=Path('versions/v6.59')
archive.mkdir(parents=True, exist_ok=True)
for name in ['app-v6.59.js','app-v6.59.css','index.html','latest-version.json','manifest.webmanifest','kokmatch-sw.js','sw.js']:
    shutil.copy2(name, archive / Path(name).name)

# Build the next standalone runtime from the current live runtime.
shutil.copy2('app-v6.59.js','app-v6.60.js')
shutil.copy2('app-v6.59.css','app-v6.60.css')

js_path=Path('app-v6.60.js')
js=js_path.read_text(encoding='utf-8')
js=js.replace(OLD,NEW)
js_path.write_text(js,encoding='utf-8')

css_path=Path('app-v6.60.css')
css=css_path.read_text(encoding='utf-8')
marker='/* v6.59 Challenger-inspired profile crest: gold ring + cyan/blue crystalline wings. */'
if marker not in css:
    raise SystemExit('v6.59 challenger css marker not found')
# Remove the old CSS-drawn crest and its specificity-lock block instead of stacking another hotfix.
css=css[:css.index(marker)]
css=css.replace(OLD,NEW)
css += r'''
/* v6.60 developer profile frame: optimized image asset generated for KokMatch. */
html .profileIdentity21.devChallenger659,
html .profileAvatar53.devChallenger659,
html .avatar.devChallenger659,
#profileCard53 .profilePreview53.devChallenger659{
 position:relative!important;
 overflow:visible!important;
 isolation:isolate!important;
 border:0!important;
 outline:0!important;
 box-shadow:none!important;
 animation:none!important;
 transform:none!important;
 z-index:1!important;
}
.devChallenger659::before{content:none!important;display:none!important}
.devChallenger659::after{
 content:""!important;
 position:absolute!important;
 left:-36%!important;
 top:-36%!important;
 width:172%!important;
 height:172%!important;
 background:url('/assets/dev-challenger-frame-v660.webp?v=6.60') center/contain no-repeat!important;
 pointer-events:none!important;
 z-index:5!important;
 filter:drop-shadow(0 0 3px rgba(66,220,255,.58)) drop-shadow(0 2px 5px rgba(20,53,110,.30))!important;
 transform:translateZ(0)!important;
 transform-origin:center!important;
}
.devChallenger659>img,
.devChallenger659>.profileFallback21,
.devChallenger659>.genderPersonIcon21{
 position:relative!important;
 z-index:2!important;
 border-radius:50%!important;
}
#members .memberCard{border:0!important;box-shadow:none!important}
#members .memberCard.devChallenger658,#members .memberCard.devChallenger659{border:0!important;outline:0!important;box-shadow:none!important}
#members .profileIdentity21.devChallenger659{margin-left:5px!important}
@media(max-width:430px){
 .devChallenger659::after{left:-34%!important;top:-34%!important;width:168%!important;height:168%!important}
}
@media(prefers-reduced-motion:reduce){.devChallenger659::after{filter:drop-shadow(0 1px 3px rgba(20,53,110,.24))!important}}
'''
css_path.write_text(css,encoding='utf-8')

# Switch entry points only in this build workspace; the workflow commits them only after green QA.
index=Path('index.html').read_text(encoding='utf-8').replace(OLD,NEW)
Path('index.html').write_text(index,encoding='utf-8')

latest=json.loads(Path('latest-version.json').read_text(encoding='utf-8'))
latest.update({
    'version':100,
    'label':NEW_BUILD,
    'semanticVersion':NEW,
    'build':NEW_BUILD,
    'updatedAt':'2026-09-09T13:16:00+09:00',
    'note':'v6.60 개발자 프로필 프레임 이미지 적용 · CSS 크레스트 제거 · 33KB WebP 캐시 최적화'
})
Path('latest-version.json').write_text(json.dumps(latest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

manifest=Path('manifest.webmanifest').read_text(encoding='utf-8').replace(OLD,NEW)
Path('manifest.webmanifest').write_text(manifest,encoding='utf-8')

sw=Path('kokmatch-sw.js').read_text(encoding='utf-8').replace(OLD,NEW)
asset="  '/assets/dev-challenger-frame-v660.webp?v=6.60',\n"
needle="const KOKMATCH_CORE=[\n"
if asset not in sw:
    sw=sw.replace(needle,needle+asset,1)
old_current="url.pathname==='/manifest.webmanifest'||url.pathname.startsWith('/icons/')"
new_current="url.pathname==='/manifest.webmanifest'||url.pathname==='/assets/dev-challenger-frame-v660.webp'||url.pathname.startsWith('/icons/')"
if old_current not in sw:
    raise SystemExit('service worker currentAsset target not found')
sw=sw.replace(old_current,new_current,1)
Path('kokmatch-sw.js').write_text(sw,encoding='utf-8')

compat=Path('sw.js').read_text(encoding='utf-8').replace(OLD,NEW)
Path('sw.js').write_text(compat,encoding='utf-8')

print('v6.60 image-frame build prepared')
