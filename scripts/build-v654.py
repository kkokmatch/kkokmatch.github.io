from pathlib import Path
import json, shutil
from datetime import datetime, timezone, timedelta

OLD='6.53'; NEW='6.54'; ROOT=Path('.')
old_js=ROOT/f'app-v{OLD}.js'; old_css=ROOT/f'app-v{OLD}.css'
if not old_js.exists() or not old_css.exists(): raise SystemExit('v6.53 runtime missing')
js=old_js.read_text(encoding='utf-8').replace(OLD,NEW)
css=old_css.read_text(encoding='utf-8').replace(OLD,NEW)

if 'kokmatch-roster-v653' not in js: raise SystemExit('old roster endpoint missing')
js=js.replace('kokmatch-roster-v653','kokmatch-roster-v654')

needle="try{sessionStorage.setItem('kokmatch_runtime_version','6.54')}catch{}\n"
helper=r'''

/* v6.54: persistent group-scoped roster cache for PWA/mobile cold starts. */
(()=>{
const P654='kokmatch_roster_cache_v654_',TTL654=86400000;
const K654=g=>P654+encodeURIComponent(String(g||''));
const V654=(c,g)=>!!c&&String(c.groupId||'')===String(g||'')&&Date.now()-Number(c.at||0)<=TTL654&&Array.isArray(c.members)&&c.members.length>0;
window.__kokmatchSaveRoster654=function(g,m,b='all'){
 try{if(!g||!Array.isArray(m)||!m.length)return false;const c={groupId:String(g),at:Date.now(),members:m.map(x=>({...x})),adminBadgeVisibility:String(b||'all')};window.__kokmatchFullRosterCache654=c;localStorage.setItem(K654(g),JSON.stringify(c));return true}catch{return false}
};
window.__kokmatchReadRoster654=function(g){
 try{let c=window.__kokmatchFullRosterCache654;if(!V654(c,g))c=JSON.parse(localStorage.getItem(K654(g))||'null');if(!V654(c,g))return null;c={...c,members:c.members.map(x=>({...x}))};window.__kokmatchFullRosterCache654=c;return c}catch{return null}
};
})();
'''
if needle not in js: raise SystemExit('runtime marker missing')
js=js.replace(needle,needle+helper,1)

old_compact="window.__kokmatchFullRosterCache653={groupId:requestedGroup,at:Date.now(),members:curMembers.map(m=>({...m})),adminBadgeVisibility:String(S?.adminBadgeVisibility||'all')};"
if old_compact not in js: raise SystemExit('compact cache bridge missing')
js=js.replace(old_compact,"window.__kokmatchSaveRoster654?.(requestedGroup,curMembers,S?.adminBadgeVisibility);",1)

old_cache="""function cacheRoster653(gid,members,badge='all'){\n try{if(!gid||!Array.isArray(members)||!members.length)return;window.__kokmatchFullRosterCache653={groupId:String(gid),at:Date.now(),members:members.map(m=>({...m})),adminBadgeVisibility:String(badge||'all')}}catch{}\n}\nfunction restoreRoster653(gid){\n try{\n  const c=window.__kokmatchFullRosterCache653;if(!c||String(c.groupId)!==String(gid)||Date.now()-Number(c.at||0)>300000||!Array.isArray(c.members)||!c.members.length)return false;\n  const live=new Map((Array.isArray(S?.members)?S.members:[]).map(m=>[String(m?.id||''),m]));\n  const members=c.members.map(m=>{const x=live.get(String(m?.id||''));return x?{...m,...x}:m});\n  S={...(S||{}),members,adminBadgeVisibility:String(c.adminBadgeVisibility||S?.adminBadgeVisibility||'all')};\n  window.__kokmatchMemberCount46=members.length;window.__kokmatchMemberCountGroup46=String(gid);normalizeClient();memberReady42=true;memberGroup42=String(gid);memberLoadedAt42=Date.now();return true;\n }catch{return false}\n}"""
new_cache="""function cacheRoster654(gid,members,badge='all'){try{return !!window.__kokmatchSaveRoster654?.(gid,members,badge)}catch{return false}}\nfunction restoreRoster654(gid){\n try{\n  const c=window.__kokmatchReadRoster654?.(gid);if(!c)return false;\n  const live=new Map((Array.isArray(S?.members)?S.members:[]).map(m=>[String(m?.id||''),m]));\n  const members=c.members.map(m=>{const x=live.get(String(m?.id||''));return x?{...m,...x}:m});\n  S={...(S||{}),members,adminBadgeVisibility:String(c.adminBadgeVisibility||S?.adminBadgeVisibility||'all')};\n  window.__kokmatchMemberCount46=members.length;window.__kokmatchMemberCountGroup46=String(gid);normalizeClient();memberReady42=true;memberGroup42=String(gid);memberLoadedAt42=Date.now();return true;\n }catch{return false}\n}"""
if old_cache not in js: raise SystemExit('v6.53 cache functions missing')
js=js.replace(old_cache,new_cache,1)
js=js.replace('cacheRoster653(','cacheRoster654(').replace('restoreRoster653(','restoreRoster654(').replace('fullStateFallback653(','fullStateFallback654(')
js=js.replace("rosterFallback','653'","rosterFallback','654'").replace("source:'state-fallback-v653'","source:'state-fallback-v654'")

if 'setTimeout(()=>ctl.abort(),2800)' not in js: raise SystemExit('primary 2.8s timeout missing')
js=js.replace('setTimeout(()=>ctl.abort(),2800)','setTimeout(()=>ctl.abort(),6500)',1)
idx=js.find('async function fullStateFallback654')
if idx<0: raise SystemExit('fallback function missing')
pos=js.find('setTimeout(()=>ctl.abort(),5000)',idx)
if pos<0: raise SystemExit('fallback 5s timeout missing')
js=js[:pos]+js[pos:].replace('setTimeout(()=>ctl.abort(),5000)','setTimeout(()=>ctl.abort(),8000)',1)
js=js.replace("const msg=primaryErr?.name==='AbortError'?'회원명단 서버 응답이 늦어 자동 우회했지만 연결이 계속 지연되고 있습니다. 다시 시도해주세요.':(fallbackErr?.message||primaryErr?.message||'회원명단을 불러오지 못했습니다.');","const msg=fallbackErr?.message||primaryErr?.message||'회원명단 연결이 원활하지 않습니다. 네트워크 상태를 확인하고 다시 시도해주세요.';",1)

for bad in ['kokmatch-roster-v653','cacheRoster653(','restoreRoster653(','fullStateFallback653(']:
    if bad in js: raise SystemExit('obsolete runtime remains: '+bad)
for need in ['kokmatch-roster-v654','kokmatch_roster_cache_v654_','__kokmatchSaveRoster654','__kokmatchReadRoster654','setTimeout(()=>ctl.abort(),6500)','setTimeout(()=>ctl.abort(),8000)']:
    if need not in js: raise SystemExit('missing invariant: '+need)

(ROOT/f'app-v{NEW}.js').write_text(js,encoding='utf-8')
(ROOT/f'app-v{NEW}.css').write_text(css,encoding='utf-8')

archive=ROOT/'versions'/f'v{OLD}'; archive.mkdir(parents=True,exist_ok=True)
for name in [f'app-v{OLD}.js',f'app-v{OLD}.css','index.html','manifest.webmanifest','kokmatch-sw.js','sw.js','latest-version.json']:
    p=ROOT/name
    if p.exists(): shutil.copy2(p,archive/name)
for name in ['index.html','manifest.webmanifest','kokmatch-sw.js','sw.js']:
    p=ROOT/name
    if not p.exists(): continue
    s=p.read_text(encoding='utf-8').replace(f'app-v{OLD}.js',f'app-v{NEW}.js').replace(f'app-v{OLD}.css',f'app-v{NEW}.css').replace(OLD,NEW)
    p.write_text(s,encoding='utf-8')

kst=timezone(timedelta(hours=9))
latest={'version':94,'label':'v6.54','semanticVersion':'6.54','build':'v6.54','updatedAt':datetime.now(kst).replace(microsecond=0).isoformat(),'note':'v6.54 회원명부 지연 개선 · 경량 roster API · 6.5초 허용 · 8초 자동우회 · 24시간 모임별 영구캐시 · 재실행 즉시복원'}
(ROOT/'latest-version.json').write_text(json.dumps(latest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('built v6.54')
