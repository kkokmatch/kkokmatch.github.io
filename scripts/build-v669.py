from pathlib import Path
from datetime import datetime, timezone, timedelta
import json
import re

OLD='6.68'
NEW='6.69'
root=Path('.')

src=(root/f'app-v{OLD}.js').read_text(encoding='utf-8')
js=src.replace(OLD,NEW)

old_decl="let resetTimer71=null,registerBusy71=false;"
new_decl="let resetTimer71=null,registerBusy71=false,explicitLogin71=false,loginStartToken71='';"
if js.count(old_decl)!=1:
    raise SystemExit(f'v71 declaration patch point count={js.count(old_decl)}')
js=js.replace(old_decl,new_decl,1)

old_block="""function armDailyReset71(){
 if(!me||!T)return;
 const d=businessDay71(),saved=localStorage.getItem(SESSION_DAY71)||'';
 if(saved&&saved!==d){forceDailyLogout71();return}
 localStorage.setItem(SESSION_DAY71,d);
 if(resetTimer71)clearTimeout(resetTimer71);
 resetTimer71=setTimeout(forceDailyLogout71,Math.max(1000,nextResetAt71()-Date.now()+700));
}
const loadState70=loadState;
loadState=async function(...args){const x=await loadState70(...args);armDailyReset71();return x};
const logout70=logout;
"""
new_block="""function armDailyReset71(){
 if(!me||!T)return;
 const d=businessDay71(),saved=localStorage.getItem(SESSION_DAY71)||'';
 if(saved&&saved!==d){
  // At 05:00 an already-authenticated session must still be expired. During an
  // explicit re-login, however, never let the previous business-day marker
  // destroy the newly issued token. Wait while credentials are being checked,
  // then accept the new token as the first session of the current business day.
  if(!explicitLogin71){forceDailyLogout71();return}
  if(String(T||'')===loginStartToken71)return;
  localStorage.setItem(SESSION_DAY71,d);
 }
 if(!saved)localStorage.setItem(SESSION_DAY71,d);
 if(resetTimer71)clearTimeout(resetTimer71);
 resetTimer71=setTimeout(forceDailyLogout71,Math.max(1000,nextResetAt71()-Date.now()+700));
}
const loadState70=loadState;
loadState=async function(...args){const x=await loadState70(...args);armDailyReset71();return x};
const submitLogin70=submitLogin;
submitLogin=async function(...args){
 const before=String(T||'');
 explicitLogin71=true;loginStartToken71=before;
 try{return await submitLogin70.apply(this,args)}
 finally{explicitLogin71=false;loginStartToken71=''}
};
const logout70=logout;
"""
if js.count(old_block)!=1:
    raise SystemExit(f'v71 daily reset patch point count={js.count(old_block)}')
js=js.replace(old_block,new_block,1)

(root/f'app-v{NEW}.js').write_text(js,encoding='utf-8')
(root/f'app-v{NEW}.css').write_text((root/f'app-v{OLD}.css').read_text(encoding='utf-8'),encoding='utf-8')

index=(root/'index.html').read_text(encoding='utf-8').replace(OLD,NEW)
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
    'version': int(latest.get('version',108))+1,
    'label': f'v{NEW}',
    'semanticVersion': NEW,
    'build': f'v{NEW}',
    'updatedAt': datetime.now(timezone(timedelta(hours=9))).isoformat(timespec='seconds'),
    'note': 'v6.69 새벽 5시 자동만료 후 첫 재로그인 1회 진입 수정 · 일일 세션 경계와 신규 로그인 토큰 분리 보호'
})
latest_path.write_text(json.dumps(latest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

assert f'/app-v{NEW}.js?v={NEW}' in index and f'/app-v{NEW}.css?v={NEW}' in index
assert f'kmv={NEW}' in manifest
assert f"KOKMATCH_SW_VERSION='{NEW}'" in ksw
assert f'kokmatch-sw.js?v={NEW}' in sw
assert "explicitLogin71=false,loginStartToken71=''" in js
assert "if(!explicitLogin71){forceDailyLogout71();return}" in js
assert "if(String(T||'')===loginStartToken71)return" in js
assert "const submitLogin70=submitLogin" in js
assert "reloginLatest(requestToken)" in js
assert "freshLoginProtected640" in js
assert "Date.now()<loginGrace53" in js
assert "if(saved&&saved!==d){forceDailyLogout71();return}" not in js
print('built v6.69')
