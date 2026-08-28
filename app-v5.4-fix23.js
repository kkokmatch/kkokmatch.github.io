(()=>{
'use strict';
if(window.__kokmatchV54Fix23)return;
window.__kokmatchV54Fix23=true;
window.__kokmatchInteractionPatch='23.1';

const AUTH23='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-auth-v38';
const MULTI23='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-multi-api';
const legacyPageGo23=typeof window.memberPageGo46==='function'?window.memberPageGo46:null;
const legacyOpenEdit23=typeof window.openEditMember==='function'?window.openEditMember:null;
let switching23=false,membershipsBusy23=false,syncBusy23=false;

function esc23(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function tok23(){try{return String(T||window.T||localStorage.getItem('kokmatch_token')||'')}catch{return String(window.T||localStorage.getItem('kokmatch_token')||'')}}
function gid23(){try{return String(currentGroupId||window.currentGroupId||localStorage.getItem('kokmatch_group_id')||'')}catch{return String(window.currentGroupId||localStorage.getItem('kokmatch_group_id')||'')}}
function mine23(){try{return me||window.me||null}catch{return window.me||null}}
function grp23(){try{return group||window.group||null}catch{return window.group||null}}
function member23(id){try{return typeof M==='function'?M(String(id||'')):null}catch{return null}}
function setToken23(v){v=String(v||'');try{T=v}catch{};try{window.T=v}catch{};try{localStorage.setItem('kokmatch_token',v)}catch{}}
function setGroup23(v){v=String(v||'');try{currentGroupId=v}catch{};try{window.currentGroupId=v}catch{};try{localStorage.setItem('kokmatch_group_id',v)}catch{}}
function show23(e){const msg=e?.message||String(e||'처리 중 오류가 발생했습니다.');try{if(typeof showError==='function')showError(new Error(msg));else alert(msg)}catch{}}
async function json23(url,opt={}){const r=await fetch(url,{cache:'no-store',...opt}),x=await r.json().catch(()=>({}));if(!r.ok){const e=new Error(x.error||x.message||`요청 실패 (${r.status})`);e.status=r.status;throw e}return x}

/* Pagination: bind real buttons instead of depending on stacked inline handlers. */
function page23(p){
 if(typeof legacyPageGo23!=='function')return false;
 const n=Math.max(1,Number(p)||1);
 const r=legacyPageGo23(n);
 queueMicrotask(sync23);requestAnimationFrame(sync23);setTimeout(sync23,50);
 return r;
}
window.memberPageGo46=page23;try{memberPageGo46=page23}catch{}
function bindPager23(){
 const box=document.getElementById('members');if(!box)return;
 const pager=box.querySelector('.memberPager46');if(!pager)return;
 const buttons=[...pager.querySelectorAll('button')];
 buttons.forEach(btn=>{
  if(btn.dataset.v23pager)return;btn.dataset.v23pager='1';
  const dir=(btn.textContent||'').includes('이전')?-1:(btn.textContent||'').includes('다음')?1:0;if(!dir)return;
  btn.removeAttribute('onclick');btn.onclick=null;
  btn.addEventListener('click',ev=>{ev.preventDefault();ev.stopPropagation();if(btn.disabled)return;const cur=Math.max(1,Number(window.__kokmatchMemberPage46)||1);page23(cur+dir)});
 });
}

/* Member edit: always open the member stored on that exact card. */
function openEdit23(id){
 id=String(id||'');const m=member23(id);if(!m){if(legacyOpenEdit23)return legacyOpenEdit23(id);return false}
 try{editMemberId=id}catch{}
 try{if(typeof openMemberModal==='function'){openMemberModal(m);return true}}catch(e){show23(e);return false}
 if(legacyOpenEdit23)return legacyOpenEdit23(id);return false;
}
window.openEditMember=openEdit23;try{openEditMember=openEdit23}catch{}
function bindMemberEdit23(){
 const box=document.getElementById('members');if(!box)return;
 [...box.querySelectorAll('.memberCard')].forEach(card=>{
  const id=String(card.dataset.memberId22||card.dataset.memberId46||'');if(!id)return;
  [...card.querySelectorAll('button')].filter(b=>(b.textContent||'').trim()==='수정'||/^\s*openEditMember\s*\(/.test(String(b.getAttribute('onclick')||''))).forEach(btn=>{
   if(btn.dataset.v23edit)return;btn.dataset.v23edit='1';btn.removeAttribute('onclick');btn.onclick=null;
   btn.addEventListener('click',ev=>{ev.preventDefault();ev.stopPropagation();openEdit23(id)});
  });
 });
}

/* Profile picker: remove stacked legacy change listeners and keep exactly one current handler. */
function bindProfile23(){
 const card=document.getElementById('profileCard53');if(!card)return;
 let input=card.querySelector('#profileFile53');const label=card.querySelector('label[for="profileFile53"]');
 if(label){label.style.pointerEvents='auto';label.style.opacity='';label.removeAttribute('aria-disabled')}
 if(input&&!input.dataset.v23clean){
  const fresh=input.cloneNode(true);fresh.dataset.v23clean='1';fresh.dataset.v21bound='1';fresh.dataset.v54bound='1';fresh.disabled=false;fresh.removeAttribute('onchange');fresh.value='';
  input.replaceWith(fresh);input=fresh;
  input.addEventListener('change',()=>{const fn=window.changeProfile53; if(typeof fn==='function')Promise.resolve(fn(input)).catch(show23)});
 }
 if(input)input.disabled=false;
 const del=card.querySelector('#profileDelete21')||[...card.querySelectorAll('button')].find(b=>(b.textContent||'').includes('기본 사진으로'));
 if(del&&!del.dataset.v23delete){del.dataset.v23delete='1';del.onclick=null;del.removeAttribute('onclick');del.addEventListener('click',ev=>{ev.preventDefault();const fn=window.deleteProfile53;if(typeof fn==='function')Promise.resolve(fn()).catch(show23)})}
}

/* Group switch for every logged-in membership, not only global admin. */
function setGroupButtonBusy23(on){const b=document.getElementById('groupBtn');if(!b)return;b.disabled=!!on;b.classList.toggle('switching52',!!on);if(on)b.textContent='모임 변경 중…'}
async function memberships23(){
 const m=mine23();if(!m)return[];
 if(m.globalAdmin){try{return (Array.isArray(groups)?groups:[]).map(g=>({groupId:String(g.groupId||g.group_id||''),groupName:String(g.name||g.groupName||'모임'),roleLabel:'개발자'})).filter(x=>x.groupId)}catch{return[]}}
 const x=await json23(AUTH23,{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+tok23()},body:JSON.stringify({action:'my_memberships',currentGroupId:gid23()})});
 return Array.isArray(x.memberships)?x.memberships:[];
}
async function state23(target,token){const u=new URL(MULTI23);u.searchParams.set('api','state');u.searchParams.set('groupId',target);u.searchParams.set('_fix23',Date.now());const x=await json23(u,{headers:{authorization:'Bearer '+token}});if(String(x?.group?.groupId||'')!==String(target))throw new Error('선택한 모임 정보를 불러오지 못했습니다.');return x}
function applyState23(x,target,token){
 setToken23(token);setGroup23(target);
 try{S=x.data;me=x.user;group=x.group;if(Array.isArray(x.groups))groups=x.groups;if(Array.isArray(x.groupSummaries))groupSummaries=x.groupSummaries}catch(e){throw e}
 try{
  window.S=S;window.me=me;window.group=group;window.currentGroupId=String(target);window.T=String(token||'');
  if(typeof groups!=='undefined')window.groups=groups;
  if(typeof groupSummaries!=='undefined')window.groupSummaries=groupSummaries;
 }catch{}
 try{if(typeof normalizeClient==='function')normalizeClient()}catch{}
 try{window.__kokmatchProfilesLoaded21=''}catch{}
 try{if(typeof renderAll==='function')renderAll()}catch{}
 try{if(typeof window.memberPageGo46==='function')window.memberPageGo46(1)}catch{}
 try{window.scrollTo(0,0)}catch{}
 sync23();return true;
}
async function switchGroup23(target){
 target=String(target||'');if(!target||switching23)return false;if(target===gid23()){try{closeModal()}catch{};return true}
 switching23=true;setGroupButtonBusy23(true);const oldToken=tok23();
 try{
  let newToken=oldToken;
  if(!mine23()?.globalAdmin){const a=await json23(AUTH23,{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+oldToken},body:JSON.stringify({action:'switch_group',groupId:target})});target=String(a.groupId||target);newToken=String(a.token||oldToken)}
  const x=await state23(target,newToken);applyState23(x,target,newToken);try{closeModal()}catch{};return true;
 }catch(e){show23(e);return false}
 finally{switching23=false;setGroupButtonBusy23(false);sync23()}
}
window.switchOwnGroup38=id=>switchGroup23(id);
window.adminSwitchGroup38=(id)=>switchGroup23(id);
window.switchGroup=(id)=>switchGroup23(id);
try{switchOwnGroup38=window.switchOwnGroup38}catch{};try{adminSwitchGroup38=window.adminSwitchGroup38}catch{};try{switchGroup=window.switchGroup}catch{}

async function openGroup23(){
 if(membershipsBusy23||!mine23())return;membershipsBusy23=true;
 try{
  if(typeof openModal!=='function')return;
  openModal('<h3>모임 변경</h3><div class="note">가입된 모임을 불러오는 중…</div>');
  const list=await memberships23();
  if(!list.length){openModal('<h3>모임 변경</h3><div class="note">변경할 수 있는 가입 모임이 없습니다.</div><div class="acts"><button class="btn ghost" onclick="closeModal()">닫기</button></div>');return}
  const cur=gid23();openModal(`<h3>모임 변경</h3><div class="note">이동할 모임을 선택해주세요.</div><div id="groupChoice23" class="choiceList">${list.map(x=>`<button class="choiceBtn${String(x.groupId)===cur?' current':''}" type="button" data-group-id="${esc23(x.groupId)}"><b>${esc23(x.groupName||'모임')}${String(x.groupId)===cur?' · 현재':''}</b><span class="meta">${esc23(x.roleLabel||'')}</span></button>`).join('')}</div><div id="groupErr23" class="error"></div><button class="btn ghost" style="width:100%;margin-top:9px" onclick="closeModal()">닫기</button>`);
  document.querySelectorAll('#groupChoice23 button[data-group-id]').forEach(b=>b.addEventListener('click',async()=>{const id=String(b.dataset.groupId||'');if(id===cur){closeModal();return}document.querySelectorAll('#groupChoice23 button').forEach(x=>x.disabled=true);const ok=await switchGroup23(id);if(!ok)document.querySelectorAll('#groupChoice23 button').forEach(x=>x.disabled=false)}));
 }catch(e){show23(e)}finally{membershipsBusy23=false}
}
window.openGroupSwitch=openGroup23;window.openGroupSwitch23=openGroup23;try{openGroupSwitch=openGroup23}catch{}
function bindGroup23(){const b=document.getElementById('groupBtn');if(!b||!mine23())return;if(!switching23)b.disabled=false;if(!switching23){const name=String(grp23()?.name||'모임');b.textContent=name+' ▾'}b.onclick=ev=>{ev?.preventDefault?.();ev?.stopPropagation?.();openGroup23()}}

function sync23(){
 if(syncBusy23)return;syncBusy23=true;
 try{bindPager23();bindMemberEdit23();bindProfile23();bindGroup23()}finally{syncBusy23=false}
}
function after23(r){queueMicrotask(sync23);requestAnimationFrame(sync23);return r}
try{const h=renderHeader;renderHeader=function(){return after23(h())};window.renderHeader=renderHeader}catch{}
try{const m=renderMembers;renderMembers=function(){return after23(m())};window.renderMembers=renderMembers}catch{}
try{const s=renderSettings;renderSettings=function(){return after23(s())};window.renderSettings=renderSettings}catch{}
try{const a=renderAll;renderAll=function(){return after23(a())};window.renderAll=renderAll}catch{}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(sync23,0),{once:true});else setTimeout(sync23,0);
})();