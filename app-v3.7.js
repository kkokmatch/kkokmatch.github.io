(()=>{
const VER37='3.7';
const LOGIN37_API='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-login-v33';
const MEMBER37_API='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-member-v45';
let loginCandidates37=[],selectedLogin37=null,loginBusy37=false,loginFinalizing37=false;
let prefetchTimer37=0,composing37=false,latestVersion37=VER37;
const probeCache37=new Map();

async function loginReq37(action,body={}){
 const r=await fetch(LOGIN37_API,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action,...body}),cache:'no-store'});
 const x=await r.json().catch(()=>({}));
 if(!r.ok){const e=new Error(x.error||'로그인 처리에 실패했습니다.');e.payload=x;throw e}
 return x;
}
async function probeName37(name,force=false){
 const key=String(name||'').trim();if(!key)throw new Error('이름을 입력해주세요.');
 const cached=probeCache37.get(key);if(!force&&cached&&Date.now()-cached.at<5000)return cached.data;
 const data=await loginReq37('probe',{name:key});probeCache37.set(key,{at:Date.now(),data});return data;
}
function candidateInfo37(c){
 const year=c.year?`${esc(c.year)}년생`:'출생연도 미등록';
 const gender=String(c.gender||'').trim();
 const cls=c.cls?`${esc(c.cls)}급`:'급수 미등록';
 const role=esc(c.roleLabel||'회원');
 return[year,gender?esc(gender):'',cls,role].filter(Boolean).join(' · ');
}
function candidateHtml37(c,i){return `<button type="button" class="choiceBtn loginChoice33" onclick="chooseLoginMember37(${i})"><b>${esc(pendingLoginName)}</b><span>${candidateInfo37(c)}</span><small>${esc(c.groupName||'모임')}</small></button>`}
window.renderLoginCandidates37=function(){
 if(!loginCandidates37.length)return renderLoginName();
 $('loginBox').innerHTML=`<h2>${loginCandidates37.length>1?'회원 선택':'회원 확인'}</h2><div class="authName">${esc(pendingLoginName)}</div><div class="note loginGuide33">${loginCandidates37.length>1?'같은 이름 또는 여러 모임의 회원정보가 있습니다. 출생연도·성별·급수·역할·모임을 확인하고 본인을 선택해주세요.':'회원정보를 확인해주세요.'}</div><div class="choiceList loginChoices33">${loginCandidates37.map(candidateHtml37).join('')}</div><div id="loginErr" class="error"></div><button class="btn ghost" style="width:100%;margin-top:9px" onclick="renderLoginName()">← 이름 다시 입력</button>`;
};
window.chooseLoginMember37=function(i){const c=loginCandidates37[Number(i)];if(!c)return;selectedLogin37=c;renderLoginPin37()};
function renderLoginPin37(){
 const c=selectedLogin37;if(!c)return renderLoginCandidates37();
 const adminOnly=!!c.globalAdminOnly,title=adminOnly?'총관리자 PIN':'모임 PIN';
 $('loginBox').innerHTML=`<h2>${title} 입력</h2><div class="loginMember33"><b>${esc(pendingLoginName)}</b><span>${adminOnly?'총관리자':candidateInfo37(c)}</span><small>${adminOnly?'':esc(c.groupName||'모임')}</small></div><div class="note" style="margin-bottom:12px">${adminOnly?'총관리자 PIN을 입력해주세요.':'선택한 모임의 모임 PIN을 입력해주세요.'}</div><div class="field"><label>${title}</label><input id="loginPin" type="password" inputmode="numeric" autocomplete="current-password" placeholder="${title} 입력"></div><button id="loginSubmit37" class="btn pri" style="width:100%" onclick="submitLogin()">로그인</button><div id="loginErr" class="error"></div><button class="btn ghost" style="width:100%;margin-top:8px" onclick="${loginCandidates37.length>1?'renderLoginCandidates37()':'renderLoginName()'}">← ${loginCandidates37.length>1?'회원 다시 선택':'이름 다시 입력'}</button>`;
 const p=$('loginPin');if(p){p.addEventListener('keydown',e=>{if(e.key==='Enter')submitLogin()});setTimeout(()=>p.focus(),20)}
}
function scheduleProbe37(){
 clearTimeout(prefetchTimer37);if(composing37)return;
 const name=$('loginName')?.value.trim()||'';if(name.length<2)return;
 prefetchTimer37=setTimeout(()=>probeName37(name).catch(()=>{}),220);
}
renderLoginName=function(){
 loginCandidates37=[];selectedLogin37=null;pendingLoginPin='';
 $('loginBox').innerHTML=`<h1>🏸 콕매치</h1><div class="meta" style="font-size:14px;margin-bottom:18px">모임 회원 로그인</div><div class="field"><label>등록된 이름</label><input id="loginName" autocomplete="username" placeholder="이름"></div><button id="loginNext37" class="btn pri" style="width:100%" onclick="startLogin()">다음</button><div id="loginErr" class="error"></div><div class="note" style="margin-top:12px">동명이인이 있으면 <b>이름 · 출생연도 · 성별 · 급수 · 역할 · 모임</b>을 확인해 본인을 선택한 뒤 모임 PIN으로 로그인합니다.</div>`;
 const n=$('loginName');if(n){n.addEventListener('compositionstart',()=>{composing37=true});n.addEventListener('compositionend',()=>{composing37=false;scheduleProbe37()});n.addEventListener('input',scheduleProbe37);n.addEventListener('keydown',e=>{if(e.key==='Enter'&&!composing37)startLogin()});setTimeout(()=>n.focus(),20)}
};
startLogin=async function(){
 if(loginBusy37)return;const name=$('loginName')?.value.trim()||'',err=$('loginErr'),btn=$('loginNext37');
 if(err)err.textContent='';if(!name){if(err)err.textContent='이름을 입력해주세요.';return}
 loginBusy37=true;if(btn){btn.disabled=true;btn.textContent='회원정보 확인 중...'}
 try{
  const x=await probeName37(name);pendingLoginName=name;
  loginCandidates37=(Array.isArray(x.memberships)?x.memberships:[]).map(c=>({...c}));
  if(!loginCandidates37.length&&x.globalAdmin)loginCandidates37.push({globalAdminOnly:true,groupId:'',groupName:'',memberId:'',year:'',gender:'',cls:'',roleLabel:'총관리자'});
  if(loginCandidates37.length===1){selectedLogin37=loginCandidates37[0];renderLoginPin37()}else renderLoginCandidates37();
 }catch(e){if(err)err.textContent=e.message}
 finally{loginBusy37=false;if(btn&&document.body.contains(btn)){btn.disabled=false;btn.textContent='다음'}}
};
async function finalizeLogin37(x,c){
 T=x.token;localStorage.setItem(TOKEN_KEY,T);const gid=x.groupId||c?.groupId||'';
 if(gid){currentGroupId=gid;localStorage.setItem(GROUP_KEY,currentGroupId)}
 $('login').classList.add('hide');pendingLoginPin='';await loadState(true);const mine=me?.memberId?M(me.memberId):null;if(mine?.state==='out')openEntry();
}
submitLogin=async function(){
 if(loginBusy37)return;const c=selectedLogin37||loginCandidates37[0];if(!c){renderLoginCandidates37();return}
 const pin=$('loginPin')?.value.trim()||pendingLoginPin;if(!pin){const e=$('loginErr');if(e)e.textContent=c.globalAdminOnly?'총관리자 PIN을 입력해주세요.':'모임 PIN을 입력해주세요.';return}
 pendingLoginPin=pin;loginBusy37=true;loginFinalizing37=true;const btn=$('loginSubmit37');if(btn){btn.disabled=true;btn.textContent='로그인 중...'}
 try{
  let x=await loginReq37('login',{name:pendingLoginName,pin,groupId:c.groupId||'',memberId:c.memberId||''});
  try{await finalizeLogin37(x,c)}catch(e){if(!/로그인이 만료|로그인이 필요|401/i.test(String(e?.message||e)))throw e;await new Promise(r=>setTimeout(r,80));x=await loginReq37('login',{name:pendingLoginName,pin,groupId:c.groupId||'',memberId:c.memberId||''});await finalizeLogin37(x,c)}
 }catch(e){$('login')?.classList.remove('hide');const el=$('loginErr');if(el)el.textContent=e.message;else alert(e.message)}
 finally{loginFinalizing37=false;loginBusy37=false;if(btn&&document.body.contains(btn)){btn.disabled=false;btn.textContent='로그인'}}
};

function roleForm37(){const type=$('fmType')?.value==='guest'?'guest':'member';let role=$('fmRole')?.value||'member';if(type==='guest')role='member';return{type,role}}
function sig37(x){const type=String(x?.type||'member')==='guest'?'guest':'member',role=type==='guest'?'member':String(x?.role||'member');return[String(x?.name||'').trim(),String(Number(x?.year)||''),String(x?.gender||'남'),String(x?.cls||'C').toUpperCase(),type,role].join('|')}
function label37(x){const kind=x.type==='guest'?'게스트':x.role==='manager'?'모임장':x.role==='organizer'?'운영진':'일반회원';return`${x.name} · ${x.year}년생 · ${x.gender} · ${x.cls}급 · ${kind}`}
const saveMemberPrev37=saveMemberNow;
saveMemberNow=async function(){
 if(editMemberId)return saveMemberPrev37();
 const rr=roleForm37(),name=$('fmName')?.value.trim()||'',year=Number($('fmYear')?.value),gender=$('fmGender')?.value||'남',cls=($('fmCls')?.value||'C').toUpperCase(),inviter=rr.type==='guest'?($('fmInviter45')?.value.trim()||''):'';
 if(!name)return alert('이름을 입력해주세요.');if(!Number.isInteger(year)||year<1900)return alert('출생연도를 확인해주세요.');if(!['남','여'].includes(gender))return alert('성별을 확인해주세요.');if(!['A','B','C','D','E'].includes(cls))return alert('급수는 A~E로 선택해주세요.');if(rr.type==='guest'&&!inviter)return alert('게스트의 초대인을 입력해주세요.');
 const candidate={name,year,gender,cls,type:rr.type,role:rr.role};if((S?.members||[]).some(m=>sig37(m)===sig37(candidate)))return alert(`동일한 회원 정보가 이미 등록되어 있습니다.\n\n${label37(candidate)}\n\n이름이 같아도 출생연도·성별·급수·구분·역할 중 하나라도 다르면 새 회원으로 등록할 수 있습니다.`);
 const body={action:'save_member',groupId:currentGroupId,memberId:'',name,year,gender,cls,type:rr.type,role:rr.role,pin:['manager','organizer'].includes(rr.role)?'000000':'',inviter};
 const btn=[...document.querySelectorAll('#modalSheet button')].find(b=>String(b.getAttribute('onclick')||'').includes('saveMemberNow'));
 const oldText=btn?.textContent||'저장';if(btn){btn.disabled=true;btn.textContent='등록 중...'}
 try{
  const r=await fetch(MEMBER37_API,{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+T},body:JSON.stringify(body),cache:'no-store'});const x=await r.json().catch(()=>({}));if(!r.ok)throw new Error(x.error||'회원 저장에 실패했습니다.');
  S=x.data;normalizeClient();closeModal();renderHeader();renderMembers();if(currentView==='settings')renderSettings();
 }catch(e){if(typeof showError==='function')showError(e);else alert(e?.message||'회원 저장에 실패했습니다.');if(btn&&document.body.contains(btn)){btn.disabled=false;btn.textContent=oldText}}
};

function injectStyle37(){if($('v37style'))return;const s=document.createElement('style');s.id='v37style';s.textContent=`.topActions37{display:flex;align-items:center;gap:5px;white-space:nowrap;margin-left:auto}.versionChip37{font-size:11px;font-weight:800;padding:5px 6px;border-radius:8px;background:rgba(255,255,255,.18)}#headerRefresh37{font-size:11px;padding:6px 8px;line-height:1.1;min-height:30px}#headerRefresh37.update37{font-weight:800;box-shadow:0 0 0 2px rgba(255,255,255,.35) inset}.topActions37 .logout{margin-left:0}@media(max-width:430px){.topActions37{gap:3px}.versionChip37{font-size:10px;padding:5px}#headerRefresh37{font-size:10px;padding:6px}.topActions37 .logout{font-size:10px;padding:6px 7px}}`;document.head.appendChild(s)}
function ensureTopActions37(){
 injectStyle37();const row=document.querySelector('.toprow'),logout=row?.querySelector('.logout');if(!row||!logout)return;
 let actions=$('topActions37');if(!actions){actions=document.createElement('div');actions.id='topActions37';actions.className='topActions37';actions.innerHTML=`<span id="currentVersion37" class="versionChip37">v${VER37}</span><button id="headerRefresh37" class="btn ghost" type="button" onclick="refreshApp37()">↻ 새로고침</button>`;row.insertBefore(actions,logout);actions.appendChild(logout)}
 updateRefreshButton37();
}
function semverGt37(a,b){const A=String(a||'').split('.').map(Number),B=String(b||'').split('.').map(Number);for(let i=0;i<Math.max(A.length,B.length);i++){const x=A[i]||0,y=B[i]||0;if(x!==y)return x>y}return false}
function updateRefreshButton37(){const b=$('headerRefresh37'),v=$('currentVersion37');if(v)v.textContent=`v${VER37}`;if(!b)return;const newer=semverGt37(latestVersion37,VER37);b.classList.toggle('update37',newer);b.textContent=newer?`v${latestVersion37} 업데이트 · 눌러 새로고침`:'↻ 새로고침';b.title=newer?`최신버전 v${latestVersion37}이 있습니다. 눌러서 새로고침하세요.`:'현재 버전을 다시 불러옵니다.'}
async function checkLatest37(){try{const r=await fetch('/latest-version.json?t='+Date.now(),{cache:'no-store'});if(!r.ok)return;const x=await r.json();latestVersion37=String(x.semanticVersion||x.label||VER37).replace(/^v/i,'');updateRefreshButton37()}catch{}}
window.refreshApp37=async function(){const b=$('headerRefresh37');if(b){b.disabled=true;b.textContent='새 버전 불러오는 중...'}try{if(typeof saveRefreshState==='function')saveRefreshState();try{if('serviceWorker'in navigator){const rs=await navigator.serviceWorker.getRegistrations();await Promise.all(rs.map(r=>r.unregister().catch(()=>false)))}}catch{}try{if('caches'in window){const ks=await caches.keys();await Promise.all(ks.map(k=>caches.delete(k)))}}catch{}await fetch('/index.html?refresh='+Date.now(),{cache:'no-store'}).catch(()=>null);location.replace('/?v='+encodeURIComponent(latestVersion37||VER37)+'&refresh='+Date.now())}catch(e){if(b){b.disabled=false;updateRefreshButton37()}if(typeof showError==='function')showError(e)}};
const renderHeaderPrev37=renderHeader;
renderHeader=function(){const r=renderHeaderPrev37();ensureTopActions37();return r};
const renderSettingsPrev37=renderSettings;
renderSettings=function(){const r=renderSettingsPrev37();const box=$('settings');if(!box)return r;box.querySelector('#forceUpdateBtn')?.remove();[...box.querySelectorAll('.meta')].forEach(el=>{if(/콕매치 v(?:\d+|\d+\.\d+)/.test(el.textContent||''))el.textContent='콕매치 v3.7 · 빠른 로그인/회원등록 · 동명이인 선택복귀 수정 · 상단 버전 새로고침'});ensureTopActions37();return r};

ensureTopActions37();checkLatest37();setInterval(checkLatest37,60000);if(!T)renderLoginName();
})();
