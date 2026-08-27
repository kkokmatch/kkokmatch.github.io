(()=>{
if(window.__kokmatchV54HotfixLoader11)return;
window.__kokmatchV54HotfixLoader11=true;
window.__kokmatchVersionLock='5.4';
let fixesStarted=false,fallbackStarted=false;
function add(src,onload){const s=document.createElement('script');s.src=src;s.async=false;s.onload=onload||null;s.onerror=()=>console.error('콕매치 최신 보정 로드 실패',src);document.body.appendChild(s)}
function loadFixes(){
 if(fixesStarted)return;fixesStarted=true;
 const files=['/app-v5.4-fix4.js?v=4.1','/app-v5.4-fix5.js?v=5.2','/app-v5.4-fix6.js?v=6.4','/app-v5.4-fix7.js?v=7.0','/app-v5.4-fix8.js?v=8.0','/app-v5.4-fix9.js?v=9.1','/app-v5.4-fix10.js?v=10.0','/app-v5.4-fix11.js?v=11.0','/app-v5.4-fix12.js?v=12.0','/app-v5.4-fix13.js?v=13.0','/app-v5.4-fix14.js?v=14.0','/app-v5.4-fix15.js?v=15.0','/app-v5.4-fix16.js?v=16.0','/app-v5.4-fix17.js?v=17.0'];
 let i=0;const next=()=>{if(i>=files.length)return;add(files[i++]+'&t='+Date.now(),next)};next()
}
function waitBase(){if(window.__kokmatchV54Hotfix3===true){loadFixes();return}let tries=0;const timer=setInterval(()=>{if(window.__kokmatchV54Hotfix3===true){clearInterval(timer);loadFixes();return}if(++tries>=100){clearInterval(timer);if(fallbackStarted)return;fallbackStarted=true;add('/app-v5.4.js?v=5.4&hotfix=4&t='+Date.now(),loadFixes)}},50)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',waitBase,{once:true});else waitBase();
})();