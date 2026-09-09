from pathlib import Path
import json, shutil, base64

OLD='6.64'
NEW='6.65'

# Archive exact v6.64 production runtime before switching the entrypoint.
archive=Path('versions/v6.64')
archive.mkdir(parents=True,exist_ok=True)
for name in ['app-v6.64.js','app-v6.64.css','index.html','latest-version.json','manifest.webmanifest','kokmatch-sw.js','sw.js']:
    p=Path(name)
    if p.exists(): shutil.copy2(p,archive/p.name)

# Materialize the user-selected organizer silver aura as a real external WebP asset.
asset=Path('assets/organizer-silver-aura-v665.webp')
asset.parent.mkdir(parents=True,exist_ok=True)
b64=Path('scripts/organizer-silver-aura-v665.b64').read_text(encoding='utf-8').strip()
asset.write_bytes(base64.b64decode(b64))
if asset.stat().st_size < 4000:
    raise SystemExit('organizer aura asset decode failed')

js=Path('app-v6.64.js').read_text(encoding='utf-8').replace(OLD,NEW)
old_const="const SRC='/assets/dev-prism-frame-v662.webp?v=6.65';"
new_const="const MANAGER_SRC='/assets/dev-prism-frame-v662.webp?v=6.65';\nconst ORGANIZER_SRC='/assets/organizer-silver-aura-v665.webp?v=6.65';"
if old_const not in js: raise SystemExit('role aura source marker missing')
js=js.replace(old_const,new_const,1)
old_src="if(frame.getAttribute('src')!==SRC)frame.src=SRC;"
new_src="const src=role==='manager'?MANAGER_SRC:ORGANIZER_SRC;\n if(frame.getAttribute('src')!==src)frame.src=src;"
if old_src not in js: raise SystemExit('role aura assignment marker missing')
js=js.replace(old_src,new_src,1)
Path('app-v6.65.js').write_text(js,encoding='utf-8')

css=Path('app-v6.64.css').read_text(encoding='utf-8').replace(OLD,NEW)
old_org="html body img.roleAuraOrganizerImg664{opacity:.31!important;filter:grayscale(1) brightness(1.36) contrast(.84) drop-shadow(0 0 4px rgba(210,220,235,.14)) drop-shadow(0 0 10px rgba(232,239,250,.09))!important}"
new_org="html body img.roleAuraOrganizerImg664{opacity:.64!important;filter:saturate(.58) brightness(.96) contrast(1.18) drop-shadow(0 0 3px rgba(118,137,171,.30)) drop-shadow(0 0 8px rgba(167,188,224,.26)) drop-shadow(0 0 14px rgba(211,224,246,.20))!important}"
if old_org not in css: raise SystemExit('organizer aura css marker missing')
css=css.replace(old_org,new_org,1)
old_mobile="html body img.roleAuraOrganizerImg664{width:136%!important;height:136%!important;opacity:.29!important}"
new_mobile="html body img.roleAuraOrganizerImg664{width:138%!important;height:138%!important;opacity:.61!important}"
if old_mobile not in css: raise SystemExit('organizer mobile aura marker missing')
css=css.replace(old_mobile,new_mobile,1)
css += r'''

/* v6.65: developer badge now matches the soft prism aura family while preserving shared badge geometry. */
.roleBadge.role-global{
 --km-dev-badge-v665:1;
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
 line-height:normal!important;
 white-space:nowrap!important;
 overflow:hidden!important;
 color:#fbfdff!important;
 border:1px solid rgba(220,234,255,.92)!important;
 background-color:#7b8fdc!important;
 background-image:
   linear-gradient(116deg,rgba(255,255,255,.62) 0 9%,transparent 10% 36%,rgba(255,255,255,.18) 37% 52%,transparent 53%),
   linear-gradient(135deg,#65c8f8 0%,#817de9 28%,#d99adf 50%,#f3c998 72%,#7fd9df 100%)!important;
 box-shadow:inset 0 1px 0 rgba(255,255,255,.78),inset 0 -1px 0 rgba(93,107,180,.16),0 0 4px rgba(111,197,235,.16),0 1px 2px rgba(83,96,160,.12)!important;
 text-shadow:0 1px 1px rgba(83,90,148,.24)!important;
}
.roleBadge.role-global::before{content:none!important;display:none!important}
.roleBadge.role-global::after{
 content:''!important;
 display:block!important;
 position:absolute!important;
 left:-24%!important;
 top:-70%!important;
 width:34%!important;
 height:240%!important;
 background:linear-gradient(90deg,transparent,rgba(255,255,255,.32),transparent)!important;
 transform:rotate(18deg)!important;
 opacity:.31!important;
 pointer-events:none!important;
}
'''
Path('app-v6.65.css').write_text(css,encoding='utf-8')

idx=Path('index.html').read_text(encoding='utf-8').replace(OLD,NEW).replace('single-v664','single-v665').replace('session-coordinator-v664','session-coordinator-v665')
Path('index.html').write_text(idx,encoding='utf-8')
Path('latest-version.json').write_text(json.dumps({'version':105,'label':'v6.65','semanticVersion':'6.65','build':'v6.65','updatedAt':'2026-09-09T18:12:00+09:00','note':'v6.65 운영진 은빛 오로라 이미지 교체 · 흰 카드 대비 강화 · 개발자 배지 프리즘 질감 통일'},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

manifest=Path('manifest.webmanifest')
manifest.write_text(manifest.read_text(encoding='utf-8').replace(OLD,NEW),encoding='utf-8')

sw=Path('kokmatch-sw.js').read_text(encoding='utf-8').replace(OLD,NEW)
needle="  '/assets/dev-prism-frame-v662.webp?v=6.65',"
if needle in sw and "organizer-silver-aura-v665.webp?v=6.65" not in sw:
    sw=sw.replace(needle,needle+"\n  '/assets/organizer-silver-aura-v665.webp?v=6.65',",1)
needle2="url.pathname==='/assets/dev-prism-frame-v662.webp'||url.pathname.startsWith('/icons/')"
replace2="url.pathname==='/assets/dev-prism-frame-v662.webp'||url.pathname==='/assets/organizer-silver-aura-v665.webp'||url.pathname.startsWith('/icons/')"
if needle2 not in sw: raise SystemExit('service worker asset matcher missing')
sw=sw.replace(needle2,replace2,1)
Path('kokmatch-sw.js').write_text(sw,encoding='utf-8')

p=Path('sw.js');p.write_text(p.read_text(encoding='utf-8').replace(OLD,NEW),encoding='utf-8')
print('prepared v6.65')
