(()=>{
'use strict';
if(window.__kokmatchV54Fix28)return;
window.__kokmatchV54Fix28=true;
window.__kokmatchModalCancelFix='28.1';
document.documentElement.dataset.kokmatchModalCancelFix='28.1';
let last28=0;
function trace28(msg){try{window.__kokmatchV28Last=String(msg||'');if(!location.pathname.includes('ios-diagnostic'))return;let el=document.getElementById('kokmatchV28Status')||document.getElementById('kokmatchV27Status')||document.getElementById('kokmatchV26Status');if(!el){el=document.createElement('div');el.id='kokmatchV28Status';el.style.cssText='position:fixed;left:8px;right:8px;bottom:calc(74px + env(safe-area-inset-bottom));z-index:100001;background:#172033ee;color:#fff;border-radius:10px;padding:8px 10px;font:700 11px/1.35 -apple-system,BlinkMacSystemFont,sans-serif;pointer-events:none';document.body.appendChild(el)}el.textContent='v28.1 · '+String(msg||'')}catch{}}
function close28(){try{if(typeof closeModal==='function'){closeModal();trace28('수정 취소 완료');return true}}catch{}try{if(typeof window.closeModal==='function'){window.closeModal();trace28('수정 취소 완료');return true}}catch{}const modal=document.getElementById('modal'),sheet=document.getElementById('modalSheet');if(!modal)return false;modal.classList.remove('on');if(sheet)sheet.innerHTML='';trace28('수정 취소 완료');return true}
function cancelButton28(target){const btn=target?.closest?.('#modal.on button');if(!btn)return null;const text=String(btn.textContent||'').trim();const raw=String(btn.getAttribute('onclick')||'');return text==='취소'||text==='닫기'||/closeModal\s*\(/.test(raw)?btn:null}
function fire28(ev){const btn=cancelButton28(ev.target);if(!btn)return false;const now=Date.now();if(now-last28<500)return true;last28=now;try{ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation()}catch{};trace28('취소 터치 감지');close28();return true}
window.addEventListener('touchstart',ev=>{fire28(ev)},{capture:true,passive:false});
window.addEventListener('touchend',ev=>{if(Date.now()-last28<800){try{ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation()}catch{}}},{capture:true,passive:false});
document.addEventListener('click',ev=>{if(Date.now()-last28<800&&cancelButton28(ev.target)){try{ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation()}catch{};return}fire28(ev)},{capture:true});
trace28('모달 취소 보정 준비');
})();