from pathlib import Path
from datetime import datetime, timezone, timedelta
import json,re

OLD='6.71'
NEW='6.72'
root=Path('.')

# Build the next standalone runtime from the current production runtime.
js=(root/f'app-v{OLD}.js').read_text(encoding='utf-8').replace(OLD,NEW)

# Queue polling: waiting-time changes are presentation-only and must not rebuild the
# whole queue DOM. Keep structural/member changes in the signature, then patch only
# the visible time labels when the structure is unchanged.
qs_start=js.index('function queueSig17(){')
qs_end=js.index("\n['draftClick'",qs_start)
new_queue_block=r'''function queueSig17(){
 try{
  const q=sortedQueue().map(id=>[id,memberDisplaySig17(id),draft.includes(id)]);
  const p=(S.pendingGames||[]).map(g=>[g.id,g.createdAt,(g.players||[]).map(id=>[id,memberDisplaySig17(id)])]);
  return JSON.stringify([q,p,draft,S?.adminBadgeVisibility||'all',canGame(),viewerIsDeveloper17()]);
 }catch{return String(Date.now())}
}
function refreshQueueTimes17(){
 try{
  const box=$('queue');if(!box)return;
  const q=sortedQueue();
  [...box.querySelectorAll('.queueCard54,.queueCard53,.queueCard')].forEach((card,i)=>{
   const id=q[i],m=id?M(id):null;if(!m)return;
   const meta=card.querySelector('.queueInfo53 .compactMeta53,.queueInfo53 .meta');
   if(meta)meta.textContent=`현재 ${waitMins(m)}분 대기중`;
  });
  [...box.querySelectorAll('.composer54 .slot54,.composer .slot')].forEach((slot,i)=>{
   const id=Array.isArray(draft)?draft[i]:null,m=id?M(id):null,meta=slot.querySelector('.compactMeta53,.meta');
   if(m&&meta)meta.textContent=`게임 ${dailyCount(id)}회 · ${waitMins(m)}분 대기`;
  });
  [...box.querySelectorAll('.pendingCard54,.pendingCard53,.pendingCard')].forEach((card,gi)=>{
   const pg=(S.pendingGames||[])[gi];if(!pg)return;
   const tag=card.querySelector('.pendingHead .pendingTools .tag');
   if(tag)tag.textContent=`${Math.max(0,Math.floor((Date.now()-Number(pg.createdAt||Date.now()))/60000))}분`;
   [...card.querySelectorAll('.pendingSlot54:not(.emptySlot),.pendingSlot53:not(.emptySlot)')].forEach((slot,pi)=>{
    const id=pg.players?.[pi],m=id?M(id):null,meta=slot.querySelector('.compactMeta53,.meta');
    if(m&&meta)meta.textContent=`게임 ${dailyCount(id)}회 · ${waitMins(m)}분 대기`;
   });
  });
 }catch{}
}
function syncQueue17(){
 const sig=queueSig17();
 if(lastQueueSig17!==sig)renderQueue();
 else{refreshQueueTimes17();stabilize17($('queue')||document)}
}'''
js=js[:qs_start]+new_queue_block+js[qs_end:]

# The compact auto-game card used to be removed and inserted again after each queue
# render. Reuse the existing DOM node and update only its state to prevent a flash.
pa_start=js.index('function paintCompactAuto659(){')
pa_end=js.index('\nfunction hostMemberId661',pa_start)
new_paint=r'''function paintCompactAuto659(){
 try{
  const box=document.getElementById('queue');if(!box)return;
  const existing=box.querySelector('.autoGameQueue658');
  if(!canAuto659()){existing?.remove();return}
  const on=S?.autoGame?.enabled===true;
  if(existing){
   existing.classList.toggle('on',on);existing.classList.toggle('off',!on);
   const toggle=existing.querySelector('.autoToggle656');
   if(toggle){toggle.classList.toggle('on',on);toggle.setAttribute('aria-label',`자동게임편성 ${on?'켜짐':'꺼짐'}`);const span=toggle.querySelector('span');if(span)span.textContent=on?'ON':'OFF'}
   const title=box.querySelector(':scope > .title');if(title&&existing.previousElementSibling!==title)title.insertAdjacentElement('afterend',existing);
   return;
  }
  const h=document.createElement('div');h.innerHTML=compactAutoHtml659();const card=h.firstElementChild;if(!card)return;
  const title=box.querySelector(':scope > .title');if(title)title.insertAdjacentElement('afterend',card);else box.prepend(card);
 }catch{}
}'''
js=js[:pa_start]+new_paint+js[pa_end:]

# Expose build markers only for deterministic QA, without changing app behavior.
insert='window.__kokmatchLegacyAutoUpdateDisabled=true;'
js=js.replace(insert,insert+"\nwindow.__kokmatchQueueStable672='6.72';",1)
(root/f'app-v{NEW}.js').write_text(js,encoding='utf-8')

css=(root/f'app-v{OLD}.css').read_text(encoding='utf-8').replace(OLD,NEW)
css += r'''

/* KokMatch v6.72: phone/Fold member roster keeps the same right-side action rail as tablet. */
@media(max-width:599px){
 #members .memberCard{
  grid-template-columns:40px minmax(0,1fr) 126px!important;
  grid-template-rows:auto!important;
  column-gap:5px!important;row-gap:0!important;
  align-items:center!important;
  padding:9px 6px!important;
 }
 #members .memberCard>.avatar{grid-column:1!important;grid-row:1!important;align-self:center!important;justify-self:center!important}
 #members .memberCard>.memberInfo48,
 #members .memberCard>.memberInfoV6,
 #members .memberCard>.memberInfoV618,
 #members .memberCard73.memberCard71>.memberInfo48{
  grid-column:2!important;grid-row:1!important;
  width:auto!important;min-width:0!important;max-width:100%!important;
  margin:0!important;position:static!important;transform:none!important;
  justify-self:stretch!important;align-self:center!important;overflow:hidden!important;
 }
 #members .memberCard>.kmRosterActions621,
 #members .memberCard>.v6MemberActions,
 #members .memberCard>.memberActions48,
 #members .memberCard>.memberActions60,
 #members .memberCard>.memberActions64,
 #members .memberCard>.memberActions65{
  grid-column:3!important;grid-row:1!important;
  width:126px!important;min-width:126px!important;max-width:126px!important;
  display:block!important;justify-self:end!important;align-self:center!important;
  margin:0!important;padding:0!important;border-top:0!important;
 }
 #members .kmRosterActions621 .status,
 #members .v6MemberActions .status,
 #members .memberActions48 .status,
 #members .memberActions60 .status,
 #members .memberActions64 .status,
 #members .memberActions65 .status{
  width:126px!important;min-width:126px!important;max-width:126px!important;
  margin:0 0 4px!important;text-align:center!important;white-space:nowrap!important;
  font-size:10px!important;line-height:1.2!important;
 }
 #members .kmRosterBtns621,
 #members .memberBtns,
 #members .memberBtns61,
 #members .memberBtns64,
 #members .memberBtns65{
  width:126px!important;min-width:126px!important;max-width:126px!important;
  display:grid!important;grid-template-columns:repeat(3,38px)!important;grid-template-rows:32px!important;
  gap:6px!important;height:32px!important;min-height:32px!important;
  justify-content:end!important;align-items:stretch!important;overflow:visible!important;
 }
 #members .kmRosterSlot621,#members .kmRosterPlaceholder621,#members .kmRosterAction621,
 #members .kmRosterActions621 button,#members .v6MemberActions button,#members .memberActions48 button,
 #members .memberActions60 button,#members .memberActions64 button,#members .memberActions65 button{
  flex:0 0 38px!important;flex-basis:38px!important;
  width:38px!important;min-width:38px!important;max-width:38px!important;
  height:32px!important;min-height:32px!important;max-height:32px!important;
  box-sizing:border-box!important;
 }
 #members .kmRosterAction621,#members .kmRosterActions621 button,#members .v6MemberActions button,
 #members .memberActions48 button,#members .memberActions60 button,#members .memberActions64 button,#members .memberActions65 button{
  font-size:9px!important;padding:4px 1px!important;line-height:1!important;border-radius:8px!important;white-space:nowrap!important;
 }
 #members .kmRosterReadonly621{display:block!important}
 #members .kmRosterReadonly621 .kmRosterReadonlySlots637{display:grid!important;visibility:hidden!important;pointer-events:none!important}
 #members .memberInfo48 .memberMainLine45,#members .memberInfo48 .name{flex-wrap:wrap!important;overflow:hidden!important}
}

/* Galaxy/Fold wider phone screens get a slightly roomier tablet-like rail. */
@media(min-width:430px) and (max-width:599px){
 #members .memberCard{grid-template-columns:42px minmax(0,1fr) 138px!important;column-gap:7px!important;padding:10px 8px!important}
 #members .memberCard>.kmRosterActions621,#members .memberCard>.v6MemberActions,#members .memberCard>.memberActions48,#members .memberCard>.memberActions60,#members .memberCard>.memberActions64,#members .memberCard>.memberActions65,
 #members .kmRosterActions621 .status,#members .v6MemberActions .status,#members .memberActions48 .status,#members .memberActions60 .status,#members .memberActions64 .status,#members .memberActions65 .status,
 #members .kmRosterBtns621,#members .memberBtns,#members .memberBtns61,#members .memberBtns64,#members .memberBtns65{width:138px!important;min-width:138px!important;max-width:138px!important}
 #members .kmRosterBtns621,#members .memberBtns,#members .memberBtns61,#members .memberBtns64,#members .memberBtns65{grid-template-columns:repeat(3,42px)!important;gap:6px!important}
 #members .kmRosterSlot621,#members .kmRosterPlaceholder621,#members .kmRosterAction621,#members .kmRosterActions621 button,#members .v6MemberActions button,#members .memberActions48 button,#members .memberActions60 button,#members .memberActions64 button,#members .memberActions65 button{flex:0 0 42px!important;flex-basis:42px!important;width:42px!important;min-width:42px!important;max-width:42px!important}
 #members .kmRosterAction621,#members .kmRosterActions621 button,#members .v6MemberActions button,#members .memberActions48 button,#members .memberActions60 button,#members .memberActions64 button,#members .memberActions65 button{font-size:9.5px!important}
}

/* Fold cover / ultra-narrow phone: preserve the same 3-column structure, just compact it. */
@media(max-width:359px){
 #members .memberCard{grid-template-columns:36px minmax(0,1fr) 111px!important;grid-template-rows:auto!important;column-gap:4px!important;padding:8px 5px!important}
 #members .memberCard>.kmRosterActions621,#members .memberCard>.v6MemberActions,#members .memberCard>.memberActions48,#members .memberCard>.memberActions60,#members .memberCard>.memberActions64,#members .memberCard>.memberActions65,
 #members .kmRosterActions621 .status,#members .v6MemberActions .status,#members .memberActions48 .status,#members .memberActions60 .status,#members .memberActions64 .status,#members .memberActions65 .status,
 #members .kmRosterBtns621,#members .memberBtns,#members .memberBtns61,#members .memberBtns64,#members .memberBtns65{width:111px!important;min-width:111px!important;max-width:111px!important}
 #members .kmRosterBtns621,#members .memberBtns,#members .memberBtns61,#members .memberBtns64,#members .memberBtns65{grid-template-columns:repeat(3,35px)!important;gap:3px!important;grid-template-rows:31px!important;height:31px!important;min-height:31px!important}
 #members .kmRosterSlot621,#members .kmRosterPlaceholder621,#members .kmRosterAction621,#members .kmRosterActions621 button,#members .v6MemberActions button,#members .memberActions48 button,#members .memberActions60 button,#members .memberActions64 button,#members .memberActions65 button{flex:0 0 35px!important;flex-basis:35px!important;width:35px!important;min-width:35px!important;max-width:35px!important;height:31px!important;min-height:31px!important;max-height:31px!important}
 #members .kmRosterAction621,#members .kmRosterActions621 button,#members .v6MemberActions button,#members .memberActions48 button,#members .memberActions60 button,#members .memberActions64 button,#members .memberActions65 button{font-size:8.3px!important;padding:3px 0!important}
 #members .kmRosterActions621 .status,#members .v6MemberActions .status,#members .memberActions48 .status,#members .memberActions60 .status,#members .memberActions64 .status,#members .memberActions65 .status{font-size:9px!important;margin-bottom:3px!important}
}

/* Queue stability: no visual transitions on elements that are periodically text-updated. */
#queue .queueCard,#queue .pendingCard,#queue .composer,#queue .autoGameQueue658{contain:layout style;}
#queue .queueCard,#queue .pendingCard,#queue .composer,#queue .autoGameQueue658{transition:none!important;animation:none!important}
'''
(root/f'app-v{NEW}.css').write_text(css,encoding='utf-8')

# Switch all production entry assets to v6.72 only.
index=(root/'index.html').read_text(encoding='utf-8').replace(OLD,NEW).replace('single-v671','single-v672').replace('session-coordinator-v671','session-coordinator-v672')
(root/'index.html').write_text(index,encoding='utf-8')
manifest=(root/'manifest.webmanifest').read_text(encoding='utf-8').replace(OLD,NEW)
(root/'manifest.webmanifest').write_text(manifest,encoding='utf-8')
ksw=(root/'kokmatch-sw.js').read_text(encoding='utf-8').replace(OLD,NEW)
(root/'kokmatch-sw.js').write_text(ksw,encoding='utf-8')
sw=(root/'sw.js').read_text(encoding='utf-8')
sw=re.sub(r"kokmatch-sw\.js\?v=\d+(?:\.\d+)+",f"kokmatch-sw.js?v={NEW}",sw)
(root/'sw.js').write_text(sw,encoding='utf-8')

latest_path=root/'latest-version.json'
latest=json.loads(latest_path.read_text(encoding='utf-8'))
latest.update({
 'version':int(latest.get('version',111))+1,
 'label':f'v{NEW}','semanticVersion':NEW,'build':f'v{NEW}',
 'updatedAt':datetime.now(timezone(timedelta(hours=9))).isoformat(timespec='seconds'),
 'note':'v6.72 아이폰·갤럭시·폴드 회원명부 태블릿형 우측 버튼레일 통일 · 게임대기 무깜빡임 부분갱신 안정화'
})
latest_path.write_text(json.dumps(latest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

# Build invariants.
assert "window.__kokmatchQueueStable672='6.72'" in js
assert 'waitMins(M(id)),draft.includes(id)' not in js[js.index('function queueSig17(){'):js.index("\n['draftClick'",js.index('function queueSig17(){'))]
assert 'refreshQueueTimes17();stabilize17' in js
assert "const existing=box.querySelector('.autoGameQueue658')" in js
assert 'grid-template-columns:40px minmax(0,1fr) 126px!important' in css
assert 'grid-template-columns:36px minmax(0,1fr) 111px!important' in css
assert f'/app-v{NEW}.js?v={NEW}' in index and f'/app-v{NEW}.css?v={NEW}' in index
assert f"KOKMATCH_SW_VERSION='{NEW}'" in ksw
print('built v6.72 mobile right-rail roster + stable queue polling')
