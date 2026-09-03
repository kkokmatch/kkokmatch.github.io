from pathlib import Path
import json

ROOT=Path(__file__).resolve().parent.parent

def read(name): return (ROOT/name).read_text(encoding='utf-8')
def write(name,text): (ROOT/name).write_text(text,encoding='utf-8')

js=read('app-v6.31.js')
css=read('app-v6.31.css')
if "window.__kokmatchStandalone='6.31'" not in js:
    raise SystemExit('v6.31 runtime marker missing')
js=js.replace('6.31','6.32')

js += r'''

/* KokMatch v6.32: restore roster controls after iOS/Kakao background resume */
(()=>{
'use strict';
if(window.__kokmatchResumeRoster632)return;
window.__kokmatchResumeRoster632=true;
let backgrounded632=false,busy632=false,timer632=0,lastRepair632=0;
const sleep632=ms=>new Promise(r=>setTimeout(r,ms));
function cardId632(card){return String(card?.dataset?.memberId22||card?.dataset?.memberId||card?.dataset?.memberId46||card?.dataset?.memberId80||'')}
function actor632(){try{return me?.globalAdmin?'admin':me?.tempOrganizer?'temp':String(me?.role||'member')}catch{return'member'}}
function memberRole632(m){try{return typeof roleOf==='function'?roleOf(m):String(m?.role||'member')}catch{return String(m?.role||'member')}}
function self632(m){if(!m)return false;try{if(me?.memberId)return String(me.memberId)===String(m.id)}catch{}try{return String(me?.displayName||'').trim()===String(m.name||'').trim()}catch{return false}}
function attendance632(m){return ['admin','manager','organizer','temp'].includes(actor632())||self632(m)}
function editable632(m){return ['admin','manager','organizer'].includes(actor632())&&(memberRole632(m)!=='admin'||!!me?.globalAdmin)}
function esc632(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]))}
function slot632(name,html){return `<span class="kmRosterSlot621 kmRosterSlot-${name}621">${html||'<span class="kmRosterPlaceholder621" aria-hidden="true"></span>'}</span>`}
function btn632(cls,label){return `<button class="btn ${cls} kmRosterAction621" type="button">${label}</button>`}
function controls632(m){
 const state=String(m?.state||'out'),attendance=attendance632(m)&&!['playing','matched'].includes(state),editable=editable632(m);
 let first='',second='';
 if(attendance){first=state==='waiting'?btn632('danger','퇴장'):btn632('enter','입장');second=state==='spectator'?btn632('danger','퇴장'):btn632('watch','관람')}
 const edit=editable?btn632('ghost','수정'):'';
 if(!attendance&&!editable)return `<div class="memberActions48 v6MemberActions kmRosterActions621 kmRosterReadonly621"><div class="status">${esc632(typeof stateLabel==='function'?stateLabel(state):state)}</div></div>`;
 return `<div class="memberActions48 v6MemberActions kmRosterActions621"><div class="status">${esc632(typeof stateLabel==='function'?stateLabel(state):state)}</div><div class="memberBtns kmRosterBtns621">${slot632('first',first)}${slot632('second',second)}${slot632('edit',edit)}</div></div>`;
}
function paint632(){
 if(currentView!=='members'||!Array.isArray(S?.members))return;
 const box=document.getElementById('members');if(!box)return;
 const map=new Map(S.members.map(m=>[String(m?.id||''),m]));
 for(const card of box.querySelectorAll('.memberCard')){
  const id=cardId632(card),m=map.get(id);if(!id||!m)continue;
  const t=document.createElement('div');t.innerHTML=controls632(m);const next=t.firstElementChild;if(!next)continue;
  const cur=card.querySelector(':scope > .kmRosterActions621,:scope > .v6MemberActions,:scope > .memberActions48,:scope > .memberActions60,:scope > .memberActions65');
  if(cur)cur.replaceWith(next);else card.appendChild(next);
 }
}
async function state632(){
 let last=null;
 for(const wait of [0,180,500]){
  if(wait)await sleep632(wait);
  try{
   const u=new URL(API);u.searchParams.set('api','state');if(currentGroupId)u.searchParams.set('groupId',currentGroupId);u.searchParams.set('resume632',Date.now());
   const r=await fetch(u,{headers:{'content-type':'application/json',...(T?{authorization:'Bearer '+T}:{})},cache:'no-store'});
   const x=await r.json().catch(()=>({}));if(!r.ok)throw new Error(x.error||('상태 조회 '+r.status));
   return x;
  }catch(e){last=e}
 }
 throw last||new Error('복귀 상태를 불러오지 못했습니다.');
}
async function repair632(reason='resume'){
 if(busy632||document.hidden||!T||currentView!=='members')return false;
 if(Date.now()-lastRepair632<250)return false;
 busy632=true;
 try{
  const gid=String(currentGroupId||''),oldMembers=Array.isArray(S?.members)?S.members:[];
  const x=await state632();
  if(gid&&String(currentGroupId||'')!==gid)return false;
  if(x?.data){const d=x.data||{},incoming=Array.isArray(d.members)?d.members:[];S={...d,members:incoming.length?incoming:oldMembers};window.S=S;me=x.user||me;group=x.group||group;groups=x.groups||groups;if(group?.groupId){currentGroupId=String(group.groupId);localStorage.setItem(GROUP_KEY,currentGroupId)};try{normalizeClient()}catch{}}
  try{renderHeader()}catch{}try{renderNav()}catch{}try{renderMembers()}catch{}
  paint632();requestAnimationFrame(paint632);setTimeout(paint632,60);setTimeout(paint632,180);setTimeout(paint632,360);
  lastRepair632=Date.now();backgrounded632=false;return true;
 }catch(e){
  console.warn('KokMatch v6.32 roster resume repair',reason,e);
  try{renderMembers();paint632();requestAnimationFrame(paint632)}catch{}
  return false;
 }finally{busy632=false}
}
function schedule632(reason,delay=90){clearTimeout(timer632);timer632=setTimeout(()=>repair632(reason),delay)}
window.addEventListener('pagehide',()=>{backgrounded632=true},{passive:true});
window.addEventListener('pageshow',e=>{if(e.persisted||backgrounded632)schedule632('pageshow',70)},{passive:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden){backgrounded632=true;return}if(backgrounded632)schedule632('visibility',90)},{passive:true});
window.addEventListener('focus',()=>{if(backgrounded632)schedule632('focus',120)},{passive:true});
window.__kokmatchRepairRosterResume632=repair632;
window.__kokmatchPaintRosterControls632=paint632;
})();
'''

write('app-v6.32.js',js)
write('app-v6.32.css',css)

index=read('index.html').replace('6.31','6.32')
if '/app-v6.32.js' not in index or '/app-v6.32.css' not in index:
    raise SystemExit('index v6.32 switch failed')
write('index.html',index)

sw=read('kokmatch-sw.js').replace("KOKMATCH_SW_VERSION='6.31'","KOKMATCH_SW_VERSION='6.32'")
write('kokmatch-sw.js',sw)
write('sw.js',"/* Compatibility entry for older KokMatch clients. */\nimportScripts('/kokmatch-sw.js?v=6.32');\n")

latest={
  'version':72,
  'label':'v6.32',
  'semanticVersion':'6.32',
  'build':'v6.32',
  'updatedAt':'2026-09-03T10:31:00+09:00',
  'note':'v6.32 iPhone 카카오톡 백그라운드 복귀 회원명부 버튼 복원 · 복귀 상태 직접 동기화 · 입장/관람/퇴장/수정 레이아웃 고정'
}
write('latest-version.json',json.dumps(latest,ensure_ascii=False,indent=2)+'\n')
print('Built KokMatch v6.32 candidate')
