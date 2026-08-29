(()=>{
'use strict';
if(window.__kokmatchV54Fix29)return;
window.__kokmatchV54Fix29=true;
window.__kokmatchIOSImmediateActions='29.1';
document.documentElement.dataset.kokmatchIOSImmediateActions='29.1';
const MULTI='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-multi-api';
let lastKey='',lastAt=0;
function trace(msg){try{window.__kokmatchV29Last=String(msg||'');if(!location.pathname.includes('ios-diagnostic'))return;let el=document.getElementById('kokmatchV29Status')||document.getElementById('kokmatchV28Status')||document.getElementById('kokmatchV27Status')||document.getElementById('kokmatchV26Status');if(!el){el=document.createElement('div');el.id='kokmatchV29Status';el.style.cssText='position:fixed;left:8px;right:8px;bottom:calc(74px + env(safe-area-inset-bottom));z-index:100002;background:#172033ee;color:#fff;border-radius:10px;padding:8px 10px;font:700 11px/1.35 -apple-system,BlinkMacSystemFont,sans-serif;pointer-events:none';document.body.appendChild(el)}el.textContent='v29.1 · '+String(msg||'')}catch{}}
function token(){try{return String(T||window.T||localStorage.getItem('kokmatch_token')||'')}catch{return String(window.T||localStorage.getItem('kokmatch_token')||'')}}
function gid(){try{return String(currentGroupId||window.currentGroupId||localStorage.getItem('kokmatch_group_id')||'')}catch{return String(window.currentGroupId||localStorage.getItem('kokmatch_group_id')||'')}}
function members(){try{return Array.isArray(S?.members)?S.members:(Array.isArray(window.S?.members)?window.S.members:[])}catch{return Array.isArray(window.S?.members)?window.S.members:[]}}
function dedupe(k){const n=Date.now();if(lastKey===k&&n-lastAt<700)return true;lastKey=k;lastAt=n;return false}
function cardId(card){return String(card?.dataset?.memberId22||card?.dataset?.memberId46||card?.dataset?.memberId||'')}
function member(id){return members().find(m=>String(m?.id||'')===String(id||''))||null}
function inRect(el,x,y,pad=10){try{const r=el.getBoundingClientRect();return x>=r.left-pad&&x<=r.right+pad&&y>=r.top-pad&&y<=r.bottom+pad}catch{return false}}
function resolveByPoint(ev,x,y){
 try{if(ev.target?.closest?.('#modal.on'))return null}catch{}
 const els=[];const add=e=>{if(e&&e.nodeType===1&&!els.includes(e))els.push(e)};try{add(ev.target);for(const e of ev.composedPath?.()||[])add(e);for(const e of document.elementsFromPoint?.(x,y)||[])add(e)}catch{}
 for(const el of els){
  const pager=el.closest?.('.memberPager46 button');if(pager&&!pager.disabled)return{kind:'pager',btn:pager};
  const btn=el.closest?.('#members .memberBtns button');if(!btn)continue;const card=btn.closest?.('#members .memberCard'),id=cardId(card);if(!id)continue;const text=String(btn.textContent||'').trim();
  if(btn.classList.contains('enter')||text==='입장'||text==='운동')return{kind:'attendance',id,mode:'waiting',label:'입장'};
  if(btn.classList.contains('watch')||text==='관람')return{kind:'attendance',id,mode:'spectator',label:'관람'};
  if((btn.classList.contains('danger')&&text==='퇴장')||text==='퇴장')return{kind:'attendance',id,mode:'out',label:'퇴장'};
 }
 for(const p of document.querySelectorAll('.memberPager46 button:not([disabled])')){if(inRect(p,x,y,14))return{kind:'pager',btn:p}}
 return null;
}
async function attendance(a){
 if(!member(a.id)){trace('회원 찾기 실패 · '+a.id);return}
 const k='att:'+a.id+':'+a.mode;if(dedupe(k))return;trace(a.label+' 요청 · '+a.id);
 try{const u=new URL(MULTI);u.searchParams.set('api','action');u.searchParams.set('_fix29',Date.now());const r=await fetch(u,{method:'POST',cache:'no-store',headers:{'content-type':'application/json',authorization:'Bearer '+token()},body:JSON.stringify({action:'set_member_attendance',groupId:gid(),memberId:a.id,mode:a.mode})});const x=await r.json().catch(()=>({}));if(!r.ok)throw new Error(x.error||x.message||'상태 변경 실패');if(x?.data){try{S=x.data;window.S=S}catch{};try{if(typeof normalizeClient==='function')normalizeClient()}catch{};try{if(typeof renderAll==='function')renderAll()}catch{}}trace(a.label+' 완료 · '+a.id)}catch(e){trace('오류 · '+(e?.message||String(e)));try{typeof showError==='function'?showError(e):0}catch{}}
}
function pager(btn){const raw=String(btn?.getAttribute('onclick')||''),m=raw.match(/memberPageGo46\((\d+)\)/);let p=m?Number(m[1]):0;if(!p){const txt=String(btn?.textContent||'').trim(),cur=Math.max(1,Number(window.__kokmatchMemberPage46)||1);if(txt.includes('다음'))p=cur+1;else if(txt.includes('이전'))p=Math.max(1,cur-1)}if(!p)return;if(dedupe('page:'+p))return;trace('회원명부 '+p+'페이지');try{if(typeof window.memberPageGo46==='function')window.memberPageGo46(p)}catch(e){trace('페이지 오류 · '+(e?.message||String(e)))}}
window.addEventListener('touchstart',ev=>{const t=ev.touches?.[0];if(!t)return;const a=resolveByPoint(ev,t.clientX,t.clientY);if(!a)return;try{ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation()}catch{};if(a.kind==='pager')pager(a.btn);else attendance(a)},{capture:true,passive:false});
document.addEventListener('click',ev=>{if(Date.now()-lastAt<700)return;const p=ev.target?.closest?.('.memberPager46 button');if(p&&!p.disabled)pager(p)},{capture:true});
trace('상태·페이지 즉시터치 준비');
})();