from pathlib import Path

JS=Path('app-v6.71.js')
CSS=Path('app-v6.71.css')
js=JS.read_text(encoding='utf-8')

# v6.22 still has a legacy DOM rail repair that runs after render and can overwrite
# the newer role-safe canonical controls. Keep its unrelated syncUi work, but stop
# this obsolete action-rail rewrite so v6.21+/v6.69 canonical controls remain the
# single source of truth for developer/manager/organizer/member/guest/temp roles.
needle="function repairMemberControlsV6(){\n"
if js.count(needle)!=1:
    raise SystemExit(f'legacy roster repair patch point count={js.count(needle)}')
js=js.replace(needle,needle+" // v6.71: obsolete roster rail rewriting disabled; canonical role-safe rail owns this DOM.\n return;\n",1)

# v6.69 canonicalization used an async scheduled repair and could be skipped by the
# no-flash resume guard even after the actor/role changed. Make explicit renderMembers
# calls canonicalize synchronously; background resume can still retain the guard.
old_guard="if(Date.now()<Number(window.__kokmatchResumeNoRailReplaceUntil638||0)&&!needs637())return;"
new_guard="if(!force&&Date.now()<Number(window.__kokmatchResumeNoRailReplaceUntil638||0)&&!needs637())return;"
if js.count(old_guard)!=1:
    raise SystemExit(f'canonical force guard patch point count={js.count(old_guard)}')
js=js.replace(old_guard,new_guard,1)
old_render="renderMembers=function(...args){const r=baseRender637.apply(this,args);schedule637(true);return r};"
new_render="renderMembers=function(...args){const r=baseRender637.apply(this,args);stabilize637(true);schedule637(false);return r};"
if js.count(old_render)!=1:
    raise SystemExit(f'canonical render wrapper patch point count={js.count(old_render)}')
js=js.replace(old_render,new_render,1)

# Manual refresh must not reuse a compact-state request that started before the
# button press, and it must still fetch on Members (v46 intentionally skips normal
# loadState there). Drain any in-flight load first, then perform one fresh full-state
# request through the authenticated canonical state API and apply that exact response.
old_refresh="""forceUpdateApp=async function(){
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
};"""
new_refresh="""forceUpdateApp=async function(){
 if(refreshBusy635)return false;
 const view=String(currentView||'members');
 const gid=String(currentGroupId||'');
 const y=Math.max(0,Number(window.scrollY)||0);
 refreshBusy635=true;refreshButtons635('↻ 새로고침 중...',true);
 try{
  try{sessionStorage.removeItem(REFRESH_KEY)}catch{}
  if(gid)currentGroupId=gid;
  // Drain a compact/background request that may have started before this click.
  try{await loadState(true)}catch(e){if(!T)throw e}
  // The manual refresh itself always owns a brand-new full-state request.
  const fresh=await request('state','GET',null,{groupId:gid||currentGroupId,manualRefresh:Date.now()});
  if(!fresh?.data)throw new Error('최신 상태를 불러오지 못했습니다.');
  if(gid&&String(currentGroupId||'')!==gid)return false;
  S=fresh.data;
  if(fresh.user)me=fresh.user;
  if(fresh.group)group=fresh.group;
  if(Array.isArray(fresh.groups))groups=fresh.groups;
  currentGroupId=String(fresh.group?.groupId||gid||currentGroupId||'');
  if(currentGroupId)localStorage.setItem(GROUP_KEY,currentGroupId);
  normalizeClient();
  try{if(currentGroupId&&Array.isArray(S?.members)&&S.members.length)window.__kokmatchSaveRoster654?.(currentGroupId,S.members,S?.adminBadgeVisibility)}catch{}
  currentView=view;
  renderAll();
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
};"""
if js.count(old_refresh)!=1:
    raise SystemExit(f'manual fresh-state patch point count={js.count(old_refresh)}')
js=js.replace(old_refresh,new_refresh,1)
JS.write_text(js,encoding='utf-8')

css=CSS.read_text(encoding='utf-8')
css += r'''

/* v6.71 final member-info positioning: remove obsolete v77 0.5cm offset/top shift.
   Grid column gap now owns spacing, so the info block must stay inside column 2. */
#members .memberCard>.memberInfo48,
#members .memberCard>.memberInfoV6,
#members .memberCard>.memberInfoV618,
#members .memberCard73.memberCard71>.memberInfo48{
 margin:0!important;margin-left:0!important;margin-right:0!important;
 position:static!important;left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;
 transform:none!important;min-width:0!important;max-width:100%!important;box-sizing:border-box!important;
}
@media(max-width:599px){
 #members .memberCard>.memberInfo48,
 #members .memberCard>.memberInfoV6,
 #members .memberCard>.memberInfoV618,
 #members .memberCard73.memberCard71>.memberInfo48{
  grid-column:2!important;grid-row:1!important;width:100%!important;max-width:100%!important;justify-self:stretch!important;
 }
}
@media(min-width:600px){
 #members .memberCard>.memberInfo48,
 #members .memberCard>.memberInfoV6,
 #members .memberCard>.memberInfoV618,
 #members .memberCard73.memberCard71>.memberInfo48{
  grid-column:2!important;grid-row:1!important;width:auto!important;max-width:100%!important;justify-self:stretch!important;overflow:hidden!important;
 }
 #members .memberCard>.kmRosterActions621,
 #members .memberCard>.v6MemberActions,
 #members .memberCard>.memberActions48,
 #members .memberCard>.memberActions60,
 #members .memberCard>.memberActions64,
 #members .memberCard>.memberActions65{
  grid-column:3!important;grid-row:1!important;margin:0!important;justify-self:end!important;
 }
}

/* v6.71 final physical action-button sizing: defeat legacy flex-basis constraints. */
@media(max-width:599px){
 #members .kmRosterAction621,
 #members .kmRosterActions621 button,
 #members .v6MemberActions button,
 #members .memberActions48 button,
 #members .memberActions60 button,
 #members .memberActions64 button,
 #members .memberActions65 button{
  flex:0 0 46px!important;flex-basis:46px!important;width:46px!important;min-width:46px!important;max-width:46px!important;
  height:34px!important;min-height:34px!important;max-height:34px!important;box-sizing:border-box!important;
 }
}
@media(max-width:359px){
 #members .kmRosterAction621,
 #members .kmRosterActions621 button,
 #members .v6MemberActions button,
 #members .memberActions48 button,
 #members .memberActions60 button,
 #members .memberActions64 button,
 #members .memberActions65 button{
  flex:0 0 43px!important;flex-basis:43px!important;width:43px!important;min-width:43px!important;max-width:43px!important;
 }
}
@media(min-width:600px){
 #members .kmRosterAction621,
 #members .kmRosterActions621 button,
 #members .v6MemberActions button,
 #members .memberActions48 button,
 #members .memberActions60 button,
 #members .memberActions64 button,
 #members .memberActions65 button{
  flex:0 0 48px!important;flex-basis:48px!important;width:48px!important;min-width:48px!important;max-width:48px!important;
  height:34px!important;min-height:34px!important;max-height:34px!important;box-sizing:border-box!important;
 }
}
'''
CSS.write_text(css,encoding='utf-8')

assert 'obsolete roster rail rewriting disabled' in js
assert 'if(!force&&Date.now()<Number(window.__kokmatchResumeNoRailReplaceUntil638||0)&&!needs637())return;' in js
assert 'stabilize637(true);schedule637(false)' in js
assert "manualRefresh:Date.now()" in js
assert "const fresh=await request('state','GET'" in js
assert 'remove obsolete v77 0.5cm offset/top shift' in css
assert 'margin-left:0!important' in css
assert 'flex-basis:46px!important' in css
assert '#members .kmRosterActions621 button' in css
assert 'flex-basis:48px!important' in css
print('patched v6.71 canonical roster layout and guaranteed fresh in-place refresh')
