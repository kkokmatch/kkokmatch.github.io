(()=>{
if(window.__kokmatchV54KakaoLoginFix)return;
window.__kokmatchV54KakaoLoginFix='1.0';
window.__kokmatchVersionLock='5.4';

const baseLoadStateKakao54=typeof loadState==='function'?loadState:null;
const baseOpenEntryKakao54=typeof openEntry==='function'?openEntry:null;
const uaKakao54=String(navigator.userAgent||'');
const isIOS54=/iPhone|iPad|iPod/i.test(uaKakao54);
const isKakao54=/KAKAOTALK|Kakao/i.test(uaKakao54);
const shouldResume54=isIOS54||isKakao54;
const RESUME_KEY54='kokmatch_kakao_login_resume_v54';

function sleepKakao54(ms){return new Promise(r=>setTimeout(r,ms))}
function hasSavedToken54(){
 try{return !!String(T||localStorage.getItem(TOKEN_KEY)||localStorage.getItem('kokmatch_token')||'').trim()}catch{return !!String(T||'').trim()}
}
function clearResumeGuard54(){try{sessionStorage.removeItem(RESUME_KEY54)}catch{}}
function resumeOnce54(reason){
 if(!shouldResume54||!hasSavedToken54())return false;
 try{
  const prev=Number(sessionStorage.getItem(RESUME_KEY54)||0);
  const now=Date.now();
  if(prev&&now-prev<12000)return false;
  sessionStorage.setItem(RESUME_KEY54,String(now));
  console.warn('콕매치 카카오 로그인 후처리 재진입',reason||'state');
  location.replace('/?loginresume='+now);
  return true;
 }catch{return false}
}

if(baseLoadStateKakao54){
 loadState=async function(...args){
  let last=null;
  const waits=[0,180,420];
  for(let i=0;i<waits.length;i++){
   if(waits[i])await sleepKakao54(waits[i]);
   try{
    const r=await baseLoadStateKakao54.apply(this,args);
    clearResumeGuard54();
    return r;
   }catch(e){
    last=e;
    if(!hasSavedToken54())throw e;
    // 인증/상태 데이터까지 받은 뒤 렌더링 단계에서 난 예외도 한 번 더 복구한다.
    if(me&&group){
     try{if(typeof normalizeClient==='function')normalizeClient()}catch{}
     try{if(typeof renderAll==='function'){renderAll();clearResumeGuard54();return}}catch{}
     break;
    }
   }
  }
  if(resumeOnce54(last?.message||'loadState'))return new Promise(()=>{});
  throw last||new Error('로그인 후 화면을 불러오지 못했습니다.');
 };
 try{window.loadState=loadState}catch{}
}

if(baseOpenEntryKakao54){
 openEntry=function(...args){
  try{return baseOpenEntryKakao54.apply(this,args)}
  catch(e){console.warn('콕매치 입장창 표시 지연',e);return null}
 };
 try{window.openEntry=openEntry}catch{}
}

window.addEventListener('pageshow',()=>{
 if(me&&group)clearResumeGuard54();
});
})();
