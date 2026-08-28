(()=>{
'use strict';
if(window.__kokmatchV56Fix2)return;
window.__kokmatchV56Fix2=true;
window.__kokmatchV56Fix2Patch='2.0';
window.__kokmatchV56Fix2Build='2026.08.28.4';
const VERSION='5.6',TITLE='콕매치 v5.6';
let enforcing=false;
function enforce(){
 if(enforcing)return;enforcing=true;
 try{
  window.__kokmatchVersionLock=VERSION;
  window.__kokmatchBuild='2026.08.28.4';
  if(document.documentElement.dataset.kokmatchVersion!==VERSION)document.documentElement.dataset.kokmatchVersion=VERSION;
  if(document.title!==TITLE)document.title=TITLE;
  for(const id of ['currentVersion51','currentVersion52']){const e=document.getElementById(id);if(e&&e.textContent!=='v'+VERSION)e.textContent='v'+VERSION}
 }finally{enforcing=false}
}
enforce();
const root=document.documentElement,title=document.querySelector('title');
const VersionMO=window.__kokmatchNativeMutationObserver56||window.MutationObserver;
try{new VersionMO(enforce).observe(root,{attributes:true,attributeFilter:['data-kokmatch-version']})}catch{}
try{if(title)new VersionMO(enforce).observe(title,{childList:true,characterData:true,subtree:true})}catch{}
queueMicrotask(enforce);
requestAnimationFrame(()=>{enforce();requestAnimationFrame(enforce)});
setInterval(enforce,100);
})();