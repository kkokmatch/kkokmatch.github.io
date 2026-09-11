from pathlib import Path
import json

root=Path('.')
js=(root/'app-v6.72.js').read_text(encoding='utf-8').replace('6.72','6.73')
css=(root/'app-v6.72.css').read_text(encoding='utf-8').replace('6.72','6.73')

start=js.index('function autoRuleHtml656(){return')
end=js.index('window.toggleAutoGame656=async function()',start)
new_rules=r'''function autoRuleHtml656(){return `<div class="autoRules656">
 <div><b>① 대기시간 최우선</b><span>게임 종료 후 다시 대기한 시간과 오늘 누적 총 대기시간을 가장 먼저 비교합니다.</span></div>
 <div><b>② 당일 게임수</b><span>대기조건이 비슷하면 오늘 게임횟수가 적은 회원을 우선합니다.</span></div>
 <div><b>③ 오늘 파트너 우선</b><span>오늘 설정한 파트너가 함께 대기 중이면 같은 팀으로 배치하는 것을 우선합니다.</span></div>
 <div><b>④ 급수·남녀 밸런스</b><span>팀 전력과 남녀 구성을 함께 맞춥니다. 전력 계산에서는 여자 C조를 남자 D조와 같은 수준으로 환산합니다.</span></div>
 <div><b>⑤ 반복조합 최소화</b><span>당일 3회 이상 같이 경기한 조합은 가능한 한 피합니다. 오늘 파트너 조합은 예외입니다.</span></div>
 </div>`}
window.openAutoGameSettings656=function(){
 if(!canControlAuto656())return alert('개발자·모임장·운영진만 자동게임설정을 확인할 수 있습니다.');
 const c=autoCfg656(),u=c.updatedBy||{};
 openModal(`<h3>자동게임설정 · 우선순위 자동편성</h3><div class="note">아래 순서를 기준으로 앞 항목을 더 우선해 자동 편성합니다. 대기시간은 5~10분 단위의 우선구간으로 비교해, 비슷하게 기다린 회원 사이에서는 다음 기준이 실제로 반영되도록 구성했습니다.</div>${autoRuleHtml656()}<div class="autoPolicy656"><b>운영 안전장치</b><span>1~3명짜리 미완성 대기조가 있으면 자동편성은 새 조를 만들지 않고 잠시 멈춥니다. 기존 대기조 인원을 임의로 바꾸거나 해체하지 않습니다.</span><span>모든 코트가 사용 중이면 다음 경기 1조까지만 준비하고, 빈 코트가 있으면 필요한 수만큼 순차적으로 편성합니다.</span><span>자동편성 ON 상태에서 개발자·모임장·운영진이 수동 편성을 시도하면 먼저 동작을 막고, 자동기능 유지 또는 자동기능을 끄고 직접 편성 중 하나를 선택하게 합니다.</span></div>${u.name?`<div class="meta autoUpdated656">현재 설정자: <b>${escAuto656(u.name)}</b> · ${escAuto656(u.roleLabel||roleText656(u.role))}</div>`:''}<button class="btn ghost" style="width:100%;margin-top:12px" onclick="closeModal()">닫기</button>`);
};

'''
js=js[:start]+new_rules+js[end:]
js=js.replace("mode:'ai_optimal'","mode:'priority_v673'")

manual_guard=r'''

/* v6.73: automatic mode owns game composition until an authorized operator explicitly switches to manual. */
(()=>{
'use strict';
if(window.__kokmatchAutoManualGuard673)return;window.__kokmatchAutoManualGuard673='6.73';
let deferred673=null,promptOpen673=false,bypassUntil673=0,lastNotice673=0;
function autoOn673(){try{return typeof autoEnabled656==='function'&&autoEnabled656()}catch{return S?.autoGame?.enabled===true}}
function controller673(){try{return typeof canControlAuto656==='function'&&canControlAuto656()}catch{return !!me&&(me?.globalAdmin||me?.role==='manager'||me?.role==='organizer')}}
function intentNode673(target){
 const el=target instanceof Element?target:null;if(!el||!el.closest('#queue'))return null;
 if(el.closest('.autoGameQueue658'))return null;
 const button=el.closest('button');
 if(button){
  const oc=String(button.getAttribute('onclick')||'');
  if(/toggleAutoGame656|openAutoGameSettings656|openCourtStart|draftRemove|clearDraft/.test(oc))return null;
  if(button.closest('.composer54,.composer,.pendingCard54,.pendingCard'))return button;
 }
 const card=el.closest('.queueCard');if(card&&card.closest('#queue'))return card;
 const slot=el.closest('.pendingSlot.clickable');if(slot&&slot.closest('.pendingCard54,.pendingCard'))return slot;
 return null;
}
function stop673(ev){try{ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation()}catch{}}
function openConflict673(node){
 if(promptOpen673)return;promptOpen673=true;deferred673={node};
 openModal(`<h3>자동게임편성 작동 중</h3><div class="note">현재 자동게임편성이 ON이라 수동 게임편성 동작을 잠시 막았습니다.</div><div class="autoManualExplain673"><b>어떻게 진행할까요?</b><span><strong>자동기능 유지</strong>를 선택하면 방금 수동 동작은 취소되고 자동편성이 계속됩니다.</span><span><strong>자동기능 끄고 직접 편성</strong>을 선택하면 자동편성을 OFF로 전환한 뒤 방금 하려던 수동 동작을 이어서 실행합니다.</span></div><div class="autoManualChoices673"><button id="autoManualKeep673" type="button" class="btn ghost" onclick="keepAutoManual673()">자동기능 유지</button><button id="autoManualDisable673" type="button" class="btn pri" onclick="disableAutoManual673()">자동기능 끄고 직접 편성</button></div>`);
}
window.keepAutoManual673=function(){deferred673=null;promptOpen673=false;closeModal();setTimeout(()=>{try{runAuto656(false)}catch{}},120)};
window.disableAutoManual673=async function(){
 const intent=deferred673,btn=document.getElementById('autoManualDisable673');if(btn){btn.disabled=true;btn.textContent='자동기능 끄는 중...'}
 try{
  const x=await autoRequest656('set',{enabled:false});
  if(x?.data){S=x.data;window.S=x.data;normalizeClient()}else if(S?.autoGame)S.autoGame.enabled=false;
  deferred673=null;promptOpen673=false;bypassUntil673=Date.now()+1600;closeModal();
  try{window.__kokmatchPaintCompactAuto659?.()}catch{}
  setTimeout(()=>{try{intent?.node?.click?.()}catch(e){showError(e)}},0);
 }catch(e){if(btn?.isConnected){btn.disabled=false;btn.textContent='자동기능 끄고 직접 편성'}showError(e)}
};
function intercept673(ev){
 if(Date.now()<bypassUntil673||!autoOn673())return;
 const node=intentNode673(ev.target);if(!node)return;
 stop673(ev);
 if(!controller673()){
  if(Date.now()-lastNotice673>900){lastNotice673=Date.now();alert('자동게임편성이 작동 중입니다. 개발자·모임장·운영진이 자동기능을 끈 뒤 수동 편성을 진행할 수 있습니다.')}
  return;
 }
 openConflict673(node);
}
window.addEventListener('pointerup',intercept673,{capture:true,passive:false});
window.addEventListener('click',intercept673,{capture:true,passive:false});
})();
'''
js+=manual_guard

css+=r'''

/* KokMatch v6.73 automatic/manual composition conflict chooser. */
.autoManualExplain673{display:grid;gap:8px;margin:11px 0 14px;padding:12px;border:1px solid #dbe3f1;border-radius:14px;background:#f8faff;color:#52627a;font-size:12px;line-height:1.5}
.autoManualExplain673>b{color:#172033;font-size:13px}.autoManualExplain673 span{display:block}.autoManualExplain673 strong{color:#2453d4}
.autoManualChoices673{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.35fr);gap:8px}.autoManualChoices673 .btn{min-width:0;white-space:normal;line-height:1.25;min-height:46px}
@media(max-width:380px){.autoManualChoices673{grid-template-columns:1fr}.autoManualChoices673 .btn{width:100%}}
'''

(root/'app-v6.73.js').write_text(js,encoding='utf-8')
(root/'app-v6.73.css').write_text(css,encoding='utf-8')

for name in ['index.html','manifest.webmanifest','kokmatch-sw.js','sw.js']:
 p=root/name;s=p.read_text(encoding='utf-8');s=s.replace('6.72','6.73');p.write_text(s,encoding='utf-8')

(root/'latest-version.json').write_text(json.dumps({
 'version':113,'label':'v6.73','semanticVersion':'6.73','build':'v6.73','updatedAt':'2026-09-11T11:42:00+09:00',
 'note':'v6.73 자동게임 우선순위 강화 · 대기시간→게임수→당일파트너→성별보정 급수밸런스→3회 반복회피 · 자동/수동 충돌 선택창'
},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('built v6.73 automatic priority and manual conflict guard')
