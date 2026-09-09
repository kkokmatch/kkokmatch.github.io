from pathlib import Path
import json, shutil

OLD='6.60'; NEW='6.61'
# Archive current live release before switching.
archive=Path('versions/v6.60'); archive.mkdir(parents=True, exist_ok=True)
for name in ['app-v6.60.js','app-v6.60.css','index.html','latest-version.json','manifest.webmanifest','kokmatch-sw.js','sw.js']:
    src=Path(name)
    if src.exists(): shutil.copy2(src, archive/src.name)

js=Path('app-v6.60.js').read_text(encoding='utf-8').replace(OLD,NEW)
js += r'''

/* v6.61: real DOM developer profile-frame image. Replaces pseudo-element-only rendering. */
(()=>{
'use strict';
if(window.__kokmatchDevFrame661)return;
window.__kokmatchDevFrame661='6.61';
const SRC='/assets/dev-challenger-frame-v660.webp?v=6.61';
let queued=false;
function validTarget(el){return !!el&&el.classList?.contains('devChallenger659')&&(el.matches('.profileIdentity21,.profileAvatar53,.avatar,.profilePreview53'));}
function sync(){
 queued=false;
 try{
  document.querySelectorAll('img.devFrame661').forEach(frame=>{if(!validTarget(frame.parentElement))frame.remove()});
  document.querySelectorAll('.devChallenger659').forEach(target=>{
   if(!validTarget(target))return;
   let frame=null;
   try{frame=target.querySelector(':scope > img.devFrame661')}catch{frame=target.querySelector('img.devFrame661')}
   if(!frame){
    frame=document.createElement('img');
    frame.className='devFrame661';
    frame.alt='';
    frame.setAttribute('aria-hidden','true');
    frame.draggable=false;
    frame.decoding='async';
    frame.src=SRC;
    target.appendChild(frame);
   }else if(!String(frame.src||'').includes('dev-challenger-frame-v660.webp')) frame.src=SRC;
  });
 }catch{}
}
function queue(){if(queued)return;queued=true;queueMicrotask(sync)}
window.__kokmatchSyncDevFrame661=sync;
try{
 const prev=renderAll;
 renderAll=function(...args){const r=prev.apply(this,args);queue();return r};
}catch{}
for(const name of ['renderMembers','renderQueue','renderPlaying','renderSettings']){
 try{
  const prev=eval(name);if(typeof prev!=='function')continue;
  const wrapped=function(...args){const r=prev.apply(this,args);queue();return r};
  eval(name+'=wrapped');
 }catch{}
}
const root=document.body||document.documentElement;
if(root)new MutationObserver(queue).observe(root,{childList:true,subtree:true});
queue();
})();
'''
Path('app-v6.61.js').write_text(js,encoding='utf-8')

css=Path('app-v6.60.css').read_text(encoding='utf-8').replace(OLD,NEW)
css += r'''

/* v6.61 real image developer profile frame: no pseudo-element rendering. */
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
 'note':'v6.61 개발자 프로필 프레임 실DOM 이미지 적용 · 실기기 미표시 수정 · 이미지 로드/크기 QA 강화'
}
Path('latest-version.json').write_text(json.dumps(latest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

for name in ['manifest.webmanifest','kokmatch-sw.js','sw.js']:
    p=Path(name); p.write_text(p.read_text(encoding='utf-8').replace(OLD,NEW),encoding='utf-8')
print('v6.61 build prepared')
