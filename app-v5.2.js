(()=>{
const CUR52='5.2';
const AUTH52='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-auth-v38';
const STATE52='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-state-v46';
let switchBusy52=false,latest52=CUR52,refreshBusy52=false;

function style52(){if(document.getElementById('v52style'))return;const s=document.createElement('style');s.id='v52style';s.textContent='#topActions51{display:none!important}#topActions52{margin-left:auto;display:flex;align-items:center;justify-content:flex-end;gap:4px;position:relative;z-index:160;pointer-events:auto;min-width:0}#currentVersion52{font-size:10px;font-weight:900;padding:6px 5px;border-radius:8px;background:rgba(255,255,255,.18);white-space:nowrap;flex:0 0 auto}#headerRefresh52{flex:0 1 auto;min-width:0;max-width:170px;min-height:30px;padding:6px 8px;font-size:10.5px;font-weight:800;line-height:1.15;white-space:normal;overflow-wrap:anywhere}#logout52{flex:0 0 64px;width:64px;min-width:64px;max-width:64px;min-height:30px;padding:6px 4px;font-size:11px;white-space:nowrap}.groupBtn.switching52{opacity:.72;pointer-events:none}@media(max-width:380px){#currentVersion52{display:none}#headerRefresh52{max-width:135px;font-size:9.5px}#logout52{flex-basis:56px;width:56px;min-width:56px;max-width:56px;font-size:10px}}';document.head.appendChild(s)}
function cmp52(a,b){const A=String(a||'0').replace(/^v/i,'').split('.').map(n=>Number(n)||0),B=String(b||'0').replace(/^v/i,'').split('.').map(n=>Number(n)||0);for(let i=0;i<Math.max(A.length,B.length);i++){const x=A[i]||0,y=B[i]||0;if(x!==y)return x>y?1:-1}return 0}
function topText52(){const v=document.getElementById('currentVersion52'),b=document.getElementById('headerRefresh52');if(v)v.textContent='v'+CUR52;if(!b)return;const newer=cmp52(latest52,CUR52)>0;b.textContent=refreshBusy52?'불러오는 중…':newer?`v${latest52} 업데이트 · 새로고침`:'↻ 새로고침'}
function ensureTop52(){style52();document.title='콕매치 v5.2';document.documentElement.dataset.kokmatchVersion='5.2';const row=document.querySelector('.toprow');if(!row)return;let a=document.getElementById('topActions52');if(!a){a=document.createElement('div');a.id='topActions52';a.innerHTML='<span id="currentVersion52">v5.2</span><button id="headerRefresh52" class="btn ghost" type="button">↻ 새로고침</button><button id="logout52" type="button">로그아웃</button>';row.appendChild(a);a.querySelector('#headerRefresh52')?.addEventListener('click',()=>window.refreshApp52());a.querySelector('#logout52')?.addEventListener('click',()=>logout())}topText52()}
async function latestCheck52(){try{const r=await fetch('/latest-version.json?t='+Date.now(),{cache:'no-store'});if(r.ok){const x=await r.json();latest52=String(x.semanticVersion||x.label||CUR52).replace(/^v/i,'')||CUR52}}catch{}topText52();return latest52}
window.refreshApp52=async function(target=''){if(refreshBusy52)return;refreshBusy52=true;topText52();try{const v=String(target||await latestCheck52()||CUR52).replace(/^v/i,'');try{if(typeof saveRefreshState==='function')saveRefreshState()}catch{}location.replace('/?v='+encodeURIComponent(v)+'&refresh='+Date.now())}catch(e){refreshBusy52=false;topText52();if(typeof showError==='function')showError(e)}};
window.refreshApp51=window.refreshApp52;

async function json52(url,opt){const r=await fetch(url,opt);const x=await r.json().catch(()=>({}));if(!r.ok){const e=new Error(x.error||'모임 전환 중 오류가 발생했습니다.');e.status=r.status;throw e}return x}
async function switchToken52(id){return json52(AUTH52,{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+T},body:JSON.stringify({action:'switch_group',groupId:id}),cache:'no-store'})}
async function compact52(id,token){const u=new URL(STATE52);u.searchParams.set('groupId',id);u.searchParams.set('t',Date.now());return json52(u,{headers:{authorization:'Bearer '+token},cache:'no-store'})}
function setSwitching52(on,name=''){const b=typeof $==='function'?$('groupBtn'):document.getElementById('groupBtn');if(!b)return;b.classList.toggle('switching52',!!on);if(on)b.textContent=(name||'모임')+' · 전환 중…'}
function identity52(x,id){const wasGlobal=!!me?.globalAdmin;currentGroupId=String(x.groupId||id);localStorage.setItem(GROUP_KEY,currentGroupId);group={groupId:currentGroupId,name:String(x.groupName||group?.name||'모임')};me={...(me||{}),role:String(x.role||me?.role||'member'),roleLabel:String(x.roleLabel||me?.roleLabel||''),memberId:x.memberId??me?.memberId,groupId:currentGroupId,groupName:group.name,globalAdmin:wasGlobal||String(x.role)==='admin'};try{renderHeader();renderNav()}catch{}}
function applyCompact52(x,id){if(String(currentGroupId)!==String(id)||!x?.data)return;const full=Array.isArray(S?.members)?S.members:[];S={...x.data,members:full.length?full:(Array.isArray(x.data.members)?x.data.members:[])};me=x.user||me;group=x.group||group;groups=x.groups||groups;currentGroupId=String(group?.groupId||id);localStorage.setItem(GROUP_KEY,currentGroupId);normalizeClient();renderAll()}
async function memberSwitch52(id,x,token){
 const stateP=compact52(id,token);
 let rosterOk=false;
 try{
  if(typeof window.enterMembers42==='function'){await window.enterMembers42(true);rosterOk=true}
  else{const r=await stateP;S=r.data;me=r.user;group=r.group;groups=r.groups||groups;currentGroupId=group.groupId;normalizeClient();renderAll();rosterOk=true;return}
 }finally{setSwitching52(false)}
 stateP.then(r=>{if(String(currentGroupId)===String(id))applyCompact52(r,id)}).catch(e=>{console.warn('background group state v5.2',e);if(!rosterOk&&typeof showError==='function')showError(e)});
}
async function fastSwitch52(id,view=''){
 id=String(id||'');if(!id||id===String(currentGroupId||'')){closeModal();return}if(switchBusy52)return;switchBusy52=true;
 const oldGroup=String(currentGroupId||''),oldToken=T;setSwitching52(true,'모임');
 try{
  const x=await switchToken52(id);if(x.token){T=x.token;localStorage.setItem(TOKEN_KEY,T)}identity52(x,id);closeModal();
  const targetView=String(view||currentView||'members');
  if(targetView==='members'||currentView==='members'){await memberSwitch52(id,x,T);window.scrollTo(0,0)}
  else{await loadState(true);setSwitching52(false);if(view)goView(targetView);window.scrollTo(0,0)}
 }catch(e){setSwitching52(false);if(String(currentGroupId||'')!==oldGroup&&T===oldToken){currentGroupId=oldGroup;localStorage.setItem(GROUP_KEY,oldGroup)}if(typeof showError==='function')showError(e);else alert(e?.message||'모임 전환에 실패했습니다.')}
 finally{switchBusy52=false}
}
window.switchOwnGroup38=function(id){return fastSwitch52(id)};
window.adminSwitchGroup38=function(id,view='members'){return fastSwitch52(id,view)};
try{switchGroup=function(id,view='members'){return fastSwitch52(id,view)}}catch{window.switchGroup=function(id,view='members'){return fastSwitch52(id,view)}}

const renderHeaderPrev52=renderHeader;renderHeader=function(){const r=renderHeaderPrev52();ensureTop52();return r};
const renderSettingsPrev52=renderSettings;renderSettings=function(){const r=renderSettingsPrev52();const box=typeof $==='function'?$('settings'):null;if(box&&me?.globalAdmin===true&&String(me?.displayName||'').trim()==='박태영'){const card=[...box.querySelectorAll('.card')].find(c=>String(c.textContent||'').includes('프로그램 버전'));if(card){const m=card.querySelector('.meta');if(m)m.textContent='콕매치 v5.2 · 다중모임 전환 고속화 · 역할 공통 전환 안정화'}}return r};
setTimeout(()=>{ensureTop52();latestCheck52()},0);setInterval(()=>latestCheck52(),60000);
})();
(()=>{if(window.__kokmatchV53Loader)return;window.__kokmatchV53Loader=true;const s=document.createElement('script');s.src='/app-v5.3.js?v=5.3&hotfix=1';s.async=false;s.onerror=()=>console.error('콕매치 v5.3 로드 실패');document.body.appendChild(s)})();