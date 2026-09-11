from pathlib import Path
import json

root=Path('.')
js=(root/'app-v6.74.js').read_text(encoding='utf-8').replace('6.74','6.75')
css=(root/'app-v6.74.css').read_text(encoding='utf-8').replace('6.74','6.75')

# Keep the existing live-operations dashboard mounted instead of deleting/recreating it.
old="window.__kokmatchRenderOpsDashboard652=function(){document.getElementById('opsDashboard652')?.remove()};"
if js.count(old)<2:
    raise SystemExit(f'expected two legacy live-dashboard removers, got {js.count(old)}')
js=js.replace(old,"window.__kokmatchRenderOpsDashboard652=renderOpsDashboard652;",1)
js=js.replace(old,"/* v6.75 keep today live dashboard mounted */",1)
js=js.replace("renderStats=function(...args){const r=baseStats652.apply(this,args);document.getElementById('opsDashboard652')?.remove();return r};",
              "renderStats=function(...args){const r=baseStats652.apply(this,args);renderOpsDashboard652();return r};",1)
js=js.replace("if(old)old.replaceWith(next);else box.prepend(next);",
              "if(old){old.className=next.className;old.innerHTML=next.innerHTML}else box.prepend(next);",1)
js=js.replace("if(el!==detail&&!el.classList.contains('pollWrap623'))el.remove()",
              "if(el!==detail&&!el.classList.contains('pollWrap623')&&el.id!=='opsDashboard652')el.remove()",1)
js=js.replace("setTimeout(()=>{document.getElementById('opsDashboard652')?.remove();if(me){paintAutoSettings656();decorateQueueAuto656()}armAuto656()},0);",
              "setTimeout(()=>{if(me){paintAutoSettings656();decorateQueueAuto656()}armAuto656()},0);",1)

# v6.75 end-of-runtime hardening: real server-synced auto toggle, monthly row numbers,
# and stable post-render polish without touching existing successful flows.
append=r'''

/* v6.75: verified automatic-game controls + stable stats polish. */
(()=>{
'use strict';
if(window.__kokmatchFix675)return;window.__kokmatchFix675='6.75';
const AUTO675='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-auto-v656';
let autoBusy675=false,statsQueued675=false;
function canAuto675(){return !!me&&(me.globalAdmin===true||['admin','manager','organizer'].includes(String(me.role||'')))}
async function autoReq675(action,body={}){
 const r=await fetch(AUTO675,{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+String(T||'')},body:JSON.stringify({action,groupId:currentGroupId,...body}),cache:'no-store'});
 const x=await r.json().catch(()=>({}));
 if(!r.ok){if(r.status===401){try{reloginLatest()}catch{};throw new Error('로그인이 만료되었습니다.')}throw new Error(x.error||'자동게임편성 서버 응답을 확인하지 못했습니다.')}
 return x;
}
function applyAuto675(x,full=false){
 if(full&&x?.data){S=x.data;window.S=S;normalizeClient();return}
 const c=x?.config||x?.data?.autoGame;if(c){S=S||{};S.autoGame={...(S.autoGame||{}),...c};window.S=S}
}
function paintAuto675(){
 const on=S?.autoGame?.enabled===true;
 document.querySelectorAll('.autoGameQueue658').forEach(card=>{card.classList.toggle('on',on);card.classList.toggle('off',!on)});
 document.querySelectorAll('.autoToggle656').forEach(btn=>{btn.disabled=autoBusy675;btn.classList.toggle('on',on);btn.setAttribute('aria-label',`자동게임편성 ${on?'켜짐':'꺼짐'}`);const s=btn.querySelector('span');if(s)s.textContent=autoBusy675?'확인중':(on?'ON':'OFF')});
}
async function syncAuto675(){if(!canAuto675()||!T||!currentGroupId)return null;const x=await autoReq675('get');applyAuto675(x,false);paintAuto675();return x}
window.__kokmatchSyncAuto675=syncAuto675;
window.__kokmatchAutoHealth675=async()=>{const x=await syncAuto675();return {enabled:!!x?.config?.enabled,config:x?.config||null}};
const oldOpen675=window.openAutoGameSettings656;
window.openAutoGameSettings656=function(...args){
 if(!canAuto675())return alert('개발자·모임장·운영진만 자동게임설정을 확인할 수 있습니다.');
 const r=typeof oldOpen675==='function'?oldOpen675.apply(this,args):undefined;
 syncAuto675().catch(e=>console.warn('auto settings sync v6.75',e));
 return r;
};
window.toggleAutoGame656=async function(){
 if(!canAuto675()||autoBusy675)return;
 autoBusy675=true;paintAuto675();
 try{
  const before=await autoReq675('get');applyAuto675(before,false);
  const next=!(before?.config?.enabled===true);
  const saved=await autoReq675('set',{enabled:next});applyAuto675(saved,true);
  const verify=await autoReq675('get');applyAuto675(verify,false);
  if((verify?.config?.enabled===true)!==next)throw new Error('자동게임편성 설정 저장을 확인하지 못했습니다. 다시 시도해주세요.');
  if(next){
   const tick=await autoReq675('tick');
   if(tick?.data)applyAuto675(tick,true);
  }
  try{renderAll()}catch{}
  if(currentView==='queue')try{goView('queue')}catch{}
 }catch(e){showError(e)}finally{autoBusy675=false;paintAuto675()}
};

function polishMonthly675(){
 const table=document.querySelector('#stats .statsMonthlyTable628');if(!table)return;
 const cg=table.querySelector('colgroup');if(cg&&!cg.querySelector('.cNo675')){const c=document.createElement('col');c.className='cNo675';cg.children[0]?.insertAdjacentElement('afterend',c)}
 const hr=table.querySelector('thead tr');if(hr&&!hr.querySelector('.statsNoHead675')){const th=document.createElement('th');th.className='statsNoHead675';th.innerHTML='<span>번호</span>';hr.children[0]?.insertAdjacentElement('afterend',th)}
 const rows=[...table.querySelectorAll('tbody tr')];let n=0;
 rows.forEach(tr=>{
  const empty=tr.querySelector('.statsEmpty628');if(empty){empty.setAttribute('colspan','7');return}
  n+=1;const first=tr.children[0];if(!first)return;first.classList.add('statsName675');
  let no=tr.querySelector(':scope > .statsNo675');if(!no){no=document.createElement('td');no.className='statsNo675';first.insertAdjacentElement('afterend',no)}
  no.textContent=String(n);
 });
}
function scheduleStats675(){if(statsQueued675)return;statsQueued675=true;requestAnimationFrame(()=>{statsQueued675=false;polishMonthly675()})}
window.__kokmatchPolishStats675=polishMonthly675;
try{const prev=renderStats;renderStats=function(...args){const r=prev.apply(this,args);scheduleStats675();return r};window.renderStats=renderStats}catch{}
const startStats675=()=>{const box=document.getElementById('stats');if(!box)return;new MutationObserver(scheduleStats675).observe(box,{childList:true,subtree:true});scheduleStats675()};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startStats675,{once:true});else startStats675();
})();
'''
js+=append

css+=r'''

/* v6.75 monthly member rows: name centered under header, sequence number immediately to its right. */
.statsMonthlyTable628 .cName628{width:22%!important}.statsMonthlyTable628 .cNo675{width:8%!important}.statsMonthlyTable628 .cYear628{width:14%!important}.statsMonthlyTable628 .cAge628{width:17%!important}.statsMonthlyTable628 .cRole628{width:15%!important}.statsMonthlyTable628 .cAttend628{width:12%!important}.statsMonthlyTable628 .cGames628{width:12%!important}
.statsMonthlyTable628 th:first-child,.statsMonthlyTable628 td.statsName675{text-align:center!important;padding-left:4px!important;padding-right:4px!important}
.statsMonthlyTable628 .statsNoHead675{font-size:9px;font-weight:900;color:#405a78;text-align:center;padding:0 1px!important}.statsMonthlyTable628 .statsNoHead675 span{display:block;padding:9px 0;white-space:nowrap}
.statsMonthlyTable628 td.statsNo675{text-align:center!important;font-weight:900;color:#7a8798;padding-left:1px!important;padding-right:1px!important}
/* Today-live section is persistent; update content in place instead of removing the section node. */
#stats #opsDashboard652{display:block!important;visibility:visible!important;opacity:1!important}
'''

(root/'app-v6.75.js').write_text(js,encoding='utf-8')
(root/'app-v6.75.css').write_text(css,encoding='utf-8')
for name in ['index.html','manifest.webmanifest','kokmatch-sw.js','sw.js']:
 p=root/name;s=p.read_text(encoding='utf-8').replace('6.74','6.75');p.write_text(s,encoding='utf-8')
(root/'latest-version.json').write_text(json.dumps({
 'version':115,'label':'v6.75','semanticVersion':'6.75','build':'v6.75','updatedAt':'2026-09-11T14:10:00+09:00',
 'note':'v6.75 자동게임설정 서버동기화/즉시검증 · 월간회원기록 이름정렬+번호열 · 오늘의 운동 LIVE 상시 유지'
},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('built v6.75 auto + stats live fixes')
