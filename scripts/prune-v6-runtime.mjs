import fs from 'node:fs';

const FILE='app-v6.0.js';
let src=fs.readFileSync(FILE,'utf8');
if(!src.includes("window.__kokmatchStandalone='6.0'"))throw new Error('Not a v6 standalone runtime');
if(src.includes("window.__kokmatchInteractionCore='6.0'")){console.log('v6 interaction core already installed');process.exit(0)}

function removeMigratedSection(file){
  const marker=`/* migrated into v6.0: ${file} */`;
  const start=src.indexOf(marker);
  if(start<0)throw new Error(`Missing v6 migration section: ${file}`);
  let end=src.indexOf('/* migrated into v6.0:',start+marker.length);
  if(end<0){
    end=src.lastIndexOf("\nwindow.__kokmatchStandalone='6.0';");
    if(end<=start)throw new Error(`Could not locate v6 footer after ${file}`);
  }
  src=src.slice(0,start)+src.slice(end);
}

// These three late patches overlap on member buttons, group switching and touch/click handling.
removeMigratedSection('app-v5.4-fix23.js');
removeMigratedSection('app-v5.4-fix24.js');
removeMigratedSection('app-v5.4-fix26.js');
// Remove loader-only migration sections that became empty when their dynamic loader tails were stripped.
src=src.replace(/\/\* migrated into v6\.0: ([^*]+) \*\/\s*(?=\/\* migrated into v6\.0:|window\.__kokmatchStandalone='6\.0';)/g,'');

const core=String.raw`/* v6.0 canonical interaction core: replaces legacy fix23/fix24/fix26 overlap */
(()=>{
'use strict';
if(window.__kokmatchInteractionCore==='6.0')return;
window.__kokmatchInteractionCore='6.0';
document.documentElement.dataset.kokmatchInteractionCore='6.0';
const AUTH_V6='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-auth-v38';
const MULTI_V6='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-multi-api';
let groupBusyV6=false,lastTouchV6=0,sxV6=0,syV6=0,stV6=0,movedV6=false,syncBusyV6=false;
const pageFnV6=typeof window.memberPageGo46==='function'?window.memberPageGo46:null;
function tokenV6(){try{return String(T||window.T||localStorage.getItem('kokmatch_token')||'')}catch{return String(window.T||localStorage.getItem('kokmatch_token')||'')}}
function gidV6(){try{return String(currentGroupId||window.currentGroupId||localStorage.getItem('kokmatch_group_id')||'')}catch{return String(window.currentGroupId||localStorage.getItem('kokmatch_group_id')||'')}}
function mineV6(){try{return me||window.me||null}catch{return window.me||null}}
function membersV6(){try{return Array.isArray(S?.members)?S.members:(Array.isArray(window.S?.members)?window.S.members:[])}catch{return Array.isArray(window.S?.members)?window.S.members:[]}}
function memberV6(id){id=String(id||'');return membersV6().find(m=>String(m?.id||'')===id)||null}
function cardIdV6(card){return String(card?.dataset?.memberId22||card?.dataset?.memberId46||card?.dataset?.memberId||'')}
function escV6(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function showV6(e){const msg=e?.message||String(e||'처리 중 오류가 발생했습니다.');try{typeof showError==='function'?showError(new Error(msg)):alert(msg)}catch{}}
async function jsonV6(url,opt={}){const r=await fetch(url,{cache:'no-store',...opt}),x=await r.json().catch(()=>({}));if(!r.ok)throw new Error(x.error||x.message||('요청 실패 ('+r.status+')'));return x}
function setTokenV6(v){v=String(v||'');try{T=v}catch{};window.T=v;try{localStorage.setItem('kokmatch_token',v)}catch{}}
function setGroupV6(v){v=String(v||'');try{currentGroupId=v}catch{};window.currentGroupId=v;try{localStorage.setItem('kokmatch_group_id',v)}catch{}}
function closeModalV6(){try{if(typeof closeModal==='function')return closeModal()}catch{};document.getElementById('modal')?.classList.remove('on')}
function openModalV6(html){try{if(typeof openModal==='function'){openModal(html);return true}}catch{};const m=document.getElementById('modal'),s=document.getElementById('modalSheet');if(!m||!s)return false;s.innerHTML=html;m.classList.add('on');return true}
function editV6(id){id=String(id||'');const m=memberV6(id);if(!m)return showV6(new Error('수정할 회원을 찾지 못했습니다.'));try{editMemberId=id}catch{};try{if(typeof openMemberModal==='function'){openMemberModal(m);return true}}catch(e){showV6(e)}return false}
async function attendanceV6(id,mode){id=String(id||'');if(!memberV6(id))throw new Error('상태를 변경할 회원을 찾지 못했습니다.');const u=new URL(MULTI_V6);u.searchParams.set('api','action');u.searchParams.set('_v6',Date.now());const x=await jsonV6(u,{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+tokenV6()},body:JSON.stringify({action:'set_member_attendance',groupId:gidV6(),memberId:id,mode})});if(x?.data){try{S=x.data}catch{};window.S=x.data;try{typeof normalizeClient==='function'&&normalizeClient()}catch{};try{typeof renderAll==='function'&&renderAll()}catch{}}return true}
async function membershipsV6(){const m=mineV6();if(!m)return[];if(m.globalAdmin){try{return (Array.isArray(groups)?groups:window.groups||[]).map(g=>({groupId:String(g.groupId||g.group_id||''),groupName:String(g.name||g.groupName||'모임'),roleLabel:'개발자'})).filter(x=>x.groupId)}catch{return[]}}const x=await jsonV6(AUTH_V6,{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+tokenV6()},body:JSON.stringify({action:'my_memberships',currentGroupId:gidV6()})});return Array.isArray(x.memberships)?x.memberships:[]}
async function switchGroupV6(target){target=String(target||'');if(!target||groupBusyV6)return false;if(target===gidV6()){closeModalV6();return true}groupBusyV6=true;try{const oldToken=tokenV6();let newToken=oldToken;if(!mineV6()?.globalAdmin){const a=await jsonV6(AUTH_V6,{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+oldToken},body:JSON.stringify({action:'switch_group',groupId:target})});target=String(a.groupId||target);newToken=String(a.token||oldToken)}const u=new URL(MULTI_V6);u.searchParams.set('api','state');u.searchParams.set('groupId',target);u.searchParams.set('_v6',Date.now());const x=await jsonV6(u,{headers:{authorization:'Bearer '+newToken}});if(String(x?.group?.groupId||'')!==target)throw new Error('선택한 모임 정보를 불러오지 못했습니다.');setTokenV6(newToken);setGroupV6(target);try{S=x.data;me=x.user;group=x.group;if(Array.isArray(x.groups))groups=x.groups;if(Array.isArray(x.groupSummaries))groupSummaries=x.groupSummaries}catch(e){throw e}window.S=S;window.me=me;window.group=group;window.currentGroupId=target;try{typeof normalizeClient==='function'&&normalizeClient()}catch{};try{typeof renderAll==='function'&&renderAll()}catch{};try{pageFnV6&&pageFnV6(1)}catch{};closeModalV6();try{window.scrollTo(0,0)}catch{};return true}catch(e){showV6(e);return false}finally{groupBusyV6=false;queueMicrotask(syncUiV6)}}
async function openGroupsV6(){if(groupBusyV6||!mineV6())return false;groupBusyV6=true;try{openModalV6('<h3>모임 변경</h3><div class="note">가입된 모임을 불러오는 중…</div>');const list=await membershipsV6();if(!list.length){openModalV6('<h3>모임 변경</h3><div class="note">변경할 수 있는 가입 모임이 없습니다.</div><div class="acts"><button id="closeGroupV6" class="btn ghost">닫기</button></div>');document.getElementById('closeGroupV6')?.addEventListener('click',closeModalV6);return true}const cur=gidV6();openModalV6('<h3>모임 변경</h3><div class="note">이동할 모임을 선택해주세요.</div><div id="groupChoiceV6" class="choiceList">'+list.map(x=>'<button class="choiceBtn'+(String(x.groupId)===cur?' current':'')+'" type="button" data-group-v6="'+escV6(x.groupId)+'"><b>'+escV6(x.groupName||'모임')+(String(x.groupId)===cur?' · 현재':'')+'</b><span class="meta">'+escV6(x.roleLabel||'')+'</span></button>').join('')+'</div><button id="closeGroupV6" class="btn ghost" style="width:100%;margin-top:9px">닫기</button>');document.querySelectorAll('#groupChoiceV6 button[data-group-v6]').forEach(btn=>{let touched=0;const fire=ev=>{touched=Date.now();ev?.preventDefault?.();ev?.stopPropagation?.();switchGroupV6(String(btn.dataset.groupV6||''))};btn.addEventListener('touchend',fire,{passive:false});btn.addEventListener('click',ev=>{if(Date.now()-touched<800){ev.preventDefault();return}fire(ev)})});document.getElementById('closeGroupV6')?.addEventListener('click',closeModalV6);return true}catch(e){showV6(e);return false}finally{groupBusyV6=false}}
window.openGroupSwitchV6=openGroupsV6;window.switchGroupV6=switchGroupV6;
function callV6(fn,...args){try{const r=fn?.(...args);if(r&&typeof r.then==='function')r.catch(showV6);return r}catch(e){showV6(e);return null}}
function routeButtonV6(btn){if(!btn||btn.closest?.('#modal'))return false;if(btn.id==='groupBtn'){callV6(openGroupsV6);return true}const pager=btn.closest?.('#members .memberPager46');if(pager&&pageFnV6){const t=String(btn.textContent||'');const cur=Math.max(1,Number(window.__kokmatchMemberPage46)||1);if(t.includes('다음'))callV6(pageFnV6,cur+1);else if(t.includes('이전'))callV6(pageFnV6,Math.max(1,cur-1));else return false;return true}if(btn.closest?.('#members .title')&&String(btn.textContent||'').includes('회원등록')){const f=window.openAddMember||(typeof openAddMember==='function'?openAddMember:null);if(f){callV6(f);return true}}const card=btn.closest?.('#members .memberCard');if(!card)return false;const id=cardIdV6(card);if(!id)return false;const t=String(btn.textContent||'').trim();if(btn.classList.contains('partnerSetBtn66')&&typeof window.openPartner66==='function'){callV6(window.openPartner66,id);return true}if(btn.classList.contains('recordBtn73')||(btn.classList.contains('pairBtn')&&!btn.classList.contains('partnerSetBtn66'))||t.includes('가입·출석')||t.includes('같이한 경기')){const f=window.openPairs||(typeof openPairs==='function'?openPairs:null);if(f){callV6(f,id);return true}}if(t==='수정'){editV6(id);return true}if(btn.classList.contains('enter')||t==='운동'||t==='입장'){callV6(attendanceV6,id,'waiting');return true}if(btn.classList.contains('watch')||t==='관람'){callV6(attendanceV6,id,'spectator');return true}if((btn.classList.contains('danger')&&t==='퇴장')||t==='퇴장'){callV6(attendanceV6,id,'out');return true}return false}
function bindProfileV6(){const card=document.getElementById('profileCard53');if(!card)return;let input=card.querySelector('#profileFile53');const label=card.querySelector('label[for="profileFile53"]');if(label){label.style.pointerEvents='auto';label.removeAttribute('aria-disabled')}if(input&&!input.dataset.v6clean){const fresh=input.cloneNode(true);fresh.dataset.v6clean='1';fresh.removeAttribute('onchange');fresh.disabled=false;input.replaceWith(fresh);input=fresh;input.addEventListener('change',()=>{const f=window.changeProfile53;if(typeof f==='function')Promise.resolve(f(input)).catch(showV6)})}const del=card.querySelector('#profileDelete21')||[...card.querySelectorAll('button')].find(b=>String(b.textContent||'').includes('기본 사진으로'));if(del&&!del.dataset.v6clean){del.dataset.v6clean='1';del.removeAttribute('onclick');del.onclick=null;del.addEventListener('click',ev=>{ev.preventDefault();const f=window.deleteProfile53;if(typeof f==='function')Promise.resolve(f()).catch(showV6)})}}
function syncUiV6(){if(syncBusyV6)return;syncBusyV6=true;try{const b=document.getElementById('groupBtn');if(b&&mineV6()){b.disabled=false;b.removeAttribute('disabled');b.style.pointerEvents='auto';b.style.touchAction='manipulation';if(!groupBusyV6)b.textContent=String((typeof group!=='undefined'?group:window.group)?.name||'모임')+' ▾'}document.querySelectorAll('#members button').forEach(b=>b.style.touchAction='manipulation');bindProfileV6()}finally{syncBusyV6=false}}
function laterV6(){queueMicrotask(syncUiV6);requestAnimationFrame(syncUiV6);setTimeout(syncUiV6,60)}
document.addEventListener('click',ev=>{if(Date.now()-lastTouchV6<750)return;const btn=ev.target?.closest?.('button');if(routeButtonV6(btn)){ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();laterV6()}},true);
window.addEventListener('touchstart',ev=>{if(ev.target?.closest?.('#modal'))return;const t=ev.touches?.[0];if(!t)return;sxV6=t.clientX;syV6=t.clientY;stV6=Date.now();movedV6=false},{capture:true,passive:true});
window.addEventListener('touchmove',ev=>{if(ev.target?.closest?.('#modal'))return;const t=ev.touches?.[0];if(!t)return;if(Math.abs(t.clientX-sxV6)>12||Math.abs(t.clientY-syV6)>12)movedV6=true},{capture:true,passive:true});
window.addEventListener('touchend',ev=>{if(ev.target?.closest?.('#modal'))return;const t=ev.changedTouches?.[0];if(!t||movedV6||Date.now()-stV6>900)return;let btn=ev.target?.closest?.('button');if(!btn&&typeof document.elementsFromPoint==='function'){for(const el of document.elementsFromPoint(t.clientX,t.clientY)){const b=el?.closest?.('button');if(b){btn=b;break}}}if(routeButtonV6(btn)){lastTouchV6=Date.now();ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();laterV6()}},{capture:true,passive:false});
try{const f=renderHeader;renderHeader=function(...a){const r=f.apply(this,a);laterV6();return r};window.renderHeader=renderHeader}catch{}
try{const f=renderMembers;renderMembers=function(...a){const r=f.apply(this,a);laterV6();return r};window.renderMembers=renderMembers}catch{}
try{const f=renderSettings;renderSettings=function(...a){const r=f.apply(this,a);laterV6();return r};window.renderSettings=renderSettings}catch{}
try{const f=renderAll;renderAll=function(...a){const r=f.apply(this,a);laterV6();return r};window.renderAll=renderAll}catch{}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',laterV6,{once:true});else laterV6();
})();
`;

const footer=src.lastIndexOf("\nwindow.__kokmatchStandalone='6.0';");
if(footer<0)throw new Error('v6 footer not found');
src=src.slice(0,footer)+'\n'+core+'\n'+src.slice(footer);
fs.writeFileSync(FILE,src);
console.log('Removed legacy fix23/fix24/fix26 overlap and installed v6 canonical interaction core.');
