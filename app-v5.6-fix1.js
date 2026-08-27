(()=>{
'use strict';
if(window.__kokmatchV56Fix1)return;
window.__kokmatchV56Fix1=true;
window.__kokmatchV56Fix1Patch='1.0';
window.__kokmatchV56Fix1Build='2026.08.28.2';
const BUILD='2026.08.28.2';
const VERSION='5.6';
const AUTH='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-auth-v38';
const MULTI='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-multi-api';
const PROFILE='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-profile-v53';
let updateBusy=false,switchBusy=false,profileBusy=false,stateSeq=0;

function token(){try{return String((typeof T!=='undefined'&&T)||window.T||localStorage.getItem('kokmatch_token')||'')}catch{return String(window.T||'')}}
function groupId(){try{return String((typeof currentGroupId!=='undefined'&&currentGroupId)||window.currentGroupId||localStorage.getItem('kokmatch_group_id')||'')}catch{return String(window.currentGroupId||'')}}
function currentView56(){try{return String((typeof currentView!=='undefined'&&currentView)||window.currentView||'members')}catch{return String(window.currentView||'members')}}
function setToken(v){v=String(v||'');try{T=v}catch{};window.T=v;try{localStorage.setItem('kokmatch_token',v)}catch{}}
function setGroup(v){v=String(v||'');try{currentGroupId=v}catch{};window.currentGroupId=v;try{localStorage.setItem('kokmatch_group_id',v)}catch{}}
function setBusyUi(on){const b=document.getElementById('groupBtn');window.__kokmatchGroupSwitching12=!!on;if(!b)return;if(on){b.disabled=true;b.classList.add('groupSwitching12','switching52');b.dataset.v56fix1Old=b.textContent||'';b.textContent='모임 변경 중…'}else{b.disabled=false;b.classList.remove('groupSwitching12','switching52');if(b.textContent==='모임 변경 중…'&&b.dataset.v56fix1Old)b.textContent=b.dataset.v56fix1Old;delete b.dataset.v56fix1Old}}
function showErr(e){const m=e?.message||String(e||'처리 중 오류가 발생했습니다.');try{if(typeof showError==='function')showError(new Error(m));else alert(m)}catch{try{alert(m)}catch{}}}

async function jsonRequest(url,opt={}){const r=await fetch(url,{cache:'no-store',...opt}),x=await r.json().catch(()=>({}));if(!r.ok){const e=new Error(x.error||'요청 처리에 실패했습니다.');e.status=r.status;throw e}return x}
async function stateFetch(target,tok){const u=new URL(MULTI);u.searchParams.set('api','state');u.searchParams.set('groupId',target);u.searchParams.set('_fix1',Date.now());const x=await jsonRequest(u.toString(),{headers:{authorization:'Bearer '+tok}});const got=String(x?.group?.groupId||'');if(got!==String(target))throw new Error('선택한 모임 정보를 불러오지 못했습니다.');return x}
function applyState(x,target,tok,view){
 const got=String(x?.group?.groupId||'');if(got!==String(target))return false;
 setToken(tok);setGroup(target);
 try{S=x.data;me=x.user;group=x.group;if(Array.isArray(x.groups))groups=x.groups;if(Array.isArray(x.groupSummaries))groupSummaries=x.groupSummaries}catch(e){console.warn('v5.6 fix1 state apply',e);return false}
 try{window.S=S;window.me=me;window.group=group;window.groups=typeof groups!=='undefined'?groups:window.groups;window.currentGroupId=target}catch{}
 try{if(typeof normalizeClient==='function')normalizeClient()}catch{}
 try{if(typeof renderAll==='function')renderAll()}catch(e){console.warn('v5.6 fix1 render',e)}
 try{if(view&&typeof goView==='function')goView(view)}catch{}
 try{if(view==='members'&&typeof window.memberPageGo46==='function')window.memberPageGo46(1)}catch{}
 return true;
}
async function loadStateFix1(arg={}){
 const o=arg&&typeof arg==='object'?arg:{},target=String(o.target||groupId()),tok=String(o.token||token());
 if(!target||!tok)return false;if(switchBusy&&!o.allowDuringSwitch)return false;
 const seq=++stateSeq;const x=await stateFetch(target,tok);if(seq!==stateSeq||groupId()!==target)return false;return applyState(x,target,tok,o.restore===false?'':currentView56());
}
async function switchFix1(target,view=''){
 target=String(target||'').trim();if(!target||switchBusy)return false;const oldGroup=groupId(),oldToken=token(),oldView=String(view||currentView56()||'members');if(target===oldGroup){try{if(typeof closeModal==='function')closeModal()}catch{};return true}
 switchBusy=true;setBusyUi(true);stateSeq++;
 let newToken=oldToken;
 try{
  const auth=await jsonRequest(AUTH,{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+oldToken},body:JSON.stringify({action:'switch_group',groupId:target})});
  target=String(auth.groupId||target);newToken=String(auth.token||oldToken);
  const x=await stateFetch(target,newToken);
  stateSeq++;if(!applyState(x,target,newToken,oldView))throw new Error('선택한 모임 정보를 불러오지 못했습니다.');
  try{if(typeof closeModal==='function')closeModal()}catch{}
  try{window.scrollTo?.(0,0)}catch{}
  try{if(typeof window.__kokmatchLoadProfiles56==='function')await window.__kokmatchLoadProfiles56(target,true)}catch(e){console.warn('v5.6 fix1 profile after switch',e)}
  try{if(typeof renderAll==='function')renderAll();if(oldView&&typeof goView==='function')goView(oldView)}catch{}
  return true;
 }catch(e){
  console.warn('v5.6 fix1 group switch',e);setToken(oldToken);setGroup(oldGroup);stateSeq++;
  try{const x=await stateFetch(oldGroup,oldToken);applyState(x,oldGroup,oldToken,oldView)}catch(_){}
  showErr(e);return false;
 }finally{switchBusy=false;setBusyUi(false);try{if(typeof renderHeader==='function')renderHeader()}catch{}}
}
function installSwitch(){
 const own=id=>switchFix1(id,'');const adm=(id,view='members')=>switchFix1(id,view);const any=(id,view='members')=>switchFix1(id,view);
 own.__v56fix1=true;adm.__v56fix1=true;any.__v56fix1=true;
 window.switchOwnGroup38=own;window.adminSwitchGroup38=adm;window.switchGroup=any;window.__kokmatchLoadState56=loadStateFix1;window.loadState=loadStateFix1;
 try{switchOwnGroup38=own}catch{};try{adminSwitchGroup38=adm}catch{};try{switchGroup=any}catch{};try{loadState=loadStateFix1}catch{}
}

function readFile(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(String(r.result||''));r.onerror=()=>rej(new Error('사진을 읽지 못했습니다.'));r.readAsDataURL(file)})}
function loadImage(src){return new Promise((res,rej)=>{const im=new Image();im.onload=()=>res(im);im.onerror=()=>rej(new Error('사진 형식을 읽지 못했습니다.'));im.src=src})}
async function encoded(file,maxDim,maxChars,startQ){
 const src=await readFile(file),im=await loadImage(src);let scale=Math.min(1,maxDim/Math.max(im.naturalWidth||im.width||1,im.naturalHeight||im.height||1));
 for(let shrink=0;shrink<4;shrink++){
  const w=Math.max(1,Math.round((im.naturalWidth||im.width||1)*scale)),h=Math.max(1,Math.round((im.naturalHeight||im.height||1)*scale)),c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');ctx.drawImage(im,0,0,w,h);
  for(const q of [startQ,Math.max(.58,startQ-.1),Math.max(.5,startQ-.2),.5]){const out=c.toDataURL('image/jpeg',q);if(out.length<=maxChars)return out}
  scale*=.78;
 }
 throw new Error('사진 용량을 줄이지 못했습니다. 다른 사진으로 다시 시도해주세요.');
}
function memberId(){try{return String(window.resolveProfileMemberId54?.()||((typeof me!=='undefined'&&me)?.memberId)||window.me?.memberId||'')}catch{return String(window.me?.memberId||'')}}
function directPreview(src){const p=document.querySelector('#profileCard53 .profilePreview53');if(p&&src)p.innerHTML=`<img src="${src}" alt="내 프로필 사진">`}
function redrawProfile(src=''){
 try{if(typeof renderMembers==='function')renderMembers()}catch{};try{if(typeof renderQueue==='function')renderQueue()}catch{};try{if(currentView56()==='settings'&&typeof renderSettings==='function')renderSettings()}catch{};if(src)requestAnimationFrame(()=>directPreview(src));
}
async function saveProfileFix1(input){
 if(profileBusy)return false;const file=input?.files?.[0];if(!file)return false;const g=groupId(),tok=token();if(!g||g==='__global__'||!tok){showErr(new Error('프로필 사진을 적용할 모임을 먼저 선택해주세요.'));return false}
 profileBusy=true;window.__kokmatchProfileSaveState='saving';
 try{
  const [thumb,full]=await Promise.all([encoded(file,320,210000,.84),encoded(file,1800,2400000,.86)]);directPreview(thumb);
  const x=await jsonRequest(PROFILE,{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+tok},body:JSON.stringify({action:'save_profile',groupId:g,memberId:memberId(),image:thumb,fullImage:full})});
  const saved=String(x.image||thumb);window.__kokmatchProfileSaveState='saved';directPreview(saved);
  if(typeof window.__kokmatchLoadProfiles56==='function')await window.__kokmatchLoadProfiles56(g,true);redrawProfile(saved);
  if(input)input.value='';try{alert('프로필 사진을 변경했어.')}catch{};return true;
 }catch(e){window.__kokmatchProfileSaveState='error';showErr(e);return false}finally{profileBusy=false;setTimeout(()=>{if(window.__kokmatchProfileSaveState==='saved')window.__kokmatchProfileSaveState='idle'},1200)}
}
async function deleteProfileFix1(){
 if(profileBusy)return false;const g=groupId(),tok=token();if(!g||g==='__global__'||!tok)return false;profileBusy=true;window.__kokmatchProfileSaveState='saving';
 try{await jsonRequest(PROFILE,{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+tok},body:JSON.stringify({action:'delete_profile',groupId:g,memberId:memberId()})});window.__kokmatchProfileSaveState='saved';if(typeof window.__kokmatchLoadProfiles56==='function')await window.__kokmatchLoadProfiles56(g,true);redrawProfile('');return true}catch(e){window.__kokmatchProfileSaveState='error';showErr(e);return false}finally{profileBusy=false;setTimeout(()=>{if(window.__kokmatchProfileSaveState==='saved')window.__kokmatchProfileSaveState='idle'},1200)}
}
function installProfile(){window.changeProfile53=saveProfileFix1;window.deleteProfile53=deleteProfileFix1;try{changeProfile53=saveProfileFix1}catch{};try{deleteProfile53=deleteProfileFix1}catch{}}

async function clearCaches(){try{if('caches'in window){const ks=await caches.keys();await Promise.all(ks.map(k=>caches.delete(k).catch(()=>false)))}}catch{};try{if('serviceWorker'in navigator){const rs=await navigator.serviceWorker.getRegistrations();await Promise.all(rs.map(r=>r.unregister().catch(()=>false)))}}catch{}}
async function forceUpdate(){if(updateBusy)return;updateBusy=true;const b=document.getElementById('headerRefresh51');if(b){b.disabled=true;b.textContent='최신본 불러오는 중…'};try{try{if(typeof saveRefreshState==='function')saveRefreshState()}catch{};try{localStorage.setItem('kokmatch_latest_version',VERSION);localStorage.setItem('kokmatch_latest_build',BUILD)}catch{};await clearCaches();try{await fetch('/index.html?kmupdate='+Date.now(),{cache:'no-store',headers:{'cache-control':'no-cache'}})}catch{};const u=new URL(location.origin+'/');u.searchParams.set('v',VERSION);u.searchParams.set('build',BUILD);u.searchParams.set('kmupdate',Date.now());location.replace(u.href)}catch(e){updateBusy=false;if(b){b.disabled=false;b.textContent='↻ 최신본 적용'};location.reload()}}
function updateCapture(e){const b=e.target?.closest?.('#headerRefresh51,[data-kokmatch-update],[onclick*="refreshApp"],[onclick*="forceUpdateApp"]');if(!b)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();forceUpdate()}
function installUpdate(){window.__kokmatchHardRefresh56=forceUpdate;window.forceUpdateApp=forceUpdate;window.refreshApp51=forceUpdate;window.refreshApp50=forceUpdate;window.refreshApp49=forceUpdate;try{forceUpdateApp=forceUpdate}catch{};try{refreshApp51=forceUpdate}catch{};if(!window.__kokmatchUpdateCapture561){window.__kokmatchUpdateCapture561=true;document.addEventListener('click',updateCapture,true)}const b=document.getElementById('headerRefresh51');if(b&&!updateBusy)b.textContent='↻ 최신본 적용'}

function install(){window.__kokmatchVersionLock=VERSION;window.__kokmatchBuild=BUILD;installUpdate();installSwitch();installProfile();try{document.documentElement.dataset.kokmatchVersion=VERSION;document.title='콕매치 v'+VERSION}catch{}}
install();
setInterval(()=>{installUpdate();installSwitch();if(window.changeProfile53!==saveProfileFix1)installProfile()},3000);
})();