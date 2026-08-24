(()=>{
const CUR44='4.4';
const PUSH44_API='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-push-v43';
const VAPID44='BJ0MUsN_Hr6yYqSQfQfD734hbwZZjeoc1SmreGE0jDHDRTb0Hn7Eaaib6LWyUWhXmDIOxUj0TU5-gpIYyBeW6vI';
let sw44=null,pushBusy44=false,lastSync44='',lastSyncAt44=0,latest44=CUR44,refreshBusy44=false;

function ios44(){return /iPad|iPhone|iPod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1)}
function standalone44(){return window.matchMedia?.('(display-mode: standalone)')?.matches===true||navigator.standalone===true}
function supported44(){return 'serviceWorker'in navigator&&'PushManager'in window&&'Notification'in window}
function b64u44(s){const p='='.repeat((4-s.length%4)%4),b=(s+p).replace(/-/g,'+').replace(/_/g,'/'),raw=atob(b),out=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);return out}
async function post44(body){const r=await fetch(PUSH44_API,{method:'POST',headers:{'content-type':'application/json',...(T?{authorization:'Bearer '+T}:{})},body:JSON.stringify(body),cache:'no-store'});const x=await r.json().catch(()=>({}));if(!r.ok){const e=new Error(x.error||'게임 알림 처리에 실패했습니다.');e.status=r.status;throw e}return x}
function wait44(ms){return new Promise(r=>setTimeout(r,ms))}
async function activeSw44(force=false){
 if(!supported44())return null;
 if(sw44?.active&&!force)return sw44;
 const initial=await navigator.serviceWorker.register('/kokmatch-sw.js?v=4.4',{scope:'/'});
 try{await initial.update()}catch{}
 const ready=await Promise.race([navigator.serviceWorker.ready,new Promise((_,rej)=>setTimeout(()=>rej(new Error('서비스워커 활성화 시간이 초과되었습니다. 앱을 완전히 종료한 뒤 다시 실행해주세요.')),10000))]);
 if(!ready?.active)throw new Error('서비스워커가 아직 활성화되지 않았습니다. 앱을 완전히 종료한 뒤 다시 실행해주세요.');
 sw44=ready;
 return ready;
}
async function sub44(){const reg=await activeSw44();if(!reg?.active)return null;try{return await reg.pushManager.getSubscription()}catch(e){await wait44(250);const ready=await navigator.serviceWorker.ready;sw44=ready;return await ready.pushManager.getSubscription()}}
function subJson44(sub){const j=sub.toJSON();return{endpoint:j.endpoint,keys:{p256dh:j.keys?.p256dh||'',auth:j.keys?.auth||''}}}
async function sync44(force=false){
 if(!T||!me||!currentGroupId||!supported44()||Notification.permission!=='granted')return false;
 const sub=await sub44();if(!sub)return false;
 const key=[sub.endpoint,currentGroupId,me.memberId||me.displayName].join('|');if(!force&&key===lastSync44&&Date.now()-lastSyncAt44<600000)return true;
 await post44({action:'subscribe',groupId:currentGroupId,subscription:subJson44(sub),userAgent:navigator.userAgent});lastSync44=key;lastSyncAt44=Date.now();return true;
}
function closePopup44(){document.getElementById('gamePushPopup44')?.remove()}
async function goPush44(data={}){const view=['queue','playing','members','stats','settings'].includes(String(data.view||''))?String(data.view):'queue';try{if(data.clubId&&String(data.clubId)!==String(currentGroupId)&&typeof switchGroup==='function')await switchGroup(String(data.clubId));goView(view)}catch{try{goView(view)}catch{}}}
function popup44(payload={}){
 if(document.visibilityState!=='visible')return;
 closePopup44();
 const box=document.createElement('div');box.id='gamePushPopup44';box.style.cssText='position:fixed;left:14px;right:14px;top:max(14px,env(safe-area-inset-top));z-index:100000;background:#fff;color:#111;border-radius:18px;box-shadow:0 12px 38px rgba(0,0,0,.28);padding:16px;border:2px solid #2453d4;animation:push44in .18s ease-out';
 box.innerHTML=`<div style="display:flex;gap:10px;align-items:flex-start"><div style="font-size:26px">🏸</div><div style="flex:1;min-width:0"><b style="font-size:17px;display:block;margin-bottom:5px">${esc(payload.title||'콕매치 게임 알림')}</b><div style="font-size:15px;line-height:1.5">${esc(payload.body||'게임 알림이 도착했습니다.')}</div></div></div><div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px"><button id="pushClose44" class="btn ghost" type="button">확인</button><button id="pushGo44" class="btn pri" type="button">바로가기</button></div>`;
 if(!document.getElementById('push44style')){const s=document.createElement('style');s.id='push44style';s.textContent='@keyframes push44in{from{transform:translateY(-20px);opacity:.2}to{transform:none;opacity:1}}';document.head.appendChild(s)}
 document.body.appendChild(box);box.querySelector('#pushClose44')?.addEventListener('click',closePopup44);box.querySelector('#pushGo44')?.addEventListener('click',()=>{const d=payload.data||{};closePopup44();goPush44(d)});try{navigator.vibrate?.([120,70,120])}catch{};setTimeout(()=>{if(document.getElementById('gamePushPopup44')===box)closePopup44()},12000)
}
window.enableGamePush44=async function(){
 if(pushBusy44)return;if(!supported44())return alert('이 기기/브라우저에서는 게임 알림을 지원하지 않습니다.');
 if(ios44()&&!standalone44())return alert('아이폰/아이패드는 Safari에서 홈 화면에 추가한 뒤, 홈 화면의 콕매치 아이콘으로 실행해야 게임 알림을 켤 수 있습니다.');
 pushBusy44=true;try{
  const permission=Notification.permission==='granted'?'granted':await Notification.requestPermission();if(permission!=='granted')throw new Error('알림 권한이 허용되지 않았습니다. 기기 설정에서 콕매치 알림을 허용해주세요.');
  const reg=await activeSw44(true);let sub=await reg.pushManager.getSubscription();if(!sub){try{sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64u44(VAPID44)})}catch(e){await wait44(300);const ready=await navigator.serviceWorker.ready;sw44=ready;sub=await ready.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64u44(VAPID44)})}}
  await post44({action:'subscribe',groupId:currentGroupId,subscription:subJson44(sub),userAgent:navigator.userAgent});lastSync44=[sub.endpoint,currentGroupId,me?.memberId||me?.displayName].join('|');lastSyncAt44=Date.now();
  let tested=false;try{await post44({action:'test',groupId:currentGroupId,endpoint:sub.endpoint});tested=true}catch(e){console.warn('push test v4.4',e)}
  if(currentView==='settings')renderSettings();if(!tested)alert('게임 알림 연결은 완료됐지만 테스트 알림 전송 확인에 실패했습니다. 실제 편성 알림이 오지 않으면 기기 알림 설정을 확인해주세요.');
 }catch(e){showError(e)}finally{pushBusy44=false;setTimeout(()=>renderPushCard44().catch(()=>{}),30)}
};
window.disableGamePush44=async function(){if(pushBusy44)return;pushBusy44=true;try{const sub=await sub44();if(sub){try{await post44({action:'unsubscribe',endpoint:sub.endpoint})}catch{}await sub.unsubscribe()}lastSync44='';lastSyncAt44=0;if(currentView==='settings')renderSettings();alert('이 기기의 게임 알림을 껐습니다.')}catch(e){showError(e)}finally{pushBusy44=false;setTimeout(()=>renderPushCard44().catch(()=>{}),30)}};
window.enableGamePush43=window.enableGamePush44;window.disableGamePush43=window.disableGamePush44;

async function renderPushCard44(){
 const card=$('gamePushCard43');if(!card)return;const status=$('gamePushStatus43'),btn=$('gamePushBtn43');if(!status||!btn)return;
 if(!supported44()){status.textContent='이 기기/브라우저는 푸시 알림을 지원하지 않습니다.';btn.disabled=true;btn.textContent='지원하지 않음';return}
 if(ios44()&&!standalone44()){status.textContent='아이폰/아이패드는 홈 화면의 콕매치 앱으로 실행해야 알림을 받을 수 있습니다.';btn.disabled=false;btn.textContent='홈 화면 추가 안내';btn.onclick=()=>alert('Safari 공유 버튼 → 홈 화면에 추가 → 홈 화면의 콕매치 아이콘으로 실행해주세요.');return}
 if(Notification.permission==='denied'){status.textContent='알림 권한이 차단되어 있습니다. iPhone/갤럭시 설정에서 콕매치 알림을 허용해주세요.';btn.disabled=true;btn.textContent='알림 권한 차단됨';return}
 let sub=null;try{sub=Notification.permission==='granted'?await sub44():null}catch(e){console.warn('push status v4.4',e)}
 if(sub){status.textContent='켜짐 · 앱 사용 중에는 내부 팝업+시스템 알림, 백그라운드에서는 시스템 푸시 알림을 받습니다.';btn.disabled=false;btn.textContent='알림 끄기';btn.onclick=window.disableGamePush44;sync44(false).catch(()=>{})}
 else{status.textContent=Notification.permission==='granted'?'알림 권한은 허용됐지만 기기 연결이 필요합니다. 아래 버튼을 다시 눌러 연결해주세요.':'꺼짐 · 이 기기에서 게임 알림을 켜주세요.';btn.disabled=false;btn.textContent='게임 알림 켜기';btn.onclick=window.enableGamePush44}
}
window.renderPushCard44=renderPushCard44;
const renderSettingsPrev44=renderSettings;
renderSettings=function(){const r=renderSettingsPrev44();const box=$('settings');if(box){const ver=[...box.querySelectorAll('.card')].find(c=>String(c.textContent||'').includes('프로그램 버전'));if(ver&&me?.globalAdmin&&String(me?.displayName||'').trim()==='박태영'){const m=ver.querySelector('.meta');if(m)m.textContent='콕매치 v4.4 · iOS 푸시 안정화 · 전경 팝업 알림'}setTimeout(()=>renderPushCard44().catch(()=>{}),40)}return r};

if('serviceWorker'in navigator)navigator.serviceWorker.addEventListener('message',e=>{if(e.data?.type==='KOKMATCH_PUSH_RECEIVED')popup44(e.data.payload||{});else if(e.data?.type==='KOKMATCH_PUSH_CLICK')goPush44(e.data.data||{view:e.data.view})});
const loadStatePrev44=loadState;loadState=async function(...args){const r=await loadStatePrev44(...args);if(T&&me&&Notification.permission==='granted')activeSw44().then(()=>sync44(false)).catch(()=>{});return r};
const logoutPrev44=logout;logout=async function(...args){try{if(supported44()&&Notification.permission==='granted'){const sub=await sub44();if(sub&&T)await post44({action:'unsubscribe',endpoint:sub.endpoint}).catch(()=>{})}}catch{}lastSync44='';lastSyncAt44=0;return logoutPrev44(...args)};

function cmp44(a,b){const A=String(a||'0').replace(/^v/i,'').split('.').map(Number),B=String(b||'0').replace(/^v/i,'').split('.').map(Number);for(let i=0;i<Math.max(A.length,B.length);i++){const x=A[i]||0,y=B[i]||0;if(x!==y)return x>y?1:-1}return 0}
function styleTop44(){if($('v44topStyle'))return;const s=document.createElement('style');s.id='v44topStyle';s.textContent='#topActions37,#topActions39,#topActions40,#topActions41,#topActions42,#topActions43{display:none!important}#topActions44{margin-left:auto;display:flex;align-items:center;justify-content:flex-end;gap:4px;position:relative;z-index:80;pointer-events:auto}#currentVersion44{font-size:10px;font-weight:900;padding:6px 5px;border-radius:8px;background:rgba(255,255,255,.18);white-space:nowrap}#headerRefresh44{max-width:170px;min-height:30px;padding:6px 8px;font-size:10.5px;font-weight:800;line-height:1.15;white-space:normal}#logout44{flex:0 0 64px;width:64px;min-width:64px;max-width:64px;min-height:30px;padding:6px 4px;font-size:11px;white-space:nowrap}.toprow>.logout{display:none!important}@media(max-width:380px){#currentVersion44{display:none}#headerRefresh44{max-width:135px;font-size:9.5px}#logout44{flex-basis:56px;width:56px;min-width:56px;max-width:56px;font-size:10px}}';document.head.appendChild(s)}
function updateTop44(){const v=$('currentVersion44'),b=$('headerRefresh44');if(v)v.textContent='v'+CUR44;if(!b)return;const newer=cmp44(latest44,CUR44)>0;b.textContent=refreshBusy44?'불러오는 중…':newer?`v${latest44} 업데이트 · 새로고침`:'↻ 새로고침'}
function ensureTop44(){styleTop44();const row=document.querySelector('.toprow');if(!row)return;let a=$('topActions44');if(!a){a=document.createElement('div');a.id='topActions44';a.innerHTML='<span id="currentVersion44">v4.4</span><button id="headerRefresh44" class="btn ghost" type="button">↻ 새로고침</button><button id="logout44" type="button">로그아웃</button>';row.appendChild(a);$('headerRefresh44')?.addEventListener('click',()=>refreshApp44());$('logout44')?.addEventListener('click',()=>logout())}updateTop44()}
async function latestCheck44(){try{const r=await fetch('/latest-version.json?t='+Date.now(),{cache:'no-store'});if(r.ok){const x=await r.json();latest44=String(x.semanticVersion||x.label||CUR44).replace(/^v/i,'')||CUR44}}catch{}updateTop44();return latest44}
window.refreshApp44=async function(target=''){if(refreshBusy44)return;refreshBusy44=true;updateTop44();try{const v=String(target||await latestCheck44()||CUR44).replace(/^v/i,'');location.replace('/?v='+encodeURIComponent(v)+'&refresh='+Date.now())}catch(e){refreshBusy44=false;updateTop44();showError(e)}};
window.refreshApp43=window.refreshApp44;window.refreshApp42=window.refreshApp44;window.refreshApp41=window.refreshApp44;window.refreshApp40=window.refreshApp44;window.refreshApp39=window.refreshApp44;window.refreshApp37=window.refreshApp44;
const renderHeaderPrev44=renderHeader;renderHeader=function(){const r=renderHeaderPrev44();ensureTop44();return r};
setTimeout(()=>{ensureTop44();latestCheck44();activeSw44().then(()=>{if(T&&me)sync44(false).catch(()=>{})}).catch(()=>{})},0);setInterval(()=>latestCheck44(),60000);
})();