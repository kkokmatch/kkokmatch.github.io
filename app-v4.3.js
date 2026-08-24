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
renderSettings=function(){const r=renderSettingsPrev43();const box=$('settings');if(!box)return r;let card=$('gamePushCard43');if(!card){card=document.createElement('div');card.id='gamePushCard43';card.className='card';card.innerHTML=`<div class="between"><div><b>게임 알림</b><div id="gamePushStatus43" class="meta" style="margin-top:5px;line-height:1.6">상태 확인 중...</div></div><button id="gamePushBtn43" class="btn pri" type="button">게임 알림 켜기</button></div><div class="meta" style="margin-top:8px;line-height:1.6">내가 편성대기조에 들어가면 조 번호를, 경기 시작 시 입장할 코트 번호를 알려줍니다. 알림 설정은 기기별로 적용됩니다.</div>`;const title=box.querySelector('.title');if(title)title.insertAdjacentElement('afterend',card);else box.prepend(card)}setTimeout(()=>renderPushCard43().catch(()=>{}),0);return r};

async function goPush43(data={}){const view=['queue','playing','members','stats','settings'].includes(String(data.view||''))?String(data.view):'queue';if(!T||!me){pendingPushNav43=data;return}try{if(data.clubId&&String(data.clubId)!==String(currentGroupId)&&typeof switchGroup==='function'){await switchGroup(String(data.clubId));}goView(view)}catch(e){console.error('push navigation v4.3',e);try{goView(view)}catch{}}}
if('serviceWorker'in navigator)navigator.serviceWorker.addEventListener('message',e=>{if(e.data?.type==='KOKMATCH_PUSH_CLICK')goPush43(e.data.data||{view:e.data.view})});
try{const q=new URLSearchParams(location.search),v=q.get('pushView');if(v){pendingPushNav43={view:v};q.delete('pushView');const rest=q.toString();history.replaceState(null,'',location.pathname+(rest?'?'+rest:''))}}catch{}

const loadStatePrev43=loadState;
loadState=async function(...args){const r=await loadStatePrev43(...args);if(T&&me){registerSw43().then(()=>syncExisting43(false)).catch(()=>{});if(pendingPushNav43){const p=pendingPushNav43;pendingPushNav43=null;setTimeout(()=>goPush43(p),30)}}return r};
const logoutPrev43=logout;
logout=async function(...args){try{if(supported43()&&Notification.permission==='granted'){const sub=await subscription43();if(sub&&T)await postPush43({action:'unsubscribe',endpoint:sub.endpoint}).catch(()=>{})}}catch{}lastSyncKey43='';lastSyncAt43=0;return logoutPrev43(...args)};

setTimeout(()=>{registerSw43().then(()=>{if(T&&me)syncExisting43(false).catch(()=>{})}).catch(()=>{})},0);
})();
