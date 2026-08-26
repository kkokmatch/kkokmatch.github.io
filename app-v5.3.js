(()=>{
const CUR53='5.3';
const PROFILE53='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-profile-v53';
let profiles53={},profileGroup53='',profileLoading53=null,loginGuard53=false,loginGrace53=0;
const avatarPrev53=typeof avatar==='function'?avatar:null;

function style53(){if(document.getElementById('v53style'))return;const s=document.createElement('style');s.id='v53style';s.textContent=`
#topActions52{display:flex!important}
#headerRefresh52.v53hidden{display:none!important}
.profileAvatar53{width:42px!important;height:42px!important;min-width:42px!important;border-radius:50%!important;overflow:hidden!important;display:flex!important;align-items:center!important;justify-content:center!important;background:#eef2f7!important;color:#6b7280!important;font-size:22px!important;border:1px solid #dbe2ea!important;padding:0!important}
.profileAvatar53 img{width:100%!important;height:100%!important;object-fit:cover!important;display:block!important}
.queueProfile53{width:38px!important;height:38px!important;min-width:38px!important;font-size:19px!important;margin-left:2px}
.profileCard53{margin-bottom:12px}.profileHead53{display:flex;align-items:center;gap:14px}.profilePreview53{width:76px;height:76px;border-radius:50%;overflow:hidden;display:flex;align-items:center;justify-content:center;background:#eef2f7;border:1px solid #dbe2ea;font-size:34px;color:#6b7280;flex:0 0 76px}.profilePreview53 img{width:100%;height:100%;object-fit:cover}.profileBtns53{display:flex;gap:7px;flex-wrap:wrap;margin-top:9px}.profileHelp53{font-size:12px;line-height:1.45;margin-top:8px;color:#6b7280}
`;document.head.appendChild(s)}
function cmp53(a,b){const A=String(a||'0').replace(/^v/i,'').split('.').map(n=>Number(n)||0),B=String(b||'0').replace(/^v/i,'').split('.').map(n=>Number(n)||0);for(let i=0;i<Math.max(A.length,B.length);i++){const x=A[i]||0,y=B[i]||0;if(x!==y)return x>y?1:-1}return 0}
function shown53(){const lock=String(window.__kokmatchVersionLock||'').replace(/^v/i,'');return lock&&cmp53(lock,CUR53)>0?lock:CUR53}
async function syncUpdateButton53(){const b=document.getElementById('headerRefresh52');if(!b)return;try{const r=await fetch('/latest-version.json?t='+Date.now(),{cache:'no-store'});if(!r.ok)throw new Error();const x=await r.json();const latest=String(x.semanticVersion||x.label||shown53()).replace(/^v/i,'')||shown53();const newer=cmp53(latest,shown53())>0;b.classList.toggle('v53hidden',!newer);if(newer)b.textContent=`v${latest} 업데이트 · 새로고침`}catch{b.classList.add('v53hidden')}}
function markVersion53(){const shown=shown53();document.title='콕매치 v'+shown;document.documentElement.dataset.kokmatchVersion=shown;const v=document.getElementById('currentVersion52');if(v&&v.textContent!=='v'+shown)v.textContent='v'+shown;syncUpdateButton53()}
function watchVersion53(){markVersion53();const v=document.getElementById('currentVersion52');if(v&&!v.dataset.v53watch){v.dataset.v53watch='1';new MutationObserver(()=>{const expected='v'+shown53();if(v.textContent!==expected)v.textContent=expected}).observe(v,{childList:true,characterData:true,subtree:true})}}
function profileKey53(m){return String(m?.id||'')}
function fallbackAvatar53(m,extra=''){if(avatarPrev53){const h=String(avatarPrev53(m)||'');if(extra&&h.includes('class="avatar '))return h.replace('class="avatar ','class="avatar '+extra+' ');return h}return `<div class="avatar ${extra} ${m?.gender==='여'?'female':'male'}">●</div>`}
function avatarHtml53(m,extra=''){const p=profiles53[profileKey53(m)]?.image||'';return p?`<div class="avatar profileAvatar53 ${extra}"><img src="${p}" alt="${esc(m?.name||'프로필')} 프로필"></div>`:fallbackAvatar53(m,extra)}
try{avatar=function(m){return avatarHtml53(m)}}catch{window.avatar=(m)=>avatarHtml53(m)}

function clearIdentityMarks53(card){if(!card)return;card.querySelectorAll('.avatar,.genderPerson54,.genderAvatar39,.profileAvatar53,.queueProfile53').forEach(el=>el.remove())}
function decorateQueue53(){const box=typeof $==='function'?$('queue'):document.getElementById('queue');if(!box||typeof sortedQueue!=='function')return;const ids=sortedQueue();const cards=[...box.querySelectorAll('.queueCard')];cards.forEach((card,i)=>{const id=ids[i],m=id&&typeof M==='function'?M(id):null;if(!m)return;clearIdentityMarks53(card);const ord=card.querySelector('.ord');if(ord)ord.insertAdjacentHTML('afterend',avatarHtml53(m,'queueProfile53'));const meta=card.querySelector('.meta');if(meta){meta.textContent=String(meta.textContent||'').replace(/^\s*(남|여)\s*·\s*/,'')}})}
const renderQueuePrev53=renderQueue;
renderQueue=function(){const r=renderQueuePrev53();decorateQueue53();return r};

async function profileJson53(url,opt={}){const r=await fetch(url,opt);const x=await r.json().catch(()=>({}));if(!r.ok){const e=new Error(x.error||'프로필 처리 중 오류가 발생했습니다.');e.status=r.status;throw e}return x}
async function loadProfiles53(force=false){if(!T||!currentGroupId||String(currentGroupId)==='__global__')return;const gid=String(currentGroupId);if(!force&&profileGroup53===gid)return;if(profileLoading53)return profileLoading53;profileLoading53=(async()=>{try{const u=new URL(PROFILE53);u.searchParams.set('groupId',gid);u.searchParams.set('t',Date.now());const x=await profileJson53(u,{headers:{authorization:'Bearer '+T},cache:'no-store'});if(String(currentGroupId)!==gid)return;profiles53=x.profiles||{};profileGroup53=gid;try{renderMembers();renderQueue();if(currentView==='settings')renderSettings()}catch{}}finally{profileLoading53=null}})();return profileLoading53}
function resetProfiles53(){profiles53={};profileGroup53=''}

const renderAllPrev53=renderAll;
renderAll=function(){const r=renderAllPrev53();style53();watchVersion53();decorateQueue53();const gid=String(currentGroupId||'');if(gid&&gid!=='__global__'&&profileGroup53!==gid){resetProfiles53();queueMicrotask(()=>loadProfiles53().catch(()=>{}))}return r};

const reloginPrev53=reloginLatest;
reloginLatest=async function(...args){if(loginGuard53||Date.now()<loginGrace53)return;return reloginPrev53(...args)};
const submitLoginPrev53=submitLogin;
submitLogin=async function(...args){const before=String(T||'');loginGuard53=true;try{const r=await submitLoginPrev53(...args);if(T&&String(T)!==before){loginGrace53=Date.now()+12000;resetProfiles53();queueMicrotask(()=>loadProfiles53(true).catch(()=>{}))}return r}finally{if(T&&String(T)!==before)loginGrace53=Math.max(loginGrace53,Date.now()+12000);loginGuard53=false}};

function profilePreview53(){const id=String(me?.memberId||'');const p=profiles53[id]?.image||'';return p?`<div class="profilePreview53"><img src="${p}" alt="내 프로필 사진"></div>`:`<div class="profilePreview53">${me?.memberId&&typeof M==='function'?avatarHtml53(M(me.memberId)):''}</div>`}
function profileCard53(){const usable=!!me?.memberId;return `<div class="card profileCard53" id="profileCard53"><div class="profileHead53">${profilePreview53()}<div><div class="name">내 프로필 사진</div><div class="meta">회원명부와 개인 게임대기에 표시됩니다.</div>${usable?`<div class="profileBtns53"><label class="btn pri" for="profileFile53">사진 변경</label><input id="profileFile53" type="file" accept="image/*" style="display:none" onchange="changeProfile53(this)">${profiles53[String(me.memberId||'')]?.image?'<button class="btn ghost" onclick="deleteProfile53()">기본 사진으로</button>':''}</div>`:'<div class="profileHelp53">회원으로 연결된 계정에서 설정할 수 있습니다.</div>'}</div></div><div class="profileHelp53">선택한 사진은 정사각형으로 자동 맞춤되며 프로필용으로 축소 저장됩니다.</div></div>`}
const renderSettingsPrev53=renderSettings;
renderSettings=function(){const r=renderSettingsPrev53();style53();watchVersion53();const box=typeof $==='function'?$('settings'):document.getElementById('settings');if(!box||box.querySelector('#profileCard53'))return r;const first=box.querySelector('.card');if(first)first.insertAdjacentHTML('beforebegin',profileCard53());else box.insertAdjacentHTML('afterbegin',profileCard53());return r};

function imageToProfile53(file){return new Promise((resolve,reject)=>{if(!file)return reject(new Error('사진을 선택해주세요.'));if(file.size>20*1024*1024)return reject(new Error('원본 사진은 20MB 이하만 선택할 수 있습니다.'));const rd=new FileReader();rd.onerror=()=>reject(new Error('사진을 읽지 못했습니다.'));rd.onload=()=>{const im=new Image();im.onerror=()=>reject(new Error('사진 형식을 확인해주세요.'));im.onload=()=>{try{const size=Math.min(im.naturalWidth,im.naturalHeight),sx=(im.naturalWidth-size)/2,sy=(im.naturalHeight-size)/2,c=document.createElement('canvas');c.width=256;c.height=256;const g=c.getContext('2d');g.drawImage(im,sx,sy,size,size,0,0,256,256);let data=c.toDataURL('image/jpeg',.8);if(data.length>210000)data=c.toDataURL('image/jpeg',.65);if(data.length>210000)return reject(new Error('사진 용량을 줄인 뒤 다시 선택해주세요.'));resolve(data)}catch(e){reject(e)}};im.src=String(rd.result||'')};rd.readAsDataURL(file)})}
window.changeProfile53=async function(input){const f=input?.files?.[0];if(!f)return;const label=document.querySelector('label[for="profileFile53"]');const old=label?.textContent;if(label){label.textContent='저장 중…';label.style.pointerEvents='none'}try{const image=await imageToProfile53(f);const x=await profileJson53(PROFILE53,{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+T},body:JSON.stringify({action:'save_profile',groupId:currentGroupId,image}),cache:'no-store'});profiles53[String(me.memberId)]={image:x.image||image,updatedAt:new Date().toISOString()};profileGroup53=String(currentGroupId);renderMembers();renderQueue();if(currentView==='settings')renderSettings()}catch(e){if(typeof showError==='function')showError(e);else alert(e.message)}finally{if(input)input.value='';if(label){label.textContent=old||'사진 변경';label.style.pointerEvents=''}}};
window.deleteProfile53=async function(){if(!me?.memberId)return;try{await profileJson53(PROFILE53,{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+T},body:JSON.stringify({action:'delete_profile',groupId:currentGroupId}),cache:'no-store'});delete profiles53[String(me.memberId)];profileGroup53=String(currentGroupId);renderMembers();renderQueue();if(currentView==='settings')renderSettings()}catch(e){if(typeof showError==='function')showError(e)}};

const goViewPrev53=goView;
goView=function(id){const r=goViewPrev53(id);if(id==='settings'||id==='members'||id==='queue')loadProfiles53().catch(()=>{});return r};

style53();watchVersion53();
setTimeout(()=>{watchVersion53();if(T)loadProfiles53().catch(()=>{});try{renderHeader();renderNav();if(currentView==='settings')renderSettings();if(currentView==='queue')decorateQueue53()}catch{}},0);
setInterval(()=>syncUpdateButton53(),60000);
})();
(()=>{if(window.__kokmatchV54Loader)return;window.__kokmatchV54Loader=true;const s=document.createElement('script');s.src='/app-v5.4.js?v=5.4&hotfix=4&t='+Date.now();s.async=false;s.onerror=()=>console.error('콕매치 v5.4 로드 실패');document.body.appendChild(s)})();