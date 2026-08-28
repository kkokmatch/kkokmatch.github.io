(()=>{
'use strict';
if(window.__kokmatchV56Fix3)return;
window.__kokmatchV56Fix3=true;
window.__kokmatchV56Fix3Patch='1.1';
window.__kokmatchV56Fix3Build='2026.08.28.6';
const AUTH='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-auth-v38';
const MULTI='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-multi-api';
let switching=false,switchSeq=0,pinSeq=0;
function tok(){try{return String((typeof T!=='undefined'&&T)||window.T||localStorage.getItem('kokmatch_token')||'')}catch{return String(window.T||'')}}
function gid(){try{return String((typeof currentGroupId!=='undefined'&&currentGroupId)||window.currentGroupId||localStorage.getItem('kokmatch_group_id')||'')}catch{return String(window.currentGroupId||'')}}
function view(){try{return String((typeof currentView!=='undefined'&&currentView)||window.currentView||'members')}catch{return String(window.currentView||'members')}}
function globalAdmin(){try{return !!(((typeof me!=='undefined'&&me)||window.me)?.globalAdmin)}catch{return !!window.me?.globalAdmin}}
function setTok(v){v=String(v||'');try{T=v}catch{};window.T=v;try{localStorage.setItem('kokmatch_token',v)}catch{}}
function setGid(v){v=String(v||'');try{currentGroupId=v}catch{};window.currentGroupId=v;try{localStorage.setItem('kokmatch_group_id',v)}catch{}}
function busy(on){const b=document.getElementById('groupBtn');window.__kokmatchGroupSwitching12=!!on;if(!b)return;b.disabled=!!on;b.classList.toggle('groupSwitching12',!!on);b.classList.toggle('switching52',!!on);if(on){b.dataset.v56fix3Old=b.textContent||'';b.textContent='모임 변경 중…'}else if(b.textContent==='모임 변경 중…'){b.textContent=b.dataset.v56fix3Old||b.dataset.v56fix1Old||'모임 변경'}if(!on)delete b.dataset.v56fix3Old}
function releaseBusy(){try{if(typeof renderHeader==='function')renderHeader()}catch{};busy(false);queueMicrotask(()=>busy(false));requestAnimationFrame(()=>busy(false))}
function error(e){const m=e?.message||String(e||'모임 변경 중 오류가 발생했습니다.');try{if(typeof showError==='function')showError(new Error(m));else alert(m)}catch{}}
async function json(url,opt={}){const r=await fetch(url,{cache:'no-store',...opt}),x=await r.json().catch(()=>({}));if(!r.ok){const e=new Error(x.error||'요청 처리에 실패했습니다.');e.status=r.status;throw e}return x}
async function fetchState(target,token){const u=new URL(MULTI);u.searchParams.set('api','state');u.searchParams.set('groupId',target);u.searchParams.set('_fix3',Date.now());const x=await json(u.toString(),{headers:{authorization:'Bearer '+token}});if(String(x?.group?.groupId||'')!==target)throw new Error('선택한 모임 정보를 불러오지 못했습니다.');return x}
function apply(x,target,token,targetView){
 if(String(x?.group?.groupId||'')!==target)return false;
 setTok(token);setGid(target);
 try{S=x.data;me=x.user;group=x.group;if(Array.isArray(x.groups))groups=x.groups;if(Array.isArray(x.groupSummaries))groupSummaries=x.groupSummaries}catch{return false}
 try{window.S=S;window.me=me;window.group=group;window.groups=typeof groups!=='undefined'?groups:window.groups;window.currentGroupId=target}catch{}
 try{if(typeof normalizeClient==='function')normalizeClient()}catch{}
 try{if(typeof renderAll==='function')renderAll()}catch{}
 try{if(targetView&&typeof goView==='function')goView(targetView)}catch{}
 try{if(targetView==='members'&&typeof window.memberPageGo46==='function')window.memberPageGo46(1)}catch{}
 return true;
}
function pin(target,token,x,targetView){const mine=++pinSeq,until=Date.now()+5500;const timer=setInterval(()=>{if(mine!==pinSeq||Date.now()>until){clearInterval(timer);return}let wrong=gid()!==target;try{wrong=wrong||String(((typeof group!=='undefined'&&group)||window.group)?.groupId||'')!==target}catch{}if(wrong)apply(x,target,token,targetView)},100)}
function refreshProfilesLater(target,targetView){Promise.resolve().then(async()=>{try{if(typeof window.__kokmatchLoadProfiles56==='function')await window.__kokmatchLoadProfiles56(target,true);if(gid()!==target)return;try{if(typeof renderAll==='function')renderAll()}catch{};try{if(targetView&&typeof goView==='function')goView(targetView)}catch{}}catch(e){console.warn('v5.6 background profile refresh',e)}})}
async function fastSwitch(target,targetView=''){
 target=String(target||'').trim();if(!target||switching)return false;
 const oldGroup=gid(),oldToken=tok(),oldView=String(targetView||view()||'members'),isGlobal=globalAdmin(),seq=++switchSeq;
 if(target===oldGroup){try{if(typeof closeModal==='function')closeModal()}catch{};return true}
 switching=true;busy(true);pinSeq++;
 let newToken=oldToken;
 try{
  if(!isGlobal){const a=await json(AUTH,{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+oldToken},body:JSON.stringify({action:'switch_group',groupId:target})});if(seq!==switchSeq)return false;target=String(a.groupId||target);newToken=String(a.token||oldToken)}
  const x=await fetchState(target,newToken);if(seq!==switchSeq)return false;
  if(!apply(x,target,newToken,oldView))throw new Error('선택한 모임 정보를 불러오지 못했습니다.');
  pin(target,newToken,x,oldView);
  try{if(typeof closeModal==='function')closeModal()}catch{};try{window.scrollTo?.(0,0)}catch{};
  refreshProfilesLater(target,oldView);
  return true;
 }catch(e){console.warn('v5.6 fast group switch',e);pinSeq++;setTok(oldToken);setGid(oldGroup);try{const old=await fetchState(oldGroup,oldToken);apply(old,oldGroup,oldToken,oldView)}catch{};error(e);return false}
 finally{switching=false;releaseBusy()}
}
const own=id=>fastSwitch(id,''),adm=(id,v='members')=>fastSwitch(id,v),any=(id,v='members')=>fastSwitch(id,v);
own.__v56fix3=true;adm.__v56fix3=true;any.__v56fix3=true;
window.switchOwnGroup38=own;window.adminSwitchGroup38=adm;window.switchGroup=any;window.__kokmatchFastSwitch56=fastSwitch;
try{switchOwnGroup38=own}catch{};try{adminSwitchGroup38=adm}catch{};try{switchGroup=any}catch{}
})();