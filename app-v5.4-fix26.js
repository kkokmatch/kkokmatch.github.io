(()=>{
'use strict';
if(window.__kokmatchV54Fix26)return;
window.__kokmatchV54Fix26=true;
window.__kokmatchDirectTouch='26.1';
document.documentElement.dataset.kokmatchDirectTouch='26.1';

const AUTH26='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-auth-v38';
const MULTI26='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-multi-api';
let prepBusy26=false,groupBusy26=false,observer26=null;
let sx26=0,sy26=0,st26=0,moved26=false;

function trace26(msg){
 try{
  const s=String(msg||'');window.__kokmatchV26Last=s;
  if(!location.pathname.includes('ios-diagnostic'))return;
  let el=document.getElementById('kokmatchV26Status');
  if(!el){el=document.createElement('div');el.id='kokmatchV26Status';el.style.cssText='position:fixed;left:8px;right:8px;bottom:calc(74px + env(safe-area-inset-bottom));z-index:9999;background:#172033e8;color:#fff;border-radius:10px;padding:7px 10px;font:700 11px/1.35 -apple-system,BlinkMacSystemFont,sans-serif;pointer-events:none';document.body.appendChild(el)}
  el.textContent='v26.1 · '+s;
 }catch{}
}
function err26(e){trace26('오류: '+(e?.message||String(e)));try{typeof showError==='function'?showError(e):alert(e?.message||String(e))}catch{}}
function token26(){try{return String(T||window.T||localStorage.getItem('kokmatch_token')||'')}catch{return String(window.T||localStorage.getItem('kokmatch_token')||'')}}
function gid26(){try{return String(currentGroupId||window.currentGroupId||localStorage.getItem('kokmatch_group_id')||'')}catch{return String(window.currentGroupId||localStorage.getItem('kokmatch_group_id')||'')}}
function me26(){try{return me||window.me||null}catch{return window.me||null}}
function members26(){try{return Array.isArray(S?.members)?S.members:(Array.isArray(window.S?.members)?window.S.members:[])}catch{return Array.isArray(window.S?.members)?window.S.members:[]}}
function member26(id){id=String(id||'');return members26().find(m=>String(m?.id||'')===id)||null}
function cardId26(card){return String(card?.dataset?.memberId22||card?.dataset?.memberId46||card?.dataset?.memberId||'')}
function esc26(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function openModal26(html){try{if(typeof openModal==='function'){openModal(html);return true}}catch{};const m=document.getElementById('modal'),s=document.getElementById('modalSheet');if(!m||!s)return false;s.innerHTML=html;m.classList.add('on');return true}
function closeModal26(){try{if(typeof closeModal==='function')return closeModal()}catch{};const m=document.getElementById('modal'),s=document.getElementById('modalSheet');m?.classList.remove('on');if(s)s.innerHTML=''}
async function json26(url,opt={}){const r=await fetch(url,{cache:'no-store',...opt}),x=await r.json().catch(()=>({}));if(!r.ok)throw new Error(x.error||x.message||`요청 실패 (${r.status})`);return x}

function edit26(id){
 id=String(id||'');const m=member26(id);if(!m){err26(new Error('수정할 회원을 찾지 못했습니다.'));return false}
 trace26('회원수정 실행 · '+String(m.name||id));
 try{editMemberId=id}catch{}
 try{if(typeof openMemberModal==='function'){openMemberModal(m);return true}}catch(e){err26(e);return false}
 try{if(typeof window.openMemberModal==='function'){window.openMemberModal(m);return true}}catch(e){err26(e);return false}
 err26(new Error('회원 수정창 함수를 찾지 못했습니다.'));return false;
}
function attendance26(id,mode){
 id=String(id||'');if(!member26(id)){err26(new Error('상태를 변경할 회원을 찾지 못했습니다.'));return false}
 trace26((mode==='waiting'?'입장':mode==='spectator'?'관람':'퇴장')+' 실행 · '+id);
 try{
  if(typeof act==='function'){Promise.resolve(act('set_member_attendance',{memberId:id,mode})).then(()=>trace26('상태변경 완료 · '+id)).catch(err26);return true}
  if(typeof window.act==='function'){Promise.resolve(window.act('set_member_attendance',{memberId:id,mode})).then(()=>trace26('상태변경 완료 · '+id)).catch(err26);return true}
 }catch(e){err26(e);return false}
 err26(new Error('상태변경 API 함수를 찾지 못했습니다.'));return false;
}

function setToken26(v){v=String(v||'');try{T=v}catch{};try{window.T=v}catch{};try{localStorage.setItem('kokmatch_token',v)}catch{}}
function setGroup26(v){v=String(v||'');try{currentGroupId=v}catch{};try{window.currentGroupId=v}catch{};try{localStorage.setItem('kokmatch_group_id',v)}catch{}}
async function memberships26(){
 const m=me26();if(!m)return[];
 if(m.globalAdmin){try{return (Array.isArray(groups)?groups:window.groups||[]).map(g=>({groupId:String(g.groupId||g.group_id||''),groupName:String(g.name||g.groupName||'모임'),roleLabel:'개발자'})).filter(x=>x.groupId)}catch{return[]}}
 return (await json26(AUTH26,{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+token26()},body:JSON.stringify({action:'my_memberships',currentGroupId:gid26()})})).memberships||[];
}
async function switchGroup26(target){
 target=String(target||'');if(!target||groupBusy26)return false;if(target===gid26()){closeModal26();return true}
 groupBusy26=true;trace26('모임전환 요청 · '+target);
 try{
  const oldToken=token26();let newToken=oldToken;
  if(!me26()?.globalAdmin){const a=await json26(AUTH26,{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+oldToken},body:JSON.stringify({action:'switch_group',groupId:target})});target=String(a.groupId||target);newToken=String(a.token||oldToken)}
  const u=new URL(MULTI26);u.searchParams.set('api','state');u.searchParams.set('groupId',target);u.searchParams.set('_fix26',Date.now());
  const x=await json26(u,{headers:{authorization:'Bearer '+newToken}});if(String(x?.group?.groupId||'')!==target)throw new Error('선택한 모임 정보를 불러오지 못했습니다.');
  setToken26(newToken);setGroup26(target);
  try{S=x.data;me=x.user;group=x.group;if(Array.isArray(x.groups))groups=x.groups;if(Array.isArray(x.groupSummaries))groupSummaries=x.groupSummaries}catch(e){throw e}
  try{window.S=S;window.me=me;window.group=group;window.currentGroupId=target;window.T=newToken;if(typeof groups!=='undefined')window.groups=groups;if(typeof groupSummaries!=='undefined')window.groupSummaries=groupSummaries}catch{}
  try{if(typeof normalizeClient==='function')normalizeClient()}catch{}
  try{if(typeof renderAll==='function')renderAll()}catch{}
  try{if(typeof memberPageGo46==='function')memberPageGo46(1)}catch{}
  closeModal26();trace26('모임전환 완료 · '+String(x.group?.name||target));return true;
 }catch(e){err26(e);return false}finally{groupBusy26=false;later26()}
}
function bindChoice26(btn,id){
 if(!btn||btn.dataset.v26choice)return;btn.dataset.v26choice='1';let touched=0;
 const fire=ev=>{touched=Date.now();try{ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation()}catch{};switchGroup26(id)};
 btn.addEventListener('touchend',fire,{passive:false});
 btn.addEventListener('click',ev=>{if(Date.now()-touched<800){ev.preventDefault();return}fire(ev)});
}
async function openGroups26(){
 if(groupBusy26||!me26())return false;groupBusy26=true;trace26('가입 모임 조회 중');
 try{
  openModal26('<h3>모임 변경</h3><div class="note">가입된 모임을 불러오는 중…</div>');
  const list=await memberships26();if(!list.length){openModal26('<h3>모임 변경</h3><div class="note">변경할 수 있는 가입 모임이 없습니다.</div><div class="acts"><button id="closeGroup26" class="btn ghost">닫기</button></div>');const c=document.getElementById('closeGroup26');if(c)bindDirect26(c,'close',()=>closeModal26());trace26('변경 가능한 모임 없음');return true}
  const cur=gid26();openModal26(`<h3>모임 변경</h3><div class="note">이동할 모임을 선택해주세요.</div><div id="groupChoice26" class="choiceList">${list.map(x=>`<button class="choiceBtn${String(x.groupId)===cur?' current':''}" type="button" data-group26="${esc26(x.groupId)}"><b>${esc26(x.groupName||'모임')}${String(x.groupId)===cur?' · 현재':''}</b><span class="meta">${esc26(x.roleLabel||'')}</span></button>`).join('')}</div><button id="closeGroup26" class="btn ghost" style="width:100%;margin-top:9px">닫기</button>`);
  document.querySelectorAll('#groupChoice26 button[data-group26]').forEach(b=>bindChoice26(b,String(b.dataset.group26||'')));const c=document.getElementById('closeGroup26');if(c)bindDirect26(c,'close',()=>closeModal26());trace26('모임목록 표시 · '+list.length+'개');return true;
 }catch(e){err26(e);return false}finally{groupBusy26=false}
}
window.openGroupSwitch26=openGroups26;window.switchGroup26=switchGroup26;

function bindDirect26(btn,key,handler){
 if(!btn)return null;if(btn.dataset.v26direct===key)return btn;
 const fresh=btn.cloneNode(true);fresh.dataset.v26direct=key;fresh.removeAttribute('onclick');fresh.onclick=null;fresh.disabled=false;fresh.removeAttribute('disabled');fresh.style.pointerEvents='auto';fresh.style.touchAction='manipulation';
 let touched=0;
 const fire=ev=>{touched=Date.now();try{ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation()}catch{};handler(fresh,ev)};
 fresh.addEventListener('touchend',fire,{passive:false});
 fresh.addEventListener('click',ev=>{if(Date.now()-touched<800){try{ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation()}catch{};return}fire(ev)});
 btn.replaceWith(fresh);return fresh;
}
function prep26(){
 if(prepBusy26)return;prepBusy26=true;
 try{
  const gb=document.getElementById('groupBtn');if(gb&&me26())bindDirect26(gb,'group',()=>openGroups26());
  document.querySelectorAll('#members .memberCard').forEach(card=>{
   const id=cardId26(card);if(!id)return;
   card.querySelectorAll('.memberBtns button').forEach(btn=>{
    const t=String(btn.textContent||'').trim();
    if(t==='수정'){bindDirect26(btn,'edit-'+id,()=>edit26(id));return}
    if(btn.classList.contains('enter')||t==='운동'||t==='입장'){bindDirect26(btn,'wait-'+id,()=>attendance26(id,'waiting'));return}
    if(btn.classList.contains('watch')||t==='관람'){bindDirect26(btn,'watch-'+id,()=>attendance26(id,'spectator'));return}
    if((btn.classList.contains('danger')&&t==='퇴장')||t==='퇴장')bindDirect26(btn,'out-'+id,()=>attendance26(id,'out'));
   });
  });
 }finally{prepBusy26=false}
}
function directCapture26(btn){
 if(!btn)return false;
 if(btn.id==='groupBtn'){openGroups26();return true}
 const card=btn.closest?.('#members .memberCard');if(!card||!btn.closest?.('.memberBtns'))return false;
 const id=cardId26(card);if(!id)return false;const t=String(btn.textContent||'').trim();
 if(t==='수정')return edit26(id);
 if(btn.classList.contains('enter')||t==='운동'||t==='입장')return attendance26(id,'waiting');
 if(btn.classList.contains('watch')||t==='관람')return attendance26(id,'spectator');
 if((btn.classList.contains('danger')&&t==='퇴장')||t==='퇴장')return attendance26(id,'out');
 return false;
}
window.addEventListener('touchstart',ev=>{const t=ev.touches?.[0];if(!t)return;sx26=t.clientX;sy26=t.clientY;st26=Date.now();moved26=false},{capture:true,passive:true});
window.addEventListener('touchmove',ev=>{const t=ev.touches?.[0];if(!t)return;if(Math.abs(t.clientX-sx26)>12||Math.abs(t.clientY-sy26)>12)moved26=true},{capture:true,passive:true});
document.addEventListener('touchend',ev=>{
 const t=ev.changedTouches?.[0];if(!t||moved26||Date.now()-st26>900)return;
 let btn=ev.target?.closest?.('button');
 if(!btn&&typeof document.elementsFromPoint==='function'){for(const el of document.elementsFromPoint(t.clientX,t.clientY)){const b=el?.closest?.('button');if(b){btn=b;break}}}
 if(!directCapture26(btn))return;
 try{ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation()}catch{}
 later26();
},{capture:true,passive:false});

function later26(){queueMicrotask(prep26);requestAnimationFrame(prep26);setTimeout(prep26,25);setTimeout(prep26,90);setTimeout(prep26,220);setTimeout(prep26,420)}
try{const rm=renderMembers;renderMembers=function(...a){const r=rm.apply(this,a);later26();return r};window.renderMembers=renderMembers}catch{}
try{const rh=renderHeader;renderHeader=function(...a){const r=rh.apply(this,a);later26();return r};window.renderHeader=renderHeader}catch{}
try{const ra=renderAll;renderAll=function(...a){const r=ra.apply(this,a);later26();return r};window.renderAll=renderAll}catch{}
if(typeof MutationObserver==='function'){observer26=new MutationObserver(()=>setTimeout(prep26,0));observer26.observe(document.documentElement,{subtree:true,childList:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{trace26('직접터치 준비');later26()},{once:true});else{trace26('직접터치 준비');later26()}
})();