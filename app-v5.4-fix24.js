(()=>{
'use strict';
if(window.__kokmatchV54Fix24)return;
window.__kokmatchV54Fix24=true;
window.__kokmatchInteractionPatch='24.0';

function safe24(fn,...args){
 try{const r=fn?.(...args);if(r&&typeof r.then==='function')r.catch(err=>{try{typeof showError==='function'?showError(err):alert(err?.message||String(err))}catch{}});return r}catch(err){try{typeof showError==='function'?showError(err):alert(err?.message||String(err))}catch{};return null}
}
function currentMember24(id){
 id=String(id||'');if(!id)return null;
 try{return typeof M==='function'?M(id):(window.S?.members||[]).find(m=>String(m?.id||'')===id)||null}catch{return (window.S?.members||[]).find(m=>String(m?.id||'')===id)||null}
}
function cardId24(card){return String(card?.dataset?.memberId22||card?.dataset?.memberId46||card?.dataset?.memberId||'')}
function replaceButton24(btn,key,handler,{enable=false}={}){
 if(!btn)return null;
 if(btn.dataset.v24clean===key){if(enable){btn.disabled=false;btn.removeAttribute('disabled');btn.style.pointerEvents='auto';btn.removeAttribute('aria-disabled')}return btn}
 const fresh=btn.cloneNode(true);
 fresh.dataset.v24clean=key;
 fresh.removeAttribute('onclick');fresh.onclick=null;
 if(enable){fresh.disabled=false;fresh.removeAttribute('disabled');fresh.style.pointerEvents='auto';fresh.removeAttribute('aria-disabled')}
 fresh.addEventListener('click',ev=>{ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();handler(ev,fresh)});
 btn.replaceWith(fresh);return fresh;
}
function callSetOther24(id,state){
 const fn=window.setOther||(typeof setOther==='function'?setOther:null);if(typeof fn!=='function')return false;safe24(fn,id,state);return true
}
function callEdit24(id){
 const fn=window.openEditMember||(typeof openEditMember==='function'?openEditMember:null);if(typeof fn!=='function')return false;safe24(fn,id);return true
}
function callPairs24(id){
 const fn=window.openPairs||(typeof openPairs==='function'?openPairs:null);if(typeof fn!=='function')return false;safe24(fn,id);return true
}
function callAdd24(){const fn=window.openAddMember||(typeof openAddMember==='function'?openAddMember:null);if(typeof fn!=='function')return false;safe24(fn);return true}
function callPage24(next){
 const fn=window.memberPageGo46||(typeof memberPageGo46==='function'?memberPageGo46:null);if(typeof fn!=='function')return false;
 const cur=Math.max(1,Number(window.__kokmatchMemberPage46)||1);safe24(fn,Math.max(1,cur+next));return true
}
function callGroup24(){
 const fn=window.openGroupSwitch23||window.openGroupSwitch||(typeof openGroupSwitch==='function'?openGroupSwitch:null);if(typeof fn!=='function')return false;safe24(fn);return true
}
function cleanGroup24(){
 const b=document.getElementById('groupBtn');if(!b)return;
 const mine=(()=>{try{return me||window.me}catch{return window.me}})();if(!mine)return;
 const g=(()=>{try{return group||window.group}catch{return window.group}})();
 const fresh=replaceButton24(b,'group',()=>callGroup24(),{enable:true});
 if(fresh){fresh.disabled=false;fresh.removeAttribute('disabled');fresh.style.pointerEvents='auto';fresh.removeAttribute('aria-disabled');const n=String(g?.name||'모임');if(!String(fresh.textContent||'').includes('변경 중'))fresh.textContent=n+' ▾'}
}
function cleanPager24(){
 const pager=document.querySelector('#members .memberPager46');if(!pager)return;
 [...pager.querySelectorAll('button')].forEach(btn=>{
  const t=String(btn.textContent||'').trim();if(t.includes('이전'))replaceButton24(btn,'pager-prev',()=>callPage24(-1));else if(t.includes('다음'))replaceButton24(btn,'pager-next',()=>callPage24(1));
 })
}
function cleanRoster24(){
 const box=document.getElementById('members');if(!box)return;
 const add=[...box.querySelectorAll('.title button')].find(b=>String(b.textContent||'').includes('회원등록'));if(add)replaceButton24(add,'add',()=>callAdd24());
 [...box.querySelectorAll('.memberCard')].forEach(card=>{
  const id=cardId24(card);if(!id||!currentMember24(id))return;
  const pair=card.querySelector('.pairBtn');if(pair)replaceButton24(pair,'pair-'+id,()=>callPairs24(id));
  [...card.querySelectorAll('.memberBtns button, button')].forEach(btn=>{
   if(btn===pair)return;const txt=String(btn.textContent||'').trim();
   if(txt==='수정'||/openEditMember\s*\(/.test(String(btn.getAttribute('onclick')||'')))replaceButton24(btn,'edit-'+id,()=>callEdit24(id));
   else if(btn.classList.contains('enter')||txt==='운동')replaceButton24(btn,'waiting-'+id,()=>callSetOther24(id,'waiting'));
   else if(btn.classList.contains('watch')||txt==='관람')replaceButton24(btn,'spectator-'+id,()=>callSetOther24(id,'spectator'));
   else if(btn.classList.contains('danger')&&txt==='퇴장')replaceButton24(btn,'out-'+id,()=>callSetOther24(id,'out'));
  });
 })
}
let refreshing24=false;
function refresh24(){if(refreshing24)return;refreshing24=true;try{cleanGroup24();cleanPager24();cleanRoster24()}finally{refreshing24=false}}
function later24(){queueMicrotask(refresh24);requestAnimationFrame(refresh24);setTimeout(refresh24,30)}

/* Final wrappers run after the stacked legacy render chain and then replace the interactive buttons. */
try{const h=renderHeader;renderHeader=function(...a){const r=h.apply(this,a);later24();return r};window.renderHeader=renderHeader}catch{}
try{const m=renderMembers;renderMembers=function(...a){const r=m.apply(this,a);later24();return r};window.renderMembers=renderMembers}catch{}
try{const a=renderAll;renderAll=function(...x){const r=a.apply(this,x);later24();return r};window.renderAll=renderAll}catch{}
try{const g=goView;goView=function(...x){const r=g.apply(this,x);later24();return r};window.goView=goView}catch{}

/* Capture fallback: even if a legacy listener is reattached later, execute the canonical action first. */
document.addEventListener('click',ev=>{
 const btn=ev.target?.closest?.('button');if(!btn)return;
 const groupBtn=btn.id==='groupBtn';
 const pager=btn.closest?.('#members .memberPager46');
 const card=btn.closest?.('#members .memberCard');
 const add=btn.closest?.('#members .title')&&String(btn.textContent||'').includes('회원등록');
 if(!groupBtn&&!pager&&!card&&!add)return;
 let handled=false;
 if(groupBtn)handled=callGroup24();
 else if(pager){const t=String(btn.textContent||'');handled=t.includes('이전')?callPage24(-1):t.includes('다음')?callPage24(1):false}
 else if(add)handled=callAdd24();
 else if(card){const id=cardId24(card);const t=String(btn.textContent||'').trim();if(id){if(btn.classList.contains('pairBtn')||t.includes('같이한 경기'))handled=callPairs24(id);else if(t==='수정')handled=callEdit24(id);else if(btn.classList.contains('enter')||t==='운동')handled=callSetOther24(id,'waiting');else if(btn.classList.contains('watch')||t==='관람')handled=callSetOther24(id,'spectator');else if(btn.classList.contains('danger')&&t==='퇴장')handled=callSetOther24(id,'out')}}
 if(handled){ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();later24()}
},true);

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',later24,{once:true});else later24();
})();