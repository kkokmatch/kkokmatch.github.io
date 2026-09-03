from pathlib import Path
import json

ROOT=Path(__file__).resolve().parent.parent

def read(name): return (ROOT/name).read_text(encoding='utf-8')
def write(name,text): (ROOT/name).write_text(text,encoding='utf-8')

js=read('app-v6.29.js')
css=read('app-v6.29.css')
if "window.__kokmatchStandalone='6.29'" not in js:
    raise SystemExit('v6.29 runtime marker missing')
js=js.replace('6.29','6.30')

# The old inline-expiry handler clears a newly-issued token when the very first state
# request races authentication propagation. During the fresh-login grace window,
# bubble the 401 so v6.30 can retry instead of deleting the token.
old="if(/만료|로그인|401/.test(msg)){showLoginInline16('로그인이 만료되어 다시 로그인이 필요합니다.');return}"
new="if(/만료|로그인|401/.test(msg)){if(Date.now()<Number(window.__kokmatchFreshLoginUntil630||0))throw e;showLoginInline16('로그인이 만료되어 다시 로그인이 필요합니다.');return}"
if old not in js:
    raise SystemExit('v1.6 auth-expiry handler not found')
js=js.replace(old,new,1)

# Remove the legacy iOS/Kakao forced navigation fallback. v6.30 retries the same
# fresh token in-place, so first login no longer looks like a logout/re-login cycle.
old_resume="if(resumeOnce54(last?.message||'loadState'))return new Promise(()=>{});throw last||new Error('로그인 후 화면을 불러오지 못했습니다.')"
if old_resume not in js:
    raise SystemExit('v5.4 forced resume fallback not found')
js=js.replace(old_resume,"throw last||new Error('로그인 후 화면을 불러오지 못했습니다.')")

# Enlarge and clarify the installation guide while preserving the current PWA logic.
ios_old="modal629('콕매치를 앱처럼 설치하세요','Safari로 열기 → 공유 버튼 → <b>홈 화면에 추가</b>를 선택하면 콕매치가 일반 앱처럼 실행됩니다. 설치 후 홈 화면 아이콘으로 실행하면 게임 푸시 알림도 받을 수 있습니다.','확인','나중에',()=>closePrompt629(),()=>{});"
ios_new="modal629('콕매치를 홈 화면에 설치해주세요',`<div class=\"pwaInstallLead630\">한 번만 추가하면 다음부터는 <b>일반 앱처럼 아이콘을 눌러 바로 실행</b>할 수 있습니다.</div><div class=\"pwaInstallSteps630\"><div><b>1</b><span>카카오톡에서 열었다면 우측 메뉴에서 <strong>Safari로 열기</strong></span></div><div><b>2</b><span>Safari 아래쪽의 <strong>공유 버튼</strong> 누르기</span></div><div><b>3</b><span><strong>홈 화면에 추가</strong> → 추가</span></div></div><div class=\"pwaInstallFoot630\">설치 후 홈 화면의 콕매치 아이콘으로 실행하면 푸시 알림도 받을 수 있습니다.</div>`,'확인했어요','나중에',()=>closePrompt629(),()=>{});"
if ios_old not in js:
    raise SystemExit('iOS install guide text not found')
js=js.replace(ios_old,ios_new,1)

android_old="modal629('콕매치를 홈 화면에 설치하세요','앱스토어 설치 없이 홈 화면에서 바로 실행할 수 있고, 새 버전은 다시 설치하지 않아도 적용됩니다.','홈 화면에 설치','나중에',install629,()=>{try{sessionStorage.setItem('kokmatch_install_later629','1')}catch{}});"
android_new="modal629('콕매치를 앱처럼 설치해주세요',`<div class=\"pwaInstallLead630\">설치하면 홈 화면의 <b>콕매치 아이콘</b>으로 바로 실행됩니다.</div><div class=\"pwaInstallSteps630\"><div><b>1</b><span>아래 <strong>지금 설치</strong> 누르기</span></div><div><b>2</b><span>휴대폰 설치창에서 <strong>설치</strong> 확인</span></div><div><b>3</b><span>다음부터 홈 화면에서 콕매치 실행</span></div></div><div class=\"pwaInstallFoot630\">앱스토어가 필요 없고, 새 버전도 다시 설치할 필요 없이 자동 적용됩니다.</div>`,'지금 설치','나중에',install629,()=>{try{sessionStorage.setItem('kokmatch_install_later629','1')}catch{}});"
if android_old not in js:
    raise SystemExit('Android install guide text not found')
js=js.replace(android_old,android_new,1)

js += r'''

/* KokMatch v6.30 first-login session stabilization */
(()=>{
'use strict';
if(window.__kokmatchLoginStable630)return;
window.__kokmatchLoginStable630=true;
const sleep630=ms=>new Promise(r=>setTimeout(r,ms));
const token630=()=>{try{return String(T||localStorage.getItem('kokmatch_token')||'')}catch{return String(T||'')}};
const ready630=()=>{try{return !!(T&&me&&group&&currentGroupId)}catch{return false}};
const baseLoadState630=loadState;
loadState=async function(...args){
 const fresh=Date.now()<Number(window.__kokmatchFreshLoginUntil630||0);
 if(!fresh)return baseLoadState630.apply(this,args);
 let last=null;
 for(const wait of [0,180,360,700,1200,1800]){
  if(wait)await sleep630(wait);
  try{
   const r=await baseLoadState630.apply(this,args);
   if(ready630()){
    window.__kokmatchFreshLoginUntil630=0;
    try{sessionStorage.setItem('kokmatch_login_stable630','1')}catch{}
    return r;
   }
   // Some migrated legacy wrappers intentionally swallow an auth error and return
   // undefined. A fresh token without me/group is not a successful login yet.
   if(token630()){
    last=new Error('로그인 상태를 불러오는 중입니다.');
    continue;
   }
   return r;
  }catch(e){
   last=e;
   if(!token630())throw e;
  }
 }
 throw last||new Error('로그인 정보를 불러오지 못했습니다. 다시 시도해주세요.');
};
try{window.loadState=loadState}catch{}

const baseSubmitLogin630=submitLogin;
submitLogin=async function(...args){
 const before=token630();
 window.__kokmatchFreshLoginUntil630=Date.now()+15000;
 try{
  const r=await baseSubmitLogin630.apply(this,args);
  const after=token630();
  if(after&&ready630()){
   window.__kokmatchFreshLoginUntil630=0;
   try{sessionStorage.setItem('kokmatch_login_stable630','1')}catch{}
  }else if(!after||after===before){
   window.__kokmatchFreshLoginUntil630=0;
  }
  return r;
 }catch(e){
  if(!token630()||token630()===before)window.__kokmatchFreshLoginUntil630=0;
  throw e;
 }
};
try{window.submitLogin=submitLogin}catch{}
})();
'''
write('app-v6.30.js',js)

css += r'''

/* KokMatch v6.30 larger installation guide */
.pwaPrompt629{align-items:center!important;padding:16px!important;background:rgba(10,22,48,.62)!important}
.pwaPromptCard629{width:min(94vw,520px)!important;min-height:min(70vh,620px);padding:28px 24px 24px!important;border-radius:26px!important;display:flex;flex-direction:column;justify-content:center;box-sizing:border-box}
.pwaPromptIcon629{width:68px!important;height:68px!important;border-radius:20px!important;font-size:34px!important;margin-bottom:16px!important}
.pwaPromptCard629 h3{font-size:25px!important;line-height:1.3!important;margin-bottom:14px!important;letter-spacing:-.5px}
.pwaPromptBody629{font-size:16px!important;line-height:1.65!important;color:#43536d!important}
.pwaInstallLead630{padding:13px 14px;background:#eef4ff;border-radius:14px;color:#20365d;margin-bottom:14px}
.pwaInstallSteps630{display:grid;gap:10px;margin:10px 0 12px}.pwaInstallSteps630>div{display:grid;grid-template-columns:34px 1fr;gap:10px;align-items:center;padding:12px 13px;background:#f7f9fc;border:1px solid #e3e9f2;border-radius:14px}.pwaInstallSteps630>div>b{width:32px;height:32px;display:grid;place-items:center;border-radius:50%;background:#2453d4;color:#fff;font-size:15px}.pwaInstallSteps630 strong{color:#163c9c}.pwaInstallFoot630{font-size:13px;color:#718097;margin-top:5px}
.pwaPromptBtns629{margin-top:20px!important;gap:10px!important}.pwaPromptBtns629 .btn{min-height:54px!important;font-size:16px!important;border-radius:15px!important}
@media(max-width:380px){.pwaPrompt629{padding:10px!important}.pwaPromptCard629{width:96vw!important;min-height:76vh;padding:22px 18px!important}.pwaPromptIcon629{width:58px!important;height:58px!important;font-size:30px!important}.pwaPromptCard629 h3{font-size:22px!important}.pwaPromptBody629{font-size:14px!important}.pwaInstallSteps630>div{grid-template-columns:30px 1fr;padding:10px}.pwaInstallSteps630>div>b{width:28px;height:28px}.pwaPromptBtns629{grid-template-columns:1fr 1fr!important}.pwaPromptBtns629 .btn{font-size:14px!important}}
'''
write('app-v6.30.css',css)

index=read('index.html').replace('6.29','6.30')
if '/app-v6.30.js' not in index or '/app-v6.30.css' not in index:
    raise SystemExit('index runtime replacement failed')
write('index.html',index)

sw=read('kokmatch-sw.js').replace("KOKMATCH_SW_VERSION='6.29'","KOKMATCH_SW_VERSION='6.30'")
write('kokmatch-sw.js',sw)
write('sw.js',"/* Compatibility entry for older KokMatch clients. */\nimportScripts('/kokmatch-sw.js?v=6.30');\n")

latest={
  'version':70,
  'label':'v6.30',
  'semanticVersion':'6.30',
  'build':'v6.30',
  'updatedAt':'2026-09-03T09:40:00+09:00',
  'note':'v6.30 큰 PWA 설치안내 · iOS/Android 단계별 설치가이드 · 첫 로그인 세션 401 재시도 · 초기 로그인 유지 안정화'
}
write('latest-version.json',json.dumps(latest,ensure_ascii=False,indent=2)+'\n')
print('Built KokMatch v6.30 candidate')
