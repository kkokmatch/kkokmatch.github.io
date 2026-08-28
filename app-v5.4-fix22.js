(()=>{
'use strict';
if(window.__kokmatchV54Fix22)return;
window.__kokmatchV54Fix22=true;
window.__kokmatchRosterCanonical='22.0';

function jsId22(id){return String(id||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'")}
function getMember22(id){try{return typeof M==='function'?M(String(id||'')):null}catch{return null}}
function inviter22(m){const v=m?.type==='guest'?String(m?.inviter||'').trim():'';return v}
function replaceAvatar22(card,m){
 if(!card||!m||typeof avatar!=='function')return;
 let html='';try{html=String(avatar(m)||'')}catch{}
 if(!html)return;
 const tmp=document.createElement('div');tmp.innerHTML=html;const next=tmp.firstElementChild;if(!next)return;
 next.dataset.memberId22=String(m.id||'');
 const cur=[...card.children].find(el=>el?.classList?.contains('avatar'))||card.querySelector('.profileIdentity21,.profileIdentity80,.genderAvatar39');
 if(cur)cur.replaceWith(next);else card.insertBefore(next,card.firstChild);
}
function patchActions22(card,m){
 const id=String(m?.id||'');if(!id)return;const safe=jsId22(id);
 const pair=card.querySelector('.pairBtn');if(pair)pair.setAttribute('onclick',`openPairs('${safe}')`);
 card.querySelectorAll('button[onclick]').forEach(btn=>{
  const raw=String(btn.getAttribute('onclick')||'');
  if(/^\s*setOther\s*\(/.test(raw)){
   const state=(raw.match(/setOther\s*\(\s*['"][^'"]*['"]\s*,\s*['"]([^'"]+)['"]/)||[])[1];
   if(state)btn.setAttribute('onclick',`setOther('${safe}','${state}')`);
  }else if(/^\s*openEditMember\s*\(/.test(raw))btn.setAttribute('onclick',`openEditMember('${safe}')`);
 });
}
function patchVisibleInfo22(card,m){
 const name=card.querySelector('.memberName45');if(name&&name.textContent!==String(m.name||''))name.textContent=String(m.name||'');
 const info=card.querySelector('.memberInfo48')||card.children?.[1];
 const meta=info?.querySelector(':scope > .meta')||info?.querySelector('.meta');
 if(meta){const inv=inviter22(m);meta.innerHTML=`${String(m.year||'')}년생 · ${String(m.gender||'')}${inv?` <span class="inviteInfo45">· 초대 ${String(inv).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}</span>`:''}`}
 card.querySelectorAll('.v54genderText,.genderMark53').forEach(x=>x.remove());
}
function finalizeRoster22(){
 const box=document.getElementById('members');if(!box)return;
 try{window.__kokmatchRestampMembers46?.()}catch(e){console.warn('roster22 restamp',e)}
 const cards=[...box.querySelectorAll('.memberCard')];
 const seen=[];
 cards.forEach(card=>{
  const id=String(card.dataset.memberId46||'');const m=getMember22(id);if(!m)return;
  seen.push(id);card.dataset.memberId22=id;card.dataset.gender22=String(m.gender||'');
  patchVisibleInfo22(card,m);patchActions22(card,m);replaceAvatar22(card,m);
 });
 window.__kokmatchVisibleMemberIds22=seen;
 window.__kokmatchRosterFinalizedAt22=Date.now();
}
window.__kokmatchFinalizeRoster22=finalizeRoster22;

const rm22=renderMembers;
renderMembers=function(){const r=rm22();finalizeRoster22();requestAnimationFrame(finalizeRoster22);return r};
try{window.renderMembers=renderMembers}catch{}

const ra22=renderAll;
renderAll=function(){const r=ra22();if(currentView==='members'){finalizeRoster22();requestAnimationFrame(finalizeRoster22)}return r};
try{window.renderAll=renderAll}catch{}

const originalPageGo22=window.memberPageGo46;
if(typeof originalPageGo22==='function')window.memberPageGo46=function(p){const r=originalPageGo22(p);finalizeRoster22();requestAnimationFrame(finalizeRoster22);setTimeout(finalizeRoster22,40);return r};
const originalSearch22=window.searchMembers46;
if(typeof originalSearch22==='function')window.searchMembers46=function(v){const r=originalSearch22(v);finalizeRoster22();requestAnimationFrame(finalizeRoster22);return r};

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(finalizeRoster22,0),{once:true});else setTimeout(finalizeRoster22,0);
})();