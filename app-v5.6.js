(()=>{
if(window.__kokmatchV56Core)return;
window.__kokmatchV56Core=true;
window.__kokmatchV56=true;
window.__kokmatchV56Patch='1.4';
window.__kokmatchV56Build='2026.08.28.1';

const VERSION='5.6';
const BUILD='2026.08.28.1';
const MULTI='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-multi-api';
const PROFILE='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-profile-v53';
const AUTH='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-auth-v38';
const profileCache56=new Map(),profileLoaded56=new Set(),profileBusy56=new Map(),profileQueued56=new Map(),profileRetry56=new Map();
let lastGroup56='',switchBusy56=false,stateSeq56=0,updateBusy56=false,raf56=0;

function appToken(){try{return String(typeof T!=='undefined'?(T||''):'')}catch{return String(window.T||'')}}
function appGroupId(){try{return String(typeof currentGroupId!=='undefined'?(currentGroupId||''):'')}catch{return String(window.currentGroupId||'')}}
function appMe(){try{return typeof me!=='undefined'?me:null}catch{return window.me||null}}
function appGroup(){try{return typeof group!=='undefined'?group:null}catch{return window.group||null}}
function appView(){try{return String(typeof currentView!=='undefined'?(currentView||'members'):'members')}catch{return String(window.currentView||'members')}}
function setToken56(v){v=String(v||'');try{T=v}catch{};window.T=v;try{localStorage.setItem(typeof TOKEN_KEY!=='undefined'?TOKEN_KEY:'kokmatch_token',v)}catch{}}
function setGroupId56(v){v=String(v||'');try{currentGroupId=v}catch{};window.currentGroupId=v;try{localStorage.setItem(typeof GROUP_KEY!=='undefined'?GROUP_KEY:'kokmatch_group_id',v)}catch{}}
function mirrorState56(){try{window.T=appToken();window.currentGroupId=appGroupId();window.me=appMe();window.group=appGroup();window.currentView=appView()}catch{}}
function memberById56(id){try{return id&&typeof M==='function'?M(String(id)):null}catch{return null}}
function currentMemberId56(){try{return String(window.resolveProfileMemberId54?.()||appMe()?.memberId||'')}catch{return String(appMe()?.memberId||'')}}
const esc56=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function gender56(m){const g=String(m?.gender||'').trim().toLowerCase();return ['여','여자','여성','f','female'].includes(g)?'여':'남'}

function writeVersion56(){
 try{window.__kokmatchVersionLock=VERSION}catch{}
 try{if(document.documentElement.dataset.kokmatchVersion!==VERSION)document.documentElement.dataset.kokmatchVersion=VERSION}catch{}
 try{const title='콕매치 v'+VERSION;if(document.title!==title)document.title=title}catch{}
 for(const id of ['currentVersion51','currentVersion52']){const e=document.getElementById(id);if(e&&e.textContent!=='v'+VERSION)e.textContent='v'+VERSION}
}
function decorateUpdate56(){const b=document.getElementById('headerRefresh51');if(b&&!updateBusy56&&b.textContent!=='↻ 최신본 적용')b.textContent='↻ 최신본 적용'}
async function clearClientCaches56(){
 try{if('caches'in window){const ks=await caches.keys();await Promise.all(ks.map(k=>caches.delete(k).catch(()=>false)))}}catch{}
 try{if('serviceWorker'in navigator){const rs=await navigator.serviceWorker.getRegistrations();await Promise.all(rs.map(r=>r.unregister().catch(()=>false)))}}catch{}
}
async function hardRefresh56(){
 if(updateBusy56)return;updateBusy56=true;const b=document.getElementById('headerRefresh51');if(b){b.disabled=true;b.textContent='최신본 불러오는 중…'}
 try{try{if(typeof saveRefreshState==='function')saveRefreshState()}catch{};await clearClientCaches56();try{await fetch('/index.html?build='+encodeURIComponent(BUILD)+'&t='+Date.now(),{cache:'reload',headers:{'cache-control':'no-cache'}})}catch{};const u=new URL(location.href);u.pathname='/';u.search='?v='+encodeURIComponent(VERSION)+'&build='+encodeURIComponent(BUILD)+'&refresh='+Date.now();u.hash='';location.replace(u.href);setTimeout(()=>{try{location.reload()}catch{}},1800)}catch(e){updateBusy56=false;if(b){b.disabled=false;b.textContent='↻ 최신본 적용'};try{location.reload()}catch{}}
}
function installUpdate56(){
 window.refreshApp51=hardRefresh56;window.refreshApp50=hardRefresh56;window.refreshApp49=hardRefresh56;window.forceUpdateApp=hardRefresh56;
 try{refreshApp51=hardRefresh56}catch{};try{forceUpdateApp=hardRefresh56}catch{}
 decorateUpdate56();
}
window.__kokmatchHardRefresh56=hardRefresh56;

function profileMap56(g){g=String(g||'');if(!profileCache56.has(g))profileCache56.set(g,{});return profileCache56.get(g)}
function photo56(m,g=appGroupId()){const id=String(m?.id||'');return String(profileMap56(String(g||''))?.[id]?.image||'')}
function avatar56(m){const p=photo56(m),female=gender56(m)==='여';return p?`<div class="avatar profileAvatar53 ${female?'female':'male'}"><img src="${p}" alt="${esc56(m?.name||'프로필')} 프로필"></div>`:`<div class="avatar ${female?'female':'male'}">●</div>`}
function installAvatar56(){try{avatar=avatar56}catch{};window.avatar=avatar56}
function cacheOneProfile56(g,id,image){g=String(g||'');id=String(id||'');if(!g||!id)return;const map={...profileMap56(g)};if(image)map[id]={...(map[id]||{}),image:String(image)};else delete map[id];profileCache56.set(g,map)}

async function startProfileFetch56(g){
 const token=appToken(),u=new URL(PROFILE);u.searchParams.set('groupId',g);u.searchParams.set('t',Date.now());
 const p=(async()=>{const r=await fetch(u,{headers:{authorization:'Bearer '+token},cache:'no-store'}),x=await r.json().catch(()=>({}));if(!r.ok)throw new Error(x.error||'프로필 조회 실패');const map=x&&typeof x.profiles==='object'&&x.profiles?x.profiles:{};profileCache56.set(g,map);profileLoaded56.add(g);profileRetry56.delete(g);if(g===appGroupId()){refreshProfileUi56(true)}return map})().catch(e=>{profileRetry56.set(g,Date.now()+3000);console.warn('v5.6 profiles',e);return profileMap56(g)}).finally(()=>{if(profileBusy56.get(g)===p)profileBusy56.delete(g)});
 profileBusy56.set(g,p);return p;
}
function loadProfiles56(group=appGroupId(),force=false){
 const g=String(group||'');if(!g||g==='__global__'||!appToken())return Promise.resolve(profileMap56(g));
 const busy=profileBusy56.get(g);if(busy){if(force){let q=profileQueued56.get(g);if(!q){q=busy.catch(()=>{}).then(()=>{profileQueued56.delete(g);return startProfileFetch56(g)});profileQueued56.set(g,q)}return q}return busy}
 if(!force&&profileLoaded56.has(g))return Promise.resolve(profileMap56(g));if(!force&&Date.now()<(profileRetry56.get(g)||0))return Promise.resolve(profileMap56(g));return startProfileFetch56(g)
}
window.__kokmatchLoadProfiles56=loadProfiles56;

function queueMembers56(){try{return typeof sortedQueue==='function'?sortedQueue().map(id=>memberById56(id)):[]}catch{return[]}}
function makeIdentity56(m,queue=false){const p=photo56(m),female=gender56(m)==='여',d=document.createElement('div');d.className=`avatar profileIdentity80 genderVisual10 ${p?'profileTap80 profileAvatar53':'genderFallback80 genderAvatar39'} ${female?'female':'male'}${queue?' queueProfile53':''}`;d.dataset.memberId=String(m?.id||'');d.dataset.memberId56=String(m?.id||'');d.dataset.gender=female?'여':'남';d.dataset.photo=p?'1':'0';d.setAttribute('aria-label',p?`${String(m?.name||'회원')} 프로필 사진 크게 보기`:(female?'여성':'남성'));if(p){d.setAttribute('role','button');d.setAttribute('tabindex','0');const im=document.createElement('img');im.src=p;im.alt=`${String(m?.name||'프로필')} 프로필`;d.appendChild(im)}else d.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="7" r="4"></circle><path d="M4.5 21c.5-5 3.2-8 7.5-8s7 3 7.5 8z"></path></svg>';return d}
function directIdentity56(card){return [...(card?.children||[])].find(x=>x.classList?.contains('avatar')||x.classList?.contains('profileIdentity80')||x.classList?.contains('genderAvatar39')||x.classList?.contains('queueProfile53'))}
function sameIdentity56(el,m){if(!el||!m)return false;const p=photo56(m),g=gender56(m);return String(el.dataset?.memberId||el.dataset?.memberId56||'')===String(m.id)&&String(el.dataset?.gender||'')===g&&String(el.dataset?.photo||'0')===(p?'1':'0')&&(!p||String(el.querySelector?.('img')?.getAttribute('src')||'')===p)}
function clearDirect56(card){for(const x of [...(card?.children||[])])if(x.classList?.contains('avatar')||x.classList?.contains('profileIdentity80')||x.classList?.contains('genderAvatar39')||x.classList?.contains('genderPerson54')||x.classList?.contains('genderPerson57')||x.classList?.contains('genderMini39')||x.classList?.contains('genderMark53')||x.classList?.contains('v54genderText')||x.classList?.contains('queueProfile53'))x.remove()}
function memberForCard56(card){let id=String(card?.dataset?.memberId80||card?.dataset?.memberId56||'');if(!id){const p=card?.querySelector?.('.pairBtn')?.getAttribute('onclick')||'';const hit=p.match(/openPairs\(['"]([^'"]+)['"]\)/);if(hit)id=hit[1]}const m=memberById56(id);if(m){card.dataset.memberId56=String(m.id);card.dataset.memberId80=String(m.id)}return m}
function fixMemberCard56(card,m){if(!m)return;const cur=directIdentity56(card);if(!sameIdentity56(cur,m)){clearDirect56(card);card.insertBefore(makeIdentity56(m,false),card.firstChild)}card.dataset.memberId56=String(m.id);card.dataset.memberId80=String(m.id)}
function fixQueueCard56(card,m){if(!m)return;const cur=directIdentity56(card);if(!sameIdentity56(cur,m)){clearDirect56(card);const d=makeIdentity56(m,true),ord=card.querySelector('.ord');if(ord)ord.insertAdjacentElement('afterend',d);else card.insertBefore(d,card.firstChild)}card.dataset.memberId56=String(m.id);card.dataset.memberId80=String(m.id)}
function patchSettingsPhoto56(){try{const g=appGroupId();if(!profileLoaded56.has(g))return;const card=document.getElementById('profileCard53');if(!card)return;const id=currentMemberId56(),p=String(profileMap56(g)?.[id]?.image||''),prev=card.querySelector('.profilePreview53');if(prev){if(p){const cur=prev.querySelector('img')?.getAttribute('src')||'';if(cur!==p)prev.innerHTML=`<img src="${p}" alt="내 프로필 사진">`}else if(prev.querySelector('img')){const m=memberById56(id);prev.innerHTML=m?avatar56(m):''}}const del=card.querySelector('.profileBtns53 .btn.ghost');if(p&&!del){const box=card.querySelector('.profileBtns53');if(box)box.insertAdjacentHTML('beforeend','<button class="btn ghost" type="button" onclick="deleteProfile53()">기본 사진으로</button>')}else if(!p&&del)del.remove()}catch(e){console.warn('v5.6 settings photo',e)}}
function decorateLogin56(){try{const box=document.getElementById('loginBox');if(!box)return;const h=String(box.querySelector('h2')?.textContent||'');if(h==='회원 선택'){const note=box.querySelector('.note');if(note)note.textContent='같은 이름의 회원이 있습니다. 이름과 출생연도를 확인하고 본인을 선택해주세요.';box.querySelectorAll('.choiceList .choiceBtn').forEach(b=>{b.querySelector('small')?.remove();const s=b.querySelector('span');if(s){const year=(String(s.textContent||'').match(/\d{4}년생|출생연도 미등록/)||[])[0]||'';s.textContent=year}})}else if(/모임 PIN/.test(h)){box.querySelectorAll('.loginMember33 small').forEach(x=>x.remove())}}catch{}}
function canonicalize56(){writeVersion56();decorateUpdate56();mirrorState56();try{document.querySelectorAll('#members .memberCard').forEach(card=>fixMemberCard56(card,memberForCard56(card)));const ms=queueMembers56(),cards=[...document.querySelectorAll('#queue .queueCard')];cards.forEach((card,i)=>fixQueueCard56(card,ms[i]||null));patchSettingsPhoto56();decorateLogin56()}catch(e){console.warn('v5.6 identity',e)}}
function refreshProfileUi56(render=false){if(render&&appGroupId()!=='__global__'){try{if(typeof renderMembers==='function')renderMembers();if(typeof renderQueue==='function')renderQueue();if(appView()==='settings'&&typeof renderSettings==='function')renderSettings()}catch{}}requestAnimationFrame(canonicalize56)}
function watchProfiles56(){const g=appGroupId();if(g!==lastGroup56){lastGroup56=g;canonicalize56();if(g&&g!=='__global__'&&appToken())loadProfiles56(g,false);return}if(g&&g!=='__global__'&&appToken()&&!profileLoaded56.has(g)&&!profileBusy56.has(g)&&Date.now()>=(profileRetry56.get(g)||0))loadProfiles56(g,false)}

function wrapProfileActions56(){
 const changePrev=window.changeProfile53,deletePrev=window.deleteProfile53;
 if(typeof changePrev==='function'&&!changePrev.__v56profile){const w=async function(input){const g=appGroupId(),id=currentMemberId56();const r=await changePrev.apply(this,arguments);if(String(window.__kokmatchProfileSaveState||'')==='error')return r;if(g===appGroupId()&&id){const src=String(document.querySelector('#profileCard53 .profilePreview53 img')?.getAttribute('src')||'');if(src){cacheOneProfile56(g,id,src);refreshProfileUi56(true)}await loadProfiles56(g,true);refreshProfileUi56(false)}return r};w.__v56profile=true;window.changeProfile53=w;try{changeProfile53=w}catch{}}
 if(typeof deletePrev==='function'&&!deletePrev.__v56profile){const w=async function(){const g=appGroupId(),id=currentMemberId56();const r=await deletePrev.apply(this,arguments);if(String(window.__kokmatchProfileSaveState||'')==='error')return r;if(g===appGroupId()&&id){cacheOneProfile56(g,id,'');profileLoaded56.add(g);refreshProfileUi56(true);await loadProfiles56(g,true);refreshProfileUi56(false)}return r};w.__v56profile=true;window.deleteProfile53=w;try{deleteProfile53=w}catch{}}
}

async function fetchState56(target,token){const u=new URL(MULTI);u.searchParams.set('api','state');if(target)u.searchParams.set('groupId',target);u.searchParams.set('t',Date.now());const r=await fetch(u,{headers:{'content-type':'application/json',...(token?{authorization:'Bearer '+token}:{})},cache:'no-store'}),x=await r.json().catch(()=>({}));if(!r.ok){const e=new Error(x.error||'모임 정보를 불러오지 못했습니다.');e.status=r.status;throw e}const gid=String(x?.group?.groupId||'');if(target&&gid!==target)throw new Error('선택한 모임 정보를 불러오지 못했습니다.');return x}
function applyState56(x,target,seq,restore=true){if(seq!==stateSeq56||appGroupId()!==target)return false;const gid=String(x?.group?.groupId||'');if(!gid||gid!==target)return false;try{S=x.data;me=x.user;group=x.group;if(Array.isArray(x.groups))groups=x.groups;if(Array.isArray(x.groupSummaries))groupSummaries=x.groupSummaries;currentGroupId=gid}catch(e){console.warn('v5.6 state apply',e);return false}setGroupId56(gid);try{if(typeof normalizeClient==='function')normalizeClient()}catch{};try{if(typeof renderAll==='function')renderAll()}catch(e){console.warn('v5.6 render after state',e)};if(restore)try{if(typeof restoreRefreshState==='function')restoreRefreshState()}catch{};mirrorState56();return true}
async function safeLoadState56(arg){const opts=arg&&typeof arg==='object'?arg:{},target=String(opts.target||appGroupId()||'');if(!target||!appToken())return false;if(switchBusy56&&!opts.allowDuringSwitch)return false;const seq=++stateSeq56,token=String(opts.token||appToken());const x=await fetchState56(target,token);if(seq!==stateSeq56||appGroupId()!==target)return false;return applyState56(x,target,seq,opts.restore!==false)}
window.__kokmatchLoadState56=safeLoadState56;window.loadState=safeLoadState56;try{loadState=safeLoadState56}catch{}

async function postAuth56(body,tok=appToken()){const r=await fetch(AUTH,{method:'POST',headers:{'content-type':'application/json',...(tok?{authorization:'Bearer '+tok}:{})},body:JSON.stringify(body),cache:'no-store'}),x=await r.json().catch(()=>({}));if(!r.ok){const e=new Error(x.error||'모임 전환에 실패했습니다.');e.status=r.status;throw e}return x}
function switchUi56(on){const b=document.getElementById('groupBtn');if(!b)return;if(on){b.disabled=true;b.classList.add('groupSwitching12','switching52');b.dataset.v56old=b.textContent||'';b.textContent='모임 변경 중…'}else{b.classList.remove('groupSwitching12','switching52');b.disabled=false;try{if(typeof renderHeader==='function')renderHeader()}catch{};if(b.textContent==='모임 변경 중…'&&b.dataset.v56old)b.textContent=b.dataset.v56old;delete b.dataset.v56old}}
async function rollback56(oldG,oldT,newT,global){let tok=oldT;if(!global&&newT){try{const x=await postAuth56({action:'switch_group',groupId:oldG},newT);tok=String(x.token||tok)}catch{}}setToken56(tok);setGroupId56(oldG);stateSeq56++;try{await safeLoadState56({target:oldG,token:tok,restore:false,allowDuringSwitch:true})}catch{};mirrorState56();canonicalize56()}
async function switchStable56(target,adminHint=false,view=''){target=String(target||'');if(!target||switchBusy56)return false;const oldG=appGroupId();if(target===oldG){try{closeModal()}catch{};return true}const oldT=appToken(),oldView=String(view||appView()||'members'),global=appMe()?.globalAdmin===true;let newT=oldT;switchBusy56=true;window.__kokmatchGroupSwitching12=true;switchUi56(true);stateSeq56++;try{if(!global){const x=await postAuth56({action:'switch_group',groupId:target},oldT);newT=String(x.token||oldT);target=String(x.groupId||target);setToken56(newT)}setGroupId56(target);try{closeModal()}catch{};const ok=await safeLoadState56({target,token:newT,restore:false,allowDuringSwitch:true});if(!ok||appGroupId()!==target||String(appGroup()?.groupId||'')!==target)throw new Error('선택한 모임 정보를 불러오지 못했습니다.');try{if(oldView&&typeof goView==='function')goView(oldView)}catch{};try{if(oldView==='members'&&typeof window.memberPageGo46==='function')window.memberPageGo46(1)}catch{};try{window.scrollTo?.(0,0)}catch{};lastGroup56=target;canonicalize56();loadProfiles56(target,true).catch(()=>{});return true}catch(e){console.warn('v5.6 group switch',e);await rollback56(oldG,oldT,newT,global);try{if(oldView&&typeof goView==='function')goView(oldView)}catch{};if(typeof showError==='function')showError(e);else alert(e?.message||String(e));return false}finally{switchBusy56=false;window.__kokmatchGroupSwitching12=false;switchUi56(false);mirrorState56();canonicalize56()}}
function installSwitch56(){const own=async id=>switchStable56(id,false,'');own.__v56stable=true;const adm=async(id,view='members')=>switchStable56(id,true,view);adm.__v56stable=true;const sg=(id,view='members')=>appMe()?.globalAdmin===true?adm(id,view):own(id);sg.__v56stable=true;window.switchOwnGroup38=own;window.adminSwitchGroup38=adm;window.switchGroup=sg;try{switchOwnGroup38=own}catch{};try{adminSwitchGroup38=adm}catch{};try{switchGroup=sg}catch{}}

function wrapRender56(name){try{const f=window[name]||eval(name);if(typeof f!=='function'||f.__v56core)return;const w=function(){const r=f.apply(this,arguments);queueMicrotask(()=>{watchProfiles56();canonicalize56()});return r};w.__v56core=true;window[name]=w;try{eval(`${name}=window[name]`)}catch{}}catch{}}
const versionMo56=new MutationObserver(()=>queueMicrotask(()=>{writeVersion56();decorateUpdate56()}));
const identityMo56=new MutationObserver(()=>{if(raf56)return;raf56=requestAnimationFrame(()=>{raf56=0;canonicalize56()})});
function start56(){writeVersion56();installUpdate56();installAvatar56();installSwitch56();wrapProfileActions56();['renderMembers','renderQueue','renderAll','renderHeader','renderSettings'].forEach(wrapRender56);try{versionMo56.observe(document.documentElement,{attributes:true,attributeFilter:['data-kokmatch-version']});const t=document.querySelector('title');if(t)versionMo56.observe(t,{childList:true,subtree:true,characterData:true})}catch{};for(const id of ['members','queue','loginBox']){const el=document.getElementById(id);if(el)identityMo56.observe(el,{childList:true,subtree:true})}watchProfiles56();canonicalize56()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start56,{once:true});else start56();
setInterval(()=>{writeVersion56();decorateUpdate56();mirrorState56();watchProfiles56();decorateLogin56()},3000);
})();