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
const esc637=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function actor637(){return me?.globalAdmin?'admin':me?.tempOrganizer?'temp':String(me?.role||'member')}
function role637(m){try{return typeof roleOf==='function'?String(roleOf(m)||'member'):String(m?.role||'member')}catch{return String(m?.role||'member')}}
function self637(m){return !!m&&String(m.id||'')===String(me?.memberId||me?.id||'')}
function attendance637(m){return ['admin','manager','organizer','temp'].includes(actor637())||self637(m)}
function editable637(m){return ['admin','manager','organizer'].includes(actor637())&&(role637(m)!=='admin'||!!me?.globalAdmin)}
function stateText637(m){try{return typeof stateLabel==='function'?stateLabel(String(m?.state||'out')):String(m?.state||'out')}catch{return String(m?.state||'out')}}
function slot637(name,html=''){return `<span class="kmRosterSlot621 kmRosterSlot-${name}621">${html||'<span class="kmRosterPlaceholder621" aria-hidden="true"></span>'}</span>`}
function btn637(cls,label){return `<button class="btn ${cls} kmRosterAction621" type="button">${label}</button>`}
function controlsHtml637(m){
 const state=String(m?.state||'out');
 const attendance=attendance637(m)&&!['playing','matched'].includes(state);
 const editable=editable637(m);
 let first='',second='';
 if(attendance){
  first=state==='waiting'?btn637('danger','퇴장'):btn637('enter','입장');
  second=state==='spectator'?btn637('danger','퇴장'):btn637('watch','관람');
 }
 const edit=editable?btn637('ghost','수정'):'';
 const readonly=!attendance&&!editable;
 return `<div class="memberActions48 v6MemberActions kmRosterActions621${readonly?' kmRosterReadonly621':''}"><div class="status">${esc637(stateText637(m))}</div><div class="memberBtns kmRosterBtns621${readonly?' kmRosterReadonlySlots637':''}"${readonly?' aria-hidden="true"':''}>${slot637('first',first)}${slot637('second',second)}${slot637('edit',edit)}</div></div>`;
}
/* The render source itself is canonical. This prevents later page renders from falling back to the old readonly status-only branch. */
try{memberControls=controlsHtml637;window.memberControls=memberControls}catch(e){console.warn('KokMatch v6.37 memberControls source',e)}
function canonicalizeCard637(card,map){
 const id=cardId637(card),m=map.get(id);if(!id||!m)return false;
 const rails=[...card.querySelectorAll(':scope > .kmRosterActions621,:scope > .v6MemberActions,:scope > .memberActions48,:scope > .memberActions60,:scope > .memberActions65')];
 const cur=rails.shift();
 const probe=document.createElement('div');probe.innerHTML=controlsHtml637(m);const next=probe.firstElementChild;if(!next)return false;
 if(cur)cur.replaceWith(next);else card.appendChild(next);
 for(const extra of rails)extra.remove();
 return true;
}
function needs637(){
 if(currentView!=='members')return false;
 const box=document.getElementById('members');if(!box)return false;
 for(const card of box.querySelectorAll('.memberCard')){
  const actions=card.querySelector(':scope > .kmRosterActions621');
  if(!actions)return true;
  const row=actions.querySelector(':scope > .kmRosterBtns621');
  if(!row||[...row.children].filter(el=>el.classList?.contains('kmRosterSlot621')).length!==3)return true;
  const buttons=[...row.querySelectorAll('button')];
  if(buttons.some(b=>String(b.textContent||'').trim()==='운동'||!b.classList.contains('kmRosterAction621')))return true;
  const id=cardId637(card),m=(S?.members||[]).find(x=>String(x?.id||'')===id);
  if(m){
   const wantReadonly=!attendance637(m)||['playing','matched'].includes(String(m.state||'out'))? !editable637(m):false;
   if(wantReadonly!==actions.classList.contains('kmRosterReadonly621'))return true;
  }
 }
 return false;
}
function stabilize637(force=false){
 if(repairing637||currentView!=='members')return;
 const box=document.getElementById('members');if(!box)return;
 repairing637=true;
 try{
  if(force||needs637()){
   const map=new Map((Array.isArray(S?.members)?S.members:[]).map(m=>[String(m?.id||''),m]));
   for(const card of box.querySelectorAll('.memberCard'))canonicalizeCard637(card,map);
  }
 }finally{repairing637=false}
}
function schedule637(force=false){
 clearTimeout(timer637);
 timer637=setTimeout(()=>{
  stabilize637(force);
  requestAnimationFrame(()=>stabilize637(false));
  setTimeout(()=>stabilize637(false),70);
  setTimeout(()=>stabilize637(false),220);
  setTimeout(()=>stabilize637(false),520);
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

/* v6.37: readonly members reserve the same three-slot rail without exposing actions */
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
 'note':'v6.37 일반회원 페이지 전환 렌더 원천 통합 · 권한 없는 회원카드도 동일 3칸 레이아웃 유지 · 개발자/관리자 기존 동작 유지'
}
(root/'latest-version.json').write_text(json.dumps(latest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

assert f'/app-v{NEW}.js?v={NEW}' in index
assert f'/app-v{NEW}.css?v={NEW}' in index
assert "__kokmatchRosterPaging637" in js
assert "memberControls=controlsHtml637" in js
assert "kmRosterReadonlySlots637" in css
print('built v6.37')
