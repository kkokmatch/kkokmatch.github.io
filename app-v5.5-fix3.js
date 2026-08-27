(()=>{
if(window.__kokmatchV55Fix3)return;
window.__kokmatchV55Fix3=true;window.__kokmatchVersionLock='5.5';window.__kokmatchV55Patch='3.0';window.__kokmatchFeedbackPatch='5.5.3';window.__kokmatchProfilePatch='5.5.3';
const shadows=Object.create(null),reading=Object.create(null);
function bridge(name){
  try{
    const d=Object.getOwnPropertyDescriptor(window,name);
    if(d&&!d.configurable)return;
    if(d&&'value' in d)shadows[name]=d.value;
    Object.defineProperty(window,name,{configurable:true,enumerable:true,get(){
      if(reading[name])return shadows[name];
      reading[name]=true;
      try{const v=(0,eval)(name);if(v!==undefined)shadows[name]=v}catch{}
      reading[name]=false;
      return shadows[name];
    },set(v){shadows[name]=v}});
  }catch{}
}
['me','T','currentGroupId','currentView'].forEach(bridge);
function enforce(){
  window.__kokmatchVersionLock='5.5';document.documentElement.dataset.kokmatchVersion='5.5';document.title='콕매치 v5.5';
  const v=document.getElementById('currentVersion52');if(v)v.textContent='v5.5';
  try{window.__kokmatchReconcileFeedback552?.()}catch{}
}
const wrap=n=>{try{const f=window[n];if(typeof f!=='function'||f.__v553)return;const w=function(){const r=f.apply(this,arguments);enforce();return r};w.__v553=true;window[n]=w}catch{}};
['renderHeader','renderAll','renderSettings','renderMembers','renderQueue'].forEach(wrap);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enforce,{once:true});else enforce();
setInterval(enforce,750);
})();