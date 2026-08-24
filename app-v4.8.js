(()=>{
const CUR48='4.8';
const PUSH48_API='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-push-v43';
const VAPID48='BJ0MUsN_Hr6yYqSQfQfD734hbwZZjeoc1SmreGE0jDHDRTb0Hn7Eaaib6LWyUWhXmDIOxUj0TU5-gpIYyBeW6vI';
let pushBusy48=false,lastSync48='',lastSyncAt48=0,swReady48=null,latest48=CUR48,refreshBusy48=false;

function ios48(){return /iPad|iPhone|iPod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1)}
function standalone48(){return window.matchMedia?.('(display-mode: standalone)')?.matches===true||navigator.standalone===true}
function declarative48(){return !!(window.pushManager&&typeof window.pushManager.subscribe==='function'&&typeof window.pushManager.getSubscription==='function')}
function supported48(){return 'Notification'in window&&(declarative48()||('serviceWorker'in navigator&&'PushManager'in window))}
function b64u48(s){const p='='.repeat((4-s.length%4)%4),b=(s+p).replace(/-/g,'+').replace(/_/g,'/'),raw=atob(b),out=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);return out}
function wait48(ms){return new Promise(r=>setTimeout(r,ms))}
async function post48(body){const r=await fetch(PUSH48_API,{method:'POST',headers:{'content-type':'application/json',...(T?{authorization:'Bearer '+T}:{})},body:JSON.stringify(body),cache:'no-store'});const x=await r.json().catch(()=>({}));if(!r.ok)throw new Error(x.error||'게임 알림 처리에 실패했습니다.');return x}
function subJson48(sub){const j=sub.toJSON();return{endpoint:j.endpoint,keys:{p256dh:j.keys?.p256dh||'',auth:j.keys?.auth||''}}}

async function waitActive48(reg,timeout=12000){
 if(reg?.active)return reg;
 const waiting=reg?.waiting;if(waiting){try{waiting.postMessage({type:'SKIP_WAITING'})}catch{}}
 const worker=reg?.installing||reg?.waiting;
 const started=Date.now();
 while(Date.now()-started<timeout){if(reg?.active)return reg;if(worker?.state==='activated')break;await wait48(120)}
 try{const fresh=await navigator.serviceWorker.getRegistration('/');if(fresh?.active)return fresh}catch{}
 return reg?.active?reg:null;
}
async function ensureSw48(){
 if(!('serviceWorker'in navigator))throw new Error('이 기기는 서비스워커를 지원하지 않습니다.');
 if(swReady48?.active)return swReady48;
 let reg=null;try{reg=await navigator.serviceWorker.getRegistration('/')}catch{}
 try{reg=await navigator.serviceWorker.register('/kokmatch-sw.js',{scope:'/',updateViaCache:'none'})}catch(e){if(!reg)throw e}
 try{await reg.update()}catch{}
 reg=await waitActive48(reg,8000)||reg;
 if(!reg?.active){try{const ready=await Promise.race([navigator.serviceWorker.ready,new Promise(r=>setTimeout(()=>r(null),5000))]);if(ready?.active)reg=ready}catch{}}
 if(!reg?.active)throw new Error('이 iPhone의 서비스워커가 활성화되지 않았습니다. iOS를 최신 버전으로 업데이트하거나 홈 화면의 콕매치를 다시 추가해주세요.');
 swReady48=reg;return reg;
}
async function manager48(){if(ios48()&&declarative48())return{manager:window.pushManager,mode:'ios-direct'};const reg=await ensureSw48();return{manager:reg.pushManager,mode:'service-worker'}}
async function subscription48(){const x=await manager48();return{...x,subscription:await x.manager.getSubscription()}}
async function sync48(force=false){
 if(!T||!me||!currentGroupId||!supported48()||Notification.permission!=='granted')return false;
 const x=await subscription48();if(!x.subscription)return false;
 const key=[x.subscription.endpoint,currentGroupId,me.memberId||me.displayName].join('|');if(!force&&key===lastSync48&&Date.now()-lastSyncAt48<600000)return true;
 await post48({action:'subscribe',groupId:currentGroupId,subscription:subJson48(x.subscription),userAgent:navigator.userAgent,pushMode:x.mode});lastSync48=key;lastSyncAt48=Date.now();return true;
}

window.enableGamePush48=async function(){
 if(pushBusy48)return;if(!supported48())return alert('이 기기/브라우저에서는 게임 알림을 지원하지 않습니다.');
 if(ios48()&&!standalone48())return alert('아이폰/아이패드는 홈 화면에 추가한 콕매치 앱에서만 게임 알림을 켤 수 있습니다. Safari 공유 → 홈 화면에 추가 후 홈 화면 아이콘으로 실행해주세요.');
 pushBusy48=true;
 try{
  const permission=Notification.permission==='granted'?'granted':await Notification.requestPermission();
  if(permission!=='granted')throw new Error('알림 권한이 허용되지 않았습니다. iPhone 설정 → 알림 → 콕매치에서 알림을 허용해주세요.');
  const x=await manager48();let sub=await x.manager.getSubscription();if(!sub)sub=await x.manager.subscribe({userVisibleOnly:true,applicationServerKey:b64u48(VAPID48)});
  await post48({action:'subscribe',groupId:currentGroupId,subscription:subJson48(sub),userAgent:navigator.userAgent,pushMode:x.mode});lastSync48=[sub.endpoint,currentGroupId,me?.memberId||me?.displayName].join('|');lastSyncAt48=Date.now();
  await post48({action:'test',groupId:currentGroupId,endpoint:sub.endpoint});
  if(ios48()&&declarative48())ensureSw48().catch(()=>{});
  alert('게임 알림을 켰습니다.\n\n잠시 후 “게임 알림 설정이 완료되었습니다.” 테스트 알림이 오면 정상입니다.');
 }catch(e){if(typeof showError==='function')showError(e);else alert(e?.message||'게임 알림을 켜지 못했습니다.')}
 finally{pushBusy48=false;setTimeout(()=>window.renderPushCard48().catch(()=>{}),30)}
};
window.disableGamePush48=async function(){
 if(pushBusy48)return;pushBusy48=true;
 try{const x=await subscription48();if(x.subscription){try{await post48({action:'unsubscribe',endpoint:x.subscription.endpoint})}catch{}await x.subscription.unsubscribe()}lastSync48='';lastSyncAt48=0;alert('이 기기의 게임 알림을 껐습니다.')}
 catch(e){if(typeof showError==='function')showError(e);else alert(e?.message||'게임 알림을 끄지 못했습니다.')}
 finally{pushBusy48=false;setTimeout(()=>window.renderPushCard48().catch(()=>{}),30)}
};
window.enableGamePush44=window.enableGamePush48;window.enableGamePush43=window.enableGamePush48;window.disableGamePush44=window.disableGamePush48;window.disableGamePush43=window.disableGamePush48;

function ensurePushCard48(){
 const box=typeof $==='function'?$('settings'):null;if(!box)return null;document.getElementById('gamePushCard43')?.remove();
 let card=document.getElementById('gamePushCard48');if(card)return card;card=document.createElement('div');card.id='gamePushCard48';card.className='card';
 card.innerHTML='<div class="between"><div style="min-width:0;flex:1"><b>게임 알림</b><div id="gamePushStatus48" class="meta" style="margin-top:5px;line-height:1.6">상태 확인 중...</div></div><button id="gamePushBtn48" class="btn pri" type="button">게임 알림 켜기</button></div><div class="meta" style="margin-top:8px;line-height:1.6">편성대기조 배정과 경기 시작 시 조 번호와 코트 번호를 알립니다. iPhone은 최신 iOS에서 서비스워커 없이도 직접 푸시 구독을 사용합니다.</div>';
 const title=box.querySelector('.title');if(title)title.insertAdjacentElement('afterend',card);else box.prepend(card);return card;
}
window.renderPushCard48=async function(){
 const card=ensurePushCard48();if(!card)return;const status=document.getElementById('gamePushStatus48'),btn=document.getElementById('gamePushBtn48');if(!status||!btn)return;btn.disabled=false;
 if(!supported48()){status.textContent='이 기기/브라우저는 푸시 알림을 지원하지 않습니다.';btn.disabled=true;btn.textContent='지원하지 않음';return}
 if(ios48()&&!standalone48()){status.textContent='아이폰은 홈 화면에 추가한 콕매치 앱으로 실행해야 알림을 받을 수 있습니다.';btn.textContent='홈 화면 추가 안내';btn.onclick=()=>alert('Safari 공유 버튼 → 홈 화면에 추가 → 홈 화면의 콕매치 아이콘으로 실행해주세요.');return}
 if(Notification.permission==='denied'){status.textContent='알림 권한이 차단되어 있습니다. iPhone 설정 → 알림 → 콕매치에서 허용해주세요.';btn.disabled=true;btn.textContent='알림 권한 차단됨';return}
 try{const x=Notification.permission==='granted'?await subscription48():null;if(x?.subscription){status.textContent=x.mode==='ios-direct'?'켜짐 · iPhone 직접 푸시 연결됨':'켜짐 · 게임 푸시 연결됨';btn.textContent='알림 끄기';btn.onclick=window.disableGamePush48;sync48(false).catch(()=>{});return}}catch(e){console.warn('push status v4.8',e)}
 status.textContent=Notification.permission==='granted'?'알림 권한은 허용되어 있습니다. 아래 버튼을 눌러 게임 알림을 연결해주세요.':'꺼짐 · 이 기기에서 게임 알림을 켜주세요.';btn.textContent='게임 알림 켜기';btn.onclick=window.enableGamePush48;
};

const renderSettingsPrev48=renderSettings;
renderSettings=function(){const r=renderSettingsPrev48();ensurePushCard48();const box=typeof $==='function'?$('settings'):null;if(box&&me?.globalAdmin===true&&String(me?.displayName||'').trim()==='박태영'){const card=[...box.querySelectorAll('.card')].find(c=>String(c.textContent||'').includes('프로그램 버전'));if(card){const m=card.querySelector('.meta');if(m)m.textContent='콕매치 v4.8 · iPhone 직접 푸시 · 서비스워커 fallback'}}setTimeout(()=>window.renderPushCard48().catch(()=>{}),0);return r};

const loadStatePrev48=loadState;loadState=async function(...args){const r=await loadStatePrev48(...args);if(T&&me&&Notification.permission==='granted')sync48(false).catch(()=>{});return r};

function cmp48(a,b){const A=String(a||'0').replace(/^v/i,'').split('.').map(n=>Number(n)||0),B=String(b||'0').replace(/^v/i,'').split('.').map(n=>Number(n)||0);for(let i=0;i<Math.max(A.length,B.length);i++){const x=A[i]||0,y=B[i]||0;if(x!==y)return x>y?1:-1}return 0}
function styleTop48(){if(document.getElementById('v48topStyle'))return;const s=document.createElement('style');s.id='v48topStyle';s.textContent=`#topActions37,#topActions39,#topActions40,#topActions41,#topActions42,#topActions43,#topActions44,#topActions45,#topActions46,#topActions47{display:none!important}#topActions48{margin-left:auto;display:flex;align-items:center;justify-content:flex-end;gap:4px;position:relative;z-index:120;pointer-events:auto;min-width:0}#currentVersion48{font-size:10px;font-weight:900;padding:6px 5px;border-radius:8px;background:rgba(255,255,255,.18);white-space:nowrap;flex:0 0 auto}#headerRefresh48{flex:0 1 auto;min-width:0;max-width:170px;min-height:30px;padding:6px 8px;font-size:10.5px;font-weight:800;line-height:1.15;white-space:normal;overflow-wrap:anywhere}#logout48{flex:0 0 64px;width:64px;min-width:64px;max-width:64px;min-height:30px;padding:6px 4px;font-size:11px;white-space:nowrap}.toprow>.logout{display:none!important}@media(max-width:380px){#currentVersion48{display:none}#headerRefresh48{max-width:135px;font-size:9.5px}#logout48{flex-basis:56px;width:56px;min-width:56px;max-width:56px;font-size:10px}}`;document.head.appendChild(s)}
function updateTop48(){const v=document.getElementById('currentVersion48'),b=document.getElementById('headerRefresh48');if(v)v.textContent='v'+CUR48;if(!b)return;const newer=cmp48(latest48,CUR48)>0;b.textContent=refreshBusy48?'불러오는 중…':newer?`v${latest48} 업데이트 · 새로고침`:'↻ 새로고침';b.title=newer?`최신버전 v${latest48}이 있습니다. 눌러서 업데이트하세요.`:'현재 페이지를 다시 불러옵니다.'}
function ensureTop48(){styleTop48();const row=document.querySelector('.toprow');if(!row)return;let a=document.getElementById('topActions48');if(!a){a=document.createElement('div');a.id='topActions48';a.innerHTML='<span id="currentVersion48">v4.8</span><button id="headerRefresh48" class="btn ghost" type="button">↻ 새로고침</button><button id="logout48" type="button">로그아웃</button>';row.appendChild(a);a.querySelector('#headerRefresh48')?.addEventListener('click',()=>window.refreshApp48());a.querySelector('#logout48')?.addEventListener('click',()=>logout())}updateTop48()}
async function latestCheck48(){try{const r=await fetch('/latest-version.json?t='+Date.now(),{cache:'no-store'});if(r.ok){const x=await r.json();latest48=String(x.semanticVersion||x.label||CUR48).replace(/^v/i,'')||CUR48}}catch{}updateTop48();return latest48}
window.refreshApp48=async function(target=''){if(refreshBusy48)return;refreshBusy48=true;updateTop48();try{const v=String(target||await latestCheck48()||CUR48).replace(/^v/i,'');try{if(typeof saveRefreshState==='function')saveRefreshState()}catch{}location.replace('/?v='+encodeURIComponent(v)+'&refresh='+Date.now())}catch(e){refreshBusy48=false;updateTop48();if(typeof showError==='function')showError(e);else alert(e?.message||'새로고침에 실패했습니다.')}};
window.refreshApp47=window.refreshApp48;window.refreshApp46=window.refreshApp48;window.refreshApp45=window.refreshApp48;window.refreshApp44=window.refreshApp48;window.refreshApp43=window.refreshApp48;window.refreshApp42=window.refreshApp48;window.refreshApp41=window.refreshApp48;window.refreshApp40=window.refreshApp48;window.refreshApp39=window.refreshApp48;window.refreshApp37=window.refreshApp48;
const renderHeaderPrev48=renderHeader;renderHeader=function(){const r=renderHeaderPrev48();ensureTop48();return r};

try{const q=new URLSearchParams(location.search),view=q.get('pushView'),club=q.get('pushClub');if(view){q.delete('pushView');q.delete('pushClub');history.replaceState(null,'',location.pathname+(q.toString()?'?'+q.toString():''));setTimeout(async()=>{if(!T||!me)return;try{if(club&&String(club)!==String(currentGroupId)&&typeof switchGroup==='function')await switchGroup(String(club));if(['queue','playing','members','stats','settings'].includes(view))goView(view)}catch{}},700)}}catch{}

if(!ios48()||!declarative48()){if('serviceWorker'in navigator)ensureSw48().catch(()=>{})}
if(T&&me&&Notification.permission==='granted')setTimeout(()=>sync48(false).catch(()=>{}),300);
setTimeout(()=>{ensureTop48();latestCheck48().catch(()=>{})},0);setInterval(()=>latestCheck48().catch(()=>{}),60000);
})();
