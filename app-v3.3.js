(()=>{
const LOGIN33_API='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-login-v33';
let loginChoices33=[],selectedLogin33=null,loginBusy33=false,loginFinalizing33=false,statsBusy33=false,statsRaf33=0;

async function loginReq33(action,body={}){
 const r=await fetch(LOGIN33_API,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action,...body}),cache:'no-store'});
 const x=await r.json().catch(()=>({}));
 if(!r.ok){const e=new Error(x.error||'로그인 처리에 실패했습니다.');e.payload=x;throw e}
 return x;
}
function loginChoiceHtml33(c,i,globalAdmin){
 const year=c.year?`${esc(c.year)}년생`:'출생연도 미등록';
 const role=globalAdmin?'총관리자':esc(c.roleLabel||'회원');
 return `<button type="button" class="choiceBtn loginChoice33" onclick="chooseLoginGroup33(${i})"><b>${esc(pendingLoginName)} · ${year}</b><span>${esc(c.groupName||'모임')}</span><small>${role}</small></button>`;
}
function renderLoginPin33(){
 const c=selectedLogin33;if(!c)return renderLoginName();
 const year=c.year?`${esc(c.year)}년생`:'출생연도 미등록';
 const role=c.globalAdmin?'총관리자':esc(c.roleLabel||'회원');
 $('loginBox').innerHTML=`<h2>PIN 인증</h2><div class="loginMember33"><b>${esc(pendingLoginName)} · ${year}</b><span>${esc(c.groupName||'모임')}</span><small>${role}</small></div><div class="field"><label>PIN</label><input id="loginPin" type="password" inputmode="numeric" autocomplete="current-password" placeholder="PIN 입력"></div><button id="loginSubmit33" class="btn pri" style="width:100%" onclick="submitLogin()">로그인</button><div id="loginErr" class="error"></div><button class="btn ghost" style="width:100%;margin-top:8px" onclick="${loginChoices33.length>1?'renderLoginChoices33()':'renderLoginName()'}">← ${loginChoices33.length>1?'모임 다시 선택':'이름 다시 입력'}</button>`;
 const p=$('loginPin');if(p){p.addEventListener('keydown',e=>{if(e.key==='Enter')submitLogin()});setTimeout(()=>p.focus(),30)}
}
window.renderLoginChoices33=function(){
 if(!loginChoices33.length)return renderLoginName();
 const globalAdmin=!!loginChoices33._globalAdmin;
 $('loginBox').innerHTML=`<h2>소속 모임 선택</h2><div class="authName">${esc(pendingLoginName)}</div><div class="note loginGuide33">등록된 출생연도와 소속 모임을 확인한 뒤 접속할 모임을 선택해주세요.</div><div class="choiceList loginChoices33">${loginChoices33.map((c,i)=>loginChoiceHtml33(c,i,globalAdmin)).join('')}</div><div id="loginErr" class="error"></div><button class="btn ghost" style="width:100%;margin-top:9px" onclick="renderLoginName()">← 이름 다시 입력</button>`;
};
window.chooseLoginGroup33=function(i){const c=loginChoices33[Number(i)];if(!c)return;selectedLogin33={...c,globalAdmin:!!loginChoices33._globalAdmin};renderLoginPin33()};

renderLoginName=function(){
 loginChoices33=[];selectedLogin33=null;pendingLoginPin='';
 $('loginBox').innerHTML=`<h1>🏸 콕매치</h1><div class="meta" style="font-size:14px;margin-bottom:18px">모임 회원 로그인</div><div class="field"><label>등록된 이름</label><input id="loginName" autocomplete="username" placeholder="이름"></div><button class="btn pri" style="width:100%" onclick="startLogin()">다음</button><div id="loginErr" class="error"></div><div class="note" style="margin-top:12px">이름을 확인한 뒤 <b>출생연도와 소속 모임</b>을 선택하고 PIN을 입력합니다.</div>`;
 const n=$('loginName');if(n){n.addEventListener('keydown',e=>{if(e.key==='Enter')startLogin()});setTimeout(()=>n.focus(),30)}
};
startLogin=async function(){
 if(loginBusy33)return;const name=$('loginName')?.value.trim()||'';const err=$('loginErr');if(err)err.textContent='';if(!name){if(err)err.textContent='이름을 입력해주세요.';return}
 loginBusy33=true;try{
  const x=await loginReq33('probe',{name});pendingLoginName=name;
  loginChoices33=(Array.isArray(x.memberships)?x.memberships:[]).map(c=>({...c}));
  loginChoices33._globalAdmin=!!x.globalAdmin;
  if(!loginChoices33.length&&x.globalAdmin)loginChoices33.push({groupId:'',groupName:'전체 모임',memberId:'',year:'',roleLabel:'총관리자'});
  if(loginChoices33.length===1){selectedLogin33={...loginChoices33[0],globalAdmin:!!x.globalAdmin};renderLoginPin33()}else renderLoginChoices33();
 }catch(e){if(err)err.textContent=e.message}finally{loginBusy33=false}
};

const relogin32=reloginLatest;
reloginLatest=async function(){if(loginFinalizing33)return;return relogin32()};
async function finalizeLogin33(x,selection){
 T=x.token;localStorage.setItem(TOKEN_KEY,T);
 const gid=x.groupId||selection?.groupId||'';if(gid){currentGroupId=gid;localStorage.setItem(GROUP_KEY,currentGroupId)}
 $('login').classList.add('hide');pendingLoginPin='';await loadState(true);const mine=me?.memberId?M(me.memberId):null;if(mine?.state==='out')openEntry();
}
submitLogin=async function(){
 if(loginBusy33)return;const c=selectedLogin33||loginChoices33[0];if(!c){renderLoginChoices33();return}const pin=$('loginPin')?.value.trim()||pendingLoginPin;if(!pin){const e=$('loginErr');if(e)e.textContent='PIN을 입력해주세요.';return}
 pendingLoginPin=pin;loginBusy33=true;loginFinalizing33=true;const btn=$('loginSubmit33');if(btn)btn.disabled=true;
 try{
  let x=await loginReq33('login',{name:pendingLoginName,pin,groupId:c.groupId||'',memberId:c.memberId||''});
  try{await finalizeLogin33(x,c)}catch(e){
   if(!/로그인이 만료|로그인이 필요|401/i.test(String(e?.message||e)))throw e;
   await new Promise(r=>setTimeout(r,120));
   x=await loginReq33('login',{name:pendingLoginName,pin,groupId:c.groupId||'',memberId:c.memberId||''});
   await finalizeLogin33(x,c);
  }
 }catch(e){$('login')?.classList.remove('hide');const el=$('loginErr');if(el)el.textContent=e.message;else alert(e.message)}finally{loginFinalizing33=false;loginBusy33=false;if(btn)btn.disabled=false}
};

function selectedPollDate33(){
 const b=document.querySelector('#stats .pollCalDay21.selected');const s=String(b?.getAttribute('onclick')||'');return (s.match(/selectPollDate22\('([0-9]{4}-[0-9]{2}-[0-9]{2})'\)/)||[])[1]||todayKst();
}
function pollDateLabel33(date){const a=String(date||'').split('-').map(Number);return a.length===3&&a[0]?`${a[0]}년 ${a[1]}월 ${a[2]}일`:String(date||'')}
function pollMainTitle33(p){const loc=String(p?.location||'').trim();if(loc)return /운동$/.test(loc)?loc:`${loc} 운동`;let t=String(p?.title||'운동 참석 투표').trim();t=t.replace(/^\d{1,2}월\s*\d{1,2}일\s*\d{1,2}:\d{2}\s*/,'');return t||'운동 참석 투표'}
function decoratePollCards33(){
 const box=$('stats');if(!box)return;const date=selectedPollDate33();const ps=(Array.isArray(S?.attendancePolls)?S.attendancePolls:[]).filter(p=>String(p?.date||'')===date).slice().sort((a,b)=>String(a.time||'').localeCompare(String(b.time||'')));const cards=[...box.querySelectorAll('.pollWrap90 .pollCard21')];
 cards.forEach((card,i)=>{const p=ps[i];if(!p)return;const title=card.querySelector('.pollTitle21');if(!title)return;const ended=title.querySelector('.pollEndedBadge22')?.outerHTML||'';const when=[pollDateLabel33(p.date),p.time&&p.endTime?`${esc(p.time)} ~ ${esc(p.endTime)}`:esc(p.time||'')].filter(Boolean).join(' · ');const creator=String(p.createdBy||'').trim()||'정보 없음';const sig=[p.id,p.title,p.date,p.time,p.endTime,p.location,p.createdBy,ended].join('|');if(title.dataset.v33sig===sig)return;title.dataset.v33sig=sig;title.innerHTML=`<div class="pollMainTitle33">${esc(pollMainTitle33(p))} ${ended}</div><div class="pollSchedule33">${when}</div><div class="pollCreator33">투표 생성자 · ${esc(creator)}</div>`;});
}
function decorateStats33(){if(statsBusy33)return;statsBusy33=true;try{decoratePollCards33()}finally{statsBusy33=false}}
function scheduleStats33(){cancelAnimationFrame(statsRaf33);statsRaf33=requestAnimationFrame(decorateStats33)}
const renderStats32=renderStats;renderStats=function(){const r=renderStats32();decorateStats33();return r};
for(const n of ['selectPollDate22','movePollMonth22','togglePollVote22']){const f=window[n];if(typeof f==='function')window[n]=function(...a){const r=f.apply(this,a);scheduleStats33();return r}}
const stats33=$('stats');if(stats33)new MutationObserver(scheduleStats33).observe(stats33,{childList:true,subtree:true});

const renderSettings32=renderSettings;
renderSettings=function(){renderSettings32();const b=$('settings');if(!b)return;[...b.querySelectorAll('.meta')].forEach(el=>{if(/콕매치 v(?:\d+|\d+\.\d+)/.test(el.textContent||''))el.textContent='콕매치 v3.3 · 5시 로그인 안정화 · 소속모임 선택 로그인 · 지난투표 연두표시 · 투표정보 개선'})};

if(!T)renderLoginName();if(me&&currentView==='stats')decorateStats33();
})();
