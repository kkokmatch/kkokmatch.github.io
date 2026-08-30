(()=>{
'use strict';
if(window.__kokmatchV54Fix31)return;
window.__kokmatchV54Fix31=true;
window.__kokmatchIOSAllMemberActions='31.0';
document.documentElement.dataset.kokmatchIOSAllMemberActions='31.0';
const MULTI31='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-multi-api';
let lastKey31='',lastAt31=0;
function trace31(msg){try{window.__kokmatchV31Last=String(msg||'');if(!location.pathname.includes('ios-diagnostic'))return;let el=document.getElementById('kokmatchV31Status')||document.getElementById('kokmatchV30Status')||document.getElementById('kokmatchV29Status');if(!el){el=document.createElement('div');el.id='kokmatchV31Status';el.style.cssText='position:fixed;left:8px;right:8px;bottom:calc(74px + env(safe-area-inset-bottom));z-index:100004;background:#172033ee;color:#fff;border-radius:10px;padding:8px 10px;font:700 11px/1.35 -apple-system,BlinkMacSystemFont,sans-serif;pointer-events:none';document.body.appendChild(el)}el.textContent='v31.0 · '+String(msg||'')}catch{}}
function token31(){try{return String(T||window.T||localStorage.getItem('kokmatch_token')||'')}catch{return String(window.T||localStorage.getItem('kokmatch_token')||'')}}
function gid31(){try{return String(currentGroupId||window.currentGroupId||localStorage.getItem('kokmatch_group_id')||'')}catch{return String(window.currentGroupId||localStorage.getItem('kokmatch_group_id')||'')}}
function members31(){try{return Array.isArray(S?.members)?S.members:(Array.isArray(window.S?.members)?window.S.members:[])}catch{return Array.isArray(window.S?.members)?window.S.members:[]}}
function member31(id){id=String(id||'');return members31().find(m=>String(m?.id||'')===id)||null}
function dedupe31(k){const n=Date.now();if(lastKey31===k&&n-lastAt31<700)return true;lastKey31=k;lastAt31=n;return false}
function inside(r,x,y,p=7){return !!r&&x>=r.left-p&&x<=r.right+p&&y>=r.top-p&&y<=r.bottom+p}
function modalAt31(x,y,target){const m=document.querySelector('#modal.on');if(!m)return false;try{if(target?.closest?.('#modal.on'))return true}catch{};const r=m.getBoundingClientRect();return inside(r,x,y,0)}
function idFromButton31(btn){
 if(!btn)return'';const card=btn.closest?.('#members .memberCard');let id=String(card?.dataset?.memberId22||card?.dataset?.memberId46||card?.dataset?.memberId||'');if(id)return id;
 const d=String(btn.dataset?.v26direct||btn.dataset?.v24direct||btn.dataset?.v23direct||'');let m=d.match(/(?:edit|wait|watch|out)-(.+)$/);if(m&&m[1])return m[1];
 const raw=String(btn.getAttribute('onclick')||'');m=raw.match(/(?:openEditMember|setOther)\(['\"]([^'\"]+)['\"]/);if(m&&m[1])return m[1];
 return'';
}
function action31(btn){
 if(!btn||!btn.closest?.('#members .memberBtns'))return null;const id=idFromButton31(btn);if(!id)return null;const text=String(btn.textContent||'').trim();
 if(text==='수정')return{kind:'edit',id,label:'수정'};
 if(btn.classList.contains('enter')||text==='입장'||text==='운동')return{kind:'attendance',id,mode:'waiting',label:'입장'};
 if(btn.classList.contains('watch')||text==='관람')return{kind:'attendance',id,mode:'spectator',label:'관람'};
 if((btn.classList.contains('danger')&&text==='퇴장')||text==='퇴장')return{kind:'attendance',id,mode:'out',label:'퇴장'};
 return null;
}
function resolve31(ev,x,y){
 if(modalAt31(x,y,ev.target))return null;
 const all=[];const add=e=>{if(e&&e.nodeType===1&&!all.includes(e))all.push(e)};try{add(ev.target);for(const e of ev.composedPath?.()||[])add(e);for(const e of document.elementsFromPoint?.(x,y)||[])add(e)}catch{}
 for(const el of all){const b=el.closest?.('#members .memberBtns button');const a=action31(b);if(a)return a}
 // Do not trust the hit target on iOS. Scan every visible member action button by geometry.
 for(const b of document.querySelectorAll('#members .memberCard .memberBtns button')){const r=b.getBoundingClientRect();if(!inside(r,x,y,9))continue;const a=action31(b);if(a)return a}
 // wrapper slots can be the actual iOS target
 for(const slot of document.querySelectorAll('#members .memberCard .memberBtnSlot65')){if(!inside(slot.getBoundingClientRect(),x,y,7))continue;const a=action31(slot.querySelector('button'));if(a)return a}
 return null;
}
function edit31(a){const m=member31(a.id);if(!m){trace31('회원ID 실패 · '+a.id);return}if(dedupe31('edit:'+a.id))return;trace31('수정 실행 · '+String(m.name||a.id));try{editMemberId=a.id}catch{};try{if(typeof openMemberModal==='function')return openMemberModal(m)}catch(e){trace31('수정 오류 · '+(e?.message||e))}try{window.openMemberModal?.(m)}catch(e){trace31('수정 오류 · '+(e?.message||e))}}
async function attendance31(a){if(!member31(a.id)){trace31('회원ID 실패 · '+a.id);return}if(dedupe31('att:'+a.id+':'+a.mode))return;trace31(a.label+' 요청 · '+a.id);try{const u=new URL(MULTI31);u.searchParams.set('api','action');u.searchParams.set('_fix31',Date.now());const r=await fetch(u,{method:'POST',cache:'no-store',headers:{'content-type':'application/json',authorization:'Bearer '+token31()},body:JSON.stringify({action:'set_member_attendance',groupId:gid31(),memberId:a.id,mode:a.mode})});const x=await r.json().catch(()=>({}));if(!r.ok)throw new Error(x.error||x.message||'상태 변경 실패');if(x?.data){try{S=x.data;window.S=S}catch{};try{normalizeClient?.()}catch{};try{renderAll?.()}catch{}}trace31(a.label+' 완료 · '+a.id)}catch(e){trace31('상태 오류 · '+(e?.message||e));try{showError?.(e)}catch{}}}
window.addEventListener('touchstart',ev=>{const t=ev.touches?.[0];if(!t)return;const a=resolve31(ev,t.clientX,t.clientY);if(!a)return;try{ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation()}catch{};if(a.kind==='edit')edit31(a);else attendance31(a)},{capture:true,passive:false});
document.addEventListener('click',ev=>{if(Date.now()-lastAt31<700)return;const a=action31(ev.target?.closest?.('#members .memberBtns button'));if(!a)return;if(a.kind==='edit')edit31(a);else attendance31(a)},true);
trace31('전체 회원 액션 보정 준비');
})();
