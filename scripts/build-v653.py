from pathlib import Path
from datetime import datetime
from zoneinfo import ZoneInfo
import json,re,shutil

ROOT=Path('.')
OLD='6.52'; NEW='6.53'
old_js=ROOT/f'app-v{OLD}.js'; old_css=ROOT/f'app-v{OLD}.css'
new_js=ROOT/f'app-v{NEW}.js'; new_css=ROOT/f'app-v{NEW}.css'
assert old_js.exists() and old_css.exists()

arc=ROOT/'versions'/f'v{OLD}'
arc.mkdir(parents=True,exist_ok=True)
for p in [old_js,old_css,ROOT/'index.html',ROOT/'kokmatch-sw.js',ROOT/'sw.js',ROOT/'latest-version.json']:
    if p.exists(): shutil.copy2(p,arc/p.name)

js=old_js.read_text(encoding='utf-8').replace(OLD,NEW)

# Use the new lightweight roster Edge Function.
js=js.replace("const ROSTER42='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-roster-v47';","const ROSTER42='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-roster-v653';",1)

# Make member-count metadata group-scoped so switching groups cannot force a false 'partial roster'.
old_compact="window.__kokmatchMemberCount46=Number(x.memberCount||0);\n const sig=JSON.stringify([x.data,x.user?.role,x.user?.globalAdmin,x.group?.groupId]);const changed=sig!==lastCompactSig46;lastCompactSig46=sig;\n S=x.data;"
new_compact="""try{
  const curMembers=Array.isArray(S?.members)?S.members:[],prevExpected=Number(window.__kokmatchMemberCount46||0),prevGroup=String(window.__kokmatchMemberCountGroup46||requestedGroup||'');
  if(curMembers.length&&prevGroup===requestedGroup&&(!prevExpected||curMembers.length>=prevExpected)){
   window.__kokmatchFullRosterCache653={groupId:requestedGroup,at:Date.now(),members:curMembers.map(m=>({...m})),adminBadgeVisibility:String(S?.adminBadgeVisibility||'all')};
  }
 }catch{}
 window.__kokmatchMemberCount46=Number(x.memberCount||0);window.__kokmatchMemberCountGroup46=requestedGroup;
 const sig=JSON.stringify([x.data,x.user?.role,x.user?.globalAdmin,x.group?.groupId]);const changed=sig!==lastCompactSig46;lastCompactSig46=sig;
 S=x.data;"""
assert old_compact in js, 'compact state marker not found'
js=js.replace(old_compact,new_compact,1)

old_has="function hasFullRoster42(){const got=Array.isArray(S?.members)?S.members.length:0,expected=Number(window.__kokmatchMemberCount46||0);return got>0&&(!expected||got>=expected)}"
new_has="""function hasFullRoster42(){const got=Array.isArray(S?.members)?S.members.length:0,gid=String(currentGroupId||''),eg=String(window.__kokmatchMemberCountGroup46||gid),expected=eg===gid?Number(window.__kokmatchMemberCount46||0):0;return got>0&&(!expected||got>=expected)}
function cacheRoster653(gid,members,badge='all'){
 try{if(!gid||!Array.isArray(members)||!members.length)return;window.__kokmatchFullRosterCache653={groupId:String(gid),at:Date.now(),members:members.map(m=>({...m})),adminBadgeVisibility:String(badge||'all')}}catch{}
}
function restoreRoster653(gid){
 try{
  const c=window.__kokmatchFullRosterCache653;if(!c||String(c.groupId)!==String(gid)||Date.now()-Number(c.at||0)>300000||!Array.isArray(c.members)||!c.members.length)return false;
  const live=new Map((Array.isArray(S?.members)?S.members:[]).map(m=>[String(m?.id||''),m]));
  const members=c.members.map(m=>{const x=live.get(String(m?.id||''));return x?{...m,...x}:m});
  S={...(S||{}),members,adminBadgeVisibility:String(c.adminBadgeVisibility||S?.adminBadgeVisibility||'all')};
  window.__kokmatchMemberCount46=members.length;window.__kokmatchMemberCountGroup46=String(gid);normalizeClient();memberReady42=true;memberGroup42=String(gid);memberLoadedAt42=Date.now();return true;
 }catch{return false}
}"""
assert old_has in js, 'hasFullRoster source changed'
js=js.replace(old_has,new_has,1)

old_apply="window.__kokmatchMemberCount46=Number(x?.memberCount||members.length);normalizeClient();memberReady42=true;memberGroup42=gid;memberLoadedAt42=Date.now();return true;"
new_apply="window.__kokmatchMemberCount46=Number(x?.memberCount||members.length);window.__kokmatchMemberCountGroup46=String(gid);normalizeClient();memberReady42=true;memberGroup42=gid;memberLoadedAt42=Date.now();cacheRoster653(gid,members,S?.adminBadgeVisibility);return true;"
assert old_apply in js, 'applyRoster source changed'
js=js.replace(old_apply,new_apply,1)

# Replace the brittle single 8s request with fast primary + automatic full-state fallback.
pat=re.compile(r"async function fetchRoster42\(force=false\)\{.*?\n\}\nfunction renderFullPage42\(\)\{",re.S)
m=pat.search(js);assert m,'fetchRoster42 block not found'
replacement="""async function fullStateFallback653(gid){
 const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),5000);
 try{
  const u=new URL(API);u.searchParams.set('api','state');u.searchParams.set('groupId',gid);u.searchParams.set('rosterFallback','653');u.searchParams.set('t',Date.now());
  const r=await fetch(u,{headers:{'content-type':'application/json',authorization:'Bearer '+T},cache:'no-store',signal:ctl.signal});const x=await r.json().catch(()=>({}));
  if(!r.ok){if(r.status===401){reloginLatest();throw new Error('로그인이 만료되었습니다.')}throw new Error(x.error||'회원명단 보조 조회에 실패했습니다.')}
  const members=Array.isArray(x?.data?.members)?x.data.members:[];
  if(!members.length&&Number(window.__kokmatchMemberCount46||0)>0)throw new Error('회원명단 보조 조회 결과가 비어 있습니다.');
  return {members,memberCount:members.length,adminBadgeVisibility:String(x?.data?.adminBadgeVisibility||S?.adminBadgeVisibility||'all'),source:'state-fallback-v653'};
 }catch(e){if(e?.name==='AbortError')throw new Error('회원명단 보조 조회도 지연되고 있습니다.');throw e}finally{clearTimeout(timer)}
}
async function fetchRoster42(force=false){
 if(!T||!currentGroupId)return null;const gid=String(currentGroupId);
 if(!force&&memberReady42&&memberGroup42===gid&&Date.now()-memberLoadedAt42<30000)return {members:S.members,memberCount:S.members?.length||0};
 if(!force&&restoreRoster653(gid)){
  queueMicrotask(()=>{fetchRoster42(true).then(()=>{if(currentView==='members')renderFullPage42()}).catch(()=>{})});
  return {members:S.members,memberCount:S.members?.length||0,cached:true};
 }
 if(memberReq42&&memberReqGroup42===gid)return memberReq42;
 memberGroup42=gid;if(!hasFullRoster42())showRosterLoading42();
 const promise=(async()=>{
  let primaryErr=null;
  const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),2800);
  try{
   const u=new URL(ROSTER42);u.searchParams.set('groupId',gid);u.searchParams.set('t',Date.now());
   const r=await fetch(u,{headers:{authorization:'Bearer '+T},cache:'no-store',signal:ctl.signal});const x=await r.json().catch(()=>({}));
   if(!r.ok){if(r.status===401){reloginLatest();throw new Error('로그인이 만료되었습니다.')}throw new Error(x.error||'회원명단을 불러오지 못했습니다.')}
   if(String(currentGroupId||'')!==gid)return x;applyRoster42(x,gid);return x;
  }catch(e){primaryErr=e;if(e?.message==='로그인이 만료되었습니다.')throw e}
  finally{clearTimeout(timer)}
  try{
   const x=await fullStateFallback653(gid);if(String(currentGroupId||'')!==gid)return x;applyRoster42(x,gid);return x;
  }catch(fallbackErr){
   if(hasFullRoster42()){memberReady42=true;memberGroup42=gid;memberLoadedAt42=Date.now();cacheRoster653(gid,S.members,S?.adminBadgeVisibility);return {members:S.members,memberCount:S.members.length,stale:true}}
   const msg=primaryErr?.name==='AbortError'?'회원명단 서버 응답이 늦어 자동 우회했지만 연결이 계속 지연되고 있습니다. 다시 시도해주세요.':(fallbackErr?.message||primaryErr?.message||'회원명단을 불러오지 못했습니다.');
   throw new Error(msg);
  }
 })();
 memberReq42=promise;memberReqGroup42=gid;
 try{return await promise}finally{if(memberReq42===promise){memberReq42=null;memberReqGroup42=''}}
}
function renderFullPage42(){"""
js=js[:m.start()]+replacement+js[m.end():]

# When the current state already contains a full roster, remember it for instant restoration later.
old_ready="if(hasFullRoster42()){memberReady42=true;memberGroup42=String(currentGroupId||'');memberLoadedAt42=Date.now();return renderMembersPrev42()}"
new_ready="if(hasFullRoster42()){memberReady42=true;memberGroup42=String(currentGroupId||'');memberLoadedAt42=Date.now();cacheRoster653(memberGroup42,S.members,S?.adminBadgeVisibility);return renderMembersPrev42()}"
assert old_ready in js
js=js.replace(old_ready,new_ready,1)

# Normal entry should use stale-while-revalidate cache, while explicit refresh remains force=true.
js=js.replace("showRosterLoading42();if(!memberReq42)enterMembers42(true);return;","showRosterLoading42();if(!memberReq42)enterMembers42(false);return;",1)

new_js.write_text(js,encoding='utf-8')
new_css.write_text(old_css.read_text(encoding='utf-8').replace(OLD,NEW),encoding='utf-8')

idx=(ROOT/'index.html').read_text(encoding='utf-8').replace(OLD,NEW)
idx=idx.replace("single-v652","single-v653").replace("session-coordinator-v652","session-coordinator-v653")
(ROOT/'index.html').write_text(idx,encoding='utf-8')
for name in ['kokmatch-sw.js','sw.js','manifest.webmanifest']:
 p=ROOT/name
 if p.exists(): p.write_text(p.read_text(encoding='utf-8').replace(OLD,NEW),encoding='utf-8')

latest={'version':93,'label':'v6.53','semanticVersion':'6.53','build':'v6.53','updatedAt':datetime.now(ZoneInfo('Asia/Seoul')).isoformat(timespec='seconds'),'note':'v6.53 회원명부 지연 복구 · 경량 roster API · 2.8초 자동 우회 · 전체회원 캐시 즉시복원 · 모임별 인원수 메타데이터 분리'}
(ROOT/'latest-version.json').write_text(json.dumps(latest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

assert 'kokmatch-roster-v653' in js
assert 'fullStateFallback653' in js
assert 'restoreRoster653' in js
assert 'setTimeout(()=>ctl.abort(),2800)' in js
assert 'memberCountGroup46' in js
assert '회원명단 응답이 지연되고 있습니다. 다시 시도해주세요.' not in js
assert f'app-v{NEW}.js?v={NEW}' in idx and f'app-v{NEW}.css?v={NEW}' in idx
print('v6.53 roster resilience build OK')
