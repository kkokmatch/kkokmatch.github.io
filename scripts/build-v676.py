from pathlib import Path
import json

root=Path('.')
js=(root/'app-v6.75.js').read_text(encoding='utf-8').replace('6.75','6.76')
css=(root/'app-v6.75.css').read_text(encoding='utf-8').replace('6.75','6.76')

# Final public auto-control layer. A successful SET is authoritative. The initial automatic
# tick is best-effort, because a composition failure must never make a successful ON/OFF save
# look like it failed. Periodic auto ticks continue to retry in the existing v6.73 controller.
js += r'''

/* v6.76: resilient automatic-game toggle; save state and composition execution are separate. */
(()=>{
'use strict';
if(window.__kokmatchAutoToggle676)return;window.__kokmatchAutoToggle676='6.76';
const AUTO676='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-auto-v656';
let busy676=false;
function can676(){return !!me&&(me.globalAdmin===true||['admin','manager','organizer'].includes(String(me.role||'')))}
function errText676(x,status){
 const raw=String(x?.error||x?.message||x?.code||'').trim();
 if(raw)return raw;
 return status?`자동게임편성 서버 오류 (${status})`:'자동게임편성 서버와 통신하지 못했습니다.';
}
async function req676(action,body={}){
 let r;
 try{
  r=await fetch(AUTO676,{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+String(T||'')},body:JSON.stringify({action,groupId:currentGroupId,...body}),cache:'no-store'});
 }catch(e){throw new Error('자동게임편성 서버에 연결하지 못했습니다. 네트워크를 확인해주세요.')}
 const x=await r.json().catch(()=>({}));
 if(!r.ok){
  if(r.status===401){try{reloginLatest()}catch{};throw new Error('로그인이 만료되었습니다.')}
  const e=new Error(errText676(x,r.status));e.status=r.status;e.payload=x;throw e;
 }
 return x;
}
function apply676(x){
 if(x?.data){S=x.data;window.S=S;normalizeClient();return}
 const c=x?.config||x?.data?.autoGame;if(c){S=S||{};S.autoGame={...(S.autoGame||{}),...c};window.S=S}
}
function paint676(){
 const on=S?.autoGame?.enabled===true;
 document.querySelectorAll('.autoGameQueue658').forEach(card=>{card.classList.toggle('on',on);card.classList.toggle('off',!on)});
 document.querySelectorAll('.autoToggle656').forEach(btn=>{btn.disabled=busy676;btn.classList.toggle('on',on);btn.setAttribute('aria-label',`자동게임편성 ${on?'켜짐':'꺼짐'}`);const s=btn.querySelector('span');if(s)s.textContent=busy676?'저장중':(on?'ON':'OFF')});
}
async function sync676(){if(!can676()||!T||!currentGroupId)return null;const x=await req676('get');apply676(x);paint676();return x}
window.__kokmatchSyncAuto676=sync676;
window.__kokmatchAutoHealth676=async()=>{const x=await sync676();return {enabled:x?.config?.enabled===true,config:x?.config||null}};

window.toggleAutoGame656=async function(){
 if(!can676()||busy676)return;
 busy676=true;paint676();
 const localBefore=S?.autoGame?.enabled===true;
 let serverBefore=localBefore;
 try{
  try{const before=await req676('get');apply676(before);serverBefore=before?.config?.enabled===true}catch(e){console.warn('auto pre-sync v6.76',e)}
  const next=!serverBefore;
  const saved=await req676('set',{enabled:next});
  apply676(saved);
  if(saved?.config)S.autoGame={...(S.autoGame||{}),...saved.config};
  if(!S.autoGame)S.autoGame={};S.autoGame.enabled=next;window.S=S;
  paint676();
  try{renderAll()}catch{}
  if(currentView==='queue')try{paint676()}catch{}

  // Re-read is diagnostic only. SET already returned success, so a transient GET must not
  // falsely tell the operator that the toggle failed.
  req676('get').then(v=>{apply676(v);paint676()}).catch(e=>console.warn('auto verify v6.76',e));

  if(next){
   try{
    const tick=await req676('tick');
    if(tick?.data)apply676(tick);
    try{renderAll()}catch{}
   }catch(e){
    // The ON state remains valid. Existing 6.5s auto timer will retry composition.
    console.warn('auto initial tick v6.76',e);
    setTimeout(()=>{try{window.__kokmatchRunAuto656?.(true)}catch{}},900);
   }
  }
 }catch(e){
  // Only failures of GET/SET before a successful save reach here.
  showError(e);
  try{const x=await req676('get');apply676(x)}catch{}
 }finally{busy676=false;paint676()}
};

const oldOpen676=window.openAutoGameSettings656;
window.openAutoGameSettings656=function(...args){
 const r=typeof oldOpen676==='function'?oldOpen676.apply(this,args):undefined;
 sync676().catch(e=>console.warn('auto settings sync v6.76',e));
 return r;
};
window.__kokmatchAutoRequest676=req676;
queueMicrotask(()=>{paint676();if(can676())sync676().catch(()=>{})});
})();
'''

(root/'app-v6.76.js').write_text(js,encoding='utf-8')
(root/'app-v6.76.css').write_text(css,encoding='utf-8')
for name in ['index.html','manifest.webmanifest','kokmatch-sw.js','sw.js']:
 p=root/name
 s=p.read_text(encoding='utf-8').replace('6.75','6.76')
 p.write_text(s,encoding='utf-8')
(root/'latest-version.json').write_text(json.dumps({
 'version':116,
 'label':'v6.76',
 'semanticVersion':'6.76',
 'build':'v6.76',
 'updatedAt':'2026-09-11T15:15:00+09:00',
 'note':'v6.76 자동편성 22명 CPU 한도 초과 해결 · ON/OFF 저장과 첫 편성 실행 분리 · 서버 오류 메시지 정확화'
},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('built v6.76 resilient automatic-game control')
