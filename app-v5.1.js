(()=>{
const CUR51='5.1';let latest51=CUR51,refreshBusy51=false;
function style51(){if(document.getElementById('v51style'))return;const s=document.createElement('style');s.id='v51style';s.textContent='#topActions50{display:none!important}#topActions51{margin-left:auto;display:flex;align-items:center;justify-content:flex-end;gap:4px;position:relative;z-index:150;pointer-events:auto;min-width:0}#currentVersion51{font-size:10px;font-weight:900;padding:6px 5px;border-radius:8px;background:rgba(255,255,255,.18);white-space:nowrap;flex:0 0 auto}#headerRefresh51{flex:0 1 auto;min-width:0;max-width:170px;min-height:30px;padding:6px 8px;font-size:10.5px;font-weight:800;line-height:1.15;white-space:normal;overflow-wrap:anywhere}#logout51{flex:0 0 64px;width:64px;min-width:64px;max-width:64px;min-height:30px;padding:6px 4px;font-size:11px;white-space:nowrap}@media(max-width:380px){#currentVersion51{display:none}#headerRefresh51{max-width:135px;font-size:9.5px}#logout51{flex-basis:56px;width:56px;min-width:56px;max-width:56px;font-size:10px}}';document.head.appendChild(s)}
function cmp51(a,b){const A=String(a||'0').replace(/^v/i,'').split('.').map(n=>Number(n)||0),B=String(b||'0').replace(/^v/i,'').split('.').map(n=>Number(n)||0);for(let i=0;i<Math.max(A.length,B.length);i++){const x=A[i]||0,y=B[i]||0;if(x!==y)return x>y?1:-1}return 0}
function update51(){const v=document.getElementById('currentVersion51'),b=document.getElementById('headerRefresh51');if(v)v.textContent='v'+CUR51;if(!b)return;const newer=cmp51(latest51,CUR51)>0;b.textContent=refreshBusy51?'불러오는 중…':newer?`v${latest51} 업데이트 · 새로고침`:'↻ 새로고침'}
function ensure51(){style51();const row=document.querySelector('.toprow');if(!row)return;let a=document.getElementById('topActions51');if(!a){a=document.createElement('div');a.id='topActions51';a.innerHTML='<span id="currentVersion51">v5.1</span><button id="headerRefresh51" class="btn ghost" type="button">↻ 새로고침</button><button id="logout51" type="button">로그아웃</button>';row.appendChild(a);a.querySelector('#headerRefresh51')?.addEventListener('click',()=>window.refreshApp51());a.querySelector('#logout51')?.addEventListener('click',()=>logout())}update51()}
async function latestCheck51(){try{const r=await fetch('/latest-version.json?t='+Date.now(),{cache:'no-store'});if(r.ok){const x=await r.json();latest51=String(x.semanticVersion||x.label||CUR51).replace(/^v/i,'')||CUR51}}catch{}update51();return latest51}
window.refreshApp51=async function(target=''){if(refreshBusy51)return;refreshBusy51=true;update51();try{const v=String(target||await latestCheck51()||CUR51).replace(/^v/i,'');try{if(typeof saveRefreshState==='function')saveRefreshState()}catch{}location.replace('/?v='+encodeURIComponent(v)+'&refresh='+Date.now())}catch(e){refreshBusy51=false;update51();if(typeof showError==='function')showError(e)}};
window.refreshApp50=window.refreshApp51;window.refreshApp49=window.refreshApp51;
const renderHeaderPrev51=renderHeader;renderHeader=function(){const r=renderHeaderPrev51();ensure51();return r};
const renderSettingsPrev51=renderSettings;renderSettings=function(){const r=renderSettingsPrev51();const box=typeof $==='function'?$('settings'):null;if(box&&me?.globalAdmin===true&&String(me?.displayName||'').trim()==='박태영'){const card=[...box.querySelectorAll('.card')].find(c=>String(c.textContent||'').includes('프로그램 버전'));if(card){const m=card.querySelector('.meta');if(m)m.textContent='콕매치 v5.1 · 실사용 QA 안정화 · 화면전환/투표 즉시표시 보정'}}return r};

/* v5.1 hotfix: keep an already-rendered full member roster visible while a transient thin state is passing through. */
const renderMembersPrev51=renderMembers;
renderMembers=function(){
 const box=typeof $==='function'?$('members'):document.getElementById('members');
 const stateCount=Array.isArray(S?.members)?S.members.length:0;
 const renderedCount=box?.querySelectorAll?.('.memberCard')?.length||0;
 if(box&&renderedCount>1&&stateCount<=1)return;
 return renderMembersPrev51();
};

/* v5.1 hotfix: apply the final poll title/schedule/creator layout synchronously instead of waiting for the old RAF/MutationObserver pass. */
function selectedPollDate51(){
 const b=document.querySelector('#stats .pollCalDay21.selected');
 const s=String(b?.getAttribute('onclick')||'');
 return (s.match(/selectPollDate22\('([0-9]{4}-[0-9]{2}-[0-9]{2})'\)/)||[])[1]||(typeof todayKst==='function'?todayKst():'');
}
function pollDateLabel51(date){const a=String(date||'').split('-').map(Number);return a.length===3&&a[0]?`${a[0]}년 ${a[1]}월 ${a[2]}일`:String(date||'')}
function pollMainTitle51(p){const loc=String(p?.location||'').trim();if(loc)return /운동$/.test(loc)?loc:`${loc} 운동`;let t=String(p?.title||'운동 참석 투표').trim();t=t.replace(/^\d{1,2}월\s*\d{1,2}일\s*\d{1,2}:\d{2}\s*/,'');return t||'운동 참석 투표'}
function decoratePollNow51(){
 const box=typeof $==='function'?$('stats'):document.getElementById('stats');if(!box)return;
 const date=selectedPollDate51();
 const ps=(Array.isArray(S?.attendancePolls)?S.attendancePolls:[]).filter(p=>String(p?.date||'')===date).slice().sort((a,b)=>String(a.time||'').localeCompare(String(b.time||'')));
 const cards=[...box.querySelectorAll('.pollWrap90 .pollCard21')];
 cards.forEach((card,i)=>{
  const p=ps[i];if(!p)return;
  const title=card.querySelector('.pollTitle21');if(!title)return;
  const ended=title.querySelector('.pollEndedBadge22')?.outerHTML||'';
  const time=p.time&&p.endTime?`${esc(p.time)} ~ ${esc(p.endTime)}`:esc(p.time||'');
  const when=[pollDateLabel51(p.date),time].filter(Boolean).join(' · ');
  const creator=String(p.createdBy||'').trim()||'정보 없음';
  const sig=[p.id,p.title,p.date,p.time,p.endTime,p.location,p.createdBy,ended].join('|');
  if(title.dataset.v51sig===sig&&title.querySelector('.pollMainTitle33'))return;
  title.dataset.v51sig=sig;
  title.innerHTML=`<div class="pollMainTitle33">${esc(pollMainTitle51(p))} ${ended}</div><div class="pollSchedule33">${when}</div><div class="pollCreator33">투표 생성자 · ${esc(creator)}</div>`;
 });
}
const renderStatsPrev51=renderStats;
renderStats=function(){const r=renderStatsPrev51();decoratePollNow51();return r};
for(const n of ['selectPollDate22','movePollMonth22']){
 const f=window[n];if(typeof f==='function')window[n]=function(...a){const r=f.apply(this,a);decoratePollNow51();return r};
}
document.addEventListener('click',e=>{if(e.target?.closest?.('#stats .pollCalDay21'))queueMicrotask(decoratePollNow51)},false);

setTimeout(()=>{ensure51();latestCheck51();if(me&&currentView==='stats')decoratePollNow51()},0);setInterval(()=>latestCheck51(),60000);
})();
