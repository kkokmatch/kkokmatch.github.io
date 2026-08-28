(()=>{
'use strict';
if(window.__kokmatchV56Fix5)return;
window.__kokmatchV56Fix5=true;
window.__kokmatchV56Fix5Patch='1.1';
window.__kokmatchV56Fix5Build='2026.08.28.9';
let busySeenAt=0;
function me56(){try{return (typeof me!=='undefined'&&me)||window.me||null}catch{return window.me||null}}
function group56(){try{return (typeof group!=='undefined'&&group)||window.group||null}catch{return window.group||null}}
function ensure(){
 const m=me56();if(!m)return;
 let b=document.getElementById('groupBtn');
 if(!b){
  let line=document.querySelector('.groupLine');
  if(!line){const host=document.querySelector('header.top .toprow > div:first-child, header.top .toprow, header.top');if(host){line=document.createElement('div');line.className='groupLine';host.appendChild(line)}}
  if(line){b=document.createElement('button');b.id='groupBtn';b.className='groupBtn';b.type='button';line.appendChild(b)}
 }
 if(!b)return;
 const markedBusy=window.__kokmatchGroupSwitching12===true;
 const busyText=/모임\s*변경\s*중/.test(String(b.textContent||''));
 if(markedBusy&&busyText){
  if(!busySeenAt)busySeenAt=Date.now();
  if(Date.now()-busySeenAt<5000)return;
  window.__kokmatchGroupSwitching12=false;
 }
 busySeenAt=0;
 b.disabled=false;
 b.removeAttribute('disabled');
 b.classList.remove('groupSwitching12','switching52');
 const name=String(group56()?.name||'모임');
 if(!/▾/.test(String(b.textContent||''))||busyText)b.textContent=name+' ▾';
 b.setAttribute('aria-haspopup','dialog');
 b.setAttribute('aria-label','모임 변경');
 b.style.pointerEvents='auto';
}
function activateGroup(e){
 const t=e.target instanceof Element?e.target.closest('#groupBtn'):null;if(!t||!me56())return;
 if(window.__kokmatchGroupSwitching12===true&&/모임\s*변경\s*중/.test(String(t.textContent||'')))return;
 e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
 try{if(typeof window.openGroupSwitch56==='function')window.openGroupSwitch56();else if(typeof window.openGroupSwitch==='function')window.openGroupSwitch()}catch(err){console.error('v5.6 group button',err)}
}
function profileTarget(e){const t=e.target instanceof Element?e.target:null;return t?.closest?.('#members .profileIdentity80,#queue .profileIdentity80,#playing .profileIdentity80')||null}
function activateProfile(e){const card=profileTarget(e);if(!card)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();try{window.openProfilePhoto80?.(card)}catch(err){console.error('v5.6 profile viewer',err)}}
function blockProfileMenu(e){if(!profileTarget(e)&&!(e.target instanceof Element&&e.target.closest?.('#profileViewer56 img')))return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation()}
if(!window.__kokmatchGroupCapture56){window.__kokmatchGroupCapture56=true;document.addEventListener('click',activateGroup,true)}
if(!window.__kokmatchProfileCapture561){window.__kokmatchProfileCapture561=true;document.addEventListener('click',activateProfile,true);document.addEventListener('contextmenu',blockProfileMenu,true)}
ensure();
const MO=window.MutationObserver;
try{new MO(()=>queueMicrotask(ensure)).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['disabled','class']})}catch{}
setInterval(ensure,200);
})();