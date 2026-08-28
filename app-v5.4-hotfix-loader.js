(()=>{
if(window.__kokmatchV54HotfixLoader15)return;
window.__kokmatchV54HotfixLoader15=true;
window.__kokmatchVersionLock='5.4';
let fixesStarted=false,fallbackStarted=false;
function add(src,onload){const s=document.createElement('script');s.src=src;s.async=false;s.onload=onload||null;s.onerror=()=>console.error('콕매치 최신 보정 로드 실패',src);document.body.appendChild(s)}
function loadFixes(){if(fixesStarted)return;fixesStarted=true;add('/app-v5.4-fix4.js?v=4.8&t='+Date.now(),()=>add('/app-v5.4-fix5.js?v=5.2&t='+Date.now(),()=>add('/app-v5.4-kakao-login-fix.js?v=1.0&t='+Date.now(),()=>add('/app-v5.4-fix21.js?v=21.2&t='+Date.now()))))}
function waitBase(){if(window.__kokmatchV54Hotfix3===true){loadFixes();return}let tries=0;const timer=setInterval(()=>{if(window.__kokmatchV54Hotfix3===true){clearInterval(timer);loadFixes();return}if(++tries>=100){clearInterval(timer);if(fallbackStarted)return;fallbackStarted=true;add('/app-v5.4.js?v=5.4&hotfix=4&t='+Date.now(),loadFixes)}},50)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',waitBase,{once:true});else waitBase();
})();