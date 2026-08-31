(()=>{
const UPDATER_V43='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-updater';

function sleep43(ms){return new Promise(r=>setTimeout(r,ms))}
async function fetchTimeout43(url,opts={},ms=3000){
 const c=new AbortController(),tm=setTimeout(()=>c.abort(),ms);
 try{return await fetch(url,{...opts,signal:c.signal,cache:'no-store'})}finally{clearTimeout(tm)}
}
async function latestInfo43(){
 const r=await fetchTimeout43(UPDATER_V43+'?api=version&t='+Date.now(),{},3000);
 const x=await r.json().catch(()=>({}));
 if(!r.ok||!Number(x.version)||!x.launchUrl)throw new Error('최신 버전 정보를 확인하지 못했습니다.');
 return x;
}
async function waitReady43(version){
 for(let i=0;i<50;i++){
  try{
   const r=await fetchTimeout43(UPDATER_V43+'?api=ready&t='+Date.now(),{},2500);
   const x=await r.json().catch(()=>({}));
   if(r.ok&&x.ready&&Number(x.version)>=Number(version))return x;
  }catch(e){}
  await sleep43(500);
 }
 throw new Error('최신 운영본 준비 확인이 지연되고 있습니다. 잠시 후 다시 시도해주세요.');
}
async function cleanupLocal43(){
 try{localStorage.removeItem('kokmatch_token')}catch(e){}
 try{sessionStorage.clear()}catch(e){}
 try{T=''}catch(e){}
 const work=(async()=>{
  try{if('caches'in window){const ks=await caches.keys();await Promise.all(ks.map(k=>caches.delete(k)))}}catch(e){}
  try{if('serviceWorker'in navigator){const rs=await navigator.serviceWorker.getRegistrations();await Promise.all(rs.map(r=>r.unregister().catch(()=>false)))}}catch(e){}
 })();
 await Promise.race([work,sleep43(1500)]);
}

window.kokmatchUpdateSameOrigin43=async function(){
 const b=$('forceUpdateBtn');if(b){b.disabled=true;b.textContent='최신 운영본 확인 중...'}
 try{
  const info=await latestInfo43();
  const target=new URL(info.launchUrl);
  if(target.origin!==location.origin)throw new Error('최신 운영본 주소를 확인할 수 없습니다.');
  if(b)b.textContent=`v${info.version} 준비 확인 중...`;
  await waitReady43(info.version);
  if(b)b.textContent='로그인세션 초기화 중...';
  if(me?.globalAdmin&&T){
   try{await fetchTimeout43(UPDATER_V43+'?api=logout_all&t='+Date.now(),{method:'POST',headers:{authorization:'Bearer '+T}},3000)}catch(e){}
  }
  await cleanupLocal43();
  location.replace(target.pathname+'?loginFresh=1&t='+Date.now());
 }catch(e){
  if(b){b.disabled=false;b.textContent='↻ 최신 버전으로 업데이트 후 다시 로그인'}
  showError(e)
 }
};
forceUpdateApp=window.kokmatchUpdateSameOrigin43;

const renderSettings42=renderSettings;
renderSettings=function(){
 renderSettings42();
 const box=$('settings');if(!box)return;
 [...box.querySelectorAll('.meta')].forEach(el=>{if((el.textContent||'').includes('콕매치 v42'))el.textContent='콕매치 v43 · 앱내 최신화 안정화'});
 const btn=$('forceUpdateBtn');if(btn)btn.textContent='↻ 최신 버전으로 업데이트 후 다시 로그인';
};

if(location.pathname.startsWith('/launch/v43'))history.replaceState(null,'','/?loaded=43');
if(me)renderAll();
})();
