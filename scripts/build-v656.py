from pathlib import Path
from datetime import datetime
from zoneinfo import ZoneInfo
import json, shutil

ROOT=Path('.')
OLD='6.55'; NEW='6.56'
old_js=ROOT/f'app-v{OLD}.js'; old_css=ROOT/f'app-v{OLD}.css'
new_js=ROOT/f'app-v{NEW}.js'; new_css=ROOT/f'app-v{NEW}.css'
assert old_js.exists() and old_css.exists(), 'v6.55 runtime missing'

arc=ROOT/'versions'/f'v{OLD}'
arc.mkdir(parents=True,exist_ok=True)
for p in [old_js,old_css,ROOT/'index.html',ROOT/'manifest.webmanifest',ROOT/'kokmatch-sw.js',ROOT/'sw.js',ROOT/'latest-version.json']:
    if p.exists(): shutil.copy2(p,arc/p.name)

js=old_js.read_text(encoding='utf-8').replace(OLD,NEW)
css=old_css.read_text(encoding='utf-8').replace(OLD,NEW)

# v6.56: the live operations dashboard is no longer part of stats.
old_ops="""window.__kokmatchRenderOpsDashboard652=renderOpsDashboard652;
const baseStats652=renderStats;
renderStats=function(...args){const r=baseStats652.apply(this,args);renderOpsDashboard652();return r};"""
new_ops="""window.__kokmatchRenderOpsDashboard652=function(){document.getElementById('opsDashboard652')?.remove()};
const baseStats652=renderStats;
renderStats=function(...args){const r=baseStats652.apply(this,args);document.getElementById('opsDashboard652')?.remove();return r};"""
assert old_ops in js, 'v6.52 dashboard injection block changed'
js=js.replace(old_ops,new_ops,1)

module=r'''

/* v6.56: group-scoped AI auto game assignment + pending creator provenance. */
(()=>{
'use strict';
if(window.__kokmatchAutoGame656)return;
window.__kokmatchAutoGame656='6.56';
const AUTO656='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-auto-v656';
const ATOMIC656='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-atomic-api';
let autoBusy656=false,autoToggleBusy656=false,lastAutoTick656=0,autoTimer656=null;

function canControlAuto656(){return !!me&&(me.globalAdmin===true||me.role==='manager'||me.role==='organizer')}
function autoCfg656(){const c=S?.autoGame&&typeof S.autoGame==='object'?S.autoGame:{};return{enabled:c.enabled===true,mode:'ai_optimal',updatedAt:Number(c.updatedAt)||0,updatedBy:c.updatedBy&&typeof c.updatedBy==='object'?c.updatedBy:{}}}
function autoEnabled656(){return autoCfg656().enabled===true}
function roleText656(r){return r==='admin'?'개발자':r==='manager'?'모임장':r==='organizer'?'운영진':r==='temp'?'임시편성자':String(r||'')}
function escAuto656(v){try{return esc(v)}catch{return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}}
function pendingBy656(pid){return (Array.isArray(S?.pendingGames)?S.pendingGames:[]).find(g=>String(g?.id||'')===String(pid||''))||null}
function creatorText656(pg){
 if(!pg)return'편성자 기록 없음';
 const mode=String(pg.createdByMode||'');
 if(mode==='auto'||String(pg.createdByName||'')==='AI 자동편성'){
  const n=String(pg.autoEnabledByName||'').trim(),r=String(pg.autoEnabledByRole||'').trim();
  return n?`AI 자동편성 (ON 설정: ${n}${r?' · '+r:''})`:'AI 자동편성';
 }
 const n=String(pg.createdByName||'').trim(),r=String(pg.createdByRole||'').trim();
 if(n)return `${n}${r?' · '+r:''}`;
 return '편성자 기록 없음 (v6.56 이전 편성)';
}
window.__kokmatchPendingCreatorText656=creatorText656;

async function autoRequest656(action,body={}){
 const r=await fetch(AUTO656,{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+String(T||'')},body:JSON.stringify({action,groupId:currentGroupId,...body}),cache:'no-store'});
 const x=await r.json().catch(()=>({}));
 if(!r.ok){if(r.status===401){try{reloginLatest()}catch{};throw new Error('로그인이 만료되었습니다.')}throw new Error(x.error||'자동게임편성 처리에 실패했습니다.')}
 return x;
}

async function createPendingAtomic656(body={},opts={}){
 const r=await fetch(ATOMIC656,{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+String(T||'')},body:JSON.stringify({action:'create_pending',groupId:currentGroupId,...body,createdByMode:'manual'}),cache:'no-store'});
 const x=await r.json().catch(()=>({}));
 if(!r.ok){
  if(r.status===401){try{reloginLatest()}catch{};throw new Error('로그인이 만료되었습니다.')}
  const e=new Error(x.error||'대기조 등록에 실패했습니다.');e.payload=x;
  if(x.warning==='repeat_pair'&&opts?.repeat){try{showRepeat(x,opts.repeat);return null}catch{}}
  throw e;
 }
 if(x?.data){S=x.data;window.S=x.data;normalizeClient();renderAll()}
 return x;
}
const actBefore656=act;
act=async function(action,body={},opts={}){
 let x;
 if(action==='create_pending')x=await createPendingAtomic656(body,opts);
 else x=await actBefore656(action,body,opts);
 if(autoEnabled656()&&action!=='set_temp')setTimeout(()=>runAuto656(false),180);
 return x;
};

function autoRuleHtml656(){return `<div class="autoRules656">
 <div><b>① 게임횟수 균형</b><span>게임이 적은 회원을 우선하되 한쪽에만 몰리지 않게 판단</span></div>
 <div><b>② 대기시간</b><span>오래 기다린 회원에게 가중치를 주어 장기대기를 줄임</span></div>
 <div><b>③ 반복 조합 최소화</b><span>같이 경기한 횟수가 많은 조합은 가능한 한 피함</span></div>
 <div><b>④ 급수·팀 밸런스</b><span>4명의 급수와 두 팀의 전력을 함께 비교해 균형 조합 선택</span></div>
 <div><b>⑤ 오늘 파트너 우선</b><span>파트너가 함께 대기 중이면 같은 팀 배치를 강하게 우선</span></div>
 <div><b>⑥ 코트·대기조 상황</b><span>빈 코트 수와 이미 편성된 조를 보고 필요한 만큼만 자동 생성</span></div>
 </div>`}
window.openAutoGameSettings656=function(){
 if(!canControlAuto656())return alert('개발자·모임장·운영진만 자동게임설정을 확인할 수 있습니다.');
 const c=autoCfg656(),u=c.updatedBy||{};
 openModal(`<h3>자동게임설정 · AI 자동 최적화</h3><div class="note">고정 가중치를 직접 조절하는 방식이 아니라, 현재 대기인원·게임기록·대기시간·파트너·코트 상황을 AI식 최적화 점수로 매번 다시 판단합니다.</div>${autoRuleHtml656()}<div class="autoPolicy656"><b>운영 안전장치</b><span>사람이 1~3명짜리 미완성 대기조를 직접 수정 중이면 자동편성은 잠시 멈춥니다. 기존 대기조의 인원을 자동으로 바꾸거나 해체하지 않습니다.</span><span>모든 코트가 사용 중이어도 다음 경기 1조까지만 준비하고, 빈 코트가 있으면 필요한 수만큼 순차적으로 편성합니다.</span></div>${u.name?`<div class="meta autoUpdated656">현재 설정자: <b>${escAuto656(u.name)}</b> · ${escAuto656(u.roleLabel||roleText656(u.role))}</div>`:''}<button class="btn ghost" style="width:100%;margin-top:12px" onclick="closeModal()">닫기</button>`);
};

window.toggleAutoGame656=async function(){
 if(!canControlAuto656()||autoToggleBusy656)return;
 const next=!autoEnabled656();autoToggleBusy656=true;paintAutoSettings656();
 try{
  const x=await autoRequest656('set',{enabled:next});
  if(x?.data){S=x.data;window.S=x.data;normalizeClient()}
  renderAll();
  if(next)setTimeout(()=>runAuto656(true),30);
 }catch(e){showError(e)}finally{autoToggleBusy656=false;paintAutoSettings656()}
};

function autoCardHtml656(){
 const c=autoCfg656(),u=c.updatedBy||{},on=c.enabled;
 return `<div class="card autoGameCard656 ${on?'on':'off'}"><div class="autoGameTop656"><div><div class="autoGameTitle656"><b>자동게임편성</b><span class="autoPill656">AI 자동 최적화</span></div><div class="meta">개발자 · 모임장 · 운영진 공용 설정</div></div><button type="button" class="autoToggle656 ${on?'on':''}" onclick="toggleAutoGame656()" ${autoToggleBusy656?'disabled':''}><span>${on?'ON':'OFF'}</span><i></i></button></div><div class="autoGameDesc656">${on?'대기인원이 4명 이상이면 현재 상황을 분석해 필요한 대기조를 자동으로 편성합니다.':'현재는 수동 편성입니다. ON으로 바꾸면 AI 자동편성이 시작됩니다.'}</div>${u.name?`<div class="meta autoBy656">마지막 설정 · ${escAuto656(u.name)} · ${escAuto656(u.roleLabel||roleText656(u.role))}</div>`:''}<button type="button" class="btn ghost autoSettingsBtn656" onclick="openAutoGameSettings656()">자동게임설정</button></div>`;
}
function paintAutoSettings656(){
 const box=document.getElementById('settings');if(!box)return;
 box.querySelector('.autoGameCard656')?.remove();
 if(!canControlAuto656())return;
 const cards=[...box.querySelectorAll(':scope > .card')],current=cards.find(c=>String(c.textContent||'').includes('현재 모임')),holder=document.createElement('div');holder.innerHTML=autoCardHtml656();const card=holder.firstElementChild;if(!card)return;
 if(current)current.insertAdjacentElement('afterend',card);else box.prepend(card);
}
const renderSettingsBefore656=renderSettings;
renderSettings=function(...args){const r=renderSettingsBefore656.apply(this,args);paintAutoSettings656();const box=document.getElementById('settings');if(box)[...box.querySelectorAll('.meta')].forEach(el=>{if(/콕매치 v6\.5[0-5]/.test(el.textContent||''))el.textContent='콕매치 v6.56 · AI 자동게임편성 · 편성자 기록'});return r};

function decorateQueueAuto656(){
 const box=document.getElementById('queue');if(!box)return;box.querySelector('.autoQueueBanner656')?.remove();
 if(!canControlAuto656()||!autoEnabled656())return;
 const title=box.querySelector('.title'),u=autoCfg656().updatedBy||{},d=document.createElement('div');d.className='autoQueueBanner656';d.innerHTML=`<b>자동게임편성 ON</b><span>AI 자동 최적화${u.name?' · '+escAuto656(u.name)+' 설정':''}</span>`;if(title)title.insertAdjacentElement('afterend',d);else box.prepend(d);
}
const renderQueueBefore656=renderQueue;
renderQueue=function(...args){const r=renderQueueBefore656.apply(this,args);decorateQueueAuto656();return r};

function addCreatorNote656(pid){
 const pg=pendingBy656(pid),sheet=document.getElementById('modalSheet');if(!sheet||!pg)return;
 sheet.querySelector('.pendingCreatorInfo656')?.remove();const note=sheet.querySelector('.note'),d=document.createElement('div');d.className='pendingCreatorInfo656';d.innerHTML=`<b>기존 편성</b><span>${escAuto656(creatorText656(pg))}</span>`;if(note)note.insertAdjacentElement('afterend',d);else sheet.prepend(d);
}
const openMoveMemberBefore656=openMoveMember;
openMoveMember=function(pid,id){const r=openMoveMemberBefore656(pid,id);addCreatorNote656(pid);return r};
const openFillPendingBefore656=openFillPending;
openFillPending=function(pid){const r=openFillPendingBefore656(pid);addCreatorNote656(pid);return r};

removePending=async function(pid,id){
 const pg=pendingBy656(pid),m=M(id),creator=creatorText656(pg);
 if(!confirm(`${m?.name||'회원'}님을 개인 게임대기로 내릴까요? 대기시간은 유지됩니다.\n\n기존 편성: ${creator}`))return;
 try{await act('remove_from_pending',{pendingId:pid,memberId:id})}catch(e){showError(e)}
};
cancelPending=async function(pid){
 const pg=pendingBy656(pid),creator=creatorText656(pg);
 if(!confirm(`이 편성대기 조를 취소하고 전원을 개인 게임대기로 돌릴까요? 대기시간은 유지됩니다.\n\n기존 편성: ${creator}`))return;
 try{await act('cancel_pending',{pendingId:pid})}catch(e){showError(e)}
};

async function runAuto656(force=false){
 if(!T||!currentGroupId||document.hidden||!autoEnabled656())return null;
 const now=Date.now();if(autoBusy656||(!force&&now-lastAutoTick656<5200))return null;
 autoBusy656=true;lastAutoTick656=now;
 try{
  const x=await autoRequest656('tick');
  if(x?.created&&x?.data){S=x.data;window.S=x.data;normalizeClient();renderAll()}
  else if(x?.config&&S?.autoGame&&x.config.enabled!==S.autoGame.enabled){S.autoGame=x.config;renderAll()}
  return x;
 }catch(e){console.warn('auto game v6.56',e);return null}finally{autoBusy656=false}
}
window.__kokmatchRunAuto656=runAuto656;
function armAuto656(){if(autoTimer656)clearInterval(autoTimer656);autoTimer656=setInterval(()=>runAuto656(false),6500);setTimeout(()=>runAuto656(false),900)}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(()=>runAuto656(true),150)});
window.addEventListener('focus',()=>setTimeout(()=>runAuto656(true),180),{passive:true});

/* Ensure stats stays historical/statistical only even if an older wrapper attempts to paint LIVE operations. */
window.__kokmatchRenderOpsDashboard652=function(){document.getElementById('opsDashboard652')?.remove()};
setTimeout(()=>{document.getElementById('opsDashboard652')?.remove();if(me){paintAutoSettings656();decorateQueueAuto656()}armAuto656()},0);
})();
'''
js += module

css += r'''

/* v6.56 auto game assignment */
.autoGameCard656{border-color:#c8d4f8;background:linear-gradient(180deg,#fff,#f7f9ff)}.autoGameCard656.on{border-color:#9bd8ba;background:linear-gradient(180deg,#fbfffd,#f1fbf6)}.autoGameTop656{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}.autoGameTitle656{display:flex;align-items:center;gap:7px;flex-wrap:wrap}.autoPill656{display:inline-flex;align-items:center;border-radius:999px;padding:4px 8px;font-size:10px;font-weight:950;background:#edf2ff;color:#2453d4}.autoGameDesc656{font-size:12px;line-height:1.6;color:#536583;margin:10px 0 7px}.autoBy656{margin-bottom:8px}.autoSettingsBtn656{width:100%;padding:9px 11px}.autoToggle656{border:0;width:76px;min-width:76px;height:38px;border-radius:999px;background:#e6e9ef;color:#677287;display:flex;align-items:center;justify-content:space-between;padding:4px 5px 4px 10px;font-weight:950;font-size:11px;transition:.18s}.autoToggle656 i{width:30px;height:30px;border-radius:50%;background:#fff;box-shadow:0 2px 7px #1d2a4424}.autoToggle656.on{background:#1f9c62;color:#fff;flex-direction:row-reverse;padding:4px 10px 4px 5px}.autoToggle656:disabled{opacity:.5}.autoRules656{display:grid;gap:7px}.autoRules656>div{border:1px solid #e1e7f4;border-radius:12px;padding:10px 11px;background:#fbfcff}.autoRules656 b{display:block;font-size:12px;margin-bottom:3px}.autoRules656 span,.autoPolicy656 span{display:block;font-size:11px;line-height:1.55;color:#687894}.autoPolicy656{margin-top:10px;padding:11px;border-radius:12px;background:#f1f8f5;border:1px solid #cfe8dc}.autoPolicy656>b{display:block;font-size:12px;color:#18754b;margin-bottom:5px}.autoPolicy656 span+span{margin-top:5px}.autoUpdated656{margin-top:10px}.autoQueueBanner656{display:flex;justify-content:space-between;align-items:center;gap:8px;border:1px solid #b7dfca;background:#eefaf4;color:#166d47;border-radius:12px;padding:8px 10px;margin:-2px 0 10px;font-size:11px}.autoQueueBanner656 b{font-size:12px}.autoQueueBanner656 span{text-align:right;color:#47725f}.pendingCreatorInfo656{display:flex;align-items:center;justify-content:space-between;gap:8px;border-radius:12px;padding:9px 11px;background:#fff7e9;border:1px solid #f0d6a8;margin:0 0 10px;font-size:11px}.pendingCreatorInfo656 b{color:#8a5b0b;white-space:nowrap}.pendingCreatorInfo656 span{text-align:right;color:#745f3b;font-weight:800}@media(max-width:390px){.autoGameTop656{align-items:center}.autoGameTitle656{gap:5px}.autoToggle656{width:72px;min-width:72px}.autoQueueBanner656{align-items:flex-start;flex-direction:column}.autoQueueBanner656 span{text-align:left}.pendingCreatorInfo656{align-items:flex-start;flex-direction:column}.pendingCreatorInfo656 span{text-align:left}}
'''

new_js.write_text(js,encoding='utf-8')
new_css.write_text(css,encoding='utf-8')

idx=(ROOT/'index.html').read_text(encoding='utf-8').replace(OLD,NEW)
idx=idx.replace('single-v655','single-v656').replace('session-coordinator-v655','session-coordinator-v656')
(ROOT/'index.html').write_text(idx,encoding='utf-8')
for name in ['manifest.webmanifest','kokmatch-sw.js','sw.js']:
    p=ROOT/name
    if p.exists(): p.write_text(p.read_text(encoding='utf-8').replace(OLD,NEW),encoding='utf-8')

latest={
 'version':96,'label':'v6.56','semanticVersion':'6.56','build':'v6.56',
 'updatedAt':datetime.now(ZoneInfo('Asia/Seoul')).isoformat(timespec='seconds'),
 'note':'v6.56 실시간 운영현황 제거 · 자동게임편성 ON/OFF · AI 자동최적화 편성 · 대기조 기존 편성자 표시'
}
(ROOT/'latest-version.json').write_text(json.dumps(latest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

for need in ['kokmatch-auto-v656','toggleAutoGame656','__kokmatchRunAuto656','pendingCreatorInfo656','createdByMode','AI 자동 최적화']:
    assert need in js, f'missing v6.56 invariant: {need}'
assert 'renderOpsDashboard652();return r' not in js, 'live operations dashboard still injected'
assert f'app-v{NEW}.js?v={NEW}' in idx and f'app-v{NEW}.css?v={NEW}' in idx
print('v6.56 auto game build OK')
