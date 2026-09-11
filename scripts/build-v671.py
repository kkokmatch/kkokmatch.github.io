from pathlib import Path
from datetime import datetime, timezone, timedelta
import json
import re

OLD='6.70'
NEW='6.71'
root=Path('.')

src=(root/f'app-v{OLD}.js').read_text(encoding='utf-8')
js=src.replace(OLD,NEW)

# 1) User-facing refresh copy: concise, consistent label.
js=js.replace('↻ 최신버전으로 새로고침','↻ 새로고침')
js=js.replace('↻ 최신 버전으로 새로고침','↻ 새로고침')
js=js.replace('↻ 최신 버전으로 업데이트 후 다시 로그인','↻ 새로고침')
js=js.replace('↻ 수동 새로고침','↻ 새로고침')

# 2) Header refresh must use the final in-place refresh handler, not the old hard-reload helper.
old_header="actions.querySelector('#headerRefreshV6')?.addEventListener('click',ev=>{ev.preventDefault();ev.stopPropagation();forceLatestHeaderRefreshV6()});"
new_header="actions.querySelector('#headerRefreshV6')?.addEventListener('click',ev=>{ev.preventDefault();ev.stopPropagation();forceUpdateApp()});"
if js.count(old_header)!=1:
    raise SystemExit(f'header refresh listener patch point count={js.count(old_header)}')
js=js.replace(old_header,new_header,1)

# Settings help text: refresh is now data refresh in the current view, not global logout/update.
old_note="${me.globalAdmin?'개발자 최신화 시 본인을 제외한 모든 로그인 세션을 종료합니다.':''} 현재 화면과 스크롤 위치는 유지합니다."
new_note="현재 화면을 유지한 채 최신 데이터를 다시 불러옵니다."
if old_note not in js:
    raise SystemExit('settings refresh note patch point missing')
js=js.replace(old_note,new_note,1)

# 3) Replace the last/canonical v6.35 button behavior: reload current state in place and preserve view + scroll.
old_force="""forceUpdateApp=async function(){
 const b=document.getElementById('forceUpdateBtn');
 const isGlobalAdmin=!!me?.globalAdmin;
 const callerToken=String(T||'');
 if(b){b.disabled=true;b.textContent=isGlobalAdmin?'전체 이용자 로그아웃·최신화 중...':'최신 운영본 확인 중...'}
 try{
  const target=await latest635();
  let result=null;
  if(isGlobalAdmin){
   if(!callerToken)throw new Error('개발자 로그인 세션을 확인할 수 없습니다. 다시 로그인해주세요.');
   if(!confirm('접속 중인 다른 모든 이용자를 로그아웃하고 최신 앱 버전으로 다시 접속시키겠습니까?')){if(b){b.disabled=false;b.textContent='↻ 새로고침'};return}
   result=await globalRefresh635(target,callerToken);
   try{sessionStorage.setItem('kokmatch_last_global_refresh635',JSON.stringify({at:Date.now(),count:Number(result?.loggedOutSessions)||0,target}))}catch{}
  }
  if(typeof window.__kokmatchHardReload633==='function')return window.__kokmatchHardReload633(target,isGlobalAdmin?'admin-global-refresh':'manual-refresh');
  location.replace('/?kmv='+encodeURIComponent(target)+'&r='+Date.now().toString(36));
 }catch(e){
  if(b){b.disabled=false;b.textContent='↻ 새로고침'}
  try{showError(e)}catch{alert(e?.message||String(e))}
 }
};
window.forceUpdateApp=forceUpdateApp;
"""
new_force="""let refreshBusy635=false;
function refreshButtons635(text='↻ 새로고침',disabled=false){
 for(const id of ['forceUpdateBtn','headerRefreshV6']){
  const el=document.getElementById(id);if(!el)continue;el.disabled=!!disabled;el.textContent=text;
 }
}
forceUpdateApp=async function(){
 if(refreshBusy635)return false;
 const view=String(currentView||'members');
 const gid=String(currentGroupId||'');
 const y=Math.max(0,Number(window.scrollY)||0);
 refreshBusy635=true;refreshButtons635('↻ 새로고침 중...',true);
 try{
  try{sessionStorage.removeItem(REFRESH_KEY)}catch{}
  if(gid)currentGroupId=gid;
  await loadState(true);
  if(view==='groups'&&me?.globalAdmin&&typeof loadGroups==='function')await loadGroups().catch(()=>{});
  currentView=view;
  document.querySelectorAll('.view').forEach(el=>el.classList.toggle('on',el.id===view));
  document.querySelectorAll('nav button').forEach(el=>el.classList.toggle('on',el.dataset.v===view));
  if(view==='members')try{window.__kokmatchStabilizeRoster637?.(true)}catch{}
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  window.scrollTo(0,y);
  return true;
 }catch(e){
  try{showError(e)}catch{alert(e?.message||String(e))}
  return false;
 }finally{
  refreshBusy635=false;refreshButtons635('↻ 새로고침',false);
 }
};
window.forceUpdateApp=forceUpdateApp;
window.__kokmatchRefreshCurrent635=forceUpdateApp;
"""
if js.count(old_force)!=1:
    raise SystemExit(f'canonical refresh block patch point count={js.count(old_force)}')
js=js.replace(old_force,new_force,1)

(root/f'app-v{NEW}.js').write_text(js,encoding='utf-8')

css=(root/f'app-v{OLD}.css').read_text(encoding='utf-8')
css += r'''

/* KokMatch v6.71: canonical responsive role-safe roster layout. */
#members .memberCard{min-width:0!important;box-sizing:border-box!important}
#members .memberCard>.memberInfo48{min-width:0!important;width:100%!important;max-width:100%!important;box-sizing:border-box!important}
#members .memberInfo48 .memberMainLine45,#members .memberInfo48 .name{min-width:0!important;max-width:100%!important;display:flex!important;align-items:center!important;gap:4px!important;flex-wrap:wrap!important}
#members .memberInfo48 .memberName45{min-width:0!important;max-width:100%!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important}
#members .memberInfo48 .memberMetaV6,#members .memberInfo48 .meta,#members .memberRosterFooterV6{min-width:0!important;max-width:100%!important;overflow-wrap:anywhere!important}
#members .memberRosterFooterV6{display:flex!important;align-items:center!important;gap:5px!important;flex-wrap:wrap!important}
#members .kmRosterActions621{box-sizing:border-box!important;min-width:0!important}
#members .kmRosterActions621 .status{box-sizing:border-box!important;overflow:hidden!important;text-overflow:ellipsis!important}
#members .kmRosterAction621{box-sizing:border-box!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:clip!important;touch-action:manipulation!important}

/* Phone/iPhone: member info is the first row, status/actions get their own full-width second row. */
@media(max-width:599px){
 #members .memberCard{
  grid-template-columns:42px minmax(0,1fr)!important;
  grid-template-rows:auto auto!important;
  column-gap:8px!important;row-gap:8px!important;
  align-items:start!important;
  padding:10px!important;
 }
 #members .memberCard>.avatar{grid-column:1!important;grid-row:1!important;align-self:start!important;justify-self:center!important}
 #members .memberCard>.memberInfo48{grid-column:2!important;grid-row:1!important;align-self:start!important;justify-self:stretch!important}
 #members .memberCard>.kmRosterActions621,
 #members .memberCard>.v6MemberActions,
 #members .memberCard>.memberActions48,
 #members .memberCard>.memberActions60,
 #members .memberCard>.memberActions64,
 #members .memberCard>.memberActions65{
  grid-column:1/-1!important;grid-row:2!important;
  width:100%!important;min-width:0!important;max-width:none!important;
  display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;
  align-items:center!important;gap:8px!important;
  margin:0!important;padding:8px 0 0!important;
  border-top:1px solid #edf1f6!important;
 }
 #members .kmRosterActions621 .status,
 #members .v6MemberActions .status,
 #members .memberActions48 .status,
 #members .memberActions60 .status,
 #members .memberActions64 .status,
 #members .memberActions65 .status{
  width:auto!important;min-width:0!important;max-width:none!important;
  margin:0!important;text-align:left!important;white-space:nowrap!important;
  font-size:11px!important;line-height:1.25!important;
 }
 #members .kmRosterBtns621,
 #members .memberBtns,
 #members .memberBtns61,
 #members .memberBtns64,
 #members .memberBtns65{
  width:auto!important;min-width:0!important;max-width:none!important;
  display:grid!important;grid-template-columns:repeat(3,46px)!important;grid-template-rows:34px!important;
  gap:5px!important;height:34px!important;min-height:34px!important;
  align-items:stretch!important;justify-content:end!important;overflow:visible!important;
 }
 #members .kmRosterSlot621,#members .kmRosterPlaceholder621,#members .kmRosterAction621{
  width:46px!important;min-width:46px!important;max-width:46px!important;
  height:34px!important;min-height:34px!important;max-height:34px!important;
 }
 #members .kmRosterAction621{font-size:10.5px!important;padding:5px 2px!important;line-height:1!important;border-radius:9px!important}
 #members .kmRosterReadonly621{grid-template-columns:minmax(0,1fr)!important}
 #members .kmRosterReadonly621 .kmRosterReadonlySlots637{display:none!important}
}

@media(max-width:359px){
 #members .memberCard{grid-template-columns:39px minmax(0,1fr)!important;padding:8px!important;column-gap:7px!important}
 #members .kmRosterBtns621,#members .memberBtns,#members .memberBtns61,#members .memberBtns64,#members .memberBtns65{grid-template-columns:repeat(3,43px)!important;gap:4px!important}
 #members .kmRosterSlot621,#members .kmRosterPlaceholder621,#members .kmRosterAction621{width:43px!important;min-width:43px!important;max-width:43px!important}
 #members .kmRosterAction621{font-size:10px!important}
}

/* Tablet/desktop: reserve a readable, fixed action rail and let member info use the remaining width. */
@media(min-width:600px){
 #members .memberCard{grid-template-columns:50px minmax(0,1fr) 156px!important;column-gap:12px!important;align-items:center!important}
 #members .memberCard>.avatar{grid-column:1!important;grid-row:1!important;justify-self:center!important;align-self:center!important}
 #members .memberCard>.memberInfo48{grid-column:2!important;grid-row:1!important;width:100%!important;max-width:100%!important;justify-self:stretch!important}
 #members .memberCard>.kmRosterActions621,
 #members .memberCard>.v6MemberActions,
 #members .memberCard>.memberActions48,
 #members .memberCard>.memberActions60,
 #members .memberCard>.memberActions64,
 #members .memberCard>.memberActions65{
  grid-column:3!important;grid-row:1!important;
  width:156px!important;min-width:156px!important;max-width:156px!important;
  justify-self:end!important;align-self:center!important;margin:0!important;padding:0!important;
 }
 #members .kmRosterActions621 .status,
 #members .v6MemberActions .status,
 #members .memberActions48 .status,
 #members .memberActions60 .status,
 #members .memberActions64 .status,
 #members .memberActions65 .status{
  width:156px!important;min-width:156px!important;max-width:156px!important;
  margin:0 0 5px!important;text-align:center!important;white-space:nowrap!important;
 }
 #members .kmRosterBtns621,
 #members .memberBtns,
 #members .memberBtns61,
 #members .memberBtns64,
 #members .memberBtns65{
  width:156px!important;min-width:156px!important;max-width:156px!important;
  display:grid!important;grid-template-columns:repeat(3,48px)!important;grid-template-rows:34px!important;
  gap:6px!important;height:34px!important;min-height:34px!important;
  justify-content:end!important;align-items:stretch!important;overflow:visible!important;
 }
 #members .kmRosterSlot621,#members .kmRosterPlaceholder621,#members .kmRosterAction621{
  width:48px!important;min-width:48px!important;max-width:48px!important;
  height:34px!important;min-height:34px!important;max-height:34px!important;
 }
 #members .kmRosterAction621{font-size:10.5px!important;padding:5px 2px!important;line-height:1!important;border-radius:9px!important}
 #members .kmRosterReadonly621 .kmRosterReadonlySlots637{visibility:hidden!important;pointer-events:none!important}
}
'''
(root/f'app-v{NEW}.css').write_text(css,encoding='utf-8')

index=(root/'index.html').read_text(encoding='utf-8').replace(OLD,NEW).replace('single-v670','single-v671').replace('session-coordinator-v670','session-coordinator-v671')
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
 'version':int(latest.get('version',110))+1,
 'label':f'v{NEW}','semanticVersion':NEW,'build':f'v{NEW}',
 'updatedAt':datetime.now(timezone(timedelta(hours=9))).isoformat(timespec='seconds'),
 'note':'v6.71 새로고침 현재화면 유지 · 아이폰/태블릿 회원명부 상태버튼 안정화 · 역할별 전 화면 구조 QA'
})
latest_path.write_text(json.dumps(latest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

assert f'/app-v{NEW}.js?v={NEW}' in index and f'/app-v{NEW}.css?v={NEW}' in index
assert f'kmv={NEW}' in manifest
assert f"KOKMATCH_SW_VERSION='{NEW}'" in ksw
assert f'kokmatch-sw.js?v={NEW}' in sw
assert "forceUpdateApp()});actions.querySelector('#logoutV6')" in js
assert "refreshButtons635('↻ 새로고침 중...',true)" in js
assert "await loadState(true);" in js
assert "currentView=view;" in js
assert "window.__kokmatchRefreshCurrent635=forceUpdateApp" in js
assert '현재 화면을 유지한 채 최신 데이터를 다시 불러옵니다.' in js
assert '↻ 최신버전으로 새로고침' not in js
assert '↻ 최신 버전으로 새로고침' not in js
assert 'KokMatch v6.71: canonical responsive role-safe roster layout.' in css
print('built v6.71')
