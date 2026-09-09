from pathlib import Path
import json, shutil, re, base64, hashlib

OLD='6.60'; NEW='6.61'

# Reconstruct the exact locally-verified 256px transparent WebP on the Actions runner.
parts=sorted(Path('scripts').glob('frame-v661-part*.b64'))
if len(parts)!=6: raise SystemExit(f'expected 6 frame chunks, got {len(parts)}')
encoded=''.join(p.read_text(encoding='utf-8').strip() for p in parts)
frame_bytes=base64.b64decode(encoded,validate=True)
expected_size=33324
expected_sha='a9c885e2363d1aff35c40c2f5beabb618e670091ef3ab3b5a93c0ca84c5b7129'
actual_sha=hashlib.sha256(frame_bytes).hexdigest()
if len(frame_bytes)!=expected_size or actual_sha!=expected_sha:
    raise SystemExit(f'frame binary mismatch size={len(frame_bytes)} sha={actual_sha}')
Path('assets').mkdir(exist_ok=True)
Path('assets/dev-challenger-frame-v661.webp').write_bytes(frame_bytes)

archive=Path('versions/v6.60'); archive.mkdir(parents=True, exist_ok=True)
for name in ['app-v6.60.js','app-v6.60.css','index.html','latest-version.json','manifest.webmanifest','kokmatch-sw.js','sw.js']:
    src=Path(name)
    if src.exists(): shutil.copy2(src, archive/src.name)

js=Path('app-v6.60.js').read_text(encoding='utf-8').replace(OLD,NEW)
pattern=re.compile(r"function applyChallenger659\(\)\{.*?\n\}\nfunction finalUi659\(\)",re.S)
replacement=r'''function ensureDevFrame661(target){
 if(!target)return;
 let frame=null;
 try{frame=target.querySelector(':scope > img.devFrame661')}catch{frame=target.querySelector('img.devFrame661')}
 if(!frame){
  frame=document.createElement('img');
  frame.className='devFrame661';
  frame.alt='';
  frame.setAttribute('aria-hidden','true');
  frame.draggable=false;
  frame.decoding='async';
  frame.src='/assets/dev-challenger-frame-v661.webp?v=6.61';
  target.appendChild(frame);
 }
}
function devMember661(id){
 try{const m=typeof M==='function'?M(String(id||'')):null;return !!m&&String(m.role||'')==='admin'}catch{return false}
}
function hostMemberId661(host,target){
 return String(target?.getAttribute?.('data-member-id')||host?.getAttribute?.('data-member-id')||host?.getAttribute?.('data-member-id22')||host?.getAttribute?.('data-member-id46')||'');
}
function applyChallenger659(){
 frameQueued659=false;
 try{
  const linked=me?.memberId&&typeof M==='function'?M(String(me.memberId)):null;
  const isDev=me?.globalAdmin===true||String(me?.role||'')==='admin'||String(linked?.role||'')==='admin';
  document.documentElement.classList.toggle('kokmatchDeveloper659',isDev);
  document.querySelectorAll('.devChallenger659').forEach(el=>el.classList.remove('devChallenger659'));
  const hosts=document.querySelectorAll('.memberCard,.queueCard,.pendingSlot,.playingPlayer53,.p,.slot');
  hosts.forEach(host=>{
   const target=profileTarget659(host);if(!target)return;
   const id=hostMemberId661(host,target);
   const byRole=id&&devMember661(id);
   const byBadge=!!host.querySelector('.roleBadge.role-global');
   if(byRole||byBadge)target.classList.add('devChallenger659');
  });
  document.querySelectorAll('.profileIdentity21[data-member-id],.profileAvatar53[data-member-id],.avatar[data-member-id]').forEach(target=>{
   if(devMember661(target.getAttribute('data-member-id')))target.classList.add('devChallenger659');
  });
  const mine=document.querySelector('#profileCard53 .profilePreview53');
  if(mine)mine.classList.toggle('devChallenger659',isDev);
  document.querySelectorAll('img.devFrame661').forEach(frame=>{if(!frame.parentElement?.classList.contains('devChallenger659'))frame.remove()});
  document.querySelectorAll('.devChallenger659').forEach(target=>{
   if(target.matches('.profileIdentity21,.profileAvatar53,.avatar,.profilePreview53'))ensureDevFrame661(target);
  });
 }catch{}
}
window.__kokmatchSyncDevFrame661=applyChallenger659;
window.__kokmatchDevFrame661='6.61';
function finalUi659()'''
js2,n=pattern.subn(replacement,js,1)
if n!=1: raise SystemExit(f'applyChallenger659 replacement count={n}')
Path('app-v6.61.js').write_text(js2,encoding='utf-8')

css=Path('app-v6.60.css').read_text(encoding='utf-8').replace(OLD,NEW)
css=css.replace('/assets/dev-challenger-frame-v660.webp','/assets/dev-challenger-frame-v661.webp')
css += r'''

/* v6.61 real DOM developer profile frame. */
html body .devChallenger659{
 position:relative!important;
 overflow:visible!important;
 isolation:isolate!important;
 border:0!important;
 outline:0!important;
 box-shadow:none!important;
 animation:none!important;
 transform:none!important;
}
html body .devChallenger659::before,
html body .devChallenger659::after{content:none!important;display:none!important;background:none!important}
html body .devChallenger659 > img.devFrame661{
 position:absolute!important;
 left:50%!important;
 top:50%!important;
 width:176%!important;
 height:176%!important;
 min-width:0!important;
 max-width:none!important;
 min-height:0!important;
 max-height:none!important;
 object-fit:contain!important;
 object-position:center!important;
 transform:translate(-50%,-50%) translateZ(0)!important;
 transform-origin:center!important;
 border:0!important;
 outline:0!important;
 border-radius:0!important;
 padding:0!important;
 margin:0!important;
 opacity:1!important;
 visibility:visible!important;
 display:block!important;
 background:transparent!important;
 pointer-events:none!important;
 z-index:20!important;
 filter:drop-shadow(0 0 3px rgba(66,220,255,.62)) drop-shadow(0 2px 5px rgba(20,53,110,.32))!important;
}
html body .devChallenger659 > img:not(.devFrame661),
html body .devChallenger659 > .profileFallback21,
html body .devChallenger659 > .genderPersonIcon21{position:relative!important;z-index:2!important;border-radius:50%!important}
#members .memberCard{overflow:visible!important;border:0!important;box-shadow:none!important}
#profileCard53,.profileHead53{overflow:visible!important}
@media(max-width:430px){html body .devChallenger659 > img.devFrame661{width:172%!important;height:172%!important}}
'''
Path('app-v6.61.css').write_text(css,encoding='utf-8')

idx=Path('index.html').read_text(encoding='utf-8').replace(OLD,NEW).replace('single-v659','single-v661').replace('session-coordinator-v659','session-coordinator-v661')
Path('index.html').write_text(idx,encoding='utf-8')
latest={
 'version':101,'label':'v6.61','semanticVersion':'6.61','build':'v6.61',
 'updatedAt':'2026-09-09T13:28:00+09:00',
 'note':'v6.61 개발자 실제 role 기반 판정 · 검증된 프레임 바이너리 재구성 · 실DOM 이미지 표시 수정'
}
Path('latest-version.json').write_text(json.dumps(latest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
for name in ['manifest.webmanifest','kokmatch-sw.js','sw.js']:
    p=Path(name)
    text=p.read_text(encoding='utf-8').replace(OLD,NEW).replace('/assets/dev-challenger-frame-v660.webp','/assets/dev-challenger-frame-v661.webp')
    p.write_text(text,encoding='utf-8')
print(f'v6.61 verified frame build prepared: {len(frame_bytes)} bytes sha256={actual_sha}')
