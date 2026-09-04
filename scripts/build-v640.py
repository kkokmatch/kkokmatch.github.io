from pathlib import Path
from datetime import datetime, timezone, timedelta
import json, re

OLD='6.39'
NEW='6.40'
root=Path('.')

js=(root/f'app-v{OLD}.js').read_text(encoding='utf-8').replace(OLD,NEW)

old_relogin="""async function reloginLatest(){if(reloginBusy)return;reloginBusy=true;localStorage.removeItem(TOKEN_KEY);T='';try{if('caches'in window){const ks=await caches.keys();await Promise.all(ks.map(k=>caches.delete(k)))}if('serviceWorker'in navigator){const r=await navigator.serviceWorker.getRegistration('/');if(r)await r.update().catch(()=>{})}}catch{}location.replace('/?relogin='+Date.now())}
"""
new_relogin="""async function reloginLatest(failedToken=''){const currentToken=String(T||localStorage.getItem(TOKEN_KEY)||'');if(failedToken&&currentToken&&String(failedToken)!==currentToken)return;if(reloginBusy)return;reloginBusy=true;localStorage.removeItem(TOKEN_KEY);T='';try{if('caches'in window){const ks=await caches.keys();await Promise.all(ks.map(k=>caches.delete(k)))}if('serviceWorker'in navigator){const r=await navigator.serviceWorker.getRegistration('/');if(r)await r.update().catch(()=>{})}}catch{}location.replace('/?relogin='+Date.now())}
"""
if js.count(old_relogin)!=1:
    raise SystemExit(f'root reloginLatest patch point count={js.count(old_relogin)}')
js=js.replace(old_relogin,new_relogin,1)

old_request="""async function request(apiName,method='GET',body=null,params={}){const u=new URL(API);u.searchParams.set('api',apiName);Object.entries(params).forEach(([k,v])=>{if(v)u.searchParams.set(k,v)});const r=await fetch(u,{method,headers:{'content-type':'application/json',...(T?{authorization:'Bearer '+T}:{})},body:body?JSON.stringify(body):undefined,cache:'no-store'});const x=await r.json().catch(()=>({error:'통신 오류'}));if(!r.ok){if(r.status===401&&apiName!=='login'&&apiName!=='login_probe'){reloginLatest();throw new Error('로그인이 만료되었습니다.')}const e=new Error(x.error||'오류가 발생했습니다.');e.payload=x;throw e}return x}
"""
new_request="""async function request(apiName,method='GET',body=null,params={}){const requestToken=String(T||'');const u=new URL(API);u.searchParams.set('api',apiName);Object.entries(params).forEach(([k,v])=>{if(v)u.searchParams.set(k,v)});const r=await fetch(u,{method,headers:{'content-type':'application/json',...(requestToken?{authorization:'Bearer '+requestToken}:{})},body:body?JSON.stringify(body):undefined,cache:'no-store'});const x=await r.json().catch(()=>({error:'통신 오류'}));if(!r.ok){if(r.status===401&&apiName!=='login'&&apiName!=='login_probe'){reloginLatest(requestToken);throw new Error('로그인이 만료되었습니다.')}const e=new Error(x.error||'오류가 발생했습니다.');e.payload=x;throw e}return x}
"""
if js.count(old_request)!=1:
    raise SystemExit(f'base request patch point count={js.count(old_request)}')
js=js.replace(old_request,new_request,1)

old_login_guard="""const relogin32=reloginLatest;
reloginLatest=async function(){if(loginFinalizing33)return;return relogin32()};
async function finalizeLogin33(x,selection){
 T=x.token;localStorage.setItem(TOKEN_KEY,T);
"""
new_login_guard="""const relogin32=reloginLatest;
let freshLoginToken640='',freshLoginGuardUntil640=0;
function protectFreshLogin640(token,ms=8000){freshLoginToken640=String(token||'');freshLoginGuardUntil640=Date.now()+Math.max(2000,Number(ms)||8000);window.__kokmatchFreshLoginToken640=freshLoginToken640;window.__kokmatchFreshLoginGuardUntil640=freshLoginGuardUntil640}
function freshLoginProtected640(){const token=String(T||localStorage.getItem(TOKEN_KEY)||'');return !!token&&token===freshLoginToken640&&Date.now()<freshLoginGuardUntil640}
reloginLatest=async function(failedToken=''){if(loginFinalizing33||freshLoginProtected640())return;return relogin32(failedToken)};
async function finalizeLogin33(x,selection){
 T=x.token;localStorage.setItem(TOKEN_KEY,T);protectFreshLogin640(T);
"""
if js.count(old_login_guard)!=1:
    raise SystemExit(f'login guard patch point count={js.count(old_login_guard)}')
js=js.replace(old_login_guard,new_login_guard,1)

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
    'version': int(latest.get('version',79))+1,
    'label': f'v{NEW}',
    'semanticVersion': NEW,
    'build': f'v{NEW}',
    'updatedAt': datetime.now(timezone(timedelta(hours=9))).isoformat(timespec='seconds'),
    'note': 'v6.40 자동만료 후 첫 로그인 재요구 수정 · 이전 토큰 401이 새 로그인 세션을 종료하지 않도록 토큰 세대 보호 · 로그인 직후 stale 401 보호'
})
latest_path.write_text(json.dumps(latest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

assert f'/app-v{NEW}.js?v={NEW}' in index and f'/app-v{NEW}.css?v={NEW}' in index
assert f'kmv={NEW}' in manifest
assert f"KOKMATCH_SW_VERSION='{NEW}'" in ksw
assert f'kokmatch-sw.js?v={NEW}' in sw
assert "reloginLatest(requestToken)" in js
assert "freshLoginProtected640" in js and "protectFreshLogin640(T)" in js
assert "String(failedToken)!==currentToken" in js
print('built v6.40')
