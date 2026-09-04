from pathlib import Path
from datetime import datetime, timezone, timedelta
import json, re, shutil

OLD='6.40'; NEW='6.41'; root=Path('.')
js=(root/f'app-v{OLD}.js').read_text(encoding='utf-8').replace(OLD,NEW)
patch=r'''

/* KokMatch v6.41: preflight + atomic conflict recovery for multi-organizer game creation */
(()=>{
'use strict';
if(window.__kokmatchCreateConflict641)return;
window.__kokmatchCreateConflict641=true;
const CREATE641='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-create-v641';
let registerBusy641=false;

async function createPending641(players){
 const token=String(T||'');
 const r=await fetch(CREATE641,{method:'POST',headers:{'content-type':'application/json',...(token?{authorization:'Bearer '+token}:{})},body:JSON.stringify({groupId:currentGroupId,players,forceRepeat:true}),cache:'no-store'});
 const x=await r.json().catch(()=>({error:'편성대기 등록 통신 오류'}));
 if(!r.ok){
  if(r.status===401){reloginLatest(token);throw new Error('로그인이 만료되었습니다.')}
  const e=new Error(x.error||'편성대기 등록에 실패했습니다.');e.payload=x;throw e;
 }
 return x;
}

registerDraft=async function(forceRepeat=false){
 if(registerBusy641)return;
 const ps=draft.filter(Boolean);
 if(!ps.length)return alert('1명 이상 선택해주세요.');
 if(ps.length<4&&!confirm(`현재 ${ps.length}명입니다. 4명이 안 됐는데 편성대기로 등록하시겠습니까?`))return;
 registerBusy641=true;
 const snapshot={queue:S.queue.slice(),pending:S.pendingGames.map(g=>({...g,players:[...(g.players||[])]})),states:ps.map(id=>[id,{state:M(id)?.state,joinedAt:M(id)?.joinedAt}]),draft:draft.slice()};
 const tmp='v641tmp'+Date.now();
 S.pendingGames.push({id:tmp,players:ps.slice(),createdAt:Date.now()});
 S.queue=S.queue.filter(id=>!ps.includes(id));
 ps.forEach(id=>{const m=M(id);if(m)m.state='matched'});
 draft=[null,null,null,null];renderHeader();renderMembers();renderQueue();
 try{
  const x=await createPending641(ps);
  if(x?.data){S=x.data;normalizeClient();draft=[null,null,null,null];renderAll()}
 }catch(e){
  const p=e?.payload||{};
  if(p.warning==='selection_conflict'&&p.data){
   S=p.data;normalizeClient();
   const blocked=new Set((p.conflictMemberIds||[]).map(String));
   draft=snapshot.draft.map(id=>id&&!blocked.has(String(id))&&S.queue.includes(id)?id:null);
   renderAll();
   const names=Array.isArray(p.conflictMemberNames)&&p.conflictMemberNames.length?p.conflictMemberNames.join(', '):'선택한';
   alert(`${names} 회원이 다른 게임에 먼저 편성되었습니다.\n충돌한 자리만 비우고 최신 대기명단으로 반영했습니다.`);
  }else if(p.data){
   S=p.data;normalizeClient();draft=snapshot.draft.map(id=>id&&S.queue.includes(id)?id:null);renderAll();showError(e);
  }else{
   S.queue=snapshot.queue;S.pendingGames=snapshot.pending;snapshot.states.forEach(([id,v])=>Object.assign(M(id)||{},v));draft=snapshot.draft;renderAll();showError(e);
  }
 }finally{registerBusy641=false}
};
window.__kokmatchCreatePending641=createPending641;
})();
'''
js += patch
(root/f'app-v{NEW}.js').write_text(js,encoding='utf-8')
(root/f'app-v{NEW}.css').write_text((root/f'app-v{OLD}.css').read_text(encoding='utf-8'),encoding='utf-8')

# immutable operation archive of v6.40
archive=root/'versions'/f'v{OLD}';archive.mkdir(parents=True,exist_ok=True)
shutil.copy2(root/f'app-v{OLD}.js',archive/f'app-v{OLD}.js')
shutil.copy2(root/f'app-v{OLD}.css',archive/f'app-v{OLD}.css')
old_index=(root/'index.html').read_text(encoding='utf-8')
archive_index=old_index.replace(f'/app-v{OLD}.js',f'../../app-v{OLD}.js').replace(f'/app-v{OLD}.css',f'../../app-v{OLD}.css').replace('/manifest.webmanifest', '../../manifest.webmanifest').replace('/icons/','../../icons/').replace("navigator.serviceWorker.register('/kokmatch-sw.js'","navigator.serviceWorker.register('../../kokmatch-sw.js'")
(archive/'index.html').write_text(archive_index,encoding='utf-8')

(root/'index.html').write_text(old_index.replace(OLD,NEW),encoding='utf-8')
(root/'manifest.webmanifest').write_text((root/'manifest.webmanifest').read_text(encoding='utf-8').replace(OLD,NEW),encoding='utf-8')
(root/'kokmatch-sw.js').write_text((root/'kokmatch-sw.js').read_text(encoding='utf-8').replace(OLD,NEW),encoding='utf-8')
(root/'sw.js').write_text(re.sub(r'kokmatch-sw\.js\?v=\d+(?:\.\d+)+',f'kokmatch-sw.js?v={NEW}',(root/'sw.js').read_text(encoding='utf-8')),encoding='utf-8')
latest=json.loads((root/'latest-version.json').read_text(encoding='utf-8'))
latest.update({'version':int(latest.get('version',80))+1,'label':f'v{NEW}','semanticVersion':NEW,'build':f'v{NEW}','updatedAt':datetime.now(timezone(timedelta(hours=9))).isoformat(timespec='seconds'),'note':'v6.41 다중 운영진 동시편성 충돌 안내 · 등록 직전 서버 재검증 · 충돌 회원 이름 표시 · 충돌 자리만 비우고 최신 대기명단 즉시 동기화'})
(root/'latest-version.json').write_text(json.dumps(latest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
assert 'kokmatch-create-v641' in js and 'selection_conflict' in js and 'blocked=new Set' in js
assert f'/app-v{NEW}.js?v={NEW}' in (root/'index.html').read_text(encoding='utf-8')
print('built v6.41')
