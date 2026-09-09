from pathlib import Path
from datetime import datetime
from zoneinfo import ZoneInfo
import json, shutil

ROOT=Path('.')
OLD='6.51'; NEW='6.52'
old_js=ROOT/f'app-v{OLD}.js'; old_css=ROOT/f'app-v{OLD}.css'
new_js=ROOT/f'app-v{NEW}.js'; new_css=ROOT/f'app-v{NEW}.css'
assert old_js.exists() and old_css.exists()

arc=ROOT/'versions'/f'v{OLD}'
arc.mkdir(parents=True, exist_ok=True)
for p in [old_js,old_css,ROOT/'index.html',ROOT/'kokmatch-sw.js',ROOT/'sw.js',ROOT/'latest-version.json']:
    if p.exists(): shutil.copy2(p,arc/p.name)

js=old_js.read_text(encoding='utf-8').replace(OLD,NEW)
js += r'''

/* KokMatch v6.52: live operations dashboard inside 운동통계. */
(()=>{
'use strict';
if(window.__kokmatchOpsDashboard652)return;
window.__kokmatchOpsDashboard652=true;
let dashTick652=0;

function member652(id){try{return typeof M==='function'?M(String(id)):null}catch{return null}}
function state652(m){return String(m?.state||'out')}
function active652(m){return state652(m)!=='out'}
function exercise652(m){return ['waiting','matched','playing'].includes(state652(m))}
function waiting652(m){return ['waiting','matched'].includes(state652(m))}
function mins652(m){try{return typeof waitMins==='function'?Math.max(0,Number(waitMins(m))||0):0}catch{return 0}}
function games652(id){try{return typeof dailyCount==='function'?Math.max(0,Number(dailyCount(id))||0):0}catch{return 0}}
function esc652(v){try{return typeof esc==='function'?esc(v):String(v??'')}catch{return String(v??'')}}
function court652(n){try{return typeof courtLabel==='function'?courtLabel(n):`${n}코트`}catch{return `${n}코트`}}
function elapsed652(ts){return Math.max(0,Math.floor((Date.now()-(Number(ts)||Date.now()))/60000))}
function unique652(ids){return [...new Set((ids||[]).filter(Boolean).map(String))]}
function waitIds652(){
 const ids=[...(Array.isArray(S?.queue)?S.queue:[])];
 for(const g of (Array.isArray(S?.pendingGames)?S.pendingGames:[]))for(const id of (Array.isArray(g?.players)?g.players:[]))ids.push(id);
 return unique652(ids);
}
function snapshot652(){
 const members=Array.isArray(S?.members)?S.members:[];
 const entered=members.filter(active652),exercise=members.filter(exercise652),spectators=members.filter(m=>state652(m)==='spectator');
 const queue=Array.isArray(S?.queue)?S.queue:[],pending=Array.isArray(S?.pendingGames)?S.pendingGames:[],running=Array.isArray(S?.games)?S.games:[];
 const pendingPeople=pending.reduce((n,g)=>n+(Array.isArray(g?.players)?g.players.length:0),0);
 const waiters=waitIds652().map(member652).filter(Boolean),waits=waiters.map(mins652);
 const avg=waits.length?Math.round(waits.reduce((a,b)=>a+b,0)/waits.length):0,max=waits.length?Math.max(...waits):0;
 const long=waiters.filter(m=>mins652(m)>=30).sort((a,b)=>mins652(b)-mins652(a));
 const zero=members.filter(m=>waiting652(m)&&games652(m.id)===0).sort((a,b)=>mins652(b)-mins652(a));
 const playingIds=unique652(running.flatMap(g=>Array.isArray(g?.players)?g.players:[]));
 const used=new Set(running.map(g=>Number(g?.court)).filter(Boolean));
 const courts=Math.max(1,Number(S?.courtCount)||1),util=Math.round((used.size/courts)*100);
 return {members,entered,exercise,spectators,queue,pending,pendingPeople,running,playingIds,waiters,avg,max,long,zero,used,courts,util};
}
function status652(s){
 if(s.long.length||s.zero.length)return {label:'확인 필요',cls:'attention'};
 if(s.exercise.length&&s.used.size===0)return {label:'편성 준비',cls:'ready'};
 return {label:'원활',cls:'good'};
}
function personRows652(list,mode){
 const rows=list.slice(0,6).map(m=>`<div class="opsPerson652"><div><b>${esc652(m.name||'회원')}</b><span>${esc652(m.age||'')}${esc652(m.cls||'')} · ${state652(m)==='matched'?'편성대기':'개인대기'}</span></div><strong>${mode==='zero'?`${games652(m.id)}게임 · `:''}${mins652(m)}분</strong></div>`).join('');
 return rows||'<div class="opsEmpty652">해당 인원이 없습니다.</div>';
}
function courtRows652(s){
 if(!s.running.length)return '<div class="opsEmpty652">현재 진행 중인 경기가 없습니다.</div>';
 return s.running.slice().sort((a,b)=>Number(a.court)-Number(b.court)).map(g=>{
  const names=(g.players||[]).map(id=>member652(id)?.name||'-').join(' · ');
  return `<div class="opsCourt652"><div><b>${esc652(court652(g.court))}</b><span>${esc652(names)}</span></div><strong>${elapsed652(g.startedAt)}분</strong></div>`;
 }).join('');
}
function metric652(label,value,sub,cls=''){
 return `<div class="opsMetric652 ${cls}"><span>${label}</span><b>${value}</b><small>${sub}</small></div>`;
}
function dashboardHtml652(){
 const s=snapshot652(),st=status652(s),now=new Date().toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'});
 const activeWait=s.queue.length+s.pendingPeople;
 return `<section id="opsDashboard652" class="opsDashboard652">
  <div class="opsHead652"><div><div class="opsEyebrow652">LIVE OPERATIONS</div><h2>실시간 운영현황</h2><p>${esc652(group?.name||'현재 모임')} · 상태 자동동기화 약 10초</p></div><div class="opsState652 ${st.cls}"><i></i>${st.label}<small>${now} 기준</small></div></div>
  <div class="opsMetrics652">
   ${metric652('현재 입장',`${s.entered.length}명`,`운동 ${s.exercise.length} · 관람 ${s.spectators.length}`)}
   ${metric652('게임 대기',`${activeWait}명`,`개인 ${s.queue.length} · 편성 ${s.pendingPeople}`)}
   ${metric652('진행 경기',`${s.running.length}게임`,`게임중 ${s.playingIds.length}명`)}
   ${metric652('코트 사용',`${s.used.size}/${s.courts}`,`가동률 ${s.util}%`)}
   ${metric652('평균 대기',`${s.avg}분`,`현재 대기 ${s.waiters.length}명`)}
   ${metric652('최장 대기',`${s.max}분`,s.long.length?`30분↑ ${s.long.length}명`:'장기대기 없음',s.long.length?'warn':'')}
   ${metric652('편성대기',`${s.pending.length}조`,`총 ${s.pendingPeople}명`)}
   ${metric652('완료 0게임',`${s.zero.length}명`,s.zero.length?'우선 편성 확인':'대기자 기준',s.zero.length?'warn':'')}
  </div>
  <div class="opsPanels652">
   <div class="opsPanel652"><div class="opsPanelHead652"><div><b>우선 확인 · 장기대기</b><span>30분 이상 개인/편성 대기</span></div><button type="button" onclick="goView('queue')">게임대기 보기</button></div>${personRows652(s.long,'long')}</div>
   <div class="opsPanel652"><div class="opsPanelHead652"><div><b>우선 확인 · 오늘 0게임</b><span>현재 대기 중이며 완료경기 0회</span></div><button type="button" onclick="goView('queue')">편성하기</button></div>${personRows652(s.zero,'zero')}</div>
  </div>
  <div class="opsPanel652 opsCourtPanel652"><div class="opsPanelHead652"><div><b>코트 운영</b><span>진행 경기와 경과시간</span></div><span class="opsCourtSummary652">빈 코트 ${Math.max(0,s.courts-s.used.size)}개</span></div>${courtRows652(s)}</div>
 </section>`;
}
function renderOpsDashboard652(){
 if(currentView!=='stats')return;
 const box=document.getElementById('stats');if(!box)return;
 const old=document.getElementById('opsDashboard652'),holder=document.createElement('div');holder.innerHTML=dashboardHtml652();const next=holder.firstElementChild;if(!next)return;
 if(old)old.replaceWith(next);else box.prepend(next);
}
window.__kokmatchRenderOpsDashboard652=renderOpsDashboard652;
const baseStats652=renderStats;
renderStats=function(...args){const r=baseStats652.apply(this,args);renderOpsDashboard652();return r};
window.renderStats=renderStats;

clearInterval(dashTick652);
dashTick652=setInterval(()=>{if(!document.hidden&&currentView==='stats')renderOpsDashboard652()},30000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&currentView==='stats')setTimeout(renderOpsDashboard652,80)},{passive:true});
if(me&&currentView==='stats')renderOpsDashboard652();
})();
'''
new_js.write_text(js,encoding='utf-8')

css=old_css.read_text(encoding='utf-8').replace(OLD,NEW)
css += r'''

/* KokMatch v6.52 live operations dashboard */
.opsDashboard652{margin-bottom:18px}.opsHead652{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px;padding:2px 2px 0}.opsHead652 h2{margin:2px 0 3px;font-size:21px;letter-spacing:-.4px}.opsHead652 p{margin:0;color:#6b7280;font-size:12px}.opsEyebrow652{font-size:10px;font-weight:900;letter-spacing:1.1px;color:#2670e8}.opsState652{min-width:84px;border:1px solid #dbe4f2;border-radius:12px;background:#fff;padding:8px 9px;font-size:12px;font-weight:900;text-align:center}.opsState652 i{display:inline-block;width:7px;height:7px;border-radius:50%;background:#20a464;margin-right:5px}.opsState652 small{display:block;margin-top:3px;color:#7c8798;font-size:9px;font-weight:700}.opsState652.attention{border-color:#f1c7c2;background:#fff8f7}.opsState652.attention i{background:#db4b3f}.opsState652.ready i{background:#e7a42a}.opsMetrics652{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.opsMetric652{min-height:86px;border:1px solid #e1e7f0;border-radius:14px;background:#fff;padding:11px 12px;display:flex;flex-direction:column;justify-content:center;box-shadow:0 2px 8px rgba(25,44,78,.04)}.opsMetric652 span{font-size:11px;color:#687386;font-weight:800}.opsMetric652 b{font-size:23px;line-height:1.15;margin:3px 0 2px;letter-spacing:-.5px}.opsMetric652 small{font-size:10px;color:#7b8493}.opsMetric652.warn{border-color:#f0c9c3;background:#fffafa}.opsMetric652.warn b{color:#bd4238}.opsPanels652{display:grid;grid-template-columns:1fr;gap:9px;margin-top:10px}.opsPanel652{border:1px solid #e1e7f0;border-radius:14px;background:#fff;padding:12px}.opsPanelHead652{display:flex;align-items:center;justify-content:space-between;gap:9px;margin-bottom:8px}.opsPanelHead652>div{min-width:0}.opsPanelHead652 b{display:block;font-size:13px}.opsPanelHead652 span{display:block;font-size:10px;color:#7b8493;margin-top:2px}.opsPanelHead652 button{border:1px solid #d6dfec;border-radius:9px;background:#f8fbff;padding:7px 8px;font-size:10px;font-weight:900;color:#2c64bf;white-space:nowrap}.opsPerson652,.opsCourt652{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 2px;border-top:1px solid #edf1f6}.opsPerson652:first-of-type,.opsCourt652:first-of-type{border-top:0}.opsPerson652>div,.opsCourt652>div{min-width:0}.opsPerson652 b,.opsCourt652 b{display:block;font-size:12px}.opsPerson652 span,.opsCourt652 span{display:block;margin-top:2px;font-size:10px;color:#7b8493;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.opsPerson652 strong,.opsCourt652 strong{font-size:11px;white-space:nowrap}.opsEmpty652{padding:13px 2px 4px;color:#8791a0;font-size:11px}.opsCourtPanel652{margin-top:9px}.opsCourtSummary652{font-weight:900!important;color:#445168!important;margin:0!important;white-space:nowrap}.opsCourt652 span{max-width:235px}
@media(min-width:720px){.opsMetrics652{grid-template-columns:repeat(4,minmax(0,1fr))}.opsPanels652{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:380px){.opsHead652{align-items:stretch}.opsHead652 h2{font-size:19px}.opsState652{min-width:76px}.opsMetric652{padding:10px}.opsMetric652 b{font-size:21px}.opsPanelHead652{align-items:flex-start}.opsCourt652 span{max-width:190px}}
'''
new_css.write_text(css,encoding='utf-8')

idx=(ROOT/'index.html').read_text(encoding='utf-8').replace(OLD,NEW)
idx=idx.replace("dataset.kokmatchEntry='single-v651'","dataset.kokmatchEntry='single-v652'")
idx=idx.replace("__kokmatchEntryResumeMode='session-coordinator-v651'","__kokmatchEntryResumeMode='session-coordinator-v652'")
(ROOT/'index.html').write_text(idx,encoding='utf-8')

for p in ['manifest.webmanifest','kokmatch-sw.js','sw.js']:
    q=ROOT/p
    if q.exists(): q.write_text(q.read_text(encoding='utf-8').replace(OLD,NEW),encoding='utf-8')

latest={
 'version':92,'label':f'v{NEW}','semanticVersion':NEW,'build':f'v{NEW}',
 'updatedAt':datetime.now(ZoneInfo('Asia/Seoul')).isoformat(timespec='seconds'),
 'note':'v6.52 실시간 운영 대시보드 · 입장/대기/코트/평균·최장대기/0게임/장기대기 현황 · 기존 10초 상태동기화 활용'
}
(ROOT/'latest-version.json').write_text(json.dumps(latest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

assert f'app-v{NEW}.js?v={NEW}' in idx and f'app-v{NEW}.css?v={NEW}' in idx
assert 'opsDashboard652' in js and 'snapshot652' in js and 'renderOpsDashboard652' in js
assert 'setInterval(()=>{if(!document.hidden&&currentView===\'stats\')renderOpsDashboard652()},30000)' in js
assert '.opsMetrics652' in css and '.opsPanel652' in css
assert NEW in (ROOT/'kokmatch-sw.js').read_text(encoding='utf-8')
print('v6.52 dashboard build assertions OK')
