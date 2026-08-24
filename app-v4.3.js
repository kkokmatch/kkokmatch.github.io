(()=>{
const VER43='4.3';
const PUSH43_API='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-push-v43';
const VAPID43='BJ0MUsN_Hr6yYqSQfQfD734hbwZZjeoc1SmreGE0jDHDRTb0Hn7Eaaib6LWyUWhXmDIOxUj0TU5-gpIYyBeW6vI';
let swReg43=null,pushBusy43=false,lastSyncKey43='',lastSyncAt43=0,pendingPushNav43=null;

function ios43(){return /iPad|iPhone|iPod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1)}
function standalone43(){return window.matchMedia?.('(display-mode: standalone)')?.matches===true||navigator.standalone===true}
function supported43(){return 'serviceWorker'in navigator&&'PushManager'in window&&'Notification'in window}
function b64u43(s){const p='='.repeat((4-s.length%4)%4),b=(s+p).replace(/-/g,'+').replace(/_/g,'/'),raw=atob(b),out=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);return out}
async function postPush43(body){const r=await fetch(PUSH43_API,{method:'POST',headers:{'content-type':'application/json',...(T?{authorization:'Bearer '+T}:{})},body:JSON.stringify(body),cache:'no-store'});const x=await r.json().catch(()=>({}));if(!r.ok)throw new Error(x.error||'게임 알림 설정에 실패했습니다.');return x}
async function registerSw43(){if(!supported43())return null;if(swReg43)return swReg43;swReg43=await navigator.serviceWorker.register('/kokmatch-sw.js?v=4.3',{scope:'/'});await navigator.serviceWorker.ready;return swReg43}
async function subscription43(){const r=await registerSw43();return r?await r.pushManager.getSubscription():null}
function subJson43(sub){const j=sub.toJSON();return{endpoint:j.endpoint,keys:{p256dh:j.keys?.p256dh||'',auth:j.keys?.auth||''}}}
async function syncExisting43(force=false){
 if(!T||!me||!currentGroupId||!supported43()||Notification.permission!=='granted')return false;
 const sub=await subscription43();if(!sub)return false;
 const key=[sub.endpoint,currentGroupId,me.memberId||me.displayName].join('|');if(!force&&key===lastSyncKey43&&Date.now()-lastSyncAt43<600000)return true;
 await postPush43({action:'subscribe',groupId:currentGroupId,subscription:subJson43(sub),userAgent:navigator.userAgent});lastSyncKey43=key;lastSyncAt43=Date.now();return true;
}
window.enableGamePush43=async function(){
 if(pushBusy43)return;if(!supported43())return alert('이 기기/브라우저에서는 게임 알림을 지원하지 않습니다.');
 if(ios43()&&!standalone43())return alert('아이폰/아이패드는 콕매치를 홈 화면에 추가한 뒤 홈 화면의 콕매치 아이콘으로 실행해야 게임 알림을 켤 수 있습니다.');
 pushBusy43=true;try{
  const permission=Notification.permission==='granted'?'granted':await Notification.requestPermission();
  if(permission!=='granted')throw new Error('알림 권한이 허용되지 않았습니다. 기기 알림 설정에서 콕매치를 허용해주세요.');
  const reg=await registerSw43();let sub=await reg.pushManager.getSubscription();if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64u43(VAPID43)});
  await postPush43({action:'subscribe',groupId:currentGroupId,subscription:subJson43(sub),userAgent:navigator.userAgent});lastSyncKey43=[sub.endpoint,currentGroupId,me?.memberId||me?.displayName].join('|');lastSyncAt43=Date.now();
  if(currentView==='settings')renderSettings();alert('게임 알림을 켰습니다.\n\n편성대기조에 들어가거나 경기가 시작되면 이 기기로 알림이 옵니다.');
 }catch(e){showError(e)}finally{pushBusy43=false;if(currentView==='settings')renderPushCard43()}
};
window.disableGamePush43=async function(){
 if(pushBusy43)return;pushBusy43=true;try{const sub=await subscription43();if(sub){try{await postPush43({action:'unsubscribe',endpoint:sub.endpoint})}catch{}await sub.unsubscribe()}lastSyncKey43='';lastSyncAt43=0;if(currentView==='settings')renderSettings();alert('이 기기의 게임 알림을 껐습니다.')}catch(e){showError(e)}finally{pushBusy43=false;if(currentView==='settings')renderPushCard43()}
};

async function renderPushCard43(){
 const card=$('gamePushCard43');if(!card)return;
 const status=$('gamePushStatus43'),btn=$('gamePushBtn43');if(!status||!btn)return;
 if(!supported43()){status.textContent='이 기기/브라우저는 푸시 알림을 지원하지 않습니다.';btn.disabled=true;btn.textContent='지원하지 않음';return}
 if(ios43()&&!standalone43()){status.textContent='아이폰/아이패드는 홈 화면에 추가한 뒤 콕매치 아이콘으로 실행해야 알림을 켤 수 있습니다.';btn.disabled=false;btn.textContent='홈 화면 추가 후 사용';btn.onclick=()=>alert('Safari 공유 버튼 → 홈 화면에 추가 → 홈 화면의 콕매치 아이콘으로 실행해주세요.');return}
 if(Notification.permission==='denied'){status.textContent='알림 권한이 차단되어 있습니다. 기기 설정의 알림에서 콕매치를 허용해주세요.';btn.disabled=true;btn.textContent='알림 권한 차단됨';return}
 let sub=null;try{sub=Notification.permission==='granted'?await subscription43():null}catch{}
 if(sub){status.textContent='켜짐 · 편성대기 배정과 경기 시작 알림을 이 기기에서 받습니다.';btn.disabled=false;btn.textContent='알림 끄기';btn.onclick=disableGamePush43;syncExisting43(false).catch(()=>{})}
 else{status.textContent=Notification.permission==='granted'?'알림 권한은 허용되어 있습니다. 게임 알림을 연결해주세요.':'꺼짐 · 알림은 기기별로 한 번만 켜면 됩니다.';btn.disabled=false;btn.textContent='게임 알림 켜기';btn.onclick=enableGamePush43}
}
const renderSettingsPrev43=renderSettings;
renderSettings=function(){const r=renderSettingsPrev43();const box=$('settings');if(!box)return r;let card=$('gamePushCard43');if(!card){card=document.createElement('div');card.id='gamePushCard43';card.className='card';card.innerHTML=`<div class="between"><div><b>게임 알림</b><div id="gamePushStatus43" class="meta" style="margin-top:5px;line-height:1.6">상태 확인 중...</div></div><button id="gamePushBtn43" class="btn pri" type="button">게임 알림 켜기</button></div><div class="meta" style="margin-top:8px;line-height:1.6">내가 편성대기조에 들어가면 조 번호를, 경기 시작 시 입장할 코트 번호를 알려줍니다. 알림 설정은 기기별로 적용됩니다.</div>`;const title=box.querySelector('.title');if(title)title.insertAdjacentElement('afterend',card);else box.prepend(card)}if(me?.globalAdmin&&String(me?.displayName||'').trim()==='박태영'){const ver=[...box.querySelectorAll('.card')].find(c=>String(c.textContent||'').includes('프로그램 버전'));if(ver){const meta=ver.querySelector('.meta');if(meta)meta.textContent='콕매치 v4.3 · 편성대기/경기시작 푸시 알림'}}setTimeout(()=>renderPushCard43().catch(()=>{}),0);return r};

async function goPush43(data={}){const view=['queue','playing','members','stats','settings'].includes(String(data.view||''))?String(data.view):'queue';if(!T||!me){pendingPushNav43=data;return}try{if(data.clubId&&String(data.clubId)!==String(currentGroupId)&&typeof switchGroup==='function'){await switchGroup(String(data.clubId));}goView(view)}catch(e){console.error('push navigation v4.3',e);try{goView(view)}catch{}}}
if('serviceWorker'in navigator)navigator.serviceWorker.addEventListener('message',e=>{if(e.data?.type==='KOKMATCH_PUSH_CLICK')goPush43(e.data.data||{view:e.data.view})});
try{const q=new URLSearchParams(location.search),v=q.get('pushView');if(v){pendingPushNav43={view:v};q.delete('pushView');const rest=q.toString();history.replaceState(null,'',location.pathname+(rest?'?'+rest:''))}}catch{}

const loadStatePrev43=loadState;
loadState=async function(...args){const r=await loadStatePrev43(...args);if(T&&me){registerSw43().then(()=>syncExisting43(false)).catch(()=>{});if(pendingPushNav43){const p=pendingPushNav43;pendingPushNav43=null;setTimeout(()=>goPush43(p),30)}}return r};
const logoutPrev43=logout;
logout=async function(...args){try{if(supported43()&&Notification.permission==='granted'){const sub=await subscription43();if(sub&&T)await postPush43({action:'unsubscribe',endpoint:sub.endpoint}).catch(()=>{})}}catch{}lastSyncKey43='';lastSyncAt43=0;return logoutPrev43(...args)};

setTimeout(()=>{registerSw43().then(()=>{if(T&&me)syncExisting43(false).catch(()=>{})}).catch(()=>{})},0);
})();

(()=>{
const CUR43='4.3';let latestUi43=CUR43,refreshUi43=false;
function cmpUi43(a,b){const A=String(a||'0').replace(/^v/i,'').split('.').map(Number),B=String(b||'0').replace(/^v/i,'').split('.').map(Number);for(let i=0;i<Math.max(A.length,B.length);i++){const x=A[i]||0,y=B[i]||0;if(x!==y)return x>y?1:-1}return 0}
function styleUi43(){if($('v43topStyle'))return;const s=document.createElement('style');s.id='v43topStyle';s.textContent='#topActions37,#topActions39,#topActions40,#topActions41,#topActions42{display:none!important}#topActions43{margin-left:auto;display:flex;align-items:center;justify-content:flex-end;gap:4px;position:relative;z-index:70;pointer-events:auto}#currentVersion43{font-size:10px;font-weight:900;padding:6px 5px;border-radius:8px;background:rgba(255,255,255,.18);white-space:nowrap}#headerRefresh43{max-width:170px;min-height:30px;padding:6px 8px;font-size:10.5px;font-weight:800;line-height:1.15;white-space:normal}#logout43{flex:0 0 64px;width:64px;min-width:64px;max-width:64px;min-height:30px;padding:6px 4px;font-size:11px;white-space:nowrap}.toprow>.logout{display:none!important}@media(max-width:380px){#currentVersion43{display:none}#headerRefresh43{max-width:135px;font-size:9.5px}#logout43{flex-basis:56px;width:56px;min-width:56px;max-width:56px;font-size:10px}}';document.head.appendChild(s)}
function updateUi43(){const v=$('currentVersion43'),b=$('headerRefresh43');if(v)v.textContent='v'+CUR43;if(!b)return;const newer=cmpUi43(latestUi43,CUR43)>0;b.textContent=refreshUi43?'불러오는 중…':newer?`v${latestUi43} 업데이트 · 새로고침`:'↻ 새로고침'}
function ensureUi43(){styleUi43();const row=document.querySelector('.toprow');if(!row)return;let a=$('topActions43');if(!a){a=document.createElement('div');a.id='topActions43';a.innerHTML='<span id="currentVersion43">v4.3</span><button id="headerRefresh43" class="btn ghost" type="button">↻ 새로고침</button><button id="logout43" type="button">로그아웃</button>';row.appendChild(a);$('headerRefresh43')?.addEventListener('click',()=>refreshApp43());$('logout43')?.addEventListener('click',()=>logout())}updateUi43()}
async function latestUiCheck43(){try{const r=await fetch('/latest-version.json?t='+Date.now(),{cache:'no-store'});if(r.ok){const x=await r.json();latestUi43=String(x.semanticVersion||x.label||CUR43).replace(/^v/i,'')||CUR43}}catch{}updateUi43();return latestUi43}
window.refreshApp43=async function(target=''){if(refreshUi43)return;refreshUi43=true;updateUi43();try{const v=String(target||await latestUiCheck43()||CUR43).replace(/^v/i,'');location.replace('/?v='+encodeURIComponent(v)+'&refresh='+Date.now())}catch(e){refreshUi43=false;updateUi43();showError(e)}};
window.refreshApp42=window.refreshApp43;window.refreshApp41=window.refreshApp43;window.refreshApp40=window.refreshApp43;window.refreshApp39=window.refreshApp43;window.refreshApp37=window.refreshApp43;
try{sessionStorage.setItem('kokmatch_auto_update_target_v40',CUR43);sessionStorage.setItem('kokmatch_auto_update_target_v39',CUR43)}catch{}
const renderHeaderTopPrev43=renderHeader;renderHeader=function(){const r=renderHeaderTopPrev43();ensureUi43();return r};
setTimeout(()=>{ensureUi43();latestUiCheck43()},0);setInterval(()=>latestUiCheck43(),60000);
})();
