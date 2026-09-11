from pathlib import Path
import json

OLD='6.77'; NEW='6.78'
js_path=Path(f'app-v{OLD}.js')
css_path=Path(f'app-v{OLD}.css')
js=js_path.read_text(encoding='utf-8').replace(OLD,NEW)

patch=r'''

/* v6.78: persistent live-operations shell, permanent queue game badge, inline monthly rank circles, mobile roster spacing. */
(()=>{
'use strict';
if(window.__kokmatchUiStability678)return;window.__kokmatchUiStability678='6.78';

/* 1) Keep live operations outside #stats so legacy stats renders cannot remove it. */
let opsSyncing678=false,opsObserver678=null,statsObserver678=null;
function trimOps678(dash){
 if(!dash)return;
 dash.classList.add('opsPersistent678');
 dash.querySelectorAll('.opsPanels652,.opsCourtPanel652').forEach(el=>el.remove());
}
function ensureOps678(){
 if(opsSyncing678)return;opsSyncing678=true;
 try{
  const stats=document.getElementById('stats');if(!stats)return;
  let host=document.getElementById('opsPersistentHost678');
  if(!host){host=document.createElement('div');host.id='opsPersistentHost678';host.className='opsPersistentHost678';stats.parentElement?.insertBefore(host,stats)}
  let dash=document.getElementById('opsDashboard652');
  if(!dash&&currentView==='stats'){
   try{window.__kokmatchRenderOpsDashboard652?.()}catch{}
   dash=document.getElementById('opsDashboard652');
  }
  if(dash){
   if(dash.parentElement!==host)host.appendChild(dash);
   trimOps678(dash);
   if(!opsObserver678){opsObserver678=new MutationObserver(()=>queueMicrotask(()=>trimOps678(document.getElementById('opsDashboard652'))));opsObserver678.observe(dash,{childList:true,subtree:true})}
  }
  host.hidden=currentView!=='stats';
 }finally{opsSyncing678=false}
}
const goViewBefore678=goView;
goView=function(id,...args){const r=goViewBefore678.call(this,id,...args);ensureOps678();setTimeout(ensureOps678,0);return r};window.goView=goView;
const renderStatsBefore678=renderStats;
renderStats=function(...args){const r=renderStatsBefore678.apply(this,args);ensureOps678();return r};window.renderStats=renderStats;
function armStatsObserver678(){const stats=document.getElementById('stats');if(!stats||statsObserver678)return;statsObserver678=new MutationObserver(()=>queueMicrotask(()=>{ensureOps678();polishMonthly678()}));statsObserver678.observe(stats,{childList:true,subtree:true})}

/* 2) Queue game count is rendered as a CSS pill from a stable data attribute. Legacy grey text cannot replace it. */
let queueSyncing678=false,queueObserver678=null;
function queueMemberIds678(){try{return typeof sortedQueue==='function'?sortedQueue().map(String):(Array.isArray(S?.queue)?S.queue.map(String):[])}catch{return Array.isArray(S?.queue)?S.queue.map(String):[]}}
function canonicalQueue678(){
 if(queueSyncing678)return;queueSyncing678=true;
 try{
  const box=document.getElementById('queue');if(!box)return;
  const ids=queueMemberIds678();
  const cards=[...box.querySelectorAll('.queueCard54,.queueCard53,.queueCard')];
  cards.forEach((card,i)=>{
   const id=String(ids[i]||''),m=id&&typeof M==='function'?M(id):null;if(!m)return;
   const meta=card.querySelector('.queueInfo53 .compactMeta53')||card.querySelector('.queueInfo53 .meta')||[...card.querySelectorAll('.meta')].find(x=>/대기/.test(String(x.textContent||'')));
   if(!meta)return;
   meta.classList.add('queueWaitMeta658','queueWaitMeta677','queueWaitMeta678');
   const waitText=`현재 ${Math.max(0,typeof waitMins==='function'?Number(waitMins(m))||0:0)}분 대기중`;
   const count=Math.max(0,typeof dailyCount==='function'?Number(dailyCount(id))||0:0);
   meta.dataset.gameCount678=`게임 ${count}회`;
   let wait=meta.querySelector(':scope > .waitCurrent678');
   const canonical=wait&&meta.children.length===1&&meta.firstElementChild===wait&&String(wait.textContent||'')===waitText;
   if(!canonical){
    if(!wait){wait=document.createElement('span');wait.className='waitCurrent70 waitCurrent677 waitCurrent678'}
    wait.textContent=waitText;meta.replaceChildren(wait);
   }
   card.querySelectorAll('.gamecnt').forEach(el=>el.remove());
  });
 }catch{}finally{queueSyncing678=false}
}
const renderQueueBefore678=renderQueue;
renderQueue=function(...args){const r=renderQueueBefore678.apply(this,args);canonicalQueue678();return r};window.renderQueue=renderQueue;
function armQueueObserver678(){const box=document.getElementById('queue');if(!box||queueObserver678)return;queueObserver678=new MutationObserver(()=>{if(!queueSyncing678)queueMicrotask(canonicalQueue678)});queueObserver678.observe(box,{childList:true,subtree:true,characterData:true})}
window.__kokmatchCanonicalQueue678=canonicalQueue678;
setInterval(()=>{if(me&&currentView==='queue')canonicalQueue678()},15000);

/* 3) Monthly ranking: hide the legacy number column and pin numbered circles inside the left side of the name cell. */
let statsPolishing678=false;
function polishMonthly678(){
 if(statsPolishing678)return;statsPolishing678=true;
 try{
  const table=document.querySelector('#stats .statsMonthlyTable628');if(!table)return;
  let rank=0;
  [...table.querySelectorAll('tbody tr')].forEach(tr=>{
   if(tr.querySelector('.statsEmpty628'))return;
   const first=tr.children[0];if(!first)return;rank+=1;
   first.classList.add('statsName678');
   let badge=first.querySelector(':scope > .statsRank678');
   if(!badge){badge=document.createElement('span');badge.className='statsRank678';first.prepend(badge)}
   badge.textContent=String(rank);
  });
 }finally{statsPolishing678=false}
}
window.__kokmatchPolishStats678=polishMonthly678;

function boot678(){armStatsObserver678();armQueueObserver678();ensureOps678();polishMonthly678();canonicalQueue678();setTimeout(()=>{ensureOps678();polishMonthly678();canonicalQueue678()},80)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot678,{once:true});else boot678();
})();
'''
Path(f'app-v{NEW}.js').write_text(js+patch,encoding='utf-8')

css=css_path.read_text(encoding='utf-8').replace(OLD,NEW)
css+=r'''

/* v6.78: persistent live operations shell. */
.opsPersistentHost678{padding:14px 14px 0;max-width:760px;margin:0 auto}
.opsPersistentHost678[hidden]{display:none!important}
.opsPersistentHost678 .opsPanels652,.opsPersistentHost678 .opsCourtPanel652{display:none!important}
.opsPersistentHost678 .opsDashboard652{display:block!important;visibility:visible!important;opacity:1!important;margin-bottom:4px!important}

/* v6.78: queue shows only current wait text + one permanent green game-count pill. */
#queue .queueCard .queueWaitMeta678{display:flex!important;align-items:center!important;gap:5px!important;flex-wrap:wrap!important;min-width:0!important;font-size:0!important}
#queue .queueCard .queueWaitMeta678 .waitCurrent70,#queue .queueCard .queueWaitMeta678 .waitCurrent677,#queue .queueCard .queueWaitMeta678 .waitCurrent678{font-size:12px!important;color:var(--mut)!important;line-height:1.45!important}
#queue .queueCard .queueWaitMeta678::after{content:attr(data-game-count678);display:inline-flex!important;align-items:center!important;background:#eef8f2!important;color:var(--green)!important;border-radius:999px!important;padding:3px 7px!important;font-size:11px!important;font-weight:900!important;line-height:1.2!important;margin-left:3px!important;white-space:nowrap!important;flex:0 0 auto!important}
#queue .queueCard .queueWaitMeta678 .waitSep70,#queue .queueCard .queueWaitMeta678 .waitTotal70,#queue .queueCard .gamecnt{display:none!important}

/* v6.78: no visible standalone number column; circle sequence sits in the empty left area of the name cell. */
.statsMonthlyTable628 col.cNo675,.statsMonthlyTable628 th.statsNoHead675,.statsMonthlyTable628 td.statsNo675{display:none!important;width:0!important;min-width:0!important;padding:0!important;border:0!important}
.statsMonthlyTable628 .cName628{width:30%!important}.statsMonthlyTable628 .cYear628{width:14%!important}.statsMonthlyTable628 .cAge628{width:17%!important}.statsMonthlyTable628 .cRole628{width:15%!important}.statsMonthlyTable628 .cAttend628{width:12%!important}.statsMonthlyTable628 .cGames628{width:12%!important}
.statsMonthlyTable628 th:first-child,.statsMonthlyTable628 td.statsName678{text-align:center!important}
.statsMonthlyTable628 td.statsName678{position:relative!important;padding-left:27px!important;padding-right:4px!important}
.statsMonthlyTable628 .statsRank678{position:absolute;left:5px;top:50%;transform:translateY(-50%);width:19px;height:19px;border-radius:50%;display:inline-grid;place-items:center;background:#f0f3f8;border:1px solid #d6dde8;color:#5e6b7e;font-size:10px;font-weight:900;line-height:1;pointer-events:none}

/* v6.78: phone-only breathing room between profile frame and identity text; tablet spacing stays unchanged. */
@media(max-width:599px){
 #members .memberCard,#members .memberCard57,#members .memberCard71,#members .memberCard73{column-gap:18px!important}
 #members .memberCard .memberInfo48,#members .memberCard57 .memberInfo48,#members .memberCard71 .memberInfo48,#members .memberCard73 .memberInfo48{padding-left:3px!important}
}
'''
Path(f'app-v{NEW}.css').write_text(css,encoding='utf-8')

for name in ['index.html','manifest.webmanifest','kokmatch-sw.js','sw.js']:
 p=Path(name)
 if p.exists():
  s=p.read_text(encoding='utf-8')
  s=s.replace(f'app-v{OLD}.js?v={OLD}',f'app-v{NEW}.js?v={NEW}').replace(f'app-v{OLD}.css?v={OLD}',f'app-v{NEW}.css?v={NEW}')
  s=s.replace(OLD,NEW)
  p.write_text(s,encoding='utf-8')

latest={
 'version':118,'label':'v6.78','semanticVersion':'6.78','build':'v6.78','updatedAt':'2026-09-11T16:38:00+09:00',
 'note':'v6.78 실시간 운영현황 고정 · 우선확인/코트 하단패널 제거 · 게임횟수 녹색배지 상시유지 · 월간순번 원형표시 · 모바일 회원명부 간격개선'
}
Path('latest-version.json').write_text(json.dumps(latest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('built v6.78')
