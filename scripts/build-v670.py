from pathlib import Path
from datetime import datetime, timezone, timedelta
import json
import re

OLD='6.69'
NEW='6.70'
root=Path('.')

src=(root/f'app-v{OLD}.js').read_text(encoding='utf-8')
js=src.replace(OLD,NEW)

# 1) Resolve the 05:00 business-day boundary before any authenticated request can start.
old_init="let T=localStorage.getItem(TOKEN_KEY)||'',S=emptyClientState(),me=null,group=null,groups=[],groupSummaries=[];\nlet currentGroupId="
new_init="""let T=localStorage.getItem(TOKEN_KEY)||'',S=emptyClientState(),me=null,group=null,groups=[],groupSummaries=[];
const SESSION_DAY_BASE_V670='kokmatch_session_business_day_v71';
function authBusinessDayV670(){const shifted=new Date(Date.now()-5*60*60*1000);return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(shifted)}
function discardStaleStartupSessionV670(){
 try{
  const saved=localStorage.getItem(SESSION_DAY_BASE_V670)||'';
  if(T&&saved&&saved!==authBusinessDayV670()){
   localStorage.removeItem(TOKEN_KEY);localStorage.removeItem(SESSION_DAY_BASE_V670);T='';return true;
  }
 }catch{}
 return false;
}
discardStaleStartupSessionV670();
let currentGroupId="""
if js.count(old_init)!=1:
    raise SystemExit(f'base session init patch point count={js.count(old_init)}')
js=js.replace(old_init,new_init,1)

# 2) A normal expired session must transition to the login overlay in-place.
#    Do not clear PWA caches / update the SW / hard-reload the page for auth expiry.
old_relogin="async function reloginLatest(failedToken=''){const currentToken=String(T||localStorage.getItem(TOKEN_KEY)||'');if(failedToken&&currentToken&&String(failedToken)!==currentToken)return;if(reloginBusy)return;reloginBusy=true;localStorage.removeItem(TOKEN_KEY);T='';try{if('caches'in window){const ks=await caches.keys();await Promise.all(ks.map(k=>caches.delete(k)))}if('serviceWorker'in navigator){const r=await navigator.serviceWorker.getRegistration('/');if(r)await r.update().catch(()=>{})}}catch{}location.replace('/?relogin='+Date.now())}"
new_relogin="""async function reloginLatest(failedToken=''){
 const currentToken=String(T||localStorage.getItem(TOKEN_KEY)||'');
 if(failedToken&&!currentToken)return false;
 if(failedToken&&currentToken&&String(failedToken)!==currentToken)return false;
 if(reloginBusy)return true;
 reloginBusy=true;
 try{
  try{localStorage.removeItem(TOKEN_KEY);localStorage.removeItem(SESSION_DAY_BASE_V670)}catch{}
  T='';me=null;group=null;
  try{const loginEl=$('login');if(loginEl){loginEl.classList.remove('hide');renderLoginName()}}catch{}
  return true;
 }finally{reloginBusy=false}
}"""
if js.count(old_relogin)!=1:
    raise SystemExit(f'base relogin patch point count={js.count(old_relogin)}')
js=js.replace(old_relogin,new_relogin,1)

old_401="if(r.status===401&&apiName!=='login'&&apiName!=='login_probe'){reloginLatest(requestToken);throw new Error('로그인이 만료되었습니다.')}"
new_401="if(r.status===401&&apiName!=='login'&&apiName!=='login_probe'){await reloginLatest(requestToken);throw new Error('로그인이 만료되었습니다.')}"
if js.count(old_401)!=1:
    raise SystemExit(f'base 401 patch point count={js.count(old_401)}')
js=js.replace(old_401,new_401,1)

# 3) Every newly-issued app token (login and group-token refresh paths) receives the current
#    05:00 business-day marker immediately, before any loadState()/background request.
token_write="T=x.token;localStorage.setItem(TOKEN_KEY,T);"
token_write_new="T=x.token;localStorage.setItem(TOKEN_KEY,T);localStorage.setItem(SESSION_DAY_BASE_V670,authBusinessDayV670());"
write_count=js.count(token_write)
if write_count<3:
    raise SystemExit(f'token write patch points too few={write_count}')
js=js.replace(token_write,token_write_new)

(root/f'app-v{NEW}.js').write_text(js,encoding='utf-8')
(root/f'app-v{NEW}.css').write_text((root/f'app-v{OLD}.css').read_text(encoding='utf-8').replace(OLD,NEW),encoding='utf-8')

index=(root/'index.html').read_text(encoding='utf-8').replace(OLD,NEW)
index=index.replace('single-v668','single-v670').replace('session-coordinator-v668','session-coordinator-v670')
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
    'version': int(latest.get('version',109))+1,
    'label': f'v{NEW}',
    'semanticVersion': NEW,
    'build': f'v{NEW}',
    'updatedAt': datetime.now(timezone(timedelta(hours=9))).isoformat(timespec='seconds'),
    'note': 'v6.70 새벽 5시 초기화 유지 · 만료 세션 시작 전 선제 정리 · 첫 로그인 무재접속 전환 · stale 401 신규토큰 보호'
})
latest_path.write_text(json.dumps(latest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

assert f'/app-v{NEW}.js?v={NEW}' in index and f'/app-v{NEW}.css?v={NEW}' in index
assert f'kmv={NEW}' in manifest
assert f"KOKMATCH_SW_VERSION='{NEW}'" in ksw
assert f'kokmatch-sw.js?v={NEW}' in sw
assert 'discardStaleStartupSessionV670();' in js
assert "saved&&saved!==authBusinessDayV670()" in js
assert "if(failedToken&&!currentToken)return false" in js
assert "String(failedToken)!==currentToken)return false" in js
assert "location.replace('/?relogin='" not in js
assert 'await reloginLatest(requestToken)' in js
assert js.count('localStorage.setItem(SESSION_DAY_BASE_V670,authBusinessDayV670());')==write_count
assert 'freshLoginProtected640' in js
assert 'Date.now()<loginGrace53' in js
assert "SESSION_DAY71='kokmatch_session_business_day_v71'" in js
print(f'built v{NEW}; token writes stamped={write_count}')
