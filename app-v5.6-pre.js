(()=>{
if(window.__kokmatchV56Pre)return;
window.__kokmatchV56Pre=true;
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
