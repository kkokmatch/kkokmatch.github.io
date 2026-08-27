(()=>{
if(window.__kokmatchV56Pre)return;
window.__kokmatchV56Pre=true;
window.__kokmatchV56PrePatch='2.0';

// iPhone Safari/WebKit may not expose Notification outside an installed web app.
// Legacy render paths read Notification.permission directly, so provide a denied no-op
// implementation instead of letting an unrelated render exception abort group switching.
if(typeof window.Notification==='undefined'){
  class KokmatchNoopNotification{
    static permission='denied';
    static async requestPermission(){return 'denied'}
    constructor(){this.onclick=null;this.onclose=null;this.onerror=null;this.onshow=null}
    close(){}
  }
  window.Notification=KokmatchNoopNotification;
}

// Coalesce duplicate profile GETs from legacy v5.x observers. Each consumer receives
// a clone, while POST/DELETE-style profile writes invalidate the group cache immediately.
const PROFILE_PATH='/functions/v1/kokmatch-profile-v53';
const nativeFetch=window.fetch.bind(window);
const profileReads=new Map();
function profileKey56(input){
  try{
    const raw=typeof input==='string'?input:input?.url;
    const u=new URL(raw,location.href);
    if(!u.pathname.includes(PROFILE_PATH))return null;
    return `${u.origin}${u.pathname}|${u.searchParams.get('groupId')||''}|${u.searchParams.get('full')||''}|${u.searchParams.get('memberId')||''}`;
  }catch{return null}
}
function method56(input,init){return String(init?.method||input?.method||'GET').toUpperCase()}
window.fetch=function(input,init){
  const key=profileKey56(input),method=method56(input,init);
  if(!key)return nativeFetch(input,init);
  if(method!=='GET'){
    for(const k of [...profileReads.keys()])if(k.split('|')[1]===key.split('|')[1])profileReads.delete(k);
    return nativeFetch(input,init);
  }
  const now=Date.now(),old=profileReads.get(key);
  if(old&&old.expires>now){
    return old.promise.then(r=>r.clone());
  }
  const base=nativeFetch(input,init);
  const entry={expires:now+1500,promise:base};
  profileReads.set(key,entry);
  base.finally(()=>setTimeout(()=>{if(profileReads.get(key)===entry)profileReads.delete(key)},1600));
  return base.then(r=>r.clone());
};
window.__kokmatchProfileFetchDedup56=true;

const NativeMO=window.MutationObserver;
if(typeof NativeMO!=='function')return;
window.__kokmatchNativeMutationObserver56=NativeMO;
window.MutationObserver=function(callback){
  const wrapped=(records,observer)=>{
    const keep=records.filter(r=>{
      if(r.type==='attributes'&&r.target===document.documentElement&&r.attributeName==='data-kokmatch-version')return false;
      if(r.target===document.querySelector('title'))return false;
      return true;
    });
    if(keep.length)callback(keep,observer);
  };
  return new NativeMO(wrapped);
};
window.MutationObserver.prototype=NativeMO.prototype;
setTimeout(()=>{if(window.MutationObserver!==NativeMO)window.MutationObserver=NativeMO},1500);
})();
