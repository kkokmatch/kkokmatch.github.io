(()=>{
if(window.__kokmatchV56HotfixLoader)return;
window.__kokmatchV56HotfixLoader=true;
window.__kokmatchVersionLock='5.6';
window.__kokmatchV56LoaderStartedAt=Date.now();
window.__kokmatchV56LoaderCount=0;
let fixesStarted=false,fallbackStarted=false;
function add(src,onload){
 const s=document.createElement('script');s.src=src;s.async=false;
 let done=false;
 const finish=()=>{if(done)return;done=true;window.__kokmatchV56LoaderCount=(Number(window.__kokmatchV56LoaderCount)||0)+1;try{onload?.()}catch(e){console.error('콕매치 보정 체인 진행 실패',e)}};
 s.onload=finish;
 s.onerror=()=>{console.error('콕매치 최신 보정 로드 실패',src);finish()};
 document.body.appendChild(s)
}
function loadFixes(){
 if(fixesStarted)return;fixesStarted=true;
 const files=['/app-v5.4-fix4.js?v=4.1','/app-v5.4-fix5.js?v=5.2','/app-v5.4-fix6.js?v=6.4','/app-v5.4-fix7.js?v=7.0','/app-v5.4-fix8.js?v=8.0','/app-v5.4-fix9.js?v=9.1','/app-v5.4-fix10.js?v=10.0','/app-v5.4-fix11.js?v=11.0','/app-v5.4-fix12.js?v=12.0','/app-v5.4-fix13.js?v=13.0','/app-v5.4-fix14.js?v=14.0','/app-v5.4-fix15.js?v=15.0','/app-v5.4-fix16.js?v=16.0','/app-v5.4-fix17.js?v=17.0','/app-v5.5-fix2.js?v=2.0','/app-v5.5-fix3.js?v=3.0','/app-v5.5-fix4.js?v=4.1','/app-v5.6-pre.js?v=2.0','/app-v5.6.js?v=5.6.4','/app-v5.6-fix1.js?v=1.1','/app-v5.6-fix3.js?v=1.1','/app-v5.6-fix4.js?v=1.0','/app-v5.6-fix5.js?v=1.1','/app-v5.6-fix2.js?v=2.0'];
 let i=0;const next=()=>{if(i>=files.length){window.__kokmatchV56LoaderCompletedAt=Date.now();return}add(files[i++]+'&t='+Date.now(),next)};next()
}
function waitBase(){if(window.__kokmatchV54Hotfix3===true){loadFixes();return}let tries=0;const timer=setInterval(()=>{if(window.__kokmatchV54Hotfix3===true){clearInterval(timer);loadFixes();return}if(++tries>=100){clearInterval(timer);if(fallbackStarted)return;fallbackStarted=true;add('/app-v5.4.js?v=5.6&hotfix=9&t='+Date.now(),loadFixes)}},50)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',waitBase,{once:true});else waitBase();
})();