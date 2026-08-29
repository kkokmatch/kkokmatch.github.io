(()=>{
'use strict';
if(window.__kokmatchV54Fix30)return;
window.__kokmatchV54Fix30=true;
window.__kokmatchIOSMemberFormFix='30.1';
document.documentElement.dataset.kokmatchIOSMemberFormFix='30.1';
let lastSave=0;
function trace(s){try{window.__kokmatchV30Last=String(s||'');if(!location.pathname.includes('ios-diagnostic'))return;let el=document.getElementById('kokmatchV30Status')||document.getElementById('kokmatchV29Status');if(!el){el=document.createElement('div');el.id='kokmatchV30Status';el.style.cssText='position:fixed;left:8px;right:8px;bottom:calc(74px + env(safe-area-inset-bottom));z-index:100003;background:#172033ee;color:#fff;border-radius:10px;padding:8px 10px;font:700 11px/1.35 -apple-system,BlinkMacSystemFont,sans-serif;pointer-events:none';document.body.appendChild(el)}el.textContent='v30.1 · '+String(s||'')}catch{}}
function modalOpen(){return document.getElementById('modal')?.classList.contains('on')}
function isMemberForm(){return !!document.querySelector('#modal.on #fmName')}
function renderChoice(sel,box){
 const cur=String(sel.value||'');const options=[...sel.options].map(o=>({value:o.value,text:o.textContent||o.value}));
 box.innerHTML=options.map(o=>`<button type="button" class="btn ${String(o.value)===cur?'pri':'ghost'}" data-v30="${String(o.value).replace(/"/g,'&quot;')}">${o.text}</button>`).join('');
 box.querySelectorAll('button').forEach(b=>{const choose=ev=>{try{ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation()}catch{};sel.value=String(b.dataset.v30||'');try{sel.dispatchEvent(new Event('change',{bubbles:true}))}catch{};renderChoice(sel,box);trace((sel.closest('.field')?.querySelector('label')?.textContent||sel.id)+' 변경 · '+sel.value)};b.addEventListener('touchstart',choose,{passive:false});b.addEventListener('click',choose)});
}
function bindSelect(sel){
 if(!sel||sel.dataset.v30select)return;sel.dataset.v30select='1';sel.style.display='none';
 const box=document.createElement('div');box.className='iosChoice30';box.style.cssText='display:flex;flex-wrap:wrap;gap:7px;margin-top:7px';sel.insertAdjacentElement('afterend',box);renderChoice(sel,box);
}
function bindInput(inp){if(!inp||inp.dataset.v30input)return;inp.dataset.v30input='1';inp.style.pointerEvents='auto';inp.style.touchAction='manipulation';inp.addEventListener('touchstart',()=>{try{inp.focus({preventScroll:false})}catch{try{inp.focus()}catch{}};trace((inp.id==='fmName'?'이름':'출생연도')+' 입력')},{passive:true})}
function save30(ev){if(Date.now()-lastSave<800)return;lastSave=Date.now();try{ev?.preventDefault();ev?.stopPropagation();ev?.stopImmediatePropagation()}catch{};trace('저장 실행');try{const r=typeof saveMemberNow==='function'?saveMemberNow():window.saveMemberNow?.();if(r&&typeof r.catch==='function')r.catch(e=>{trace('저장 오류 · '+(e?.message||e));try{showError(e)}catch{}})}catch(e){trace('저장 오류 · '+(e?.message||e));try{showError(e)}catch{}}}
function bind(){
 if(!modalOpen()||!isMemberForm())return;const sheet=document.getElementById('modalSheet');if(!sheet)return;
 bindInput(document.getElementById('fmName'));bindInput(document.getElementById('fmYear'));
 ['fmGender','fmAge','fmCls','fmType','fmRole'].forEach(id=>bindSelect(document.getElementById(id)));
 const save=[...sheet.querySelectorAll('button')].find(b=>['저장','등록'].includes(String(b.textContent||'').trim()));
 if(save&&!save.dataset.v30save){save.dataset.v30save='1';save.style.pointerEvents='auto';save.style.touchAction='manipulation';save.addEventListener('touchstart',save30,{capture:true,passive:false});save.addEventListener('click',ev=>{if(Date.now()-lastSave<800){ev.preventDefault();return}save30(ev)},{capture:true})}
 trace('수정폼 보정 준비');
}
const mo=new MutationObserver(()=>setTimeout(bind,0));mo.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
document.addEventListener('focusin',e=>{if(e.target?.matches?.('#modal.on #fmName,#modal.on #fmYear'))trace((e.target.id==='fmName'?'이름':'출생연도')+' 포커스')},true);
setTimeout(bind,0);
})();
