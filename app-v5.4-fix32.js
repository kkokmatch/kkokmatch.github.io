(()=>{
'use strict';
if(window.__kokmatchV54Fix32)return;
window.__kokmatchV54Fix32=true;
window.__kokmatchIOSLogoutFix='32.0';
document.documentElement.dataset.kokmatchIOSLogoutFix='32.0';
const API32='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-multi-api';
let busy32=false,last32=0;
function trace32(msg){
 try{
  window.__kokmatchV32Last=String(msg||'');
  if(!location.pathname.includes('ios-diagnostic'))return;
  let el=document.getElementById('kokmatchV32Status')||document.getElementById('kokmatchV31Status')||document.getElementById('kokmatchV30Status');
  if(!el){el=document.createElement('div');el.id='kokmatchV32Status';el.style.cssText='position:fixed;left:8px;right:8px;bottom:calc(74px + env(safe-area-inset-bottom));z-index:100006;background:#172033ee;color:#fff;border-radius:10px;padding:8px 10px;font:700 11px/1.35 -apple-system,BlinkMacSystemFont,sans-serif;pointer-events:none';document.body.appendChild(el)}
  el.textContent='v32.0 · '+String(msg||'');
 }catch{}
}
function isLogout32(el){
 try{
  const b=el?.closest?.('button');if(!b)return false;
  return b.id==='logout51'||b.classList.contains('logout')||String(b.textContent||'').trim()==='로그아웃';
 }catch{return false}
}
function clear32(){
 try{localStorage.removeItem('kokmatch_token')}catch{}
 try{localStorage.removeItem('kokmatch_refresh_state')}catch{}
 try{sessionStorage.removeItem('kokmatch_login_recover_once_v54')}catch{}
 try{sessionStorage.removeItem('kokmatch_login_resume_once_v54')}catch{}
 try{sessionStorage.removeItem('kokmatch_v54_login_recover')}catch{}
 try{T='';window.T=''}catch{try{window.T=''}catch{}}
}
function serverLogout32(token){
 try{
  const u=new URL(API32);u.searchParams.set('api','logout');u.searchParams.set('_fix32',Date.now());
  fetch(u,{method:'POST',headers:{'content-type':'application/json',...(token?{authorization:'Bearer '+token}:{})},body:'{}',keepalive:true,cache:'no-store'}).catch(()=>{});
 }catch{}
}
function logout32(ev){
 const now=Date.now();if(busy32||now-last32<800)return;busy32=true;last32=now;
 try{ev?.preventDefault();ev?.stopPropagation();ev?.stopImmediatePropagation()}catch{}
 let token='';try{token=String(window.T||localStorage.getItem('kokmatch_token')||'')}catch{}
 trace32('로그아웃 실행');
 serverLogout32(token);
 clear32();
 try{location.replace('/?logout='+Date.now())}catch{location.href='/?logout='+Date.now()}
}
window.__kokmatchLogout32=logout32;
window.addEventListener('touchstart',ev=>{if(isLogout32(ev.target))logout32(ev)},{capture:true,passive:false});
document.addEventListener('click',ev=>{if(isLogout32(ev.target))logout32(ev)},{capture:true});
function bind32(){
 document.querySelectorAll('#logout51,button.logout').forEach(b=>{
  if(b.dataset.v32logout)return;b.dataset.v32logout='1';b.style.pointerEvents='auto';b.style.touchAction='manipulation';
  b.addEventListener('touchstart',logout32,{capture:true,passive:false});
  b.addEventListener('click',logout32,{capture:true});
 });
}
new MutationObserver(bind32).observe(document.documentElement,{subtree:true,childList:true});
setInterval(bind32,500);bind32();trace32('로그아웃 터치 보정 준비');
})();
