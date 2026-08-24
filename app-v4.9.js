(()=>{
const CUR49='4.9';
window.__kokmatchPushUiOwner49=true;
let latest49=CUR49,refreshBusy49=false;
const push49={known:false,enabled:false,mode:'',permission:typeof Notification!=='undefined'?Notification.permission:'unsupported',checkedAt:0,checking:null,busy:false};

function ios49(){return /iPad|iPhone|iPod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1)}
function standalone49(){return window.matchMedia?.('(display-mode: standalone)')?.matches===true||navigator.standalone===true}
function declarative49(){return !!(window.pushManager&&typeof window.pushManager.getSubscription==='function')}
function supported49(){return 'Notification'in window&&(declarative49()||('serviceWorker'in navigator&&'PushManager'in window))}

function installStyle49(){
 if(document.getElementById('push49style'))return;
 const s=document.createElement('style');s.id='push49style';
 s.textContent=`#gamePushCard43,#gamePushCard48{display:none!important}#gamePushCard49{contain:layout style;overflow:hidden}.pushHelpButtons49{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}.pushHelpToggle49{width:100%;min-height:38px;text-align:left;justify-content:space-between}.pushHelpBody49{margin-top:8px;padding:10px 12px;border-radius:12px;background:rgba(36,83,212,.06);font-size:13px;line-height:1.65}.pushHelpBody49[hidden]{display:none!important}.pushHelpBody49 b{display:block;margin-bottom:4px}.pushHelpBody49 ol{margin:6px 0 0 19px;padding:0}.pushHelpBody49 li{margin:3px 0}@media(max-width:420px){.pushHelpButtons49{grid-template-columns:1fr}}#topActions37,#topActions39,#topActions40,#topActions41,#topActions42,#topActions43,#topActions44,#topActions45,#topActions46,#topActions47,#topActions48{display:none!important}#topActions49{margin-left:auto;display:flex;align-items:center;justify-content:flex-end;gap:4px;position:relative;z-index:130;pointer-events:auto;min-width:0}#currentVersion49{font-size:10px;font-weight:900;padding:6px 5px;border-radius:8px;background:rgba(255,255,255,.18);white-space:nowrap;flex:0 0 auto}#headerRefresh49{flex:0 1 auto;min-width:0;max-width:170px;min-height:30px;padding:6px 8px;font-size:10.5px;font-weight:800;line-height:1.15;white-space:normal;overflow-wrap:anywhere}#logout49{flex:0 0 64px;width:64px;min-width:64px;max-width:64px;min-height:30px;padding:6px 4px;font-size:11px;white-space:nowrap}.toprow>.logout{display:none!important}@media(max-width:380px){#currentVersion49{display:none}#headerRefresh49{max-width:135px;font-size:9.5px}#logout49{flex-basis:56px;width:56px;min-width:56px;max-width:56px;font-size:10px}}`;
 document.head.appendChild(s);
}
installStyle49();

async function inspectPush49(force=false){
 if(push49.checking)return push49.checking;
 if(!force&&push49.known&&Date.now()-push49.checkedAt<60000)return push49;
 push49.checking=(async()=>{
  push49.permission=typeof Notification!=='undefined'?Notification.permission:'unsupported';
  if(!supported49()||push49.permission!=='granted'){push49.known=true;push49.enabled=false;push49.mode='';push49.checkedAt=Date.now();return push49}
  let sub=null,mode='';
  try{
   if(ios49()&&declarative49()){sub=await window.pushManager.getSubscription();mode='ios-direct'}
   else if('serviceWorker'in navigator){const reg=await navigator.serviceWorker.getRegistration('/');if(reg?.pushManager){sub=await reg.pushManager.getSubscription();mode='service-worker'}}
  }catch(e){console.warn('push inspect v4.9',e)}
  push49.known=true;push49.enabled=!!sub;push49.mode=sub?mode:'';push49.checkedAt=Date.now();return push49;
 })();
 try{return await push49.checking}finally{push49.checking=null}
}

function statusText49(){
 if(!supported49())return '이 기기/브라우저는 푸시 알림을 지원하지 않습니다.';
 if(ios49()&&!standalone49())return '아이폰은 홈 화면에 추가한 콕매치 앱으로 실행해야 알림을 받을 수 있습니다.';
 if(push49.permission==='denied')return '알림 권한이 차단되어 있습니다. 아래 기기별 설정방법을 확인해주세요.';
 if(!push49.known)return '알림 연결 상태 확인 중...';
 if(push49.enabled)return push49.mode==='ios-direct'?'켜짐 · iPhone 직접 푸시 연결됨':'켜짐 · 게임 푸시 연결됨';
 if(push49.permission==='granted')return '알림 권한은 허용되어 있습니다. 게임 알림 연결이 필요합니다.';
 return '꺼짐 · 이 기기에서 게임 알림을 켜주세요.';
}
function buttonText49(){if(push49.busy)return '처리 중…';if(!push49.known)return '확인 중…';return push49.enabled?'알림 끄기':'게임 알림 켜기'}

function helpHtml49(){return `<div class="pushHelpButtons49"><button class="btn ghost pushHelpToggle49" id="pushHelpIphone49" type="button" aria-expanded="false">아이폰 알림 설정방법 <span>▾</span></button><button class="btn ghost pushHelpToggle49" id="pushHelpGalaxy49" type="button" aria-expanded="false">갤럭시 알림 설정방법 <span>▾</span></button></div><div id="pushHelpIphoneBody49" class="pushHelpBody49" hidden><b>아이폰 알림 설정방법</b><ol><li>Safari에서 콕매치를 연 뒤 공유 버튼 → <b>홈 화면에 추가</b>를 선택합니다.</li><li>홈 화면의 콕매치 아이콘으로 앱을 실행하고 로그인합니다.</li><li>설정 → 게임 알림 → <b>게임 알림 켜기</b>를 누르고 iPhone 알림 허용을 선택합니다.</li><li>이미 차단했다면 iPhone 설정 → 알림 → 콕매치 → <b>알림 허용</b>을 켭니다.</li><li>설정 직후 “게임 알림 설정이 완료되었습니다.” 테스트 알림이 오면 정상입니다.</li></ol></div><div id="pushHelpGalaxyBody49" class="pushHelpBody49" hidden><b>갤럭시 알림 설정방법</b><ol><li>Chrome 또는 삼성 인터넷에서 콕매치를 홈 화면에 추가하고 홈 화면 아이콘으로 실행합니다.</li><li>로그인 후 설정 → 게임 알림 → <b>게임 알림 켜기</b>를 누르고 알림 허용을 선택합니다.</li><li>알림이 차단된 경우 갤럭시 설정 → 알림 → 앱 알림 → <b>콕매치</b>를 허용합니다. 콕매치가 안 보이면 Chrome 또는 삼성 인터넷의 알림 허용도 확인합니다.</li><li>배터리 절전 설정이 강한 경우 콕매치를 절전 예외 앱으로 두면 백그라운드 알림 수신이 더 안정적입니다.</li><li>설정 직후 테스트 알림이 오면 정상입니다.</li></ol></div>`}

function ensureCard49(){
 const box=typeof $==='function'?$('settings'):document.getElementById('settings');if(!box)return null;
 document.getElementById('gamePushCard43')?.remove();document.getElementById('gamePushCard48')?.remove();
 let card=document.getElementById('gamePushCard49');
 if(!card){
  card=document.createElement('div');card.id='gamePushCard49';card.className='card';
  card.innerHTML=`<div class="between"><div style="min-width:0;flex:1"><b>게임 알림</b><div id="gamePushStatus49" class="meta" style="margin-top:5px;line-height:1.6"></div></div><button id="gamePushBtn49" class="btn pri" type="button"></button></div><div class="meta" style="margin-top:8px;line-height:1.6">편성대기조 배정 시 조 번호를, 경기 시작 시 입장할 코트 번호를 알려줍니다. 알림 설정은 기기별로 한 번씩 필요합니다.</div>${helpHtml49()}`;
  const title=box.querySelector('.title');if(title)title.insertAdjacentElement('afterend',card);else box.prepend(card);
  card.querySelector('#pushHelpIphone49')?.addEventListener('click',()=>toggleHelp49('iphone'));
  card.querySelector('#pushHelpGalaxy49')?.addEventListener('click',()=>toggleHelp49('galaxy'));
  card.querySelector('#gamePushBtn49')?.addEventListener('click',()=>togglePush49());
 }
 paintCard49();return card;
}
function toggleHelp49(kind){
 const mine=kind==='iphone'?document.getElementById('pushHelpIphoneBody49'):document.getElementById('pushHelpGalaxyBody49');
 const other=kind==='iphone'?document.getElementById('pushHelpGalaxyBody49'):document.getElementById('pushHelpIphoneBody49');
 const btn=kind==='iphone'?document.getElementById('pushHelpIphone49'):document.getElementById('pushHelpGalaxy49');
 const otherBtn=kind==='iphone'?document.getElementById('pushHelpGalaxy49'):document.getElementById('pushHelpIphone49');
 if(!mine)return;const open=mine.hidden;mine.hidden=!open;if(other)other.hidden=true;btn?.setAttribute('aria-expanded',open?'true':'false');otherBtn?.setAttribute('aria-expanded','false');
}
function paintCard49(){
 const status=document.getElementById('gamePushStatus49'),btn=document.getElementById('gamePushBtn49');if(!status||!btn)return;
 status.textContent=statusText49();btn.textContent=buttonText49();btn.disabled=push49.busy||!supported49()||!push49.known||push49.permission==='denied'||(ios49()&&!standalone49());
}
async function refreshPushState49(force=false){try{await inspectPush49(force)}finally{paintCard49()}}
async function togglePush49(){
 if(push49.busy)return;push49.busy=true;paintCard49();
 try{
  if(push49.enabled){if(typeof window.disableGamePush48==='function')await window.disableGamePush48();else if(typeof window.disableGamePush44==='function')await window.disableGamePush44()}
  else{if(typeof window.enableGamePush48==='function')await window.enableGamePush48();else if(typeof window.enableGamePush44==='function')await window.enableGamePush44()}
 }finally{push49.busy=false;push49.known=false;await refreshPushState49(true)}
}

/* Stop older async push-card painters. v4.9 owns only the settings UI; the v4.8 subscription logic stays in use. */
if(typeof window.renderPushCard48==='function')window.renderPushCard48=async()=>{};

const renderSettingsPrev49=renderSettings;
renderSettings=function(){
 const r=renderSettingsPrev49();installStyle49();ensureCard49();
 const box=typeof $==='function'?$('settings'):null;
 if(box&&me?.globalAdmin===true&&String(me?.displayName||'').trim()==='박태영'){
  const card=[...box.querySelectorAll('.card')].find(c=>String(c.textContent||'').includes('프로그램 버전'));
  if(card){const m=card.querySelector('.meta');if(m)m.textContent='콕매치 v4.9 · 알림설정 UI 안정화 · 기기별 안내'}
 }
 refreshPushState49(false).catch(()=>{});return r;
};

function cmp49(a,b){const A=String(a||'0').replace(/^v/i,'').split('.').map(n=>Number(n)||0),B=String(b||'0').replace(/^v/i,'').split('.').map(n=>Number(n)||0);for(let i=0;i<Math.max(A.length,B.length);i++){const x=A[i]||0,y=B[i]||0;if(x!==y)return x>y?1:-1}return 0}
function updateTop49(){const v=document.getElementById('currentVersion49'),b=document.getElementById('headerRefresh49');if(v)v.textContent='v'+CUR49;if(!b)return;const newer=cmp49(latest49,CUR49)>0;b.textContent=refreshBusy49?'불러오는 중…':newer?`v${latest49} 업데이트 · 새로고침`:'↻ 새로고침';b.title=newer?`최신버전 v${latest49}이 있습니다. 눌러서 업데이트하세요.`:'현재 페이지를 다시 불러옵니다.'}
function ensureTop49(){installStyle49();const row=document.querySelector('.toprow');if(!row)return;let a=document.getElementById('topActions49');if(!a){a=document.createElement('div');a.id='topActions49';a.innerHTML='<span id="currentVersion49">v4.9</span><button id="headerRefresh49" class="btn ghost" type="button">↻ 새로고침</button><button id="logout49" type="button">로그아웃</button>';row.appendChild(a);a.querySelector('#headerRefresh49')?.addEventListener('click',()=>window.refreshApp49());a.querySelector('#logout49')?.addEventListener('click',()=>logout())}updateTop49()}
async function latestCheck49(){try{const r=await fetch('/latest-version.json?t='+Date.now(),{cache:'no-store'});if(r.ok){const x=await r.json();latest49=String(x.semanticVersion||x.label||CUR49).replace(/^v/i,'')||CUR49}}catch{}updateTop49();return latest49}
window.refreshApp49=async function(target=''){if(refreshBusy49)return;refreshBusy49=true;updateTop49();try{const v=String(target||await latestCheck49()||CUR49).replace(/^v/i,'');try{if(typeof saveRefreshState==='function')saveRefreshState()}catch{}location.replace('/?v='+encodeURIComponent(v)+'&refresh='+Date.now())}catch(e){refreshBusy49=false;updateTop49();if(typeof showError==='function')showError(e);else alert(e?.message||'새로고침에 실패했습니다.')}};
window.refreshApp48=window.refreshApp49;window.refreshApp47=window.refreshApp49;window.refreshApp46=window.refreshApp49;window.refreshApp45=window.refreshApp49;window.refreshApp44=window.refreshApp49;window.refreshApp43=window.refreshApp49;window.refreshApp42=window.refreshApp49;window.refreshApp41=window.refreshApp49;window.refreshApp40=window.refreshApp49;window.refreshApp39=window.refreshApp49;window.refreshApp37=window.refreshApp49;
const renderHeaderPrev49=renderHeader;renderHeader=function(){const r=renderHeaderPrev49();ensureTop49();return r};

setTimeout(()=>{ensureTop49();latestCheck49();if(T&&me&&currentView==='settings'){ensureCard49();refreshPushState49(true).catch(()=>{})}},0);
setInterval(()=>latestCheck49(),60000);
})();
