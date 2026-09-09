from pathlib import Path
import base64, hashlib, json, shutil

OLD='6.61'
NEW='6.62'
PARTS=[
 ('scripts/prism-v662-part01.b64',6000,'d8ff41477c4258127fce76632c9d4eb74b77a8bf3e5cef8b78f5e4e672873d37'),
 ('scripts/prism-v662-part02.b64',6000,'9ab751767de37ceab0ff396cd36d9a93fa4edb200c335eaf1c7afb324dbb8b8b'),
 ('scripts/prism-v662-part03.b64',6000,'25d7672c3280e174a6e39ba01c3d6e6ef9dbcb3ad794c7607cc6bab2162a6ba2'),
 ('scripts/prism-v662-part04.b64',6000,'8c99c494318364e61efc62968f0525d092466b805af5cd7f0aee3578d6cf704f'),
 ('scripts/prism-v662-part05.b64',6000,'a23a45e59f4aa3f140ab1139f0235d890889f32c2a0775f15f963058b39ec3ed'),
 ('scripts/prism-v662-part06.b64',6000,'a396d5d6d41b4eadcbd8097a2a86b20a86aff447ee353e32e00a6b15a87d4756'),
 ('scripts/prism-v662-part07.b64',3076,'8bd037bf95e07b3242808184109e0b3c98632398c75ec7a85636475f3870b77d'),
]
FINAL_SIZE=39076
FINAL_SHA='60fd6b775fc5a70831b65f4b2bce4a58bc132a5ff25513062251dfc9faff251a'

# Reconstruct and verify the exact user-approved prism frame asset.
out=bytearray()
for path, expected_size, expected_sha in PARTS:
    raw=base64.b64decode(Path(path).read_text(encoding='utf-8').strip(), validate=True)
    sha=hashlib.sha256(raw).hexdigest()
    if len(raw)!=expected_size or sha!=expected_sha:
        raise SystemExit(f'frame chunk mismatch {path}: size={len(raw)} sha={sha}')
    out.extend(raw)
final=bytes(out)
sha=hashlib.sha256(final).hexdigest()
if len(final)!=FINAL_SIZE or sha!=FINAL_SHA:
    raise SystemExit(f'frame binary mismatch size={len(final)} sha={sha}')
asset=Path('assets/dev-prism-frame-v662.webp')
asset.parent.mkdir(parents=True,exist_ok=True)
asset.write_bytes(final)

# Archive the exact v6.61 production runtime before switching the entrypoint.
archive=Path('versions/v6.61')
archive.mkdir(parents=True,exist_ok=True)
for name in ['app-v6.61.js','app-v6.61.css','index.html','latest-version.json','manifest.webmanifest','kokmatch-sw.js','sw.js']:
    src=Path(name)
    if src.exists(): shutil.copy2(src, archive/src.name)
old_asset=Path('assets/dev-challenger-frame-v661.webp')
if old_asset.exists():
    aa=archive/'assets'; aa.mkdir(parents=True,exist_ok=True); shutil.copy2(old_asset,aa/old_asset.name)

# Build v6.62 only from the current v6.61 runtime.
js=Path('app-v6.61.js').read_text(encoding='utf-8')
js=js.replace(OLD,NEW).replace('dev-challenger-frame-v661.webp','dev-prism-frame-v662.webp')
Path('app-v6.62.js').write_text(js,encoding='utf-8')

css=Path('app-v6.61.css').read_text(encoding='utf-8').replace(OLD,NEW)
css += r'''

/* v6.62: subtle rainbow prism aura on developer profile photos only. */
html body .devChallenger659 > img.devFrame661{
 --km-dev-frame-v662:1;
 width:140%!important;
 height:140%!important;
 opacity:.48!important;
 filter:drop-shadow(0 0 4px rgba(94,214,255,.10)) drop-shadow(0 0 9px rgba(226,160,255,.07))!important;
 mix-blend-mode:normal!important;
}
@media(max-width:430px){
 html body .devChallenger659 > img.devFrame661{
  width:138%!important;
  height:138%!important;
  opacity:.46!important;
 }
}

/* v6.62: calm bright-blue crystal developer badge; permission logic is unchanged. */
.roleBadge.role-global{
 --km-dev-badge-v662:1;
 position:relative!important;
 display:inline-flex!important;
 align-items:center!important;
 justify-content:center!important;
 gap:3px!important;
 padding:3px 7px!important;
 border-radius:7px!important;
 background-color:#168edc!important;
 background-image:
   linear-gradient(125deg,rgba(255,255,255,.52) 0 9%,transparent 10% 34%,rgba(255,255,255,.14) 35% 50%,transparent 51%),
   linear-gradient(135deg,#0869c8 0%,#39d7ff 33%,#189eea 62%,#075db8 100%)!important;
 color:#f7fdff!important;
 border:1px solid rgba(139,231,255,.78)!important;
 box-shadow:inset 0 1px 0 rgba(255,255,255,.68),inset 0 -1px 0 rgba(5,73,151,.22),0 1px 3px rgba(14,111,190,.13)!important;
 text-shadow:0 1px 1px rgba(0,68,130,.24)!important;
 overflow:hidden!important;
}
.roleBadge.role-global::before{
 content:'◆'!important;
 display:inline-block!important;
 position:relative!important;
 inset:auto!important;
 width:auto!important;
 height:auto!important;
 background:none!important;
 font-size:8px!important;
 line-height:1!important;
 color:#dffbff!important;
 opacity:.96!important;
 transform:none!important;
 text-shadow:0 0 3px rgba(143,238,255,.55)!important;
}
.roleBadge.role-global::after{
 content:''!important;
 display:block!important;
 position:absolute!important;
 left:-26%!important;
 top:-55%!important;
 width:42%!important;
 height:210%!important;
 background:linear-gradient(90deg,transparent,rgba(255,255,255,.28),transparent)!important;
 transform:rotate(20deg)!important;
 opacity:.34!important;
 pointer-events:none!important;
}
'''
Path('app-v6.62.css').write_text(css,encoding='utf-8')

idx=Path('index.html').read_text(encoding='utf-8')
idx=idx.replace(OLD,NEW).replace('single-v661','single-v662').replace('session-coordinator-v661','session-coordinator-v662')
Path('index.html').write_text(idx,encoding='utf-8')

latest={
 'version':102,
 'label':'v6.62',
 'semanticVersion':'6.62',
 'build':'v6.62',
 'updatedAt':'2026-09-09T14:51:00+09:00',
 'note':'v6.62 개발자 프리즘 오라 프로필 프레임 · 블루 크리스털 개발자 배지'
}
Path('latest-version.json').write_text(json.dumps(latest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

for name in ['manifest.webmanifest','kokmatch-sw.js','sw.js']:
    p=Path(name)
    if not p.exists(): continue
    text=p.read_text(encoding='utf-8').replace(OLD,NEW).replace('dev-challenger-frame-v661.webp','dev-prism-frame-v662.webp')
    p.write_text(text,encoding='utf-8')

print(f'v6.62 prism build prepared: {len(final)} bytes sha256={sha}')
