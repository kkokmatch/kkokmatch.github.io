(()=>{
'use strict';
if(window.__kokmatchV54Fix22)return;
window.__kokmatchV54Fix22=true;
window.__kokmatchRosterCanonical='22.1';

function e22(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function jsId22(id){return String(id||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'")}
function getMember22(id){try{return typeof M==='function'?M(String(id||'')):null}catch{return null}}
function inviter22(m){return m?.type==='guest'?String(m?.inviter||'').trim():''}
function grade22(m){const c=String(m?.cls||'C').trim().toUpperCase(),safe=['A','B','C','D','E'].includes(c)?c:'C';return `<span class="tag gradeBadge50 grade-${safe.toLowerCase()}50">${e22(m?.age||'30')}${e22(safe)}</span>`}
function canSeeAdmin22(){const mode=String(S?.adminBadgeVisibility||'all');if(me?.globalAdmin)return true;if(mode==='all')return true;if(mode==='staff')return me?.role==='manager'||me?.role==='organizer';return false}
function roleBadge22(m){
 if(m?.type==='guest')return '<span class="roleBadge guest45">게스트</span>';
 const r=String(m?.role||'member');
 if(r==='admin')return canSeeAdmin22()?'<span class="roleBadge role-global">총관리자</span>':'';
 if(r==='manager')return '<span class="roleBadge role-manager">모임관리자</span>';
 if(r==='organizer')return '<span class="roleBadge role-organizer">게임편성자</span>';
 try{if(typeof isTemp==='function'&&isTemp(m))return '<span class="roleBadge role-temp">임시편성자</span>'}catch{}
 return '<span class="roleBadge role-member44">일반회원</span>';
}
function replaceAvatar22(card,m){
 if(!card||!m||typeof avatar!=='function')return;
 let html='';try{html=String(avatar(m)||'')}catch{}
 if(!html)return;
 const tmp=document.createElement('div');tmp.innerHTML=html;const next=tmp.firstElementChild;if(!next)return;
 next.dataset.memberId22=String(m.id||'');
 const cur=[...card.children].find(el=>el?.classList?.contains('avatar'))||card.querySelector('.profileIdentity21,.profileIdentity80,.genderAvatar39,.genderPerson54');
 if(cur)cur.replaceWith(next);else card.insertBefore(next,card.firstChild);
}
function replaceControls22(card,m){
 if(!card||!m||typeof memberControls!=='function')return;
 let html='';try{html=String(memberControls(m)||'')}catch{}
 if(!html)return;
 const tmp=document.createElement('div');tmp.innerHTML=html;const next=tmp.firstElementChild;if(!next)return;
 const kids=[...card.children];const old=kids.length>=3?kids[kids.length-1]:null;
 if(old&&old!==card.querySelector('.memberInfo48')&&!old.classList.contains('avatar'))old.replaceWith(next);else card.appendChild(next);
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
 const info=card.querySelector('.memberInfo48')||card.children?.[1];if(!info)return;
 let line=info.querySelector('.memberMainLine45')||info.querySelector('.name');
 if(line){line.classList.add('memberMainLine45');line.innerHTML=`<span class="memberName45">${e22(m.name)}</span>${grade22(m)}<span class="gamecnt">총 게임 ${Number(m.totalGames)||0}회</span>${roleBadge22(m)}`}
 const meta=info.querySelector(':scope > .meta')||info.querySelector('.meta');
 if(meta){const inv=inviter22(m);meta.innerHTML=`${e22(m.year||'')}년생 · ${e22(m.gender||'')}${inv?` <span class="inviteInfo45">· 초대 ${e22(inv)}</span>`:''}`}
 let pair=info.querySelector('.pairBtn');if(!pair){pair=document.createElement('button');pair.className='pairBtn';pair.textContent='같이한 경기 보기';info.appendChild(pair)}
 card.querySelectorAll('.v54genderText,.genderMark53').forEach(x=>x.remove());
}
function finalizeRoster22(){
 const box=document.getElementById('members');if(!box)return;
 try{window.__kokmatchRestampMembers46?.()}catch(err){console.warn('roster22 restamp',err)}
 const cards=[...box.querySelectorAll('.memberCard')],seen=[];
 cards.forEach(card=>{
  const id=String(card.dataset.memberId46||card.dataset.memberId22||'');const m=getMember22(id);if(!m)return;
  seen.push(id);
  card.dataset.memberId22=id;card.dataset.gender22=String(m.gender||'');card.dataset.grade22=String(m.cls||'');card.dataset.role22=String(m.role||'member');
  patchVisibleInfo22(card,m);replaceAvatar22(card,m);replaceControls22(card,m);patchActions22(card,m);
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