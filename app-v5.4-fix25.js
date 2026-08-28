(()=>{
'use strict';
if(window.__kokmatchV54Fix25)return;
window.__kokmatchV54Fix25=true;
window.__kokmatchTouchBridge='25.0';
document.documentElement.dataset.kokmatchTouchBridge='25.0';

let sx25=0,sy25=0,st25=0,moved25=false,lastHandled25=0;
function err25(e){try{typeof showError==='function'?showError(e):alert(e?.message||String(e))}catch{}}
function run25(fn,...args){try{const r=fn?.(...args);if(r&&typeof r.then==='function')r.catch(err25);return r}catch(e){err25(e);return null}}
function cardId25(card){return String(card?.dataset?.memberId22||card?.dataset?.memberId46||card?.dataset?.memberId||'')}
function fn25(name,fallback){const w=window[name];if(typeof w==='function')return w;try{return typeof fallback==='function'?fallback:null}catch{return null}}
function actionable25(btn){
 if(!btn)return false;
 if(btn.id==='groupBtn')return true;
 if(btn.closest?.('#members .memberPager46'))return true;
 if(btn.closest?.('#members .title')&&String(btn.textContent||'').includes('회원등록'))return true;
 const card=btn.closest?.('#members .memberCard');if(!card)return false;
 const t=String(btn.textContent||'').trim();
 return btn.classList.contains('partnerSetBtn66')||btn.classList.contains('recordBtn73')||btn.classList.contains('pairBtn')||t==='수정'||t==='운동'||t==='입장'||t==='관람'||t==='퇴장'||btn.classList.contains('enter')||btn.classList.contains('watch')||btn.classList.contains('danger');
}
function buttonAt25(x,y,target){
 const direct=target?.closest?.('button');if(actionable25(direct))return direct;
 const stack=typeof document.elementsFromPoint==='function'?document.elementsFromPoint(x,y):[];
 for(const el of stack){const b=el?.closest?.('button');if(actionable25(b))return b}
 return null;
}
function handle25(btn){
 if(!btn)return false;
 if(btn.id==='groupBtn'){
  const f=fn25('openGroupSwitch23',null)||fn25('openGroupSwitch',typeof openGroupSwitch==='function'?openGroupSwitch:null);if(!f)return false;run25(f);return true;
 }
 const pager=btn.closest?.('#members .memberPager46');
 if(pager){
  const t=String(btn.textContent||'');const f=fn25('memberPageGo46',typeof memberPageGo46==='function'?memberPageGo46:null);if(!f)return false;
  const cur=Math.max(1,Number(window.__kokmatchMemberPage46)||1);if(t.includes('다음'))run25(f,cur+1);else if(t.includes('이전'))run25(f,Math.max(1,cur-1));else return false;return true;
 }
 if(btn.closest?.('#members .title')&&String(btn.textContent||'').includes('회원등록')){
  const f=fn25('openAddMember',typeof openAddMember==='function'?openAddMember:null);if(!f)return false;run25(f);return true;
 }
 const card=btn.closest?.('#members .memberCard');if(!card)return false;
 const id=cardId25(card);if(!id)return false;
 const t=String(btn.textContent||'').trim();
 if(btn.classList.contains('partnerSetBtn66')){const f=fn25('openPartner66',null);if(!f)return false;run25(f,id);return true}
 if(btn.classList.contains('recordBtn73')||(btn.classList.contains('pairBtn')&&!btn.classList.contains('partnerSetBtn66'))||t.includes('가입·출석')||t.includes('같이한 경기')){const f=fn25('openPairs',typeof openPairs==='function'?openPairs:null);if(!f)return false;run25(f,id);return true}
 if(t==='수정'){const f=fn25('openEditMember',typeof openEditMember==='function'?openEditMember:null);if(!f)return false;run25(f,id);return true}
 if(btn.classList.contains('enter')||t==='운동'||t==='입장'){const f=fn25('setOther',typeof setOther==='function'?setOther:null);if(!f)return false;run25(f,id,'waiting');return true}
 if(btn.classList.contains('watch')||t==='관람'){const f=fn25('setOther',typeof setOther==='function'?setOther:null);if(!f)return false;run25(f,id,'spectator');return true}
 if((btn.classList.contains('danger')&&t==='퇴장')||t==='퇴장'){const f=fn25('setOther',typeof setOther==='function'?setOther:null);if(!f)return false;run25(f,id,'out');return true}
 return false;
}
function prep25(){
 document.querySelectorAll('#groupBtn,#members button').forEach(b=>{b.style.touchAction='manipulation';b.style.webkitTapHighlightColor='rgba(0,0,0,0)';if(b.id==='groupBtn'){b.disabled=false;b.removeAttribute('disabled');b.style.pointerEvents='auto'}})
}
function later25(){requestAnimationFrame(prep25);setTimeout(prep25,40);setTimeout(prep25,180)}

window.addEventListener('touchstart',ev=>{
 const t=ev.touches?.[0];if(!t)return;sx25=t.clientX;sy25=t.clientY;st25=Date.now();moved25=false;
},{capture:true,passive:true});
window.addEventListener('touchmove',ev=>{
 const t=ev.touches?.[0];if(!t)return;if(Math.abs(t.clientX-sx25)>12||Math.abs(t.clientY-sy25)>12)moved25=true;
},{capture:true,passive:true});
window.addEventListener('touchend',ev=>{
 const t=ev.changedTouches?.[0];if(!t||moved25||Date.now()-st25>900)return;
 const btn=buttonAt25(t.clientX,t.clientY,ev.target);if(!btn)return;
 if(handle25(btn)){
  lastHandled25=Date.now();
  try{ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation()}catch{}
  later25();
 }
},{capture:true,passive:false});
/* suppress the synthetic click generated after a handled iOS touch */
window.addEventListener('click',ev=>{
 if(Date.now()-lastHandled25>700)return;
 const btn=ev.target?.closest?.('button');if(actionable25(btn)){try{ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation()}catch{}}
},{capture:true});

try{const rm=renderMembers;renderMembers=function(...a){const r=rm.apply(this,a);later25();return r};window.renderMembers=renderMembers}catch{}
try{const rh=renderHeader;renderHeader=function(...a){const r=rh.apply(this,a);later25();return r};window.renderHeader=renderHeader}catch{}
try{const ra=renderAll;renderAll=function(...a){const r=ra.apply(this,a);later25();return r};window.renderAll=renderAll}catch{}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',later25,{once:true});else later25();
})();