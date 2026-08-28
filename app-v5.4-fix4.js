(()=>{
if(window.__kokmatchV54Fix4)return;window.__kokmatchV54Fix4=true;
// 구형 프로필/성별 보정기는 회원명부 페이지가 바뀐 뒤 전체 S.members 인덱스로
// 아바타를 다시 덮어써 2페이지에 1페이지 회원 정보가 섞이므로 실행하지 않는다.
window.__kokmatchV54Fix6=true;
window.__kokmatchV54Fix8=true;
window.__kokmatchV54Fix9=true;
window.__kokmatchV54Fix10=true;
window.__kokmatchV54Fix18=true;
window.__kokmatchV54Fix19=true;
window.__kokmatchV54Fix20=true;
window.__kokmatchLegacyProfileRemappersDisabled=true;
function alignQueue54(){
 const box=typeof $==='function'?$('queue'):document.getElementById('queue');if(!box)return;
 const slots=[...box.querySelectorAll('.composer54 .pendingSlot')];
 slots.forEach(s=>{
  s.classList.add('pendingSlot53','pendingSlot54');
  if(s.classList.contains('filled'))s.classList.add('clickable','hasX53');
  const name=s.querySelector('.slotName');if(name)name.classList.add('slotName53');
  const meta=s.querySelector('.meta');if(meta)meta.classList.add('compactMeta53');
  const x=s.querySelector('.pendingX');if(x)x.classList.add('pendingX53');
 });
 const grid=box.querySelector('.composer54 .slots');if(grid)grid.classList.add('pendingGrid');
}
const rq=renderQueue;renderQueue=function(){const r=rq();alignQueue54();return r};
const ra=renderAll;renderAll=function(){const r=ra();alignQueue54();return r};
alignQueue54();setTimeout(alignQueue54,0);
})();

(()=>{
if(window.__kokmatchV54KakaoLoginFix)return;
window.__kokmatchV54KakaoLoginFix='1.0';
const baseLoadStateKakao54=typeof loadState==='function'?loadState:null;
const baseOpenEntryKakao54=typeof openEntry==='function'?openEntry:null;
const uaKakao54=String(navigator.userAgent||'');
const shouldResume54=/iPhone|iPad|iPod|KAKAOTALK|Kakao/i.test(uaKakao54);
const RESUME_KEY54='kokmatch_kakao_login_resume_v54';
function sleepKakao54(ms){return new Promise(r=>setTimeout(r,ms))}
function hasSavedToken54(){try{return !!String(T||localStorage.getItem(TOKEN_KEY)||localStorage.getItem('kokmatch_token')||'').trim()}catch{return !!String(T||'').trim()}}
function clearResumeGuard54(){try{sessionStorage.removeItem(RESUME_KEY54)}catch{}}
function resumeOnce54(reason){if(!shouldResume54||!hasSavedToken54())return false;try{const prev=Number(sessionStorage.getItem(RESUME_KEY54)||0),now=Date.now();if(prev&&now-prev<12000)return false;sessionStorage.setItem(RESUME_KEY54,String(now));console.warn('콕매치 카카오 로그인 후처리 재진입',reason||'state');location.replace('/?loginresume='+now);return true}catch{return false}}
if(baseLoadStateKakao54){
 loadState=async function(...args){let last=null;for(const wait of [0,180,420]){if(wait)await sleepKakao54(wait);try{const r=await baseLoadStateKakao54.apply(this,args);clearResumeGuard54();return r}catch(e){last=e;if(!hasSavedToken54())throw e;if(me&&group){try{if(typeof normalizeClient==='function')normalizeClient()}catch{};try{if(typeof renderAll==='function'){renderAll();clearResumeGuard54();return}}catch{};break}}}if(resumeOnce54(last?.message||'loadState'))return new Promise(()=>{});throw last||new Error('로그인 후 화면을 불러오지 못했습니다.')};
 try{window.loadState=loadState}catch{}
}
if(baseOpenEntryKakao54){openEntry=function(...args){try{return baseOpenEntryKakao54.apply(this,args)}catch(e){console.warn('콕매치 입장창 표시 지연',e);return null}};try{window.openEntry=openEntry}catch{}}
window.addEventListener('pageshow',()=>{if(me&&group)clearResumeGuard54()});
})();

(()=>{
if(window.__kokmatchV54FinalProfileBridge4)return;window.__kokmatchV54FinalProfileBridge4=true;
const add=(src,onload)=>{const s=document.createElement('script');s.src=src;s.async=false;s.onload=onload||null;s.onerror=()=>console.error('콕매치 최종 회원명부 보정 로드 실패',src);document.body.appendChild(s)};
const load22=()=>window.__kokmatchV54Fix22?null:add('/app-v5.4-fix22.js?v=22.2&t='+Date.now());
let tries=0;const timer=setInterval(()=>{
 if(window.__kokmatchV54Fix21){clearInterval(timer);load22();return}
 if(window.__kokmatchV54Fix5&&window.__kokmatchV54KakaoLoginFix){clearInterval(timer);add('/app-v5.4-fix21.js?v=21.2&t='+Date.now(),load22);return}
 if(++tries>=200)clearInterval(timer)
},25);
})();