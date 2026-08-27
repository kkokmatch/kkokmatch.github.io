(()=>{
if(window.__kokmatchV54Fix12)return;
window.__kokmatchV54Fix12=true;
window.__kokmatchGroupSwitchPatch='12.1';
window.__kokmatchStatsUiPatch='12.1';

const STATS_URL12='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-stats-v54';
const MAX_RANGE_DAYS12=8;

function style12(){
 if(document.getElementById('v54fix12style'))return;
 const s=document.createElement('style');s.id='v54fix12style';s.textContent=`
#groupBtn.groupSwitching12{opacity:.65!important;pointer-events:none!important}
#stats .statsSectionTitle12{font-size:18px;font-weight:950;color:#20283a;margin:3px 1px 9px;line-height:1.25}
#stats .statsTabs11{grid-template-columns:repeat(2,minmax(0,1fr))!important}
#stats .statsTab11[data-tab11="games"],#stats .statsTab11[data-tab11="days"]{display:none!important}
#stats .statsPeriodGrid11 input[type="date"]{min-width:0!important;max-width:100%!important;box-sizing:border-box!important;font-variant-numeric:tabular-nums!important}
#stats .statsRangeNotice12{margin:-2px 2px 7px;color:#7c8598;font-size:10.5px;font-weight:700}
@media(max-width:420px){#stats .statsSectionTitle12{font-size:17px;margin-bottom:8px}}
`;document.head.appendChild(s)
}
style12();

function parseDate12(v){const m=String(v||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?Date.UTC(Number(m[1]),Number(m[2])-1,Number(m[3])):NaN}
function isoDate12(ms){if(!Number.isFinite(ms))return'';const d=new Date(ms);return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`}
function addDays12(v,n){const x=parseDate12(v);return Number.isFinite(x)?isoDate12(x+Number(n||0)*86400000):String(v||'')}
function spanDays12(f,t){const a=parseDate12(f),b=parseDate12(t);return Number.isFinite(a)&&Number.isFinite(b)?Math.floor((b-a)/86400000)+1:0}
function clampPair12(f,t,changed='from'){
 f=String(f||'');t=String(t||'');if(!f||!t)return{from:f,to:t};
 if(f>t){if(changed==='to')f=t;else t=f}
 if(spanDays12(f,t)>MAX_RANGE_DAYS12){if(changed==='to')f=addDays12(t,-(MAX_RANGE_DAYS12-1));else t=addDays12(f,MAX_RANGE_DAYS12-1)}
 return{from:f,to:t}
}
function setRangeBounds12(){
 const f=document.getElementById('statsFrom11'),t=document.getElementById('statsTo11');if(!f||!t)return;
 const c=clampPair12(f.value,t.value,'from');let changed=false;
 if(c.from&&f.value!==c.from){f.value=c.from;changed=true}
 if(c.to&&t.value!==c.to){t.value=c.to;changed=true}
 if(f.value&&t.value){f.max=t.value;t.min=f.value;f.min=addDays12(t.value,-(MAX_RANGE_DAYS12-1));t.max=addDays12(f.value,MAX_RANGE_DAYS12-1)}
 if(changed&&!f.dataset.rangeSync12){f.dataset.rangeSync12='1';queueMicrotask(()=>{try{t.dispatchEvent(new Event('change',{bubbles:true}))}finally{delete f.dataset.rangeSync12}})}
}
function clampChanged12(el){
 const f=document.getElementById('statsFrom11'),t=document.getElementById('statsTo11');if(!f||!t)return;
 const changed=el?.id==='statsTo11'?'to':'from',c=clampPair12(f.value,t.value,changed);
 if(c.from)f.value=c.from;if(c.to)t.value=c.to;
 if(f.value&&t.value){f.max=t.value;t.min=f.value;f.min=addDays12(t.value,-(MAX_RANGE_DAYS12-1));t.max=addDays12(f.value,MAX_RANGE_DAYS12-1)}
}
document.addEventListener('change',e=>{const el=e.target;if(el?.id==='statsFrom11'||el?.id==='statsTo11')clampChanged12(el)},true);

const fetchPrev12=window.fetch.bind(window);
window.fetch=function(input,init){
 try{
  const raw=typeof input==='string'?input:input?.url;
  if(raw){const u=new URL(raw,location.href);if(u.origin+u.pathname===STATS_URL12){const f=u.searchParams.get('from')||'',t=u.searchParams.get('to')||'',c=clampPair12(f,t,'from');if(c.from)u.searchParams.set('from',c.from);if(c.to)u.searchParams.set('to',c.to);return fetchPrev12(u.toString(),init)}}
 }catch(e){console.warn('stats range guard',e)}
 return fetchPrev12(input,init)
};

function decorateStats12(){
 style12();const box=document.getElementById('stats');if(!box)return;
 const shell=box.querySelector('.statsShell11');if(!shell)return;
 shell.querySelectorAll('.statsTab11[data-tab11="games"],.statsTab11[data-tab11="days"]').forEach(x=>x.remove());
 let title=shell.querySelector('.statsSectionTitle12');if(!title){title=document.createElement('div');title.className='statsSectionTitle12';title.textContent='경기기록';shell.insertBefore(title,shell.firstChild)}
 const period=shell.querySelector('.statsPeriodBox11');if(period&&!shell.querySelector('.statsRangeNotice12'))period.insertAdjacentHTML('afterend','<div class="statsRangeNotice12">조회기간은 시작일 포함 최대 8일까지 선택할 수 있습니다.</div>');
 const on=shell.querySelector('.statsTab11.on');if(on&&!['mine','personal'].includes(String(on.dataset.tab11||''))){queueMicrotask(()=>shell.querySelector('.statsTab11[data-tab11="mine"]')?.click())}
 setRangeBounds12()
}

const showErrorPrev12=typeof showError==='function'?showError:null;
let switching12=false,deferred12=[];
function msg12(e){return String(e?.message||e||'오류가 발생했습니다.')}
function showError12(e){
 if(switching12){deferred12.push(e);console.warn('group switch deferred error',msg12(e));return}
 if(showErrorPrev12)return showErrorPrev12(e);
 alert(msg12(e));
}
try{showError=showError12;window.showError=showError12}catch{}

function switchUi12(on){
 const b=document.getElementById('groupBtn');if(!b)return;
 b.classList.toggle('groupSwitching12',!!on);b.disabled=!!on;
 if(on){b.dataset.before12=b.textContent||'';b.textContent='모임 변경 중…'}
 else{try{if(typeof renderHeader==='function')renderHeader()}catch{};if(b.textContent==='모임 변경 중…'&&b.dataset.before12)b.textContent=b.dataset.before12;delete b.dataset.before12}
}
function switched12(id){return String(currentGroupId||'')===String(id||'')&&String(group?.groupId||'')===String(id||'')}
function preferredError12(){if(!deferred12.length)return null;const meaningful=deferred12.filter(e=>!/(프로필|회원명단|통계|응답이 지연|로그인이 만료)/i.test(msg12(e)));return (meaningful.length?meaningful:deferred12).at(-1)||null}
async function runSwitch12(fn,id,args=[]){
 const target=String(id||'');if(!target)return;
 if(switching12)return;
 if(target===String(currentGroupId||'')){try{closeModal()}catch{};return}
 const before=String(currentGroupId||''),returnView=String(currentView||'members');
 switching12=true;window.__kokmatchGroupSwitching12=true;deferred12=[];switchUi12(true);
 try{
  // 회원명부 전환 경로가 가장 안정적이므로 내부 전환 중에만 members 상태로 둔다.
  try{currentView='members'}catch{}
  const r=await fn(target,...args);
  await new Promise(res=>setTimeout(res,140));
  if(switched12(target)){
   deferred12=[];
   if(returnView!=='members'){try{goView(returnView)}catch{try{currentView=returnView;renderAll()}catch{}}}
   else{try{goView('members')}catch{}}
   if(returnView==='stats'){try{renderStats()}catch{}}
   try{window.scrollTo(0,0)}catch{}
   return r
  }
  try{currentView=returnView}catch{}
  const e=preferredError12();if(e){deferred12=[];if(showErrorPrev12)showErrorPrev12(e);else alert(msg12(e))}
  return r
 }catch(e){
  try{currentView=returnView}catch{}
  deferred12=[];if(showErrorPrev12)showErrorPrev12(e);else alert(msg12(e))
 }finally{
  switching12=false;window.__kokmatchGroupSwitching12=false;deferred12=[];switchUi12(false);decorateStats12()
 }
}

const ownPrev12=typeof window.switchOwnGroup38==='function'?window.switchOwnGroup38:null;
const adminPrev12=typeof window.adminSwitchGroup38==='function'?window.adminSwitchGroup38:null;
if(ownPrev12){window.switchOwnGroup38=function(id){return runSwitch12(target=>ownPrev12(target),id)};try{switchOwnGroup38=window.switchOwnGroup38}catch{}}
if(adminPrev12){window.adminSwitchGroup38=function(id,view){const keep=String(view||currentView||'members');return runSwitch12(target=>adminPrev12(target,'members'),id,[keep])};try{adminSwitchGroup38=window.adminSwitchGroup38}catch{}}
window.switchGroup=function(id,view){const keep=String(view||currentView||'members');return me?.globalAdmin===true?window.adminSwitchGroup38?.(id,keep):window.switchOwnGroup38?.(id)};
try{switchGroup=window.switchGroup}catch{}

const rsPrev12=typeof renderStats==='function'?renderStats:null;if(rsPrev12){renderStats=function(){const r=rsPrev12();decorateStats12();return r};window.renderStats=renderStats}
const raPrev12=typeof renderAll==='function'?renderAll:null;if(raPrev12){renderAll=function(){const r=raPrev12();decorateStats12();return r};window.renderAll=renderAll}
const gvPrev12=typeof goView==='function'?goView:null;if(gvPrev12){goView=function(id){const r=gvPrev12(id);if(id==='stats')queueMicrotask(decorateStats12);return r};window.goView=goView}
let raf12=0;const mo12=new MutationObserver(()=>{if(raf12)return;raf12=requestAnimationFrame(()=>{raf12=0;decorateStats12()})});
function boot12(){style12();const box=document.getElementById('stats');if(box)mo12.observe(box,{childList:true,subtree:true});decorateStats12()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot12,{once:true});else boot12();
})();