(()=>{
'use strict';
if(window.__kokmatchV54Fix27)return;
window.__kokmatchV54Fix27=true;
window.__kokmatchIOSMemberSlotFix='27.1';
document.documentElement.dataset.kokmatchIOSMemberSlotFix='27.1';

const MULTI27='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-multi-api';
let sx27=0,sy27=0,st27=0,moved27=false,lastKey27='',lastAt27=0;

function trace27(msg){
 try{
  const s=String(msg||'');window.__kokmatchV27Last=s;
  if(!location.pathname.includes('ios-diagnostic'))return;
  let el=document.getElementById('kokmatchV27Status')||document.getElementById('kokmatchV26Status');
  if(!el){el=document.createElement('div');el.id='kokmatchV27Status';el.style.cssText='position:fixed;left:8px;right:8px;bottom:calc(74px + env(safe-area-inset-bottom));z-index:100000;background:#172033ee;color:#fff;border-radius:10px;padding:8px 10px;font:700 11px/1.35 -apple-system,BlinkMacSystemFont,sans-serif;pointer-events:none';document.body.appendChild(el)}
  el.textContent='v27.1 · '+s;
 }catch{}
}
function err27(e){trace27('오류 · '+(e?.message||String(e)));try{typeof showError==='function'?showError(e):alert(e?.message||String(e))}catch{}}
function token27(){try{return String(T||window.T||localStorage.getItem('kokmatch_token')||'')}catch{return String(window.T||localStorage.getItem('kokmatch_token')||'')}}
function gid27(){try{return String(currentGroupId||window.currentGroupId||localStorage.getItem('kokmatch_group_id')||'')}catch{return String(window.currentGroupId||localStorage.getItem('kokmatch_group_id')||'')}}
function members27(){try{return Array.isArray(S?.members)?S.members:(Array.isArray(window.S?.members)?window.S.members:[])}catch{return Array.isArray(window.S?.members)?window.S.members:[]}}
function cardId27(card){return String(card?.dataset?.memberId22||card?.dataset?.memberId46||card?.dataset?.memberId||'')}
function member27(id){id=String(id||'');return members27().find(m=>String(m?.id||'')===id)||null}
async function json27(url,opt={}){const r=await fetch(url,{cache:'no-store',...opt}),x=await r.json().catch(()=>({}));if(!r.ok)throw new Error(x.error||x.message||`요청 실패 (${r.status})`);return x}
function dedupe27(key){const now=Date.now();if(lastKey27===key&&now-lastAt27<700)return true;lastKey27=key;lastAt27=now;return false}
function within27(r,x,y,pad=6){return !!r&&x>=r.left-pad&&x<=r.right+pad&&y>=r.top-pad&&y<=r.bottom+pad}

function candidates27(ev,x,y){
 const out=[];const add=v=>{if(v&&v.nodeType===1&&!out.includes(v))out.push(v)};
 try{add(ev.target);for(const v of ev.composedPath?.()||[])add(v)}catch{}
 try{for(const v of document.elementsFromPoint?.(x,y)||[])add(v)}catch{}
 return out;
}
function actionFromButton27(btn,card){
 if(!btn)return null;card=card||btn.closest?.('#members .memberCard');if(!card||!btn.closest?.('.memberBtns'))return null;
 const id=cardId27(card);if(!id)return null;const text=String(btn.textContent||'').trim();let kind='',mode='';
 if(text==='수정')kind='edit';
 else if(btn.classList.contains('enter')||text==='입장'||text==='운동'){kind='attendance';mode='waiting'}
 else if(btn.classList.contains('watch')||text==='관람'){kind='attendance';mode='spectator'}
 else if((btn.classList.contains('danger')&&text==='퇴장')||text==='퇴장'){kind='attendance';mode='out'}
 if(!kind)return null;return{id,kind,mode,text,card,btn};
}
function cardCandidates27(all){const cards=[];for(const el of all){const c=el.closest?.('#members .memberCard');if(c&&!cards.includes(c))cards.push(c)}return cards}
function actionAt27(ev,x,y){
 const all=candidates27(ev,x,y);
 for(const el of all){const btn=el.closest?.('#members .memberBtns button');const a=actionFromButton27(btn);if(a)return a}
 const cards=cardCandidates27(all);
 for(const card of cards){
  for(const btn of card.querySelectorAll('.memberBtns button')){if(within27(btn.getBoundingClientRect(),x,y,8)){const a=actionFromButton27(btn,card);if(a)return a}}
  for(const slot of card.querySelectorAll('.memberBtnSlot65')){if(!within27(slot.getBoundingClientRect(),x,y,6))continue;const a=actionFromButton27(slot.querySelector('button'),card);if(a)return a}
 }
 return null;
}
function memberTouchInfo27(ev,x,y){const all=candidates27(ev,x,y),cards=cardCandidates27(all);if(!cards.length)return null;return{card:cards[0],target:all[0]||null}}

function edit27(id){
 id=String(id||'');const m=member27(id);if(!m){err27(new Error('수정할 회원을 찾지 못했습니다.'));return false}
 if(dedupe27('edit:'+id))return true;trace27('회원수정 실행 · '+String(m.name||id));
 try{editMemberId=id}catch{}
 try{if(typeof openMemberModal==='function'){openMemberModal(m);return true}}catch(e){err27(e);return false}
 try{if(typeof window.openMemberModal==='function'){window.openMemberModal(m);return true}}catch(e){err27(e);return false}
 err27(new Error('회원 수정창 함수를 찾지 못했습니다.'));return false;
}
function attendance27(id,mode){
 id=String(id||'');if(!member27(id)){err27(new Error('상태를 변경할 회원을 찾지 못했습니다.'));return false}
 const key='att:'+id+':'+mode;if(dedupe27(key))return true;
 const label=mode==='waiting'?'입장':mode==='spectator'?'관람':'퇴장';trace27(label+' 요청 · '+id);
 const u=new URL(MULTI27);u.searchParams.set('api','action');u.searchParams.set('_fix27',Date.now());
 const body={action:'set_member_attendance',groupId:gid27(),memberId:id,mode};
 json27(u,{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+token27()},body:JSON.stringify(body)}).then(x=>{
  if(x?.data){try{S=x.data;window.S=S}catch{};try{if(typeof normalizeClient==='function')normalizeClient()}catch{};try{if(typeof renderAll==='function')renderAll()}catch{}}
  trace27(label+' 완료 · '+id);
 }).catch(err27);return true;
}
function run27(a){if(!a)return false;if(a.kind==='edit')return edit27(a.id);if(a.kind==='attendance')return attendance27(a.id,a.mode);return false}

window.addEventListener('touchstart',ev=>{
 const t=ev.touches?.[0];if(!t)return;sx27=t.clientX;sy27=t.clientY;st27=Date.now();moved27=false;
 const a=actionAt27(ev,sx27,sy27);if(a){trace27('회원버튼 터치 감지 · '+a.text+' · '+a.id);return}
 const info=memberTouchInfo27(ev,sx27,sy27);if(info)trace27('회원영역 터치 감지 · '+cardId27(info.card)+' · '+String(info.target?.className||info.target?.tagName||'target').slice(0,36));
},{capture:true,passive:true});
window.addEventListener('touchmove',ev=>{const t=ev.touches?.[0];if(!t)return;if(Math.abs(t.clientX-sx27)>14||Math.abs(t.clientY-sy27)>14)moved27=true},{capture:true,passive:true});
window.addEventListener('touchend',ev=>{
 const t=ev.changedTouches?.[0];if(!t||moved27||Date.now()-st27>1100)return;const a=actionAt27(ev,t.clientX,t.clientY);if(!a)return;
 try{ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation()}catch{};run27(a);
},{capture:true,passive:false});

window.__kokmatchResolveMemberSlot27=(target,x,y)=>{const fake={target,composedPath:()=>[target]};return actionAt27(fake,Number(x)||0,Number(y)||0)};
trace27('회원 좌표터치 보정 준비');
})();
