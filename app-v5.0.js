(()=>{
const CUR50='5.0';
const GUIDE_KEY50='kokmatch_push_help_open_v50';
let latest50=CUR50,refreshBusy50=false;
let guideOpen50={iphone:false,galaxy:false};
try{const x=JSON.parse(sessionStorage.getItem(GUIDE_KEY50)||'{}');guideOpen50={iphone:!!x.iphone,galaxy:!!x.galaxy}}catch{}

function saveGuide50(){try{sessionStorage.setItem(GUIDE_KEY50,JSON.stringify(guideOpen50))}catch{}}
function installStyle50(){
 if(document.getElementById('v50style'))return;
 const s=document.createElement('style');s.id='v50style';s.textContent=`
 /* Past calendar days: substantially lighter than today/future while keeping poll dots readable. */
 .pollCalDay21.past22:not(.selected){color:#dce1e9!important;background:transparent!important;box-shadow:none!important}
 .pollCalDay21.past22.sun23:not(.selected),.pollCalDay21.past22.holiday23:not(.selected){color:#efdee1!important}
 .pollCalDay21.past22.sat23:not(.selected):not(.holiday23){color:#dfe7f5!important}
 .pollCalDay21.past22.hasPoll:not(.selected){background:#f8fbf6!important;color:#d2ddd0!important}
 .pollCalDay21.past22.selected{background:#f3f5f8!important;color:#c3cad5!important;box-shadow:inset 0 0 0 1px #e1e5eb!important}
 .pollCalDay21.past22.selected.sun23,.pollCalDay21.past22.selected.holiday23{color:#e2cfd2!important}
 .pollCalDay21.past22.selected.sat23:not(.holiday23){color:#ced9eb!important}
 #topActions37,#topActions39,#topActions40,#topActions41,#topActions42,#topActions43,#topActions44,#topActions45,#topActions46,#topActions47,#topActions48,#topActions49{display:none!important}
 #topActions50{margin-left:auto;display:flex;align-items:center;justify-content:flex-end;gap:4px;position:relative;z-index:140;pointer-events:auto;min-width:0}
 #currentVersion50{font-size:10px;font-weight:900;padding:6px 5px;border-radius:8px;background:rgba(255,255,255,.18);white-space:nowrap;flex:0 0 auto}
 #headerRefresh50{flex:0 1 auto;min-width:0;max-width:170px;min-height:30px;padding:6px 8px;font-size:10.5px;font-weight:800;line-height:1.15;white-space:normal;overflow-wrap:anywhere}
 #logout50{flex:0 0 64px;width:64px;min-width:64px;max-width:64px;min-height:30px;padding:6px 4px;font-size:11px;white-space:nowrap}
 .toprow>.logout{display:none!important}
 @media(max-width:380px){#currentVersion50{display:none}#headerRefresh50{max-width:135px;font-size:9.5px}#logout50{flex-basis:56px;width:56px;min-width:56px;max-width:56px;font-size:10px}}
 `;document.head.appendChild(s)
}
installStyle50();

function removeHomeCard50(){
 const box=typeof $==='function'?$('settings'):document.getElementById('settings');if(!box)return;
 [...box.children].forEach(el=>{
  if(!el.classList?.contains('card'))return;
  if(el.id==='gamePushCard49')return;
  const first=el.firstElementChild;
  if(first?.tagName==='B'&&String(first.textContent||'').trim()==='홈 화면에 추가')el.remove();
 })
}

function applyGuideState50(){
 const ib=document.getElementById('pushHelpIphoneBody49'),gb=document.getElementById('pushHelpGalaxyBody49');
 const it=document.getElementById('pushHelpIphone49'),gt=document.getElementById('pushHelpGalaxy49');
 if(ib)ib.hidden=!guideOpen50.iphone;if(gb)gb.hidden=!guideOpen50.galaxy;
 if(it){it.setAttribute('aria-expanded',guideOpen50.iphone?'true':'false');const sp=it.querySelector('span');if(sp)sp.textContent=guideOpen50.iphone?'▴':'▾'}
 if(gt){gt.setAttribute('aria-expanded',guideOpen50.galaxy?'true':'false');const sp=gt.querySelector('span');if(sp)sp.textContent=guideOpen50.galaxy?'▴':'▾'}
}
function bindGuideButton50(id,kind){
 const old=document.getElementById(id);if(!old||old.dataset.v50bound==='1')return;
 const btn=old.cloneNode(true);btn.dataset.v50bound='1';old.replaceWith(btn);
 let x0=0,y0=0,moved=false;
 btn.addEventListener('pointerdown',e=>{x0=e.clientX;y0=e.clientY;moved=false},{passive:true});
 btn.addEventListener('pointermove',e=>{if(Math.abs(e.clientX-x0)>8||Math.abs(e.clientY-y0)>8)moved=true},{passive:true});
 btn.addEventListener('click',e=>{
  if(moved){e.preventDefault();e.stopPropagation();return}
  guideOpen50[kind]=!guideOpen50[kind];saveGuide50();applyGuideState50()
 });
}
function stabilizeGuides50(){
 bindGuideButton50('pushHelpIphone49','iphone');bindGuideButton50('pushHelpGalaxy49','galaxy');applyGuideState50()
}
function settingsCleanup50(){
 removeHomeCard50();stabilizeGuides50();
 const box=typeof $==='function'?$('settings'):null;
 if(box&&me?.globalAdmin===true&&String(me?.displayName||'').trim()==='박태영'){
  const card=[...box.querySelectorAll('.card')].find(c=>String(c.textContent||'').includes('프로그램 버전'));
  if(card){const m=card.querySelector('.meta');if(m)m.textContent='콕매치 v5.0 · 알림설명 유지 · 지난날짜 가독성 조정'}
 }
}
const renderSettingsPrev50=renderSettings;
renderSettings=function(){const r=renderSettingsPrev50();settingsCleanup50();setTimeout(settingsCleanup50,0);return r};

function cmp50(a,b){const A=String(a||'0').replace(/^v/i,'').split('.').map(n=>Number(n)||0),B=String(b||'0').replace(/^v/i,'').split('.').map(n=>Number(n)||0);for(let i=0;i<Math.max(A.length,B.length);i++){const x=A[i]||0,y=B[i]||0;if(x!==y)return x>y?1:-1}return 0}
function updateTop50(){const v=document.getElementById('currentVersion50'),b=document.getElementById('headerRefresh50');if(v)v.textContent='v'+CUR50;if(!b)return;const newer=cmp50(latest50,CUR50)>0;b.textContent=refreshBusy50?'불러오는 중…':newer?`v${latest50} 업데이트 · 새로고침`:'↻ 새로고침';b.title=newer?`최신버전 v${latest50}이 있습니다. 눌러서 업데이트하세요.`:'현재 페이지를 다시 불러옵니다.'}
function ensureTop50(){installStyle50();const row=document.querySelector('.toprow');if(!row)return;let a=document.getElementById('topActions50');if(!a){a=document.createElement('div');a.id='topActions50';a.innerHTML='<span id="currentVersion50">v5.0</span><button id="headerRefresh50" class="btn ghost" type="button">↻ 새로고침</button><button id="logout50" type="button">로그아웃</button>';row.appendChild(a);a.querySelector('#headerRefresh50')?.addEventListener('click',()=>window.refreshApp50());a.querySelector('#logout50')?.addEventListener('click',()=>logout())}updateTop50()}
async function latestCheck50(){try{const r=await fetch('/latest-version.json?t='+Date.now(),{cache:'no-store'});if(r.ok){const x=await r.json();latest50=String(x.semanticVersion||x.label||CUR50).replace(/^v/i,'')||CUR50}}catch{}updateTop50();return latest50}
window.refreshApp50=async function(target=''){if(refreshBusy50)return;refreshBusy50=true;updateTop50();try{const v=String(target||await latestCheck50()||CUR50).replace(/^v/i,'');try{if(typeof saveRefreshState==='function')saveRefreshState()}catch{}location.replace('/?v='+encodeURIComponent(v)+'&refresh='+Date.now())}catch(e){refreshBusy50=false;updateTop50();if(typeof showError==='function')showError(e);else alert(e?.message||'새로고침에 실패했습니다.')}};
window.refreshApp49=window.refreshApp50;window.refreshApp48=window.refreshApp50;window.refreshApp47=window.refreshApp50;window.refreshApp46=window.refreshApp50;window.refreshApp45=window.refreshApp50;window.refreshApp44=window.refreshApp50;window.refreshApp43=window.refreshApp50;window.refreshApp42=window.refreshApp50;window.refreshApp41=window.refreshApp50;window.refreshApp40=window.refreshApp50;window.refreshApp39=window.refreshApp50;window.refreshApp37=window.refreshApp50;
const renderHeaderPrev50=renderHeader;renderHeader=function(){const r=renderHeaderPrev50();ensureTop50();return r};

setTimeout(()=>{ensureTop50();latestCheck50();if(T&&me&&currentView==='settings')settingsCleanup50()},0);
setInterval(()=>latestCheck50(),60000);
})();
