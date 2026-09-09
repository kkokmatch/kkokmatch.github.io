from pathlib import Path
from datetime import datetime
from zoneinfo import ZoneInfo
import json, shutil

ROOT=Path('.')
OLD='6.54'; NEW='6.55'
old_js=ROOT/f'app-v{OLD}.js'; old_css=ROOT/f'app-v{OLD}.css'
new_js=ROOT/f'app-v{NEW}.js'; new_css=ROOT/f'app-v{NEW}.css'
assert old_js.exists() and old_css.exists(), 'v6.54 runtime missing'

arc=ROOT/'versions'/f'v{OLD}'
arc.mkdir(parents=True,exist_ok=True)
for p in [old_js,old_css,ROOT/'index.html',ROOT/'kokmatch-sw.js',ROOT/'sw.js',ROOT/'latest-version.json']:
    if p.exists(): shutil.copy2(p,arc/p.name)

js=old_js.read_text(encoding='utf-8').replace(OLD,NEW)
css=old_css.read_text(encoding='utf-8').replace(OLD,NEW)

old_compact=""" window.__kokmatchMemberCount46=Number(x.memberCount||0);window.__kokmatchMemberCountGroup46=requestedGroup;
 const sig=JSON.stringify([x.data,x.user?.role,x.user?.globalAdmin,x.group?.groupId]);const changed=sig!==lastCompactSig46;lastCompactSig46=sig;
 S=x.data;me=x.user;group=x.group;groups=x.groups||groups;currentGroupId=group.groupId;localStorage.setItem(GROUP_KEY,currentGroupId);normalizeClient();if(changed)renderAll();
 return x;"""
new_compact=""" /* compact-preserve-full-roster-v655: operational polling must never destroy the canonical full roster. */
 const expected46=Number(x.memberCount||0);let nextData46=x.data||{};
 try{
  let base46=Array.isArray(S?.members)?S.members:[];
  const cached46=window.__kokmatchReadRoster654?.(requestedGroup);
  if((!base46.length||(expected46&&base46.length<expected46))&&Array.isArray(cached46?.members)&&cached46.members.length&&(!expected46||cached46.members.length>=expected46))base46=cached46.members;
  if(base46.length&&(!expected46||base46.length>=expected46)){
   const incoming46=Array.isArray(x?.data?.members)?x.data.members:[],delta46=new Map(incoming46.map(m=>[String(m?.id||''),m]));
   const merged46=base46.map(m=>{const d=delta46.get(String(m?.id||''));return d?{...m,...d}:m});
   const seen46=new Set(merged46.map(m=>String(m?.id||'')));for(const m of incoming46){const id=String(m?.id||'');if(id&&!seen46.has(id)){merged46.push(m);seen46.add(id)}}
   nextData46={...(x.data||{}),members:merged46};window.__kokmatchSaveRoster654?.(requestedGroup,merged46,nextData46?.adminBadgeVisibility||S?.adminBadgeVisibility);
  }
 }catch(e){console.warn('compact roster preserve v6.55',e)}
 window.__kokmatchMemberCount46=expected46;window.__kokmatchMemberCountGroup46=requestedGroup;
 const sig=JSON.stringify([nextData46,x.user?.role,x.user?.globalAdmin,x.group?.groupId]);const changed=sig!==lastCompactSig46;lastCompactSig46=sig;
 S=nextData46;me=x.user;group=x.group;groups=x.groups||groups;currentGroupId=group.groupId;localStorage.setItem(GROUP_KEY,currentGroupId);normalizeClient();if(changed)renderAll();
 return x;"""
assert old_compact in js, 'compactState46 assignment block changed'
js=js.replace(old_compact,new_compact,1)

# Keep the live dashboard, but make its headline explicit that it uses the preserved canonical roster.
js=js.replace("<p>${esc652(group?.name||'현재 모임')} · 상태 자동동기화 약 10초</p>","<p>${esc652(group?.name||'현재 모임')} · 운영상태 자동동기화 · 전체 회원명부 보존</p>",1)

new_js.write_text(js,encoding='utf-8')
new_css.write_text(css,encoding='utf-8')

idx=(ROOT/'index.html').read_text(encoding='utf-8').replace(OLD,NEW)
idx=idx.replace("single-v653","single-v655").replace("session-coordinator-v653","session-coordinator-v655")
(ROOT/'index.html').write_text(idx,encoding='utf-8')
for name in ['kokmatch-sw.js','sw.js','manifest.webmanifest']:
    p=ROOT/name
    if p.exists(): p.write_text(p.read_text(encoding='utf-8').replace(OLD,NEW),encoding='utf-8')

latest={
 'version':95,'label':'v6.55','semanticVersion':'6.55','build':'v6.55',
 'updatedAt':datetime.now(ZoneInfo('Asia/Seoul')).isoformat(timespec='seconds'),
 'note':'v6.55 실시간 운영현황-회원명부 충돌 제거 · 경량 상태조회가 전체명단을 덮어쓰지 않음 · 명단 재조회 루프 차단'
}
(ROOT/'latest-version.json').write_text(json.dumps(latest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

assert 'compact-preserve-full-roster-v655' in js
assert 'opsDashboard652' in js, 'live dashboard unexpectedly removed'
assert f'app-v{NEW}.js?v={NEW}' in idx and f'app-v{NEW}.css?v={NEW}' in idx
print('v6.55 dashboard/roster conflict build OK')
