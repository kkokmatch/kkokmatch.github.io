from pathlib import Path
import json

OLD='6.36'
NEW='6.37'
root=Path('.')

js=(root/f'app-v{OLD}.js').read_text(encoding='utf-8').replace(OLD,NEW)
patch=r'''

/* KokMatch v6.37: role-safe canonical member paging */
(()=>{
'use strict';
if(window.__kokmatchRosterPaging637)return;
window.__kokmatchRosterPaging637=true;
let timer637=0,repairing637=false,observer637=null;
const cardId637=card=>String(card?.dataset?.memberId22||card?.dataset?.memberId||card?.dataset?.memberId46||card?.dataset?.memberId80||'');
function readonlySlots637(actions){
 if(!actions||actions.querySelector('.kmRosterBtns621'))return;
 const row=document.createElement('div');
 row.className='memberBtns kmRosterBtns621 kmRosterReadonlySlots637';
 row.setAttribute('aria-hidden','true');
 row.innerHTML='<span class="kmRosterSlot621 kmRosterSlot-first621"><span class="kmRosterPlaceholder621"></span></span><span class="kmRosterSlot621 kmRosterSlot-second621"><span class="kmRosterPlaceholder621"></span></span><span class="kmRosterSlot621 kmRosterSlot-edit621"><span class="kmRosterPlaceholder621"></span></span>';
 actions.appendChild(row);
}
function needs637(){
 if(currentView!=='members')return false;
 const box=document.getElementById('members');if(!box)return false;
 for(const card of box.querySelectorAll('.memberCard')){
  const actions=card.querySelector(':scope > .kmRosterActions621,:scope > .v6MemberActions,:scope > .memberActions48,:scope > .memberActions60,:scope > .memberActions65');
  if(!actions)return true;
  if(actions.classList.contains('kmRosterReadonly621')&&!actions.querySelector('.kmRosterBtns621'))return true;
  const buttons=[...actions.querySelectorAll('button')];
  if(buttons.some(b=>String(b.textContent||'').trim()==='운동'))return true;
  if(buttons.some(b=>!b.classList.contains('kmRosterAction621')))return true;
 }
 return false;
}
function stabilize637(force=false){
 if(repairing637||currentView!=='members')return;
 const box=document.getElementById('members');if(!box)return;
 repairing637=true;
 try{
  if(force||needs637()){
   try{if(typeof window.__kokmatchPaintRosterControls632==='function')window.__kokmatchPaintRosterControls632()}catch(e){console.warn('KokMatch v6.37 canonical paint',e)}
  }
  for(const actions of box.querySelectorAll('.kmRosterActions621.kmRosterReadonly621'))readonlySlots637(actions);
  for(const row of box.querySelectorAll('.kmRosterBtns621')){
   const slots=[...row.children].filter(el=>el.classList?.contains('kmRosterSlot621'));
   if(slots.length===3)continue;
   while(row.firstChild)row.removeChild(row.firstChild);
   row.innerHTML='<span class="kmRosterSlot621 kmRosterSlot-first621"><span class="kmRosterPlaceholder621" aria-hidden="true"></span></span><span class="kmRosterSlot621 kmRosterSlot-second621"><span class="kmRosterPlaceholder621" aria-hidden="true"></span></span><span class="kmRosterSlot621 kmRosterSlot-edit621"><span class="kmRosterPlaceholder621" aria-hidden="true"></span></span>';
  }
 }finally{repairing637=false}
}
function schedule637(force=false){
 clearTimeout(timer637);
 timer637=setTimeout(()=>{
  stabilize637(force);
  requestAnimationFrame(()=>stabilize637(false));
  setTimeout(()=>stabilize637(false),60);
 },0);
}
window.__kokmatchStabilizeRoster637=stabilize637;
try{
 const baseRender637=renderMembers;
 renderMembers=function(...args){const r=baseRender637.apply(this,args);schedule637(true);return r};
 window.renderMembers=renderMembers;
}catch(e){console.warn('KokMatch v6.37 renderMembers wrapper',e)}
try{
 const basePage637=window.memberPageGo46;
 if(typeof basePage637==='function')window.memberPageGo46=function(...args){const r=basePage637.apply(this,args);schedule637(true);return r};
}catch(e){console.warn('KokMatch v6.37 member pager wrapper',e)}
function arm637(){
 const box=document.getElementById('members');if(!box||observer637)return;
 observer637=new MutationObserver(()=>{if(!repairing637&&needs637())schedule637(false)});
 observer637.observe(box,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{arm637();schedule637(true)},{once:true});else{arm637();schedule637(true)}
})();
'''
js+=patch
(root/f'app-v{NEW}.js').write_text(js,encoding='utf-8')

css=(root/f'app-v{OLD}.css').read_text(encoding='utf-8')
css+=r'''

/* v6.37: readonly members keep the same three-slot rail without exposing actions */
#members .kmRosterReadonly621 .kmRosterReadonlySlots637{display:grid!important;visibility:hidden!important;pointer-events:none!important;}
#members .kmRosterReadonly621 .kmRosterReadonlySlots637 .kmRosterSlot621{display:block!important;}
'''
(root/f'app-v{NEW}.css').write_text(css,encoding='utf-8')

index=(root/'index.html').read_text(encoding='utf-8').replace(OLD,NEW)
(root/'index.html').write_text(index,encoding='utf-8')
manifest=(root/'manifest.webmanifest').read_text(encoding='utf-8').replace(OLD,NEW)
(root/'manifest.webmanifest').write_text(manifest,encoding='utf-8')
sw=(root/'kokmatch-sw.js').read_text(encoding='utf-8').replace(OLD,NEW)
(root/'kokmatch-sw.js').write_text(sw,encoding='utf-8')
latest={
 'version':77,
 'label':'v6.37',
 'semanticVersion':'6.37',
 'build':'v6.37',
 'updatedAt':'2026-09-03T15:30:00+09:00',
 'note':'v6.37 일반회원 페이지 전환 시 회원카드 3칸 액션 레일 유지 · 권한 없는 버튼은 노출하지 않음 · 개발자/관리자 기존 동작 유지'
}
(root/'latest-version.json').write_text(json.dumps(latest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

assert f'/app-v{NEW}.js?v={NEW}' in index
assert f'/app-v{NEW}.css?v={NEW}' in index
assert "__kokmatchRosterPaging637" in js
assert "kmRosterReadonlySlots637" in css
print('built v6.37')
