/* 콕매치 v6.0 standalone runtime. Do not dynamically load prior app versions. */
window.__kokmatchStandalone='6.0';
window.__kokmatchVersionLock='6.0';
window.__kokmatchLegacyAutoUpdateDisabled=true;
try{sessionStorage.setItem('kokmatch_runtime_version','6.0')}catch{}

/* migrated into v6.0: app-v35.js */
const APP_VERSION=35;
const API='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-multi-api';
const ADMIN_REFRESH_API='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-admin-refresh';
const TOKEN_KEY='kokmatch_token',GROUP_KEY='kokmatch_group_id',REFRESH_KEY='kokmatch_refresh_state';
let T=localStorage.getItem(TOKEN_KEY)||'',S=emptyClientState(),me=null,group=null,groups=[],groupSummaries=[];
let currentGroupId=localStorage.getItem(GROUP_KEY)||'',currentView='members',draft=[null,null,null,null],editMemberId=null;
let pendingLoginName='',pendingLoginPin='',moveCtx=null,courtCtx=null,repeatCtx=null,reloginBusy=false;
const $=id=>document.getElementById(id),M=id=>S.members.find(m=>m.id===id);
function emptyClientState(){return{courtCount:8,courtNames:[],members:[],queue:[],pendingGames:[],games:[],history:[],pairCounts:{}}}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function todayKst(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())}
function roleOf(m){const r=String(m?.role||'member');return r==='manager'||r==='organizer'?r:r==='admin'?'admin':'member'}
function roleLabel(r){return r==='admin'?'개발자':r==='manager'?'모임장':r==='organizer'?'운영진':'일반'}
function stateLabel(s){return s==='waiting'?'게임대기':s==='matched'?'편성대기':s==='playing'?'게임중':s==='spectator'?'관람':'미입장'}
function isTemp(m){return !!m&&roleOf(m)==='member'&&m.type!=='guest'&&m.state!=='out'&&String(m.tempOrganizerDay||'')===todayKst()}
function canGame(){return !!me&&(me.globalAdmin||me.role==='manager'||me.role==='organizer'||me.tempOrganizer)}
function canManageMembers(){return !!me&&(me.globalAdmin||me.role==='manager'||me.role==='organizer')}
function canSetRoles(){return !!me&&(me.globalAdmin||me.role==='manager')}
function canReset(){return !!me&&(me.globalAdmin||me.role==='manager')}
function canManageGroups(){return !!me?.globalAdmin}
function roleBadge(m){let r=roleOf(m);if(r==='admin'||(me?.globalAdmin&&m?.name===me.displayName))return '<span class="roleBadge role-global">개발자</span>';if(r==='manager')return '<span class="roleBadge role-manager">모임장</span>';if(r==='organizer')return '<span class="roleBadge role-organizer">운영진</span>';if(isTemp(m))return '<span class="roleBadge role-temp">임시편성자</span>';return ''}
function typeBadge(m){return m?.type==='guest'?'<span class="roleBadge guest">GUEST</span>':''}
function ageTag(m){return '<span class="tag">'+esc(m?.age||'30')+esc(m?.cls||'C')+'</span>'}
function dailyCount(id){return S.history.filter(h=>Array.isArray(h.players)&&h.players.includes(id)).length}
function waitMins(m){return Math.max(0,Math.floor((Date.now()-(Number(m?.joinedAt)||Date.now()))/60000))}
function pairKey(a,b){return a<b?a+'|'+b:b+'|'+a}
function pairCount(a,b){return Math.max(0,Number(S.pairCounts?.[pairKey(a,b)])||0)}
function avatar(m){return '<div class="avatar '+(m?.gender==='여'?'female':'male')+'">●</div>'}
function normalizeClient(){S=S||emptyClientState();S.members=Array.isArray(S.members)?S.members:[];S.queue=Array.isArray(S.queue)?S.queue:[];S.pendingGames=Array.isArray(S.pendingGames)?S.pendingGames:[];S.games=Array.isArray(S.games)?S.games:[];S.history=Array.isArray(S.history)?S.history:[];S.pairCounts=S.pairCounts||{};S.courtCount=Math.max(1,Number(S.courtCount)||8);S.courtNames=Array.from({length:S.courtCount},(_,i)=>String(S.courtNames?.[i]||`${i+1}코트`));draft=draft.map(id=>id&&S.queue.includes(id)?id:null)}
function renderShell(){document.body.innerHTML=`<div id="login" class="login"><div class="loginBox" id="loginBox"></div></div><div class="app"><header class="top"><div class="toprow"><div><div class="brand">🏸 콕매치</div><div class="groupLine"><button id="groupBtn" class="groupBtn" onclick="openGroupSwitch()">모임 선택</button></div><div id="who" class="who">-</div></div><button class="logout" onclick="logout()">로그아웃</button></div><div class="summary"><div><b id="sm">0</b><span>오늘 입장</span></div><div><b id="sw">0</b><span>게임대기</span></div><div><b id="sg">0</b><span>게임중</span></div></div></header><main><section id="members" class="view on"></section><section id="queue" class="view"></section><section id="playing" class="view"></section><section id="stats" class="view"></section><section id="settings" class="view"></section><section id="groups" class="view"></section></main></div><nav id="nav"></nav><div id="modal" class="modal"><div class="sheet" id="modalSheet"></div></div>`;renderLoginName();renderNav()}
function renderNav(){const items=[['members','👥','회원명부'],['queue','▦','게임대기'],['playing','🏸','게임중'],['stats','▥','오늘통계'],['settings','⚙️','설정']];if(canManageGroups())items.push(['groups','🏢','모임관리']);const n=$('nav');if(!n)return;n.className='n'+items.length;n.innerHTML=items.map(([id,ic,tx])=>`<button data-v="${id}" class="${currentView===id?'on':''}" onclick="goView('${id}')"><i>${ic}</i>${tx}</button>`).join('')}
function goView(id){if(id==='groups'&&!canManageGroups())id='members';currentView=id;document.querySelectorAll('.view').forEach(v=>v.classList.toggle('on',v.id===id));document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('on',b.dataset.v===id));if(id==='groups')loadGroups().catch(showError);window.scrollTo(0,0)}
function openModal(html){$('modalSheet').innerHTML=html;$('modal').classList.add('on')}
function closeModal(){$('modal').classList.remove('on');$('modalSheet').innerHTML='';moveCtx=null;courtCtx=null}
function showError(e){alert(e?.message||String(e||'오류가 발생했습니다.'))}
async function reloginLatest(){if(reloginBusy)return;reloginBusy=true;localStorage.removeItem(TOKEN_KEY);T='';try{if('caches'in window){const ks=await caches.keys();await Promise.all(ks.map(k=>caches.delete(k)))}if('serviceWorker'in navigator){const rs=await navigator.serviceWorker.getRegistrations();await Promise.all(rs.map(r=>r.unregister().catch(()=>{})))}}catch{}location.replace('/?relogin='+Date.now())}
async function request(apiName,method='GET',body=null,params={}){const u=new URL(API);u.searchParams.set('api',apiName);Object.entries(params).forEach(([k,v])=>{if(v)u.searchParams.set(k,v)});const r=await fetch(u,{method,headers:{'content-type':'application/json',...(T?{authorization:'Bearer '+T}:{})},body:body?JSON.stringify(body):undefined,cache:'no-store'});const x=await r.json().catch(()=>({error:'통신 오류'}));if(!r.ok){if(r.status===401&&apiName!=='login'&&apiName!=='login_probe'){reloginLatest();throw new Error('로그인이 만료되었습니다.')}const e=new Error(x.error||'오류가 발생했습니다.');e.payload=x;throw e}return x}
function renderLoginName(){$('loginBox').innerHTML=`<h1>🏸 콕매치</h1><div class="meta" style="font-size:14px;margin-bottom:18px">모임 회원 로그인</div><div class="field"><label>등록된 이름</label><input id="loginName" autocomplete="username" placeholder="이름"></div><button class="btn pri" style="width:100%" onclick="startLogin()">다음</button><div id="loginErr" class="error"></div><div class="note" style="margin-top:12px">일반은 <b>소속 모임 PIN</b>, 모임장·운영진는 <b>본인 역할 PIN</b>으로 로그인합니다.</div>`;setTimeout(()=>$('loginName')?.focus(),50)}
async function startLogin(){const name=$('loginName').value.trim();$('loginErr').textContent='';if(!name)return $('loginErr').textContent='이름을 입력해주세요.';try{const x=await request('login_probe','POST',{name});pendingLoginName=name;$('loginBox').innerHTML=`<h2>${esc(x.roleLabel||'PIN')} 인증</h2><div class="authName">${esc(name)}</div><div class="field"><label>PIN</label><input id="loginPin" type="password" inputmode="numeric" placeholder="PIN 입력"></div><button class="btn pri" style="width:100%" onclick="submitLogin()">로그인</button><div id="loginErr" class="error"></div><button class="btn ghost" style="width:100%;margin-top:8px" onclick="renderLoginName()">← 이름 다시 입력</button>`;setTimeout(()=>$('loginPin')?.focus(),50)}catch(e){$('loginErr').textContent=e.message}}
async function submitLogin(groupId=''){const pin=$('loginPin')?.value.trim()||pendingLoginPin;if(!pin)return $('loginErr').textContent='PIN을 입력해주세요.';pendingLoginPin=pin;try{const x=await request('login','POST',{name:pendingLoginName,pin,groupId});if(x.groupChoiceRequired){$('loginBox').innerHTML=`<h2>모임 선택</h2><div class="authName">${esc(pendingLoginName)}</div><div class="note">같은 PIN으로 확인되는 모임이 여러 개입니다. 접속할 모임을 선택해주세요.</div><div class="choiceList">${x.choices.map(c=>`<button class="choiceBtn" onclick="submitLogin('${c.groupId}')"><b>${esc(c.groupName)}</b><span class="meta">${esc(c.roleLabel)}</span></button>`).join('')}</div><button class="btn ghost" style="width:100%;margin-top:9px" onclick="renderLoginName()">처음으로</button>`;return}T=x.token;localStorage.setItem(TOKEN_KEY,T);if(x.groupId){currentGroupId=x.groupId;localStorage.setItem(GROUP_KEY,currentGroupId)}$('login').classList.add('hide');pendingLoginPin='';await loadState();const mine=me.memberId?M(me.memberId):null;if(mine?.state==='out')openEntry()}catch(e){const el=$('loginErr');if(el)el.textContent=e.message;else alert(e.message)}}
async function logout(){try{await request('logout','POST')}catch{}localStorage.removeItem(TOKEN_KEY);T='';location.replace('/')}
async function loadState(){const x=await request('state','GET',null,{groupId:currentGroupId});S=x.data;me=x.user;group=x.group;groups=x.groups||groups;currentGroupId=group.groupId;localStorage.setItem(GROUP_KEY,currentGroupId);normalizeClient();renderAll();restoreRefreshState()}
async function act(action,body={},opts={}){try{const x=await request('action','POST',{action,groupId:currentGroupId,...body});if(x.data){S=x.data;normalizeClient();renderAll()}return x}catch(e){if(e.payload?.warning==='repeat_pair'&&opts.repeat){showRepeat(e.payload,opts.repeat);return null}throw e}}
function renderAll(){if(!me)return;renderHeader();renderNav();renderMembers();renderQueue();renderPlaying();renderStats();renderSettings();if(canManageGroups()&&currentView==='groups')renderGroups();document.querySelectorAll('.view').forEach(v=>v.classList.toggle('on',v.id===currentView));document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('on',b.dataset.v===currentView))}
function renderHeader(){const mine=me.memberId?M(me.memberId):null;$('groupBtn').textContent=(group?.name||'모임')+(me.globalAdmin?' ▾':'');$('groupBtn').disabled=!me.globalAdmin;$('who').textContent=`${me.displayName} · ${roleLabel(me.role)}${me.tempOrganizer?' · 임시편성자':''}${mine?' · '+stateLabel(mine.state):''}`;$('sm').textContent=S.members.filter(m=>m.state!=='out').length;$('sw').textContent=S.queue.length+S.pendingGames.reduce((n,g)=>n+g.players.length,0);$('sg').textContent=S.games.length}
function memberControls(m){if(!canManageMembers())return `<div class="status">${stateLabel(m.state)}</div>`;const r=roleOf(m);let editable=me.globalAdmin||(me.role==='manager'?(r!=='manager'||m.id===me.memberId):r==='member');let bs='';if(m.state!=='playing'&&m.state!=='matched'){if(m.state!=='waiting')bs+=`<button class="btn enter" onclick="setOther('${m.id}','waiting')">운동</button>`;if(m.state!=='spectator')bs+=`<button class="btn watch" onclick="setOther('${m.id}','spectator')">관람</button>`;if(m.state!=='out')bs+=`<button class="btn danger" onclick="setOther('${m.id}','out')">퇴장</button>`}if(editable)bs+=`<button class="btn ghost" onclick="openEditMember('${m.id}')">수정</button>`;return `<div><div class="status">${stateLabel(m.state)}</div><div class="memberBtns">${bs}</div></div>`}
function renderMembers(){const note=me.globalAdmin?'개발자는 현재 모임의 모든 인원과 역할을 관리할 수 있습니다.':me.role==='manager'?'모임장는 일반 관리와 운영진 지정·해제가 가능합니다.':me.role==='organizer'?'운영진는 소속 모임의 일반/게스트를 등록·수정·삭제할 수 있습니다.':'회원정보와 현재 참가상태를 확인할 수 있습니다.';$('members').innerHTML=`<div class="title"><h2>회원명부</h2>${canManageMembers()?'<button class="btn pri" onclick="openAddMember()">+ 회원등록</button>':''}</div><div class="note">${note}</div><div>${S.members.map(m=>`<div class="card memberCard">${avatar(m)}<div><div class="name">${esc(m.name)} ${ageTag(m)} ${typeBadge(m)} <span class="gamecnt">총 게임 ${Number(m.totalGames)||0}회</span> ${roleBadge(m)}</div><div class="meta">${esc(m.year||'')}년생 · ${esc(m.gender||'')}</div><button class="pairBtn" onclick="openPairs('${m.id}')">같이한 경기 보기</button></div>${memberControls(m)}</div>`).join('')||'<div class="empty">등록된 회원이 없습니다.</div>'}</div>`}
function openAddMember(){editMemberId=null;openMemberModal(null)}
function openEditMember(id){const m=M(id);if(!m)return;editMemberId=id;openMemberModal(m)}
function openMemberModal(m){const add=!m;const role=roleOf(m);const roleOptions=me.globalAdmin?['member','organizer','manager']:me.role==='manager'?['member','organizer']:[];openModal(`<h3>${add?'회원등록':'회원 정보 수정'}</h3><div class="note">${add?'출생연도를 입력하면 연령대가 자동 설정됩니다.':'회원정보와 권한을 수정합니다.'}</div><div class="field"><label>이름</label><input id="fmName" value="${esc(m?.name||'')}"></div><div class="grid2"><div class="field"><label>출생연도</label><input id="fmYear" type="number" inputmode="numeric" value="${esc(m?.year||'')}"></div><div class="field"><label>성별</label><select id="fmGender"><option ${m?.gender!=='여'?'selected':''}>남</option><option ${m?.gender==='여'?'selected':''}>여</option></select></div><div class="field"><label>연령대</label><select id="fmAge">${[20,30,40,50,60,70].map(a=>`<option value="${a}" ${String(m?.age||'30')===String(a)?'selected':''}>${a}대</option>`).join('')}</select></div><div class="field"><label>급수</label><select id="fmCls">${['A','B','C','D','E'].map(c=>`<option ${String(m?.cls||'C')===c?'selected':''}>${c}</option>`).join('')}</select></div></div><div class="field"><label>구분</label><select id="fmType"><option value="member" ${m?.type!=='guest'?'selected':''}>일반</option><option value="guest" ${m?.type==='guest'?'selected':''}>게스트</option></select></div>${!add&&roleOptions.length?`<div class="field"><label>역할</label><select id="fmRole" onchange="syncRolePinField()">${roleOptions.map(r=>`<option value="${r}" ${role===r?'selected':''}>${roleLabel(r)}</option>`).join('')}</select></div><div id="fmPinWrap" class="field ${role==='member'?'hide':''}"><label>새 역할 PIN (변경 시 숫자 4~8자리)</label><input id="fmPin" type="password" inputmode="numeric" placeholder="기존 PIN 유지 시 비움"></div>`:''}<div class="acts">${!add?'<button class="btn danger" onclick="deleteMemberNow()">삭제</button>':''}<button class="btn ghost" onclick="closeModal()">취소</button><button class="btn pri" onclick="saveMemberNow()">${add?'등록':'저장'}</button></div>`);setTimeout(()=>{const y=$('fmYear');if(y)y.addEventListener('input',()=>{const year=Number(y.value);if(year>1900){const age=Math.max(10,Math.floor((new Date().getFullYear()-year)/10)*10);$('fmAge').value=String(Math.min(70,age))}})},0)}
function syncRolePinField(){const r=$('fmRole')?.value;$('fmPinWrap')?.classList.toggle('hide',!r||r==='member')}
async function saveMemberNow(){const body={name:$('fmName').value.trim(),year:Number($('fmYear').value),gender:$('fmGender').value,age:$('fmAge').value,cls:$('fmCls').value,type:$('fmType').value};if(!body.name)return alert('이름을 입력해주세요.');try{if(!editMemberId){await act('add_member',body);closeModal();return}const m=M(editMemberId),oldRole=roleOf(m);await act('edit_member',{memberId:editMemberId,...body});const nr=$('fmRole')?.value;if(nr&&nr!==oldRole){await act('set_role',{memberId:editMemberId,role:nr,pin:$('fmPin')?.value.trim()||''})}else if(nr&&nr!=='member'&&$('fmPin')?.value.trim()){await act('set_role',{memberId:editMemberId,role:nr,pin:$('fmPin').value.trim()})}closeModal()}catch(e){showError(e)}}
async function deleteMemberNow(){const m=M(editMemberId);if(!m||!confirm(`${m.name} 회원을 삭제하시겠습니까?`))return;try{await act('delete_member',{memberId:editMemberId});closeModal()}catch(e){showError(e)}}
async function setOther(id,mode){try{await act('set_member_attendance',{memberId:id,mode})}catch(e){showError(e)}}
function openEntry(){openModal(`<h3>오늘 어떻게 입장할까요?</h3><div class="note">역할과 운동 참여 여부는 별개입니다.</div><div class="acts"><button class="btn enter" onclick="setMyEntry('waiting')">🏸 운동 참가</button><button class="btn watch" onclick="setMyEntry('spectator')">👀 관람하기</button></div><button class="btn ghost" style="width:100%;margin-top:9px" onclick="closeModal()">입장 없이 보기</button>`)}
async function setMyEntry(mode){try{await act('set_my_attendance',{mode});closeModal();if(mode==='waiting')goView('queue')}catch(e){showError(e)}}
function sortedQueue(){return S.queue.slice().sort((a,b)=>dailyCount(a)-dailyCount(b)||(Number(M(a)?.joinedAt)||Infinity)-(Number(M(b)?.joinedAt)||Infinity))}
function draftClick(id){if(!canGame())return;const idx=draft.indexOf(id);if(idx>=0)draft[idx]=null;else{const e=draft.findIndex(x=>!x);if(e>=0)draft[e]=id}renderQueue()}
function draftRemove(i){draft[i]=null;renderQueue()}
function clearDraft(){draft=[null,null,null,null];renderQueue()}
function pairSummary(ids){let total=0,max=0,pair='';for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){const n=pairCount(ids[i],ids[j]);total+=n;if(n>max){max=n;pair=`${M(ids[i])?.name||'-'}·${M(ids[j])?.name||'-'}`}}return ids.length<2?'':total?`같이한 경기 합계 ${total}회${max?` · 최다 ${pair} ${max}회`:''}`:'서로 같이한 경기 기록이 없습니다.'}
const gradeV={A:5,B:4,C:3,D:2,E:1};
function recommendDraft(){const pool=sortedQueue().filter(id=>!draft.includes(id)).slice(0,24);if(pool.length<4)return alert('개인 게임대기 인원이 4명 이상 필요합니다.');let best=null,score=Infinity;for(let a=0;a<pool.length-3;a++)for(let b=a+1;b<pool.length-2;b++)for(let c=b+1;c<pool.length-1;c++)for(let d=c+1;d<pool.length;d++){const ids=[pool[a],pool[b],pool[c],pool[d]],ms=ids.map(M),gv=ms.map(m=>gradeV[m?.cls]||1),mean=gv.reduce((x,y)=>x+y,0)/4,variance=gv.reduce((x,y)=>x+(y-mean)**2,0),male=ms.filter(m=>m?.gender==='남').length;let repeat=0;for(let i=0;i<4;i++)for(let j=i+1;j<4;j++)repeat+=pairCount(ids[i],ids[j]);const s=repeat*18+variance*7+Math.abs(male-2)*10+a*.02;if(s<score){score=s;best=ids}}draft=best;renderQueue()}
async function registerDraft(forceRepeat=false){const ps=draft.filter(Boolean);if(!ps.length)return alert('1명 이상 선택해주세요.');if(ps.length<4&&!confirm(`현재 ${ps.length}명입니다. 4명이 안 됐는데 편성대기로 등록하시겠습니까?`))return;try{const x=await act('create_pending',{players:ps,forceRepeat},{repeat:{keep:()=>registerDraft(true),manual:()=>{clearDraft();closeModal()},recommend:()=>{closeModal();clearDraft();recommendDraft()}}});if(x){draft=[null,null,null,null];renderQueue()}}catch(e){showError(e)}}
function showRepeat(payload,ctx){repeatCtx=ctx;openModal(`<h3>반복 편성 확인</h3><div class="warn">3회 이상 같이 경기한 조합이 있습니다.</div>${(payload.repeatPairs||[]).map(r=>`<div class="card"><b>${esc(r.aName)} · ${esc(r.bName)}</b><span class="tag">${r.count}회</span></div>`).join('')}<div class="acts">${ctx.manual?'<button class="btn ghost" onclick="repeatManual()">다시 직접 편성</button>':''}${ctx.recommend?'<button class="btn ghost" onclick="repeatRecommend()">추천으로 다시</button>':''}<button class="btn pri" onclick="repeatKeep()">그대로 진행</button></div>`)}
function repeatKeep(){const f=repeatCtx?.keep;closeModal();repeatCtx=null;f?.()}
function repeatManual(){const f=repeatCtx?.manual;closeModal();repeatCtx=null;f?.()}
function repeatRecommend(){const f=repeatCtx?.recommend;closeModal();repeatCtx=null;f?.()}
function pendingCard(pg,i){const waited=Math.max(0,Math.floor((Date.now()-Number(pg.createdAt||Date.now()))/60000));const slots=Array.from({length:4},(_,idx)=>{const id=pg.players[idx],m=id?M(id):null;if(!m)return `<div class="pendingSlot emptySlot ${canGame()?'clickable':''}" ${canGame()?`onclick="openFillPending('${pg.id}')"`:''}>＋ 빈자리</div>`;return `<div class="pendingSlot ${canGame()?'clickable':''}" ${canGame()?`onclick="openMoveMember('${pg.id}','${id}')"`:''}>${canGame()?`<button class="pendingX" onclick="event.stopPropagation();removePending('${pg.id}','${id}')">×</button>`:''}<div class="slotLabel">${idx<2?'A팀':'B팀'} ${idx%2+1}</div><div class="slotName">${esc(m.name)} ${ageTag(m)} ${roleBadge(m)}</div><div class="meta">게임 ${dailyCount(id)}회 · ${waitMins(m)}분 대기</div></div>`}).join('');return `<div class="card pendingCard"><div class="pendingHead"><b>편성대기 ${i+1}조 · ${pg.players.length}/4명</b><div class="pendingTools">${canGame()?`<button class="miniBtn" ${i===0?'disabled':''} onclick="movePendingOrder('${pg.id}','up')">↑</button><button class="miniBtn" ${i===S.pendingGames.length-1?'disabled':''} onclick="movePendingOrder('${pg.id}','down')">↓</button>`:''}<span class="tag">${waited}분</span></div></div><div class="pendingGrid">${slots}</div><div class="pairSummary">${pairSummary(pg.players)}</div>${canGame()?`<div class="pendingActs"><button class="btn pri" ${pg.players.length!==4?'disabled':''} onclick="openCourtStart('${pg.id}')">코트 선택 · 경기 시작</button><button class="btn ghost" onclick="cancelPending('${pg.id}')">편성 취소</button></div>`:''}</div>`}
function renderQueue(){const q=sortedQueue();const selected=new Set(draft.filter(Boolean));$('queue').innerHTML=`<div class="title"><h2>게임대기</h2><span class="tag">${S.queue.length+S.pendingGames.reduce((n,g)=>n+g.players.length,0)}명</span></div>${canGame()?`<div class="composer"><div class="composerTitle">새 게임 편성</div><div class="slots">${draft.map((id,i)=>{const m=id?M(id):null;return `<div class="slot ${m?'filled':''}"><div class="slotLabel">${i<2?'A팀':'B팀'} ${i%2+1}</div>${m?`<button class="slotX" onclick="draftRemove(${i})">×</button><div class="slotName">${esc(m.name)} ${ageTag(m)} ${roleBadge(m)}</div><div class="meta">게임 ${dailyCount(id)}회 · ${waitMins(m)}분 대기</div>`:'<div class="meta">개인 게임대기에서 선택</div>'}</div>`}).join('')}</div><div class="pairSummary">${pairSummary(draft.filter(Boolean))}</div><div class="composerActs"><button class="btn ghost" onclick="clearDraft()">선택 비우기</button><button class="btn ghost" onclick="recommendDraft()">✨ 추천 구성</button><button class="btn pri" ${draft.filter(Boolean).length?'':'disabled'} onclick="registerDraft()">대기 등록</button></div></div>`:''}<div class="subhead"><b>편성대기 현황</b><span class="tag">${S.pendingGames.length}조</span></div>${S.pendingGames.length?S.pendingGames.map(pendingCard).join(''):'<div class="empty">편성대기 중인 조가 없습니다.</div>'}<div class="subhead"><b>개인 게임대기</b><span class="tag">${q.length}명</span></div><div class="note">게임횟수가 적은 순서 → 같은 횟수면 대기시간이 긴 순서입니다.</div>${q.length?q.map((id,i)=>{const m=M(id);if(!m)return'';return `<div class="card queueCard ${selected.has(id)?'selected':''}" ${canGame()?`onclick="draftClick('${id}')"`:''}><div class="ord">${i+1}</div><div><div class="name">${esc(m.name)} ${ageTag(m)} <span class="gamecnt">게임 ${dailyCount(id)}회</span> ${roleBadge(m)}</div><div class="meta">${esc(m.gender)} · ${waitMins(m)}분 대기</div></div><b>${selected.has(id)?'✓':''}</b></div>`}).join(''):'<div class="empty">개인 게임대기 회원이 없습니다.</div>'}`}
async function removePending(pid,id){if(!confirm(`${M(id)?.name||'회원'}님을 개인 게임대기로 내릴까요? 대기시간은 유지됩니다.`))return;try{await act('remove_from_pending',{pendingId:pid,memberId:id})}catch(e){showError(e)}}
async function movePendingOrder(pid,dir){try{await act('move_pending_order',{pendingId:pid,direction:dir})}catch(e){showError(e)}}
async function cancelPending(pid){if(!confirm('이 편성대기 조를 취소하고 전원을 개인 게임대기로 돌릴까요? 대기시간은 유지됩니다.'))return;try{await act('cancel_pending',{pendingId:pid})}catch(e){showError(e)}}
function openFillPending(pid){const pg=S.pendingGames.find(g=>g.id===pid);if(!pg||pg.players.length>=4)return;moveCtx={mode:'fill',targetPendingId:pid};const q=sortedQueue();const others=S.pendingGames.filter(g=>g.id!==pid&&g.players.length).flatMap(g=>g.players.map(id=>({g,id,m:M(id)}))).filter(x=>x.m);openModal(`<h3>빈자리 채우기 · ${pg.players.length}/4명</h3><div class="note">개인 게임대기 또는 다른 1~4인 편성대기 조에서 자유롭게 한 명을 이동할 수 있습니다.</div><div class="subhead"><b>개인 게임대기</b><span class="tag">${q.length}명</span></div>${q.map(id=>{const m=M(id);return `<button class="choiceBtn" onclick="fillFromQueue('${id}')"><b>${esc(m.name)} ${ageTag(m)} ${roleBadge(m)}</b><span class="meta">게임 ${dailyCount(id)}회 · ${waitMins(m)}분 대기</span></button>`}).join('')||'<div class="empty">없음</div>'}<div class="subhead"><b>다른 편성대기 조</b><span class="tag">${others.length}명</span></div>${others.map(x=>`<button class="choiceBtn" onclick="fillFromPending('${x.g.id}','${x.id}')"><b>${esc(x.m.name)} ${ageTag(x.m)} ${roleBadge(x.m)}</b><span class="meta">편성대기 ${S.pendingGames.indexOf(x.g)+1}조 · ${x.g.players.length}/4명</span></button>`).join('')||'<div class="empty">없음</div>'}<button class="btn ghost" style="width:100%;margin-top:10px" onclick="closeModal()">취소</button>`)}
async function fillFromQueue(id,force=false){const target=moveCtx?.targetPendingId;if(!target)return;try{const x=await act('add_to_pending',{pendingId:target,memberId:id,forceRepeat:force},{repeat:{keep:()=>{moveCtx={mode:'fill',targetPendingId:target};fillFromQueue(id,true)},manual:()=>closeModal()}});if(x)closeModal()}catch(e){showError(e)}}
async function fillFromPending(source,id,force=false){const target=moveCtx?.targetPendingId;if(!target)return;try{const x=await act('move_pending_member',{sourcePendingId:source,targetPendingId:target,memberId:id,forceRepeat:force},{repeat:{keep:()=>{moveCtx={mode:'fill',targetPendingId:target};fillFromPending(source,id,true)},manual:()=>closeModal()}});if(x)closeModal()}catch(e){showError(e)}}
function openMoveMember(pid,id){const pg=S.pendingGames.find(g=>g.id===pid),m=M(id);if(!pg||!m)return;moveCtx={mode:'member',sourcePendingId:pid,memberId:id};const partial=S.pendingGames.filter(g=>g.id!==pid&&g.players.length<4),q=sortedQueue(),others=S.pendingGames.filter(g=>g.id!==pid);openModal(`<h3>${esc(m.name)} · 이동/교체</h3><div class="note">다른 미완성 조로 이동하거나 개인 게임대기/다른 대기조 회원과 맞교환할 수 있습니다. 대기시간은 유지됩니다.</div><div class="subhead"><b>빈자리 있는 대기조로 이동</b><span class="tag">${partial.length}조</span></div>${partial.map(g=>`<button class="choiceBtn" onclick="moveToPartial('${g.id}')"><b>편성대기 ${S.pendingGames.indexOf(g)+1}조 · ${g.players.length}/4명</b><span class="meta">${g.players.map(x=>M(x)?.name||'-').join(' · ')}</span></button>`).join('')||'<div class="empty">빈자리 조 없음</div>'}<div class="subhead"><b>개인 게임대기와 맞교환</b><span class="tag">${q.length}명</span></div>${q.map(qid=>{const qm=M(qid);return `<button class="choiceBtn" onclick="swapQueue('${qid}')"><b>${esc(qm.name)} ${ageTag(qm)}</b><span class="meta">${waitMins(qm)}분 대기</span></button>`}).join('')||'<div class="empty">없음</div>'}<div class="subhead"><b>다른 편성대기 조와 맞교환</b></div>${others.flatMap(g=>g.players.map(oid=>{const om=M(oid);return `<button class="choiceBtn" onclick="swapPending('${g.id}','${oid}')"><b>${esc(om?.name||'-')} ${om?ageTag(om):''}</b><span class="meta">편성대기 ${S.pendingGames.indexOf(g)+1}조</span></button>`})).join('')||'<div class="empty">없음</div>'}<button class="btn ghost" style="width:100%;margin-top:10px" onclick="closeModal()">취소</button>`)}
async function moveToPartial(target,force=false){const c=moveCtx;if(!c)return;try{const x=await act('move_pending_member',{sourcePendingId:c.sourcePendingId,targetPendingId:target,memberId:c.memberId,forceRepeat:force},{repeat:{keep:()=>{moveCtx=c;moveToPartial(target,true)},manual:()=>closeModal()}});if(x)closeModal()}catch(e){showError(e)}}
async function swapQueue(qid,force=false){const c=moveCtx;if(!c)return;try{const x=await act('swap_pending_queue',{pendingId:c.sourcePendingId,fromMemberId:c.memberId,queueMemberId:qid,forceRepeat:force},{repeat:{keep:()=>{moveCtx=c;swapQueue(qid,true)},manual:()=>closeModal()}});if(x)closeModal()}catch(e){showError(e)}}
async function swapPending(targetPid,targetId,force=false){const c=moveCtx;if(!c)return;try{const x=await act('swap_pending_players',{fromPendingId:c.sourcePendingId,toPendingId:targetPid,fromMemberId:c.memberId,toMemberId:targetId,forceRepeat:force},{repeat:{keep:()=>{moveCtx=c;swapPending(targetPid,targetId,true)},manual:()=>closeModal()}});if(x)closeModal()}catch(e){showError(e)}}
function courtLabel(n){return String(S.courtNames?.[Number(n)-1]||`${n}코트`)}
function openCourtStart(pid){const pg=S.pendingGames.find(g=>g.id===pid);if(!pg||pg.players.length!==4)return;courtCtx={mode:'start',pendingId:pid};renderCourtPicker(null)}
function openCourtChange(gid){const g=S.games.find(x=>x.id===gid);if(!g)return;courtCtx={mode:'change',gameId:gid,current:g.court};renderCourtPicker(g.court)}
function renderCourtPicker(current){const used=new Set(S.games.filter(g=>courtCtx?.mode!=='change'||g.id!==courtCtx.gameId).map(g=>Number(g.court)));const avail=[];for(let n=1;n<=S.courtCount;n++)if(!used.has(n))avail.push(n);openModal(`<h3>${courtCtx?.mode==='start'?'경기 시작 코트 선택':'진행중 코트 변경'}</h3><div class="note">${courtCtx?.mode==='start'?'코트를 선택한 뒤 한 번 더 확인합니다.':'변경할 빈 코트를 선택해주세요.'}</div><div class="grid2">${avail.map(n=>`<button class="choiceBtn" onclick="chooseCourt(${n})"><b>${esc(courtLabel(n))}</b>${Number(current)===n?'<span class="meta">현재 코트</span>':''}</button>`).join('')}</div><button class="btn ghost" style="width:100%;margin-top:10px" onclick="closeModal()">취소</button>`)}
async function chooseCourt(n){const c=courtCtx;if(!c)return;if(c.mode==='start'){const pg=S.pendingGames.find(g=>g.id===c.pendingId),names=(pg?.players||[]).map(id=>M(id)?.name||'-').join(' · ');if(!confirm(`${courtLabel(n)}에 해당 편성대기 게임을 배정하고 경기를 시작하시겠습니까?\n${names}`))return;try{await act('begin_game',{pendingId:c.pendingId,court:n});closeModal();goView('queue')}catch(e){showError(e)}}else{if(!confirm(`${courtLabel(n)}로 코트를 변경하시겠습니까?`))return;try{await act('set_game_court',{gameId:c.gameId,court:n});closeModal()}catch(e){showError(e)}}}
async function renameCourt(n){if(!canGame())return;let name=prompt('새 코트 이름을 입력해주세요.',courtLabel(n));if(name===null)return;name=name.trim();if(/^\d+$/.test(name))name+='코트';if(!name)return;try{await act('set_court_name',{court:n,name})}catch(e){showError(e)}}
function playerLine(id){const m=M(id);return m?`<div class="p">${esc(m.name)} ${ageTag(m)} ${roleBadge(m)}<div class="meta">게임 ${dailyCount(id)}회</div></div>`:'-'}
function gameHtml(g){return `<div class="teams"><div class="team">${playerLine(g.players[0])}${playerLine(g.players[1])}</div><b>VS</b><div class="team">${playerLine(g.players[2])}${playerLine(g.players[3])}</div></div><div class="foot"><span class="meta">${new Date(g.startedAt).toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'})} 시작</span><div class="gameBtns">${canGame()?`<button class="btn ghost" onclick="openCourtChange('${g.id}')">코트변경</button>`:''}<button class="btn danger" onclick="finishGameNow('${g.id}')">경기종료</button></div></div>`}
function renderPlaying(){let html='<div class="title"><h2>게임중</h2><span class="tag">30분 자동종료</span></div>';for(let n=1;n<=S.courtCount;n++){const g=S.games.find(x=>Number(x.court)===n);html+=`<div class="card courtCard"><div class="courtName">${canGame()?`<button onclick="renameCourt(${n})">${esc(courtLabel(n))}<br><small>✎</small></button>`:esc(courtLabel(n))}</div><div class="courtBody">${g?gameHtml(g):'<div class="empty">비어 있음</div>'}</div></div>`}$('playing').innerHTML=html}
async function finishGameNow(id){if(!confirm('정말 이 경기를 종료하시겠습니까?'))return;try{await act('finish_game',{gameId:id});goView('queue')}catch(e){showError(e)}}
function renderStats(){const mins=S.history.reduce((a,h)=>a+(Number(h.durationMin)||0),0),people=new Set(S.history.flatMap(h=>h.players||[])).size;$('stats').innerHTML=`<div class="title"><h2>오늘 통계</h2></div><div class="statsGrid"><div class="stat"><b>${S.history.length}</b>완료 게임</div><div class="stat"><b>${mins}분</b>플레이시간</div><div class="stat"><b>${people}</b>참여 인원</div></div><div class="card" style="margin-top:10px"><b>오늘 최근 경기</b>${S.history.length?S.history.slice().reverse().slice(0,20).map(h=>`<div class="historyRow"><b>${esc(h.courtName||courtLabel(h.court))}</b> ${(h.players||[]).map((id,i)=>esc(M(id)?.name||h.playerNames?.[i]||'삭제회원')).join(' · ')}<div class="meta">${h.durationMin||0}분${h.autoEnded?' · 자동종료':''}</div></div>`).join(''):'<div class="empty">완료된 게임이 없습니다.</div>'}</div>`}
function openPairs(id){const m=M(id);if(!m)return;const rows=S.members.filter(x=>x.id!==id).map(x=>({m:x,n:pairCount(id,x.id)})).sort((a,b)=>b.n-a.n||a.m.name.localeCompare(b.m.name,'ko'));openModal(`<h3>${esc(m.name)} · 같이한 경기</h3><div class="note">같은 4인 경기에 함께 들어간 횟수이며 같은 편/상대편은 구분하지 않습니다.</div>${rows.map(x=>`<div class="card between"><div><b>${esc(x.m.name)}</b><div class="meta">${esc(x.m.age)}${esc(x.m.cls)} · ${esc(x.m.gender)}</div></div><b>${x.n}회</b></div>`).join('')||'<div class="empty">비교할 회원이 없습니다.</div>'}<button class="btn ghost" style="width:100%" onclick="closeModal()">닫기</button>`)}
function renderSettings(){const mine=me.memberId?M(me.memberId):null;const tempEligible=S.members.filter(m=>m.type!=='guest'&&roleOf(m)==='member'&&m.state!=='out');$('settings').innerHTML=`<div class="title"><h2>설정</h2></div><div class="card"><div class="between"><div><b>현재 모임</b><div class="meta">${esc(group?.name||'-')}</div></div><span class="tag">${roleLabel(me.role)}</span></div></div>${mine?`<div class="card"><div class="between"><div><b>오늘 내 상태</b><div class="meta">${stateLabel(mine.state)}</div></div><div class="memberBtns"><button class="btn enter" onclick="setMySetting('waiting')">운동</button><button class="btn watch" onclick="setMySetting('spectator')">관람</button><button class="btn danger" onclick="setMySetting('out')">퇴장</button></div></div></div>`:'<div class="note">현재 모임 회원명부에 본인 이름이 없어 참가상태 변경은 표시되지 않습니다.</div>'}${(me.globalAdmin||me.role==='manager'||me.role==='organizer')?`<div class="card"><b>당일 임시편성자</b><div class="meta" style="margin:5px 0 10px">오늘 참석한 일반에게 당일 게임편성 권한만 부여합니다.</div>${tempEligible.map(m=>`<div class="between" style="padding:7px 0;border-bottom:1px solid #edf0f7"><span>${esc(m.name)} ${ageTag(m)}</span><button class="btn ${isTemp(m)?'danger':'ghost'}" onclick="toggleTemp('${m.id}',${!isTemp(m)})">${isTemp(m)?'해제':'임시 지정'}</button></div>`).join('')||'<div class="empty">지정 가능한 참석 회원이 없습니다.</div>'}</div>`:''}${canGame()?`<div class="card"><b>코트 설정</b><div class="field" style="margin-top:9px"><label>사용 코트 수 (1~16)</label><input id="courtCountInput" type="number" min="1" max="16" inputmode="numeric" value="${S.courtCount}"></div><button class="btn pri" onclick="saveCourtCount()">코트 수 저장</button></div>`:''}${canReset()?`<div class="card"><b>모임 당일 운영 리셋</b><div class="warn">이 모임의 오늘 경기·대기·입장상태를 초기화하고 이 모임에 로그인한 이용자를 로그아웃합니다. 누적 게임횟수와 같이한 경기 기록은 유지합니다.</div><button class="btn danger" style="width:100%" onclick="resetDaily()">당일 운영 리셋</button></div>`:''}<div class="card"><div class="between"><div><b>프로그램 버전</b><div class="meta">콕매치 v35 · 다중 모임 운영</div></div><span class="tag">운영본</span></div><button id="forceUpdateBtn" class="btn pri" style="width:100%;margin-top:10px" onclick="forceUpdateApp()">↻ 최신 버전으로 새로고침</button>${me.globalAdmin?'<a class="btn ghost" style="display:block;text-align:center;text-decoration:none;margin-top:7px" href="/versions/">구버전 보기</a>':''}<div class="meta" style="margin-top:8px">${me.globalAdmin?'개발자 최신화 시 본인을 제외한 모든 로그인 세션을 종료합니다.':''} 현재 화면과 스크롤 위치는 유지합니다.</div></div><div class="card"><b>홈 화면에 추가</b><div class="meta" style="margin-top:6px;line-height:1.7">아이폰 Safari: 공유 → 홈 화면에 추가<br>갤럭시 Chrome: 메뉴 → 홈 화면에 추가</div></div>`}
async function setMySetting(mode){try{await act('set_my_attendance',{mode})}catch(e){showError(e)}}
async function toggleTemp(id,enabled){try{await act('set_temp',{memberId:id,enabled})}catch(e){showError(e)}}
async function saveCourtCount(){const n=Number($('courtCountInput').value);try{await act('set_courts',{count:n});alert(`코트 수를 ${n}개로 설정했습니다.`)}catch(e){showError(e)}}
async function resetDaily(){const pin=prompt(`${me.globalAdmin?'개발자':'모임장'} PIN을 입력해주세요.`);if(pin===null)return;if(!confirm(`${group.name}의 당일 운영기록을 초기화하시겠습니까?`))return;try{await act('reset_daily',{pin});if(!me.globalAdmin){await reloginLatest()}else{await loadState();goView('settings')}}catch(e){showError(e)}}
async function openGroupSwitch(){if(!me?.globalAdmin)return;openModal(`<h3>운영 모임 선택</h3><div class="choiceList">${groups.map(g=>`<button class="choiceBtn" onclick="switchGroup('${g.groupId}')"><b>${esc(g.name)}</b></button>`).join('')}</div><button class="btn ghost" style="width:100%;margin-top:9px" onclick="closeModal()">취소</button>`)}
async function switchGroup(id,view='members'){currentGroupId=id;localStorage.setItem(GROUP_KEY,id);closeModal();try{await loadState();goView(view)}catch(e){showError(e)}}
async function loadGroups(){if(!canManageGroups())return;const x=await request('groups','POST',{action:'list_groups'});groupSummaries=x.groups||[];renderGroups()}
function renderGroups(){if(!$('groups')||!canManageGroups())return;$('groups').innerHTML=`<div class="title"><h2>모임관리</h2><button class="btn pri" onclick="openGroupEditor()">+ 모임 생성</button></div><div class="note">개발자는 모든 모임을 생성·수정·삭제하고 각 모임 회원명부에서 모임장와 운영진를 지정할 수 있습니다. 일반 로그인에는 각 모임의 PIN이 사용됩니다.</div>${groupSummaries.map(g=>`<div class="card groupCard ${g.isActive?'':'inactive'}"><div class="between"><div><b>${esc(g.name)}</b><div class="meta">${g.isActive?'운영중':'삭제됨(복구 가능)'}</div></div><span class="tag">${g.memberCount}명</span></div><div class="groupStats"><span>모임장 ${g.managers.length?esc(g.managers.join(', ')):'미지정'}</span><span>운영진 ${g.organizers.length?esc(g.organizers.join(', ')):'없음'}</span><span>대기 ${g.waiting}</span><span>게임중 ${g.playing}</span></div><div class="groupActs">${g.isActive?`<button class="btn pri" onclick="switchGroup('${g.groupId}','members')">인원/권한 관리</button><button class="btn ghost" onclick="openGroupEditor('${g.groupId}')">모임 수정</button><button class="btn danger" onclick="deleteGroup('${g.groupId}')">모임 삭제</button>`:`<button class="btn pri" onclick="restoreGroup('${g.groupId}')">모임 복구</button>`}</div></div>`).join('')||'<div class="empty">등록된 모임이 없습니다.</div>'}`}
function openGroupEditor(id=''){const g=id?groupSummaries.find(x=>x.groupId===id):null;openModal(`<h3>${g?'모임 수정':'새 모임 생성'}</h3><div class="field"><label>모임 이름</label><input id="fgName" value="${esc(g?.name||'')}"></div><div class="field"><label>${g?'새 모임 PIN (변경할 때만 입력)':'모임 PIN (숫자 4~8자리)'}</label><input id="fgPin" type="password" inputmode="numeric" placeholder="${g?'비우면 기존 PIN 유지':'일반 로그인용 PIN'}"></div><div class="acts"><button class="btn ghost" onclick="closeModal()">취소</button><button class="btn pri" onclick="saveGroup('${id}')">저장</button></div>`)}
async function saveGroup(id){const name=$('fgName').value.trim(),pin=$('fgPin').value.trim();if(!name)return alert('모임 이름을 입력해주세요.');try{await request('groups','POST',{action:id?'update_group':'create_group',groupId:id,name,pin});closeModal();await loadGroups();if(!id)alert('모임을 생성했습니다. 일반에게 해당 모임 PIN을 안내해주세요.')}catch(e){showError(e)}}
async function deleteGroup(id){const g=groupSummaries.find(x=>x.groupId===id);if(!g||!confirm(`${g.name} 모임을 삭제하시겠습니까?\n데이터는 복구를 위해 보존되며 운영목록에서 숨겨집니다.`))return;try{await request('groups','POST',{action:'delete_group',groupId:id});await loadGroups()}catch(e){showError(e)}}
async function restoreGroup(id){try{await request('groups','POST',{action:'restore_group',groupId:id});await loadGroups()}catch(e){showError(e)}}
function saveRefreshState(){try{sessionStorage.setItem(REFRESH_KEY,JSON.stringify({view:currentView,y:Math.max(0,scrollY||0),groupId:currentGroupId,at:Date.now()}));if('scrollRestoration'in history)history.scrollRestoration='manual'}catch{}}
function restoreRefreshState(){let x=null;try{x=JSON.parse(sessionStorage.getItem(REFRESH_KEY)||'null')}catch{}if(!x||Date.now()-Number(x.at||0)>120000)return;sessionStorage.removeItem(REFRESH_KEY);if(x.groupId&&me?.globalAdmin&&x.groupId!==currentGroupId){currentGroupId=x.groupId;localStorage.setItem(GROUP_KEY,x.groupId);loadState().then(()=>{goView(x.view||'settings');setTimeout(()=>scrollTo(0,Number(x.y)||0),100)}).catch(()=>{});return}goView(x.view||'settings');requestAnimationFrame(()=>requestAnimationFrame(()=>scrollTo(0,Number(x.y)||0)));setTimeout(()=>scrollTo(0,Number(x.y)||0),250)}
async function forceUpdateApp(){saveRefreshState();const b=$('forceUpdateBtn');if(b){b.disabled=true;b.textContent=me?.globalAdmin?'전체 이용자 최신화 중...':'최신 버전 확인 중...'}try{if(me?.globalAdmin){const r=await fetch(ADMIN_REFRESH_API,{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+T},body:'{}',cache:'no-store'});const x=await r.json().catch(()=>({}));if(!r.ok)throw new Error(x.error||'전체 이용자 최신화에 실패했습니다.')}if('caches'in window){const ks=await caches.keys();await Promise.all(ks.map(k=>caches.delete(k)))}if('serviceWorker'in navigator){const rs=await navigator.serviceWorker.getRegistrations();await Promise.all(rs.map(r=>r.unregister().catch(()=>{})))}await fetch('/index.html?refresh='+Date.now(),{cache:'no-store'}).catch(()=>null);location.replace('/?refresh='+Date.now())}catch(e){if(b){b.disabled=false;b.textContent='↻ 최신 버전으로 새로고침'}showError(e)}}
async function boot(){renderShell();if('serviceWorker'in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>{});if(!T){$('login').classList.remove('hide');return}try{await loadState();$('login').classList.add('hide')}catch(e){if(!reloginBusy){localStorage.removeItem(TOKEN_KEY);T='';$('login').classList.remove('hide');renderLoginName()}}}
document.addEventListener('click',e=>{if(e.target?.id==='modal')closeModal()});setInterval(()=>{if(T&&!reloginBusy)loadState().catch(()=>{})},3000);setInterval(()=>{if(me)renderAll()},60000);boot();

/* migrated into v6.0: app-v36.js */
(()=>{
const ADMIN_V36='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-admin-v36';

const renderQueue35=renderQueue;
renderQueue=function(){
  renderQueue35();
  const box=$('queue');
  if(!box)return;
  [...box.querySelectorAll('.composerActs button')].forEach(b=>{if((b.textContent||'').includes('선택 비우기'))b.remove()});
};

const renderSettings35=renderSettings;
renderSettings=function(){
  renderSettings35();
  const box=$('settings');
  if(!box)return;
  [...box.querySelectorAll('.meta')].forEach(el=>{if((el.textContent||'').includes('콕매치 v35'))el.textContent='콕매치 v36 · 모임별 회원명부 초기화 및 편성 UI 개선'});
  if(me?.globalAdmin){
    const cards=[...box.querySelectorAll(':scope > .card')];
    const home=cards.find(c=>(c.textContent||'').includes('홈 화면에 추가'));
    const html=`<div id="rosterReset36" class="card"><b>선택 모임 회원명부 전체 초기화</b><div class="warn" style="margin-top:8px"><b>${esc(group?.name||'현재 모임')}</b>에서 개발자에 해당하는 회원과 모임장만 남기고 <b>일반·운영진·게스트를 모두 삭제</b>합니다. 개인 게임대기·편성대기·진행중 경기·오늘 경기기록·같이한 경기 기록도 초기화되며, 남겨진 관리자들의 누적 게임횟수도 0회로 초기화됩니다.<br><br>다른 모임에는 영향을 주지 않습니다.</div><button class="btn danger" style="width:100%" onclick="resetRosterGroup36()">선택 모임 회원명부 전체 초기화</button><div class="meta" style="margin-top:8px">개발자 전용 · 개발자 PIN 재확인 필요</div></div>`;
    if(home)home.insertAdjacentHTML('beforebegin',html);else box.insertAdjacentHTML('beforeend',html);
  }
};

window.resetRosterGroup36=async function(){
  if(!me?.globalAdmin)return alert('개발자만 사용할 수 있습니다.');
  const pin=prompt('개발자 PIN을 입력해주세요.');
  if(pin===null)return;
  if(!pin.trim())return alert('개발자 PIN을 입력해주세요.');
  const gname=group?.name||'현재 모임';
  if(!confirm(`${gname}의 회원명부를 전체 초기화하시겠습니까?\n\n개발자와 모임장만 남고 일반·운영진·게스트는 삭제됩니다. 이 작업은 되돌릴 수 없습니다.`))return;
  try{
    const r=await fetch(ADMIN_V36,{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+T},body:JSON.stringify({action:'reset_roster_group',groupId:currentGroupId,pin:pin.trim()}),cache:'no-store'});
    const x=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(x.error||'회원명부 초기화에 실패했습니다.');
    S=x.data;normalizeClient();renderAll();goView('settings');
    alert(`${gname} 회원명부를 초기화했습니다.\n삭제된 인원: ${Number(x.removedCount)||0}명`);
  }catch(e){showError(e)}
};

const forceUpdate35=forceUpdateApp;
forceUpdateApp=async function(){
  if(!me?.globalAdmin)return forceUpdate35();
  saveRefreshState();
  const b=$('forceUpdateBtn');if(b){b.disabled=true;b.textContent='전체 이용자 최신화 중...'}
  try{
    const r=await fetch(ADMIN_V36,{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+T},body:JSON.stringify({action:'refresh_all'}),cache:'no-store'});
    const x=await r.json().catch(()=>({}));if(!r.ok)throw new Error(x.error||'전체 이용자 최신화에 실패했습니다.');
    location.replace('/refresh.html?from=v36&t='+Date.now());
  }catch(e){if(b){b.disabled=false;b.textContent='↻ 최신 버전으로 새로고침'}showError(e)}
};

const renderAll35=renderAll;
renderAll=function(){renderAll35();};
if(me)renderAll();

// Rescue old v36 app shells that are stuck in iOS/PWA cache.
if((location.pathname==='/'||location.pathname==='/index.html')&&/\bv36\b/i.test(document.title)){
  fetch('/latest-version.json?t='+Date.now(),{cache:'no-store'})
    .then(r=>r.ok?r.json():null)
    .then(x=>{if(Number(x?.version||0)>36)location.replace('/refresh.html?stuck=v36&t='+Date.now())})
    .catch(()=>{});
}
})();

/* migrated into v6.0: app-v37.js */
(()=>{
const TOOLS_V37='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-tools-v37';

async function tool37(action,body={}){
  const r=await fetch(TOOLS_V37,{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+T},body:JSON.stringify({action,...body}),cache:'no-store'});
  const x=await r.json().catch(()=>({}));
  if(!r.ok){const e=new Error(x.error||'처리 중 오류가 발생했습니다.');e.details=x.details||[];throw e}
  return x;
}

const renderSettings36=renderSettings;
renderSettings=function(){
  if(currentView==='settings'&&document.activeElement?.id==='courtCountInput')return;
  renderSettings36();
  const box=$('settings');if(!box)return;
  [...box.querySelectorAll('.meta')].forEach(el=>{if((el.textContent||'').includes('콕매치 v36'))el.textContent='콕매치 v37 · 모임 개발자 자동등록 · 코트 입력 개선 · 회원 일괄등록'});
};

const renderMembers36=renderMembers;
renderMembers=function(){
  renderMembers36();
  if(!canManageMembers())return;
  const title=$('members')?.querySelector('.title');if(!title||title.querySelector('.bulkMember37'))return;
  const add=[...title.querySelectorAll('button')].find(b=>(b.textContent||'').includes('회원등록'));
  const wrap=document.createElement('div');wrap.className='memberTitleActs37';
  if(add){title.insertBefore(wrap,add);wrap.appendChild(add)}else title.appendChild(wrap);
  wrap.insertAdjacentHTML('beforeend','<button class="btn ghost bulkMember37" onclick="openBulkMembers37()">일괄등록</button>');
};

const memberControls36=memberControls;
memberControls=function(m){
  if(roleOf(m)==='admin'&&!me?.globalAdmin)return `<div class="status">${stateLabel(m.state)}</div>`;
  return memberControls36(m);
};

const openEditMember36=openEditMember;
openEditMember=function(id){
  const m=M(id);if(!m)return;
  if(roleOf(m)==='admin'&&!me?.globalAdmin)return alert('개발자 정보는 개발자만 수정할 수 있습니다.');
  openEditMember36(id);
};

const openMemberModal36=openMemberModal;
openMemberModal=function(m){
  openMemberModal36(m);
  if(m&&roleOf(m)==='admin'){
    const name=$('fmName'),type=$('fmType'),role=$('fmRole'),pinWrap=$('fmPinWrap');
    if(name)name.disabled=true;
    if(type){type.value='member';type.disabled=true}
    role?.closest('.field')?.remove();pinWrap?.remove();
    const sheet=$('modalSheet');
    [...(sheet?.querySelectorAll('button')||[])].forEach(b=>{if((b.textContent||'').trim()==='삭제')b.remove()});
    const note=sheet?.querySelector('.note');if(note)note.textContent='개발자 계정은 모임 생성 시 자동 등록되며 이름·구분·역할·삭제는 변경할 수 없습니다. 출생연도·성별·급수만 수정할 수 있습니다.';
  }
};

const deleteMemberNow36=deleteMemberNow;
deleteMemberNow=async function(){const m=M(editMemberId);if(m&&roleOf(m)==='admin')return alert('개발자 계정은 삭제할 수 없습니다.');return deleteMemberNow36()};

const saveGroup36=saveGroup;
saveGroup=async function(id){
  if(id)return saveGroup36(id);
  const name=$('fgName')?.value.trim()||'',pin=$('fgPin')?.value.trim()||'';
  if(!name)return alert('모임 이름을 입력해주세요.');
  try{
    const x=await tool37('create_group',{name,pin,sourceGroupId:currentGroupId});
    closeModal();await loadGroups();
    alert(`${x.groupName||name} 모임을 생성했습니다.\n개발자가 회원명부에 자동 등록되었습니다.`);
  }catch(e){showError(e)}
};

function parseBulk37(text){
  const lines=String(text||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean),rows=[],errors=[];
  lines.forEach((line,idx)=>{
    const cells=(line.includes('\t')?line.split('\t'):line.split(',')).map(x=>x.trim());
    if(idx===0&&['이름','name'].includes((cells[0]||'').toLowerCase()))return;
    const [name,yearRaw,gender,clsRaw,typeRaw='일반']=cells;
    const year=Number(yearRaw),cls=String(clsRaw||'').toUpperCase();
    let type='member';const t=String(typeRaw||'일반').trim().toLowerCase();
    if(['게스트','guest'].includes(t))type='guest';else if(!['일반','회원','member',''].includes(t))errors.push(`${idx+1}행: 구분은 일반 또는 게스트로 입력해주세요.`);
    if(!name)errors.push(`${idx+1}행: 이름이 없습니다.`);
    if(!Number.isInteger(year)||year<1900||year>new Date().getFullYear())errors.push(`${idx+1}행: 출생연도를 확인해주세요.`);
    if(!['남','여'].includes(gender))errors.push(`${idx+1}행: 성별은 남 또는 여로 입력해주세요.`);
    if(!['A','B','C','D','E'].includes(cls))errors.push(`${idx+1}행: 급수는 A~E로 입력해주세요.`);
    rows.push({name,year,gender,cls,type});
  });
  return{rows,errors};
}

window.openBulkMembers37=function(){
  openModal(`<h3>회원 일괄등록</h3><div class="note">엑셀에서 아래 순서의 여러 행을 그대로 복사해 붙여넣을 수 있습니다.<br><b>이름 / 출생연도 / 성별 / 급수 / 구분</b><br>구분을 비우면 일반으로 등록됩니다.</div><div class="bulkExample37">홍길동\t1990\t남\tC\t일반<br>김민지\t1994\t여\tD\t게스트</div><div class="field"><label>회원 목록 붙여넣기</label><textarea id="bulkText37" rows="10" placeholder="홍길동    1990    남    C    일반\n김민지    1994    여    D    게스트"></textarea></div><div id="bulkPreview37" class="meta">탭으로 구분된 엑셀 복사 또는 쉼표(,) 구분 입력을 지원합니다.</div><div class="acts"><button class="btn ghost" onclick="previewBulk37()">내용 확인</button><button class="btn pri" onclick="submitBulk37()">일괄등록</button></div><button class="btn ghost" style="width:100%;margin-top:8px" onclick="closeModal()">취소</button>`);
  setTimeout(()=>$('bulkText37')?.focus(),50);
};

window.previewBulk37=function(){
  const p=parseBulk37($('bulkText37')?.value||''),el=$('bulkPreview37');
  if(!p.rows.length){el.innerHTML='<span class="bulkErr37">등록할 내용을 붙여넣어주세요.</span>';return}
  if(p.errors.length){el.innerHTML=`<span class="bulkErr37">${p.errors.slice(0,8).map(esc).join('<br>')}</span>`;return}
  const guests=p.rows.filter(x=>x.type==='guest').length;
  el.innerHTML=`<b>${p.rows.length}명</b> 등록 준비 · 일반 ${p.rows.length-guests}명 · 게스트 ${guests}명`;
};

window.submitBulk37=async function(){
  const p=parseBulk37($('bulkText37')?.value||'');
  if(!p.rows.length)return alert('등록할 회원 목록을 붙여넣어주세요.');
  if(p.errors.length)return alert(p.errors.slice(0,12).join('\n'));
  if(!confirm(`${group?.name||'현재 모임'}에 ${p.rows.length}명을 한 번에 등록하시겠습니까?`))return;
  try{
    const x=await tool37('bulk_add_members',{groupId:currentGroupId,members:p.rows});
    S=x.data;normalizeClient();closeModal();renderAll();
    alert(`${Number(x.addedCount)||p.rows.length}명을 등록했습니다.`);
  }catch(e){alert([e.message,...(e.details||[]).slice(0,12)].join('\n'))}
};

if(me)renderAll();
})();

/* migrated into v6.0: app-v38.js */
(()=>{
const UPDATER='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-updater';
const renderSettings37=renderSettings;
renderSettings=function(){
  renderSettings37();
  const box=$('settings');if(!box)return;
  [...box.querySelectorAll('.meta')].forEach(el=>{if((el.textContent||'').includes('콕매치 v37'))el.textContent='콕매치 v38 · 최신버전 강제 새로고침 안정화'});
};

async function leaveForUpdater38(from='v38'){
  try{
    if(T){
      await fetch(UPDATER+'?api=logout_all&t='+Date.now(),{method:'POST',headers:{authorization:'Bearer '+T},cache:'no-store'}).catch(()=>null);
    }
  }catch(e){}
  try{localStorage.removeItem('kokmatch_token')}catch(e){}
  try{T=''}catch(e){}
  location.replace(UPDATER+'?from='+encodeURIComponent(from)+'&t='+Date.now());
}

forceUpdateApp=async function(){
  try{saveRefreshState()}catch(e){}
  const b=$('forceUpdateBtn');if(b){b.disabled=true;b.textContent='최신 운영본으로 이동 중...'}
  await leaveForUpdater38('button-v38');
};

// v38~v40 구버전 앱 셸이 다시 실행되면 버튼을 누르지 않아도 최신 운영본으로 탈출한다.
const shellVersion=Number((document.title.match(/v(\d+)/i)||[])[1]||0);
if(shellVersion>0&&shellVersion<=40){
  fetch(UPDATER+'?api=version&t='+Date.now(),{cache:'no-store'})
    .then(r=>r.ok?r.json():null)
    .then(x=>{if(Number(x?.version||0)>shellVersion)setTimeout(()=>leaveForUpdater38('auto-v'+shellVersion),80)})
    .catch(()=>{});
}

if(me)renderAll();
})();

/* migrated into v6.0: app-v39.js */
(()=>{
// v39: Galaxy login input stability + clearer gender distinction in member/queue views.
function loginInputCommon39(el){
  if(!el)return;
  el.setAttribute('autocapitalize','off');
  el.setAttribute('spellcheck','false');
  el.style.fontSize='16px';
}

renderLoginName=function(){
  const box=$('loginBox');if(!box)return;
  box.innerHTML=`<h1>🏸 콕매치</h1><div class="meta" style="font-size:14px;margin-bottom:18px">모임 회원 로그인</div><div class="field"><label>등록된 이름</label><input id="loginName" type="text" autocomplete="username" enterkeyhint="next" placeholder="이름"></div><button class="btn pri" style="width:100%" onclick="startLogin()">다음</button><div id="loginErr" class="error"></div><div class="note" style="margin-top:12px">일반은 <b>소속 모임 PIN</b>, 모임장·운영진는 <b>본인 역할 PIN</b>으로 로그인합니다.</div>`;
  const name=$('loginName');loginInputCommon39(name);
  name?.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.isComposing){e.preventDefault();startLogin()}});
};

startLogin=async function(){
  const name=$('loginName')?.value.trim()||'';
  const err=$('loginErr');if(err)err.textContent='';
  if(!name){if(err)err.textContent='이름을 입력해주세요.';return}
  // End the Korean IME connection before replacing the name field with the PIN field.
  // On Galaxy installed-PWA environments, switching keyboard layouts while the old input
  // still owns focus can leave the Samsung Keyboard visible but not connected to the PIN input.
  if(document.activeElement instanceof HTMLElement)document.activeElement.blur();
  try{
    const x=await request('login_probe','POST',{name});pendingLoginName=name;
    const box=$('loginBox');if(!box)return;
    box.innerHTML=`<h2>${esc(x.roleLabel||'PIN')} 인증</h2><div class="authName">${esc(name)}</div><div class="field"><label>PIN</label><input id="loginPin" class="pinInput39" type="tel" inputmode="numeric" pattern="[0-9]*" maxlength="8" autocomplete="off" enterkeyhint="done" placeholder="PIN 입력"></div><button class="btn pri" style="width:100%" onclick="submitLogin()">로그인</button><div id="loginErr" class="error"></div><button class="btn ghost" style="width:100%;margin-top:8px" onclick="renderLoginName()">← 이름 다시 입력</button><div class="meta loginTapHint39">PIN 입력칸을 눌러 숫자 키패드로 입력해주세요.</div>`;
    const pin=$('loginPin');loginInputCommon39(pin);
    pin?.addEventListener('input',()=>{const v=pin.value.replace(/\D/g,'').slice(0,8);if(pin.value!==v)pin.value=v});
    pin?.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.isComposing){e.preventDefault();submitLogin()}});
    // Do not automatically focus PIN. User tap creates a clean Android input connection.
  }catch(e){if(err)err.textContent=e.message}
};

function genderSymbol39(m){return m?.gender==='여'?'여':'남'}
function genderClass39(m){return m?.gender==='여'?'female':'male'}
function genderInline39(m){return `<span class="genderInline39 ${genderClass39(m)}">${genderSymbol39(m)}</span>`}

avatar=function(m){
  return `<div class="avatar genderAvatar39 ${genderClass39(m)}" aria-label="${genderSymbol39(m)}성"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="7" r="4"></circle><path d="M4.5 21c.5-5 3.2-8 7.5-8s7 3 7.5 8z"></path></svg><span>${genderSymbol39(m)}</span></div>`;
};

function decorateQueueGender39(){
  const box=$('queue');if(!box)return;
  const q=typeof sortedQueue==='function'?sortedQueue():[];
  [...box.querySelectorAll('.queueCard')].forEach((card,i)=>{
    if(card.querySelector('.genderMini39'))return;
    const m=M(q[i]);if(!m)return;
    const ord=card.querySelector('.ord');
    if(ord)ord.insertAdjacentHTML('afterend',`<span class="genderMini39 ${genderClass39(m)}" aria-label="${genderSymbol39(m)}성"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="7" r="4"></circle><path d="M4.5 21c.5-5 3.2-8 7.5-8s7 3 7.5 8z"></path></svg></span>`);
  });
  const selected=Array.isArray(draft)?draft:[];
  [...box.querySelectorAll('.composer .slot')].forEach((slot,i)=>{
    const name=slot.querySelector('.slotName'),m=M(selected[i]);
    if(name&&m&&!name.querySelector('.genderInline39'))name.insertAdjacentHTML('afterbegin',genderInline39(m)+' ');
  });
  [...box.querySelectorAll('.pendingCard')].forEach((card,gi)=>{
    const pg=S.pendingGames?.[gi];if(!pg)return;
    [...card.querySelectorAll('.pendingSlot:not(.emptySlot)')].forEach((slot,pi)=>{
      const name=slot.querySelector('.slotName'),m=M(pg.players?.[pi]);
      if(name&&m&&!name.querySelector('.genderInline39'))name.insertAdjacentHTML('afterbegin',genderInline39(m)+' ');
    });
  });
}

const renderQueue38=renderQueue;
renderQueue=function(){renderQueue38();decorateQueueGender39()};

const renderSettings38=renderSettings;
renderSettings=function(){
  renderSettings38();
  const box=$('settings');if(!box)return;
  [...box.querySelectorAll('.meta')].forEach(el=>{if((el.textContent||'').includes('콕매치 v38'))el.textContent='콕매치 v39 · 갤럭시 로그인 입력 안정화 · 남녀 표시 강화'});
};

if(!T)renderLoginName();else if(me)renderAll();
})();

/* migrated into v6.0: app-v40.js */
(()=>{
const RESET_V40='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-reset-v40';
const ADMIN_REFRESH_V40='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-admin-v36';
const UPDATER_V40='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-updater';
const UPDATE_STATE40='kokmatch_update_state_v40';

function canDaily40(){return !!me&&(me.globalAdmin||me.role==='manager'||me.role==='organizer')}
function canCumulative40(){return !!me&&(me.globalAdmin||me.role==='manager')}
function canRoster40(){return !!me?.globalAdmin}
function pinRole40(){return me?.globalAdmin?'개발자':me?.role==='manager'?'모임장':'운영진'}

const renderSettings39=renderSettings;
renderSettings=function(){
  renderSettings39();
  const box=$('settings');if(!box)return;
  [...box.querySelectorAll(':scope > .card')].forEach(c=>{
    const t=c.textContent||'';
    if(t.includes('모임 당일 운영 리셋')||t.includes('선택 모임 회원명부 전체 초기화'))c.remove();
  });
  [...box.querySelectorAll('.meta')].forEach(el=>{if((el.textContent||'').includes('콕매치 v39'))el.textContent='콕매치 v40 · 업데이트 구조 개선 · 3단계 리셋 권한 분리'});
  if(!(canDaily40()||canCumulative40()||canRoster40()))return;
  const versionCard=[...box.querySelectorAll(':scope > .card')].find(c=>(c.textContent||'').includes('프로그램 버전'));
  const parts=[];
  if(canDaily40())parts.push(`<div class="card resetTier40"><b>가. 당일 게임 기록 및 로그인세션 초기화</b><div class="meta" style="margin:7px 0 10px;line-height:1.6">현재 모임의 개인대기·편성대기·진행중 경기·오늘 경기기록·참가상태를 초기화하고, 이 모임 로그인세션을 종료합니다.<br><b>회원명부, 누적 총 게임횟수, 같이한 경기 기록은 유지</b>합니다.</div><button class="btn danger" style="width:100%" onclick="resetTier40('reset_daily')">당일 기록 및 세션 초기화</button><div class="meta" style="margin-top:7px">권한: 운영진 · 모임장 · 개발자</div></div>`);
  if(canCumulative40())parts.push(`<div class="card resetTier40"><b>나. 누적기록 포함 초기화</b><div class="meta" style="margin:7px 0 10px;line-height:1.6">가 항목의 초기화에 더해 회원명부에 저장된 <b>누적 총 게임횟수와 같이한 경기 기록까지 0으로 초기화</b>합니다.<br><b>회원명단과 역할은 그대로 유지</b>합니다.</div><button class="btn danger" style="width:100%" onclick="resetTier40('reset_cumulative')">누적기록까지 초기화</button><div class="meta" style="margin-top:7px">권한: 모임장 · 개발자</div></div>`);
  if(canRoster40())parts.push(`<div class="card resetTier40"><b>다. 회원정보 전체 정리 초기화</b><div class="warn" style="margin:7px 0 10px;line-height:1.6">현재 모임에서 <b>개발자와 모임장만 남기고</b> 운영진·일반·게스트 정보를 모두 삭제합니다. 게임·대기·누적기록도 함께 초기화됩니다.<br>다른 모임에는 영향을 주지 않습니다.</div><button class="btn danger" style="width:100%" onclick="resetTier40('reset_roster')">관리자 제외 인원정보 전체 초기화</button><div class="meta" style="margin-top:7px">권한: 개발자 전용</div></div>`);
  if(parts.length){const html=`<div class="subhead"><b>모임 리셋</b></div>`+parts.join('');if(versionCard)versionCard.insertAdjacentHTML('beforebegin',html);else box.insertAdjacentHTML('beforeend',html)}
};

window.resetTier40=async function(action){
  const labels={reset_daily:'당일 게임 기록 및 로그인세션',reset_cumulative:'당일 기록과 회원 누적기록',reset_roster:'개발자·모임장를 제외한 인원정보 전체'};
  const allowed=action==='reset_daily'?canDaily40():action==='reset_cumulative'?canCumulative40():canRoster40();
  if(!allowed)return alert('해당 초기화 권한이 없습니다.');
  const pin=prompt(`${pinRole40()} PIN을 입력해주세요.`);if(pin===null)return;if(!pin.trim())return alert('PIN을 입력해주세요.');
  const gname=group?.name||'현재 모임';
  let msg=`${gname}의 ${labels[action]}을(를) 초기화하시겠습니까?`;
  if(action==='reset_cumulative')msg+='\n\n회원명단은 유지되지만 누적 게임기록은 0으로 돌아갑니다.';
  if(action==='reset_roster')msg+='\n\n개발자와 모임장를 제외한 회원정보가 삭제되며 되돌릴 수 없습니다.';
  if(!confirm(msg))return;
  try{
    const r=await fetch(RESET_V40,{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+T},body:JSON.stringify({action,groupId:currentGroupId,pin:pin.trim()}),cache:'no-store'});
    const x=await r.json().catch(()=>({}));if(!r.ok)throw new Error(x.error||'초기화에 실패했습니다.');
    if(me?.globalAdmin){S=x.data;normalizeClient();renderAll();goView('settings');alert(action==='reset_roster'?`${gname} 초기화 완료\n삭제 인원: ${Number(x.removedCount)||0}명`:`${gname} 초기화를 완료했습니다.`)}
    else{localStorage.removeItem(TOKEN_KEY);T='';location.replace('/launch/v40.html?afterReset='+Date.now())}
  }catch(e){showError(e)}
};

function saveUpdateState40(){
  try{localStorage.setItem(UPDATE_STATE40,JSON.stringify({view:currentView||'settings',y:Math.max(0,scrollY||0),groupId:currentGroupId||'',at:Date.now()}))}catch{}
}
async function restoreUpdateState40(){
  let x=null;try{x=JSON.parse(localStorage.getItem(UPDATE_STATE40)||'null')}catch{}
  if(!x||Date.now()-Number(x.at||0)>180000){localStorage.removeItem(UPDATE_STATE40);return}
  localStorage.removeItem(UPDATE_STATE40);
  try{
    if(x.groupId&&me?.globalAdmin&&x.groupId!==currentGroupId){currentGroupId=x.groupId;localStorage.setItem('kokmatch_group_id',x.groupId);await loadState()}
    goView(x.view||'settings');requestAnimationFrame(()=>requestAnimationFrame(()=>scrollTo(0,Number(x.y)||0)));setTimeout(()=>scrollTo(0,Number(x.y)||0),250)
  }catch{}
}

forceUpdateApp=async function(){
  saveRefreshState();saveUpdateState40();
  const b=$('forceUpdateBtn');if(b){b.disabled=true;b.textContent=me?.globalAdmin?'전체 이용자 최신화 중...':'최신 운영본 확인 중...'}
  try{
    if(me?.globalAdmin){const r=await fetch(ADMIN_REFRESH_V40,{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+T},body:JSON.stringify({action:'refresh_all'}),cache:'no-store'});const x=await r.json().catch(()=>({}));if(!r.ok)throw new Error(x.error||'전체 이용자 최신화에 실패했습니다.')}
    location.replace(UPDATER_V40+'?from=v40&t='+Date.now())
  }catch(e){if(b){b.disabled=false;b.textContent='↻ 최신 버전으로 새로고침'}showError(e)}
};

if(location.pathname.startsWith('/launch/v40'))history.replaceState(null,'','/?loaded=40');
let restoreTry40=0;const restoreTimer40=setInterval(()=>{restoreTry40++;if(me){clearInterval(restoreTimer40);restoreUpdateState40()}else if(restoreTry40>40)clearInterval(restoreTimer40)},150);
if(me)renderAll();
})();

/* migrated into v6.0: app-v42.js */
(()=>{
const MANAGE_V42='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-manage-v42';

async function manage42(action,body={}){
  const r=await fetch(MANAGE_V42,{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+T},body:JSON.stringify({action,groupId:currentGroupId,...body}),cache:'no-store'});
  const x=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(x.error||'관리 작업에 실패했습니다.');
  return x;
}
function actor42(){return me?.globalAdmin?'admin':String(me?.role||'member')}
function editable42(m){const a=actor42(),r=roleOf(m);if(a==='admin')return true;if(a==='manager')return r!=='admin'&&(r!=='manager'||m.id===me.memberId);return false}
function deletable42(m){const a=actor42(),r=roleOf(m);if(r==='admin')return false;if(a==='admin')return true;if(a==='manager')return r!=='manager';return false}
function roleOptions42(m,add){const a=actor42();if(a==='admin')return ['member','organizer','manager'];if(a==='manager'){if(!add&&roleOf(m)==='manager')return [];return ['member','organizer']}return []}

const memberControls41=memberControls;
memberControls=function(m){
  if(!canManageMembers())return `<div class="status">${stateLabel(m.state)}</div>`;
  let bs='';
  if(m.state!=='playing'&&m.state!=='matched'){
    if(m.state!=='waiting')bs+=`<button class="btn enter" onclick="setOther('${m.id}','waiting')">운동</button>`;
    if(m.state!=='spectator')bs+=`<button class="btn watch" onclick="setOther('${m.id}','spectator')">관람</button>`;
    if(m.state!=='out')bs+=`<button class="btn danger" onclick="setOther('${m.id}','out')">퇴장</button>`;
  }
  if(editable42(m))bs+=`<button class="btn ghost" onclick="openEditMember('${m.id}')">수정</button>`;
  return `<div><div class="status">${stateLabel(m.state)}</div><div class="memberBtns">${bs}</div></div>`;
};

const renderMembers41=renderMembers;
renderMembers=function(){
  renderMembers41();
  const note=$('members')?.querySelector('.note');if(!note)return;
  note.innerHTML=me?.globalAdmin?'개발자는 모든 인원정보와 모임장·운영진 역할을 관리할 수 있습니다.':me?.role==='manager'?'모임장는 이 모임의 최고 운영권한으로 회원·게스트 관리, 운영진 지정·해제, 게임운영과 리셋을 관리합니다.':me?.role==='organizer'?'운영진는 일반·게스트 신규등록, 게임편성 및 당일게임 리셋만 사용할 수 있습니다.':'회원정보와 현재 참가상태를 확인할 수 있습니다.';
};

openEditMember=function(id){
  const m=M(id);if(!m)return;
  if(me?.role==='organizer'&&!me?.globalAdmin)return alert('운영진는 신규 회원/게스트 등록만 가능합니다.');
  if(!editable42(m))return alert('이 회원정보를 수정할 권한이 없습니다.');
  editMemberId=id;openMemberModal(m);
};

openMemberModal=function(m){
  const add=!m,r=roleOf(m),opts=roleOptions42(m,add),isAdmin=!add&&r==='admin',managerSelf=!add&&r==='manager'&&!me?.globalAdmin&&m.id===me?.memberId;
  const roleSelect=opts.length?`<div class="field"><label>역할</label><select id="fmRole" onchange="syncMember42()">${opts.map(x=>`<option value="${x}" ${(add?(x==='member'):r===x)?'selected':''}>${roleLabel(x)}</option>`).join('')}</select></div><div id="fmPinWrap" class="field hide"><label>${add?'역할 PIN':'새 역할 PIN (변경할 때만 입력)'}</label><input id="fmPin" type="tel" inputmode="numeric" maxlength="8" autocomplete="off" placeholder="숫자 4~8자리"></div>`:'';
  openModal(`<h3>${add?'회원등록':'회원 정보 수정'}</h3><div class="note">${add?(opts.length?'구분은 일반/게스트이며, 권한이 있으면 등록과 동시에 역할을 지정할 수 있습니다.':'운영진는 일반 또는 게스트 신규등록만 가능합니다.'):(isAdmin?'개발자 계정은 기본정보만 수정할 수 있습니다.':managerSelf?'모임장 본인의 기본정보를 수정합니다.':'회원정보와 역할을 관리합니다.')}</div><div class="field"><label>이름</label><input id="fmName" value="${esc(m?.name||'')}" ${isAdmin?'disabled':''}></div><div class="grid2"><div class="field"><label>출생연도</label><input id="fmYear" type="number" inputmode="numeric" value="${esc(m?.year||'')}"></div><div class="field"><label>성별</label><select id="fmGender"><option ${m?.gender!=='여'?'selected':''}>남</option><option ${m?.gender==='여'?'selected':''}>여</option></select></div><div class="field"><label>연령대</label><select id="fmAge">${[20,30,40,50,60,70].map(a=>`<option value="${a}" ${String(m?.age||'30')===String(a)?'selected':''}>${a}대</option>`).join('')}</select></div><div class="field"><label>급수</label><select id="fmCls">${['A','B','C','D','E'].map(c=>`<option ${String(m?.cls||'C')===c?'selected':''}>${c}</option>`).join('')}</select></div></div><div class="field"><label>구분</label><select id="fmType" onchange="syncMember42()" ${isAdmin?'disabled':''}><option value="member" ${m?.type!=='guest'?'selected':''}>일반</option><option value="guest" ${m?.type==='guest'?'selected':''}>게스트</option></select></div>${roleSelect}<div class="acts">${!add&&deletable42(m)?'<button class="btn danger" onclick="deleteMemberNow()">삭제</button>':''}<button class="btn ghost" onclick="closeModal()">취소</button><button class="btn pri" onclick="saveMemberNow()">${add?'등록':'저장'}</button></div>`);
  setTimeout(()=>{const y=$('fmYear');if(y)y.addEventListener('input',()=>{const year=Number(y.value);if(year>1900){const age=Math.max(10,Math.floor((new Date().getFullYear()-year)/10)*10);$('fmAge').value=String(Math.min(70,age))}});syncMember42()},0);
};

window.syncMember42=function(){
  const type=$('fmType')?.value||'member',role=$('fmRole');
  if(role&&type==='guest')role.value='member';
  if(role)role.disabled=type==='guest';
  const r=role?.value||'member',wrap=$('fmPinWrap');
  if(wrap)wrap.classList.toggle('hide',r==='member'||type==='guest');
};

const saveMember41=saveMemberNow;
saveMemberNow=async function(){
  const m=editMemberId?M(editMemberId):null,r=m?roleOf(m):'member';
  if(m&&(r==='admin'||(r==='manager'&&!me?.globalAdmin&&m.id===me?.memberId)))return saveMember41();
  const body={memberId:editMemberId||'',name:$('fmName')?.value.trim()||'',year:Number($('fmYear')?.value),gender:$('fmGender')?.value||'남',age:$('fmAge')?.value||'30',cls:$('fmCls')?.value||'C',type:$('fmType')?.value||'member',role:$('fmRole')?.value||'member',pin:$('fmPin')?.value.trim()||''};
  if(!body.name)return alert('이름을 입력해주세요.');
  try{const x=await manage42('save_member',body);S=x.data;normalizeClient();closeModal();renderAll()}catch(e){showError(e)}
};

deleteMemberNow=async function(){
  const m=M(editMemberId);if(!m)return;if(!deletable42(m))return alert('이 회원을 삭제할 권한이 없습니다.');
  if(!confirm(`${m.name} 회원정보를 삭제하시겠습니까?`))return;
  try{const x=await manage42('delete_member',{memberId:m.id});S=x.data;normalizeClient();closeModal();renderAll()}catch(e){showError(e)}
};

const act41=act;
act=async function(action,body={},opts={}){
  if(action==='set_temp'){
    try{const x=await manage42('set_temp',body);if(x.data){S=x.data;normalizeClient();renderAll()}return x}catch(e){throw e}
  }
  return act41(action,body,opts);
};

const renderSettings41=renderSettings;
renderSettings=function(){
  renderSettings41();
  const box=$('settings');if(!box)return;
  if(me?.role==='organizer'&&!me?.globalAdmin){[...box.querySelectorAll(':scope > .card')].forEach(c=>{if((c.textContent||'').includes('당일 임시편성자'))c.remove()})}
  [...box.querySelectorAll('.meta')].forEach(el=>{if((el.textContent||'').includes('콕매치 v41'))el.textContent='콕매치 v42 · 모임 권한체계 및 삭제모임 완전삭제'});
};

renderGroups=function(){
  if(!$('groups')||!canManageGroups())return;
  $('groups').innerHTML=`<div class="title"><h2>모임관리</h2><button class="btn pri" onclick="openGroupEditor()">+ 모임 생성</button></div><div class="note">개발자는 모임을 생성·수정·삭제할 수 있습니다. 삭제된 모임은 복구하거나 완전삭제할 수 있으며, 완전삭제하면 회원·인증·게임데이터가 복구되지 않습니다.</div>${groupSummaries.map(g=>`<div class="card groupCard ${g.isActive?'':'inactive'}"><div class="between"><div><b>${esc(g.name)}</b><div class="meta">${g.isActive?'운영중':'삭제됨'}</div></div><span class="tag">${g.memberCount}명</span></div><div class="groupStats"><span>모임장 ${g.managers.length?esc(g.managers.join(', ')):'미지정'}</span><span>운영진 ${g.organizers.length?esc(g.organizers.join(', ')):'없음'}</span><span>대기 ${g.waiting}</span><span>게임중 ${g.playing}</span></div><div class="groupActs">${g.isActive?`<button class="btn pri" onclick="switchGroup('${g.groupId}','members')">인원/권한 관리</button><button class="btn ghost" onclick="openGroupEditor('${g.groupId}')">모임 수정</button><button class="btn danger" onclick="deleteGroup('${g.groupId}')">모임 삭제</button>`:`<button class="btn pri" onclick="restoreGroup('${g.groupId}')">모임 복구</button><button class="btn danger" onclick="purgeGroup42('${g.groupId}')">완전삭제</button>`}</div></div>`).join('')||'<div class="empty">등록된 모임이 없습니다.</div>'}`;
};

window.purgeGroup42=async function(id){
  const g=groupSummaries.find(x=>x.groupId===id);if(!g)return;
  const typed=prompt(`완전삭제는 되돌릴 수 없습니다.\n확인을 위해 모임 이름을 그대로 입력해주세요.\n\n${g.name}`);if(typed===null)return;if(typed.trim()!==g.name)return alert('모임 이름이 일치하지 않습니다.');
  const pin=prompt('개발자 PIN을 입력해주세요.');if(pin===null)return;if(!pin.trim())return alert('개발자 PIN을 입력해주세요.');
  if(!confirm(`${g.name} 모임의 회원·인증·게임데이터를 완전히 삭제하시겠습니까?\n이 작업은 복구할 수 없습니다.`))return;
  try{await manage42('purge_group',{groupId:id,pin:pin.trim()});await loadGroups();alert(`${g.name} 모임을 완전삭제했습니다.`)}catch(e){showError(e)}
};

if(me)renderAll();
})();

/* migrated into v6.0: app-v42-fix.js */
(()=>{
const memberControls42=memberControls;
memberControls=function(m){
  if(roleOf(m)==='admin'&&!me?.globalAdmin)return `<div class="status">${stateLabel(m.state)}</div>`;
  return memberControls42(m);
};

const openMemberModal42=openMemberModal;
openMemberModal=function(m){
  openMemberModal42(m);
  if(m&&roleOf(m)==='manager'&&!me?.globalAdmin&&m.id===me?.memberId){
    const type=$('fmType');if(type){type.value='member';type.disabled=true}
  }
};

// v42에서 업데이트 버튼을 눌러도 PWA 화면이 Supabase 도메인으로 직접 이동하지 않는다.
// Supabase는 최신버전/배포준비 확인 API로만 사용하고, 실제 화면 이동은 같은 kkokmatch.github.io 안에서 처리한다.
const UPDATER_FIX42='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-updater';
function sleepFix42(ms){return new Promise(r=>setTimeout(r,ms))}
async function fetchFix42(url,opts={},ms=3000){const c=new AbortController(),tm=setTimeout(()=>c.abort(),ms);try{return await fetch(url,{...opts,signal:c.signal,cache:'no-store'})}finally{clearTimeout(tm)}}
async function cleanFix42(){
 try{localStorage.removeItem('kokmatch_token');sessionStorage.clear();T=''}catch(e){}
 const w=(async()=>{try{if('caches'in window){const ks=await caches.keys();await Promise.all(ks.map(k=>caches.delete(k)))}}catch(e){}try{if('serviceWorker'in navigator){const rs=await navigator.serviceWorker.getRegistrations();await Promise.all(rs.map(r=>r.unregister().catch(()=>false)))}}catch(e){}})();
 await Promise.race([w,sleepFix42(1500)]);
}
forceUpdateApp=async function(){
 const b=$('forceUpdateBtn');if(b){b.disabled=true;b.textContent='최신 운영본 확인 중...'}
 try{
  const vr=await fetchFix42(UPDATER_FIX42+'?api=version&t='+Date.now(),{},3000),v=await vr.json();if(!vr.ok||!v.launchUrl)throw new Error('최신 버전 정보를 확인하지 못했습니다.');
  const target=new URL(v.launchUrl);if(target.origin!==location.origin)throw new Error('최신 운영본 주소를 확인할 수 없습니다.');
  if(b)b.textContent=`v${v.version} 준비 확인 중...`;
  let ready=false;for(let i=0;i<50;i++){try{const rr=await fetchFix42(UPDATER_FIX42+'?api=ready&t='+Date.now(),{},2500),x=await rr.json();if(rr.ok&&x.ready&&Number(x.version)>=Number(v.version)){ready=true;break}}catch(e){}await sleepFix42(500)}
  if(!ready)throw new Error('최신 운영본 준비 확인이 지연되고 있습니다. 잠시 후 다시 시도해주세요.');
  if(me?.globalAdmin&&T){try{await fetchFix42(UPDATER_FIX42+'?api=logout_all&t='+Date.now(),{method:'POST',headers:{authorization:'Bearer '+T}},3000)}catch(e){}}
  await cleanFix42();
  location.replace(target.pathname+'?loginFresh=1&t='+Date.now());
 }catch(e){if(b){b.disabled=false;b.textContent='↻ 최신 버전으로 업데이트 후 다시 로그인'}showError(e)}
};

if(me)renderAll();
})();

/* migrated into v6.0: app-v43.js */
(()=>{
const UPDATER_V43='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-updater';

function sleep43(ms){return new Promise(r=>setTimeout(r,ms))}
async function fetchTimeout43(url,opts={},ms=3000){
 const c=new AbortController(),tm=setTimeout(()=>c.abort(),ms);
 try{return await fetch(url,{...opts,signal:c.signal,cache:'no-store'})}finally{clearTimeout(tm)}
}
async function latestInfo43(){
 const r=await fetchTimeout43(UPDATER_V43+'?api=version&t='+Date.now(),{},3000);
 const x=await r.json().catch(()=>({}));
 if(!r.ok||!Number(x.version)||!x.launchUrl)throw new Error('최신 버전 정보를 확인하지 못했습니다.');
 return x;
}
async function waitReady43(version){
 for(let i=0;i<50;i++){
  try{
   const r=await fetchTimeout43(UPDATER_V43+'?api=ready&t='+Date.now(),{},2500);
   const x=await r.json().catch(()=>({}));
   if(r.ok&&x.ready&&Number(x.version)>=Number(version))return x;
  }catch(e){}
  await sleep43(500);
 }
 throw new Error('최신 운영본 준비 확인이 지연되고 있습니다. 잠시 후 다시 시도해주세요.');
}
async function cleanupLocal43(){
 try{localStorage.removeItem('kokmatch_token')}catch(e){}
 try{sessionStorage.clear()}catch(e){}
 try{T=''}catch(e){}
 const work=(async()=>{
  try{if('caches'in window){const ks=await caches.keys();await Promise.all(ks.map(k=>caches.delete(k)))}}catch(e){}
  try{if('serviceWorker'in navigator){const rs=await navigator.serviceWorker.getRegistrations();await Promise.all(rs.map(r=>r.unregister().catch(()=>false)))}}catch(e){}
 })();
 await Promise.race([work,sleep43(1500)]);
}

window.kokmatchUpdateSameOrigin43=async function(){
 const b=$('forceUpdateBtn');if(b){b.disabled=true;b.textContent='최신 운영본 확인 중...'}
 try{
  const info=await latestInfo43();
  const target=new URL(info.launchUrl);
  if(target.origin!==location.origin)throw new Error('최신 운영본 주소를 확인할 수 없습니다.');
  if(b)b.textContent=`v${info.version} 준비 확인 중...`;
  await waitReady43(info.version);
  if(b)b.textContent='로그인세션 초기화 중...';
  if(me?.globalAdmin&&T){
   try{await fetchTimeout43(UPDATER_V43+'?api=logout_all&t='+Date.now(),{method:'POST',headers:{authorization:'Bearer '+T}},3000)}catch(e){}
  }
  await cleanupLocal43();
  location.replace(target.pathname+'?loginFresh=1&t='+Date.now());
 }catch(e){
  if(b){b.disabled=false;b.textContent='↻ 최신 버전으로 업데이트 후 다시 로그인'}
  showError(e)
 }
};
forceUpdateApp=window.kokmatchUpdateSameOrigin43;

const renderSettings42=renderSettings;
renderSettings=function(){
 renderSettings42();
 const box=$('settings');if(!box)return;
 [...box.querySelectorAll('.meta')].forEach(el=>{if((el.textContent||'').includes('콕매치 v42'))el.textContent='콕매치 v43 · 앱내 최신화 안정화'});
 const btn=$('forceUpdateBtn');if(btn)btn.textContent='↻ 최신 버전으로 업데이트 후 다시 로그인';
};

if(location.pathname.startsWith('/launch/v43'))history.replaceState(null,'','/?loaded=43');
if(me)renderAll();
})();

/* migrated into v6.0: app-v44.js */
(()=>{
const BULK_V44='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-bulk-v44';
let actionBusy44=0,lastStateSig44='';

function currentYearKst44(){return Number(new Intl.DateTimeFormat('en',{timeZone:'Asia/Seoul',year:'numeric'}).format(new Date()))||new Date().getFullYear()}
function koreanAge44(year){return Math.max(1,currentYearKst44()-Number(year)+1)}
function ageBand44(year){const age=koreanAge44(year);return Math.max(10,Math.min(90,Math.floor(age/10)*10))}
function syncAge44(){
 const y=Number($('fmYear')?.value),sel=$('fmAge');if(!sel||!Number.isInteger(y)||y<1900||y>currentYearKst44())return;
 for(const band of [10,20,30,40,50,60,70,80,90])if(![...sel.options].some(o=>Number(o.value)===band)){const o=document.createElement('option');o.value=String(band);o.textContent=`${band}대`;sel.appendChild(o)}
 const age=koreanAge44(y),band=ageBand44(y);sel.value=String(band);sel.title=`${y}년생 · ${currentYearKst44()}년 기준 ${age}살`;
}
const openMemberModal43=openMemberModal;
openMemberModal=function(m){openMemberModal43(m);setTimeout(()=>{const y=$('fmYear');if(y){y.addEventListener('input',syncAge44);y.addEventListener('change',syncAge44)}syncAge44()},0)};
const saveMemberNow43=saveMemberNow;
saveMemberNow=async function(){syncAge44();return saveMemberNow43()};

function parseBulk44(text){
 const lines=String(text||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean),rows=[],errors=[];
 lines.forEach((line,idx)=>{const cells=(line.includes('\t')?line.split('\t'):line.split(',')).map(x=>x.trim());if(idx===0&&['이름','name'].includes((cells[0]||'').toLowerCase()))return;const [name,yr,gender,clsRaw,typeRaw='일반']=cells,year=Number(yr),cls=String(clsRaw||'').toUpperCase(),t=String(typeRaw||'일반').toLowerCase();const type=['게스트','guest'].includes(t)?'guest':'member';if(!name)errors.push(`${idx+1}행: 이름이 없습니다.`);if(!Number.isInteger(year)||year<1900||year>currentYearKst44())errors.push(`${idx+1}행: 출생연도를 확인해주세요.`);if(!['남','여'].includes(gender))errors.push(`${idx+1}행: 성별은 남 또는 여로 입력해주세요.`);if(!['A','B','C','D','E'].includes(cls))errors.push(`${idx+1}행: 급수는 A~E로 입력해주세요.`);if(!['일반','회원','member','게스트','guest',''].includes(t))errors.push(`${idx+1}행: 구분은 일반 또는 게스트로 입력해주세요.`);rows.push({name,year,gender,cls,type,age:String(ageBand44(year))})});return{rows,errors}
}
window.submitBulk37=async function(){
 const p=parseBulk44($('bulkText37')?.value||'');if(!p.rows.length)return alert('등록할 회원 목록을 붙여넣어주세요.');if(p.errors.length)return alert(p.errors.slice(0,12).join('\n'));if(!confirm(`${group?.name||'현재 모임'}에 ${p.rows.length}명을 한 번에 등록하시겠습니까?`))return;
 try{const r=await fetch(BULK_V44,{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+T},body:JSON.stringify({groupId:currentGroupId,members:p.rows}),cache:'no-store'});const x=await r.json().catch(()=>({}));if(!r.ok){const e=new Error(x.error||'일괄등록에 실패했습니다.');e.details=x.details||[];throw e}S=x.data;normalizeClient();closeModal();renderAll();alert(`${Number(x.addedCount)||p.rows.length}명을 등록했습니다.`)}catch(e){alert([e.message,...(e.details||[]).slice(0,12)].join('\n'))}
};

const roleBadge43=roleBadge;
roleBadge=function(m){const r=roleOf(m);if(r==='member'&&m?.type!=='guest'&&!isTemp(m))return '<span class="roleBadge role-member44">일반</span>';return roleBadge43(m)};

const renderQueue43=renderQueue;
renderQueue=function(){
 renderQueue43();const box=$('queue');if(!box)return;
 const heads=[...box.querySelectorAll(':scope > .subhead')],pending=heads.find(x=>(x.textContent||'').includes('편성대기')),personal=heads.find(x=>(x.textContent||'').includes('개인 게임대기'));
 if(!pending||!personal)return;const children=[...box.children],pi=children.indexOf(pending),qi=children.indexOf(personal);if(pi<0||qi<0||pi>qi)return;
 const pendingNodes=children.slice(pi,qi),personalNodes=children.slice(qi);personalNodes.forEach(n=>box.appendChild(n));pendingNodes.forEach(n=>box.appendChild(n));
};

function renderCurrent44(id=currentView){
 if(id==='members')renderMembers();else if(id==='queue')renderQueue();else if(id==='playing')renderPlaying();else if(id==='stats')renderStats();else if(id==='settings')renderSettings();else if(id==='groups'&&canManageGroups())renderGroups();
}
renderAll=function(){
 if(!me)return;if(currentView==='groups'&&!canManageGroups())currentView='members';renderHeader();renderNav();renderCurrent44(currentView);document.querySelectorAll('.view').forEach(v=>v.classList.toggle('on',v.id===currentView));document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('on',b.dataset.v===currentView));try{lastStateSig44=JSON.stringify([S,me?.role,me?.globalAdmin,group?.groupId])}catch(e){}
};
goView=function(id){
 if(id==='groups'&&!canManageGroups())id='members';currentView=id;renderNav();renderCurrent44(id);document.querySelectorAll('.view').forEach(v=>v.classList.toggle('on',v.id===id));document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('on',b.dataset.v===id));if(id==='groups')loadGroups().catch(showError);window.scrollTo(0,0)
};

const act43=act;
act=async function(...args){actionBusy44++;try{return await act43(...args)}finally{actionBusy44=Math.max(0,actionBusy44-1)}};
loadState=async function(){
 if(actionBusy44)return;const x=await request('state','GET',null,{groupId:currentGroupId});const sig=JSON.stringify([x.data,x.user?.role,x.user?.globalAdmin,x.group?.groupId]);const changed=sig!==lastStateSig44;S=x.data;me=x.user;group=x.group;groups=x.groups||groups;currentGroupId=group.groupId;localStorage.setItem(GROUP_KEY,currentGroupId);normalizeClient();if(changed)renderAll();restoreRefreshState()
};

const renderSettings43=renderSettings;
renderSettings=function(){renderSettings43();const box=$('settings');if(!box)return;[...box.querySelectorAll('.meta')].forEach(el=>{if((el.textContent||'').includes('콕매치 v43'))el.textContent='콕매치 v44 · 연령대 자동계산 · 대기화면 정렬 · 배지/반응속도 개선'})};

if(me)renderAll();
})();

/* migrated into v6.0: app-v45.js */
(()=>{
const MEMBER_V45='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-member-v45';
function guestBadge45(){return '<span class="roleBadge guest45">게스트</span>'}
function displayBadge45(m){return m?.type==='guest'?guestBadge45():roleBadge(m)}
function inviteText45(m){return m?.type==='guest'&&String(m?.inviter||'').trim()?String(m.inviter).trim():''}

const typeBadge44=typeBadge;
typeBadge=function(m){return m?.type==='guest'?guestBadge45():typeBadge44(m)};

const renderMembers44=renderMembers;
renderMembers=function(){
 renderMembers44();
 const cards=[...($('members')?.querySelectorAll('.memberCard')||[])];
 cards.forEach((card,i)=>{
  const m=S.members[i];if(!m)return;
  const line=card.querySelector('.name');
  if(line){line.classList.add('memberMainLine45');line.innerHTML=`<span class="memberName45">${esc(m.name)}</span>${ageTag(m)}<span class="gamecnt">총 게임 ${Number(m.totalGames)||0}회</span>${displayBadge45(m)}`}
  const meta=card.querySelector('.meta');
  if(meta){const inv=inviteText45(m);meta.innerHTML=`${esc(m.year||'')}년생 · ${esc(m.gender||'')}${inv?` <span class="inviteInfo45">· 초대 ${esc(inv)}</span>`:''}`}
 });
};

const openMemberModal44=openMemberModal;
openMemberModal=function(m){
 openMemberModal44(m);
 setTimeout(()=>{
  const type=$('fmType');if(!type||$('fmInviterWrap45'))return;
  const field=type.closest('.field');if(!field)return;
  const suggestions=S.members.filter(x=>x.type!=='guest'&&(!m||x.id!==m.id)).map(x=>`<option value="${esc(x.name)}"></option>`).join('');
  field.insertAdjacentHTML('afterend',`<div id="fmInviterWrap45" class="field hide"><label>초대인</label><input id="fmInviter45" list="fmInviterList45" value="${esc(m?.inviter||'')}" maxlength="40" placeholder="초대한 회원 이름 입력"><datalist id="fmInviterList45">${suggestions}</datalist><div class="meta">게스트일 때 필수 입력 · 회원명부/게임대기/게임중 화면에 표시됩니다.</div></div>`);
  type.addEventListener('change',syncInviter45);syncInviter45();
  const selfStaff=!!m&&String(m.id||'')===String(me?.memberId||'')&&['manager','organizer'].includes(roleOf(m));
  if(selfStaff){$('fmRole')?.closest('.field')?.remove();$('fmPinWrap')?.remove()}
 },0);
};
window.syncInviter45=function(){const guest=$('fmType')?.value==='guest',wrap=$('fmInviterWrap45'),inp=$('fmInviter45');if(wrap)wrap.classList.toggle('hide',!guest);if(inp)inp.required=guest};

const saveMemberNow44=saveMemberNow;
saveMemberNow=async function(){
 const cur=editMemberId?M(editMemberId):null;
 if(cur&&roleOf(cur)==='admin')return saveMemberNow44();
 const selfStaff=!!cur&&String(cur.id||'')===String(me?.memberId||'')&&['manager','organizer'].includes(roleOf(cur));
 const type=$('fmType')?.value||'member',inviter=type==='guest'?($('fmInviter45')?.value.trim()||''):'';
 if(type==='guest'&&!inviter)return alert('게스트의 초대인을 입력해주세요.');
 let role=selfStaff?roleOf(cur):($('fmRole')?.value||(cur?roleOf(cur):'member'));if(type==='guest')role='member';
 const body={action:'save_member',groupId:currentGroupId,memberId:editMemberId||'',name:$('fmName')?.value.trim()||'',year:Number($('fmYear')?.value),gender:$('fmGender')?.value||'남',cls:$('fmCls')?.value||'C',type,role,pin:selfStaff?'':($('fmPin')?.value.trim()||''),inviter};
 if(!body.name)return alert('이름을 입력해주세요.');
 try{const r=await fetch(MEMBER_V45,{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+T},body:JSON.stringify(body),cache:'no-store'});const x=await r.json().catch(()=>({}));if(!r.ok)throw new Error(x.error||'회원 저장에 실패했습니다.');S=x.data;normalizeClient();closeModal();renderAll()}catch(e){showError(e)}
};

function appendInviteInline45(meta,m){const inv=inviteText45(m);if(!meta||!inv||meta.querySelector('.inviteInfo45'))return;meta.insertAdjacentHTML('beforeend',` <span class="inviteInfo45">· 초대 ${esc(inv)}</span>`)}
function appendInviteSub45(box,m){const inv=inviteText45(m);if(!box||!inv||box.querySelector('.inviteSub45'))return;box.insertAdjacentHTML('beforeend',`<span class="inviteSub45">초대 ${esc(inv)}</span>`)}
function decorateGuestInviters45(){
 const box=$('queue');if(!box)return;
 const q=typeof sortedQueue==='function'?sortedQueue():[];
 [...box.querySelectorAll('.queueCard')].forEach((card,i)=>appendInviteInline45(card.querySelector('.meta'),M(q[i])));
 [...box.querySelectorAll('.composer .slot')].forEach((slot,i)=>appendInviteSub45(slot,draft?.[i]?M(draft[i]):null));
 [...box.querySelectorAll('.pendingCard')].forEach((card,gi)=>{const pg=S.pendingGames?.[gi];if(!pg)return;[...card.querySelectorAll('.pendingSlot:not(.emptySlot)')].forEach((slot,pi)=>appendInviteSub45(slot,M(pg.players?.[pi])))})
}
const renderQueue44=renderQueue;
renderQueue=function(){renderQueue44();decorateGuestInviters45()};

playerLine=function(id){const m=M(id);if(!m)return'-';const inv=inviteText45(m);return `<div class="p">${esc(m.name)} ${ageTag(m)} ${displayBadge45(m)}<div class="meta">게임 ${dailyCount(id)}회${inv?` · 초대 ${esc(inv)}`:''}</div></div>`};

const renderSettings44=renderSettings;
renderSettings=function(){renderSettings44();const box=$('settings');if(!box)return;[...box.querySelectorAll('.meta')].forEach(el=>{if((el.textContent||'').includes('콕매치 v44'))el.textContent='콕매치 v45 · 회원 한줄표시 · 게스트 초대인 관리'})};

if(me)renderAll();
})();

/* migrated into v6.0: app-v46.js */
(()=>{
const STATE_V46='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-state-v46';
const MEMBER_PAGE_SIZE46=10;
let memberQuery46='',memberPage46=1,stateBusy46=null,actionBusy46=0,lastCompactSig46='';
const lastPoll46={};

function pollMs46(view){
 if(view==='queue'||view==='playing')return 4000;
 if(view==='stats')return 8000;
 if(view==='members')return Infinity;
 return 15000;
}
function compactView46(view){return view==='queue'||view==='playing'||view==='stats'}
function memberSessionReady46(){return !!(me&&currentGroupId&&String(me.groupId||'')===String(currentGroupId))}
async function compactState46(){
 const requestedView=currentView||'members',requestedGroup=String(currentGroupId||'');
 const u=new URL(STATE_V46);if(currentGroupId)u.searchParams.set('groupId',currentGroupId);u.searchParams.set('t',Date.now());
 const r=await fetch(u,{headers:{authorization:'Bearer '+T},cache:'no-store'});const x=await r.json().catch(()=>({}));
 if(!r.ok){if(r.status===401){reloginLatest();throw new Error('로그인이 만료되었습니다.')}throw new Error(x.error||'상태 조회에 실패했습니다.')}
 if(String(currentGroupId||'')!==requestedGroup||String(currentView||'members')!==requestedView||!compactView46(currentView||'members'))return x;
 window.__kokmatchMemberCount46=Number(x.memberCount||0);
 const sig=JSON.stringify([x.data,x.user?.role,x.user?.globalAdmin,x.group?.groupId]);const changed=sig!==lastCompactSig46;lastCompactSig46=sig;
 S=x.data;me=x.user;group=x.group;groups=x.groups||groups;currentGroupId=group.groupId;localStorage.setItem(GROUP_KEY,currentGroupId);normalizeClient();if(changed)renderAll();
 return x;
}
const loadState45=loadState;
loadState=async function(force=false){
 if(!T||reloginBusy)return;if(document.hidden&&!force)return;
 const view=currentView||'members',now=Date.now(),last=Number(lastPoll46[view]||0),gap=pollMs46(view);
 if(view==='members'&&memberSessionReady46()){lastPoll46.members=now;return}
 if(!force&&last&&now-last<gap)return;if(actionBusy46&&!force)return;if(stateBusy46)return stateBusy46;
 lastPoll46[view]=now;
 stateBusy46=(compactView46(view)?compactState46():loadState45()).finally(()=>{stateBusy46=null});
 return stateBusy46;
};

const act45=act;
act=async function(...args){actionBusy46++;try{const x=await act45(...args);lastPoll46[currentView]=Date.now();return x}finally{actionBusy46=Math.max(0,actionBusy46-1)}};

function loggedMemberFirst46(list){
 const a=Array.isArray(list)?list:[],id=String(me?.memberId||'');
 if(!id)return a.slice();
 const mine=a.find(m=>String(m?.id||'')===id);if(!mine)return a.slice();
 return [mine,...a.filter(m=>String(m?.id||'')!==id)];
}
function filteredMembers46(){
 const q=memberQuery46.trim().toLowerCase();
 const base=!q?S.members:S.members.filter(m=>[m.name,m.cls,m.gender,m.inviter,roleLabel(roleOf(m)),m.type==='guest'?'게스트':'일반'].some(v=>String(v||'').toLowerCase().includes(q)));
 return loggedMemberFirst46(base);
}
function jsId46(id){return String(id||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'")}
function stampMemberCards46(page){
 const box=$('members');if(!box)return;
 const cards=[...box.querySelectorAll('.memberCard')];
 const ids=[];
 cards.forEach((card,i)=>{
  const m=page[i];if(!m)return;
  const id=String(m.id||'');if(!id)return;ids.push(id);
  card.dataset.memberId46=id;
  card.dataset.memberGender46=String(m.gender||'');
  const safe=jsId46(id);
  const pair=card.querySelector('.pairBtn');if(pair)pair.setAttribute('onclick',`openPairs('${safe}')`);
  card.querySelectorAll('button[onclick]').forEach(btn=>{
   const raw=String(btn.getAttribute('onclick')||'');
   if(/^\s*setOther\s*\(/.test(raw)){
    const state=(raw.match(/setOther\s*\(\s*['"][^'"]*['"]\s*,\s*['"]([^'"]+)['"]/)||[])[1];
    if(state)btn.setAttribute('onclick',`setOther('${safe}','${state}')`);
   }else if(/^\s*openEditMember\s*\(/.test(raw))btn.setAttribute('onclick',`openEditMember('${safe}')`);
  });
 });
 window.__kokmatchVisibleMemberIds46=ids;
 window.__kokmatchMemberPage46=memberPage46;
}
window.__kokmatchRestampMembers46=function(){
 const filtered=filteredMembers46(),start=(memberPage46-1)*MEMBER_PAGE_SIZE46,page=filtered.slice(start,start+MEMBER_PAGE_SIZE46);stampMemberCards46(page);return page.map(m=>String(m.id||''));
};
const renderMembers45=renderMembers;
renderMembers=function(){
 const all=Array.isArray(S?.members)?S.members:[],filtered=filteredMembers46(),pages=Math.max(1,Math.ceil(filtered.length/MEMBER_PAGE_SIZE46));memberPage46=Math.min(Math.max(1,memberPage46),pages);const start=(memberPage46-1)*MEMBER_PAGE_SIZE46,page=filtered.slice(start,start+MEMBER_PAGE_SIZE46);
 S.members=page;try{renderMembers45();stampMemberCards46(page)}finally{S.members=all}
 const box=$('members');if(!box)return;const title=box.querySelector('.title');if(title&&!box.querySelector('.memberSearch46'))title.insertAdjacentHTML('afterend',`<div class="memberSearch46"><div class="memberSearchRow46"><input id="memberSearchInput46" value="${esc(memberQuery46)}" placeholder="이름·급수·초대인 검색" oninput="searchMembers46(this.value)"><button class="btn ghost" onclick="refreshMembers46()">새로고침</button></div><div class="meta">전체 ${all.length}명 · 검색 ${filtered.length}명 · 한 화면 최대 ${MEMBER_PAGE_SIZE46}명</div></div>`);
 if(pages>1)box.insertAdjacentHTML('beforeend',`<div class="memberPager46"><button class="btn ghost" ${memberPage46<=1?'disabled':''} onclick="memberPageGo46(${memberPage46-1})">이전</button><span><b>${memberPage46}</b> / ${pages}</span><button class="btn ghost" ${memberPage46>=pages?'disabled':''} onclick="memberPageGo46(${memberPage46+1})">다음</button></div>`);
};
window.searchMembers46=function(v){memberQuery46=String(v||'');memberPage46=1;renderMembers();const i=$('memberSearchInput46');if(i){i.focus();try{i.setSelectionRange(i.value.length,i.value.length)}catch{}}};
window.memberPageGo46=function(p){memberPage46=Math.max(1,Number(p)||1);renderMembers();window.scrollTo(0,0)};
window.resetMemberList46=function(){memberQuery46='';memberPage46=1;renderMembers()};
window.refreshMembers46=function(){lastPoll46.members=0;if(typeof window.enterMembers42==='function')return window.enterMembers42(true);return loadState45(true).catch(showError)};

const goView45=goView;
goView=function(id){
 const prev=currentView;const r=goView45(id);if(id==='members'&&prev!==id){memberPage46=1;memberQuery46='';lastPoll46.members=0}
 lastPoll46[id]=0;
 if(id==='members'&&memberSessionReady46())return r;
 loadState(true).catch(()=>{});return r;
};
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&T){lastPoll46[currentView]=0;if(currentView==='members'&&memberSessionReady46()){if(typeof window.enterMembers42==='function')window.enterMembers42(false);return}loadState(true).catch(()=>{})}});

const renderSettings45=renderSettings;
renderSettings=function(){renderSettings45();const box=$('settings');if(!box)return;[...box.querySelectorAll('.meta')].forEach(el=>{if((el.textContent||'').includes('콕매치 v45'))el.textContent='콕매치 v46 · 10명 단위 회원명부 · 스마트 동기화'})};

if(me)renderAll();
})();

/* migrated into v6.0: app-v47.js */
(()=>{
const GROUPS_V47='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-groups-v47';

/* PC-safe pointer handling: dragging/selecting inside a modal must never count as a backdrop click. */
let pointer47={down:false,insideSheet:false,x:0,y:0,dragged:false};
function clearPointer47(){pointer47={down:false,insideSheet:false,x:0,y:0,dragged:false}}
function markPointerDown47(e){
 const t=e.target instanceof Element?e.target:null;if(!t)return;
 pointer47={down:true,insideSheet:!!t.closest('#modalSheet'),x:Number(e.clientX)||0,y:Number(e.clientY)||0,dragged:false};
}
function markPointerMove47(e){if(!pointer47.down)return;const dx=(Number(e.clientX)||0)-pointer47.x,dy=(Number(e.clientY)||0)-pointer47.y;if(Math.hypot(dx,dy)>5)pointer47.dragged=true}
function markPointerEnd47(){setTimeout(clearPointer47,180)}
if(window.PointerEvent){document.addEventListener('pointerdown',markPointerDown47,true);document.addEventListener('pointermove',markPointerMove47,true);document.addEventListener('pointerup',markPointerEnd47,true);document.addEventListener('pointercancel',clearPointer47,true)}else{document.addEventListener('mousedown',markPointerDown47,true);document.addEventListener('mousemove',markPointerMove47,true);document.addEventListener('mouseup',markPointerEnd47,true)}
document.addEventListener('click',e=>{
 const t=e.target instanceof Element?e.target:null;if(!t)return;
 const startedInside=pointer47.insideSheet,dragged=pointer47.dragged;
 if(t.id==='modal'&&startedInside){clearPointer47();e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();return}
 if(dragged&&t.closest('.queueCard,.pendingSlot,.courtCard,.choiceBtn')){clearPointer47();e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();return}
 clearPointer47();
},true);

/* Desktop keyboard conveniences without changing mobile behavior. */
document.addEventListener('keydown',e=>{
 if(e.key!=='Enter'||e.isComposing)return;
 const id=(e.target instanceof Element?e.target.id:'');
 if(id==='loginName'){e.preventDefault();startLogin()}
 else if(id==='loginPin'){e.preventDefault();submitLogin()}
});

function badge47(m){return m?.type==='guest'?'<span class="roleBadge guest45">게스트</span>':roleBadge(m)}
function invite47(m){const v=m?.type==='guest'?String(m?.inviter||'').trim():'';return v?`<span class="inviteSub45">초대 ${esc(v)}</span>`:''}
function pendingCard47(pg,i){
 const waited=Math.max(0,Math.floor((Date.now()-Number(pg.createdAt||Date.now()))/60000));
 const slots=Array.from({length:4},(_,idx)=>{
  const id=pg.players?.[idx],m=id?M(id):null;
  if(!m)return `<div class="pendingSlot emptySlot ${canGame()?'clickable':''}" ${canGame()?`onclick="openFillPending('${pg.id}')"`:''}>＋ 빈자리</div>`;
  return `<div class="pendingSlot ${canGame()?'clickable':''}" ${canGame()?`onclick="openMoveMember('${pg.id}','${id}')"`:''}>${canGame()?`<button class="pendingX" onclick="event.stopPropagation();removePending('${pg.id}','${id}')">×</button>`:''}<div class="slotLabel">${idx<2?'A팀':'B팀'} ${idx%2+1}</div><div class="slotName">${esc(m.name)} ${ageTag(m)} ${badge47(m)}</div><div class="meta">게임 ${dailyCount(id)}회 · ${waitMins(m)}분 대기</div>${invite47(m)}</div>`;
 }).join('');
 return `<div class="card pendingCard"><div class="pendingHead"><b>편성대기 ${i+1}조 · ${pg.players?.length||0}/4명</b><div class="pendingTools">${canGame()?`<button class="miniBtn" ${i===0?'disabled':''} onclick="movePendingOrder('${pg.id}','up')">↑</button><button class="miniBtn" ${i===S.pendingGames.length-1?'disabled':''} onclick="movePendingOrder('${pg.id}','down')">↓</button>`:''}<span class="tag">${waited}분</span></div></div><div class="pendingGrid">${slots}</div><div class="pairSummary">${pairSummary(pg.players||[])}</div>${canGame()?`<div class="pendingActs"><button class="btn pri" ${(pg.players?.length||0)!==4?'disabled':''} onclick="openCourtStart('${pg.id}')">코트 선택 · 경기 시작</button><button class="btn ghost" onclick="cancelPending('${pg.id}')">편성 취소</button></div>`:''}</div>`;
}

/* Rebuild the waiting view once, instead of stacking the v35~v46 DOM-reorder wrappers. */
renderQueue=function(){
 const box=$('queue');if(!box)return;
 try{
  const q=sortedQueue(),selected=new Set(draft.filter(Boolean));
  const composer=canGame()?`<div class="composer"><div class="composerTitle">새 게임 편성</div><div class="slots">${draft.map((id,i)=>{const m=id?M(id):null;return `<div class="slot ${m?'filled':''}"><div class="slotLabel">${i<2?'A팀':'B팀'} ${i%2+1}</div>${m?`<button class="slotX" onclick="draftRemove(${i})">×</button><div class="slotName">${esc(m.name)} ${ageTag(m)} ${badge47(m)}</div><div class="meta">게임 ${dailyCount(id)}회 · ${waitMins(m)}분 대기</div>${invite47(m)}`:'<div class="meta">개인 게임대기에서 선택</div>'}</div>`}).join('')}</div><div class="pairSummary">${pairSummary(draft.filter(Boolean))}</div><div class="composerActs"><button class="btn ghost" onclick="recommendDraft()">✨ 추천 구성</button><button class="btn pri" ${draft.filter(Boolean).length?'':'disabled'} onclick="registerDraft()">대기 등록</button></div></div>`:'';
  const personal=`<div class="subhead"><b>개인 게임대기</b><span class="tag">${q.length}명</span></div><div class="note">게임횟수가 적은 순서 → 같은 횟수면 대기시간이 긴 순서입니다.</div>${q.length?q.map((id,i)=>{const m=M(id);if(!m)return'';return `<div class="card queueCard ${selected.has(id)?'selected':''}" ${canGame()?`onclick="draftClick('${id}')"`:''}><div class="ord">${i+1}</div><div><div class="name queueMain47">${esc(m.name)} ${ageTag(m)} <span class="gamecnt">게임 ${dailyCount(id)}회</span> ${badge47(m)}</div><div class="meta">${esc(m.gender||'')} · ${waitMins(m)}분 대기</div>${invite47(m)}</div><b>${selected.has(id)?'✓':''}</b></div>`}).join(''):'<div class="empty">개인 게임대기 회원이 없습니다.</div>'}`;
  const pending=`<div class="subhead"><b>편성대기 현황</b><span class="tag">${S.pendingGames.length}조</span></div>${S.pendingGames.length?S.pendingGames.map(pendingCard47).join(''):'<div class="empty">편성대기 중인 조가 없습니다.</div>'}`;
  box.innerHTML=`<div class="title"><h2>게임대기</h2><span class="tag">${S.queue.length+S.pendingGames.reduce((n,g)=>n+(g.players?.length||0),0)}명</span></div>${composer}${personal}${pending}`;
 }catch(e){console.error('queue render v47',e);box.innerHTML=`<div class="title"><h2>게임대기</h2></div><div class="warn">게임대기 화면을 표시하는 중 오류가 발생했습니다.</div><button class="btn pri" onclick="refreshQueue47()">다시 불러오기</button>`}
};
window.refreshQueue47=function(){loadState(true).then(()=>renderQueue()).catch(showError)};

async function groupsRequest47(action,body={}){
 const r=await fetch(GROUPS_V47,{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+T},body:JSON.stringify({action,...body}),cache:'no-store'});
 const x=await r.json().catch(()=>({}));if(!r.ok){if(r.status===401){reloginLatest();throw new Error('로그인이 만료되었습니다.')}throw new Error(x.error||'모임 관리 작업에 실패했습니다.')}return x;
}
loadGroups=async function(){if(!canManageGroups())return;const x=await groupsRequest47('list_groups');groupSummaries=x.groups||[];renderGroups();return x};
saveGroup=async function(id){
 const name=$('fgName')?.value.trim()||'',pin=$('fgPin')?.value.trim()||'';if(!name)return alert('모임 이름을 입력해주세요.');
 try{const x=await groupsRequest47(id?'update_group':'create_group',{groupId:id||'',name,pin});closeModal();await loadGroups();if(!id)alert(`${x.groupName||name} 모임을 생성했습니다. 개발자가 회원명부에 자동 등록되었습니다.`)}catch(e){showError(e)}
};
deleteGroup=async function(id){
 const g=groupSummaries.find(x=>x.groupId===id);if(!g||!confirm(`${g.name} 모임을 삭제하시겠습니까?\n데이터는 보존되며 삭제된 모임에서 복구 또는 완전삭제를 선택할 수 있습니다.`))return;
 try{await groupsRequest47('delete_group',{groupId:id});await loadGroups();if(currentGroupId===id){const next=groupSummaries.find(x=>x.isActive);if(next){currentGroupId=next.groupId;localStorage.setItem(GROUP_KEY,currentGroupId);await loadState(true)}}renderGroups()}catch(e){showError(e)}
};
restoreGroup=async function(id){try{await groupsRequest47('restore_group',{groupId:id});await loadGroups()}catch(e){showError(e)}};
const purge42=window.purgeGroup42;
if(typeof purge42==='function')window.purgeGroup42=async function(id){const wasCurrent=currentGroupId===id;await purge42(id);if(wasCurrent&&!groupSummaries.some(x=>x.groupId===id)){const next=groupSummaries.find(x=>x.isActive);if(next){currentGroupId=next.groupId;localStorage.setItem(GROUP_KEY,currentGroupId);await loadState(true).catch(()=>{})}renderGroups()}};

const renderSettings46=renderSettings;
renderSettings=function(){renderSettings46();const box=$('settings');if(!box)return;[...box.querySelectorAll('.meta')].forEach(el=>{if((el.textContent||'').includes('콕매치 v46'))el.textContent='콕매치 v47 · PC 호환성 · 모임관리/게임대기 안정화'})};

if(location.pathname.startsWith('/launch/v47'))history.replaceState(null,'','/?loaded=47');
if(me)renderAll();
})();

/* migrated into v6.0: app-v48.js */
(()=>{
function decorateResponsive48(){
 document.documentElement.dataset.kokmatchViewport=innerWidth<360?'fold-cover':innerWidth<600?'phone':innerWidth<900?'tablet-small':innerWidth<1200?'tablet-large':'desktop';
 [...($('members')?.querySelectorAll('.memberCard')||[])].forEach(card=>{
  const kids=[...card.children];if(kids[1])kids[1].classList.add('memberInfo48');if(kids[2])kids[2].classList.add('memberActions48');
 });
 [...($('queue')?.querySelectorAll('.queueCard')||[])].forEach(card=>{const kids=[...card.children];if(kids[1])kids[1].classList.add('queueInfo48')});
}
const renderMembers47=renderMembers;
renderMembers=function(){renderMembers47();decorateResponsive48()};
const renderQueue47=renderQueue;
renderQueue=function(){renderQueue47();decorateResponsive48()};
const renderPlaying47=renderPlaying;
renderPlaying=function(){renderPlaying47();decorateResponsive48()};
const renderSettings47=renderSettings;
renderSettings=function(){renderSettings47();const box=$('settings');if(box){[...box.querySelectorAll('.meta')].forEach(el=>{if((el.textContent||'').includes('콕매치 v47'))el.textContent='콕매치 v48 · 전 기기 반응형 레이아웃'})}decorateResponsive48()};
let resize48=0;addEventListener('resize',()=>{clearTimeout(resize48);resize48=setTimeout(decorateResponsive48,80)},{passive:true});
addEventListener('orientationchange',()=>setTimeout(decorateResponsive48,160),{passive:true});
if(location.pathname.startsWith('/launch/v48'))history.replaceState(null,'','/?loaded=48');
decorateResponsive48();if(me)renderAll();
})();

/* migrated into v6.0: app-v49.js */
(()=>{
function viewportMode49(){
 const w=Math.max(0,window.innerWidth||document.documentElement.clientWidth||0);
 if(w<360)return'fold-cover';
 if(w<480)return'phone';
 if(w<600)return'phone-wide';
 if(w<768)return'fold-open';
 if(w<1024)return'tablet';
 if(w<1200)return'tablet-large';
 return'desktop';
}
function applyViewport49(){
 const root=document.documentElement;
 root.dataset.kokmatchViewport=viewportMode49();
 root.dataset.kokmatchOrientation=(window.innerWidth||0)>=(window.innerHeight||0)?'landscape':'portrait';
}
const renderSettings48=renderSettings;
renderSettings=function(){
 renderSettings48();
 const box=$('settings');if(!box)return;
 [...box.querySelectorAll('.meta')].forEach(el=>{
  if((el.textContent||'').includes('콕매치 v48'))el.textContent='콕매치 v49 · 스마트폰·폴드·태블릿 반응형 최적화';
 });
 applyViewport49();
};
let resizeTimer49=0;
addEventListener('resize',()=>{clearTimeout(resizeTimer49);resizeTimer49=setTimeout(applyViewport49,70)},{passive:true});
addEventListener('orientationchange',()=>setTimeout(applyViewport49,140),{passive:true});
if(window.visualViewport)visualViewport.addEventListener('resize',()=>{clearTimeout(resizeTimer49);resizeTimer49=setTimeout(applyViewport49,70)},{passive:true});
if(location.pathname.startsWith('/launch/v49'))history.replaceState(null,'','/?loaded=49');
applyViewport49();
if(me)renderAll();
})();

/* migrated into v6.0: app-v50.js */
(()=>{
const roleBadge49=roleBadge;
const ageTag49=ageTag;

function shuttleSvg50(kind){
 const commonHead='<ellipse cx="9" cy="3.2" rx="4" ry="2.2" fill="#f7f4ec" stroke="#6d6253" stroke-width=".7"/><rect x="6.2" y="4.8" width="5.6" height="2.1" rx="1" fill="#d9d2c4" stroke="#756b5d" stroke-width=".55"/>';
 if(kind==='global')return `<svg viewBox="0 0 18 22" aria-hidden="true">${commonHead}<path d="M6.4 6.5 1.5 19.5h3.1L8 6.6z" fill="#ff3b5c"/><path d="M7.6 6.4 5 20h3L9 6.4z" fill="#ffb000"/><path d="M9 6.4 8 20h3L10.4 6.4z" fill="#20c85a"/><path d="M10.3 6.4 11 20h3L11.6 6.5z" fill="#218cff"/><path d="M11.5 6.5 14 19.5h2.5L12.6 6.6z" fill="#a03cff"/><path d="M3.1 16.4c3.7-1.2 8.2-1.2 12 0" fill="none" stroke="#fff" stroke-opacity=".78" stroke-width=".9"/><path d="M7 8.2c1.5-.7 3-.7 4.3 0" fill="none" stroke="#fff" stroke-opacity=".82" stroke-width=".75" stroke-linecap="round"/></svg>`;
 if(kind==='manager')return `<svg viewBox="0 0 18 22" aria-hidden="true">${commonHead}<path d="M6.3 6.4 1.8 19.5h3L8 6.5z" fill="#d99700"/><path d="M7.6 6.4 5 20h3L9 6.4z" fill="#f2b400"/><path d="M9 6.4 8 20h3L10.4 6.4z" fill="#ffd84d"/><path d="M10.3 6.4 11 20h3L11.6 6.5z" fill="#f0ad00"/><path d="M11.5 6.5 14 19.5h2.2L12.7 6.5z" fill="#c98900"/><path d="M3 16.2c3.9-1.1 8.2-1.1 12.2 0" fill="none" stroke="#fff9d1" stroke-opacity=".9" stroke-width=".9"/><path d="M7.1 8c1.4-.65 2.8-.65 4.2 0" fill="none" stroke="#fff" stroke-opacity=".86" stroke-width=".75" stroke-linecap="round"/></svg>`;
 if(kind==='organizer')return `<svg viewBox="0 0 18 22" aria-hidden="true">${commonHead}<path d="M6.3 6.4 1.8 19.5h3L8 6.5z" fill="#aeb4bb"/><path d="M7.6 6.4 5 20h3L9 6.4z" fill="#c9ced3"/><path d="M9 6.4 8 20h3L10.4 6.4z" fill="#b8bec4"/><path d="M10.3 6.4 11 20h3L11.6 6.5z" fill="#d0d4d8"/><path d="M11.5 6.5 14 19.5h2.2L12.7 6.5z" fill="#9da4ab"/><path d="M3 16.3c4-1 8.2-1 12.2 0" fill="none" stroke="#858c93" stroke-width=".72"/></svg>`;
 return `<svg viewBox="0 0 18 22" aria-hidden="true">${commonHead}<path d="M6.3 6.4 1.8 19.5h3L8 6.5z" fill="#9b5c32"/><path d="M7.6 6.4 5 20h3L9 6.4z" fill="#b66f3f"/><path d="M9 6.4 8 20h3L10.4 6.4z" fill="#a96339"/><path d="M10.3 6.4 11 20h3L11.6 6.5z" fill="#c17a48"/><path d="M11.5 6.5 14 19.5h2.2L12.7 6.5z" fill="#8f512d"/><path d="M3 16.3c4-1 8.2-1 12.2 0" fill="none" stroke="#744326" stroke-width=".72"/></svg>`;
}
function shuttleBadge50(kind,label){
 const glossy=kind==='global'||kind==='manager';
 return `<span class="roleShuttle50 role-${kind}50${glossy?' glossy50':' matte50'}" title="${esc(label)}" aria-label="${esc(label)}">${shuttleSvg50(kind)}</span>`;
}
function canSeeGlobal50(){const mode=String(S?.adminBadgeVisibility||'all');if(me?.globalAdmin)return true;if(mode==='all')return true;if(mode==='staff')return me?.role==='manager'||me?.role==='organizer';return false}
roleBadge=function(m){
 const r=roleOf(m),prior=roleBadge49(m);
 const globalLike=r==='admin'||(me?.globalAdmin&&m?.name===me.displayName);
 if(globalLike){if(!canSeeGlobal50())return '';return shuttleBadge50('global','개발자')}
 if(r==='manager')return shuttleBadge50('manager','모임장');
 if(r==='organizer')return shuttleBadge50('organizer','운영진');
 if(isTemp(m))return shuttleBadge50('temp','임시편성자');
 return prior;
};

ageTag=function(m){
 const c=String(m?.cls||'C').trim().toUpperCase();
 const safe=['A','B','C','D','E'].includes(c)?c:'C';
 return `<span class="tag gradeBadge50 grade-${safe.toLowerCase()}50">${esc(m?.age||'30')}${esc(safe)}</span>`;
};

const renderSettings49=renderSettings;
renderSettings=function(){
 renderSettings49();
 const box=$('settings');if(!box)return;
 [...box.querySelectorAll('.meta')].forEach(el=>{
  if((el.textContent||'').includes('콕매치 v49'))el.textContent='콕매치 v50 · 급수 컬러 · 셔틀콕 역할 아이콘';
 });
};

if(location.pathname.startsWith('/launch/v50'))history.replaceState(null,'','/?loaded=50');
if(me)renderAll();
})();

/* migrated into v6.0: app-v51.js */
(()=>{
let shuttleSeq51=0;

function canSeeGlobal51(){
 const mode=String(S?.adminBadgeVisibility||'all');
 if(me?.globalAdmin)return true;
 if(mode==='all')return true;
 if(mode==='staff')return me?.role==='manager'||me?.role==='organizer';
 return false;
}

function shuttleSvg51(kind){
 const uid=`k51_${kind}_${++shuttleSeq51}`;
 const isGloss=kind==='global'||kind==='manager';
 const palette={
  manager:['#8F5A00','#D89A00','#FFD34E','#FFF0A6'],
  organizer:['#9298A1','#B9BEC6','#D1D5DA','#777F89'],
  temp:['#87502E','#A96238','#C47A49','#704027']
 };
 const defs=isGloss?`<defs>
  <linearGradient id="${uid}_gold" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#8D5900"/><stop offset=".36" stop-color="#D89A00"/><stop offset=".63" stop-color="#FFE070"/><stop offset=".82" stop-color="#F4B719"/><stop offset="1" stop-color="#9A6300"/></linearGradient>
  <radialGradient id="${uid}_cork" cx="35%" cy="28%" r="78%"><stop offset="0" stop-color="#FFFDF8"/><stop offset=".58" stop-color="#F1E7D2"/><stop offset="1" stop-color="#CDBB98"/></radialGradient>
 </defs>`:`<defs><radialGradient id="${uid}_cork" cx="35%" cy="28%" r="78%"><stop offset="0" stop-color="#FFFDF8"/><stop offset=".6" stop-color="#EEE3CE"/><stop offset="1" stop-color="#C7B48F"/></radialGradient></defs>`;
 const cork=`<g>
  <ellipse cx="4.65" cy="18.95" rx="3.15" ry="2.6" transform="rotate(-38 4.65 18.95)" fill="url(#${uid}_cork)" stroke="#756C60" stroke-width=".65"/>
  <path d="M6.35 16.48 9.15 18.18" stroke="#72685C" stroke-width="2.2" stroke-linecap="round"/>
  <path d="M6.55 16.2 9.28 17.9" stroke="#E8DDC9" stroke-width="1.15" stroke-linecap="round"/>
 </g>`;
 const frame=`<path d="M8.05 15.55 15.4 3.35M8.65 16.05 18.5 4.25M9.2 16.55 21.35 7.15" fill="none" stroke="#5F5B56" stroke-opacity=".55" stroke-width=".56" stroke-linecap="round"/>
  <path d="M8.05 15.55 9.25 16.45 10.1 17.05" fill="none" stroke="#6B6258" stroke-width=".65" stroke-linecap="round"/>`;
 if(kind==='global'){
  return `<svg viewBox="0 0 24 24" role="img" aria-hidden="true">${defs}
   <path d="M7.55 15.55 9.15 16.32 16.1 3.1 13.75 3.65Z" fill="#FF3D67" stroke="#7B2342" stroke-width=".35"/>
   <path d="M8.05 15.75 9.62 16.45 18.45 4.05 16.15 3.15Z" fill="#FFB000" stroke="#8A6100" stroke-width=".35"/>
   <path d="M8.55 16.05 10 16.7 20.35 5.65 18.45 4.05Z" fill="#20C85A" stroke="#126B36" stroke-width=".35"/>
   <path d="M8.95 16.35 10.2 17.05 22 8.15 20.35 5.65Z" fill="#2387FF" stroke="#185DA9" stroke-width=".35"/>
   <path d="M9.35 16.6 10.45 17.25 22.45 10.75 22 8.15Z" fill="#9A45F5" stroke="#6730A8" stroke-width=".35"/>
   <path d="M9.1 15.2 17.4 4.55M9.8 16.1 20.9 7.15" stroke="#FFF" stroke-opacity=".76" stroke-width=".7" stroke-linecap="round"/>
   ${frame}${cork}</svg>`;
 }
 const p=palette[kind]||palette.temp;
 const featherFill=kind==='manager'?`url(#${uid}_gold)`:p[1];
 const secondary=kind==='manager'?`url(#${uid}_gold)`:p[2];
 const dark=kind==='manager'?'#8A5A00':p[3];
 const shine=kind==='manager'?`<path d="M9.05 15.2 17.2 4.8M9.72 15.85 20.4 7.15" stroke="#FFF6C6" stroke-opacity=".82" stroke-width=".68" stroke-linecap="round"/>`:'';
 return `<svg viewBox="0 0 24 24" role="img" aria-hidden="true">${defs}
  <path d="M7.55 15.55 9.18 16.35 16.1 3.2 13.7 3.7Z" fill="${featherFill}" stroke="${dark}" stroke-width=".38"/>
  <path d="M8.05 15.82 9.66 16.55 19.1 4.25 16.1 3.2Z" fill="${secondary}" stroke="${dark}" stroke-width=".38"/>
  <path d="M8.55 16.12 10.02 16.82 21.15 6.35 19.1 4.25Z" fill="${featherFill}" stroke="${dark}" stroke-width=".38"/>
  <path d="M8.95 16.42 10.25 17.08 22.15 9.2 21.15 6.35Z" fill="${secondary}" stroke="${dark}" stroke-width=".38"/>
  ${shine}${frame}${cork}</svg>`;
}

function shuttleBadge51(kind,label){
 const glossy=kind==='global'||kind==='manager';
 return `<span class="roleShuttle51 role-${kind}51 ${glossy?'glossy51':'matte51'}" title="${esc(label)}" aria-label="${esc(label)}">${shuttleSvg51(kind)}</span>`;
}

roleBadge=function(m){
 const r=roleOf(m);
 const globalLike=r==='admin'||(me?.globalAdmin&&m?.name===me.displayName);
 if(globalLike){
  if(!canSeeGlobal51())return '';
  return shuttleBadge51('global','개발자');
 }
 if(r==='manager')return shuttleBadge51('manager','모임장');
 if(r==='organizer')return shuttleBadge51('organizer','운영진');
 if(isTemp(m))return shuttleBadge51('temp','임시편성자');
 return '';
};

const renderSettings50=renderSettings;
renderSettings=function(){
 renderSettings50();
 const box=$('settings');if(!box)return;
 [...box.querySelectorAll('.meta')].forEach(el=>{
  if((el.textContent||'').includes('콕매치 v50'))el.textContent='콕매치 v51 · 셔틀콕 아이콘 리디자인 · 일반 배지 제거';
 });
};

if(location.pathname.startsWith('/launch/v51'))history.replaceState(null,'','/?loaded=51');
if(me)renderAll();
})();

/* migrated into v6.0: app-v52.js */
(()=>{
let shuttleSeq52=0;

function canSeeGlobal52(){
 const mode=String(S?.adminBadgeVisibility||'all');
 if(me?.globalAdmin)return true;
 if(mode==='all')return true;
 if(mode==='staff')return me?.role==='manager'||me?.role==='organizer';
 return false;
}

function shuttleSvg52(kind){
 const uid=`k52_${kind}_${++shuttleSeq52}`;
 const glossy=kind==='global'||kind==='manager';
 const defs=`<defs>
  <radialGradient id="${uid}_cork" cx="34%" cy="28%" r="78%"><stop offset="0" stop-color="#fffef9"/><stop offset=".55" stop-color="#f1e4ca"/><stop offset="1" stop-color="#c8ae80"/></radialGradient>
  <linearGradient id="${uid}_gold" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#8c5700"/><stop offset=".34" stop-color="#d79500"/><stop offset=".58" stop-color="#ffe173"/><stop offset=".78" stop-color="#f2b315"/><stop offset="1" stop-color="#935e00"/></linearGradient>
 </defs>`;
 const cork=`<g>
  <ellipse cx="4.9" cy="18.55" rx="3.65" ry="3.0" transform="rotate(-39 4.9 18.55)" fill="url(#${uid}_cork)" stroke="#746858" stroke-width=".72"/>
  <path d="M7.2 15.9 9.5 17.35" stroke="#766b5c" stroke-width="2.35" stroke-linecap="round"/>
  <path d="M7.3 15.65 9.55 17.08" stroke="#efe2ca" stroke-width="1.18" stroke-linecap="round"/>
 </g>`;
 const ribs=`<path d="M8.6 15.75 15.3 3.55M9.2 16.15 18.3 4.35M9.72 16.52 21.05 6.3" fill="none" stroke="#5d5954" stroke-opacity=".58" stroke-width=".58" stroke-linecap="round"/>
 <path d="M8.15 14.15c3.15 1.15 6.05 1.4 9.35.8" fill="none" stroke="#5d5954" stroke-opacity=".46" stroke-width=".58" stroke-linecap="round"/>`;
 if(kind==='global'){
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${defs}
   <path d="M7.75 15.05C9.25 10.3 11.05 6.15 13.55 2.95L16 3.35C15.3 7.45 13.45 12.05 9.3 16.2Z" fill="#ff3d66" stroke="#7b2341" stroke-width=".34"/>
   <path d="M8.25 15.42C10.7 10.55 13.25 6.3 16 3.35L18.6 4.35C17.25 8.25 14.25 12.8 9.72 16.55Z" fill="#ffb000" stroke="#8a6100" stroke-width=".34"/>
   <path d="M8.75 15.8C12.1 11.4 15.55 7.4 18.6 4.35L20.55 6.2C18.75 9.6 15.2 13.35 10.05 16.82Z" fill="#20c85a" stroke="#126b36" stroke-width=".34"/>
   <path d="M9.2 16.1C13.55 12.5 17.8 9.15 20.55 6.2L22.15 8.7C19.8 11.55 15.75 14.45 10.28 17.05Z" fill="#2387ff" stroke="#185da9" stroke-width=".34"/>
   <path d="M9.55 16.35C14.45 13.6 19.05 11.05 22.15 8.7L22.45 11.55C19.55 13.7 15.7 15.75 10.45 17.18Z" fill="#9a45f5" stroke="#6730a8" stroke-width=".34"/>
   <path d="M8.95 14.5C12.2 11.55 15.4 7.35 17.4 4.35M9.7 15.55C13.9 13 18.05 9.25 20.55 6.8" fill="none" stroke="#fff" stroke-opacity=".78" stroke-width=".78" stroke-linecap="round"/>
   ${ribs}${cork}</svg>`;
 }
 if(kind==='manager'){
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${defs}
   <path d="M7.75 15.05C9.3 10.2 11.3 6.05 13.7 3L16.05 3.35C15.35 7.5 13.6 12.1 9.3 16.2Z" fill="url(#${uid}_gold)" stroke="#835400" stroke-width=".38"/>
   <path d="M8.25 15.45C10.7 10.55 13.3 6.25 16.05 3.35L18.7 4.35C17.25 8.25 14.3 12.85 9.72 16.55Z" fill="url(#${uid}_gold)" stroke="#835400" stroke-width=".38"/>
   <path d="M8.75 15.82C12.15 11.35 15.55 7.45 18.7 4.35L20.65 6.25C18.75 9.65 15.25 13.4 10.05 16.82Z" fill="url(#${uid}_gold)" stroke="#835400" stroke-width=".38"/>
   <path d="M9.2 16.1C13.55 12.55 17.85 9.2 20.65 6.25L22.15 8.75C19.75 11.55 15.8 14.45 10.3 17.05Z" fill="url(#${uid}_gold)" stroke="#835400" stroke-width=".38"/>
   <path d="M9.05 14.55C12.25 11.55 15.45 7.35 17.45 4.45M9.75 15.58C13.9 13 18.05 9.3 20.55 6.9" fill="none" stroke="#fff7cf" stroke-opacity=".88" stroke-width=".78" stroke-linecap="round"/>
   ${ribs}${cork}</svg>`;
 }
 const colors=kind==='organizer'
  ?{a:'#a5abb2',b:'#c4c9ce',c:'#d8dce0',edge:'#747b83'}
  :{a:'#95552f',b:'#b96d3e',c:'#c98251',edge:'#704027'};
 return `<svg viewBox="0 0 24 24" aria-hidden="true">${defs}
  <path d="M7.75 15.05C9.3 10.2 11.25 6.05 13.7 3L16.05 3.35C15.35 7.5 13.55 12.1 9.3 16.2Z" fill="${colors.a}" stroke="${colors.edge}" stroke-width=".4"/>
  <path d="M8.25 15.45C10.7 10.55 13.3 6.25 16.05 3.35L18.7 4.35C17.25 8.25 14.3 12.85 9.72 16.55Z" fill="${colors.b}" stroke="${colors.edge}" stroke-width=".4"/>
  <path d="M8.75 15.82C12.15 11.35 15.55 7.45 18.7 4.35L20.65 6.25C18.75 9.65 15.25 13.4 10.05 16.82Z" fill="${colors.c}" stroke="${colors.edge}" stroke-width=".4"/>
  <path d="M9.2 16.1C13.55 12.55 17.85 9.2 20.65 6.25L22.15 8.75C19.75 11.55 15.8 14.45 10.3 17.05Z" fill="${colors.b}" stroke="${colors.edge}" stroke-width=".4"/>
  ${ribs}${cork}</svg>`;
}

function shuttleBadge52(kind,label){
 const glossy=kind==='global'||kind==='manager';
 return `<span class="roleShuttle52 role-${kind}52 ${glossy?'glossy52':'matte52'}" title="${esc(label)}" aria-label="${esc(label)}">${shuttleSvg52(kind)}</span>`;
}

roleBadge=function(m){
 const r=roleOf(m);
 const globalLike=r==='admin'||(me?.globalAdmin&&m?.name===me.displayName);
 if(globalLike){if(!canSeeGlobal52())return '';return shuttleBadge52('global','개발자')}
 if(r==='manager')return shuttleBadge52('manager','모임장');
 if(r==='organizer')return shuttleBadge52('organizer','운영진');
 if(isTemp(m))return shuttleBadge52('temp','임시편성자');
 return '';
};

const renderSettings51=renderSettings;
renderSettings=function(){
 renderSettings51();const box=$('settings');if(!box)return;
 [...box.querySelectorAll('.meta')].forEach(el=>{if((el.textContent||'').includes('콕매치 v51'))el.textContent='콕매치 v52 · 통통한 셔틀콕 아이콘 리디자인'});
};

if(location.pathname.startsWith('/launch/v52'))history.replaceState(null,'','/?loaded=52');
if(me)renderAll();
})();

/* migrated into v6.0: app-v53.js */
(()=>{
function canSeeGlobal53(){
 const mode=String(S?.adminBadgeVisibility||'all');
 if(me?.globalAdmin)return true;
 if(mode==='all')return true;
 if(mode==='staff')return me?.role==='manager'||me?.role==='organizer';
 return false;
}

roleBadge=function(m){
 const r=roleOf(m);
 const globalLike=r==='admin'||(me?.globalAdmin&&m?.name===me.displayName);
 if(globalLike){
  if(!canSeeGlobal53())return '';
  return '<span class="roleBadge role-global">개발자</span>';
 }
 if(r==='manager')return '<span class="roleBadge role-manager">모임장</span>';
 if(r==='organizer')return '<span class="roleBadge role-organizer">운영진</span>';
 if(isTemp(m))return '<span class="roleBadge role-temp">임시편성자</span>';
 return '<span class="roleBadge role-member44">일반</span>';
};

function badge53(m){
 return m?.type==='guest'?'<span class="roleBadge guest45">게스트</span>':roleBadge(m);
}
function invite53(m){
 const v=m?.type==='guest'?String(m?.inviter||'').trim():'';
 return v?`<span class="inviteSub45">초대 ${esc(v)}</span>`:'';
}
function genderMark53(m){
 const female=m?.gender==='여';
 return `<span class="genderMark53 ${female?'female':'male'}" title="${female?'여':'남'}" aria-label="${female?'여성':'남성'}">●</span>`;
}
function compactName53(m,id,label='게임'){
 return `<div class="compactLine53"><span class="compactName53">${esc(m.name)}</span>${ageTag(m)}<span class="gamecnt">${label} ${dailyCount(id)}회</span>${badge53(m)}</div>`;
}

function pendingCard53(pg,i){
 const waited=Math.max(0,Math.floor((Date.now()-Number(pg.createdAt||Date.now()))/60000));
 const slots=Array.from({length:4},(_,idx)=>{
  const id=pg.players?.[idx],m=id?M(id):null;
  if(!m)return `<div class="pendingSlot emptySlot ${canGame()?'clickable':''}" ${canGame()?`onclick="openFillPending('${pg.id}')"`:''}>＋ 빈자리</div>`;
  const b=badge53(m);
  return `<div class="pendingSlot pendingSlot53 ${canGame()?'clickable hasX53':''}" ${canGame()?`onclick="openMoveMember('${pg.id}','${id}')"`:''}>${canGame()?`<button class="pendingX" onclick="event.stopPropagation();removePending('${pg.id}','${id}')">×</button>`:''}<div class="slotTop53"><span class="slotLabel">${idx<2?'A팀':'B팀'} ${idx%2+1}</span><span class="slotBadges53">${genderMark53(m)}${b}</span></div><div class="slotName slotName53"><span class="compactName53">${esc(m.name)}</span>${ageTag(m)}</div><div class="meta compactMeta53">게임 ${dailyCount(id)}회 · ${waitMins(m)}분 대기</div>${invite53(m)}</div>`;
 }).join('');
 return `<div class="card pendingCard pendingCard53"><div class="pendingHead"><b>편성대기 ${i+1}조 · ${pg.players?.length||0}/4명</b><div class="pendingTools">${canGame()?`<button class="miniBtn" ${i===0?'disabled':''} onclick="movePendingOrder('${pg.id}','up')">↑</button><button class="miniBtn" ${i===S.pendingGames.length-1?'disabled':''} onclick="movePendingOrder('${pg.id}','down')">↓</button>`:''}<span class="tag">${waited}분</span></div></div><div class="pendingGrid">${slots}</div><div class="pairSummary">${pairSummary(pg.players||[])}</div>${canGame()?`<div class="pendingActs"><button class="btn pri" ${(pg.players?.length||0)!==4?'disabled':''} onclick="openCourtStart('${pg.id}')">코트 선택 · 경기 시작</button><button class="btn ghost" onclick="cancelPending('${pg.id}')">편성 취소</button></div>`:''}</div>`;
}

renderQueue=function(){
 const box=$('queue');if(!box)return;
 try{
  const q=sortedQueue(),selected=new Set(draft.filter(Boolean));
  const composer=canGame()?`<div class="composer"><div class="composerTitle">새 게임 편성</div><div class="slots">${draft.map((id,i)=>{const m=id?M(id):null;return `<div class="slot ${m?'filled':''}"><div class="slotLabel">${i<2?'A팀':'B팀'} ${i%2+1}</div>${m?`<button class="slotX" onclick="draftRemove(${i})">×</button><div class="slotName slotName53">${esc(m.name)} ${ageTag(m)} ${badge53(m)}</div><div class="meta compactMeta53">게임 ${dailyCount(id)}회 · ${waitMins(m)}분 대기</div>${invite53(m)}`:'<div class="meta">개인 게임대기에서 선택</div>'}</div>`}).join('')}</div><div class="pairSummary">${pairSummary(draft.filter(Boolean))}</div><div class="composerActs"><button class="btn ghost" onclick="recommendDraft()">✨ 추천 구성</button><button class="btn pri" ${draft.filter(Boolean).length?'':'disabled'} onclick="registerDraft()">대기 등록</button></div></div>`:'';
  const personal=`<div class="subhead"><b>개인 게임대기</b><span class="tag">${q.length}명</span></div><div class="note">게임횟수가 적은 순서 → 같은 횟수면 대기시간이 긴 순서입니다.</div>${q.length?q.map((id,i)=>{const m=M(id);if(!m)return'';return `<div class="card queueCard queueCard53 ${selected.has(id)?'selected':''}" ${canGame()?`onclick="draftClick('${id}')"`:''}><div class="ord">${i+1}</div>${genderMark53(m)}<div class="queueInfo53"><div class="name queueMain47 compactLine53"><span class="compactName53">${esc(m.name)}</span>${ageTag(m)}<span class="gamecnt">게임 ${dailyCount(id)}회</span>${badge53(m)}</div><div class="meta compactMeta53">${waitMins(m)}분 대기</div>${invite53(m)}</div><b class="queueCheck53">${selected.has(id)?'✓':''}</b></div>`}).join(''):'<div class="empty">개인 게임대기 회원이 없습니다.</div>'}`;
  const pending=`<div class="subhead"><b>편성대기 현황</b><span class="tag">${S.pendingGames.length}조</span></div>${S.pendingGames.length?S.pendingGames.map(pendingCard53).join(''):'<div class="empty">편성대기 중인 조가 없습니다.</div>'}`;
  box.innerHTML=`<div class="title"><h2>게임대기</h2><span class="tag">${S.queue.length+S.pendingGames.reduce((n,g)=>n+(g.players?.length||0),0)}명</span></div>${composer}${personal}${pending}`;
  if(typeof decorateResponsive48==='function')decorateResponsive48();
 }catch(e){console.error('queue render v53',e);box.innerHTML=`<div class="title"><h2>게임대기</h2></div><div class="warn">게임대기 화면을 표시하는 중 오류가 발생했습니다.</div><button class="btn pri" onclick="refreshQueue47()">다시 불러오기</button>`}
};

playerLine=function(id){
 const m=M(id);if(!m)return'-';
 const inv=m?.type==='guest'&&String(m?.inviter||'').trim()?String(m.inviter).trim():'';
 return `<div class="p playingPlayer53"><div class="playingMain53"><span class="playingName53">${esc(m.name)}</span>${ageTag(m)}${badge53(m)}</div><div class="meta playingMeta53">게임 ${dailyCount(id)}회${inv?` · 초대 ${esc(inv)}`:''}</div></div>`;
};

const renderSettings52=renderSettings;
renderSettings=function(){
 renderSettings52();const box=$('settings');if(!box)return;
 [...box.querySelectorAll('.meta')].forEach(el=>{if((el.textContent||'').includes('콕매치 v52'))el.textContent='콕매치 v53 · 역할 배지 복원 · 성별표시/레이아웃 개선'});
};

if(location.pathname.startsWith('/launch/v53'))history.replaceState(null,'','/?loaded=53');
if(me)renderAll();
})();

/* migrated into v6.0: app-v54.js */
(()=>{
function canSeeGlobal54(){
 const mode=String(S?.adminBadgeVisibility||'all');
 if(me?.globalAdmin)return true;
 if(mode==='all')return true;
 if(mode==='staff')return me?.role==='manager'||me?.role==='organizer';
 return false;
}

function badge54(m){
 const r=roleOf(m);
 const globalLike=r==='admin'||(me?.globalAdmin&&m?.name===me.displayName);
 if(m?.type==='guest')return '<span class="roleBadge guest45">게스트</span>';
 if(globalLike){if(!canSeeGlobal54())return '';return '<span class="roleBadge role-global">개발자</span>'}
 if(r==='manager')return '<span class="roleBadge role-manager">모임장</span>';
 if(r==='organizer')return '<span class="roleBadge role-organizer">운영진</span>';
 if(isTemp(m))return '<span class="roleBadge role-temp">임시편성자</span>';
 return '<span class="roleBadge role-member44">일반</span>';
}

function genderPerson54(m,compact=false){
 const female=m?.gender==='여';
 const label=female?'여성':'남성';
 return `<span class="genderPerson54 ${female?'female':'male'} ${compact?'compact54':''}" title="${label}" aria-label="${label}"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="7" r="4"></circle><path d="M4.5 21c.5-5 3.2-8 7.5-8s7 3 7.5 8z"></path></svg></span>`;
}

function inviteReserve54(m){
 const v=m?.type==='guest'?String(m?.inviter||'').trim():'';
 return `<span class="inviteReserve54${v?' hasInvite54':''}">${v?`초대 ${esc(v)}`:'&nbsp;'}</span>`;
}

function pendingCard54(pg,i){
 const waited=Math.max(0,Math.floor((Date.now()-Number(pg.createdAt||Date.now()))/60000));
 const slots=Array.from({length:4},(_,idx)=>{
  const id=pg.players?.[idx],m=id?M(id):null;
  if(!m)return `<div class="pendingSlot emptySlot pendingEmpty54 ${canGame()?'clickable':''}" ${canGame()?`onclick="openFillPending('${pg.id}')"`:''}><span>＋ 빈자리</span><span class="inviteReserve54">&nbsp;</span></div>`;
  const b=badge54(m);
  return `<div class="pendingSlot pendingSlot53 pendingSlot54 ${canGame()?'clickable hasX53':''}" ${canGame()?`onclick="openMoveMember('${pg.id}','${id}')"`:''}>${canGame()?`<button class="pendingX" onclick="event.stopPropagation();removePending('${pg.id}','${id}')">×</button>`:''}<div class="slotTop53"><span class="slotLabel">${idx<2?'A팀':'B팀'} ${idx%2+1}</span><span class="slotBadges53 slotBadges54">${genderPerson54(m,true)}${b}</span></div><div class="slotName slotName53"><span class="compactName53">${esc(m.name)}</span>${ageTag(m)}</div><div class="meta compactMeta53">게임 ${dailyCount(id)}회 · ${waitMins(m)}분 대기</div>${inviteReserve54(m)}</div>`;
 }).join('');
 return `<div class="card pendingCard pendingCard53 pendingCard54"><div class="pendingHead"><b>편성대기 ${i+1}조 · ${pg.players?.length||0}/4명</b><div class="pendingTools">${canGame()?`<button class="miniBtn" ${i===0?'disabled':''} onclick="movePendingOrder('${pg.id}','up')">↑</button><button class="miniBtn" ${i===S.pendingGames.length-1?'disabled':''} onclick="movePendingOrder('${pg.id}','down')">↓</button>`:''}<span class="tag">${waited}분</span></div></div><div class="pendingGrid">${slots}</div><div class="pairSummary">${pairSummary(pg.players||[])}</div>${canGame()?`<div class="pendingActs"><button class="btn pri" ${(pg.players?.length||0)!==4?'disabled':''} onclick="openCourtStart('${pg.id}')">코트 선택 · 경기 시작</button><button class="btn ghost" onclick="cancelPending('${pg.id}')">편성 취소</button></div>`:''}</div>`;
}

renderQueue=function(){
 const box=$('queue');if(!box)return;
 try{
  const q=sortedQueue(),selected=new Set(draft.filter(Boolean));
  const composer=canGame()?`<div class="composer composer54"><div class="composerTitle">새 게임 편성</div><div class="slots">${draft.map((id,i)=>{const m=id?M(id):null;return `<div class="slot slot54 ${m?'filled':''}"><div class="slotLabel">${i<2?'A팀':'B팀'} ${i%2+1}</div>${m?`<button class="slotX" onclick="draftRemove(${i})">×</button><div class="slotName slotName53"><span class="compactName53">${esc(m.name)}</span>${ageTag(m)}${badge54(m)}</div><div class="meta compactMeta53">게임 ${dailyCount(id)}회 · ${waitMins(m)}분 대기</div>${inviteReserve54(m)}`:`<div class="meta slotEmptyText54">개인 게임대기에서 선택</div><span class="inviteReserve54">&nbsp;</span>`}</div>`}).join('')}</div><div class="pairSummary">${pairSummary(draft.filter(Boolean))}</div><div class="composerActs"><button class="btn ghost" onclick="recommendDraft()">✨ 추천 구성</button><button class="btn pri" ${draft.filter(Boolean).length?'':'disabled'} onclick="registerDraft()">대기 등록</button></div></div>`:'';
  const personal=`<div class="subhead"><b>개인 게임대기</b><span class="tag">${q.length}명</span></div><div class="note">게임횟수가 적은 순서 → 같은 횟수면 대기시간이 긴 순서입니다.</div>${q.length?q.map((id,i)=>{const m=M(id);if(!m)return'';return `<div class="card queueCard queueCard53 queueCard54 ${selected.has(id)?'selected':''}" ${canGame()?`onclick="draftClick('${id}')"`:''}><div class="ord">${i+1}</div>${genderPerson54(m)}<div class="queueInfo53"><div class="name queueMain47 compactLine53"><span class="compactName53">${esc(m.name)}</span>${ageTag(m)}<span class="gamecnt">게임 ${dailyCount(id)}회</span>${badge54(m)}</div><div class="meta compactMeta53">${waitMins(m)}분 대기</div>${m?.type==='guest'&&String(m?.inviter||'').trim()?`<span class="inviteSub45">초대 ${esc(String(m.inviter).trim())}</span>`:''}</div><b class="queueCheck53">${selected.has(id)?'✓':''}</b></div>`}).join(''):'<div class="empty">개인 게임대기 회원이 없습니다.</div>'}`;
  const pending=`<div class="subhead"><b>편성대기 현황</b><span class="tag">${S.pendingGames.length}조</span></div>${S.pendingGames.length?S.pendingGames.map(pendingCard54).join(''):'<div class="empty">편성대기 중인 조가 없습니다.</div>'}`;
  box.innerHTML=`<div class="title"><h2>게임대기</h2><span class="tag">${S.queue.length+S.pendingGames.reduce((n,g)=>n+(g.players?.length||0),0)}명</span></div>${composer}${personal}${pending}`;
  if(typeof decorateResponsive48==='function')decorateResponsive48();
 }catch(e){console.error('queue render v54',e);box.innerHTML=`<div class="title"><h2>게임대기</h2></div><div class="warn">게임대기 화면을 표시하는 중 오류가 발생했습니다.</div><button class="btn pri" onclick="refreshQueue47()">다시 불러오기</button>`}
};

const renderSettings53=renderSettings;
renderSettings=function(){
 renderSettings53();const box=$('settings');if(!box)return;
 [...box.querySelectorAll('.meta')].forEach(el=>{if((el.textContent||'').includes('콕매치 v53'))el.textContent='콕매치 v54 · 사람형 성별 아이콘 · 편성카드 균형 · 게임중 좌측정렬'});
};

if(location.pathname.startsWith('/launch/v54'))history.replaceState(null,'','/?loaded=54');
if(me)renderAll();
})();

/* migrated into v6.0: app-v55.js */
(()=>{
function decorateQueue55(){
 const box=$('queue');if(!box)return;
 [...box.querySelectorAll('.queueCard54 .queueInfo53')].forEach(info=>{
  const inv=info.querySelector('.inviteSub45');
  if(inv){inv.classList.add('queueInviteReserve55');return}
  info.insertAdjacentHTML('beforeend','<span class="inviteSub45 queueInviteReserve55 queueInviteEmpty55">&nbsp;</span>');
 });
}

const renderQueue54=renderQueue;
renderQueue=function(){
 renderQueue54();
 decorateQueue55();
};

const renderSettings54=renderSettings;
renderSettings=function(){
 renderSettings54();const box=$('settings');if(!box)return;
 [...box.querySelectorAll('.meta')].forEach(el=>{
  if((el.textContent||'').includes('콕매치 v54'))el.textContent='콕매치 v55 · 대기카드 균형 · X버튼 중앙 · 게임중 레이아웃 개선';
 });
};

if(location.pathname.startsWith('/launch/v55'))history.replaceState(null,'','/?loaded=55');
if(me)renderAll();
})();

/* migrated into v6.0: app-v57.js */
(()=>{
function badge57(m){return m?.type==='guest'?'<span class="roleBadge guest45">게스트</span>':roleBadge(m)}
function genderPerson57(m,compact=true){
 const female=m?.gender==='여',label=female?'여성':'남성';
 return `<span class="genderPerson57 ${female?'female':'male'} ${compact?'compact57':''}" title="${label}" aria-label="${label}"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="7" r="4"></circle><path d="M4.5 21c.5-5 3.2-8 7.5-8s7 3 7.5 8z"></path></svg></span>`;
}

function decorateMembers57(){
 const box=$('members');if(!box)return;
 [...box.querySelectorAll('.memberCard')].forEach(card=>card.classList.add('memberCard57'));
}

function decorateQueue57(){
 const box=$('queue');if(!box)return;
 [...box.querySelectorAll('.composer54 .slot54')].forEach((slot,i)=>{
  const id=Array.isArray(draft)?draft[i]:null,m=id?M(id):null;
  if(!m||slot.querySelector('.slotHeader57'))return;
  const label=slot.querySelector(':scope > .slotLabel');
  const role=slot.querySelector('.slotName53 .roleBadge');
  const roleHtml=role?role.outerHTML:'';
  role?.remove();
  if(label){
   const header=document.createElement('div');header.className='slotHeader57';
   header.innerHTML=`<span class="slotLabel">${label.textContent||''}</span><span class="slotRight57"><span class="roleZone57">${roleHtml}</span><span class="genderZone57">${genderPerson57(m,true)}</span></span>`;
   label.replaceWith(header);
  }
 });
 [...box.querySelectorAll('.pendingSlot54:not(.emptySlot) .slotBadges54')].forEach(z=>z.classList.add('fixedZones57'));
}

const renderMembers56=renderMembers;
renderMembers=function(){renderMembers56();decorateMembers57()};
const renderQueue56=renderQueue;
renderQueue=function(){renderQueue56();decorateQueue57()};

playerLine=function(id){
 const m=M(id);if(!m)return'-';
 const inv=m?.type==='guest'&&String(m?.inviter||'').trim()?String(m.inviter).trim():'';
 return `<div class="p playingPlayer53 playingPlayer57"><div class="playingMain53"><span class="playingName53">${esc(m.name)}</span>${ageTag(m)}<span class="playingRole57">${badge57(m)}</span><span class="playingGender57">${genderPerson57(m,true)}</span></div><div class="meta playingMeta53">게임 ${dailyCount(id)}회${inv?` · 초대 ${esc(inv)}`:''}</div></div>`;
};

const renderSettings56=renderSettings;
renderSettings=function(){
 renderSettings56();const box=$('settings');if(!box)return;
 [...box.querySelectorAll('.meta')].forEach(el=>{if((el.textContent||'').includes('콕매치 v56'))el.textContent='콕매치 v57 · 회원명부 공간개선 · 성별/배지 고정정렬'});
};

if(location.pathname.startsWith('/launch/v57'))history.replaceState(null,'','/?loaded=57');
if(me)renderAll();
})();

/* migrated into v6.0: app-v58.js */
(()=>{
function badge58(m){return m?.type==='guest'?'<span class="roleBadge guest45">게스트</span>':roleBadge(m)}
function genderName58(m){
 const female=m?.gender==='여',label=female?'여성':'남성';
 return `<span class="nameGender58 ${female?'female':'male'}" title="${label}" aria-label="${label}"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="7" r="4"></circle><path d="M4.5 21c.5-5 3.2-8 7.5-8s7 3 7.5 8z"></path></svg></span>`;
}

function decorateQueue58(){
 const box=$('queue');if(!box)return;
 const selected=Array.isArray(draft)?draft:[];
 [...box.querySelectorAll('.composer54 .slot54')].forEach((slot,i)=>{
  const id=selected[i],m=id?M(id):null;if(!m)return;
  const oldHeader=slot.querySelector('.slotHeader57');
  if(oldHeader&&!slot.querySelector('.slotHeader58')){
   const label=oldHeader.querySelector('.slotLabel')?.textContent||'';
   const role=oldHeader.querySelector('.roleBadge')?.outerHTML||'';
   const h=document.createElement('div');h.className='slotHeader58';
   h.innerHTML=`<span class="slotLabel">${esc(label)}</span><span class="slotRoleRight58">${role}</span>`;
   oldHeader.replaceWith(h);
  }
  const name=slot.querySelector('.slotName53');
  if(name&&!name.querySelector('.nameGender58'))name.insertAdjacentHTML('afterbegin',genderName58(m));
 });

 [...box.querySelectorAll('.pendingCard54')].forEach((card,gi)=>{
  const pg=S.pendingGames?.[gi];if(!pg)return;
  [...card.querySelectorAll('.pendingSlot54:not(.emptySlot)')].forEach((slot,pi)=>{
   const id=pg.players?.[pi],m=id?M(id):null;if(!m)return;
   const badges=slot.querySelector('.slotBadges54');
   if(badges){
    badges.querySelector('.genderPerson54,.genderPerson57')?.remove();
    badges.classList.remove('fixedZones57');badges.classList.add('slotBadges58');
   }
   const name=slot.querySelector('.slotName53');
   if(name&&!name.querySelector('.nameGender58'))name.insertAdjacentHTML('afterbegin',genderName58(m));
  });
 });
}

const renderQueue57=renderQueue;
renderQueue=function(){renderQueue57();decorateQueue58()};

playerLine=function(id){
 const m=M(id);if(!m)return'-';
 const inv=m?.type==='guest'&&String(m?.inviter||'').trim()?String(m.inviter).trim():'';
 return `<div class="p playingPlayer53 playingPlayer57"><div class="playingMain53 playingMain58"><span class="playingGender58">${genderName58(m)}</span><span class="playingName53">${esc(m.name)}</span>${ageTag(m)}<span class="playingRole58">${badge58(m)}</span></div><div class="meta playingMeta53">게임 ${dailyCount(id)}회${inv?` · 초대 ${esc(inv)}`:''}</div></div>`;
};

const renderSettings57=renderSettings;
renderSettings=function(){
 renderSettings57();const box=$('settings');if(!box)return;
 [...box.querySelectorAll('.meta')].forEach(el=>{if((el.textContent||'').includes('콕매치 v57'))el.textContent='콕매치 v58 · 아이폰 회원명부 복원 · 성별아이콘 이름앞 정렬'});
};

if(location.pathname.startsWith('/launch/v58'))history.replaceState(null,'','/?loaded=58');
if(me)renderAll();
})();

/* migrated into v6.0: app-v59.js */
(()=>{
const renderSettings58=renderSettings;
renderSettings=function(){
 renderSettings58();const box=$('settings');if(!box)return;
 [...box.querySelectorAll('.meta')].forEach(el=>{
  if((el.textContent||'').includes('콕매치 v58'))el.textContent='콕매치 v59 · 아이폰 회원명부 우측 제어영역 정리';
 });
};
if(location.pathname.startsWith('/launch/v59'))history.replaceState(null,'','/?loaded=59');
if(me)renderAll();
})();

/* migrated into v6.0: app-v60.js */
(()=>{
const V60_API='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-v60-api';
function actor60(){return me?.globalAdmin?'admin':me?.tempOrganizer?'temp':String(me?.role||'member')}
function canAttendance60(){return ['admin','manager','organizer','temp'].includes(actor60())}
function canMemberInfo60(){return ['admin','manager','organizer'].includes(actor60())}
function canTempAssign60(){return ['admin','manager','organizer'].includes(actor60())}
function canFinish60(){const mine=me?.memberId?M(me.memberId):null;return !!me&&(me.globalAdmin||!!mine&&mine.type!=='guest')}
function editable60(m){return canMemberInfo60()&&(roleOf(m)!=='admin'||!!me?.globalAdmin)}
function deletable60(m){return canMemberInfo60()&&roleOf(m)!=='admin'}
function roleOptions60(){return me?.globalAdmin||me?.role==='manager'?['member','organizer','manager']:[]}
async function v60Request(op,body={}){const r=await fetch(V60_API,{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+T},body:JSON.stringify({op,groupId:currentGroupId,...body}),cache:'no-store'});const x=await r.json().catch(()=>({}));if(!r.ok){if(r.status===401){reloginLatest();throw new Error('로그인이 만료되었습니다.')}throw new Error(x.error||'v60 작업에 실패했습니다.')}return x}
memberControls=function(m){const attendance=canAttendance60(),edit=editable60(m);let bs='';if(attendance&&m.state!=='playing'&&m.state!=='matched'){if(m.state!=='waiting')bs+=`<button class="btn enter" onclick="setOther('${m.id}','waiting')">입장</button>`;if(m.state!=='spectator')bs+=`<button class="btn watch" onclick="setOther('${m.id}','spectator')">관람</button>`;if(m.state!=='out')bs+=`<button class="btn danger" onclick="setOther('${m.id}','out')">퇴장</button>`}if(edit)bs+=`<button class="btn ghost" onclick="openEditMember('${m.id}')">수정</button>`;return `<div class="memberActions60"><div class="status">${stateLabel(m.state)}</div><div class="memberBtns">${bs}</div></div>`};
const renderMembers59=renderMembers;renderMembers=function(){renderMembers59();const box=$('members');if(!box)return;const note=box.querySelector('.note');if(note){const a=actor60();note.textContent=a==='admin'?'개발자는 모든 모임과 회원정보·역할·운영을 관리할 수 있습니다.':a==='manager'?'모임장는 현재 모임의 모든 회원정보·역할·입장상태·운영을 관리할 수 있습니다.':a==='organizer'?'운영진는 현재 모임의 회원정보 관리, 일반·게스트 관리, 임시편성자 지정과 게임운영을 할 수 있습니다.':a==='temp'?'임시편성자는 회원정보 수정 없이 입장상태와 게임편성·코트운영만 할 수 있습니다.':'회원정보와 현재 참가상태를 확인할 수 있습니다.'}};
openEditMember=function(id){const m=M(id);if(!m)return;if(!editable60(m))return alert('이 회원정보를 수정할 권한이 없습니다.');editMemberId=id;openMemberModal(m)};openAddMember=function(){if(!canMemberInfo60())return alert('회원등록 권한이 없습니다.');editMemberId=null;openMemberModal(null)};
openMemberModal=function(m){const add=!m,r=roleOf(m),opts=roleOptions60(),isAdmin=!add&&r==='admin',organizer=me?.role==='organizer'&&!me?.globalAdmin;const roleSelect=opts.length?`<div class="field"><label>역할</label><select id="fmRole" onchange="syncMember60()">${opts.map(x=>`<option value="${x}" ${(add?(x==='member'):r===x)?'selected':''}>${roleLabel(x)}</option>`).join('')}</select></div><div id="fmPinWrap" class="field ${r==='member'||add?'hide':''}"><label>${add?'역할 PIN':'새 역할 PIN (변경할 때만 입력)'}</label><input id="fmPin" type="tel" inputmode="numeric" maxlength="8" autocomplete="off" placeholder="숫자 4~8자리"></div>`:'';const typeLocked=organizer&&!add&&r!=='member';openModal(`<h3>${add?'회원등록':'회원 정보 수정'}</h3><div class="note">${organizer?'운영진는 회원 기본정보와 일반·게스트 구분을 관리할 수 있으며 관리자 역할은 변경할 수 없습니다.':'회원 기본정보·구분·역할을 관리합니다.'}</div><div class="field"><label>이름</label><input id="fmName" value="${esc(m?.name||'')}" ${isAdmin?'disabled':''}></div><div class="grid2"><div class="field"><label>출생연도</label><input id="fmYear" type="number" inputmode="numeric" value="${esc(m?.year||'')}"></div><div class="field"><label>성별</label><select id="fmGender"><option ${m?.gender!=='여'?'selected':''}>남</option><option ${m?.gender==='여'?'selected':''}>여</option></select></div><div class="field"><label>급수</label><select id="fmCls">${['A','B','C','D','E'].map(c=>`<option ${String(m?.cls||'C')===c?'selected':''}>${c}</option>`).join('')}</select></div><div class="field"><label>구분</label><select id="fmType" onchange="syncMember60()" ${isAdmin||typeLocked?'disabled':''}><option value="member" ${m?.type!=='guest'?'selected':''}>일반</option><option value="guest" ${m?.type==='guest'?'selected':''}>게스트</option></select></div></div>${roleSelect}<div id="fmInviterWrap60" class="field ${m?.type==='guest'?'':'hide'}"><label>초대인</label><input id="fmInviter60" value="${esc(m?.inviter||'')}" maxlength="40" placeholder="초대한 회원 이름"></div><div class="acts">${!add&&deletable60(m)?'<button class="btn danger" onclick="deleteMemberNow()">삭제</button>':''}<button class="btn ghost" onclick="closeModal()">취소</button><button class="btn pri" onclick="saveMemberNow()">${add?'등록':'저장'}</button></div>`);setTimeout(()=>syncMember60(),0)};
window.syncMember60=function(){const type=$('fmType')?.value||'member',role=$('fmRole');if(role&&type==='guest')role.value='member';if(role)role.disabled=type==='guest';const rr=role?.value||'member';$('fmPinWrap')?.classList.toggle('hide',rr==='member'||type==='guest');$('fmInviterWrap60')?.classList.toggle('hide',type!=='guest')};
saveMemberNow=async function(){const cur=editMemberId?M(editMemberId):null,organizer=me?.role==='organizer'&&!me?.globalAdmin;if(!canMemberInfo60())return alert('회원정보 관리 권한이 없습니다.');const type=$('fmType')?.value||(cur?.type||'member');const role=organizer?(cur?roleOf(cur):'member'):($('fmRole')?.value||(cur?roleOf(cur):'member'));const body={memberId:editMemberId||'',name:$('fmName')?.value.trim()||(cur?.name||''),year:Number($('fmYear')?.value),gender:$('fmGender')?.value||'남',cls:$('fmCls')?.value||'C',type,role,pin:$('fmPin')?.value.trim()||'',inviter:type==='guest'?($('fmInviter60')?.value.trim()||''):''};if(!body.name)return alert('이름을 입력해주세요.');if(type==='guest'&&!body.inviter)return alert('게스트의 초대인을 입력해주세요.');try{const x=await v60Request('member_save',body);S=x.data;normalizeClient();closeModal();renderAll()}catch(e){showError(e)}};
deleteMemberNow=async function(){const m=M(editMemberId);if(!m||!deletable60(m))return alert('이 회원을 삭제할 권한이 없습니다.');if(!confirm(`${m.name} 회원정보를 삭제하시겠습니까?`))return;try{const x=await v60Request('member_delete',{memberId:m.id});S=x.data;normalizeClient();closeModal();renderAll()}catch(e){showError(e)}};
const act59=act;act=async function(action,body={},opts={}){const routed=['set_temp','set_my_attendance','set_member_attendance','create_pending','remove_from_pending','add_to_pending','move_pending_order','cancel_pending','begin_game','finish_game','set_game_court','set_courts','set_court_name'];if(!routed.includes(action))return act59(action,body,opts);const x=await v60Request('action',{action,...body});if(x.data){S=x.data;normalizeClient();renderAll()}return x};
gameHtml=function(g){return `<div class="teams"><div class="team">${playerLine(g.players[0])}${playerLine(g.players[1])}</div><b>VS</b><div class="team">${playerLine(g.players[2])}${playerLine(g.players[3])}</div></div><div class="foot"><span class="meta">${new Date(g.startedAt).toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'})} 시작</span><div class="gameBtns">${canGame()?`<button class="btn ghost" onclick="openCourtChange('${g.id}')">코트변경</button>`:''}${canFinish60()?`<button class="btn danger" onclick="finishGameNow('${g.id}')">경기종료</button>`:''}</div></div>`};
const renderSettings59=renderSettings;renderSettings=function(){renderSettings59();const box=$('settings');if(!box)return;[...box.querySelectorAll(':scope > .card')].forEach(c=>{const t=c.textContent||'';if(t.includes('당일 임시편성자')||t.includes('다. 회원정보 전체 정리 초기화'))c.remove()});if(canTempAssign60()){const eligible=S.members.filter(m=>m.type!=='guest'&&roleOf(m)==='member'&&m.state!=='out'),versionCard=[...box.querySelectorAll(':scope > .card')].find(c=>(c.textContent||'').includes('프로그램 버전')),html=`<div class="card"><b>당일 임시편성자</b><div class="meta" style="margin:5px 0 10px">일반에게 오늘만 게임편성·입장상태·코트설정 권한을 부여합니다.</div>${eligible.map(m=>`<div class="between" style="padding:7px 0;border-bottom:1px solid #edf0f7"><span>${esc(m.name)} ${ageTag(m)}</span><button class="btn ${isTemp(m)?'danger':'ghost'}" onclick="toggleTemp('${m.id}',${!isTemp(m)})">${isTemp(m)?'해제':'임시 지정'}</button></div>`).join('')||'<div class="empty">지정 가능한 참석 회원이 없습니다.</div>'}</div>`;if(versionCard)versionCard.insertAdjacentHTML('beforebegin',html);else box.insertAdjacentHTML('beforeend',html)}if((me?.globalAdmin||me?.role==='manager')&&!box.querySelector('.rosterReset60')){const versionCard=[...box.querySelectorAll(':scope > .card')].find(c=>(c.textContent||'').includes('프로그램 버전')),html=`<div class="card rosterReset60"><b>회원정보 전체 정리 초기화</b><div class="warn" style="margin:7px 0 10px;line-height:1.6">현재 모임에서 개발자·모임장를 남기고 운영진·일반·게스트와 게임·대기·누적기록을 정리합니다.</div><button class="btn danger" style="width:100%" onclick="resetRoster60()">현재 모임 회원정보 전체 정리</button><div class="meta" style="margin-top:7px">권한: 모임장 · 개발자</div></div>`;if(versionCard)versionCard.insertAdjacentHTML('beforebegin',html);else box.insertAdjacentHTML('beforeend',html)}[...box.querySelectorAll('.meta')].forEach(el=>{if((el.textContent||'').includes('콕매치 v59'))el.textContent='콕매치 v60 · 역할별 권한체계 재정비 · 전체회원 상태관리'})};
window.resetRoster60=async function(){if(!(me?.globalAdmin||me?.role==='manager'))return alert('모임장 이상 권한이 필요합니다.');const pin=prompt(`${me?.globalAdmin?'개발자':'모임장'} PIN을 입력해주세요.`);if(pin===null||!pin.trim())return;if(!confirm(`${group?.name||'현재 모임'}의 회원정보를 전체 정리하시겠습니까?\n개발자와 모임장는 유지됩니다.`))return;try{const x=await v60Request('reset_roster',{pin:pin.trim()});S=x.data;normalizeClient();renderAll();alert(`회원정보 정리 완료 · 삭제 ${Number(x.removedCount)||0}명`)}catch(e){showError(e)}};
if(location.pathname.startsWith('/launch/v60'))history.replaceState(null,'','/?loaded=60');if(me)renderAll();
})();

/* migrated into v6.0: app-v61.js */
(()=>{
function actor61(){return me?.globalAdmin?'admin':me?.tempOrganizer?'temp':String(me?.role||'member')}
function canAttendance61(){return ['admin','manager','organizer','temp'].includes(actor61())}
function canEdit61(m){return ['admin','manager','organizer'].includes(actor61())&&(roleOf(m)!=='admin'||!!me?.globalAdmin)}
function slot61(kind,html){return `<span class="memberBtnSlot61 memberBtn-${kind}61">${html||'<span class="memberBtnPlaceholder61" aria-hidden="true"></span>'}</span>`}

/* Four permanent action slots: entry / spectate / leave / edit. Missing buttons leave their own blank slot. */
memberControls=function(m){
 const attendance=canAttendance61()&&m.state!=='playing'&&m.state!=='matched',edit=canEdit61(m);
 const enter=attendance&&m.state!=='waiting'?`<button class="btn enter" onclick="setOther('${m.id}','waiting')">입장</button>`:'';
 const watch=attendance&&m.state!=='spectator'?`<button class="btn watch" onclick="setOther('${m.id}','spectator')">관람</button>`:'';
 const leave=attendance&&m.state!=='out'?`<button class="btn danger" onclick="setOther('${m.id}','out')">퇴장</button>`:'';
 const editBtn=edit?`<button class="btn ghost" onclick="openEditMember('${m.id}')">수정</button>`:'';
 return `<div class="memberActions60"><div class="status">${stateLabel(m.state)}</div><div class="memberBtns memberBtns61">${slot61('enter',enter)}${slot61('watch',watch)}${slot61('leave',leave)}${slot61('edit',editBtn)}</div></div>`;
};

const renderSettings60=renderSettings;
renderSettings=function(){
 renderSettings60();const box=$('settings');if(!box)return;
 [...box.querySelectorAll('.meta')].forEach(el=>{
  if((el.textContent||'').includes('콕매치 v60'))el.textContent='콕매치 v61 · 회원버튼 고정배치 · 가독성/코트높이 개선';
 });
};

if(location.pathname.startsWith('/launch/v61'))history.replaceState(null,'','/?loaded=61');
if(me)renderAll();
})();

/* migrated into v6.0: app-v62.js */
(()=>{
const renderSettings61=renderSettings;
renderSettings=function(){
 renderSettings61();const box=$('settings');if(!box)return;
 [...box.querySelectorAll('.meta')].forEach(el=>{
  if((el.textContent||'').includes('콕매치 v61'))el.textContent='콕매치 v62 · 회원정보 가로공간 확대 · 게임중 참가자 영역 확장';
 });
};
if(location.pathname.startsWith('/launch/v62'))history.replaceState(null,'','/?loaded=62');
if(me)renderAll();
})();

/* migrated into v6.0: app-v63.js */
(()=>{
const renderSettings62=renderSettings;
renderSettings=function(){
 renderSettings62();const box=$('settings');if(!box)return;
 [...box.querySelectorAll(':scope > .card')].forEach(card=>{
  if((card.textContent||'').includes('프로그램 버전'))card.classList.add('versionCard63');
 });
 [...box.querySelectorAll('.meta')].forEach(el=>{
  if((el.textContent||'').includes('콕매치 v62'))el.textContent='콕매치 v63 · 회원명부 제어영역 균형 · 운영본 배지 한줄 고정';
 });
};
if(location.pathname.startsWith('/launch/v63'))history.replaceState(null,'','/?loaded=63');
if(me)renderAll();
})();

/* migrated into v6.0: app-v64.js */
(()=>{
function actor64(){return me?.globalAdmin?'admin':me?.tempOrganizer?'temp':String(me?.role||'member')}
function canAttendance64(){return ['admin','manager','organizer','temp'].includes(actor64())}
function canEdit64(m){return ['admin','manager','organizer'].includes(actor64())&&(roleOf(m)!=='admin'||!!me?.globalAdmin)}
function slot64(kind,html){return `<span class="memberBtnSlot61 memberBtn-${kind}61">${html||'<span class="memberBtnPlaceholder61" aria-hidden="true"></span>'}</span>`}

/* Keep four semantic button slots, but move the divider to the first visible action. */
memberControls=function(m){
 const attendance=canAttendance64()&&m.state!=='playing'&&m.state!=='matched',edit=canEdit64(m);
 const actions=[
  attendance&&m.state!=='waiting'?`<button class="btn enter" onclick="setOther('${m.id}','waiting')">입장</button>`:'',
  attendance&&m.state!=='spectator'?`<button class="btn watch" onclick="setOther('${m.id}','spectator')">관람</button>`:'',
  attendance&&m.state!=='out'?`<button class="btn danger" onclick="setOther('${m.id}','out')">퇴장</button>`:'',
  edit?`<button class="btn ghost" onclick="openEditMember('${m.id}')">수정</button>`:''
 ];
 let lead=actions.findIndex(Boolean);if(lead<0)lead=0;
 return `<div class="memberActions60 memberActions64 lead${lead}64"><div class="status">${stateLabel(m.state)}</div><div class="memberBtns memberBtns61 memberBtns64">${slot64('enter',actions[0])}${slot64('watch',actions[1])}${slot64('leave',actions[2])}${slot64('edit',actions[3])}</div></div>`;
};

const renderSettings63=renderSettings;
renderSettings=function(){
 renderSettings63();const box=$('settings');if(!box)return;
 [...box.querySelectorAll('.meta')].forEach(el=>{
  if((el.textContent||'').includes('콕매치 v63'))el.textContent='콕매치 v64 · 회원명부 제어선 자동밀착';
 });
};

if(location.pathname.startsWith('/launch/v64'))history.replaceState(null,'','/?loaded=64');
if(me)renderAll();
})();

/* migrated into v6.0: app-v65.js */
(()=>{
function actor65(){return me?.globalAdmin?'admin':me?.tempOrganizer?'temp':String(me?.role||'member')}
function canAttendance65(){return ['admin','manager','organizer','temp'].includes(actor65())}
function canEdit65(m){return ['admin','manager','organizer'].includes(actor65())&&(roleOf(m)!=='admin'||!!me?.globalAdmin)}
function slot65(kind,html){return `<span class="memberBtnSlot65 memberBtn-${kind}65">${html||'<span class="memberBtnPlaceholder65" aria-hidden="true"></span>'}</span>`}

/* Exactly three control slots: two rotating attendance actions + fixed edit slot. */
memberControls=function(m){
 const attendance=canAttendance65()&&m.state!=='playing'&&m.state!=='matched';
 const edit=canEdit65(m);
 let first='',second='';
 if(attendance){
  if(m.state==='waiting'){
   first=`<button class="btn danger" onclick="setOther('${m.id}','out')">퇴장</button>`;
   second=`<button class="btn watch" onclick="setOther('${m.id}','spectator')">관람</button>`;
  }else if(m.state==='spectator'){
   first=`<button class="btn enter" onclick="setOther('${m.id}','waiting')">입장</button>`;
   second=`<button class="btn danger" onclick="setOther('${m.id}','out')">퇴장</button>`;
  }else{
   first=`<button class="btn enter" onclick="setOther('${m.id}','waiting')">입장</button>`;
   second=`<button class="btn watch" onclick="setOther('${m.id}','spectator')">관람</button>`;
  }
 }
 const editBtn=edit?`<button class="btn ghost" onclick="openEditMember('${m.id}')">수정</button>`:'';
 return `<div class="memberActions60 memberActions65"><div class="status">${stateLabel(m.state)}</div><div class="memberBtns memberBtns65">${slot65('primary',first)}${slot65('secondary',second)}${slot65('edit',editBtn)}</div></div>`;
};

const renderSettings64=renderSettings;
renderSettings=function(){
 renderSettings64();const box=$('settings');if(!box)return;
 [...box.querySelectorAll('.meta')].forEach(el=>{
  if((el.textContent||'').includes('콕매치 v64'))el.textContent='콕매치 v65 · 회원상태 3버튼 전환 · 구분선 제거';
 });
};

if(location.pathname.startsWith('/launch/v65'))history.replaceState(null,'','/?loaded=65');
if(me)renderAll();
})();

/* migrated into v6.0: app-v66.js */
(()=>{
const PARTNER66='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-v66-api';
const RESET66='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-reset-v66';
let repeatAddCtx66=null,autoWarnQueue66=[],partnerDay66=todayKst();

function partner66(m){
 if(!m||String(m.partnerDay||'')!==todayKst()||!m.partnerId)return null;
 const p=M(String(m.partnerId));if(!p)return null;
 return {id:String(p.id),name:String(p.name||m.partnerName||'')};
}
function relationText66(m){
 const p=partner66(m);if(p)return `파트너 ${p.name}`;
 const inv=m?.type==='guest'?String(m?.inviter||'').trim():'';
 return inv?`초대 ${inv}`:'';
}
function canSetPartner66(m){return !!m&&!!me&&(String(me.memberId||'')===String(m.id)||me.globalAdmin||me.role==='manager'||me.role==='organizer')}
async function partnerRequest66(action,body={}){
 const r=await fetch(PARTNER66,{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+T},body:JSON.stringify({action,groupId:currentGroupId,...body}),cache:'no-store'});
 const x=await r.json().catch(()=>({}));if(!r.ok){if(r.status===401){reloginLatest();throw new Error('로그인이 만료되었습니다.')}throw new Error(x.error||'파트너 처리에 실패했습니다.')}return x;
}
async function syncPartners66(){if(!me||!T)return;try{const x=await partnerRequest66('partner_sync');if(x.data){S=x.data;normalizeClient();renderAll()}}catch(e){console.warn('partner sync v66',e)}}

window.openPartner66=function(id){
 const m=M(id);if(!m)return;if(!canSetPartner66(m))return alert('본인 또는 관리 가능한 회원의 파트너만 설정할 수 있습니다.');
 const cur=partner66(m);const opts=S.members.filter(x=>String(x.id)!==String(m.id)).map(x=>`<option value="${esc(x.id)}" ${cur&&String(cur.id)===String(x.id)?'selected':''}>${esc(x.name)}${x.type==='guest'?' (게스트)':''}</option>`).join('');
 openModal(`<h3>${esc(m.name)} · 오늘 파트너 설정</h3><div class="note">오늘 하루만 적용되는 1:1 파트너입니다. 선택하면 상대 회원에게도 서로 파트너로 표시됩니다. 기존 파트너가 있으면 새 파트너로 교체됩니다.</div><div class="field"><label>파트너</label><select id="partnerSelect66"><option value="">파트너 없음</option>${opts}</select></div><div class="meta" style="line-height:1.6">자정이 지나면 자동 해제됩니다.<br>리셋의 <b>나. 누적기록 포함 초기화</b> 또는 <b>다. 회원정보 전체 정리 초기화</b>에서도 해제됩니다.</div><div class="acts"><button class="btn ghost" onclick="closeModal()">취소</button><button class="btn pri" onclick="savePartner66('${esc(m.id)}')">저장</button></div>`);
};
window.savePartner66=async function(id){
 const partnerId=$('partnerSelect66')?.value||'';try{const x=await partnerRequest66('partner_set',{memberId:id,partnerId});S=x.data;normalizeClient();closeModal();renderAll()}catch(e){showError(e)}
};

function decorateMemberPartners66(){
 const box=$('members');if(!box)return;const cards=[...box.querySelectorAll('.memberCard')];
 cards.forEach((card,i)=>{const m=S.members[i];if(!m)return;const info=card.querySelector('.memberInfo48')||card.children?.[1];if(!info)return;const meta=info.querySelector('.meta');if(meta){meta.querySelectorAll('.inviteInfo45,.relationInfo66').forEach(x=>x.remove());const rel=relationText66(m);if(rel)meta.insertAdjacentHTML('beforeend',` <span class="relationInfo66">· ${esc(rel)}</span>`)}const pair=info.querySelector('.pairBtn');info.querySelector('.partnerSetBtn66')?.remove();if(pair&&canSetPartner66(m))pair.insertAdjacentHTML('afterend',`<button class="pairBtn partnerSetBtn66" onclick="openPartner66('${esc(m.id)}')">파트너 설정</button>`)});
}
const renderMembers65=renderMembers;
renderMembers=function(){renderMembers65();decorateMemberPartners66()};

function setRelationLine66(el,m,reserve=false){if(!el)return;const rel=relationText66(m);el.textContent=rel||'\u00a0';el.classList.toggle('relationEmpty66',!rel);if(rel)el.classList.remove('queueInviteEmpty55');else if(reserve)el.classList.add('queueInviteEmpty55')}
function decorateQueuePartners66(){
 const box=$('queue');if(!box)return;const q=sortedQueue();
 [...box.querySelectorAll('.queueCard54')].forEach((card,i)=>{const m=M(q[i]);if(!m)return;const info=card.querySelector('.queueInfo53');if(!info)return;let line=info.querySelector('.inviteSub45');if(!line){line=document.createElement('span');line.className='inviteSub45 queueInviteReserve55';info.appendChild(line)}setRelationLine66(line,m,true)});
 [...box.querySelectorAll('.composer54 .slot54')].forEach((slot,i)=>{const m=draft?.[i]?M(draft[i]):null;setRelationLine66(slot.querySelector('.inviteReserve54'),m,true)});
 [...box.querySelectorAll('.pendingCard54')].forEach((card,gi)=>{const pg=S.pendingGames?.[gi];if(!pg)return;[...card.querySelectorAll('.pendingSlot54:not(.emptySlot)')].forEach((slot,pi)=>setRelationLine66(slot.querySelector('.inviteReserve54'),M(pg.players?.[pi]),true))});
}
const renderQueue65=renderQueue;
renderQueue=function(){renderQueue65();decorateQueuePartners66()};

function genderName66(m){const female=m?.gender==='여',label=female?'여성':'남성';return `<span class="nameGender58 ${female?'female':'male'}" title="${label}" aria-label="${label}"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="7" r="4"></circle><path d="M4.5 21c.5-5 3.2-8 7.5-8s7 3 7.5 8z"></path></svg></span>`}
function badge66(m){return m?.type==='guest'?'<span class="roleBadge guest45">게스트</span>':roleBadge(m)}
playerLine=function(id){const m=M(id);if(!m)return'-';const rel=relationText66(m);return `<div class="p playingPlayer53 playingPlayer57"><div class="playingMain53 playingMain58"><span class="playingGender58">${genderName66(m)}</span><span class="playingName53">${esc(m.name)}</span>${ageTag(m)}<span class="playingRole58">${badge66(m)}</span></div><div class="meta playingMeta53">게임 ${dailyCount(id)}회${rel?` · ${esc(rel)}`:''}</div></div>`};

function dailyPairCount66(a,b){return S.history.filter(h=>Array.isArray(h.players)&&h.players.includes(a)&&h.players.includes(b)).length}
function repeatPairsFor66(id,others){const m=M(id);return others.map(oid=>({id:oid,name:M(oid)?.name||'-',count:dailyPairCount66(id,oid),newName:m?.name||'-'})).filter(x=>x.count>=3)}
function showRepeatAdd66(id,slot,repeats,auto=false){repeatAddCtx66={id,slot,repeats,auto};openModal(`<h3>같이한 게임 확인</h3><div class="warn"><b>${esc(M(id)?.name||'-')}</b>님과 이미 오늘 3게임 이상 같이 한 회원이 있습니다.<br>다른 인원을 넣을지, 그대로 편성할지 선택해주세요.</div>${repeats.map(r=>`<div class="card between repeatPair66"><div><b>${esc(r.name)} · ${esc(r.newName)}</b><div class="meta">오늘 같이 완료한 게임</div></div><span class="tag">${r.count}게임</span></div>`).join('')}<div class="acts"><button class="btn ghost" onclick="repeatDifferent66()">다른 인원 넣기</button><button class="btn pri" onclick="repeatKeep66()">그대로 넣기</button></div>`)}
window.repeatDifferent66=function(){const c=repeatAddCtx66;if(c&&draft[c.slot]===c.id)draft[c.slot]=null;repeatAddCtx66=null;autoWarnQueue66=[];closeModal();renderQueue()};
window.repeatKeep66=function(){const auto=!!repeatAddCtx66?.auto;repeatAddCtx66=null;closeModal();renderQueue();if(auto)setTimeout(showNextAutoWarn66,80)};

draftClick=function(id){if(!canGame())return;const idx=draft.indexOf(id);if(idx>=0){draft[idx]=null;renderQueue();return}const slot=draft.findIndex(x=>!x);if(slot<0)return alert('새 게임 편성은 최대 4명까지 선택할 수 있습니다.');const prior=draft.filter(Boolean);draft[slot]=id;renderQueue();const repeats=repeatPairsFor66(id,prior);if(repeats.length)showRepeatAdd66(id,slot,repeats,false)};

const recommendDraft65=recommendDraft;
recommendDraft=function(){recommendDraft65();autoWarnQueue66=[];for(let j=1;j<draft.length;j++){const id=draft[j];if(!id)continue;const prior=draft.slice(0,j).filter(Boolean),repeats=repeatPairsFor66(id,prior);if(repeats.length)autoWarnQueue66.push({id,slot:j,repeats})}setTimeout(showNextAutoWarn66,80)};
function showNextAutoWarn66(){if(repeatAddCtx66)return;while(autoWarnQueue66.length){const c=autoWarnQueue66.shift();if(draft[c.slot]===c.id){showRepeatAdd66(c.id,c.slot,c.repeats,true);return}}}

/* Once a draft is accepted into pending, repeat warnings stay silent until the next new draft selection. */
const act65=act;
act=async function(action,body={},opts={}){const silent=new Set(['create_pending','add_to_pending','move_pending_member','swap_pending_queue','swap_pending_players']);return act65(action,silent.has(action)?{...body,forceRepeat:true}:body,opts)};

async function callReset66(action,pin){const r=await fetch(RESET66,{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+T},body:JSON.stringify({action,groupId:currentGroupId,pin}),cache:'no-store'});const x=await r.json().catch(()=>({}));if(!r.ok)throw new Error(x.error||'초기화에 실패했습니다.');return x}
function resetRole66(){return me?.globalAdmin?'개발자':me?.role==='manager'?'모임장':'운영진'}
window.resetTier40=async function(action){const allowed=action==='reset_daily'?(me?.globalAdmin||me?.role==='manager'||me?.role==='organizer'):action==='reset_cumulative'?(me?.globalAdmin||me?.role==='manager'):(me?.globalAdmin||me?.role==='manager');if(!allowed)return alert('해당 초기화 권한이 없습니다.');const pin=prompt(`${resetRole66()} PIN을 입력해주세요.`);if(pin===null||!pin.trim())return;const labels={reset_daily:'당일 게임 기록 및 로그인세션',reset_cumulative:'당일 기록·누적기록·파트너 설정',reset_roster:'회원정보 전체 정리·파트너 설정'};if(!confirm(`${group?.name||'현재 모임'}의 ${labels[action]}을(를) 초기화하시겠습니까?`))return;try{const x=await callReset66(action,pin.trim());if(me?.globalAdmin){S=x.data;normalizeClient();renderAll();goView('settings');alert('초기화를 완료했습니다.')}else{localStorage.removeItem(TOKEN_KEY);T='';location.replace('/launch/v66.html?afterReset='+Date.now())}}catch(e){showError(e)}};
window.resetRoster60=async function(){if(!(me?.globalAdmin||me?.role==='manager'))return alert('모임장 이상 권한이 필요합니다.');const pin=prompt(`${me?.globalAdmin?'개발자':'모임장'} PIN을 입력해주세요.`);if(pin===null||!pin.trim())return;if(!confirm(`${group?.name||'현재 모임'}의 회원정보를 전체 정리하시겠습니까?\n개발자와 모임장는 유지되고 파트너 설정도 초기화됩니다.`))return;try{const x=await callReset66('reset_roster',pin.trim());if(me?.globalAdmin){S=x.data;normalizeClient();renderAll();goView('settings');alert(`회원정보 정리 완료 · 삭제 ${Number(x.removedCount)||0}명`)}else{localStorage.removeItem(TOKEN_KEY);T='';location.replace('/launch/v66.html?afterReset='+Date.now())}}catch(e){showError(e)}};

const renderSettings65=renderSettings;
renderSettings=function(){renderSettings65();const box=$('settings');if(!box)return;box.querySelector('.partnerCard66')?.remove();const mine=me?.memberId?M(me.memberId):null;if(mine){const p=partner66(mine),versionCard=[...box.querySelectorAll(':scope > .card')].find(c=>(c.textContent||'').includes('프로그램 버전'));const html=`<div class="card partnerCard66"><div class="between"><div><b>오늘 파트너</b><div class="meta">${p?esc(p.name):'설정 없음'} · 자정 자동 해제</div></div><button class="btn ghost" onclick="openPartner66('${esc(mine.id)}')">${p?'변경':'설정'}</button></div></div>`;if(versionCard)versionCard.insertAdjacentHTML('beforebegin',html);else box.insertAdjacentHTML('beforeend',html)}[...box.querySelectorAll(':scope > .card')].forEach(c=>{const t=c.textContent||'';if((t.includes('나. 누적기록 포함 초기화')||t.includes('회원정보 전체 정리 초기화'))&&!c.querySelector('.partnerResetNote66'))c.insertAdjacentHTML('beforeend','<div class="meta partnerResetNote66" style="margin-top:7px">당일 파트너 설정도 함께 해제됩니다.</div>')});[...box.querySelectorAll('.meta')].forEach(el=>{if((el.textContent||'').includes('콕매치 v65'))el.textContent='콕매치 v66 · 당일 파트너 · 3게임 이상 즉시 경고'})};

function dayWatch66(){const d=todayKst();if(d!==partnerDay66){partnerDay66=d;syncPartners66()}}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)dayWatch66()});setInterval(dayWatch66,60000);setTimeout(()=>{if(me)syncPartners66()},700);
if(location.pathname.startsWith('/launch/v66'))history.replaceState(null,'','/?loaded=66');
if(me)renderAll();
})();

/* migrated into v6.0: app-v67.js */
(()=>{
let partnerFlow67=null,repeatFlow67=null;

function partnerOf67(m){
 if(!m||String(m.partnerDay||'')!==todayKst()||!m.partnerId)return null;
 const p=M(String(m.partnerId));
 return p?{id:String(p.id),name:String(p.name||'')} : null;
}
function isPartnerPair67(a,b){
 const ma=M(a),mb=M(b);if(!ma||!mb)return false;
 const d=todayKst();
 return (String(ma.partnerDay||'')===d&&String(ma.partnerId||'')===String(b)) ||
        (String(mb.partnerDay||'')===d&&String(mb.partnerId||'')===String(a));
}
function dailyPairCount67(a,b){
 return S.history.filter(h=>Array.isArray(h.players)&&h.players.includes(a)&&h.players.includes(b)).length;
}
function repeatRows67(newIds,finalIds){
 const out=[],seen=new Set();
 for(const a of newIds){
  for(const b of finalIds){
   if(!a||!b||a===b)continue;
   const key=[String(a),String(b)].sort().join('|');
   if(seen.has(key)||isPartnerPair67(a,b))continue;
   seen.add(key);
   const n=dailyPairCount67(a,b);
   if(n>=3)out.push({a,b,aName:M(a)?.name||'-',bName:M(b)?.name||'-',count:n});
  }
 }
 return out;
}
function allRepeatRows67(ids){
 const out=[];
 for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){
  const a=ids[i],b=ids[j];if(isPartnerPair67(a,b))continue;
  const n=dailyPairCount67(a,b);if(n>=3)out.push({a,b,aName:M(a)?.name||'-',bName:M(b)?.name||'-',count:n});
 }
 return out;
}
function showRepeat67(rows,snapshot){
 if(!rows.length)return;
 repeatFlow67={snapshot:snapshot.slice()};
 openModal(`<h3>같이한 게임 확인</h3><div class="warn">오늘 이미 <b>3게임 이상 같이 완료한 조합</b>이 있습니다.<br>파트너끼리는 이 경고에서 제외됩니다.</div>${rows.map(r=>`<div class="card between repeatPair67"><div><b>${esc(r.aName)} · ${esc(r.bName)}</b><div class="meta">오늘 같이 완료한 게임</div></div><span class="tag">${r.count}게임</span></div>`).join('')}<div class="acts"><button class="btn ghost" onclick="repeatUndo67()">다른 인원 넣기</button><button class="btn pri" onclick="repeatKeep67()">그대로 넣기</button></div>`);
}
window.repeatUndo67=function(){
 if(repeatFlow67?.snapshot)draft=repeatFlow67.snapshot.slice();
 repeatFlow67=null;closeModal();renderQueue();
};
window.repeatKeep67=function(){repeatFlow67=null;closeModal();renderQueue()};
function runRepeat67(newIds,snapshot){
 const rows=repeatRows67(newIds,draft.filter(Boolean));
 if(rows.length)showRepeat67(rows,snapshot);
}

function showPartnerAdded67(snapshot,memberId,partnerId){
 partnerFlow67={mode:'added',snapshot:snapshot.slice(),memberId,partnerId};
 const m=M(memberId),p=M(partnerId);
 openModal(`<h3>오늘 파트너 자동 편성</h3><div class="partnerNotice67"><b>${esc(m?.name||'-')}</b>님의 오늘 파트너는 <b>${esc(p?.name||'-')}</b>님입니다.<br>빈칸에 파트너를 자동으로 함께 넣었습니다.</div><div class="acts"><button class="btn ghost" onclick="partnerRedo67()">다시 짜기</button><button class="btn pri" onclick="partnerKeep67()">그대로 반영</button></div>`);
}
function showPartnerAlready67(snapshot,memberId,partnerId){
 partnerFlow67={mode:'already',snapshot:snapshot.slice(),memberId,partnerId};
 const m=M(memberId),p=M(partnerId);
 openModal(`<h3>오늘 파트너 확인</h3><div class="partnerNotice67"><b>${esc(m?.name||'-')}</b>님의 파트너 <b>${esc(p?.name||'-')}</b>님이 이미 새 게임 편성에 들어가 있습니다.</div><div class="acts"><button class="btn ghost" onclick="partnerRedo67()">다시 짜기</button><button class="btn pri" onclick="partnerKeep67()">그대로 반영</button></div>`);
}
function showPartnerFull67(snapshot,memberId,partnerId){
 const m=M(memberId),p=M(partnerId),candidates=snapshot.filter(Boolean).filter(x=>String(x)!==String(partnerId));
 partnerFlow67={mode:'full',snapshot:snapshot.slice(),memberId,partnerId};
 openModal(`<h3>파트너 자리가 없습니다</h3><div class="warn"><b>${esc(m?.name||'-')}</b>님의 오늘 파트너는 <b>${esc(p?.name||'-')}</b>님입니다.<br>현재 4칸이 모두 찼습니다. 기존 3명 중 한 명과 파트너를 바꾸거나, 파트너를 무시하고 현재 편성을 유지해주세요.</div><div class="partnerSwapList67">${candidates.map(id=>`<button class="choiceBtn partnerSwapBtn67" onclick="partnerSwap67('${esc(id)}')"><b>${esc(M(id)?.name||'-')}</b><span class="meta">이 회원 대신 ${esc(p?.name||'-')} 넣기</span></button>`).join('')}</div><button class="btn ghost partnerIgnore67" onclick="partnerIgnore67()">파트너 무시하고 현재 4명으로 편성</button>`);
}
window.partnerRedo67=function(){
 const c=partnerFlow67;if(c?.snapshot)draft=c.snapshot.slice();partnerFlow67=null;closeModal();renderQueue();
};
window.partnerKeep67=function(){
 const c=partnerFlow67;if(!c)return closeModal();partnerFlow67=null;closeModal();renderQueue();
 const added=c.mode==='added'?[c.memberId,c.partnerId]:[c.memberId];
 runRepeat67(added,c.snapshot);
};
window.partnerSwap67=function(replaceId){
 const c=partnerFlow67;if(!c)return;
 const idx=draft.findIndex(x=>String(x)===String(replaceId));
 if(idx<0)return;
 draft[idx]=c.partnerId;
 const snapshot=c.snapshot.slice(),newIds=[c.memberId,c.partnerId];
 partnerFlow67=null;closeModal();renderQueue();runRepeat67(newIds,snapshot);
};
window.partnerIgnore67=function(){
 const c=partnerFlow67;if(!c)return;
 const snapshot=c.snapshot.slice(),newId=c.memberId;
 partnerFlow67=null;closeModal();renderQueue();runRepeat67([newId],snapshot);
};

draftClick=function(id){
 if(!canGame())return;
 const exists=draft.indexOf(id);
 if(exists>=0){draft[exists]=null;renderQueue();return}
 const slot=draft.findIndex(x=>!x);
 if(slot<0)return alert('새 게임 편성은 최대 4명까지 선택할 수 있습니다.');
 const snapshot=draft.slice(),prior=snapshot.filter(Boolean),m=M(id),p=partnerOf67(m);
 draft[slot]=id;renderQueue();
 if(!p){runRepeat67([id],snapshot);return}
 if(prior.includes(p.id)){showPartnerAlready67(snapshot,id,p.id);return}
 const partnerWaiting=S.queue.includes(p.id);
 if(!partnerWaiting){
  alert(`${p.name}님은 ${m?.name||'선택 회원'}님의 오늘 파트너지만 현재 개인 게임대기 상태가 아니어서 자동 편성하지 않았습니다.`);
  runRepeat67([id],snapshot);return;
 }
 const pslot=draft.findIndex(x=>!x);
 if(pslot>=0){draft[pslot]=p.id;renderQueue();showPartnerAdded67(snapshot,id,p.id);return}
 showPartnerFull67(snapshot,id,p.id);
};

/* Recommendation keeps the existing fairness score, but partner pairs never trigger 3+ repeat warnings. */
recommendDraft=function(){
 const pool=sortedQueue().filter(id=>!draft.includes(id)).slice(0,24);
 if(pool.length<4)return alert('개인 게임대기 인원이 4명 이상 필요합니다.');
 const gvMap={A:5,B:4,C:3,D:2,E:1};let best=null,score=Infinity;
 for(let a=0;a<pool.length-3;a++)for(let b=a+1;b<pool.length-2;b++)for(let c=b+1;c<pool.length-1;c++)for(let d=c+1;d<pool.length;d++){
  const ids=[pool[a],pool[b],pool[c],pool[d]],ms=ids.map(M),gv=ms.map(m=>gvMap[m?.cls]||1),mean=gv.reduce((x,y)=>x+y,0)/4,variance=gv.reduce((x,y)=>x+(y-mean)**2,0),male=ms.filter(m=>m?.gender==='남').length;
  let repeat=0;for(let i=0;i<4;i++)for(let j=i+1;j<4;j++)repeat+=pairCount(ids[i],ids[j]);
  const s=repeat*18+variance*7+Math.abs(male-2)*10+a*.02;if(s<score){score=s;best=ids}
 }
 const snapshot=draft.slice();draft=best;renderQueue();const rows=allRepeatRows67(draft.filter(Boolean));if(rows.length)showRepeat67(rows,snapshot);
};

const renderSettings66=renderSettings;
renderSettings=function(){
 renderSettings66();const box=$('settings');if(!box)return;
 [...box.querySelectorAll('.meta')].forEach(el=>{if((el.textContent||'').includes('콕매치 v66'))el.textContent='콕매치 v67 · 파트너 자동편성 · 파트너 반복경고 제외'});
};
if(location.pathname.startsWith('/launch/v67'))history.replaceState(null,'','/?loaded=67');
if(me)renderAll();
})();

/* migrated into v6.0: app-v68.js */
(()=>{
let partnerFlow68=null,repeatFlow68=null;

function memberLabel68(m){
 if(!m)return '-';
 const age=String(m.age||'').trim(),cls=String(m.cls||'').trim(),gender=String(m.gender||'').trim();
 return `${String(m.name||'-').trim()} ${age}${cls}${gender}`.trim();
}
function partnerOf68(m){
 if(!m||String(m.partnerDay||'')!==todayKst()||!m.partnerId)return null;
 const p=M(String(m.partnerId));
 return p?{id:String(p.id),name:String(p.name||''),member:p}:null;
}
function isPartnerPair68(a,b){
 const ma=M(a),mb=M(b);if(!ma||!mb)return false;const d=todayKst();
 return (String(ma.partnerDay||'')===d&&String(ma.partnerId||'')===String(b)) ||
        (String(mb.partnerDay||'')===d&&String(mb.partnerId||'')===String(a));
}
function dailyPairCount68(a,b){return S.history.filter(h=>Array.isArray(h.players)&&h.players.includes(a)&&h.players.includes(b)).length}
function repeatRows68(newIds,finalIds){
 const out=[],seen=new Set();
 for(const a of newIds)for(const b of finalIds){
  if(!a||!b||a===b)continue;const key=[String(a),String(b)].sort().join('|');
  if(seen.has(key)||isPartnerPair68(a,b))continue;seen.add(key);
  const n=dailyPairCount68(a,b);if(n>=3)out.push({a,b,aName:M(a)?.name||'-',bName:M(b)?.name||'-',count:n});
 }
 return out;
}
function showRepeat68(rows,snapshot){
 if(!rows.length)return;repeatFlow68={snapshot:snapshot.slice()};
 openModal(`<h3>같이한 게임 확인</h3><div class="warn">오늘 이미 <b>3게임 이상 같이 완료한 조합</b>이 있습니다.<br>파트너끼리는 이 경고에서 제외됩니다.</div>${rows.map(r=>`<div class="card between repeatPair67"><div><b>${esc(r.aName)} · ${esc(r.bName)}</b><div class="meta">오늘 같이 완료한 게임</div></div><span class="tag">${r.count}게임</span></div>`).join('')}<div class="acts"><button class="btn ghost" onclick="repeatUndo68()">다른 인원 넣기</button><button class="btn pri" onclick="repeatKeep68()">그대로 넣기</button></div>`);
}
window.repeatUndo68=function(){if(repeatFlow68?.snapshot)draft=repeatFlow68.snapshot.slice();repeatFlow68=null;closeModal();renderQueue()};
window.repeatKeep68=function(){repeatFlow68=null;closeModal();renderQueue()};
function runRepeat68(newIds,snapshot){const rows=repeatRows68(newIds,draft.filter(Boolean));if(rows.length)showRepeat68(rows,snapshot)}

function showPartnerAdded68(snapshot,memberId,partnerId){
 partnerFlow68={mode:'added',snapshot:snapshot.slice(),memberId,partnerId};const m=M(memberId),p=M(partnerId);
 openModal(`<h3>오늘 파트너 자동 편성</h3><div class="partnerNotice67"><b>${esc(memberLabel68(m))}</b> 님의 오늘 파트너는 <b>${esc(memberLabel68(p))}</b> 입니다.<br>빈칸에 파트너를 자동으로 함께 넣었습니다.</div><div class="acts"><button class="btn ghost" onclick="partnerRedo68()">다시 짜기</button><button class="btn pri" onclick="partnerKeep68()">그대로 반영</button></div>`);
}
function showPartnerAlready68(snapshot,memberId,partnerId){
 partnerFlow68={mode:'already',snapshot:snapshot.slice(),memberId,partnerId};const m=M(memberId),p=M(partnerId);
 openModal(`<h3>오늘 파트너 확인</h3><div class="partnerNotice67"><b>${esc(memberLabel68(m))}</b> 님의 파트너 <b>${esc(memberLabel68(p))}</b> 님이 이미 새 게임 편성에 들어가 있습니다.</div><div class="acts"><button class="btn ghost" onclick="partnerRedo68()">다시 짜기</button><button class="btn pri" onclick="partnerKeep68()">그대로 반영</button></div>`);
}
function showPartnerFull68(snapshot,memberId,partnerId){
 const m=M(memberId),p=M(partnerId),candidates=snapshot.filter(Boolean).filter(x=>String(x)!==String(partnerId));
 partnerFlow68={mode:'full',snapshot:snapshot.slice(),memberId,partnerId};
 openModal(`<h3>파트너 자리가 없습니다</h3><div class="warn partnerFullWarn68"><b>${esc(memberLabel68(m))}</b> 님의 파트너는 <b>${esc(memberLabel68(p))}</b> 입니다.<br>현재 4칸이 모두 찼습니다. 아래 3명 중 한 명을 파트너와 바꾸거나, 파트너를 무시하고 현재 편성을 유지해주세요.</div><div class="partnerSwapList67">${candidates.map(id=>{const cm=M(id);return `<button class="choiceBtn partnerSwapBtn67 partnerSwapBtn68" onclick="partnerSwap68('${esc(id)}')"><b>${esc(memberLabel68(cm))}, 게임 ${dailyCount(id)}회, 대기시간 ${waitMins(cm)}분</b><span class="meta">이 회원 대신 ${esc(memberLabel68(p))} 넣기</span></button>`}).join('')}</div><button class="btn ghost partnerIgnore67" onclick="partnerIgnore68()">파트너 무시하고 현재 4명으로 편성</button>`);
}
window.partnerRedo68=function(){const c=partnerFlow68;if(c?.snapshot)draft=c.snapshot.slice();partnerFlow68=null;closeModal();renderQueue()};
window.partnerKeep68=function(){const c=partnerFlow68;if(!c)return closeModal();partnerFlow68=null;closeModal();renderQueue();const added=c.mode==='added'?[c.memberId,c.partnerId]:[c.memberId];runRepeat68(added,c.snapshot)};
window.partnerSwap68=function(replaceId){const c=partnerFlow68;if(!c)return;const idx=draft.findIndex(x=>String(x)===String(replaceId));if(idx<0)return;draft[idx]=c.partnerId;const snapshot=c.snapshot.slice(),newIds=[c.memberId,c.partnerId];partnerFlow68=null;closeModal();renderQueue();runRepeat68(newIds,snapshot)};
window.partnerIgnore68=function(){const c=partnerFlow68;if(!c)return;const snapshot=c.snapshot.slice(),newId=c.memberId;partnerFlow68=null;closeModal();renderQueue();runRepeat68([newId],snapshot)};

draftClick=function(id){
 if(!canGame())return;const exists=draft.indexOf(id);if(exists>=0){draft[exists]=null;renderQueue();return}
 const slot=draft.findIndex(x=>!x);if(slot<0)return alert('새 게임 편성은 최대 4명까지 선택할 수 있습니다.');
 const snapshot=draft.slice(),prior=snapshot.filter(Boolean),m=M(id),p=partnerOf68(m);draft[slot]=id;renderQueue();
 if(!p){runRepeat68([id],snapshot);return}
 if(prior.includes(p.id)){showPartnerAlready68(snapshot,id,p.id);return}
 const partnerWaiting=S.queue.includes(p.id);
 if(!partnerWaiting){alert(`${memberLabel68(m)} 님의 오늘 파트너는 ${memberLabel68(p.member)} 입니다.\n파트너가 현재 개인 게임대기 상태가 아니어서 자동 편성하지 않았습니다.`);runRepeat68([id],snapshot);return}
 const pslot=draft.findIndex(x=>!x);if(pslot>=0){draft[pslot]=p.id;renderQueue();showPartnerAdded68(snapshot,id,p.id);return}
 showPartnerFull68(snapshot,id,p.id);
};

const renderSettings67=renderSettings;
renderSettings=function(){renderSettings67();const box=$('settings');if(!box)return;[...box.querySelectorAll('.meta')].forEach(el=>{if((el.textContent||'').includes('콕매치 v67'))el.textContent='콕매치 v68 · 파트너 상세안내 · 개인대기 이름정렬'})};
if(location.pathname.startsWith('/launch/v68'))history.replaceState(null,'','/?loaded=68');
if(me)renderAll();
})();

/* migrated into v6.0: app-v69.js */
(()=>{
function actor69(){return me?.globalAdmin?'admin':me?.tempOrganizer?'temp':String(me?.role||'member')}
function staff69(){return ['admin','manager','organizer','temp'].includes(actor69())}
function selfMember69(){
 if(me?.memberId){const m=M(String(me.memberId));if(m)return m}
 const name=String(me?.displayName||'').trim();
 return S.members.find(m=>m.type!=='guest'&&String(m.name||'').trim()===name)||null;
}
function slot69(kind,html){return `<span class="memberBtnSlot65 memberBtn-${kind}65">${html||'<span class="memberBtnPlaceholder65" aria-hidden="true"></span>'}</span>`}
function ownControls69(m){
 let first='',second='';
 if(m.state!=='playing'&&m.state!=='matched'){
  if(m.state==='waiting'){
   first=`<button class="btn danger" onclick="setMyMemberState69('out')">퇴장</button>`;
   second=`<button class="btn watch" onclick="setMyMemberState69('spectator')">관람</button>`;
  }else if(m.state==='spectator'){
   first=`<button class="btn enter" onclick="setMyMemberState69('waiting')">입장</button>`;
   second=`<button class="btn danger" onclick="setMyMemberState69('out')">퇴장</button>`;
  }else{
   first=`<button class="btn enter" onclick="setMyMemberState69('waiting')">입장</button>`;
   second=`<button class="btn watch" onclick="setMyMemberState69('spectator')">관람</button>`;
  }
 }
 return `<div class="memberActions60 memberActions65 memberActions69"><div class="status">${stateLabel(m.state)}</div><div class="memberBtns memberBtns65">${slot69('primary',first)}${slot69('secondary',second)}${slot69('edit','')}</div></div>`;
}
window.setMyMemberState69=async function(mode){
 try{await act('set_my_attendance',{mode})}catch(e){showError(e)}
};

const renderMembers68=renderMembers;
renderMembers=function(){
 renderMembers68();
 const box=$('members');if(!box)return;
 const cards=[...box.querySelectorAll('.memberCard')],listHost=cards[0]?.parentElement||null;
 const rows=cards.map((card,i)=>({card,m:S.members[i]})).filter(x=>x.m);
 const mine=selfMember69(),sid=String(mine?.id||'');
 const note=box.querySelector('.note');
 const title=box.querySelector('.title');
 const addBtn=title?.querySelector('button');
 const isStaff=staff69();

 if(isStaff){
  if(note)note.textContent=actor69()==='temp'?'임시편성자는 현재 모임의 전체 회원을 확인하고 입장·관람·퇴장 상태와 게임운영을 관리할 수 있습니다.':'운영권한 사용자는 현재 모임의 전체 회원을 확인하고 입장·관람·퇴장 상태를 관리할 수 있습니다.';
  const selfRow=rows.find(x=>String(x.m.id)===sid);
  if(selfRow){
   selfRow.card.classList.add('memberSelf69');
   const parent=selfRow.card.parentElement;
   if(parent&&parent.firstElementChild!==selfRow.card)parent.insertBefore(selfRow.card,parent.firstElementChild);
  }
  return;
 }

 if(addBtn)addBtn.remove();
 if(note)note.textContent='일반과 게스트는 회원명부에서 본인 정보만 확인할 수 있으며, 본인의 입장·관람·퇴장 상태만 변경할 수 있습니다.';
 const selfRow=rows.find(x=>String(x.m.id)===sid);
 rows.forEach(x=>{if(x!==selfRow)x.card.remove()});
 if(!selfRow){
  if(listHost)listHost.innerHTML='<div class="empty">현재 로그인 계정과 연결된 회원정보를 찾을 수 없습니다.</div>';
  return;
 }
 selfRow.card.classList.add('memberSelf69');
 const parent=selfRow.card.parentElement;
 if(parent&&parent.firstElementChild!==selfRow.card)parent.insertBefore(selfRow.card,parent.firstElementChild);
 const actions=selfRow.card.querySelector('.memberActions65,.memberActions60');
 if(actions)actions.outerHTML=ownControls69(selfRow.m);
 selfRow.card.querySelector('.pairBtn:not(.partnerSetBtn66)')?.remove();
 selfRow.card.querySelector('.partnerSetBtn66')?.setAttribute('aria-label','오늘 파트너 설정');
};

const renderSettings68=renderSettings;
renderSettings=function(){
 renderSettings68();const box=$('settings');if(!box)return;
 [...box.querySelectorAll('.meta')].forEach(el=>{if((el.textContent||'').includes('콕매치 v68'))el.textContent='콕매치 v69 · 회원명부 권한별 조회 · 본인 우선표시'});
};
if(location.pathname.startsWith('/launch/v69'))history.replaceState(null,'','/?loaded=69');
if(me)renderAll();
})();

/* migrated into v6.0: app-v70.js */
(()=>{
const WAIT70='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-wait-v70';
function actor70(){return me?.globalAdmin?'admin':me?.tempOrganizer?'temp':String(me?.role||'member')}
function staff70(){return ['admin','manager','organizer','temp'].includes(actor70())}
function mine70(){if(me?.memberId){const m=M(String(me.memberId));if(m)return m}const n=String(me?.displayName||'').trim();return S.members.find(m=>String(m.name||'').trim()===n)||null}
function slot70(kind,html){return `<span class="memberBtnSlot65 memberBtn-${kind}65">${html||'<span class="memberBtnPlaceholder65" aria-hidden="true"></span>'}</span>`}
function ownControls70(m){let first='',second='';if(m.state!=='playing'&&m.state!=='matched'){if(m.state==='waiting'){first=`<button class="btn danger" onclick="setMyMemberState70('out')">퇴장</button>`;second=`<button class="btn watch" onclick="setMyMemberState70('spectator')">관람</button>`}else if(m.state==='spectator'){first=`<button class="btn enter" onclick="setMyMemberState70('waiting')">입장</button>`;second=`<button class="btn danger" onclick="setMyMemberState70('out')">퇴장</button>`}else{first=`<button class="btn enter" onclick="setMyMemberState70('waiting')">입장</button>`;second=`<button class="btn watch" onclick="setMyMemberState70('spectator')">관람</button>`}}return `<div class="memberActions60 memberActions65 memberActions69"><div class="status">${stateLabel(m.state)}</div><div class="memberBtns memberBtns65">${slot70('primary',first)}${slot70('secondary',second)}${slot70('edit','')}</div></div>`}
window.setMyMemberState70=async function(mode){try{await act('set_my_attendance',{mode})}catch(e){showError(e)}};

const renderMembers69=renderMembers;
renderMembers=function(){
 const actualStaff=staff70();
 if(actualStaff){renderMembers69();const note=$('members')?.querySelector('.note');if(note)note.textContent='모든 회원이 현재 모임의 전체 회원명부를 볼 수 있습니다. 운영권한 사용자는 권한 범위에 따라 회원 상태와 정보를 관리할 수 있습니다.';return}
 const oldTemp=me?.tempOrganizer;if(me)me.tempOrganizer=true;
 try{renderMembers69()}finally{if(me)me.tempOrganizer=oldTemp}
 const box=$('members');if(!box)return;
 const note=box.querySelector('.note');if(note)note.textContent='모든 회원이 현재 모임의 전체 회원명부를 볼 수 있습니다. 일반과 게스트는 본인의 입장·관람·퇴장만 변경할 수 있습니다.';
 const self=box.querySelector('.memberSelf69'),my=mine70();
 [...box.querySelectorAll('.memberCard')].forEach(card=>{
  card.querySelector('.pairBtn:not(.partnerSetBtn66)')?.remove();
  const actions=card.querySelector('.memberActions65,.memberActions60');if(!actions)return;
  if(card===self&&my)actions.outerHTML=ownControls70(my);
  else{const status=actions.querySelector('.status')?.textContent||'';actions.outerHTML=`<div class="memberActions60 memberActions65 memberReadonly70"><div class="status">${esc(status)}</div></div>`}
 });
};

function todayStart70(){const d=todayKst().split('-').map(Number);return Date.UTC(d[0],d[1]-1,d[2])-9*60*60*1000}
function currentWaitMin70(m){const j=Number(m?.joinedAt)||0;return j?Math.max(0,Math.floor((Date.now()-j)/60000)):0}
function totalWaitMin70(m){let ms=String(m?.waitDay||'')===todayKst()?Math.max(0,Number(m?.waitTotalMs)||0):0;const j=Number(m?.joinedAt)||0;if(j&&(m?.state==='waiting'||m?.state==='matched'))ms+=Math.max(0,Date.now()-Math.max(j,todayStart70()));return Math.max(0,Math.floor(ms/60000))}
function decorateWait70(){const box=$('queue');if(!box)return;const q=sortedQueue();[...box.querySelectorAll('.queueCard54,.queueCard53')].forEach((card,i)=>{const m=M(q[i]);if(!m)return;const meta=card.querySelector('.queueInfo53 .compactMeta53')||card.querySelector('.queueInfo53 .meta');if(meta)meta.innerHTML=`<span class="waitCurrent70">현재 ${currentWaitMin70(m)}분 대기중</span><span class="waitSep70"> · </span><span class="waitTotal70">오늘 총 ${totalWaitMin70(m)}분 대기</span>`})}
const renderQueue69=renderQueue;
renderQueue=function(){renderQueue69();decorateWait70()};
setInterval(()=>{if(me&&currentView==='queue')decorateWait70()},30000);

async function waitRequest70(action,body={}){const r=await fetch(WAIT70,{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+T},body:JSON.stringify({action,groupId:currentGroupId,...body}),cache:'no-store'});const x=await r.json().catch(()=>({}));if(!r.ok){if(r.status===401){reloginLatest();throw new Error('로그인이 만료되었습니다.')}throw new Error(x.error||'대기시간 처리에 실패했습니다.')}return x}
const act69=act;
act=async function(action,body={},opts={}){if(['set_my_attendance','set_member_attendance','begin_game','finish_game'].includes(action)){const x=await waitRequest70(action,body);if(x.data){S=x.data;normalizeClient();renderAll()}return x}return act69(action,body,opts)};

const renderSettings69=renderSettings;
renderSettings=function(){renderSettings69();const box=$('settings');if(!box)return;[...box.querySelectorAll('.meta')].forEach(el=>{if((el.textContent||'').includes('콕매치 v69'))el.textContent='콕매치 v70 · 전체회원명부 공개 · 당일 누적대기시간'})};
if(location.pathname.startsWith('/launch/v70'))history.replaceState(null,'','/?loaded=70');
if(me)renderAll();
})();

/* migrated into v6.0: app-v71.js */
(()=>{
const WAIT71='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-wait-v71';
const SESSION_DAY71='kokmatch_session_business_day_v71';
let resetTimer71=null,registerBusy71=false;
const busy71=new Set();

function businessDay71(){const shifted=new Date(Date.now()-5*60*60*1000);return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(shifted)}
function businessMonth71(){return businessDay71().slice(0,7)}
function nextResetAt71(){const [y,m,d]=businessDay71().split('-').map(Number);return Date.UTC(y,m-1,d+1)-4*60*60*1000}
function mine71(){if(me?.memberId){const m=M(String(me.memberId));if(m)return m}const n=String(me?.displayName||'').trim();return S.members.find(m=>String(m.name||'').trim()===n)||null}
function attendance71(m){return String(m?.attendanceMonth||'')===businessMonth71()?Math.max(0,Number(m?.attendanceCount)||0):0}
function monthLabel71(){return `${Number(businessMonth71().slice(5,7))}월`}
function orderedMembers71(){const mine=mine71();if(!mine)return S.members.slice();return [mine,...S.members.filter(m=>String(m.id)!==String(mine.id))]}

function forceDailyLogout71(){
 try{localStorage.removeItem(TOKEN_KEY);localStorage.removeItem(SESSION_DAY71)}catch{}
 T='';location.replace('/?daily5='+Date.now());
}
function armDailyReset71(){
 if(!me||!T)return;
 const d=businessDay71(),saved=localStorage.getItem(SESSION_DAY71)||'';
 if(saved&&saved!==d){forceDailyLogout71();return}
 localStorage.setItem(SESSION_DAY71,d);
 if(resetTimer71)clearTimeout(resetTimer71);
 resetTimer71=setTimeout(forceDailyLogout71,Math.max(1000,nextResetAt71()-Date.now()+700));
}
const loadState70=loadState;
loadState=async function(){const x=await loadState70();armDailyReset71();return x};
const logout70=logout;
logout=async function(){try{localStorage.removeItem(SESSION_DAY71)}catch{}return logout70()};
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&me&&T)armDailyReset71()});
setInterval(()=>{if(me&&T)armDailyReset71()},60000);

const renderMembers70=renderMembers;
renderMembers=function(){
 renderMembers70();const box=$('members');if(!box)return;
 const members=orderedMembers71(),cards=[...box.querySelectorAll('.memberCard')];
 cards.forEach((card,i)=>{
  const m=members[i];if(!m)return;
  card.classList.add('memberCard71');
  card.querySelectorAll('.gamecnt').forEach(el=>{if((el.textContent||'').includes('총 게임'))el.remove()});
  const meta=card.querySelector('.meta');
  if(meta){
   meta.classList.add('memberMeta71');
   meta.querySelector('.memberAttendance71')?.remove();
   meta.insertAdjacentHTML('beforeend',` <span class="memberAttendance71">· ${monthLabel71()} 출석 ${attendance71(m)}회</span>`);
  }
 });
};

async function waitRequest71(action,body={}){
 const r=await fetch(WAIT71,{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+T},body:JSON.stringify({action,groupId:currentGroupId,...body}),cache:'no-store'});
 const x=await r.json().catch(()=>({}));
 if(!r.ok){if(r.status===401){reloginLatest();throw new Error('로그인이 만료되었습니다.')}throw new Error(x.error||'처리에 실패했습니다.')}return x;
}
function renderFast71(){renderHeader();renderMembers();renderQueue();renderStats();document.querySelectorAll('.view').forEach(v=>v.classList.toggle('on',v.id===currentView));}
function applyAttendanceLocal71(mid,mode){
 const m=M(mid);if(!m)return;
 S.queue=S.queue.filter(x=>String(x)!==String(mid));
 if(mode==='waiting'){
  if(m.state!=='waiting')m.joinedAt=Date.now();
  if(!S.queue.includes(mid))S.queue.push(mid);
 }else m.joinedAt=null;
 m.state=mode;
}
async function fastAttendance71(action,body){
 const mid=action==='set_my_attendance'?String(mine71()?.id||''):String(body.memberId||body.id||'');
 const m=M(mid);if(!m)throw new Error('회원을 찾을 수 없습니다.');
 const key='att:'+mid;if(busy71.has(key))return null;busy71.add(key);
 const prevMember={...m},prevQueue=S.queue.slice();
 applyAttendanceLocal71(mid,String(body.mode||''));renderFast71();
 try{
  const x=await waitRequest71(action,body);if(x.data){S=x.data;normalizeClient();renderFast71()}return x;
 }catch(e){Object.assign(m,prevMember);S.queue=prevQueue;renderFast71();throw e}
 finally{busy71.delete(key)}
}
const act70=act;
act=async function(action,body={},opts={}){
 if(action==='set_my_attendance'||action==='set_member_attendance')return fastAttendance71(action,body);
 if(action==='begin_game'||action==='finish_game'){
  const key=action+':'+String(body.gameId||body.pendingId||'');if(busy71.has(key))return null;busy71.add(key);
  try{const x=await waitRequest71(action,body);if(x.data){S=x.data;normalizeClient();renderAll()}return x}finally{busy71.delete(key)}
 }
 return act70(action,body,opts);
};

registerDraft=async function(forceRepeat=false){
 if(registerBusy71)return;
 const ps=draft.filter(Boolean);if(!ps.length)return alert('1명 이상 선택해주세요.');
 if(ps.length<4&&!confirm(`현재 ${ps.length}명입니다. 4명이 안 됐는데 편성대기로 등록하시겠습니까?`))return;
 registerBusy71=true;
 const snapshot={queue:S.queue.slice(),pending:S.pendingGames.map(g=>({...g,players:[...(g.players||[])]})),states:ps.map(id=>[id,{state:M(id)?.state,joinedAt:M(id)?.joinedAt}]),draft:draft.slice()};
 const tmp='v71tmp'+Date.now();
 S.pendingGames.push({id:tmp,players:ps.slice(),createdAt:Date.now()});
 S.queue=S.queue.filter(id=>!ps.includes(id));
 ps.forEach(id=>{const m=M(id);if(m)m.state='matched'});
 draft=[null,null,null,null];renderHeader();renderMembers();renderQueue();
 try{
  const x=await act('create_pending',{players:ps,forceRepeat:true},{repeat:{keep:()=>registerDraft(true),manual:()=>{clearDraft();closeModal()},recommend:()=>{closeModal();clearDraft();recommendDraft()}}});
  if(!x){S.queue=snapshot.queue;S.pendingGames=snapshot.pending;snapshot.states.forEach(([id,v])=>Object.assign(M(id)||{},v));draft=snapshot.draft;renderAll()}
 }catch(e){S.queue=snapshot.queue;S.pendingGames=snapshot.pending;snapshot.states.forEach(([id,v])=>Object.assign(M(id)||{},v));draft=snapshot.draft;renderAll();showError(e)}
 finally{registerBusy71=false}
};

const renderSettings70=renderSettings;
renderSettings=function(){renderSettings70();const box=$('settings');if(!box)return;[...box.querySelectorAll('.meta')].forEach(el=>{if((el.textContent||'').includes('콕매치 v70'))el.textContent='콕매치 v71 · 새벽5시 자동초기화 · 월출석 · 반응속도 개선'})};
if(location.pathname.startsWith('/launch/v71'))history.replaceState(null,'','/?loaded=71');
if(me){armDailyReset71();renderAll()}
})();

/* migrated into v6.0: app-v72.js */
(()=>{
const V72_API='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-v72-api';
const busy72=new Set();

function mine72(){
 if(me?.memberId){const m=M(String(me.memberId));if(m)return m}
 const n=String(me?.displayName||'').trim();
 return S.members.find(m=>String(m.name||'').trim()===n)||null;
}
function pollAdmin72(){return !!me&&(me.globalAdmin||me.role==='manager'||me.role==='organizer')}
function canVote72(){const m=mine72();return !!m&&m.type!=='guest'}
function polls72(){S.attendancePolls=Array.isArray(S.attendancePolls)?S.attendancePolls:[];return S.attendancePolls}
function voteMap72(p){return p?.memberVotes&&typeof p.memberVotes==='object'?p.memberVotes:{}}
function guests72(p){return Array.isArray(p?.guestEntries)?p.guestEntries:[]}
function yesMembers72(p){
 const v=voteMap72(p);
 return Object.keys(v).filter(id=>v[id]==='yes').map(M).filter(m=>m&&m.type!=='guest');
}
function roleRank72(m){
 const r=roleOf(m);
 if(r==='admin')return 0;
 if(r==='manager')return 1;
 if(r==='organizer')return 2;
 if(isTemp(m))return 3;
 return 4;
}
function genderChip72(m){
 const f=m?.gender==='여';
 return `<span class="pollGender72 ${f?'female':'male'}">${f?'여':'남'}</span>`;
}
function pollWhen72(p){
 const a=String(p?.date||'').split('-').map(Number),wd=['일','월','화','수','목','금','토'];
 if(a.length!==3||!a[0])return `${esc(p?.date||'')} ${esc(p?.time||'')}`;
 const d=new Date(Date.UTC(a[0],a[1]-1,a[2]));
 return `${a[1]}월 ${a[2]}일 (${wd[d.getUTCDay()]}) ${esc(p?.time||'')}`;
}
function avgWaitMin72(){
 const count=Math.max(0,Number(S.waitSampleCount)||0),ms=Math.max(0,Number(S.waitSampleTotalMs)||0);
 return count?Math.max(0,Math.round(ms/count/60000)):0;
}
async function v72Request(action,body={}){
 const r=await fetch(V72_API,{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+T},body:JSON.stringify({action,groupId:currentGroupId,...body}),cache:'no-store'});
 const x=await r.json().catch(()=>({}));
 if(!r.ok){
  if(r.status===401){reloginLatest();throw new Error('로그인이 만료되었습니다.')}
  throw new Error(x.error||'처리에 실패했습니다.');
 }
 return x;
}
async function applyV72(action,body={},render=true){
 const key=action+':'+String(body.pollId||body.gameId||body.pendingId||body.court||'');
 if(busy72.has(key))return null;
 busy72.add(key);
 try{
  const x=await v72Request(action,body);
  if(x.data){S=x.data;normalizeClient();if(render)renderAll()}
  return x;
 }finally{busy72.delete(key)}
}

/* Court name: accept digits only, display remains N코트. */
renameCourt=function(n){
 if(!canGame())return;
 const cur=String(courtLabel(n)||'').replace(/\D/g,'')||String(n);
 openModal(`<h3>코트 번호 수정</h3><div class="note">숫자만 입력할 수 있습니다. 화면에는 자동으로 <b>코트</b>가 붙어 표시됩니다.</div><div class="field"><label>코트 번호</label><input id="courtNumber72" class="courtNumber72" type="number" min="1" max="999" step="1" inputmode="numeric" pattern="[0-9]*" value="${esc(cur)}"></div><div class="acts"><button class="btn ghost" onclick="closeModal()">취소</button><button class="btn pri" onclick="saveCourtNumber72(${Number(n)})">저장</button></div>`);
 setTimeout(()=>$('courtNumber72')?.select(),30);
};
window.saveCourtNumber72=async function(court){
 const raw=String($('courtNumber72')?.value||'').trim();
 if(!/^\d+$/.test(raw)||Number(raw)<1)return alert('코트 번호는 1 이상의 숫자만 입력해주세요.');
 try{await applyV72('set_court_name',{court:Number(court),name:`${Number(raw)}코트`});closeModal()}catch(e){showError(e)}
};

/* Route game start/end through v72 so wait samples and attendance remain consistent. */
const act71=act;
act=async function(action,body={},opts={}){
 if(action==='begin_game'||action==='finish_game'||action==='set_court_name')return applyV72(action,body,true);
 return act71(action,body,opts);
};

/* Attendance polls */
function renderPollCard72(p){
 const members=yesMembers72(p),guests=guests72(p),mine=mine72(),vote=mine?voteMap72(p)[String(mine.id)]||'':'';
 const staff=pollAdmin72();
 return `<div class="card pollCard72">
  <div class="pollHead72"><div><b>${esc(p.title||'운동 참석 투표')}</b><div class="pollWhen72">${pollWhen72(p)}</div><div class="meta">개설 ${esc(p.createdBy||'운영진')}</div></div>${staff?`<button class="miniBtn" onclick="deletePoll72('${esc(p.id)}')">삭제</button>`:''}</div>
  <div class="pollCounts72">
   <button class="pollCountBtn72" onclick="openPollMembers72('${esc(p.id)}')"><b>${members.length}명</b>회원 참석</button>
   <button class="pollCountBtn72" onclick="openPollGuests72('${esc(p.id)}')"><b>${guests.length}명</b>게스트</button>
  </div>
  ${canVote72()?`<div class="pollVote72"><button class="btn ${vote==='yes'?'pri':'ghost'}" onclick="votePoll72('${esc(p.id)}','yes')">참석</button><button class="btn ${vote==='no'?'danger':'ghost'}" onclick="votePoll72('${esc(p.id)}','no')">불참</button></div><div class="pollMine72">내 응답: ${vote==='yes'?'참석':vote==='no'?'불참':'미응답'}</div>`:'<div class="note">게스트는 직접 투표하지 않고 운영진이 참가명단에 입력합니다.</div>'}
  ${staff?`<div class="pollAdmin72"><button class="btn ghost" onclick="openGuestAdd72('${esc(p.id)}')">+ 게스트 참가 추가</button></div>`:''}
 </div>`;
}
function renderPolls72(){
 const ps=polls72().slice().sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))||String(a.time||'').localeCompare(String(b.time||'')));
 return `<div class="subhead"><b>운동 참석 투표</b>${pollAdmin72()?'<button class="btn pri" onclick="openPollCreate72()">+ 투표 만들기</button>':''}</div>${ps.length?ps.map(renderPollCard72).join(''):'<div class="empty">진행 중인 참석 투표가 없습니다.</div>'}`;
}
window.openPollCreate72=function(){
 if(!pollAdmin72())return alert('운영진 이상 권한이 필요합니다.');
 const d=typeof businessDay71==='function'?businessDay71():todayKst();
 openModal(`<h3>운동 참석 투표 만들기</h3><div class="field"><label>일자</label><input id="pollDate72" type="date" value="${esc(d)}"></div><div class="field"><label>운동 시작 시간</label><input id="pollTime72" type="time" value="19:00"></div><div class="field"><label>제목</label><input id="pollTitle72" maxlength="40" value="운동 참석 투표"></div><div class="acts"><button class="btn ghost" onclick="closeModal()">취소</button><button class="btn pri" onclick="createPoll72()">투표 시작</button></div>`);
};
window.createPoll72=async function(){
 const date=$('pollDate72')?.value||'',time=$('pollTime72')?.value||'',title=$('pollTitle72')?.value.trim()||'운동 참석 투표';
 if(!date||!time)return alert('운동 일자와 시간을 입력해주세요.');
 try{await applyV72('poll_create',{date,time,title});closeModal();goView('stats')}catch(e){showError(e)}
};
window.votePoll72=async function(id,vote){
 if(!canVote72())return alert('게스트는 투표할 수 없습니다.');
 try{await applyV72('poll_vote',{pollId:id,vote})}catch(e){showError(e)}
};
window.deletePoll72=async function(id){
 if(!pollAdmin72())return;
 if(!confirm('이 참석 투표를 삭제하시겠습니까?'))return;
 try{await applyV72('poll_delete',{pollId:id})}catch(e){showError(e)}
};
window.openPollMembers72=function(id){
 const p=polls72().find(x=>String(x.id)===String(id));if(!p)return;
 const ms=yesMembers72(p).sort((a,b)=>roleRank72(a)-roleRank72(b)||String(a.name||'').localeCompare(String(b.name||''),'ko'));
 openModal(`<h3>참석 회원 ${ms.length}명</h3><div class="note">개발자 → 모임장 → 운영진 → 임시편성자 → 일반 순으로 표시됩니다.</div>${ms.length?ms.map(m=>`<div class="pollMember72">${genderChip72(m)}<span class="pollName72">${esc(m.name)}</span><span class="tag">${esc(m.cls||'C')}</span>${roleBadge(m)}</div>`).join(''):'<div class="empty">참석을 선택한 회원이 없습니다.</div>'}<button class="btn ghost" style="width:100%;margin-top:10px" onclick="closeModal()">닫기</button>`);
};
window.openPollGuests72=function(id){
 const p=polls72().find(x=>String(x.id)===String(id));if(!p)return;const gs=guests72(p);
 openModal(`<h3>참석 게스트 ${gs.length}명</h3>${gs.length?gs.map(g=>`<div class="pollGuestRow72"><div>${genderChip72(g)} <b>${esc(g.name)}</b> <span class="tag">${esc(g.cls||'C')}</span><span class="meta"> ${esc(g.age||'30')}대</span></div>${pollAdmin72()?`<button class="miniBtn" onclick="removePollGuest72('${esc(p.id)}','${esc(g.id)}')">삭제</button>`:''}</div>`).join(''):'<div class="empty">등록된 게스트가 없습니다.</div>'}${pollAdmin72()?`<button class="btn pri" style="width:100%;margin-top:10px" onclick="closeModal();openGuestAdd72('${esc(p.id)}')">+ 게스트 참가 추가</button>`:''}<button class="btn ghost" style="width:100%;margin-top:7px" onclick="closeModal()">닫기</button>`);
};
window.openGuestAdd72=function(id){
 if(!pollAdmin72())return;
 openModal(`<h3>게스트 참가 추가</h3><div class="field"><label>이름</label><input id="pollGuestName72" maxlength="30" placeholder="게스트 이름"></div><div class="grid2"><div class="field"><label>성별</label><select id="pollGuestGender72"><option>남</option><option>여</option></select></div><div class="field"><label>연령대</label><select id="pollGuestAge72">${[10,20,30,40,50,60,70,80].map(x=>`<option value="${x}">${x}대</option>`).join('')}</select></div><div class="field"><label>급수</label><select id="pollGuestCls72">${['A','B','C','D','E'].map(x=>`<option ${x==='C'?'selected':''}>${x}</option>`).join('')}</select></div></div><div class="acts"><button class="btn ghost" onclick="closeModal()">취소</button><button class="btn pri" onclick="addPollGuest72('${esc(id)}')">참가명단 반영</button></div>`);
};
window.addPollGuest72=async function(id){
 const name=$('pollGuestName72')?.value.trim()||'';if(!name)return alert('게스트 이름을 입력해주세요.');
 try{await applyV72('poll_guest_add',{pollId:id,name,gender:$('pollGuestGender72')?.value||'남',age:$('pollGuestAge72')?.value||'30',cls:$('pollGuestCls72')?.value||'C'});closeModal();goView('stats')}catch(e){showError(e)}
};
window.removePollGuest72=async function(pid,gid){
 if(!pollAdmin72())return;
 try{await applyV72('poll_guest_remove',{pollId:pid,guestId:gid});openPollGuests72(pid)}catch(e){showError(e)}
};

const renderStats71=renderStats;
renderStats=function(){
 renderStats71();const box=$('stats');if(!box)return;
 const grid=box.querySelector('.statsGrid');if(grid){
  grid.classList.add('statsGrid72');
  grid.insertAdjacentHTML('beforeend',`<div class="stat"><b>${avgWaitMin72()}분</b>평균 게임 대기시간</div>`);
 }
 const recent=[...box.querySelectorAll(':scope > .card')].find(c=>(c.textContent||'').includes('오늘 최근 경기'));
 if(recent)recent.insertAdjacentHTML('beforebegin',renderPolls72());else box.insertAdjacentHTML('beforeend',renderPolls72());
};

/* Settings: common cards -> court settings -> reset accordion -> admin extras. */
window.toggleReset72=function(){
 const w=$('resetWrap72');if(w)w.classList.toggle('open');
};
function arrangeSettings72(){
 const box=$('settings');if(!box)return;const title=box.querySelector('.title');if(!title)return;
 [...box.querySelectorAll(':scope > .subhead')].forEach(x=>{if((x.textContent||'').includes('모임 리셋'))x.remove()});
 let cards=[...box.querySelectorAll(':scope > .card')];
 const by=t=>cards.find(c=>(c.textContent||'').includes(t));
 const current=by('현재 모임'),my=by('오늘 내 상태'),partner=box.querySelector(':scope > .partnerCard66'),court=by('코트 설정'),temp=by('당일 임시편성자'),version=by('프로그램 버전'),home=by('홈 화면에 추가');
 const resets=cards.filter(c=>c.classList.contains('resetTier40')||c.classList.contains('rosterReset60'));
 let resetWrap=null;
 if(resets.length){
  resetWrap=document.createElement('div');resetWrap.id='resetWrap72';resetWrap.className='card resetWrap72';
  resetWrap.innerHTML=`<button class="resetHead72" onclick="toggleReset72()"><b>리셋</b><span class="resetArrow72">⌄</span></button><div class="resetPanel72"></div>`;
  const panel=resetWrap.querySelector('.resetPanel72');resets.forEach(c=>panel.appendChild(c));
 }
 const reserved=new Set([current,my,partner,court,temp,version,home,...resets].filter(Boolean));
 const extras=cards.filter(c=>!reserved.has(c));
 const desired=[current,my,partner,court,resetWrap,temp,...extras,version,home].filter(Boolean);
 let cursor=title;
 desired.forEach(n=>{cursor.after(n);cursor=n});
}
const renderSettings71=renderSettings;
renderSettings=function(){
 renderSettings71();arrangeSettings72();const box=$('settings');if(!box)return;
 [...box.querySelectorAll('.meta')].forEach(el=>{if((el.textContent||'').includes('콕매치 v71'))el.textContent='콕매치 v72 · 참석투표 · 평균대기 · 설정정리'});
};

if(location.pathname.startsWith('/launch/v72'))history.replaceState(null,'','/?loaded=72');
if(me)renderAll();
})();

/* migrated into v6.0: app-v73.js */
(()=>{
const V73_API='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-v73-api';
const busy73=new Set();

function mine73(){
 if(me?.memberId){const m=M(String(me.memberId));if(m)return m}
 const n=String(me?.displayName||'').trim();
 return S.members.find(m=>String(m.name||'').trim()===n)||null;
}
function orderedMembers73(){
 const mine=mine73();if(!mine)return S.members.slice();
 return [mine,...S.members.filter(m=>String(m.id)!==String(mine.id))];
}
function businessMonth73(){
 const shifted=new Date(Date.now()-5*60*60*1000);
 return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit'}).format(shifted);
}
function attendanceHistory73(m){
 const h=m?.attendanceHistory&&typeof m.attendanceHistory==='object'&&!Array.isArray(m.attendanceHistory)?{...m.attendanceHistory}:{};
 const cm=String(m?.attendanceMonth||''),cc=Math.max(0,Number(m?.attendanceCount)||0);
 if(cm&&cc>0)h[cm]=Math.max(Number(h[cm])||0,cc);
 return h;
}
function totalAttendance73(m){return Object.values(attendanceHistory73(m)).reduce((a,v)=>a+Math.max(0,Number(v)||0),0)}
function joinText73(m){return String(m?.memberSince||'').trim()||'v73 이전 가입'}
function monthName73(k){const [y,m]=String(k).split('-');return y&&m?`${y}년 ${Number(m)}월`:String(k)}

window.openPairs=function(id){
 const m=M(id);if(!m)return;
 const h=attendanceHistory73(m),keys=Object.keys(h).sort().reverse(),total=totalAttendance73(m),current=businessMonth73();
 openModal(`<h3>${esc(m.name)} · 가입/출석 기록</h3>
  <div class="recordSummary73">
   <div><span>모임 가입</span><b>${esc(joinText73(m))}</b></div>
   <div><span>누적 출석</span><b>${total}회</b></div>
  </div>
  ${!m.memberSince?'<div class="note">기존 회원은 v73 적용 전의 정확한 가입일 데이터가 없어 임의 날짜를 만들지 않고 <b>v73 이전 가입</b>으로 표시합니다.</div>':''}
  <div class="subhead"><b>월별 출석 기록</b></div>
  ${keys.length?keys.map(k=>`<div class="attendanceRow73 ${k===current?'current':''}"><span>${esc(monthName73(k))}</span><b>${Math.max(0,Number(h[k])||0)}회</b></div>`).join(''):'<div class="empty">완료된 경기 기준 출석 기록이 아직 없습니다.</div>'}
  <div class="note" style="margin-top:9px">출석은 앱 입장이 아니라 해당 운영일에 경기를 1게임 이상 완료한 경우 하루 1회 인정됩니다.</div>
  <button class="btn ghost" style="width:100%;margin-top:10px" onclick="closeModal()">닫기</button>`);
};

function decorateMembers73(){
 const box=$('members');if(!box)return;
 const members=orderedMembers73(),cards=[...box.querySelectorAll('.memberCard')];
 cards.forEach((card,i)=>{
  const m=members[i];if(!m)return;
  card.classList.add('memberCard73');
  const info=card.querySelector('.memberInfo48')||card.children?.[1];if(!info)return;
  let rec=info.querySelector('.pairBtn:not(.partnerSetBtn66)');
  if(!rec){rec=document.createElement('button');rec.className='pairBtn recordBtn73';info.appendChild(rec)}
  rec.textContent='가입·출석 기록';rec.classList.add('recordBtn73');rec.setAttribute('onclick',`openPairs('${String(m.id).replace(/'/g,"\\'")}')`);
  const partner=info.querySelector('.partnerSetBtn66');
  let row=info.querySelector('.memberRecordActions73');
  if(!row){row=document.createElement('div');row.className='memberRecordActions73';info.appendChild(row)}
  if(rec.parentElement!==row)row.appendChild(rec);
  if(partner&&partner.parentElement!==row)row.appendChild(partner);
 });
}
const renderMembers72=renderMembers;
renderMembers=function(){renderMembers72();decorateMembers73()};

async function v73Request(action,body={}){
 const r=await fetch(V73_API,{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+T},body:JSON.stringify({action,groupId:currentGroupId,...body}),cache:'no-store'});
 const x=await r.json().catch(()=>({}));
 if(!r.ok){if(r.status===401){reloginLatest();throw new Error('로그인이 만료되었습니다.')}throw new Error(x.error||'처리에 실패했습니다.')}
 return x;
}
async function applyV73(action,body={},render=true){
 const key=action+':'+String(body.pollId||body.gameId||body.pendingId||'');
 if(busy73.has(key))return null;busy73.add(key);
 try{const x=await v73Request(action,body);if(x.data){S=x.data;normalizeClient();if(render)renderAll()}return x}finally{busy73.delete(key)}
}
const act72=act;
act=async function(action,body={},opts={}){
 if(action==='begin_game'||action==='finish_game')return applyV73(action,body,true);
 return act72(action,body,opts);
};

function autoPollTitle73(date,time,location){
 const a=String(date||'').split('-').map(Number);if(a.length!==3||!a[1]||!a[2])return '운동 참석 투표';
 const place=String(location||'').trim();return `${a[1]}월 ${a[2]}일 ${time||''}${place?' · '+place:''} 운동 참석 투표`;
}
function timeOptions73(selected='19:00'){
 const out=[];for(let h=0;h<24;h++)for(const m of [0,30]){const v=`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;out.push(`<option value="${v}" ${v===selected?'selected':''}>${v}</option>`)}return out.join('');
}
window.syncPollTitle73=function(force=false){
 const title=$('pollTitle72'),date=$('pollDate72')?.value||'',time=$('pollTime72')?.value||'',location=$('pollLocation73')?.value.trim()||'';if(!title)return;
 if(force||title.dataset.manual!=='1')title.value=autoPollTitle73(date,time,location);
};
window.openPollCreate72=function(){
 if(!(me?.globalAdmin||me?.role==='manager'||me?.role==='organizer'))return alert('운영진 이상 권한이 필요합니다.');
 const d=todayKst();
 openModal(`<h3>운동 참석 투표 만들기</h3>
  <div class="field"><label>일자</label><input id="pollDate72" type="date" value="${esc(d)}"></div>
  <div class="field"><label>운동 시작 시간</label><select id="pollTime72">${timeOptions73('19:00')}</select><div class="meta">30분 단위로 선택합니다.</div></div>
  <div class="field"><label>운동 장소</label><input id="pollLocation73" maxlength="40" placeholder="예: 동탄체육센터"></div>
  <div class="field"><label>투표 제목</label><input id="pollTitle72" maxlength="60" value="${esc(autoPollTitle73(d,'19:00',''))}"><div class="meta">일자·시간·장소를 바꾸면 제목이 자동 작성됩니다. 제목은 직접 지우거나 자유롭게 수정할 수 있습니다.</div></div>
  <div class="acts"><button class="btn ghost" onclick="closeModal()">취소</button><button class="btn pri" onclick="createPoll72()">투표 시작</button></div>`);
 const title=$('pollTitle72');if(title)title.dataset.manual='0';
 $('pollDate72')?.addEventListener('change',()=>syncPollTitle73());
 $('pollTime72')?.addEventListener('change',()=>syncPollTitle73());
 $('pollLocation73')?.addEventListener('input',()=>syncPollTitle73());
 title?.addEventListener('input',()=>{title.dataset.manual='1'});
};
window.createPoll72=async function(){
 const date=$('pollDate72')?.value||'',time=$('pollTime72')?.value||'',location=$('pollLocation73')?.value.trim()||'';
 if(!date||!time)return alert('운동 일자와 시간을 선택해주세요.');if(!location)return alert('운동 장소를 입력해주세요.');
 let title=$('pollTitle72')?.value.trim()||'';if(!title)title=autoPollTitle73(date,time,location);
 try{await applyV73('poll_create',{date,time,location,title});closeModal();goView('stats')}catch(e){showError(e)}
};
function decoratePolls73(){
 const box=$('stats');if(!box)return;
 const ps=(Array.isArray(S.attendancePolls)?S.attendancePolls:[]).slice().sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))||String(a.time||'').localeCompare(String(b.time||'')));
 [...box.querySelectorAll('.pollCard72')].forEach((card,i)=>{
  const p=ps[i];if(!p||!p.location)return;
  const when=card.querySelector('.pollWhen72');if(when&&!card.querySelector('.pollLocation73'))when.insertAdjacentHTML('afterend',`<div class="pollLocation73">📍 ${esc(p.location)}</div>`);
 });
}
const renderStats72=renderStats;
renderStats=function(){renderStats72();decoratePolls73()};

function patchResetText73(box){
 [...box.querySelectorAll('.resetTier40,.rosterReset60')].forEach(card=>{
  const t=card.textContent||'';
  if(t.includes('가. 당일 게임 기록')){
   const d=card.querySelector('.meta,.warn');if(d)d.innerHTML='현재 모임의 개인대기·편성대기·진행중 경기·오늘 경기기록·참가상태를 초기화하고 이 모임 로그인세션을 종료합니다.<br><b>회원명부, 월간 출석 횟수와 월별 누적 출석기록은 유지</b>합니다.';
  }else if(t.includes('나. 누적기록 포함')){
   const d=card.querySelector('.meta,.warn');if(d)d.innerHTML='가 항목의 초기화에 더해 회원별 <b>월간 출석 횟수와 월별 누적 출석기록</b>, 같이한 경기 누적기록을 초기화하고 당일 파트너 설정도 해제합니다.<br><b>회원명단·역할·모임 가입일은 유지</b>합니다.';
  }else if(t.includes('다. 회원정보 전체 정리')){
   const d=card.querySelector('.warn,.meta');if(d)d.innerHTML='현재 모임에서 <b>개발자와 모임장만 남기고</b> 운영진·일반·게스트 정보를 삭제합니다. 게임·대기·월간/누적 출석기록도 함께 초기화됩니다.<br>다른 모임에는 영향을 주지 않습니다.';
  }
 });
}
const renderSettings72=renderSettings;
renderSettings=function(){
 renderSettings72();const box=$('settings');if(!box)return;patchResetText73(box);
 [...box.querySelectorAll('.meta')].forEach(el=>{if((el.textContent||'').includes('콕매치 v72'))el.textContent='콕매치 v73 · 가입/출석 기록 · 30분 투표시간 · 장소/자동제목'});
};

if(location.pathname.startsWith('/launch/v73'))history.replaceState(null,'','/?loaded=73');
if(me)renderAll();
})();

/* migrated into v6.0: app-v74.js */
(()=>{
const POLL74_API='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-v73-api';
function today74(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())}
function formatJoin74(v){const s=String(v||today74());const a=s.split('-').map(Number);return a.length===3&&a[0]?`${a[0]}년 ${a[1]}월 ${a[2]}일`:s}
function history74(m){
 const h=m?.attendanceHistory&&typeof m.attendanceHistory==='object'&&!Array.isArray(m.attendanceHistory)?{...m.attendanceHistory}:{};
 const cm=String(m?.attendanceMonth||''),cc=Math.max(0,Number(m?.attendanceCount)||0);
 if(cm&&cc>0)h[cm]=Math.max(Number(h[cm])||0,cc);
 return h;
}
function groupedAttendance74(m){
 const h=history74(m),years={};
 Object.entries(h).forEach(([k,v])=>{const [y,mo]=String(k).split('-');if(!/^\d{4}$/.test(y)||!/^\d{2}$/.test(mo))return;(years[y]||(years[y]=[])).push({month:Number(mo),count:Math.max(0,Number(v)||0)})});
 Object.values(years).forEach(arr=>arr.sort((a,b)=>a.month-b.month));
 return Object.entries(years).sort((a,b)=>Number(b[0])-Number(a[0]));
}
function totalAttendance74(m){return Object.values(history74(m)).reduce((a,v)=>a+Math.max(0,Number(v)||0),0)}
window.openPairs=function(id){
 const m=M(id);if(!m)return;const groups=groupedAttendance74(m),total=totalAttendance74(m),currentYear=today74().slice(0,4);
 openModal(`<h3>${esc(m.name)} · 가입/출석 기록</h3>
  <div class="recordSummary73 recordSummary74"><div><span>모임 가입</span><b>${esc(formatJoin74(m.memberSince))}</b></div><div><span>누적 출석</span><b>${total}회</b></div></div>
  <div class="subhead"><b>연도별 · 월별 출석 기록</b></div>
  ${groups.length?groups.map(([year,months])=>`<div class="attendanceYear74 ${year===currentYear?'current':''}"><div class="attendanceYearHead74"><b>${esc(year)}년</b><span>${months.reduce((a,x)=>a+x.count,0)}회</span></div><div class="attendanceMonths74">${months.map(x=>`<div class="attendanceMonth74"><span>${x.month}월</span><b>${x.count}회</b></div>`).join('')}</div></div>`).join(''):'<div class="empty">완료된 경기 기준 출석 기록이 아직 없습니다.</div>'}
  <div class="note" style="margin-top:9px">출석은 앱 입장이 아니라 해당 운영일에 경기를 1게임 이상 완료한 경우 하루 1회 인정됩니다.</div>
  <button class="btn ghost" style="width:100%;margin-top:10px" onclick="closeModal()">닫기</button>`);
};

function autoPollTitle74(date,time,location){const a=String(date||'').split('-').map(Number);if(a.length!==3||!a[1]||!a[2])return '참석투표';const place=String(location||'').trim();return `${a[1]}월 ${a[2]}일 ${time||''}${place?' '+place:''} 참석투표`}
function timeOptions74(selected='19:00'){const out=[];for(let h=0;h<24;h++)for(const m of [0,30]){const v=`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;out.push(`<option value="${v}" ${v===selected?'selected':''}>${v}</option>`)}return out.join('')}
async function createPollRequest74(body){
 const r=await fetch(POLL74_API,{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+T},body:JSON.stringify({action:'poll_create',groupId:currentGroupId,...body}),cache:'no-store'});
 const x=await r.json().catch(()=>({}));
 if(!r.ok){if(r.status===401){reloginLatest();throw new Error('로그인이 만료되었습니다.')}throw new Error(x.error||'투표 생성에 실패했습니다.')}
 if(x.data){S=x.data;normalizeClient();renderAll()}
 return x;
}
window.syncPollTitle74=function(force=false){const title=$('pollTitle72'),date=$('pollDate72')?.value||'',time=$('pollTime72')?.value||'',location=$('pollLocation73')?.value.trim()||'';if(!title)return;if(force||title.dataset.manual!=='1')title.value=autoPollTitle74(date,time,location)};
window.openPollCreate72=function(){
 if(!(me?.globalAdmin||me?.role==='manager'||me?.role==='organizer'))return alert('운영진 이상 권한이 필요합니다.');
 const d=today74();
 openModal(`<h3>운동 참석 투표 만들기</h3><div class="pollCreateForm74">
  <div class="field"><label>일자</label><input id="pollDate72" type="date" value="${esc(d)}"></div>
  <div class="field"><label>운동 시작 시간</label><select id="pollTime72">${timeOptions74('19:00')}</select><div class="meta">30분 단위로 선택합니다.</div></div>
  <div class="field"><label>운동 장소</label><input id="pollLocation73" maxlength="40" placeholder="신리천 2코트"></div>
  <div class="field"><label>투표 제목</label><input id="pollTitle72" maxlength="60" value="${esc(autoPollTitle74(d,'19:00',''))}"><div class="meta">설정한 일자 · 시간 · 장소를 기준으로 자동 작성되며, 원하는 제목으로 자유롭게 수정할 수 있습니다.</div></div>
  <div class="acts"><button class="btn ghost" onclick="closeModal()">취소</button><button class="btn pri" onclick="createPoll72()">투표 시작</button></div></div>`);
 const title=$('pollTitle72');if(title)title.dataset.manual='0';
 $('pollDate72')?.addEventListener('change',()=>syncPollTitle74());$('pollTime72')?.addEventListener('change',()=>syncPollTitle74());$('pollLocation73')?.addEventListener('input',()=>syncPollTitle74());title?.addEventListener('input',()=>{title.dataset.manual='1'});
};
window.createPoll72=async function(){
 const date=$('pollDate72')?.value||'',time=$('pollTime72')?.value||'',location=$('pollLocation73')?.value.trim()||'';
 if(!date||!time)return alert('운동 일자와 시간을 선택해주세요.');if(!location)return alert('운동 장소를 입력해주세요.');
 let title=$('pollTitle72')?.value.trim()||'';if(!title)title=autoPollTitle74(date,time,location);
 try{await createPollRequest74({date,time,location,title});closeModal();goView('stats')}catch(e){showError(e)}
};

const renderSettings73=renderSettings;
renderSettings=function(){renderSettings73();const box=$('settings');if(!box)return;[...box.querySelectorAll('.meta')].forEach(el=>{if((el.textContent||'').includes('콕매치 v73'))el.textContent='콕매치 v74 · 회원정보 좌측정렬 · 연도별출석 · 투표폼 개선'})};
if(location.pathname.startsWith('/launch/v74'))history.replaceState(null,'','/?loaded=74');
if(me)renderAll();
})();

/* migrated into v6.0: app-v75.js */
(()=>{
const VERSION75=75;
let checkBusy75=false,pendingLatest75=0,refreshing75=false,retryTimer75=0;

function currentVersion75(){return Number(document.documentElement?.dataset?.kokmatchVersion||VERSION75)||VERSION75}
function safeToRefresh75(){
 if(document.hidden)return false;
 if(document.querySelector('#modal.on'))return false;
 const a=document.activeElement;if(a&&/^(INPUT|SELECT|TEXTAREA)$/i.test(a.tagName))return false;
 if(typeof draft!=='undefined'&&Array.isArray(draft)&&draft.filter(Boolean).length)return false;
 return true;
}
async function latest75(){
 const r=await fetch(`/latest-version.json?fresh=${Date.now()}`,{cache:'no-store',headers:{'cache-control':'no-cache, no-store','pragma':'no-cache'}});
 if(!r.ok)throw new Error('latest version unavailable');
 const x=await r.json().catch(()=>({}));return Math.max(1,Number(x?.version)||currentVersion75());
}
async function targetReady75(v){
 try{const r=await fetch(`/refresh/v${v}.html?probe=${Date.now()}`,{method:'GET',cache:'no-store',headers:{'cache-control':'no-cache, no-store','pragma':'no-cache'}});return r.ok}catch{return false}
}
function saveRefresh75(){try{if(typeof saveRefreshState==='function')saveRefreshState()}catch{} }
async function purge75(){
 try{if('caches'in window){const ks=await caches.keys();await Promise.all(ks.map(k=>caches.delete(k)))}}catch{}
 try{if('serviceWorker'in navigator){const rs=await navigator.serviceWorker.getRegistrations();await Promise.all(rs.map(r=>r.unregister().catch(()=>{})))}}catch{}
}
async function refreshTo75(v){
 if(refreshing75||v<=currentVersion75())return;
 refreshing75=true;
 try{
  if(!(await targetReady75(v))){refreshing75=false;pendingLatest75=v;scheduleRetry75();return}
  saveRefresh75();await purge75();
  location.replace(`/refresh/v${v}.html?fresh=${Date.now()}&auto=1&from=${currentVersion75()}`);
 }catch(e){console.warn('auto refresh v75',e);refreshing75=false;pendingLatest75=v;scheduleRetry75()}
}
function scheduleRetry75(){
 clearTimeout(retryTimer75);
 retryTimer75=setTimeout(()=>{
  if(pendingLatest75>currentVersion75()&&safeToRefresh75())refreshTo75(pendingLatest75);
  else if(pendingLatest75>currentVersion75())scheduleRetry75();
 },1200);
}
async function check75(){
 if(checkBusy75||refreshing75)return;checkBusy75=true;
 try{
  const v=await latest75(),cur=currentVersion75();
  if(v>cur){pendingLatest75=Math.max(pendingLatest75,v);if(safeToRefresh75())await refreshTo75(pendingLatest75);else scheduleRetry75()}
 }catch(e){console.warn('version check v75',e)}finally{checkBusy75=false}
}

document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(check75,120)});
window.addEventListener('focus',()=>setTimeout(check75,120));
setTimeout(check75,1200);
setInterval(check75,10000);

const renderSettings74=renderSettings;
renderSettings=function(){
 renderSettings74();const box=$('settings');if(!box)return;
 [...box.querySelectorAll('.meta')].forEach(el=>{if((el.textContent||'').includes('콕매치 v74'))el.textContent='콕매치 v75 · 자동 최신버전 감지/새로고침 안정화'});
};
if(location.pathname.startsWith('/launch/v75'))history.replaceState(null,'','/?loaded=75');
if(me)renderAll();
})();

/* migrated into v6.0: app-v76.js */
(()=>{
const V76_API='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-v73-api';

function pollAdmin76(){return !!me&&(me.globalAdmin||me.role==='manager'||me.role==='organizer')}
function pollList76(){S.attendancePolls=Array.isArray(S.attendancePolls)?S.attendancePolls:[];return S.attendancePolls}
function votes76(p){return p?.memberVotes&&typeof p.memberVotes==='object'?p.memberVotes:{}}
function yesMembers76(p){return Object.keys(votes76(p)).filter(id=>votes76(p)[id]==='yes').map(M).filter(m=>m&&m.type!=='guest')}
function roleRank76(m){const r=roleOf(m);if(r==='admin')return 0;if(r==='manager')return 1;if(r==='organizer')return 2;if(isTemp(m))return 3;return 4}
function genderChip76(m){const f=m?.gender==='여';return `<span class="pollGender72 ${f?'female':'male'}">${f?'여':'남'}</span>`}
function dateWeekday76(v){
 const a=String(v||'').split('-').map(Number);if(a.length!==3||!a[0]||!a[1]||!a[2])return '-';
 const d=new Date(Date.UTC(a[0],a[1]-1,a[2]));return ['일','월','화','수','목','금','토'][d.getUTCDay()]+'요일';
}
function today76(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())}
function autoTitle76(date,time,location){const a=String(date||'').split('-').map(Number);if(a.length!==3||!a[1]||!a[2])return '참석투표';const place=String(location||'').trim();return `${a[1]}월 ${a[2]}일 ${time||''}${place?' '+place:''} 참석투표`}
function timeOptions76(selected='18:30'){const out=[];for(let h=0;h<24;h++)for(const m of [0,30]){const v=`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;out.push(`<option value="${v}" ${v===selected?'selected':''}>${v}</option>`)}return out.join('')}

async function request76(action,body={}){
 const r=await fetch(V76_API,{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+T},body:JSON.stringify({action,groupId:currentGroupId,...body}),cache:'no-store'});
 const x=await r.json().catch(()=>({}));
 if(!r.ok){if(r.status===401){reloginLatest();throw new Error('로그인이 만료되었습니다.')}throw new Error(x.error||'처리에 실패했습니다.')}
 if(x.data){S=x.data;normalizeClient();renderAll()}
 return x;
}

window.syncPollDate76=function(){const el=$('pollWeekday76');if(el)el.textContent=dateWeekday76($('pollDate72')?.value||'')};
window.syncPollTitle76=function(force=false){
 const title=$('pollTitle72'),date=$('pollDate72')?.value||'',time=$('pollTime72')?.value||'',location=$('pollLocation73')?.value.trim()||'';if(!title)return;
 if(force||title.dataset.manual!=='1')title.value=autoTitle76(date,time,location);
};
window.openPollCreate72=function(){
 if(!pollAdmin76())return alert('운영진 이상 권한이 필요합니다.');
 const d=today76(),time='18:30';
 openModal(`<h3>운동 참석 투표 만들기</h3><div class="pollCreateForm74">
  <div class="field"><label>일자</label><div class="pollDateRow76"><input id="pollDate72" type="date" value="${esc(d)}"><span id="pollWeekday76" class="pollWeekday76">${dateWeekday76(d)}</span></div></div>
  <div class="field"><label>운동 시작 시간</label><select id="pollTime72">${timeOptions76(time)}</select><div class="meta">30분 단위로 선택합니다.</div></div>
  <div class="field"><label>운동 장소</label><input id="pollLocation73" maxlength="40" placeholder="예: 신리천 2코트"></div>
  <div class="field"><label>투표 제목</label><input id="pollTitle72" maxlength="60" value="${esc(autoTitle76(d,time,''))}"><div class="meta">설정한 일자 · 시간 · 장소를 기준으로 자동 작성되며, 원하는 제목으로 자유롭게 수정할 수 있습니다.</div></div>
  <div class="acts"><button class="btn ghost" onclick="closeModal()">취소</button><button class="btn pri" onclick="createPoll72()">투표 시작</button></div></div>`);
 const title=$('pollTitle72');if(title)title.dataset.manual='0';
 $('pollDate72')?.addEventListener('change',()=>{syncPollDate76();syncPollTitle76()});
 $('pollTime72')?.addEventListener('change',()=>syncPollTitle76());
 $('pollLocation73')?.addEventListener('input',()=>syncPollTitle76());
 title?.addEventListener('input',()=>{title.dataset.manual='1'});
};
window.createPoll72=async function(){
 const date=$('pollDate72')?.value||'',time=$('pollTime72')?.value||'',location=$('pollLocation73')?.value.trim()||'';
 if(!date||!time)return alert('운동 일자와 시간을 선택해주세요.');if(!location)return alert('운동 장소를 입력해주세요.');
 let title=$('pollTitle72')?.value.trim()||'';if(!title)title=autoTitle76(date,time,location);
 try{await request76('poll_create',{date,time,location,title});closeModal();goView('stats')}catch(e){showError(e)}
};

window.openPollMembers72=function(id){
 const p=pollList76().find(x=>String(x.id)===String(id));if(!p)return;
 const ms=yesMembers76(p).sort((a,b)=>roleRank76(a)-roleRank76(b)||String(a.name||'').localeCompare(String(b.name||''),'ko'));
 openModal(`<h3>참석 회원 ${ms.length}명</h3>${ms.length?ms.map(m=>`<div class="pollMember72 pollMember76">${genderChip76(m)}<span class="pollName72">${esc(m.name)}</span>${ageTag(m)}${roleBadge(m)}</div>`).join(''):'<div class="empty">참석을 선택한 회원이 없습니다.</div>'}<button class="btn ghost" style="width:100%;margin-top:10px" onclick="closeModal()">닫기</button>`);
};

function cleanPollCards76(){
 const box=$('stats');if(!box)return;
 [...box.querySelectorAll('.pollCard72')].forEach(card=>{
  const meta=card.querySelector('.pollHead72 .meta');if(meta&&/^개설\s/.test((meta.textContent||'').trim()))meta.remove();
 });
}
const renderStats75=renderStats;
renderStats=function(){renderStats75();cleanPollCards76()};

const renderSettings75=renderSettings;
renderSettings=function(){renderSettings75();const box=$('settings');if(!box)return;[...box.querySelectorAll('.meta')].forEach(el=>{if((el.textContent||'').includes('콕매치 v75'))el.textContent='콕매치 v76 · 회원명부 정보구역 정리 · 투표 요일/회원표시 개선'})};
if(location.pathname.startsWith('/launch/v76'))history.replaceState(null,'','/?loaded=76');
if(me)renderAll();
})();

/* migrated into v6.0: app-v77.js */
(()=>{
const renderSettings76=renderSettings;
renderSettings=function(){
  renderSettings76();
  const box=$('settings');if(!box)return;
  [...box.querySelectorAll('.meta')].forEach(el=>{
    if((el.textContent||'').includes('콕매치 v76'))el.textContent='콕매치 v77 · 회원명부 프로필/정보 위치 조정';
  });
};
if(location.pathname.startsWith('/launch/v77'))history.replaceState(null,'','/?loaded=77');
if(me)renderAll();
})();

/* migrated into v6.0: app-v78.js */
(()=>{
const renderSettings77=renderSettings;
renderSettings=function(){
  renderSettings77();
  const box=$('settings');if(!box)return;
  [...box.querySelectorAll('.meta')].forEach(el=>{
    if((el.textContent||'').includes('콕매치 v77'))el.textContent='콕매치 v78 · 회원명부 카드 공백 균형 조정';
  });
};
if(location.pathname.startsWith('/launch/v78'))history.replaceState(null,'','/?loaded=78');
if(me)renderAll();
})();

/* migrated into v6.0: app-v79.js */
(()=>{
const renderSettings78=renderSettings;
renderSettings=function(){
  renderSettings78();
  const box=$('settings');if(!box)return;
  [...box.querySelectorAll('.meta')].forEach(el=>{
    if((el.textContent||'').includes('콕매치 v78'))el.textContent='콕매치 v79 · 회원명부 정보블록 세로 위치 미세조정';
  });
};
if(location.pathname.startsWith('/launch/v79'))history.replaceState(null,'','/?loaded=79');
if(me)renderAll();
})();

/* migrated into v6.0: app-v80.js */
(()=>{
const renderSettings79=renderSettings;
renderSettings=function(){
  renderSettings79();
  const box=$('settings');if(!box)return;
  [...box.querySelectorAll('.meta')].forEach(el=>{
    if((el.textContent||'').includes('콕매치 v79'))el.textContent='콕매치 v80 · 개인 게임대기 프로필/정보 배열 개선';
  });
};
if(location.pathname.startsWith('/launch/v80'))history.replaceState(null,'','/?loaded=80');
if(me)renderAll();
})();

/* migrated into v6.0: app-v81.js */
(()=>{
const renderSettings80=renderSettings;
renderSettings=function(){
  renderSettings80();
  const box=$('settings');if(!box)return;
  [...box.querySelectorAll('.meta')].forEach(el=>{
    if((el.textContent||'').includes('콕매치 v80'))el.textContent='콕매치 v81 · 개인대기 이름/대기시간 정리 · 편성대기 가독성 개선';
  });
};
if(location.pathname.startsWith('/launch/v81'))history.replaceState(null,'','/?loaded=81');
if(me)renderAll();
})();

/* migrated into v6.0: app-v82.js */
(()=>{
const PARTNER82='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-v66-api';
let partnerTarget82='',partnerSelected82='';

function businessDay82(){const shifted=new Date(Date.now()-5*60*60*1000);return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(shifted)}
function validPartnerDay82(day){const d=String(day||''),b=businessDay82(),c=todayKst();return d===b||(b!==c&&d===c)}
function preparePartnerCompat82(){const b=businessDay82(),c=todayKst();if(b===c||!S?.members)return;for(const m of S.members){if(m?.partnerId&&String(m.partnerDay||'')===b)m.partnerDay=c}}
function partner82(m){if(!m||!m.partnerId||!validPartnerDay82(m.partnerDay))return null;const p=M(String(m.partnerId));return p?{id:String(p.id),name:String(p.name||''),member:p}:null}
function canSetPartner82(m){return !!m&&!!me&&(String(me.memberId||'')===String(m.id)||me.globalAdmin||me.role==='manager'||me.role==='organizer')}
function memberLabel82(m){if(!m)return '-';return `${String(m.name||'-')} ${String(m.age||'')}${String(m.cls||'')}${String(m.gender||'')}`.trim()}
function roleText82(m){if(!m)return'';if(m.type==='guest')return'게스트';const r=roleOf(m);return r==='admin'?'개발자':r==='manager'?'모임장':r==='organizer'?'운영진':isTemp(m)?'임시편성자':'일반'}

async function partnerRequest82(action,body={}){
 const r=await fetch(PARTNER82,{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+T},body:JSON.stringify({action,groupId:currentGroupId,...body}),cache:'no-store'});
 const x=await r.json().catch(()=>({}));
 if(!r.ok){if(r.status===401){reloginLatest();throw new Error('로그인이 만료되었습니다.')}throw new Error(x.error||'파트너 처리에 실패했습니다.')}
 return x;
}
function partnerResultHtml82(q){
 const target=M(partnerTarget82),query=String(q||'').trim().toLowerCase();
 if(!query)return '<div class="partnerSearchHint82">이름을 입력하면 조회 결과가 표시됩니다.</div>';
 const rows=(S.members||[]).filter(m=>String(m.id)!==String(target?.id)&&String(m.name||'').toLowerCase().includes(query)).sort((a,b)=>{const an=String(a.name||'').toLowerCase(),bn=String(b.name||'').toLowerCase(),as=an.startsWith(query)?0:1,bs=bn.startsWith(query)?0:1;return as-bs||an.localeCompare(bn,'ko')}).slice(0,12);
 if(!rows.length)return '<div class="partnerSearchHint82">일치하는 회원이 없습니다.</div>';
 return rows.map(m=>`<button type="button" class="choiceBtn partnerSearchRow82" onclick="partnerChoose82('${esc(String(m.id))}')"><b>${esc(m.name)}</b><span class="meta">${esc(String(m.age||''))}${esc(String(m.cls||''))} · ${esc(String(m.gender||''))} · ${esc(roleText82(m))}</span></button>`).join('');
}
function updatePartnerPicked82(){const box=$('partnerPicked82');if(!box)return;const p=partnerSelected82?M(partnerSelected82):null;box.innerHTML=p?`<div class="partnerPickedCard82"><div><b>선택된 파트너</b><div class="meta">${esc(memberLabel82(p))} · ${esc(roleText82(p))}</div></div><button type="button" class="btn ghost" onclick="partnerClear82()">선택 해제</button></div>`:'<div class="partnerPickedNone82">선택된 파트너 없음</div>'}
window.partnerSearch82=function(v){const box=$('partnerResults82');if(box)box.innerHTML=partnerResultHtml82(v)};
window.partnerChoose82=function(id){partnerSelected82=String(id||'');updatePartnerPicked82();const input=$('partnerSearchInput82');if(input)input.value='';const box=$('partnerResults82');if(box)box.innerHTML='<div class="partnerSearchHint82">선택 완료 · 다른 이름을 검색하면 변경할 수 있습니다.</div>'};
window.partnerClear82=function(){partnerSelected82='';updatePartnerPicked82()};
window.openPartner66=function(id){preparePartnerCompat82();const m=M(String(id));if(!m)return;if(!canSetPartner82(m))return alert('본인 또는 관리 가능한 회원의 파트너만 설정할 수 있습니다.');const cur=partner82(m);partnerTarget82=String(m.id);partnerSelected82=cur?.id||'';openModal(`<h3>${esc(m.name)} · 오늘 파트너 설정</h3><div class="note">당일 운영 기준의 1:1 파트너입니다. 상대 회원에게도 서로 파트너로 표시되며, 기존 파트너가 있으면 교체됩니다. 자동 해제 기준은 <b>새벽 5시</b>입니다.</div><div class="field"><label>파트너 이름 검색</label><input id="partnerSearchInput82" autocomplete="off" placeholder="이름 입력 후 조회" oninput="partnerSearch82(this.value)"></div><div id="partnerResults82" class="partnerResults82"><div class="partnerSearchHint82">이름을 입력하면 조회 결과가 표시됩니다.</div></div><div id="partnerPicked82" class="partnerPicked82"></div><div class="meta partnerResetInfo82">새벽 5시가 되면 파트너 설정이 자동 해제됩니다.<br>리셋의 <b>나. 누적기록 포함 초기화</b> 또는 <b>다. 회원정보 전체 정리 초기화</b>에서도 해제됩니다.</div><div class="acts"><button class="btn ghost" onclick="closeModal()">취소</button><button class="btn pri" onclick="savePartner66('${esc(String(m.id))}')">저장</button></div>`);setTimeout(updatePartnerPicked82,0)};
window.savePartner66=async function(id){try{const x=await partnerRequest82('partner_set',{memberId:String(id),partnerId:partnerSelected82});if(x.data){S=x.data;normalizeClient();preparePartnerCompat82()}closeModal();renderAll()}catch(e){showError(e)}};

const renderMembers81=renderMembers;
renderMembers=function(){preparePartnerCompat82();return renderMembers81()};
const renderQueue81=renderQueue;
renderQueue=function(){preparePartnerCompat82();return renderQueue81()};
if(typeof renderPlaying==='function'){const renderPlaying81=renderPlaying;renderPlaying=function(){preparePartnerCompat82();return renderPlaying81()}}
const draftClick81=draftClick;
draftClick=function(id){preparePartnerCompat82();return draftClick81(id)};
const recommendDraft81=recommendDraft;
recommendDraft=function(){preparePartnerCompat82();return recommendDraft81()};

const renderSettings81=renderSettings;
renderSettings=function(){
 preparePartnerCompat82();renderSettings81();const box=$('settings');if(!box)return;
 [...box.querySelectorAll('.meta')].forEach(el=>{let t=el.textContent||'';if(t.includes('자정 자동 해제'))el.textContent=t.replace(/자정 자동 해제/g,'새벽 5시 자동 해제');if(t.includes('콕매치 v81'))el.textContent='콕매치 v82 · 새벽5시 파트너/게스트 정리 · 파트너검색 · 가독성 개선'});
};

if(location.pathname.startsWith('/launch/v82'))history.replaceState(null,'','/?loaded=82');
preparePartnerCompat82();if(me)renderAll();
})();

/* migrated into v6.0: app-v83.js */
(()=>{
const ROLE_REPLACE83=[['임시편성자','편성자'],['운영진','운영진'],['모임장','모임장'],['일반','일반']];

roleLabel=function(r){return r==='admin'?'개발자':r==='manager'?'모임장':r==='organizer'?'운영진':'일반'};

function translateString83(v){let s=String(v??'');for(const [a,b] of ROLE_REPLACE83)s=s.split(a).join(b);return s}
function translateNode83(root){
 if(!root)return;
 const apply=t=>{if(!t||!t.nodeValue)return;const p=t.parentElement;if(p&&['SCRIPT','STYLE'].includes(p.tagName))return;const n=translateString83(t.nodeValue);if(n!==t.nodeValue)t.nodeValue=n};
 if(root.nodeType===Node.TEXT_NODE){apply(root);return}
 if(root.nodeType!==Node.ELEMENT_NODE&&root.nodeType!==Node.DOCUMENT_NODE)return;
 const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(n){const p=n.parentElement;return p&&['SCRIPT','STYLE'].includes(p.tagName)?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT}});
 let n;while((n=w.nextNode()))apply(n);
}
const roleObserver83=new MutationObserver(ms=>{
 for(const m of ms){
  if(m.type==='characterData')translateNode83(m.target);
  else for(const n of m.addedNodes)translateNode83(n);
 }
});
roleObserver83.observe(document.documentElement,{subtree:true,childList:true,characterData:true});

function businessDay83(){
 const shifted=new Date(Date.now()-5*60*60*1000);
 return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(shifted);
}
function orderedMembers83(){
 const mine=me?.memberId?M(String(me.memberId)):null;
 if(!mine)return S.members.slice();
 return [mine,...S.members.filter(m=>String(m.id)!==String(mine.id))];
}
function relation83(m){
 if(!m)return'';
 const b=businessDay83(),c=todayKst(),d=String(m.partnerDay||'');
 if(m.partnerId&&(d===b||(b!==c&&d===c))){
  const p=M(String(m.partnerId));
  if(p)return `파트너 ${String(p.name||m.partnerName||'').trim()}`.trim();
 }
 const inv=m.type==='guest'?String(m.inviter||'').trim():'';
 return inv?`초대 ${inv}`:'';
}
function decorateMembers83(){
 const box=$('members');if(!box)return;
 const members=orderedMembers83(),cards=[...box.querySelectorAll('.memberCard')];
 cards.forEach((card,i)=>{
  const m=members[i];if(!m)return;
  const info=card.querySelector('.memberInfo48')||card.children?.[1];if(!info)return;
  const main=info.querySelector('.memberMainLine45')||info.querySelector('.name');
  const meta=info.querySelector('.memberMeta71')||info.querySelector('.meta');
  if(meta)meta.querySelectorAll('.relationInfo66,.inviteInfo45').forEach(x=>x.remove());
  info.querySelectorAll('.memberRelation83').forEach(x=>x.remove());
  const rel=relation83(m);
  if(rel&&main){
   const row=document.createElement('div');row.className='memberRelation83';row.textContent=rel;
   main.insertAdjacentElement('afterend',row);
  }
 });
 translateNode83(box);
}
const renderMembers82=renderMembers;
renderMembers=function(){renderMembers82();decorateMembers83()};

const renderSettings82=renderSettings;
renderSettings=function(){
 renderSettings82();const box=$('settings');if(!box)return;
 [...box.querySelectorAll('.meta')].forEach(el=>{
  if((el.textContent||'').includes('콕매치 v82'))el.textContent='콕매치 v83 · 역할명칭 정리 · 회원명부 관계정보 재배치 · 게임중 이름영역 확장';
 });
 translateNode83(box);
};

if(location.pathname.startsWith('/launch/v83'))history.replaceState(null,'','/?loaded=83');
translateNode83(document.documentElement);
if(me)renderAll();
})();

/* migrated into v6.0: app-v84.js */
(()=>{
function canSeeGlobal84(){
 const mode=String(S?.adminBadgeVisibility||'all');
 if(me?.globalAdmin)return true;
 if(mode==='all')return true;
 if(mode==='staff')return me?.role==='manager'||me?.role==='organizer';
 return false;
}

roleBadge=function(m){
 const r=roleOf(m);
 const globalLike=r==='admin'||(me?.globalAdmin&&m?.name===me.displayName);
 if(globalLike){
  return canSeeGlobal84()
   ? '<span class="roleBadge role-global">개발자</span>'
   : '<span class="roleBadge role-member44">일반</span>';
 }
 if(r==='manager')return '<span class="roleBadge role-manager">모임장</span>';
 if(r==='organizer')return '<span class="roleBadge role-organizer">운영진</span>';
 if(isTemp(m))return '<span class="roleBadge role-temp">편성자</span>';
 return '<span class="roleBadge role-member44">일반</span>';
};

function sourceMembers84(){
 const mid=String(me?.memberId||'');
 if(mid){const mine=M(mid);if(mine)return [mine,...S.members.filter(m=>String(m.id)!==mid)]}
 const name=String(me?.displayName||'').trim();
 const mine=S.members.find(m=>String(m.name||'').trim()===name);
 return mine?[mine,...S.members.filter(m=>String(m.id)!==String(mine.id))]:S.members.slice();
}
function isMine84(m){
 if(!m)return false;
 if(me?.memberId&&String(m.id)===String(me.memberId))return true;
 return !me?.memberId&&String(m.name||'').trim()===String(me?.displayName||'').trim();
}
function rank84(m){
 if(isMine84(m))return -100;
 const r=roleOf(m);
 if(r==='admin')return canSeeGlobal84()?0:4;
 if(r==='manager')return 1;
 if(r==='organizer')return 2;
 if(isTemp(m))return 3;
 return 4;
}
function reorderMemberCards84(){
 const box=$('members');if(!box)return;
 const cards=[...box.querySelectorAll('.memberCard')];
 const src=sourceMembers84();
 if(!cards.length||cards.length!==src.length)return;
 const parent=cards[0].parentElement;if(!parent)return;
 cards.map((card,i)=>({card,m:src[i],i}))
  .sort((a,b)=>rank84(a.m)-rank84(b.m)||a.i-b.i)
  .forEach(x=>parent.appendChild(x.card));
}

const renderMembers83=renderMembers;
renderMembers=function(){
 renderMembers83();
 reorderMemberCards84();
};

const renderSettings83=renderSettings;
renderSettings=function(){
 renderSettings83();const box=$('settings');if(!box)return;
 [...box.querySelectorAll('.meta')].forEach(el=>{
  if((el.textContent||'').includes('콕매치 v83'))el.textContent='콕매치 v84 · 회원명부 간격/정렬 · 숨김 개발자 일반표시';
 });
};

if(location.pathname.startsWith('/launch/v84'))history.replaceState(null,'','/?loaded=84');
if(me)renderAll();
})();

/* migrated into v6.0: app-v85.js */
(()=>{
function mine85(){
 if(me?.memberId){const m=M(String(me.memberId));if(m)return m}
 const n=String(me?.displayName||'').trim();
 return S.members.find(m=>String(m.name||'').trim()===n)||null;
}

const renderHeader84=renderHeader;
renderHeader=function(){
 renderHeader84();
 const m=mine85(),who=$('who'),line=document.querySelector('.groupLine');
 if(!who||!line)return;
 const role=m?.type==='guest'?'게스트':roleLabel(me?.role);
 const temp=m?.type!=='guest'&&me?.tempOrganizer?' · 편성자':'';
 who.textContent=`${me?.displayName||'-'} · ${role}${temp}${m?' · '+stateLabel(m.state):''}`;
 if(who.parentElement!==line)line.appendChild(who);
 who.classList.add('whoInline85');
};

function rankCard85(card,isSelf){
 if(isSelf)return -100;
 if(card.querySelector('.role-global'))return 0;
 if(card.querySelector('.role-manager'))return 1;
 if(card.querySelector('.role-organizer'))return 2;
 if(card.querySelector('.role-temp'))return 3;
 if(card.querySelector('.guest45,.roleBadge.guest45,.roleBadge.guest'))return 5;
 return 4;
}
function reorderCards85(){
 const box=$('members');if(!box)return;
 const cards=[...box.querySelectorAll('.memberCard')];
 if(!cards.length)return;
 const parent=cards[0].parentElement;if(!parent)return;
 const hasMine=!!mine85();
 cards.map((card,i)=>({card,i,rank:rankCard85(card,hasMine&&i===0)}))
  .sort((a,b)=>a.rank-b.rank||a.i-b.i)
  .forEach(x=>parent.appendChild(x.card));
}

const renderMembers84=renderMembers;
renderMembers=function(){renderMembers84();reorderCards85()};

const renderSettings84=renderSettings;
renderSettings=function(){
 renderSettings84();const box=$('settings');if(!box)return;
 [...box.querySelectorAll('.meta')].forEach(el=>{
  if((el.textContent||'').includes('콕매치 v84'))el.textContent='콕매치 v85 · 상단 사용자정보 인라인 · 게스트 역할표시/정렬';
 });
};

if(location.pathname.startsWith('/launch/v85'))history.replaceState(null,'','/?loaded=85');
if(me)renderAll();
})();

/* migrated into v6.0: app-v86.js */
(()=>{
function canSeeGlobal86(){
 const mode=String(S?.adminBadgeVisibility||'all');
 if(me?.globalAdmin)return true;
 if(mode==='all')return true;
 if(mode==='staff')return me?.role==='manager'||me?.role==='organizer';
 return false;
}
function mine86(m){
 if(!m)return false;
 if(me?.memberId&&String(m.id)===String(me.memberId))return true;
 return !me?.memberId&&String(m.name||'').trim()===String(me?.displayName||'').trim();
}
function rank86(m){
 if(mine86(m))return -100;
 if(m?.type==='guest')return 5;
 const r=roleOf(m);
 if(r==='admin')return canSeeGlobal86()?0:4;
 if(r==='manager')return 1;
 if(r==='organizer')return 2;
 if(isTemp(m))return 3;
 return 4;
}
function sortedMembers86(){
 return (S.members||[]).map((m,i)=>({m,i})).sort((a,b)=>rank86(a.m)-rank86(b.m)||a.i-b.i).map(x=>x.m);
}

/*
 v84/v85 sorted already-rendered member cards with appendChild().
 On some mobile browsers that produces an intermediate grid paint which remains
 until the next scroll/reflow. Render from the final member order first and
 suppress only those redundant card-moving appendChild calls.
*/
const renderMembers85=renderMembers;
renderMembers=function(){
 const box=$('members');
 if(box){box.classList.add('memberRenderLock86');box.classList.remove('memberRenderStable86')}
 const originalMembers=S.members;
 const finalMembers=sortedMembers86();
 const originalAppend=Node.prototype.appendChild;
 Node.prototype.appendChild=function(child){
  if(child&&child.nodeType===1&&child.classList?.contains('memberCard')&&child.parentNode===this)return child;
  return originalAppend.call(this,child);
 };
 S.members=finalMembers;
 try{
  renderMembers85();
  if(box){
   void box.offsetHeight;
   for(const card of box.querySelectorAll('.memberCard'))void card.offsetHeight;
  }
 }finally{
  S.members=originalMembers;
  Node.prototype.appendChild=originalAppend;
  if(box){box.classList.remove('memberRenderLock86');box.classList.add('memberRenderStable86')}
 }
};

const renderSettings85=renderSettings;
renderSettings=function(){
 renderSettings85();const box=$('settings');if(!box)return;
 [...box.querySelectorAll('.meta')].forEach(el=>{
  if((el.textContent||'').includes('콕매치 v85'))el.textContent='콕매치 v86 · 회원명부 초기렌더/새로고침 안정화';
 });
};

if(location.pathname.startsWith('/launch/v86'))history.replaceState(null,'','/?loaded=86');
if(me)renderAll();
document.documentElement.classList.add('kokmatch-ready86');
})();

/* migrated into v6.0: app-v87.js */
(()=>{
let firstRoster87=true;
let stabilizing87=false;

function stabilizeRoster87(box){
 if(!box||stabilizing87)return;
 stabilizing87=true;
 box.classList.add('rosterPreparing87');
 const sc=document.scrollingElement||document.documentElement;
 const keepY=Math.max(0,Number(sc?.scrollTop||window.scrollY||0));
 requestAnimationFrame(()=>{
  requestAnimationFrame(()=>{
   try{window.dispatchEvent(new Event('resize'))}catch{}
   setTimeout(()=>{
    try{
     const oldDisplay=box.style.display;
     box.style.display='none';
     void document.documentElement.offsetWidth;
     box.style.display=oldDisplay;
     void box.offsetWidth;
     void box.getBoundingClientRect();
     if(sc){
      const max=Math.max(0,sc.scrollHeight-sc.clientHeight);
      if(max>1){
       const bump=Math.min(max,keepY+1);
       sc.scrollTop=bump;
       void document.body.offsetHeight;
       sc.scrollTop=Math.min(max,keepY);
      }
     }
    }catch(e){console.warn('roster paint v87',e)}
    requestAnimationFrame(()=>{
     box.classList.remove('rosterPreparing87');
     stabilizing87=false;
    });
   },110);
  });
 });
}

const renderMembers86=renderMembers;
renderMembers=function(){
 const box=$('members');
 if(firstRoster87&&box)box.classList.add('rosterPreparing87');
 renderMembers86();
 if(firstRoster87){
  firstRoster87=false;
  stabilizeRoster87($('members'));
 }
};

const submitLogin86=submitLogin;
submitLogin=async function(...args){
 try{document.activeElement?.blur()}catch{}
 return await submitLogin86(...args);
};

const renderSettings86=renderSettings;
renderSettings=function(){
 renderSettings86();
 const box=$('settings');if(!box)return;
 [...box.querySelectorAll('.meta')].forEach(el=>{
  if((el.textContent||'').includes('콕매치 v86'))el.textContent='콕매치 v87 · 로그인/새로고침 회원명부 첫 화면 안정화';
 });
};

if(location.pathname.startsWith('/launch/v87'))history.replaceState(null,'','/?loaded=87');
if(me)renderAll();
})();

/* migrated into v6.0: app-v88.js */
(()=>{
let memberPage88=1;
const MEMBER_PAGE_SIZE88=50;
let rosterFrame88=0;

function ensureMemberRelationPlaceholders88(){
 const box=$('members');if(!box)return;
 for(const card of box.querySelectorAll('.memberCard')){
  const info=card.querySelector('.memberInfo48')||card.children?.[1];if(!info)continue;
  const main=info.querySelector('.memberMainLine45')||info.querySelector('.name');if(!main)continue;
  if(!info.querySelector('.memberRelation83')){
   const row=document.createElement('div');row.className='memberRelation83 memberRelationPlaceholder88';row.innerHTML='&nbsp;';main.insertAdjacentElement('afterend',row);
  }
 }
}
function pagerAnchor88(box){
 const notes=[...box.children].filter(el=>el.classList?.contains('note'));if(notes.length)return notes[notes.length-1];
 const search=[...box.querySelectorAll('input')].find(el=>/검색/.test(el.placeholder||''));return search?.parentElement||box.querySelector('.title')||null;
}
function ensurePager88(){
 const box=$('members');if(!box)return;const cards=[...box.querySelectorAll('.memberCard')],pages=Math.max(1,Math.ceil(cards.length/MEMBER_PAGE_SIZE88));
 if(memberPage88>pages)memberPage88=pages;
 cards.forEach((card,i)=>card.classList.toggle('memberPageHidden88',Math.floor(i/MEMBER_PAGE_SIZE88)+1!==memberPage88));
 let pager=box.querySelector('.memberPager88');if(pages<=1){pager?.remove();return}
 if(!pager){pager=document.createElement('div');pager.className='memberPager88';const anchor=pagerAnchor88(box);if(anchor)anchor.insertAdjacentElement('afterend',pager);else box.prepend(pager)}
 pager.innerHTML=Array.from({length:pages},(_,i)=>i+1).map(n=>`<button type="button" class="memberPageBtn88 ${n===memberPage88?'on':''}" onclick="memberPageGo88(${n})">${n}</button>`).join('');
}
function lightRosterLayout88(){
 cancelAnimationFrame(rosterFrame88);rosterFrame88=requestAnimationFrame(()=>{
  const box=$('members');if(!box)return;try{if(typeof decorateResponsive48==='function')decorateResponsive48()}catch{}void box.offsetHeight;
 });
}
window.memberPageGo88=function(n){memberPage88=Math.max(1,Number(n)||1);ensurePager88();lightRosterLayout88();const box=$('members');if(box&&currentView==='members')box.scrollIntoView({block:'start'})};

const renderMembers87=renderMembers;
renderMembers=function(){renderMembers87();ensureMemberRelationPlaceholders88();ensurePager88();lightRosterLayout88()};

/* v88 used to force multiple layouts on every Members tab entry and ResizeObserver event.
   That caused brief main-thread stalls and dropped rapid nav taps on mobile. Keep tab switching local and immediate. */
const goView87=goView;
goView=function(id){return goView87(id)};

const renderSettings87=renderSettings;
renderSettings=function(){
 renderSettings87();const box=$('settings');if(!box)return;
 [...box.querySelectorAll('.meta')].forEach(el=>{if((el.textContent||'').includes('콕매치 v87'))el.textContent='콕매치 v88 · 회원명부 50명 페이지 · 경량 렌더링'});
};

if(location.pathname.startsWith('/launch/v88'))history.replaceState(null,'','/?loaded=88');
if(me)renderAll();
})();

/* migrated into v6.0: app-v89.js */
(()=>{
function arrangeQueueRelations89(){
 const box=$('queue');if(!box)return;
 [...box.querySelectorAll('.queueCard54')].forEach(card=>{
  const info=card.querySelector('.queueInfo53');if(!info)return;
  const main=info.querySelector('.queueMain47');
  const rel=info.querySelector('.inviteSub45');
  const meta=info.querySelector('.compactMeta53');
  if(rel&&main){
   rel.classList.add('queueRelation89');
   if(rel.previousElementSibling!==main)main.insertAdjacentElement('afterend',rel);
  }
  if(meta)meta.classList.add('queueWaitMeta89');
 });
}
const renderQueue88=renderQueue;
renderQueue=function(){renderQueue88();arrangeQueueRelations89()};

const renderSettings88=renderSettings;
renderSettings=function(){
 renderSettings88();const box=$('settings');if(!box)return;
 [...box.querySelectorAll('.meta')].forEach(el=>{
  if((el.textContent||'').includes('콕매치 v88'))el.textContent='콕매치 v89 · 개인 게임대기 파트너/초대자 위치 및 간격 개선';
 });
};

if(location.pathname.startsWith('/launch/v89'))history.replaceState(null,'','/?loaded=89');
if(me)renderAll();
})();

/* migrated into v6.0: app-v90.js */
(()=>{
const POLL90_API='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-v90-api';
let pollSyncBusy90=false;

function mine90(){
 if(me?.memberId){const m=M(String(me.memberId));if(m)return m}
 const n=String(me?.displayName||'').trim();
 return (S.members||[]).find(m=>String(m.name||'').trim()===n)||null;
}
function pollAdmin90(){
 const m=mine90();
 return !!me&&(me.globalAdmin||me.role==='manager'||me.role==='organizer'||me.tempOrganizer||isTemp(m));
}
function pollList90(){S.attendancePolls=Array.isArray(S.attendancePolls)?S.attendancePolls:[];return S.attendancePolls}
function voteMap90(p){return p?.memberVotes&&typeof p.memberVotes==='object'?p.memberVotes:{}}
function guests90(p){return Array.isArray(p?.guestEntries)?p.guestEntries:[]}
function yesMembers90(p){const v=voteMap90(p);return Object.keys(v).filter(id=>v[id]==='yes').map(M).filter(m=>m&&m.type!=='guest')}
function canVote90(){const m=mine90();return !!m&&m.type!=='guest'}
function roleRank90(m){const r=roleOf(m);if(r==='admin')return 0;if(r==='manager')return 1;if(r==='organizer')return 2;if(isTemp(m))return 3;return 4}
function genderChip90(m){const f=m?.gender==='여';return `<span class="pollGender72 ${f?'female':'male'}">${f?'여':'남'}</span>`}
function today90(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())}
function dateWeekday90(v){const a=String(v||'').split('-').map(Number);if(a.length!==3||!a[0])return '-';const d=new Date(Date.UTC(a[0],a[1]-1,a[2]));return ['일','월','화','수','목','금','토'][d.getUTCDay()]+'요일'}
function autoTitle90(date,time,location){const a=String(date||'').split('-').map(Number);if(a.length!==3||!a[1]||!a[2])return '참석투표';const place=String(location||'').trim();return `${a[1]}월 ${a[2]}일 ${time||''}${place?' '+place:''} 참석투표`}
function timeOptions90(selected='18:30'){const out=[];for(let h=0;h<24;h++)for(const m of [0,30]){const v=`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;out.push(`<option value="${v}" ${v===selected?'selected':''}>${v}</option>`)}return out.join('')}
function addMinutes90(t,min){const [h,m]=String(t||'00:00').split(':').map(Number);const total=(h*60+m+min)%(24*60);return `${String(Math.floor(total/60)).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`}
function pollEndMs90(p){const d=String(p?.date||''),e=String(p?.endTime||'');if(!/^\d{4}-\d{2}-\d{2}$/.test(d)||!/^\d{2}:(00|30)$/.test(e))return 0;return Date.parse(`${d}T${e}:00+09:00`)}
function isExpired90(p){const end=pollEndMs90(p);return !!end&&end<=Date.now()}

async function request90(action,body={}){
 const r=await fetch(POLL90_API,{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+T},body:JSON.stringify({action,groupId:currentGroupId,...body}),cache:'no-store'});
 const x=await r.json().catch(()=>({}));
 if(!r.ok){if(r.status===401){reloginLatest();throw new Error('로그인이 만료되었습니다.')}throw new Error(x.error||'처리에 실패했습니다.')}
 if(x.data){S=x.data;normalizeClient()}
 return x;
}
async function syncPolls90(render=true){
 if(pollSyncBusy90||!me||!T)return;
 pollSyncBusy90=true;
 try{await request90('poll_sync');if(render&&currentView==='stats')renderStats()}catch(e){console.warn('poll sync v90',e)}finally{pollSyncBusy90=false}
}

function renderPollCard90(p){
 const members=yesMembers90(p),guests=guests90(p),mine=mine90(),vote=mine?voteMap90(p)[String(mine.id)]||'':'';
 const staff=pollAdmin90();
 return `<div class="card pollCard72 pollCard90">
  <div class="pollHead72"><div><b>${esc(p.title||'운동 참석 투표')}</b><div class="pollBlank90">&nbsp;</div></div><div class="pollHeadBtns90">${staff?`<button class="miniBtn" onclick="openPollEdit90('${esc(p.id)}')">수정</button><button class="miniBtn" onclick="deletePoll72('${esc(p.id)}')">삭제</button>`:''}</div></div>
  <div class="pollCounts72">
   <button class="pollCountBtn72" onclick="openPollMembers72('${esc(p.id)}')"><b>${members.length}명</b>회원 참석</button>
   <button class="pollCountBtn72" onclick="openPollGuests72('${esc(p.id)}')"><b>${guests.length}명</b>게스트</button>
  </div>
  ${canVote90()?`<div class="pollVote72"><button class="btn ${vote==='yes'?'pri':'ghost'}" onclick="votePoll72('${esc(p.id)}','yes')">참석</button><button class="btn ${vote==='no'?'danger':'ghost'}" onclick="votePoll72('${esc(p.id)}','no')">불참</button></div><div class="pollMine72">내 응답: ${vote==='yes'?'참석':vote==='no'?'불참':'미응답'}</div>`:'<div class="note">게스트는 직접 투표하지 않고 운영진이 참가명단에 입력합니다.</div>'}
  ${staff?`<div class="pollAdmin72"><button class="btn ghost" onclick="openGuestAdd72('${esc(p.id)}')">+ 게스트 참가 추가</button></div>`:''}
 </div>`;
}
function renderPolls90(){
 const ps=pollList90().filter(p=>!isExpired90(p)).slice().sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))||String(a.time||'').localeCompare(String(b.time||'')));
 return `<div class="subhead pollHead90"><b>운동 참석 투표</b>${pollAdmin90()?'<button class="btn pri" onclick="openPollCreate72()">+ 투표 만들기</button>':''}</div>${ps.length?ps.map(renderPollCard90).join(''):'<div class="empty pollEmpty90">진행 중인 참석 투표가 없습니다.</div>'}`;
}
function replacePollSection90(){
 const box=$('stats');if(!box)return;
 const oldHead=[...box.querySelectorAll(':scope > .subhead')].find(x=>(x.textContent||'').includes('운동 참석 투표'));
 if(oldHead){
  let n=oldHead.nextElementSibling;oldHead.remove();
  while(n&&(n.classList.contains('pollCard72')||n.classList.contains('empty'))){const nx=n.nextElementSibling;n.remove();n=nx}
 }
 box.querySelectorAll(':scope > .pollHead90,:scope > .pollCard90,:scope > .pollEmpty90').forEach(x=>x.remove());
 const recent=[...box.querySelectorAll(':scope > .card')].find(c=>(c.textContent||'').includes('오늘 최근 경기'));
 const wrap=document.createElement('div');wrap.className='pollWrap90';wrap.innerHTML=renderPolls90();
 if(recent)recent.insertAdjacentElement('beforebegin',wrap);else box.appendChild(wrap);
}

function pollForm90(p=null){
 const date=p?.date||today90(),start=p?.time||'18:30',end=p?.endTime||addMinutes90(start,180),loc=p?.location||'',title=p?.title||autoTitle90(date,start,loc);
 return `<h3>${p?'운동 참석 투표 수정':'운동 참석 투표 만들기'}</h3><div class="pollCreateForm74 pollForm90">
  <div class="field"><label>일자</label><div class="pollDateRow76"><input id="pollDate72" type="date" value="${esc(date)}"><span id="pollWeekday76" class="pollWeekday76">${dateWeekday90(date)}</span></div></div>
  <div class="grid2 pollTimeGrid90"><div class="field"><label>운동 시작시간</label><select id="pollTime72">${timeOptions90(start)}</select></div><div class="field"><label>운동 종료시간</label><select id="pollEndTime90">${timeOptions90(end)}</select></div></div>
  <div class="meta pollTimeNote90">시작·종료시간은 30분 단위로 선택합니다.</div>
  <div class="field"><label>운동 장소</label><input id="pollLocation73" maxlength="40" placeholder="예: 신리천 2코트" value="${esc(loc)}"></div>
  <div class="field"><label>투표 제목</label><input id="pollTitle72" maxlength="60" value="${esc(title)}"><div class="meta">일자·시작시간·장소를 기준으로 자동 작성되며 자유롭게 수정할 수 있습니다.</div></div>
  <div class="acts"><button class="btn ghost" onclick="closeModal()">취소</button><button class="btn pri" onclick="${p?`savePollEdit90('${esc(p.id)}')`:'createPoll72()'}">${p?'수정 저장':'투표 시작'}</button></div></div>`;
}
function bindPollForm90(){
 const title=$('pollTitle72');if(title)title.dataset.manual='0';
 const sync=()=>{const el=$('pollWeekday76');if(el)el.textContent=dateWeekday90($('pollDate72')?.value||'');if(title&&title.dataset.manual!=='1')title.value=autoTitle90($('pollDate72')?.value||'',$('pollTime72')?.value||'',$('pollLocation73')?.value.trim()||'')};
 $('pollDate72')?.addEventListener('change',sync);
 $('pollLocation73')?.addEventListener('input',sync);
 $('pollTime72')?.addEventListener('change',()=>{const st=$('pollTime72')?.value||'18:30',en=$('pollEndTime90')?.value||'';if(en<=st){const end=addMinutes90(st,120);if($('pollEndTime90'))$('pollEndTime90').value=end}sync()});
 title?.addEventListener('input',()=>{title.dataset.manual='1'});
}
window.openPollCreate72=function(){if(!pollAdmin90())return alert('편성자 이상 권한이 필요합니다.');openModal(pollForm90(null));bindPollForm90()};
window.openPollEdit90=function(id){if(!pollAdmin90())return alert('투표 수정 권한이 없습니다.');const p=pollList90().find(x=>String(x.id)===String(id));if(!p)return alert('투표를 찾을 수 없습니다.');openModal(pollForm90(p));bindPollForm90()};
function readPollForm90(){const date=$('pollDate72')?.value||'',time=$('pollTime72')?.value||'',endTime=$('pollEndTime90')?.value||'',location=$('pollLocation73')?.value.trim()||'';let title=$('pollTitle72')?.value.trim()||'';if(!date||!time||!endTime)return {error:'운동 일자와 시작·종료시간을 선택해주세요.'};if(endTime<=time)return {error:'운동 종료시간은 시작시간보다 늦게 선택해주세요.'};if(!location)return {error:'운동 장소를 입력해주세요.'};if(!title)title=autoTitle90(date,time,location);return {date,time,endTime,location,title}}
window.createPoll72=async function(){const v=readPollForm90();if(v.error)return alert(v.error);try{await request90('poll_create',v);closeModal();renderAll();goView('stats')}catch(e){showError(e)}};
window.savePollEdit90=async function(id){const v=readPollForm90();if(v.error)return alert(v.error);try{await request90('poll_update',{pollId:id,...v});closeModal();renderAll();goView('stats')}catch(e){showError(e)}};
window.votePoll72=async function(id,vote){if(!canVote90())return alert('게스트는 투표할 수 없습니다.');try{await request90('poll_vote',{pollId:id,vote});renderAll()}catch(e){showError(e)}};
window.deletePoll72=async function(id){if(!pollAdmin90())return;if(!confirm('이 참석 투표를 삭제하시겠습니까?'))return;try{await request90('poll_delete',{pollId:id});renderAll()}catch(e){showError(e)}};
window.addPollGuest72=async function(id){const name=$('pollGuestName72')?.value.trim()||'';if(!name)return alert('게스트 이름을 입력해주세요.');try{await request90('poll_guest_add',{pollId:id,name,gender:$('pollGuestGender72')?.value||'남',age:$('pollGuestAge72')?.value||'30',cls:$('pollGuestCls72')?.value||'C'});closeModal();renderAll();goView('stats')}catch(e){showError(e)}};
window.removePollGuest72=async function(pid,gid){if(!pollAdmin90())return;try{await request90('poll_guest_remove',{pollId:pid,guestId:gid});renderAll();openPollGuests72(pid)}catch(e){showError(e)}};

const renderStats89=renderStats;
renderStats=function(){renderStats89();replacePollSection90()};
const goView89=goView;
goView=function(id){goView89(id);if(id==='stats'){syncPolls90(false).then(()=>{if(currentView==='stats')renderStats()})}};

setInterval(()=>{if(!me)return;const expired=pollList90().some(isExpired90);if(expired)syncPolls90(currentView==='stats')},30000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&me)syncPolls90(currentView==='stats')});

const renderSettings89=renderSettings;
renderSettings=function(){renderSettings89();const box=$('settings');if(!box)return;[...box.querySelectorAll('.meta')].forEach(el=>{if((el.textContent||'').includes('콕매치 v89'))el.textContent='콕매치 v90 · 참석투표 수정 · 시작/종료시간 · 종료 후 자동정리'})};
if(location.pathname.startsWith('/launch/v90'))history.replaceState(null,'','/?loaded=90');
if(me){syncPolls90(false).finally(()=>renderAll())}
})();

/* migrated into v6.0: app-v91.js */
(()=>{
function autoTitle91(date,time,location){
 const a=String(date||'').split('-').map(Number);
 if(a.length!==3||!a[1]||!a[2])return '운동';
 const place=String(location||'').trim();
 return `${a[1]}월 ${a[2]}일 ${time||''}${place?' '+place:''} 운동`;
}
function enforceEndOptions91(){
 const start=$('pollTime72'),end=$('pollEndTime90');if(!start||!end)return;
 const s=String(start.value||'');
 let first='';
 [...end.options].forEach(o=>{
  const disabled=String(o.value)<=s;
  o.disabled=disabled;
  if(!disabled&&!first)first=o.value;
 });
 if(!end.value||String(end.value)<=s){end.value=first||''}
}
function normalizeAutoTitle91(force=false){
 const title=$('pollTitle72');if(!title)return;
 const date=$('pollDate72')?.value||'',time=$('pollTime72')?.value||'',location=$('pollLocation73')?.value.trim()||'';
 const cur=String(title.value||'');
 const looksAuto=/참석투표\s*$/.test(cur)||/운동\s*$/.test(cur)||title.dataset.manual!=='1';
 if(force||looksAuto){title.value=autoTitle91(date,time,location);title.dataset.manual='0'}
}
function bindPoll91(){
 const start=$('pollTime72'),end=$('pollEndTime90'),date=$('pollDate72'),loc=$('pollLocation73'),title=$('pollTitle72');
 if(!start||!end)return;
 const lastStart=[...start.options].find(o=>o.value==='23:30');if(lastStart)lastStart.disabled=true;
 enforceEndOptions91();normalizeAutoTitle91(true);
 start.addEventListener('change',()=>{enforceEndOptions91();normalizeAutoTitle91()});
 date?.addEventListener('change',()=>normalizeAutoTitle91());
 loc?.addEventListener('input',()=>normalizeAutoTitle91());
 title?.addEventListener('input',()=>{title.dataset.manual='1'});
}
const openCreate90=openPollCreate72;
openPollCreate72=function(){openCreate90();setTimeout(bindPoll91,0)};
const openEdit90=openPollEdit90;
openPollEdit90=function(id){openEdit90(id);setTimeout(bindPoll91,0)};
const create90=createPoll72;
createPoll72=async function(){const title=$('pollTitle72');if(title&&!title.value.trim())title.value=autoTitle91($('pollDate72')?.value||'',$('pollTime72')?.value||'',$('pollLocation73')?.value.trim()||'');return create90()};
const saveEdit90=savePollEdit90;
savePollEdit90=async function(id){const title=$('pollTitle72');if(title&&!title.value.trim())title.value=autoTitle91($('pollDate72')?.value||'',$('pollTime72')?.value||'',$('pollLocation73')?.value.trim()||'');return saveEdit90(id)};

const renderSettings90=renderSettings;
renderSettings=function(){
 renderSettings90();const box=$('settings');if(!box)return;
 const partner=box.querySelector('.partnerCard66');
 if(partner){const b=partner.querySelector('b');if(b&&(b.textContent||'').trim()==='오늘 파트너')b.textContent='오늘 내 파트너'}
 [...box.querySelectorAll('.meta')].forEach(el=>{if((el.textContent||'').includes('콕매치 v90'))el.textContent='콕매치 v91 · 전 화면 가독성 확대 · 투표 시간제한/자동제목 개선'});
};
if(location.pathname.startsWith('/launch/v91'))history.replaceState(null,'','/?loaded=91');
if(me)renderAll();
})();

/* migrated into v6.0: app-v92.js */
(()=>{
const ROLE_REPLACE92=[['개발자','개발자']];
roleLabel=function(r){return r==='admin'?'개발자':r==='manager'?'모임장':r==='organizer'?'운영진':'일반'};
function translate92(root){
 if(!root)return;
 const apply=t=>{if(!t?.nodeValue)return;const p=t.parentElement;if(p&&['SCRIPT','STYLE'].includes(p.tagName))return;let s=t.nodeValue;for(const[a,b]of ROLE_REPLACE92)s=s.split(a).join(b);if(s!==t.nodeValue)t.nodeValue=s};
 if(root.nodeType===Node.TEXT_NODE){apply(root);return}
 const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;while((n=w.nextNode()))apply(n);
}
const obs92=new MutationObserver(ms=>{for(const m of ms){if(m.type==='characterData')translate92(m.target);else for(const n of m.addedNodes)translate92(n)}});
obs92.observe(document.documentElement,{subtree:true,childList:true,characterData:true});
const renderSettings91=renderSettings;
renderSettings=function(){renderSettings91();const box=$('settings');if(box){translate92(box);[...box.querySelectorAll('.meta')].forEach(el=>{if((el.textContent||'').includes('콕매치 v91'))el.textContent='콕매치 v92 · 역할명칭/편성화면 조정'})}};
if(location.pathname.startsWith('/launch/v92'))history.replaceState(null,'','/?loaded=92');
translate92(document.documentElement);
if(me)renderAll();
})();

/* migrated into v6.0: app-v93.js */
(()=>{const rs=renderSettings;renderSettings=function(){rs();const b=$('settings');if(b)[...b.querySelectorAll('.meta')].forEach(e=>{if((e.textContent||'').includes('콕매치 v92'))e.textContent='콕매치 v93 · 편성화면 역할배지/X 위치 보정'})};if(location.pathname.startsWith('/launch/v93'))history.replaceState(null,'','/?loaded=93');if(me)renderAll();})();

/* migrated into v6.0: app-v94.js */
(()=>{
function queueRole94(m){return m?.type==='guest'?'<span class="roleBadge guest45">게스트</span>':roleBadge(m)}
function genderPerson94(m){const f=m?.gender==='여';return `<span class="genderPerson54 compact54 ${f?'female':'male'}" title="${f?'여':'남'}" aria-label="${f?'여성':'남성'}"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="7" r="4"></circle><path d="M4.5 21c.5-5 3.2-8 7.5-8s7 3 7.5 8z"></path></svg></span>`}
function reorderPersonalQueue94(){
 const box=$('queue');if(!box)return;
 [...box.querySelectorAll('.queueCard54 .queueMain47')].forEach(line=>{
  const grade=line.querySelector('.tag'),role=line.querySelector('.roleBadge'),game=line.querySelector('.gamecnt');
  if(grade&&role&&game){grade.insertAdjacentElement('afterend',role);role.insertAdjacentElement('afterend',game)}
 });
}
const renderQueue93=renderQueue;
renderQueue=function(){renderQueue93();reorderPersonalQueue94()};

window.openFillPending=function(pid){
 const pg=S.pendingGames.find(g=>g.id===pid);if(!pg||pg.players.length>=4)return;
 moveCtx={mode:'fill',targetPendingId:pid};
 const q=sortedQueue().slice().sort((a,b)=>dailyCount(a)-dailyCount(b)||waitMins(M(b))-waitMins(M(a))||String(M(a)?.name||'').localeCompare(String(M(b)?.name||''),'ko'));
 const others=S.pendingGames.filter(g=>g.id!==pid&&g.players.length).flatMap(g=>g.players.map(id=>({g,id,m:M(id)}))).filter(x=>x.m);
 openModal(`<h3>빈자리 채우기 · ${pg.players.length}/4명</h3><div class="note">개인 게임대기 또는 다른 편성대기 조에서 한 명을 선택할 수 있습니다.</div><div class="subhead"><b>개인 게임대기</b><span class="tag">${q.length}명</span></div>${q.map((id,i)=>{const m=M(id);if(!m)return'';return `<button class="choiceBtn fillChoice94" onclick="fillFromQueue('${id}')"><span class="fillOrd94">${i+1}</span>${genderPerson94(m)}<span class="fillInfo94"><span class="fillMain94"><b>${esc(m.name)}</b>${ageTag(m)}${queueRole94(m)}<span class="gamecnt">게임 ${dailyCount(id)}회</span></span><span class="meta">${waitMins(m)}분 대기</span></span></button>`}).join('')||'<div class="empty">없음</div>'}<div class="subhead"><b>다른 편성대기 조</b><span class="tag">${others.length}명</span></div>${others.map(x=>`<button class="choiceBtn" onclick="fillFromPending('${x.g.id}','${x.id}')"><b>${esc(x.m.name)} ${ageTag(x.m)} ${queueRole94(x.m)}</b><span class="meta">편성대기 ${S.pendingGames.indexOf(x.g)+1}조 · ${x.g.players.length}/4명</span></button>`).join('')||'<div class="empty">없음</div>'}<button class="btn ghost" style="width:100%;margin-top:10px" onclick="closeModal()">취소</button>`)
};

const renderSettings93=renderSettings;
renderSettings=function(){renderSettings93();const box=$('settings');if(box)[...box.querySelectorAll('.meta')].forEach(el=>{if((el.textContent||'').includes('콕매치 v93'))el.textContent='콕매치 v94 · 개인대기 정보순서/빈자리 선택목록 개선'})};
if(location.pathname.startsWith('/launch/v94'))history.replaceState(null,'','/?loaded=94');
if(me)renderAll();
})();

/* migrated into v6.0: app-v95.js */
(()=>{
function rgba95(c,a=.08){
 const m=String(c||'').match(/rgba?\((\d+)[, ]+\s*(\d+)[, ]+\s*(\d+)/i);if(!m)return'';
 const [r,g,b]=m.slice(1,4).map(Number);return `rgba(${r},${g},${b},${a})`;
}
function tintMembers95(){
 const box=$('members');if(!box)return;
 [...box.querySelectorAll('.memberCard73,.memberCard71,.memberCard')].forEach(card=>{
  const info=card.querySelector('.memberInfo48')||card.children?.[1]||card;
  const tag=info.querySelector('.memberMainLine45 .tag,.name .tag,.tag');if(!tag)return;
  const cs=getComputedStyle(tag);
  let base=cs.backgroundColor;
  if(!base||base==='transparent'||/rgba\([^)]*,\s*0\)/.test(base))base=cs.borderTopColor||cs.color;
  const tint=rgba95(base,.085);if(tint){info.style.backgroundColor=tint;info.style.borderRadius='12px';info.style.transition='background-color .15s ease'}
 });
}
const renderMembers94=renderMembers;
renderMembers=function(){renderMembers94();requestAnimationFrame(tintMembers95)};
const renderSettings94=renderSettings;
renderSettings=function(){renderSettings94();const b=$('settings');if(b)[...b.querySelectorAll('.meta')].forEach(e=>{if((e.textContent||'').includes('콕매치 v94'))e.textContent='콕매치 v95 · 회원명부 급수색 연한 배경 적용'})};
if(location.pathname.startsWith('/launch/v95'))history.replaceState(null,'','/?loaded=95');
if(me){renderAll();setTimeout(tintMembers95,30)}
})();

/* migrated into v6.0: app-v96.js */
(()=>{
function rgba96(c,a=.085){
 const m=String(c||'').match(/rgba?\((\d+)[, ]+\s*(\d+)[, ]+\s*(\d+)/i);if(!m)return'';
 const [r,g,b]=m.slice(1,4).map(Number);return `rgba(${r},${g},${b},${a})`;
}
function tintWholeMemberCards96(){
 const box=$('members');if(!box)return;
 [...box.querySelectorAll('.memberCard73,.memberCard71,.memberCard')].forEach(card=>{
  const info=card.querySelector('.memberInfo48')||card.children?.[1]||card;
  const tag=info.querySelector('.memberMainLine45 .tag,.name .tag,.tag');if(!tag)return;
  const cs=getComputedStyle(tag);
  let base=cs.backgroundColor;
  if(!base||base==='transparent'||/rgba\([^)]*,\s*0\)/.test(base))base=cs.borderTopColor||cs.color;
  const tint=rgba96(base,.085);if(!tint)return;
  card.style.backgroundColor=tint;
  card.style.transition='background-color .15s ease';
  info.style.backgroundColor='transparent';
  const statusZone=card.querySelector('.memberCtl88,.memberControls,.memberBtns')?.parentElement||card.children?.[2];
  if(statusZone)statusZone.style.backgroundColor='transparent';
  const avatar=card.querySelector('.avatar');if(avatar?.parentElement&&avatar.parentElement!==card)avatar.parentElement.style.backgroundColor='transparent';
 });
}
const renderMembers95=renderMembers;
renderMembers=function(){renderMembers95();requestAnimationFrame(tintWholeMemberCards96)};
const renderSettings95=renderSettings;
renderSettings=function(){renderSettings95();const b=$('settings');if(b)[...b.querySelectorAll('.meta')].forEach(e=>{if((e.textContent||'').includes('콕매치 v95'))e.textContent='콕매치 v96 · 회원명부 카드 전체 급수색 배경'})};
if(location.pathname.startsWith('/launch/v96'))history.replaceState(null,'','/?loaded=96');
if(me){renderAll();setTimeout(tintWholeMemberCards96,30)}
})();

/* migrated into v6.0: app-v97.js */
(()=>{
function rgba97(c,a=.085){const m=String(c||'').match(/rgba?\((\d+)[, ]+\s*(\d+)[, ]+\s*(\d+)/i);if(!m)return'';return `rgba(${m[1]},${m[2]},${m[3]},${a})`}
function tintGradeContainers97(root=document){
 const tags=[...root.querySelectorAll('.tag')];
 tags.forEach(tag=>{
  const txt=(tag.textContent||'').trim();if(!/^(?:\d{2})?[A-E](?:급)?$/i.test(txt))return;
  const cs=getComputedStyle(tag);let base=cs.backgroundColor;if(!base||base==='transparent'||/rgba\([^)]*,\s*0\)/.test(base))base=cs.borderTopColor||cs.color;
  const tint=rgba97(base);if(!tint)return;
  const container=tag.closest('.memberCard73,.memberCard71,.memberCard,.waitCard,.waitRow,.slot54,.pendingSlot54,.player54,.playerCard,.courtPlayer,.pickRow,.candidateRow,.modalRow,.voteMemberRow,.attendeeRow');
  if(container){container.style.backgroundColor=tint;container.style.transition='background-color .15s ease'}
 });
}
function removeVs97(root=document){
 [...root.querySelectorAll('.vs,.vs54,.versus,[class*="vs"]')].forEach(el=>{if(/^vs$/i.test((el.textContent||'').trim()))el.remove()});
 [...root.querySelectorAll('*')].forEach(el=>{if(el.children.length===0&&/^vs$/i.test((el.textContent||'').trim()))el.remove()});
}
function enhance97(){tintGradeContainers97();removeVs97()}
const mo97=new MutationObserver(()=>requestAnimationFrame(enhance97));mo97.observe(document.documentElement,{subtree:true,childList:true});
const oldAll97=renderAll;renderAll=function(){oldAll97();requestAnimationFrame(enhance97)};
const oldSettings97=renderSettings;renderSettings=function(){oldSettings97();const b=$('settings');if(b)[...b.querySelectorAll('.meta')].forEach(e=>{if(/콕매치 v9[0-6]/.test(e.textContent||''))e.textContent='콕매치 v97 · 급수색 전체화면/게임중 VS 제거'})};
if(location.pathname.startsWith('/launch/v97'))history.replaceState(null,'','/?loaded=97');
if(me){renderAll();setTimeout(enhance97,40)}
})();

/* migrated into v6.0: app-v99.js */
(()=>{
function rgba99(c,a){const m=String(c||'').match(/rgba?\((\d+)[, ]+\s*(\d+)[, ]+\s*(\d+)/i);if(!m)return'';return `rgba(${m[1]},${m[2]},${m[3]},${a})`}
function alphaForGrade99(txt){const t=String(txt||'').trim().toUpperCase();if(/^(?:\d{2})?A(?:급)?$/.test(t))return .24;if(/^(?:\d{2})?B(?:급)?$/.test(t))return .30;if(/^(?:\d{2})?C(?:급)?$/.test(t))return .20;if(/^(?:\d{2})?D(?:급)?$/.test(t))return .24;if(/^(?:\d{2})?E(?:급)?$/.test(t))return .24;return .24}
const CONTAINERS99='.memberCard73,.memberCard71,.memberCard,.queueCard54,.queueCard,.composer54 .slot54,.composer .slot,.slot54,.pendingSlot54,.pendingSlot,.playingPlayer53,.player54,.playerCard,.courtPlayer,.choiceBtn,.pickRow,.candidateRow,.partnerSearchRow82,.partnerPickedCard82,.voteMemberRow,.attendeeRow,.pollMemberRow,.memberVoteRow';
function tintAllGrades99(root=document){[...root.querySelectorAll('.tag')].forEach(tag=>{const txt=(tag.textContent||'').trim();if(!/^(?:\d{2})?[A-E](?:급)?$/i.test(txt))return;const cs=getComputedStyle(tag);let base=cs.backgroundColor;if(!base||base==='transparent'||/rgba\([^)]*,\s*0\)/.test(base))base=cs.borderTopColor||cs.color;const tint=rgba99(base,alphaForGrade99(txt));if(!tint)return;let container=tag.closest(CONTAINERS99);if(!container){const p=tag.parentElement;if(p&&p!==document.body)container=p.closest('button,.card,[class*="slot"],[class*="player"],[class*="member"],[class*="queue"],[class*="row"]')||p}if(container){container.style.backgroundColor=tint;container.style.transition='background-color .15s ease';container.dataset.gradeTint='99'}})}
function trimQueueWait99(){const box=$('queue');if(!box)return;[...box.querySelectorAll('.queueCard54 .queueWaitMeta89,.queueCard54 .compactMeta53,.queueCard .meta')].forEach(el=>{const s=(el.textContent||'').trim();if(!s)return;let n=s.replace(/\s*[·•]\s*오늘\s*총\s*\d+\s*분\s*대기(?:중)?/g,'').replace(/오늘\s*총\s*\d+\s*분\s*대기(?:중)?/g,'').trim();if(n!==s)el.textContent=n})}
const DEV_PROOF_KEY99='kokmatch_dev_proof_v99';
function tokenSig99(){return String(T||'').slice(-16)}
function mine99(){const mid=String(me?.memberId||'');if(mid){const m=M(mid);if(m)return m}const n=String(me?.displayName||'').trim();return S?.members?.find?.(m=>String(m?.name||'').trim()===n)||null}
function saveDeveloperProof99(){if(!me||!T)return;try{sessionStorage.setItem(DEV_PROOF_KEY99,JSON.stringify({sig:tokenSig99(),name:String(me.displayName||''),group:String(currentGroupId||group?.groupId||'')}))}catch{}}
function proofDeveloper99(){if(!me||!T)return false;try{const p=JSON.parse(sessionStorage.getItem(DEV_PROOF_KEY99)||'null');if(!p||p.sig!==tokenSig99())return false;if(String(p.name||'')!==String(me.displayName||''))return false;const g=String(currentGroupId||group?.groupId||'');if(p.group&&g&&String(p.group)!==g)return false;return true}catch{return false}}
function sourceDeveloper99(){if(!me)return false;if(me.globalAdmin===true)return true;if(String(me.role||'')==='admin')return true;const mine=mine99();return !!mine&&roleOf(mine)==='admin'}
function restoreDeveloper99(){if(!me)return false;if(sourceDeveloper99()){me.globalAdmin=true;saveDeveloperProof99();return true}if(proofDeveloper99()){me.globalAdmin=true;return true}return false}
const baseCanGame99=canGame;canGame=function(){return restoreDeveloper99()||baseCanGame99()};
const baseCanManageMembers99=canManageMembers;canManageMembers=function(){return restoreDeveloper99()||baseCanManageMembers99()};
const baseCanSetRoles99=canSetRoles;canSetRoles=function(){return restoreDeveloper99()||baseCanSetRoles99()};
const baseCanReset99=canReset;canReset=function(){return restoreDeveloper99()||baseCanReset99()};
const baseCanManageGroups99=canManageGroups;canManageGroups=function(){return restoreDeveloper99()||baseCanManageGroups99()};
function memberSearchActive99(){const box=$('members');if(!box)return false;const inp=[...box.querySelectorAll('input')].find(i=>/검색/.test(i.placeholder||''));return !!String(inp?.value||'').trim()}
let rosterRepairBusy99=false;
function ensureFullDeveloperRoster99(){if(rosterRepairBusy99||currentView!=='members'||!restoreDeveloper99()||memberSearchActive99())return;const box=$('members');if(!box)return;const cards=box.querySelectorAll('.memberCard').length;const total=Array.isArray(S?.members)?S.members.length:0;if(total&&cards<total){rosterRepairBusy99=true;try{renderMembers()}finally{setTimeout(()=>{rosterRepairBusy99=false},0)}}}
function enhance99(){restoreDeveloper99();tintAllGrades99();trimQueueWait99();ensureFullDeveloperRoster99()}
const mo99=new MutationObserver(()=>requestAnimationFrame(enhance99));mo99.observe(document.documentElement,{subtree:true,childList:true});
const oldAll99=renderAll;renderAll=function(){restoreDeveloper99();oldAll99();requestAnimationFrame(enhance99)};
const oldQueue99=renderQueue;renderQueue=function(){restoreDeveloper99();oldQueue99();requestAnimationFrame(()=>{restoreDeveloper99();trimQueueWait99();tintAllGrades99($('queue')||document)})};
const oldMembers99=renderMembers;renderMembers=function(){restoreDeveloper99();oldMembers99();requestAnimationFrame(()=>{restoreDeveloper99();tintAllGrades99($('members')||document)})};
const oldHeader99=renderHeader;renderHeader=function(){restoreDeveloper99();oldHeader99()};
const oldNav99=renderNav;renderNav=function(){restoreDeveloper99();oldNav99()};
const oldSettings99=renderSettings;renderSettings=function(){restoreDeveloper99();oldSettings99();const b=$('settings');if(b)[...b.querySelectorAll('.meta')].forEach(e=>{if(/콕매치 v9[0-9]/.test(e.textContent||''))e.textContent='콕매치 v99 · 개발자 숨김배지 권한 지속 · 회원상태 즉시반응'})};
const oldGoView99=goView;goView=function(id){restoreDeveloper99();oldGoView99(id);requestAnimationFrame(()=>{restoreDeveloper99();if(id==='members'){renderMembers();ensureFullDeveloperRoster99()}});setTimeout(()=>{restoreDeveloper99();if(id==='members')ensureFullDeveloperRoster99()},80)};
const oldLoadState99=loadState;loadState=async function(){await oldLoadState99();restoreDeveloper99();saveDeveloperProof99();if(currentView==='members')setTimeout(ensureFullDeveloperRoster99,0)};
const oldAct99=act;act=async function(...args){restoreDeveloper99();const x=await oldAct99(...args);restoreDeveloper99();return x};
addEventListener('focus',()=>{restoreDeveloper99();if(currentView==='members')setTimeout(ensureFullDeveloperRoster99,0)},{passive:true});
document.addEventListener('visibilitychange',()=>{if(!document.hidden){restoreDeveloper99();if(currentView==='members')setTimeout(ensureFullDeveloperRoster99,0)}});
setInterval(()=>{if(me){restoreDeveloper99();if(currentView==='members')ensureFullDeveloperRoster99()}},1200);

/* Member attendance fast path: preserve scroll, avoid full roster repaint/flicker. */
const attendanceBusy99=new Set();
let attendanceDirty99=false;
function textNoReflow99(el,text){if(!el)return;if(el.childNodes.length===1&&el.firstChild?.nodeType===3)el.firstChild.nodeValue=String(text);else el.innerText=String(text)}
function memberCardFor99(id){const q=String(id);for(const card of document.querySelectorAll('#members .memberCard')){for(const el of card.querySelectorAll('[onclick]')){if((el.getAttribute('onclick')||'').includes("'"+q+"'"))return card}}return null}
function setBtn99(btn,label,kind,id,mode){if(!btn)return;textNoReflow99(btn,label);btn.className='btn '+kind;btn.setAttribute('onclick',`setOther('${id}','${mode}')`)}
function patchMemberState99(id){const m=M(id),card=memberCardFor99(id);if(!m||!card)return;const status=card.querySelector('.status');textNoReflow99(status,stateLabel(m.state));const wrap=card.querySelector('.memberBtns');if(!wrap)return;const acts=[...wrap.querySelectorAll('button')].filter(b=>!b.classList.contains('ghost'));if(acts.length>=2){if(m.state==='waiting'){setBtn99(acts[0],'관람','watch',id,'spectator');setBtn99(acts[1],'퇴장','danger',id,'out')}else if(m.state==='spectator'){setBtn99(acts[0],'입장','enter',id,'waiting');setBtn99(acts[1],'퇴장','danger',id,'out')}else if(m.state==='out'){setBtn99(acts[0],'입장','enter',id,'waiting');setBtn99(acts[1],'관람','watch',id,'spectator')}}for(const b of acts)b.disabled=attendanceBusy99.has(String(id))}
function patchSummary99(){const a=$('sm'),w=$('sw'),g=$('sg');textNoReflow99(a,S.members.filter(m=>m.state!=='out').length);textNoReflow99(w,S.queue.length+S.pendingGames.reduce((n,x)=>n+(x.players?.length||0),0));textNoReflow99(g,S.games.length)}
function optimisticAttendance99(id,mode){const m=M(id);if(!m)return;if(mode==='waiting'){m.state='waiting';m.joinedAt=Number(m.joinedAt)||Date.now();if(!S.queue.includes(id))S.queue.push(id)}else{m.state=mode;S.queue=S.queue.filter(x=>String(x)!==String(id))}patchMemberState99(id);patchSummary99()}
setOther=async function(id,mode){id=String(id);if(attendanceBusy99.has(id))return;const m=M(id);if(!m)return;const prev={state:m.state,joinedAt:m.joinedAt,queue:S.queue.slice()};attendanceBusy99.add(id);optimisticAttendance99(id,mode);patchMemberState99(id);try{const x=await request('action','POST',{action:'set_member_attendance',groupId:currentGroupId,memberId:id,mode});if(x?.data){S=x.data;normalizeClient();restoreDeveloper99()}attendanceDirty99=true;patchMemberState99(id);patchSummary99()}catch(e){const mm=M(id);if(mm){mm.state=prev.state;mm.joinedAt=prev.joinedAt}S.queue=prev.queue;patchMemberState99(id);patchSummary99();showError(e)}finally{attendanceBusy99.delete(id);patchMemberState99(id)}};
const goViewFast99=goView;goView=function(id){if(attendanceDirty99&&id!=='members'){attendanceDirty99=false;try{renderQueue();renderPlaying();renderStats();renderSettings()}catch{}}goViewFast99(id)};

if(location.pathname.startsWith('/launch/v99'))history.replaceState(null,'','/?loaded=99');
if(me){restoreDeveloper99();saveDeveloperProof99();renderAll();setTimeout(enhance99,40)}
})();

/* migrated into v6.0: app-v1.2.js */
(()=>{
const DEV_NAME12='박태영';

function sanitizeAuth12(){
  if(!me)return;
  try{sessionStorage.removeItem('kokmatch_dev_proof_v99')}catch{}
  if(String(me.displayName||'').trim()!==DEV_NAME12){
    me.globalAdmin=false;
    if(String(me.role||'')==='admin')me.role='member';
  }
}
const roleOfPrev12=roleOf;
roleOf=function(m){
  if(String(m?.role||'')==='admin'&&String(m?.name||'').trim()!==DEV_NAME12)return 'member';
  return roleOfPrev12(m);
};
canGame=function(){sanitizeAuth12();return !!me&&(me.globalAdmin===true||me.role==='manager'||me.role==='organizer'||me.tempOrganizer)};
canManageMembers=function(){sanitizeAuth12();return !!me&&(me.globalAdmin===true||me.role==='manager'||me.role==='organizer')};
canSetRoles=function(){sanitizeAuth12();return !!me&&(me.globalAdmin===true||me.role==='manager')};
canReset=function(){sanitizeAuth12();return !!me&&(me.globalAdmin===true||me.role==='manager')};
canManageGroups=function(){sanitizeAuth12();return !!me&&me.globalAdmin===true};

function rgba12(c,a){
  const m=String(c||'').match(/rgba?\((\d+)[, ]+\s*(\d+)[, ]+\s*(\d+)/i);
  if(!m)return'';
  return `rgba(${m[1]},${m[2]},${m[3]},${a})`;
}
function gradeAlpha12(txt){
  const t=String(txt||'').trim().toUpperCase();
  if(/^(?:\d{2})?B(?:급)?$/.test(t))return .30;
  if(/^(?:\d{2})?C(?:급)?$/.test(t))return .20;
  return .24;
}
const GRADE_BOX12='.memberCard73,.memberCard71,.memberCard,.queueCard54,.queueCard,.composer54 .slot54,.composer .slot,.slot54,.pendingSlot54,.pendingSlot,.playingPlayer53,.player54,.playerCard,.courtPlayer,.choiceBtn,.pickRow,.candidateRow,.partnerSearchRow82,.partnerPickedCard82,.voteMemberRow,.attendeeRow,.pollMemberRow,.memberVoteRow';
function tintGrades12(root=document){
  [...root.querySelectorAll('.tag')].forEach(tag=>{
    const txt=(tag.textContent||'').trim();
    if(!/^(?:\d{2})?[A-E](?:급)?$/i.test(txt))return;
    const cs=getComputedStyle(tag);
    let base=cs.backgroundColor;
    if(!base||base==='transparent'||/rgba\([^)]*,\s*0\)/.test(base))base=cs.borderTopColor||cs.color;
    const tint=rgba12(base,gradeAlpha12(txt));
    if(!tint)return;
    const box=tag.closest(GRADE_BOX12);
    if(box)box.style.backgroundColor=tint;
  });
}
function trimQueueWait12(){
  const box=$('queue');if(!box)return;
  [...box.querySelectorAll('.queueCard54 .queueWaitMeta89,.queueCard54 .compactMeta53,.queueCard .meta')].forEach(el=>{
    const s=(el.textContent||'').trim();
    if(!s)return;
    const n=s.replace(/\s*[·•]\s*오늘\s*총\s*\d+\s*분\s*대기(?:중)?/g,'').replace(/오늘\s*총\s*\d+\s*분\s*대기(?:중)?/g,'').trim();
    if(n!==s)el.textContent=n;
  });
}
function enhance12(root=document){
  sanitizeAuth12();
  tintGrades12(root);
  trimQueueWait12();
}

function queueCardId12(card){
  const s=String(card?.getAttribute?.('onclick')||'');
  const m=s.match(/draftClick\(['\"]([^'\"]+)['\"]\)/);
  return m?String(m[1]):'';
}
function patchDraft12(){
  try{
    const box=$('queue');if(!box)return;
    const sc=document.scrollingElement||document.documentElement;
    const y=Math.max(0,Number(sc?.scrollTop||window.scrollY||0));
    const slots=[...box.querySelectorAll('.composer54 .slot54,.composer .slot')].slice(0,4);
    slots.forEach((el,i)=>{
      const id=draft?.[i],m=id?M(id):null;
      el.classList.toggle('filled',!!m);
      if(m){
        el.innerHTML=`<div class="slotLabel">${i<2?'A팀':'B팀'} ${i%2+1}</div><button class="slotX" onclick="draftRemove(${i})">×</button><div class="slotName slotName53"><span class="compactName53">${esc(m.name)}</span>${ageTag(m)}${typeof badge54==='function'?badge54(m):roleBadge(m)}</div><div class="meta compactMeta53">게임 ${dailyCount(id)}회 · ${waitMins(m)}분 대기</div>${typeof inviteReserve54==='function'?inviteReserve54(m):''}`;
      }else{
        el.innerHTML=`<div class="slotLabel">${i<2?'A팀':'B팀'} ${i%2+1}</div><div class="meta slotEmptyText54">개인 게임대기에서 선택</div>${typeof inviteReserve54==='function'?'<span class="inviteReserve54">&nbsp;</span>':''}`;
      }
    });
    const summary=box.querySelector('.composer54 .pairSummary,.composer .pairSummary');
    if(summary)summary.textContent=pairSummary(draft.filter(Boolean));
    const reg=[...box.querySelectorAll('.composerActs .btn')].find(b=>/대기 등록/.test(b.textContent||''));
    if(reg)reg.disabled=!draft.filter(Boolean).length;
    const selected=new Set(draft.filter(Boolean).map(String));
    [...box.querySelectorAll('.queueCard54,.queueCard53,.queueCard')].forEach(card=>{
      const id=queueCardId12(card);if(!id)return;
      const on=selected.has(id);card.classList.toggle('selected',on);
      const chk=card.querySelector('.queueCheck53')||card.querySelector(':scope > b:last-child');
      if(chk)chk.textContent=on?'✓':'';
    });
    tintGrades12(box);
    trimQueueWait12();
    if(sc)sc.scrollTop=y;
    requestAnimationFrame(()=>{if(sc)sc.scrollTop=y});
  }catch(e){console.warn('v1.2 draft patch',e)}
}
function withoutQueueRender12(fn){
  const saved=renderQueue;
  renderQueue=function(){};
  try{return fn()}finally{renderQueue=saved}
}

try{
  const oldDraftClick=draftClick;
  draftClick=function(id){const r=withoutQueueRender12(()=>oldDraftClick(id));patchDraft12();return r};
  const oldDraftRemove=draftRemove;
  draftRemove=function(i){const r=withoutQueueRender12(()=>oldDraftRemove(i));patchDraft12();return r};
  const oldClearDraft=clearDraft;
  clearDraft=function(){const r=withoutQueueRender12(()=>oldClearDraft());patchDraft12();return r};
  const oldRecommendDraft=recommendDraft;
  recommendDraft=function(){const r=withoutQueueRender12(()=>oldRecommendDraft());patchDraft12();return r};
  ['partnerRedo67','partnerKeep67','partnerSwap67','partnerIgnore67','repeatUndo67','repeatKeep67'].forEach(name=>{
    const old=window[name];if(typeof old!=='function')return;
    window[name]=function(...args){const r=withoutQueueRender12(()=>old(...args));patchDraft12();return r};
  });
}catch(e){console.warn('v1.2 queue smooth disabled',e)}

const oldLoadState12=loadState;
loadState=async function(...args){
  const r=await oldLoadState12(...args);
  sanitizeAuth12();
  try{renderHeader();renderNav()}catch{}
  return r;
};
const oldRenderAll12=renderAll;
renderAll=function(){sanitizeAuth12();oldRenderAll12();requestAnimationFrame(()=>enhance12())};
const oldQueue12=renderQueue;
renderQueue=function(){sanitizeAuth12();oldQueue12();requestAnimationFrame(()=>enhance12($('queue')||document))};
const oldMembers12=renderMembers;
renderMembers=function(){sanitizeAuth12();oldMembers12();requestAnimationFrame(()=>tintGrades12($('members')||document))};
const oldSettings12=renderSettings;
renderSettings=function(){
  sanitizeAuth12();oldSettings12();
  const b=$('settings');if(!b)return;
  [...b.querySelectorAll('.meta')].forEach(e=>{
    if(/콕매치 v(?:\d+|1\.[0-9]+)/.test(e.textContent||''))e.textContent='콕매치 v1.2 · 세션복구 · 권한안정화 · 게임대기 무깜빡임';
  });
};

const mo12=new MutationObserver(ms=>{
  if(ms.some(m=>m.type==='childList'&&m.addedNodes.length))requestAnimationFrame(()=>enhance12());
});
mo12.observe(document.documentElement,{subtree:true,childList:true});

addEventListener('focus',()=>{sanitizeAuth12();try{renderHeader();renderNav()}catch{}},{passive:true});
document.addEventListener('visibilitychange',()=>{if(!document.hidden){sanitizeAuth12();try{renderHeader();renderNav()}catch{}}});

if(location.pathname.startsWith('/launch/v1.2'))history.replaceState(null,'','/?loaded=1.2');
if(me){sanitizeAuth12();try{renderHeader();renderNav();enhance12()}catch{}}
})();

/* migrated into v6.0: app-v1.6.js */
(()=>{
const SEMVER16='1.6';

function clearLegacyState16(){
 try{
  ['kokmatch_update_state_v40','kokmatch_update_state_v41','kokmatch_update_state_v43','kokmatch_refresh_state','kokmatch_dev_proof_v99','kokmatch_session_reset_v1_1','kokmatch_session_reset_v1_2','kokmatch_recovery_v1_3_done','kokmatch_recovery_v1_4_done','kokmatch_recovery_v1_5_done'].forEach(k=>sessionStorage.removeItem(k));
 }catch{}
 try{document.getElementById('updateBanner56')?.remove()}catch{}
}
clearLegacyState16();

function showLoginInline16(message=''){
 try{localStorage.removeItem('kokmatch_token')}catch{}
 try{T=''}catch{}
 try{me=null}catch{}
 try{reloginBusy=false}catch{}
 try{
  const login=typeof $==='function'?$('login'):null;
  if(login)login.classList.remove('hide');
  if(typeof renderLoginName==='function')renderLoginName();
  if(message){const e=typeof $==='function'?$('loginErr'):null;if(e)e.textContent=message}
 }catch{}
}

/* Session expiry must never navigate. Keep the current document and show login in place. */
reloginLatest=async function(){showLoginInline16('로그인이 만료되어 다시 로그인이 필요합니다.')};

/* Legacy updater entry points are manual-only and never auto-navigate to another service. */
async function manualRefresh16(){
 const b=typeof $==='function'?$('forceUpdateBtn'):null;
 if(b){b.disabled=true;b.textContent='캐시 정리 중...'}
 try{
  try{if('serviceWorker'in navigator){const rs=await navigator.serviceWorker.getRegistrations();await Promise.all(rs.map(r=>r.unregister().catch(()=>false)))}}catch{}
  try{if('caches'in window){const ks=await caches.keys();await Promise.all(ks.map(k=>caches.delete(k)))}}catch{}
  location.reload();
 }catch(e){if(b){b.disabled=false;b.textContent='↻ 수동 새로고침'}}
}
forceUpdateApp=manualRefresh16;
window.kokmatchUpdateSameOrigin43=manualRefresh16;
window.kokmatchRootRecovery=manualRefresh16;

/* If a stale token survives from an older cached page, do not let polling create a navigation loop. */
const loadStatePrev16=loadState;
loadState=async function(...args){
 if(!T)return;
 try{return await loadStatePrev16(...args)}catch(e){
  const msg=String(e?.message||'');
  if(/만료|로그인|401/.test(msg)){showLoginInline16('로그인이 만료되어 다시 로그인이 필요합니다.');return}
  throw e;
 }
};

const settingsPrev16=renderSettings;
renderSettings=function(){
 settingsPrev16();const box=typeof $==='function'?$('settings'):null;if(!box)return;
 [...box.querySelectorAll('.meta')].forEach(el=>{if(/콕매치 v(?:\d+|1\.[0-9]+)/.test(el.textContent||''))el.textContent='콕매치 v1.6 · 자동이동 완전중지 · 세션 인라인 복구'});
 const btn=typeof $==='function'?$('forceUpdateBtn'):null;if(btn){btn.textContent='↻ 수동 새로고침';btn.onclick=manualRefresh16}
};

/* Normalize recovery URLs without reloading the page. */
try{
 const q=new URLSearchParams(location.search);
 if(q.has('recovery')||q.has('relogin')||q.has('legacy')||q.has('from404'))history.replaceState(null,'','/');
}catch{}

if(!T){try{showLoginInline16()}catch{}}
})();

/* migrated into v6.0: app-v1.7.js */
(()=>{
const SEMVER17='1.7',DEV_NAME17='박태영';
let actionBusy17=0,lastQueueSig17='',searchCompose17=false,searchTimer17=0,searchPending17='';

function mineRaw17(){
 try{
  const id=String(me?.memberId||'');if(id){const m=M(id);if(m)return m}
  const n=String(me?.displayName||'').trim();return S?.members?.find?.(m=>String(m?.name||'').trim()===n)||null;
 }catch{return null}
}
function developerEvidence17(){
 if(!me||String(me.displayName||'').trim()!==DEV_NAME17)return false;
 const mine=mineRaw17();
 return me.globalAdmin===true||String(me.role||'')==='admin'||String(mine?.role||'')==='admin';
}
function enforceAuth17(){
 if(!me)return false;
 if(developerEvidence17()){me.globalAdmin=true;return true}
 me.globalAdmin=false;if(String(me.role||'')==='admin')me.role='member';
 try{sessionStorage.removeItem('kokmatch_dev_proof_v99')}catch{}
 return false;
}
function viewerIsDeveloper17(){return !!me&&String(me.displayName||'').trim()===DEV_NAME17&&developerEvidence17()}
function rawPark17(){return S?.members?.find?.(m=>String(m?.name||'').trim()===DEV_NAME17&&String(m?.role||'')==='admin')||null}
function hiddenAdmin17(){return String(S?.adminBadgeVisibility||'all')==='hidden'}

/* Authority and visible badge are separate. Only the real 박태영 admin identity can retain developer authority. */
canGame=function(){const d=enforceAuth17();return !!me&&(d||me.role==='manager'||me.role==='organizer'||me.tempOrganizer)};
canManageMembers=function(){const d=enforceAuth17();return !!me&&(d||me.role==='manager'||me.role==='organizer')};
canSetRoles=function(){const d=enforceAuth17();return !!me&&(d||me.role==='manager')};
canReset=function(){const d=enforceAuth17();return !!me&&(d||me.role==='manager')};
canManageGroups=function(){return !!me&&enforceAuth17()};

const roleBadgeBefore17=roleBadge;
roleBadge=function(m){
 if(String(m?.role||'')==='admin'&&String(m?.name||'').trim()===DEV_NAME17&&hiddenAdmin17()&&!viewerIsDeveloper17())return '<span class="roleBadge role-member44">일반</span>';
 return roleBadgeBefore17(m);
};

function rgba17(c,a){const m=String(c||'').match(/rgba?\((\d+)[, ]+\s*(\d+)[, ]+\s*(\d+)/i);return m?`rgba(${m[1]},${m[2]},${m[3]},${a})`:''}
function gradeAlpha17(t){t=String(t||'').trim().toUpperCase();if(/^(?:\d{2})?B(?:급)?$/.test(t))return .30;if(/^(?:\d{2})?C(?:급)?$/.test(t))return .20;return .24}
const GRADE_BOX17='.memberCard73,.memberCard71,.memberCard,.queueCard54,.queueCard53,.queueCard,.composer54 .slot54,.composer .slot,.pendingSlot54,.pendingSlot,.playingPlayer53,.player54,.playerCard,.courtPlayer,.choiceBtn,.pickRow,.candidateRow,.partnerSearchRow82,.partnerPickedCard82,.voteMemberRow,.attendeeRow,.pollMemberRow,.memberVoteRow';
function tintNow17(root=document){
 if(!root?.querySelectorAll)return;
 root.querySelectorAll('.tag').forEach(tag=>{
  const txt=(tag.textContent||'').trim();if(!/^(?:\d{2})?[A-E](?:급)?$/i.test(txt))return;
  const cs=getComputedStyle(tag);let base=cs.backgroundColor;if(!base||base==='transparent'||/rgba\([^)]*,\s*0\)/.test(base))base=cs.borderTopColor||cs.color;
  const tint=rgba17(base,gradeAlpha17(txt)),box=tag.closest(GRADE_BOX17);if(!tint||!box)return;
  if(box.style.backgroundColor!==tint)box.style.setProperty('background-color',tint,'important');
  box.style.setProperty('transition','none','important');
  if(box.classList.contains('playingPlayer53'))box.style.setProperty('border-radius','10px','important');
 });
}
function generalBadge17(){const s=document.createElement('span');s.className='roleBadge role-member44';s.textContent='일반';return s}
function maskTarget17(target){
 if(!target)return;
 const global=target.querySelector('.roleBadge.role-global');if(global)global.replaceWith(generalBadge17());
 else if(!target.querySelector('.roleBadge'))target.appendChild(generalBadge17());
}
function maskParkQueue17(root=document){
 if(!hiddenAdmin17()||viewerIsDeveloper17()||!rawPark17()||!root?.querySelectorAll)return;
 root.querySelectorAll('.queueMain47,.composer54 .slotName53,.composer .slotName53,.playingMain53,.memberMainLine45').forEach(line=>{
  const n=line.querySelector('.compactName53,.playingName53,.memberName45');if(n&&String(n.textContent||'').trim()===DEV_NAME17)maskTarget17(line);
 });
 root.querySelectorAll('.pendingSlot54,.pendingSlot53').forEach(slot=>{
  const n=slot.querySelector('.compactName53');if(!n||String(n.textContent||'').trim()!==DEV_NAME17)return;
  maskTarget17(slot.querySelector('.slotBadges54,.slotBadges53')||slot);
 });
}
function stabilize17(root=document){enforceAuth17();maskParkQueue17(root);tintNow17(root)}
function scrollY17(){const sc=document.scrollingElement||document.documentElement;return [sc,Math.max(0,Number(sc?.scrollTop||window.scrollY||0))]}
function restoreY17(sc,y){if(!sc)return;sc.scrollTop=y;requestAnimationFrame(()=>{sc.scrollTop=y})}

/* Every visible render gets its grade color synchronously, before the browser paints the new DOM. */
const renderQueueBefore17=renderQueue;
renderQueue=function(){const [sc,y]=scrollY17(),keep=currentView==='queue';renderQueueBefore17();stabilize17($('queue')||document);lastQueueSig17=queueSig17();if(keep)restoreY17(sc,y)};
const renderPlayingBefore17=renderPlaying;
renderPlaying=function(){const [sc,y]=scrollY17(),keep=currentView==='playing';renderPlayingBefore17();stabilize17($('playing')||document);stampPlaying17();if(keep)restoreY17(sc,y)};
const renderMembersBefore17=renderMembers;
renderMembers=function(){const [sc,y]=scrollY17(),keep=currentView==='members';renderMembersBefore17();stabilize17($('members')||document);bindSearch17();if(keep)restoreY17(sc,y)};

function memberDisplaySig17(id){const m=M(id);return m?[m.id,m.name,m.age,m.cls,m.role,m.type,m.inviter,m.gender,m.state,m.tempOrganizerDay,dailyCount(id)].join('|'):'-'}
function playingSig17(n){
 const g=S.games.find(x=>Number(x.court)===n);return JSON.stringify([courtLabel(n),canGame(),S?.adminBadgeVisibility||'all',viewerIsDeveloper17(),g?g.id:'',g?g.startedAt:'',g?g.players.map(memberDisplaySig17):[]]);
}
function stampPlaying17(){const box=$('playing');if(!box)return;[...box.querySelectorAll('.courtCard')].forEach((c,i)=>c.dataset.v17sig=playingSig17(i+1))}
function syncPlaying17(){
 const box=$('playing');if(!box)return;
 const cards=[...box.querySelectorAll('.courtCard')];if(cards.length!==Number(S.courtCount||0)){renderPlaying();return}
 cards.forEach((card,i)=>{
  const n=i+1,sig=playingSig17(n);if(card.dataset.v17sig===sig)return;
  const g=S.games.find(x=>Number(x.court)===n),body=card.querySelector('.courtBody'),name=card.querySelector('.courtName');
  if(name)name.innerHTML=canGame()?`<button onclick="renameCourt(${n})">${esc(courtLabel(n))}<br><small>✎</small></button>`:esc(courtLabel(n));
  if(body)body.innerHTML=g?gameHtml(g):'<div class="empty">비어 있음</div>';
  card.dataset.v17sig=sig;stabilize17(card);
 });
}

function queueSig17(){
 try{
  const q=sortedQueue().map(id=>[id,memberDisplaySig17(id),waitMins(M(id)),draft.includes(id)]);
  const p=(S.pendingGames||[]).map(g=>[g.id,g.createdAt,(g.players||[]).map(id=>[id,memberDisplaySig17(id),waitMins(M(id))])]);
  return JSON.stringify([q,p,draft,S?.adminBadgeVisibility||'all',canGame(),viewerIsDeveloper17()]);
 }catch{return String(Date.now())}
}
function syncQueue17(){const sig=queueSig17();if(lastQueueSig17!==sig)renderQueue();else stabilize17($('queue')||document)}
['draftClick','draftRemove','clearDraft','recommendDraft','partnerRedo67','partnerKeep67','partnerSwap67','partnerIgnore67','repeatUndo67','repeatKeep67'].forEach(name=>{
 try{const old=window[name]||globalThis[name];if(typeof old!=='function')return;globalThis[name]=function(...args){const r=old.apply(this,args);Promise.resolve(r).finally(()=>{lastQueueSig17=queueSig17();stabilize17($('queue')||document)});return r}}catch{}
});

/* Tablet Korean IME: never replace the search input while a composition is in progress. */
const searchMembersBefore17=window.searchMembers46;
function runSearch17(){if(typeof searchMembersBefore17!=='function'||searchCompose17)return;const v=searchPending17;searchTimer17=0;searchMembersBefore17(v);setTimeout(bindSearch17,0)}
if(typeof searchMembersBefore17==='function')window.searchMembers46=function(v){
 searchPending17=String(v??'');clearTimeout(searchTimer17);
 const ev=window.event;if(searchCompose17||ev?.isComposing)return;
 searchTimer17=setTimeout(runSearch17,180);
};
function bindSearch17(){
 const input=$('memberSearchInput46');if(!input||input.dataset.ime17==='1')return;input.dataset.ime17='1';
 input.addEventListener('compositionstart',()=>{searchCompose17=true;clearTimeout(searchTimer17)});
 input.addEventListener('compositionend',()=>{searchCompose17=false;searchPending17=input.value;clearTimeout(searchTimer17);searchTimer17=setTimeout(runSearch17,20)});
 input.addEventListener('blur',()=>{if(!searchCompose17&&searchTimer17){clearTimeout(searchTimer17);runSearch17()}});
}

/* renderAll now updates only the visible view. Hidden views render when selected, removing periodic full-DOM flashes. */
const renderAllBefore17=renderAll;
renderAll=function(){
 if(!me)return;enforceAuth17();try{renderHeader();renderNav()}catch{}
 if(currentView==='members')renderMembers();else if(currentView==='queue')renderQueue();else if(currentView==='playing'){const box=$('playing');if(box?.children?.length)syncPlaying17();else renderPlaying()}else if(currentView==='stats')renderStats();else if(currentView==='settings')renderSettings();else if(currentView==='groups'&&canManageGroups())renderGroups();
 document.querySelectorAll('.view').forEach(v=>v.classList.toggle('on',v.id===currentView));document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('on',b.dataset.v===currentView));
};

/* Polling still runs in real time, but its legacy renderAll call is suppressed for queue/playing. */
const loadStateBefore17=loadState;
loadState=async function(...args){
 if(actionBusy17)return;
 const smooth=!!T&&(currentView==='queue'||currentView==='playing')&&$(currentView)?.children?.length;
 if(!smooth){const r=await loadStateBefore17(...args);enforceAuth17();return r}
 const saved=renderAll;renderAll=function(){};
 try{
  const r=await loadStateBefore17(...args);enforceAuth17();
  try{renderHeader();renderNav()}catch{}
  if(currentView==='queue')syncQueue17();else if(currentView==='playing')syncPlaying17();
  return r;
 }finally{renderAll=saved}
};

/* Actions keep their original backend route/warnings, but repaint only the current screen after data arrives. */
const actBefore17=act;
act=async function(...args){
 actionBusy17++;const saved=renderAll;renderAll=function(){};
 try{
  const r=await actBefore17(...args);enforceAuth17();
  try{renderHeader();renderNav()}catch{}
  renderAll=saved;
  if(currentView==='queue')renderQueue();else if(currentView==='playing')syncPlaying17();else if(currentView==='members')renderMembers();else if(currentView==='stats')renderStats();else if(currentView==='settings')renderSettings();else if(currentView==='groups'&&canManageGroups())renderGroups();
  return r;
 }finally{renderAll=saved;actionBusy17=Math.max(0,actionBusy17-1)}
};

const renderSettingsBefore17=renderSettings;
renderSettings=function(){renderSettingsBefore17();const box=$('settings');if(!box)return;[...box.querySelectorAll('.meta')].forEach(el=>{if(/콕매치 v(?:\d+|1\.[0-9]+)/.test(el.textContent||''))el.textContent='콕매치 v1.7 · 실시간 무깜빡임 · 아이폰 이름영역 · 태블릿 검색 안정화'});};

if(location.pathname.startsWith('/launch/v1.7'))history.replaceState(null,'','/');
if(me){enforceAuth17();try{stabilize17(document);bindSearch17();lastQueueSig17=queueSig17();stampPlaying17();renderHeader();renderNav()}catch{}}
})();

/* migrated into v6.0: app-v1.8.js */
(()=>{
const POLL18_API='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-v18-api';
const DEV_NAME18='박태영';
let searchComposing18=false,searchTimer18=0;

function poll18(id){return (Array.isArray(S?.attendancePolls)?S.attendancePolls:[]).find(p=>String(p.id)===String(id))}
function guestEntries18(p){return Array.isArray(p?.guestEntries)?p.guestEntries:[]}
function memberVotes18(p){return p?.memberVotes&&typeof p.memberVotes==='object'?p.memberVotes:{}}
function attendeeMembers18(p){const v=memberVotes18(p);return Object.keys(v).filter(id=>v[id]==='yes').map(id=>M(id)).filter(m=>m&&m.type!=='guest')}
function pollStaff18(){
 const mine=me?.memberId?M(String(me.memberId)):S?.members?.find?.(m=>String(m?.name||'').trim()===String(me?.displayName||'').trim());
 return !!me&&(me.globalAdmin||me.role==='manager'||me.role==='organizer'||me.tempOrganizer||(mine&&typeof isTemp==='function'&&isTemp(mine)));
}
function hiddenAdmin18(){return String(S?.adminBadgeVisibility||'all')==='hidden'}
function viewerDev18(){return !!me&&String(me.displayName||'').trim()===DEV_NAME18&&me.globalAdmin===true}
function attendeeRank18(m){
 const self=(me?.memberId&&String(m?.id)===String(me.memberId))||(!me?.memberId&&String(m?.name||'').trim()===String(me?.displayName||'').trim());
 if(self)return -100;
 const r=roleOf(m);
 if(r==='admin')return hiddenAdmin18()&&!viewerDev18()?4:0;
 if(r==='manager')return 1;
 if(r==='organizer')return 2;
 if(typeof isTemp==='function'&&isTemp(m))return 3;
 return 4;
}
function gender18(m){const f=m?.gender==='여';return `<span class="pollGender72 ${f?'female':'male'}">${f?'여':'남'}</span>`}
function currentYear18(){return Number(new Intl.DateTimeFormat('en',{timeZone:'Asia/Seoul',year:'numeric'}).format(new Date()))||new Date().getFullYear()}
function ageBand18(year){const y=Number(year),age=currentYear18()-y;if(!Number.isFinite(age)||age<0)return '30';return String(Math.max(10,Math.min(80,Math.floor(age/10)*10)))}
function inviterOptions18(){return (S.members||[]).filter(m=>m.type!=='guest').map(m=>String(m.name||'').trim()).filter(Boolean).sort((a,b)=>a.localeCompare(b,'ko')).map(n=>`<option value="${esc(n)}"></option>`).join('')}
async function request18(action,body={}){
 const r=await fetch(POLL18_API,{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+T},body:JSON.stringify({action,groupId:currentGroupId,...body}),cache:'no-store'});
 const x=await r.json().catch(()=>({}));
 if(!r.ok){if(r.status===401)throw new Error('로그인이 만료되었습니다.');throw new Error(x.error||'처리에 실패했습니다.')}
 if(x.data){S=x.data;normalizeClient()}
 return x;
}

window.openGuestAdd72=function(id){
 if(!pollStaff18())return alert('편성자 이상 권한이 필요합니다.');
 openModal(`<h3>게스트 참가 추가</h3>
  <div class="field"><label>이름</label><input id="pollGuestName72" maxlength="30" autocomplete="off" placeholder="게스트 이름"></div>
  <div class="pollGuestYearRow18">
   <div class="field"><label>출생연도</label><input id="pollGuestYear18" type="number" inputmode="numeric" min="1900" max="${currentYear18()}" placeholder="예: 1992"></div>
   <div class="field"><label>연령대</label><select id="pollGuestAge18">${[10,20,30,40,50,60,70,80].map(x=>`<option value="${x}" ${x===30?'selected':''}>${x}대</option>`).join('')}</select></div>
  </div>
  <div class="grid2">
   <div class="field"><label>성별</label><select id="pollGuestGender72"><option>남</option><option>여</option></select></div>
   <div class="field"><label>급수</label><select id="pollGuestCls72">${['A','B','C','D','E'].map(x=>`<option ${x==='C'?'selected':''}>${x}</option>`).join('')}</select></div>
  </div>
  <div class="field"><label>초대인</label><input id="pollGuestInviter18" list="pollGuestInviters18" maxlength="30" autocomplete="off" placeholder="초대한 회원 이름"><datalist id="pollGuestInviters18">${inviterOptions18()}</datalist></div>
  <div class="note">출생연도를 입력하면 연령대가 자동 선택됩니다. 등록한 게스트는 회원명부에도 당일 게스트로 자동 추가되며 리셋 또는 새벽 5시에 삭제됩니다.</div>
  <div class="acts"><button class="btn ghost" onclick="closeModal()">취소</button><button class="btn pri" onclick="addPollGuest72('${esc(id)}')">참가명단 반영</button></div>`);
 const year=$('pollGuestYear18'),age=$('pollGuestAge18');
 year?.addEventListener('input',()=>{const y=String(year.value||'').trim();if(/^\d{4}$/.test(y)&&age)age.value=ageBand18(y)});
 setTimeout(()=>$('pollGuestName72')?.focus(),30);
};

window.addPollGuest72=async function(id){
 const name=$('pollGuestName72')?.value.trim()||'',year=$('pollGuestYear18')?.value.trim()||'',inviter=$('pollGuestInviter18')?.value.trim()||'';
 if(!name)return alert('게스트 이름을 입력해주세요.');
 if(!/^\d{4}$/.test(year)||Number(year)<1900||Number(year)>currentYear18())return alert('출생연도를 4자리로 입력해주세요.');
 if(!inviter)return alert('초대인을 입력해주세요.');
 try{
  await request18('poll_guest_add',{pollId:id,name,year,age:ageBand18(year),gender:$('pollGuestGender72')?.value||'남',cls:$('pollGuestCls72')?.value||'C',inviter});
  closeModal();renderAll();goView('stats');
 }catch(e){showError(e)}
};
window.removePollGuest72=async function(pid,gid){
 if(!pollStaff18())return;
 try{await request18('poll_guest_remove',{pollId:pid,guestId:gid});renderAll();openPollAttendees18(pid)}catch(e){showError(e)}
};

window.openPollAttendees18=function(id){
 const p=poll18(id);if(!p)return;
 const order=new Map((S.members||[]).map((m,i)=>[String(m.id),i]));
 const members=attendeeMembers18(p).sort((a,b)=>attendeeRank18(a)-attendeeRank18(b)||(order.get(String(a.id))??99999)-(order.get(String(b.id))??99999));
 const guests=guestEntries18(p).slice().sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'ko'));
 const total=members.length+guests.length;
 const memberRows=members.map(m=>`<div class="pollMember72">${gender18(m)}<span class="pollName72">${esc(m.name)}</span><span class="tag">${esc(m.cls||'C')}</span>${roleBadge(m)}</div>`).join('');
 const guestRows=guests.map(g=>`<div class="pollGuestRow72"><div>${gender18(g)} <b>${esc(g.name)}</b> <span class="tag">${esc(g.cls||'C')}</span><div class="pollGuestMeta18">${esc(g.year||'')}년생 · ${esc(g.age||'30')}대${g.inviter?` · 초대 ${esc(g.inviter)}`:''}</div></div>${pollStaff18()?`<button class="miniBtn" onclick="removePollGuest72('${esc(p.id)}','${esc(g.id)}')">삭제</button>`:''}</div>`).join('');
 openModal(`<h3>참석 명단 · 총 ${total}명</h3>
  <div class="pollAttendeeSection18"><div class="pollAttendeeTitle18"><b>회원</b><span class="tag">${members.length}명</span></div>${memberRows||'<div class="empty">참석을 선택한 회원이 없습니다.</div>'}</div>
  <div class="pollAttendeeSection18"><div class="pollAttendeeTitle18"><b>게스트</b><span class="tag">${guests.length}명</span></div>${guestRows||'<div class="empty">등록된 게스트가 없습니다.</div>'}</div>
  ${pollStaff18()?`<button class="btn pri" style="width:100%;margin-top:10px" onclick="closeModal();openGuestAdd72('${esc(p.id)}')">+ 게스트 참가 추가</button>`:''}
  <button class="btn ghost" style="width:100%;margin-top:7px" onclick="closeModal()">닫기</button>`);
};
window.openPollMembers72=window.openPollAttendees18;
window.openPollGuests72=window.openPollAttendees18;

function patchPollCounts18(){
 const stats=$('stats');if(!stats)return;
 stats.querySelectorAll('.pollCard90,.pollCard72').forEach(card=>{
  const add=card.querySelector('[onclick*="openGuestAdd72"]'),membersBtn=card.querySelector('[onclick*="openPollMembers72"]'),guestsBtn=card.querySelector('[onclick*="openPollGuests72"]');
  const src=add?.getAttribute('onclick')||membersBtn?.getAttribute('onclick')||guestsBtn?.getAttribute('onclick')||'';
  const m=src.match(/\('([^']+)'\)/);if(!m)return;const p=poll18(m[1]);if(!p)return;
  const mc=attendeeMembers18(p).length,gc=guestEntries18(p).length,total=mc+gc;
  const counts=card.querySelector('.pollCounts72');if(!counts)return;
  counts.innerHTML=`<button class="pollCountBtn72 pollCountBtn18" onclick="openPollAttendees18('${esc(p.id)}')"><span><b>${total}명</b> 참석 명단</span><span class="pollBreak18">회원 ${mc} · 게스트 ${gc}</span></button>`;
 });
}
const renderStatsBefore18=renderStats;
renderStats=function(){renderStatsBefore18();patchPollCounts18()};

/* iPhone/tablet member search: detach all legacy IME listeners and filter existing cards without re-rendering. */
function memberCardText18(card){return String(card?.textContent||'').toLowerCase()}
function applyMemberSearch18(v){
 const box=$('members');if(!box)return;const q=String(v||'').trim().toLowerCase();let shown=0,total=0;
 box.querySelectorAll('.memberCard').forEach(card=>{total++;const on=!q||memberCardText18(card).includes(q);card.classList.toggle('searchHidden18',!on);if(on)shown++});
 const search=box.querySelector('.memberSearch46 .meta');if(search)search.textContent=q?`현재 화면 검색 ${shown}명 / ${total}명`:`현재 화면 ${total}명`;
}
window.searchMembers46=function(v){clearTimeout(searchTimer18);const input=$('memberSearchInput46'),value=String(v??input?.value??'');if(searchComposing18)return;searchTimer18=setTimeout(()=>applyMemberSearch18(value),60)};
function bindMemberSearch18(){
 let input=$('memberSearchInput46');if(!input||input.dataset.v18==='1')return;
 const clone=input.cloneNode(true);clone.dataset.v18='1';clone.removeAttribute('oninput');clone.removeAttribute('data-ime17');clone.autocomplete='off';clone.spellcheck=false;input.replaceWith(clone);input=clone;
 input.addEventListener('compositionstart',()=>{searchComposing18=true;clearTimeout(searchTimer18)});
 input.addEventListener('compositionend',()=>{searchComposing18=false;applyMemberSearch18(input.value)});
 input.addEventListener('input',e=>{if(e.isComposing||searchComposing18)return;clearTimeout(searchTimer18);searchTimer18=setTimeout(()=>applyMemberSearch18(input.value),60)});
}
const renderMembersBefore18=renderMembers;
renderMembers=function(){
 const old=$('memberSearchInput46'),focused=!!old&&document.activeElement===old,typed=old?.value||'',sel=focused?old.selectionStart:null;
 if(focused&&searchComposing18)return;
 renderMembersBefore18();bindMemberSearch18();const input=$('memberSearchInput46');if(input&&typed){input.value=typed;applyMemberSearch18(typed)}
 if(focused&&input){input.focus({preventScroll:true});try{input.setSelectionRange(sel??typed.length,sel??typed.length)}catch{}}
};

const settingsBefore18=renderSettings;
renderSettings=function(){settingsBefore18();const b=$('settings');if(!b)return;[...b.querySelectorAll('.meta')].forEach(el=>{if(/콕매치 v(?:\d+|1\.[0-9]+)/.test(el.textContent||''))el.textContent='콕매치 v1.8 · 투표 게스트 당일회원 연동 · 참석명단 통합 · 검색 입력 안정화'});};

if(me){try{bindMemberSearch18();patchPollCounts18()}catch{}}
})();

/* migrated into v6.0: app-v1.9.js */
(()=>{
const POLL19_API='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-v19-api';
const DEV_NAME19='박태영';

function polls19(){S.attendancePolls=Array.isArray(S?.attendancePolls)?S.attendancePolls:[];return S.attendancePolls}
function poll19(id){return polls19().find(p=>String(p.id)===String(id))}
function votes19(p){return p?.memberVotes&&typeof p.memberVotes==='object'?p.memberVotes:{}}
function guests19(p){return Array.isArray(p?.guestEntries)?p.guestEntries:[]}
function yesMembers19(p){const v=votes19(p);return Object.keys(v).filter(id=>v[id]==='yes').map(id=>M(id)).filter(m=>m&&m.type!=='guest')}
function mine19(){if(me?.memberId){const m=M(String(me.memberId));if(m)return m}const n=String(me?.displayName||'').trim();return (S.members||[]).find(m=>String(m?.name||'').trim()===n)||null}
function staff19(){const m=mine19();return !!me&&(me.globalAdmin||me.role==='manager'||me.role==='organizer'||me.tempOrganizer||(m&&typeof isTemp==='function'&&isTemp(m)))}
function canVote19(){const m=mine19();return !!m&&m.type!=='guest'}
function hiddenAdmin19(){return String(S?.adminBadgeVisibility||'all')==='hidden'}
function viewerDev19(){return !!me&&String(me.displayName||'').trim()===DEV_NAME19&&me.globalAdmin===true}
function roleRank19(m){
 const self=(me?.memberId&&String(m?.id)===String(me.memberId))||(!me?.memberId&&String(m?.name||'').trim()===String(me?.displayName||'').trim());
 if(self)return -100;const r=roleOf(m);if(r==='admin')return hiddenAdmin19()&&!viewerDev19()?4:0;if(r==='manager')return 1;if(r==='organizer')return 2;if(typeof isTemp==='function'&&isTemp(m))return 3;return 4;
}
function memberOrder19(){return new Map((S.members||[]).map((m,i)=>[String(m.id),i]))}
function count19(p){const member=yesMembers19(p).length,guest=guests19(p).length;return {member,guest,total:member+guest}}
function totalLimit19(p){return Math.max(0,Number(p?.totalLimit)||0)}
function guestLimit19(p){return Math.max(0,Number(p?.guestLimit)||0)}
function expired19(p){const d=String(p?.date||''),e=String(p?.endTime||'');if(!/^\d{4}-\d{2}-\d{2}$/.test(d)||!/^\d{2}:(00|30)$/.test(e))return false;return Date.parse(`${d}T${e}:00+09:00`)<=Date.now()}
function genderPerson19(m){const f=m?.gender==='여',label=f?'여성':'남성';return `<span class="pollGenderPerson19 ${f?'female':'male'}" title="${label}" aria-label="${label}"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="7" r="4"></circle><path d="M4.5 21c.5-5 3.2-8 7.5-8s7 3 7.5 8z"></path></svg></span>`}
function gradeTag19(m){return `<span class="tag">${esc(String(m?.age||'30'))}${esc(String(m?.cls||'C'))}</span>`}
function role19(m){return m?.type==='guest'?'<span class="roleBadge guest45">게스트</span>':roleBadge(m)}
function status19(p){const c=count19(p),tl=totalLimit19(p),gl=guestLimit19(p);return `<div class="pollCapacity19"><span><b>전체</b> ${tl?`${c.total}/${tl}`:`${c.total}명`}</span><span><b>회원</b> ${c.member}명</span><span><b>게스트</b> ${gl?`${c.guest}/${gl}`:`${c.guest}명`}</span></div>`}

async function request19(action,body={}){
 const r=await fetch(POLL19_API,{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+T},body:JSON.stringify({action,groupId:currentGroupId,...body}),cache:'no-store'});
 const x=await r.json().catch(()=>({}));if(!r.ok)throw new Error(x.error||'처리에 실패했습니다.');if(x.data){S=x.data;normalizeClient()}return x;
}

function timeOptions19(selected='18:30',forStart=false){const out=[];for(let h=0;h<24;h++)for(const m of [0,30]){const v=`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;out.push(`<option value="${v}" ${v===selected?'selected':''} ${forStart&&v==='23:30'?'disabled':''}>${v}</option>`)}return out.join('')}
function addMinutes19(t,min){const [h,m]=String(t||'18:30').split(':').map(Number),n=h*60+m+min;return `${String(Math.min(23,Math.floor(n/60))).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`}
function today19(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())}
function autoTitle19(date,time,location){const a=String(date||'').split('-').map(Number);if(a.length!==3||!a[1])return '운동';return `${a[1]}월 ${a[2]}일 ${time||''}${location?' '+location:''} 운동`}
function pollForm19(p=null){
 const date=p?.date||today19(),start=p?.time||'18:30',end=p?.endTime||addMinutes19(start,180),loc=p?.location||'',title=p?.title||autoTitle19(date,start,loc),total=totalLimit19(p),guest=guestLimit19(p);
 return `<h3>${p?'운동 참석 투표 수정':'운동 참석 투표 만들기'}</h3><div class="pollForm19">
  <div class="field"><label>일자</label><input id="pollDate19" type="date" value="${esc(date)}"></div>
  <div class="grid2"><div class="field"><label>운동 시작시간</label><select id="pollStart19">${timeOptions19(start,true)}</select></div><div class="field"><label>운동 종료시간</label><select id="pollEnd19">${timeOptions19(end,false)}</select></div></div>
  <div class="field"><label>운동 장소</label><input id="pollLocation19" maxlength="40" value="${esc(loc)}" placeholder="예: 신리천 2코트"></div>
  <div class="field"><label>투표 제목</label><input id="pollTitle19" maxlength="60" value="${esc(title)}"></div>
  <div class="grid2 pollLimitGrid19"><div class="field"><label>전체 인원 제한</label><input id="pollTotalLimit19" type="number" inputmode="numeric" min="0" max="999" value="${total}"><div class="meta">0 = 제한 없음</div></div><div class="field"><label>게스트 인원 제한</label><input id="pollGuestLimit19" type="number" inputmode="numeric" min="0" max="999" value="${guest}"><div class="meta">0 = 제한 없음</div></div></div>
  <div class="acts"><button class="btn ghost" onclick="closeModal()">취소</button><button class="btn pri" onclick="${p?`savePollEdit90('${esc(p.id)}')`:'createPoll72()'}">${p?'수정 저장':'투표 시작'}</button></div></div>`;
}
function bindPollForm19(){
 const start=$('pollStart19'),end=$('pollEnd19'),date=$('pollDate19'),loc=$('pollLocation19'),title=$('pollTitle19');if(!start||!end)return;
 const enforce=()=>{let first='';[...end.options].forEach(o=>{o.disabled=String(o.value)<=String(start.value);if(!o.disabled&&!first)first=o.value});if(String(end.value)<=String(start.value))end.value=first||''};
 let manual=false;const sync=()=>{if(!manual&&title)title.value=autoTitle19(date?.value||'',start.value||'',loc?.value.trim()||'')};
 enforce();start.addEventListener('change',()=>{enforce();sync()});date?.addEventListener('change',sync);loc?.addEventListener('input',sync);title?.addEventListener('input',()=>{manual=true});
}
function readPollForm19(){
 const date=$('pollDate19')?.value||'',time=$('pollStart19')?.value||'',endTime=$('pollEnd19')?.value||'',location=$('pollLocation19')?.value.trim()||'',title=$('pollTitle19')?.value.trim()||'',totalLimit=Math.max(0,Math.floor(Number($('pollTotalLimit19')?.value)||0)),guestLimit=Math.max(0,Math.floor(Number($('pollGuestLimit19')?.value)||0));
 if(!date||!time||!endTime)return {error:'운동 일자와 시작·종료시간을 입력해주세요.'};if(endTime<=time)return {error:'운동 종료시간은 시작시간보다 늦게 선택해주세요.'};if(!location)return {error:'운동 장소를 입력해주세요.'};if(totalLimit>0&&guestLimit>0&&guestLimit>totalLimit)return {error:'게스트 제한인원은 전체 제한인원보다 많을 수 없습니다.'};return {date,time,endTime,location,title:title||autoTitle19(date,time,location),totalLimit,guestLimit};
}
window.openPollCreate72=function(){if(!staff19())return alert('개발자·모임장·운영진·편성자만 투표를 만들 수 있습니다.');openModal(pollForm19());setTimeout(bindPollForm19,0)};
window.openPollEdit90=function(id){if(!staff19())return alert('투표 수정 권한이 없습니다.');const p=poll19(id);if(!p)return alert('투표를 찾을 수 없습니다.');openModal(pollForm19(p));setTimeout(bindPollForm19,0)};
window.createPoll72=async function(){const v=readPollForm19();if(v.error)return alert(v.error);try{await request19('poll_create',v);closeModal();renderStats();goView('stats')}catch(e){showError(e)}};
window.savePollEdit90=async function(id){const v=readPollForm19();if(v.error)return alert(v.error);try{await request19('poll_update',{pollId:id,...v});closeModal();renderStats()}catch(e){showError(e)}};
window.deletePoll72=async function(id){if(!staff19())return alert('투표 삭제 권한이 없습니다.');if(!confirm('이 참석 투표를 삭제하시겠습니까?'))return;try{await request19('poll_delete',{pollId:id});renderStats()}catch(e){showError(e)}};
window.votePoll72=async function(id){if(!canVote19())return alert('회원만 참석할 수 있습니다.');try{await request19('poll_vote',{pollId:id});renderStats()}catch(e){showError(e)}};

function currentYear19(){return Number(new Intl.DateTimeFormat('en',{timeZone:'Asia/Seoul',year:'numeric'}).format(new Date()))||new Date().getFullYear()}
function ageBand19(year){const y=Number(year),age=currentYear19()-y;if(!Number.isFinite(age)||age<0)return '30';return String(Math.max(10,Math.min(80,Math.floor(age/10)*10)))}
function inviterOptions19(){return (S.members||[]).filter(m=>m.type!=='guest').map(m=>String(m.name||'').trim()).filter(Boolean).sort((a,b)=>a.localeCompare(b,'ko')).map(n=>`<option value="${esc(n)}"></option>`).join('')}
window.openGuestAdd72=function(id){
 if(!staff19())return alert('게스트 입력 권한이 없습니다.');const p=poll19(id);if(!p)return;if(p.guestClosed)return alert('게스트 모집이 마감되었습니다.');const c=count19(p),tl=totalLimit19(p),gl=guestLimit19(p);
 openModal(`<h3>게스트 참가 추가</h3>${status19(p)}<div class="field"><label>이름</label><input id="pollGuestName19" maxlength="30" autocomplete="off" placeholder="게스트 이름"></div><div class="grid2"><div class="field"><label>출생연도</label><input id="pollGuestYear19" type="number" inputmode="numeric" min="1900" max="${currentYear19()}" placeholder="예: 1992"></div><div class="field"><label>연령대</label><select id="pollGuestAge19">${[10,20,30,40,50,60,70,80].map(x=>`<option value="${x}" ${x===30?'selected':''}>${x}대</option>`).join('')}</select></div></div><div class="grid2"><div class="field"><label>성별</label><select id="pollGuestGender19"><option>남</option><option>여</option></select></div><div class="field"><label>급수</label><select id="pollGuestCls19">${['A','B','C','D','E'].map(x=>`<option ${x==='C'?'selected':''}>${x}</option>`).join('')}</select></div></div><div class="field"><label>초대인</label><input id="pollGuestInviter19" list="pollGuestInviters19" maxlength="30" autocomplete="off" placeholder="초대한 회원 이름"><datalist id="pollGuestInviters19">${inviterOptions19()}</datalist></div><div class="note">${tl?`전체 ${tl}명 제한 · 현재 ${c.total}명. `:''}${gl?`게스트 ${gl}명 제한 · 현재 ${c.guest}명.`:''}</div><div class="acts"><button class="btn ghost" onclick="closeModal()">취소</button><button class="btn pri" onclick="addPollGuest72('${esc(id)}')">게스트 추가</button></div>`);
 const y=$('pollGuestYear19'),a=$('pollGuestAge19');y?.addEventListener('input',()=>{if(/^\d{4}$/.test(String(y.value||''))&&a)a.value=ageBand19(y.value)});setTimeout(()=>$('pollGuestName19')?.focus(),30);
};
window.addPollGuest72=async function(id){const name=$('pollGuestName19')?.value.trim()||'',year=$('pollGuestYear19')?.value.trim()||'',inviter=$('pollGuestInviter19')?.value.trim()||'';if(!name)return alert('게스트 이름을 입력해주세요.');if(!/^\d{4}$/.test(year)||Number(year)<1900||Number(year)>currentYear19())return alert('출생연도를 4자리로 입력해주세요.');if(!inviter)return alert('초대인을 입력해주세요.');try{await request19('poll_guest_add',{pollId:id,name,year,age:ageBand19(year),gender:$('pollGuestGender19')?.value||'남',cls:$('pollGuestCls19')?.value||'C',inviter});closeModal();renderStats()}catch(e){showError(e)}};
window.removePollGuest72=async function(pid,gid){if(!staff19())return;try{await request19('poll_guest_remove',{pollId:pid,guestId:gid});openPollAttendees18(pid);renderStats()}catch(e){showError(e)}};
window.removePollMember19=async function(pid,mid){if(!staff19())return;if(!confirm('이 회원을 참석명단에서 제외하시겠습니까?'))return;try{await request19('poll_member_remove',{pollId:pid,memberId:mid});openPollAttendees18(pid);renderStats()}catch(e){showError(e)}};
window.toggleGuestClosed19=async function(pid,closed){if(!staff19())return;const msg=closed?'게스트 모집을 마감하시겠습니까?':'게스트 모집을 다시 시작하시겠습니까?';if(!confirm(msg))return;try{await request19('poll_guest_close',{pollId:pid,closed:!!closed});renderStats()}catch(e){showError(e)}};

function attendeeTint19(){
 const root=$('modalSheet')||document;root.querySelectorAll('.pollAttendeeCard19').forEach(row=>{const tag=row.querySelector('.tag');if(!tag)return;const cs=getComputedStyle(tag);let base=cs.backgroundColor;if(!base||base==='transparent'||/rgba\([^)]*,\s*0\)/.test(base))base=cs.borderTopColor||cs.color;const m=String(base).match(/rgba?\((\d+)[, ]+\s*(\d+)[, ]+\s*(\d+)/i);if(!m)return;const txt=(tag.textContent||'').toUpperCase(),a=/B$/.test(txt)?.30:/C$/.test(txt)?.20:.24;row.style.setProperty('background-color',`rgba(${m[1]},${m[2]},${m[3]},${a})`,'important');row.style.setProperty('transition','none','important')});
}
window.openPollAttendees18=function(id){
 const p=poll19(id);if(!p)return;const order=memberOrder19(),members=yesMembers19(p).sort((a,b)=>roleRank19(a)-roleRank19(b)||(order.get(String(a.id))??99999)-(order.get(String(b.id))??99999)),gs=guests19(p),c=count19(p);
 const memberRows=members.map(m=>`<div class="pollAttendeeCard19 attendeeRow"><div class="pollAttendeeMain19">${genderPerson19(m)}<span class="pollAttendeeName19">${esc(m.name)}</span>${gradeTag19(m)}${role19(m)}</div>${staff19()?`<button class="pollRemove19" onclick="removePollMember19('${esc(p.id)}','${esc(m.id)}')">×</button>`:''}</div>`).join('');
 const guestRows=gs.map(g=>`<div class="pollAttendeeCard19 attendeeRow"><div><div class="pollAttendeeMain19">${genderPerson19(g)}<span class="pollAttendeeName19">${esc(g.name)}</span>${gradeTag19(g)}${role19({type:'guest'})}</div><div class="pollGuestMeta19">${esc(g.year||'')}년생${g.inviter?` · 초대 ${esc(g.inviter)}`:''}</div></div>${staff19()?`<button class="pollRemove19" onclick="removePollGuest72('${esc(p.id)}','${esc(g.id)}')">×</button>`:''}</div>`).join('');
 openModal(`<h3>참석 명단 · 총 ${c.total}명</h3>${status19(p)}<div class="pollAttendeeSection19"><div class="pollAttendeeTitle19"><b>회원</b><span class="tag">${members.length}명</span></div>${memberRows||'<div class="empty">참석 회원이 없습니다.</div>'}</div><div class="pollAttendeeSection19"><div class="pollAttendeeTitle19"><b>게스트</b><span class="tag">${gs.length}명</span></div>${guestRows||'<div class="empty">등록된 게스트가 없습니다.</div>'}</div><button class="btn ghost" style="width:100%;margin-top:10px" onclick="closeModal()">닫기</button>`);setTimeout(attendeeTint19,0);
};
window.openPollMembers72=window.openPollAttendees18;window.openPollGuests72=window.openPollAttendees18;

function renderPollCard19(p){
 const c=count19(p),mine=mine19(),vote=mine?votes19(p)[String(mine.id)]||'':'',staff=staff19(),closed=!!p.guestClosed;
 return `<div class="card pollCard72 pollCard19"><div class="pollHead72"><div><b>${esc(p.title||'운동 참석 투표')}</b><div class="meta pollWhen19">${esc(p.date||'')} · ${esc(p.time||'')}~${esc(p.endTime||'')} · ${esc(p.location||'')}</div></div>${staff?`<div class="pollHeadBtns19"><button class="miniBtn" onclick="openPollEdit90('${esc(p.id)}')">수정</button><button class="miniBtn" onclick="deletePoll72('${esc(p.id)}')">삭제</button></div>`:''}</div>${status19(p)}<div class="pollActionGrid19">${canVote19()?`<button class="btn ${vote==='yes'?'pri':'ghost'}" ${vote==='yes'?'disabled':''} onclick="votePoll72('${esc(p.id)}')">${vote==='yes'?'✓ 참석 완료':'참석'}</button>`:'<button class="btn ghost" disabled>참석</button>'}<button class="btn ghost" onclick="openPollAttendees18('${esc(p.id)}')">참석 명단 ${c.total}명</button></div>${staff?`<div class="pollGuestAdmin19">${closed?`<button class="btn ghost pollGuestClosed19" disabled>게스트 마감</button><button class="miniBtn" onclick="toggleGuestClosed19('${esc(p.id)}',false)">모집 재개</button>`:`<button class="btn ghost" onclick="openGuestAdd72('${esc(p.id)}')">+ 게스트 참가 추가</button><button class="miniBtn" onclick="toggleGuestClosed19('${esc(p.id)}',true)">게스트 모집 마감</button>`}</div>`:''}</div>`;
}
function renderPolls19(){const ps=polls19().filter(p=>!expired19(p)).slice().sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))||String(a.time||'').localeCompare(String(b.time||'')));return `<div class="subhead pollHead90"><b>운동 참석 투표</b>${staff19()?'<button class="btn pri" onclick="openPollCreate72()">+ 투표 만들기</button>':''}</div>${ps.length?ps.map(renderPollCard19).join(''):'<div class="empty pollEmpty90">진행 중인 참석 투표가 없습니다.</div>'}`}
function replacePollSection19(){const box=$('stats');if(!box)return;let wrap=box.querySelector('.pollWrap90');if(!wrap){wrap=document.createElement('div');wrap.className='pollWrap90';const recent=[...box.querySelectorAll(':scope > .card')].find(c=>(c.textContent||'').includes('오늘 최근 경기'));if(recent)recent.insertAdjacentElement('beforebegin',wrap);else box.appendChild(wrap)}wrap.innerHTML=renderPolls19()}
const renderStatsBefore19=renderStats;renderStats=function(){renderStatsBefore19();replacePollSection19()};
const renderSettingsBefore19=renderSettings;renderSettings=function(){renderSettingsBefore19();const b=$('settings');if(!b)return;[...b.querySelectorAll('.meta')].forEach(el=>{if(/콕매치 v(?:\d+|1\.[0-9]+)/.test(el.textContent||''))el.textContent='콕매치 v1.9 · 참석정원/게스트정원 · 참석명단 관리 · 게스트 마감'});};
if(me&&currentView==='stats')renderStats();
})();

/* migrated into v6.0: app-v2.0.js */
(()=>{
const TODAY20=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
let selectedPollDate20=TODAY20(),calendarMonth20=selectedPollDate20.slice(0,7),removeBusy20=new Set();

function activePolls20(){return polls19().filter(p=>!expired19(p)).slice().sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))||String(a.time||'').localeCompare(String(b.time||'')))}
function monthParts20(ym){const [y,m]=String(ym).split('-').map(Number);return {y,m}}
function monthShift20(ym,d){const {y,m}=monthParts20(ym),x=new Date(Date.UTC(y,m-1+d,1));return `${x.getUTCFullYear()}-${String(x.getUTCMonth()+1).padStart(2,'0')}`}
function date20(y,m,d){return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`}
function calendarHtml20(){
 const today=TODAY20(),currentMonth=today.slice(0,7),{y,m}=monthParts20(calendarMonth20),first=new Date(Date.UTC(y,m-1,1)).getUTCDay(),last=new Date(Date.UTC(y,m,0)).getUTCDate();
 const pollDates=new Set(activePolls20().map(p=>String(p.date||'')));
 const cells=[];for(let i=0;i<first;i++)cells.push('<span class="pollCalBlank20"></span>');
 for(let d=1;d<=last;d++){
  const dt=date20(y,m,d),past=dt<today,has=pollDates.has(dt),sel=dt===selectedPollDate20,isToday=dt===today;
  cells.push(`<button class="pollCalDay20 ${has?'hasPoll':''} ${sel?'selected':''} ${isToday?'today':''}" ${past?'disabled':''} onclick="selectPollDate20('${dt}')"><span>${d}</span>${has?'<i></i>':''}</button>`);
 }
 const prevDisabled=calendarMonth20<=currentMonth;
 return `<div class="pollCalendar20"><div class="pollCalHead20"><button class="pollCalNav20" ${prevDisabled?'disabled':''} onclick="movePollMonth20(-1)">‹</button><b>${y}년 ${m}월</b><button class="pollCalNav20" onclick="movePollMonth20(1)">›</button></div><div class="pollCalWeek20"><span>일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span></div><div class="pollCalGrid20">${cells.join('')}</div><div class="pollCalLegend20"><span><i></i> 투표 있음</span><span>선택일 ${selectedPollDate20.slice(5).replace('-','/')}</span></div></div>`;
}
window.selectPollDate20=function(dt){if(String(dt)<TODAY20())return;selectedPollDate20=String(dt);calendarMonth20=selectedPollDate20.slice(0,7);replacePollSection19()};
window.movePollMonth20=function(delta){const next=monthShift20(calendarMonth20,Number(delta)||0),today=TODAY20(),current=today.slice(0,7);if(next<current)return;calendarMonth20=next;selectedPollDate20=next===current?today:`${next}-01`;replacePollSection19()};

renderPolls19=function(){
 const ps=activePolls20().filter(p=>String(p.date||'')===selectedPollDate20);
 return `${calendarHtml20()}<div class="subhead pollHead90"><b>운동 참석 투표</b>${staff19()?'<button class="btn pri" onclick="openPollCreate72()">+ 투표 만들기</button>':''}</div>${ps.length?ps.map(renderPollCard19).join(''):`<div class="empty pollEmpty90">${selectedPollDate20.slice(5).replace('-','/')} 예정된 참석 투표가 없습니다.</div>`}`;
};

function gradeKey20(txt){const m=String(txt||'').trim().toUpperCase().match(/([A-E])$/);return m?m[1]:''}
function rgba20(c,a){const m=String(c||'').match(/rgba?\((\d+)[, ]+\s*(\d+)[, ]+\s*(\d+)/i);return m?`rgba(${m[1]},${m[2]},${m[3]},${a})`:''}
function memberGradeVisuals20(){
 const map={};const box=$('members');if(!box)return map;
 box.querySelectorAll('.memberCard').forEach(card=>{const tag=card.querySelector('.tag'),g=gradeKey20(tag?.textContent);if(!tag||!g||map[g])return;const ts=getComputedStyle(tag),cs=getComputedStyle(card);map[g]={tagBg:ts.backgroundColor,tagColor:ts.color,tagBorder:ts.borderColor,cardBg:cs.backgroundColor}});return map;
}
function applyAttendeeVisuals20(){
 const root=$('modalSheet');if(!root)return;const refs=memberGradeVisuals20();
 root.querySelectorAll('.pollAttendeeCard20').forEach(row=>{const tag=row.querySelector('.tag'),g=gradeKey20(tag?.textContent);if(!tag||!g)return;const v=refs[g];if(v){tag.style.setProperty('background',v.tagBg,'important');tag.style.setProperty('color',v.tagColor,'important');if(v.tagBorder&&v.tagBorder!=='rgba(0, 0, 0, 0)')tag.style.setProperty('border-color',v.tagBorder,'important');row.style.setProperty('background-color',v.cardBg,'important')}else{const cs=getComputedStyle(tag),a=g==='B'?.30:g==='C'?.20:.24;const bg=rgba20(cs.backgroundColor||cs.color,a);if(bg)row.style.setProperty('background-color',bg,'important')}
  row.style.setProperty('border-radius','12px','important');row.style.setProperty('transition','none','important');
 });
}
function attendeeRows20(p){
 const order=memberOrder19(),members=yesMembers19(p).sort((a,b)=>roleRank19(a)-roleRank19(b)||(order.get(String(a.id))??99999)-(order.get(String(b.id))??99999)),gs=guests19(p),c=count19(p);
 const mr=members.map(m=>`<div class="pollAttendeeCard19 pollAttendeeCard20" data-kind="member" data-id="${esc(m.id)}"><div class="pollAttendeeMain19">${genderPerson19(m)}<span class="pollAttendeeName19">${esc(m.name)}</span>${gradeTag19(m)}${role19(m)}</div>${staff19()?`<button class="pollRemove19" onclick="removePollMember20('${esc(p.id)}','${esc(m.id)}',this)">×</button>`:''}</div>`).join('');
 const gr=gs.map(g=>`<div class="pollAttendeeCard19 pollAttendeeCard20" data-kind="guest" data-id="${esc(g.id)}"><div><div class="pollAttendeeMain19">${genderPerson19(g)}<span class="pollAttendeeName19">${esc(g.name)}</span>${gradeTag19(g)}${role19({type:'guest'})}</div><div class="pollGuestMeta19">${esc(g.year||'')}년생${g.inviter?` · 초대 ${esc(g.inviter)}`:''}</div></div>${staff19()?`<button class="pollRemove19" onclick="removePollGuest20('${esc(p.id)}','${esc(g.id)}',this)">×</button>`:''}</div>`).join('');
 return {members,gs,c,html:`<h3 id="pollAttendeeTitle20">참석 명단 · 총 ${c.total}명</h3>${status19(p)}<div class="pollAttendeeSection19"><div class="pollAttendeeTitle19"><b>회원</b><span class="tag" id="pollMemberCount20">${members.length}명</span></div><div id="pollMemberRows20">${mr||'<div class="empty">참석 회원이 없습니다.</div>'}</div></div><div class="pollAttendeeSection19"><div class="pollAttendeeTitle19"><b>게스트</b><span class="tag" id="pollGuestCount20">${gs.length}명</span></div><div id="pollGuestRows20">${gr||'<div class="empty">등록된 게스트가 없습니다.</div>'}</div></div><button class="btn ghost" style="width:100%;margin-top:10px" onclick="closeModal()">닫기</button>`};
}
window.openPollAttendees18=function(id){const p=poll19(id);if(!p)return;openModal(attendeeRows20(p).html);requestAnimationFrame(applyAttendeeVisuals20)};

function refreshAttendeeCounts20(p){
 const c=count19(p),t=$('pollAttendeeTitle20'),mc=$('pollMemberCount20'),gc=$('pollGuestCount20');if(t)t.textContent=`참석 명단 · 총 ${c.total}명`;if(mc)mc.textContent=`${c.member}명`;if(gc)gc.textContent=`${c.guest}명`;
 const cap=$('modalSheet')?.querySelector('.pollCapacity19');if(cap){const wrap=document.createElement('div');wrap.innerHTML=status19(p);cap.replaceWith(wrap.firstElementChild)}
}
function removeRowNow20(btn,p,kind){const row=btn?.closest('.pollAttendeeCard20');if(row)row.remove();const host=$(kind==='member'?'pollMemberRows20':'pollGuestRows20');if(host&&!host.querySelector('.pollAttendeeCard20'))host.innerHTML=`<div class="empty">${kind==='member'?'참석 회원이 없습니다.':'등록된 게스트가 없습니다.'}</div>`;refreshAttendeeCounts20(p)}
function updateBackgroundPoll20(pid){const p=poll19(pid);if(!p)return;const card=[...($('stats')?.querySelectorAll('.pollCard19')||[])].find(c=>(c.querySelector('[onclick*="openPollAttendees18"]')?.getAttribute('onclick')||'').includes(`'${pid}'`));if(!card)return;const c=count19(p),b=card.querySelector('[onclick*="openPollAttendees18"]');if(b)b.textContent=`참석 명단 ${c.total}명`;const cap=card.querySelector('.pollCapacity19');if(cap){const w=document.createElement('div');w.innerHTML=status19(p);cap.replaceWith(w.firstElementChild)}}
window.removePollMember20=async function(pid,mid,btn){if(!staff19())return;if(!confirm('이 회원을 참석명단에서 제외하시겠습니까?'))return;const key=`m:${pid}:${mid}`;if(removeBusy20.has(key))return;const p=poll19(pid);if(!p)return;const old={...votes19(p)};delete p.memberVotes[String(mid)];removeBusy20.add(key);btn&&(btn.disabled=true);removeRowNow20(btn,p,'member');updateBackgroundPoll20(pid);try{await request19('poll_member_remove',{pollId:pid,memberId:mid});updateBackgroundPoll20(pid)}catch(e){p.memberVotes=old;showError(e);openPollAttendees18(pid)}finally{removeBusy20.delete(key)}};
window.removePollGuest20=async function(pid,gid,btn){if(!staff19())return;if(!confirm('이 게스트를 참석명단에서 삭제하시겠습니까?'))return;const key=`g:${pid}:${gid}`;if(removeBusy20.has(key))return;const p=poll19(pid);if(!p)return;const old=guests19(p).slice();p.guestEntries=old.filter(g=>String(g.id)!==String(gid));removeBusy20.add(key);btn&&(btn.disabled=true);removeRowNow20(btn,p,'guest');updateBackgroundPoll20(pid);try{await request19('poll_guest_remove',{pollId:pid,guestId:gid});updateBackgroundPoll20(pid)}catch(e){p.guestEntries=old;showError(e);openPollAttendees18(pid)}finally{removeBusy20.delete(key)}};
/* keep legacy names routed through v2.0 confirmations/optimistic path */
window.removePollMember19=function(pid,mid){const row=$('modalSheet')?.querySelector(`.pollAttendeeCard20[data-kind="member"][data-id="${CSS.escape(String(mid))}"]`);return removePollMember20(pid,mid,row?.querySelector('.pollRemove19'))};
window.removePollGuest72=function(pid,gid){const row=$('modalSheet')?.querySelector(`.pollAttendeeCard20[data-kind="guest"][data-id="${CSS.escape(String(gid))}"]`);return removePollGuest20(pid,gid,row?.querySelector('.pollRemove19'))};

const settingsBefore20=renderSettings;renderSettings=function(){settingsBefore20();const b=$('settings');if(!b)return;[...b.querySelectorAll('.meta')].forEach(el=>{if(/콕매치 v(?:\d+|\d+\.\d+)/.test(el.textContent||''))el.textContent='콕매치 v2.0 · 참석투표 달력 · 참석명단 즉시반응 · 급수색 통일'})};
if(me&&currentView==='stats')renderStats();
})();

/* migrated into v6.0: app-v2.1.js */
(()=>{
const POLL21_API='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-v21-api';
const DEV21='박태영';
let selectedDate21=today21(),month21=selectedDate21.slice(0,7),busy21=new Set();

function today21(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())}
function polls21(){S.attendancePolls=Array.isArray(S?.attendancePolls)?S.attendancePolls:[];return S.attendancePolls}
function poll21(id){return polls21().find(p=>String(p.id)===String(id))}
function votes21(p){p.memberVotes=p?.memberVotes&&typeof p.memberVotes==='object'?p.memberVotes:{};return p.memberVotes}
function guests21(p){p.guestEntries=Array.isArray(p?.guestEntries)?p.guestEntries:[];return p.guestEntries}
function mine21(){if(me?.memberId){const m=M(String(me.memberId));if(m)return m}const n=String(me?.displayName||'').trim();return (S.members||[]).find(m=>String(m?.name||'').trim()===n)||null}
function staff21(){const m=mine21();return !!me&&(me.globalAdmin||me.role==='manager'||me.role==='organizer'||me.tempOrganizer||(m&&typeof isTemp==='function'&&isTemp(m)))}
function canVote21(){const m=mine21();return !!m&&m.type!=='guest'}
function endMs21(p){const d=String(p?.date||''),t=String(p?.endTime||'');if(!/^\d{4}-\d{2}-\d{2}$/.test(d)||!/^\d{2}:(00|30)$/.test(t))return 0;return Date.parse(`${d}T${t}:00+09:00`)}
function active21(){return polls21().filter(p=>{const e=endMs21(p);return !e||e>Date.now()}).slice().sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))||String(a.time||'').localeCompare(String(b.time||'')))}
function yesMembers21(p){const v=votes21(p);return Object.keys(v).filter(id=>v[id]==='yes').map(id=>M(id)).filter(m=>m&&m.type!=='guest')}
function count21(p){const member=yesMembers21(p).length,guest=guests21(p).length;return {member,guest,total:member+guest}}
function totalLimit21(p){return Math.max(0,Math.floor(Number(p?.totalLimit)||0))}
function guestLimit21(p){return Math.max(0,Math.floor(Number(p?.guestLimit)||0))}
function hiddenAdmin21(){return String(S?.adminBadgeVisibility||'all')==='hidden'}
function viewerDev21(){return !!me&&String(me.displayName||'').trim()===DEV21&&me.globalAdmin===true}
function roleRank21(m){const self=(me?.memberId&&String(m?.id)===String(me.memberId))||(!me?.memberId&&String(m?.name||'').trim()===String(me?.displayName||'').trim());if(self)return -100;const r=roleOf(m);if(r==='admin')return hiddenAdmin21()&&!viewerDev21()?4:0;if(r==='manager')return 1;if(r==='organizer')return 2;if(typeof isTemp==='function'&&isTemp(m))return 3;return 4}
function role21(m){return m?.type==='guest'?'<span class="roleBadge guest45">게스트</span>':roleBadge(m)}
function gender21(m){const f=m?.gender==='여',label=f?'여성':'남성';return `<span class="pollGenderPerson19 ${f?'female':'male'}" title="${label}" aria-label="${label}"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="7" r="4"></circle><path d="M4.5 21c.5-5 3.2-8 7.5-8s7 3 7.5 8z"></path></svg></span>`}
function grade21(m){return `<span class="tag">${esc(String(m?.age||'30'))}${esc(String(m?.cls||'C'))}</span>`}
function ymShift21(ym,delta){const [y,m]=String(ym).split('-').map(Number),d=new Date(Date.UTC(y,m-1+delta,1));return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}`}
function date21(y,m,d){return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`}

async function request21(action,body={}){const r=await fetch(POLL21_API,{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+T},body:JSON.stringify({action,groupId:currentGroupId,...body}),cache:'no-store'});const x=await r.json().catch(()=>({}));if(!r.ok)throw new Error(x.error||'처리에 실패했습니다.');if(x.data){S=x.data;normalizeClient()}return x}

function calendar21(){
 const today=today21(),cur=today.slice(0,7),[y,m]=month21.split('-').map(Number),first=new Date(Date.UTC(y,m-1,1)).getUTCDay(),last=new Date(Date.UTC(y,m,0)).getUTCDate(),has=new Set(active21().map(p=>String(p.date||''))),cells=[];
 for(let i=0;i<first;i++)cells.push('<span class="pollCalBlank21"></span>');
 for(let d=1;d<=last;d++){const dt=date21(y,m,d),past=dt<today,withPoll=has.has(dt),sel=dt===selectedDate21,isToday=dt===today;cells.push(`<button class="pollCalDay21 ${withPoll?'hasPoll':''} ${sel?'selected':''} ${isToday?'today':''}" ${past?'disabled':''} onclick="selectPollDate21('${dt}')"><span>${d}</span></button>`)}
 return `<div class="pollCalendar21"><div class="pollCalHead21"><button class="pollCalNav21" ${month21<=cur?'disabled':''} onclick="movePollMonth21(-1)">‹</button><b>${y}년 ${m}월</b><button class="pollCalNav21" onclick="movePollMonth21(1)">›</button></div><div class="pollCalWeek21"><span>일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span></div><div class="pollCalGrid21">${cells.join('')}</div><div class="pollCalLegend21"><span><i></i> 투표 있음</span><span>선택 ${selectedDate21.slice(5).replace('-','/')}</span></div></div>`;
}
window.selectPollDate21=function(dt){if(String(dt)<today21())return;selectedDate21=String(dt);month21=selectedDate21.slice(0,7);replacePoll21()};
window.movePollMonth21=function(delta){const next=ymShift21(month21,Number(delta)||0),cur=today21().slice(0,7);if(next<cur)return;month21=next;selectedDate21=next===cur?today21():`${next}-01`;replacePoll21()};

function countBoxes21(p){const c=count21(p),tl=totalLimit21(p),gl=guestLimit21(p);return `<div class="pollCounts21"><div class="pollCountBox21 total"><b>${tl?`${c.total}/${tl}`:c.total}</b><span>전체</span><small>${tl?'정원':'참석'}</small></div><div class="pollCountBox21 member"><b>${c.member}</b><span>회원</span><small>참석</small></div><div class="pollCountBox21 guest"><b>${gl?`${c.guest}/${gl}`:c.guest}</b><span>게스트</span><small>${gl?'정원':'참석'}</small></div></div>`}
function pollCard21(p){const c=count21(p),m=mine21(),on=!!m&&votes21(p)[String(m.id)]==='yes',staff=staff21(),closed=!!p.guestClosed;return `<div class="card pollCard21"><div class="pollTitleRow21"><div class="pollTitle21">${esc(p.title||'운동 참석 투표')}</div>${staff?`<div class="pollHeadBtns19"><button class="miniBtn" onclick="openPollEdit90('${esc(p.id)}')">수정</button><button class="miniBtn" onclick="deletePoll72('${esc(p.id)}')">삭제</button></div>`:''}</div>${countBoxes21(p)}<div class="pollActions21">${canVote21()?`<button class="btn ${on?'pollAttendOn21':'pri'}" onclick="togglePollVote21('${esc(p.id)}',this)">${on?'✓ 참석중 · 다시 누르면 취소':'참석'}</button>`:'<button class="btn ghost" disabled>회원만 참석</button>'}<button class="btn ghost" onclick="openPollAttendees21('${esc(p.id)}')">참석 명단 ${c.total}명</button></div>${staff?`<div class="pollGuestAdmin21">${closed?`<button class="btn ghost pollGuestClosed19" disabled>게스트 마감</button><button class="miniBtn" onclick="toggleGuestClosed19('${esc(p.id)}',false)">모집 재개</button>`:`<button class="btn ghost" onclick="openGuestAdd72('${esc(p.id)}')">+ 게스트 참가 추가</button><button class="miniBtn" onclick="toggleGuestClosed19('${esc(p.id)}',true)">게스트 모집 마감</button>`}</div>`:''}</div>`}
function section21(){const ps=active21().filter(p=>String(p.date||'')===selectedDate21);return `${calendar21()}<div class="subhead pollHead90"><b>운동 참석 투표</b>${staff21()?'<button class="btn pri" onclick="openPollCreate72()">+ 투표 만들기</button>':''}</div>${ps.length?ps.map(pollCard21).join(''):`<div class="empty pollEmpty90">${selectedDate21.slice(5).replace('-','/')} 예정된 참석 투표가 없습니다.</div>`}`}
function replacePoll21(){const box=$('stats');if(!box)return;let wrap=box.querySelector('.pollWrap90');if(!wrap){wrap=document.createElement('div');wrap.className='pollWrap90';const recent=[...box.querySelectorAll(':scope > .card')].find(c=>(c.textContent||'').includes('오늘 최근 경기'));if(recent)recent.insertAdjacentElement('beforebegin',wrap);else box.appendChild(wrap)}wrap.innerHTML=section21()}

window.togglePollVote21=async function(pid,btn){const key='v:'+pid;if(busy21.has(key))return;const p=poll21(pid),m=mine21();if(!p||!m||m.type==='guest')return;const mid=String(m.id),old={...votes21(p)},was=old[mid]==='yes';if(was)delete p.memberVotes[mid];else{const c=count21(p),l=totalLimit21(p);if(l>0&&c.total>=l)return alert(`참석 인원 ${l}명이 모두 찼습니다.`);p.memberVotes[mid]='yes'}busy21.add(key);if(btn)btn.disabled=true;replacePoll21();try{await request21('poll_toggle_vote',{pollId:pid});replacePoll21()}catch(e){p.memberVotes=old;showError(e);replacePoll21()}finally{busy21.delete(key)}};
window.votePoll72=window.togglePollVote21;

function attendeeHtml21(id){const p=poll21(id);if(!p)return'';const order=new Map((S.members||[]).map((m,i)=>[String(m.id),i])),members=yesMembers21(p).sort((a,b)=>roleRank21(a)-roleRank21(b)||(order.get(String(a.id))??99999)-(order.get(String(b.id))??99999)),gs=guests21(p).slice(),staff=staff21(),c=count21(p);const mr=members.map(m=>`<div class="pollAttendeeCard21 attendeeRow" data-kind="member" data-id="${esc(m.id)}"><div class="pollAttendeeMain21">${gender21(m)}<span class="pollAttendeeName21">${esc(m.name)}</span>${grade21(m)}${role21(m)}</div>${staff?`<button class="pollRemove21" onclick="removePollMember21('${esc(id)}','${esc(m.id)}',this)">×</button>`:''}</div>`).join('');const gr=gs.map(g=>`<div class="pollAttendeeCard21 attendeeRow" data-kind="guest" data-id="${esc(g.id)}"><div><div class="pollAttendeeMain21">${gender21(g)}<span class="pollAttendeeName21">${esc(g.name)}</span>${grade21(g)}${role21({type:'guest'})}</div><div class="pollGuestMeta21">${esc(g.year||'')}년생${g.inviter?` · 초대 ${esc(g.inviter)}`:''}</div></div>${staff?`<button class="pollRemove21" onclick="removePollGuest21('${esc(id)}','${esc(g.id)}',this)">×</button>`:''}</div>`).join('');return `<h3>참석 명단 · 총 ${c.total}명</h3>${countBoxes21(p)}<div class="pollAttendeeSection21"><div class="pollAttendeeHead21"><b>회원</b><span class="tag">${members.length}명</span></div><div id="pollMemberRows21">${mr||'<div class="empty">참석 회원이 없습니다.</div>'}</div></div><div class="pollAttendeeSection21"><div class="pollAttendeeHead21"><b>게스트</b><span class="tag">${gs.length}명</span></div><div id="pollGuestRows21">${gr||'<div class="empty">등록된 게스트가 없습니다.</div>'}</div></div><button class="btn ghost" style="width:100%;margin-top:10px" onclick="closeModal()">닫기</button>`}
function copyGradeLook21(){const root=$('modalSheet');if(!root)return;const refs={};document.querySelectorAll('#members .memberCard').forEach(card=>{const tag=card.querySelector('.tag'),txt=String(tag?.textContent||'').trim().toUpperCase(),g=(txt.match(/([A-E])$/)||[])[1];if(!tag||!g||refs[g])return;const ts=getComputedStyle(tag),cs=getComputedStyle(card);refs[g]={bg:ts.backgroundColor,color:ts.color,border:ts.borderColor,card:cs.backgroundColor}});root.querySelectorAll('.pollAttendeeCard21').forEach(row=>{const tag=row.querySelector('.tag'),g=(String(tag?.textContent||'').trim().toUpperCase().match(/([A-E])$/)||[])[1];const r=refs[g];if(!tag||!r)return;tag.style.setProperty('background',r.bg,'important');tag.style.setProperty('color',r.color,'important');tag.style.setProperty('border-color',r.border,'important');row.style.setProperty('background-color',r.card,'important');row.style.setProperty('border-radius','12px','important')})}
window.openPollAttendees21=function(id){const html=attendeeHtml21(id);if(!html)return;openModal(html);requestAnimationFrame(copyGradeLook21)};
window.openPollAttendees18=window.openPollAttendees21;window.openPollMembers72=window.openPollAttendees21;window.openPollGuests72=window.openPollAttendees21;

function immediateRemove21(btn,kind){const row=btn?.closest('.pollAttendeeCard21');if(row)row.remove();const host=$(kind==='member'?'pollMemberRows21':'pollGuestRows21');if(host&&!host.querySelector('.pollAttendeeCard21'))host.innerHTML=`<div class="empty">${kind==='member'?'참석 회원이 없습니다.':'등록된 게스트가 없습니다.'}</div>`}
window.removePollMember21=async function(pid,mid,btn){if(!staff21())return;if(!confirm('이 회원을 참석명단에서 제외하시겠습니까?'))return;const key=`m:${pid}:${mid}`;if(busy21.has(key))return;const p=poll21(pid);if(!p)return;const old={...votes21(p)};delete p.memberVotes[String(mid)];busy21.add(key);if(btn)btn.disabled=true;immediateRemove21(btn,'member');try{openModal(attendeeHtml21(pid));requestAnimationFrame(copyGradeLook21);await request21('poll_member_remove',{pollId:pid,memberId:mid});replacePoll21()}catch(e){p.memberVotes=old;showError(e);openPollAttendees21(pid)}finally{busy21.delete(key)}};
window.removePollGuest21=async function(pid,gid,btn){if(!staff21())return;if(!confirm('이 게스트를 참석명단에서 삭제하시겠습니까?'))return;const key=`g:${pid}:${gid}`;if(busy21.has(key))return;const p=poll21(pid);if(!p)return;const old=guests21(p).slice();p.guestEntries=old.filter(g=>String(g.id)!==String(gid));busy21.add(key);if(btn)btn.disabled=true;immediateRemove21(btn,'guest');try{openModal(attendeeHtml21(pid));requestAnimationFrame(copyGradeLook21);await request21('poll_guest_remove',{pollId:pid,guestId:gid});replacePoll21()}catch(e){p.guestEntries=old;showError(e);openPollAttendees21(pid)}finally{busy21.delete(key)}};
window.removePollMember19=function(pid,mid){const row=$('modalSheet')?.querySelector(`.pollAttendeeCard21[data-kind="member"][data-id="${CSS.escape(String(mid))}"]`);return removePollMember21(pid,mid,row?.querySelector('.pollRemove21'))};
window.removePollGuest72=function(pid,gid){const row=$('modalSheet')?.querySelector(`.pollAttendeeCard21[data-kind="guest"][data-id="${CSS.escape(String(gid))}"]`);return removePollGuest21(pid,gid,row?.querySelector('.pollRemove21'))};

const openCreatePrev21=window.openPollCreate72;window.openPollCreate72=function(){openCreatePrev21();setTimeout(()=>{const d=$('pollDate19');if(d){d.min=today21();d.value=selectedDate21;d.dispatchEvent(new Event('change',{bubbles:true}))}},0)};
const openEditPrev21=window.openPollEdit90;window.openPollEdit90=function(id){openEditPrev21(id);setTimeout(()=>{const d=$('pollDate19');if(d)d.min=today21()},0)};

const renderStatsPrev21=renderStats;renderStats=function(){renderStatsPrev21();replacePoll21()};
const renderSettingsPrev21=renderSettings;renderSettings=function(){renderSettingsPrev21();const b=$('settings');if(!b)return;[...b.querySelectorAll('.meta')].forEach(el=>{if(/콕매치 v(?:\d+|\d+\.\d+)/.test(el.textContent||''))el.textContent='콕매치 v2.1 · 월간달력 정상화 · 참석토글 · 참석명단 복구 · 인원가독성 개선'})};
if(me&&currentView==='stats')renderStats();
})();

/* migrated into v6.0: app-v2.2.js */
(()=>{
const POLL22_API='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-v21-api';
const DEV22='박태영';
let selectedDate22=today22(),month22=selectedDate22.slice(0,7),busy22=new Set();

function today22(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())}
function polls22(){S.attendancePolls=Array.isArray(S?.attendancePolls)?S.attendancePolls:[];return S.attendancePolls}
function poll22(id){return polls22().find(p=>String(p.id)===String(id))}
function votes22(p){p.memberVotes=p?.memberVotes&&typeof p.memberVotes==='object'?p.memberVotes:{};return p.memberVotes}
function guests22(p){p.guestEntries=Array.isArray(p?.guestEntries)?p.guestEntries:[];return p.guestEntries}
function mine22(){if(me?.memberId){const m=M(String(me.memberId));if(m)return m}const n=String(me?.displayName||'').trim();return (S.members||[]).find(m=>String(m?.name||'').trim()===n)||null}
function staff22(){const m=mine22();return !!me&&(me.globalAdmin||me.role==='manager'||me.role==='organizer'||me.tempOrganizer||(m&&typeof isTemp==='function'&&isTemp(m)))}
function permanentStaff22(){return !!me&&(me.globalAdmin||me.role==='manager'||me.role==='organizer')}
function canVote22(){const m=mine22();return !!m&&m.type!=='guest'}
function endMs22(p){const d=String(p?.date||''),t=String(p?.endTime||'');if(!/^\d{4}-\d{2}-\d{2}$/.test(d)||!/^\d{2}:(00|30)$/.test(t))return 0;return Date.parse(`${d}T${t}:00+09:00`)}
function ended22(p){const e=endMs22(p);return !!e&&e<=Date.now()}
function yesMembers22(p){const v=votes22(p);return Object.keys(v).filter(id=>v[id]==='yes').map(id=>M(id)).filter(m=>m&&m.type!=='guest')}
function count22(p){const member=yesMembers22(p).length,guest=guests22(p).length;return {member,guest,total:member+guest}}
function totalLimit22(p){return Math.max(0,Math.floor(Number(p?.totalLimit)||0))}
function guestLimit22(p){return Math.max(0,Math.floor(Number(p?.guestLimit)||0))}
function hiddenAdmin22(){return String(S?.adminBadgeVisibility||'all')==='hidden'}
function viewerDev22(){return !!me&&String(me.displayName||'').trim()===DEV22&&me.globalAdmin===true}
function roleRank22(m){const self=(me?.memberId&&String(m?.id)===String(me.memberId))||(!me?.memberId&&String(m?.name||'').trim()===String(me?.displayName||'').trim());if(self)return -100;const r=roleOf(m);if(r==='admin')return hiddenAdmin22()&&!viewerDev22()?4:0;if(r==='manager')return 1;if(r==='organizer')return 2;if(typeof isTemp==='function'&&isTemp(m))return 3;return 4}
function role22(m){return m?.type==='guest'?'<span class="roleBadge guest45">게스트</span>':roleBadge(m)}
function gender22(m){const f=m?.gender==='여',label=f?'여성':'남성';return `<span class="pollGenderPerson19 ${f?'female':'male'}" title="${label}" aria-label="${label}"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="7" r="4"></circle><path d="M4.5 21c.5-5 3.2-8 7.5-8s7 3 7.5 8z"></path></svg></span>`}
function grade22(m){return `<span class="tag">${esc(String(m?.age||'30'))}${esc(String(m?.cls||'C'))}</span>`}
function ymShift22(ym,delta){const [y,m]=String(ym).split('-').map(Number),d=new Date(Date.UTC(y,m-1+delta,1));return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}`}
function date22(y,m,d){return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`}
function earliestMonth22(){const months=polls22().map(p=>String(p?.date||'').slice(0,7)).filter(v=>/^\d{4}-\d{2}$/.test(v));return months.length?months.sort()[0]:today22().slice(0,7)}
function gradeSummary22(list){const c={A:0,B:0,C:0,D:0,E:0};for(const x of list){const g=String(x?.cls||'').trim().toUpperCase();if(g in c)c[g]++}const s=Object.entries(c).filter(([,n])=>n>0).map(([g,n])=>`${g}조 ${n}명`);return s.length?s.join(' · '):'급수 없음'}
function pollWhen22(p){const date=String(p?.date||''),time=String(p?.time||''),end=String(p?.endTime||''),loc=String(p?.location||'');return [date,time&&end?`${time}~${end}`:time,loc].filter(Boolean).map(x=>esc(x)).join(' · ')}

async function request22(action,body={}){const r=await fetch(POLL22_API,{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+T},body:JSON.stringify({action,groupId:currentGroupId,...body}),cache:'no-store'});const x=await r.json().catch(()=>({}));if(!r.ok)throw new Error(x.error||'처리에 실패했습니다.');if(x.data){S=x.data;normalizeClient()}return x}

function calendar22(){
 const [y,m]=month22.split('-').map(Number),first=new Date(Date.UTC(y,m-1,1)).getUTCDay(),last=new Date(Date.UTC(y,m,0)).getUTCDate(),has=new Set(polls22().map(p=>String(p.date||''))),cells=[],minMonth=earliestMonth22();
 for(let i=0;i<first;i++)cells.push('<span class="pollCalBlank21"></span>');
 for(let d=1;d<=last;d++){const dt=date22(y,m,d),withPoll=has.has(dt),sel=dt===selectedDate22,isToday=dt===today22(),past=dt<today22();cells.push(`<button class="pollCalDay21 ${withPoll?'hasPoll':''} ${sel?'selected':''} ${isToday?'today':''} ${past?'past22':''}" onclick="selectPollDate22('${dt}')"><span>${d}</span></button>`)}
 return `<div class="pollCalendar21 pollCalendar22"><div class="pollCalHead21"><button class="pollCalNav21" ${month22<=minMonth?'disabled':''} onclick="movePollMonth22(-1)">‹</button><b>${y}년 ${m}월</b><button class="pollCalNav21" onclick="movePollMonth22(1)">›</button></div><div class="pollCalWeek21"><span>일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span></div><div class="pollCalGrid21">${cells.join('')}</div><div class="pollCalLegend21"><span><i></i> 투표 있음</span><span>선택 ${selectedDate22.slice(5).replace('-','/')}</span></div></div>`;
}
window.selectPollDate22=function(dt){selectedDate22=String(dt);month22=selectedDate22.slice(0,7);replacePoll22()};
window.movePollMonth22=function(delta){const next=ymShift22(month22,Number(delta)||0);if(next<earliestMonth22())return;month22=next;selectedDate22=next===today22().slice(0,7)?today22():`${next}-01`;replacePoll22()};

function countBoxes22(p){const c=count22(p),tl=totalLimit22(p),gl=guestLimit22(p);return `<div class="pollCounts21"><div class="pollCountBox21 total"><b>${tl?`${c.total}/${tl}`:c.total}</b><span>전체</span><small>${tl?'정원':'참석'}</small></div><div class="pollCountBox21 member"><b>${c.member}</b><span>회원</span><small>참석</small></div><div class="pollCountBox21 guest"><b>${gl?`${c.guest}/${gl}`:c.guest}</b><span>게스트</span><small>${gl?'정원':'참석'}</small></div></div>`}
function pollCard22(p){
 const c=count22(p),m=mine22(),on=!!m&&votes22(p)[String(m.id)]==='yes',staff=staff22(),closed=!!p.guestClosed,ended=ended22(p),canDelete=ended?permanentStaff22():staff;
 const headBtns=ended?(canDelete?`<div class="pollHeadBtns19"><button class="miniBtn" onclick="deletePoll72('${esc(p.id)}')">삭제</button></div>`:''):(staff?`<div class="pollHeadBtns19"><button class="miniBtn" onclick="openPollEdit90('${esc(p.id)}')">수정</button><button class="miniBtn" onclick="deletePoll72('${esc(p.id)}')">삭제</button></div>`:'');
 const left=ended?'<button class="btn ghost pollClosed22" disabled>운동 종료 · 조회만 가능</button>':(canVote22()?`<button class="btn ${on?'pollAttendOn21':'pri'}" onclick="togglePollVote22('${esc(p.id)}',this)">${on?'✓ 참석중 · 다시 누르면 취소':'참석'}</button>`:'<button class="btn ghost" disabled>회원만 참석</button>');
 const guestAdmin=!ended&&staff?`<div class="pollGuestAdmin21">${closed?`<button class="btn ghost pollGuestClosed19" disabled>게스트 마감</button><button class="miniBtn" onclick="toggleGuestClosed19('${esc(p.id)}',false)">모집 재개</button>`:`<button class="btn ghost" onclick="openGuestAdd72('${esc(p.id)}')">+ 게스트 참가 추가</button><button class="miniBtn" onclick="toggleGuestClosed19('${esc(p.id)}',true)">게스트 모집 마감</button>`}</div>`:'';
 return `<div class="card pollCard21 ${ended?'pollEnded22':''}"><div class="pollTitleRow21"><div class="pollTitle21">${esc(p.title||'운동 참석 투표')} ${ended?'<span class="pollEndedBadge22">종료</span>':''}<div class="pollWhen22">${pollWhen22(p)}</div></div>${headBtns}</div>${countBoxes22(p)}<div class="pollActions21">${left}<button class="btn ghost" onclick="openPollAttendees22('${esc(p.id)}')">참석 명단 ${c.total}명</button></div>${guestAdmin}</div>`;
}
function section22(){const ps=polls22().filter(p=>String(p.date||'')===selectedDate22).slice().sort((a,b)=>String(a.time||'').localeCompare(String(b.time||'')));const past=selectedDate22<today22();return `${calendar22()}<div class="subhead pollHead90"><b>운동 참석 투표</b>${staff22()?'<button class="btn pri" onclick="openPollCreate72()">+ 투표 만들기</button>':''}</div>${ps.length?ps.map(pollCard22).join(''):`<div class="empty pollEmpty90">${selectedDate22.slice(5).replace('-','/')} ${past?'기록된 참석 투표가 없습니다.':'예정된 참석 투표가 없습니다.'}</div>`}`}
function replacePoll22(){const box=$('stats');if(!box)return;let wrap=box.querySelector('.pollWrap90');if(!wrap){wrap=document.createElement('div');wrap.className='pollWrap90';const recent=[...box.querySelectorAll(':scope > .card')].find(c=>(c.textContent||'').includes('오늘 최근 경기'));if(recent)recent.insertAdjacentElement('beforebegin',wrap);else box.appendChild(wrap)}wrap.innerHTML=section22()}

window.togglePollVote22=async function(pid,btn){const key='v:'+pid;if(busy22.has(key))return;const p=poll22(pid),m=mine22();if(!p||!m||m.type==='guest')return;if(ended22(p))return alert('운동이 종료되어 참석투표를 수정할 수 없습니다.');const mid=String(m.id),old={...votes22(p)},was=old[mid]==='yes';if(was)delete p.memberVotes[mid];else{const c=count22(p),l=totalLimit22(p);if(l>0&&c.total>=l)return alert(`참석 인원 ${l}명이 모두 찼습니다.`);p.memberVotes[mid]='yes'}busy22.add(key);if(btn)btn.disabled=true;replacePoll22();try{await request22('poll_toggle_vote',{pollId:pid});replacePoll22()}catch(e){p.memberVotes=old;showError(e);replacePoll22()}finally{busy22.delete(key)}};

function attendeeHtml22(id){
 const p=poll22(id);if(!p)return'';const order=new Map((S.members||[]).map((m,i)=>[String(m.id),i])),members=yesMembers22(p).sort((a,b)=>roleRank22(a)-roleRank22(b)||(order.get(String(a.id))??99999)-(order.get(String(b.id))??99999)),gs=guests22(p).slice(),editable=staff22()&&!ended22(p),c=count22(p);
 const mr=members.map(m=>`<div class="pollAttendeeCard21 attendeeRow" data-kind="member" data-id="${esc(m.id)}"><div class="pollAttendeeMain21">${gender22(m)}<span class="pollAttendeeName21">${esc(m.name)}</span>${grade22(m)}${role22(m)}</div>${editable?`<button class="pollRemove21" onclick="removePollMember21('${esc(id)}','${esc(m.id)}',this)">×</button>`:''}</div>`).join('');
 const gr=gs.map(g=>`<div class="pollAttendeeCard21 attendeeRow" data-kind="guest" data-id="${esc(g.id)}"><div><div class="pollAttendeeMain21">${gender22(g)}<span class="pollAttendeeName21">${esc(g.name)}</span>${grade22(g)}${role22({type:'guest'})}</div><div class="pollGuestMeta21">${esc(g.year||'')}년생${g.inviter?` · 초대 ${esc(g.inviter)}`:''}</div></div>${editable?`<button class="pollRemove21" onclick="removePollGuest21('${esc(id)}','${esc(g.id)}',this)">×</button>`:''}</div>`).join('');
 return `<h3>참석 명단 · 총 ${c.total}명</h3>${ended22(p)?'<div class="note pollArchiveNote22">종료된 운동입니다. 참석 기록은 조회만 가능합니다.</div>':''}${countBoxes22(p)}<div class="pollAttendeeSection21"><div class="pollAttendeeHead21 pollAttendeeHead22"><b>회원</b><span class="tag">${members.length}명</span><small>${gradeSummary22(members)}</small></div><div id="pollMemberRows21">${mr||'<div class="empty">참석 회원이 없습니다.</div>'}</div></div><div class="pollAttendeeSection21"><div class="pollAttendeeHead21 pollAttendeeHead22"><b>게스트</b><span class="tag">${gs.length}명</span><small>${gradeSummary22(gs)}</small></div><div id="pollGuestRows21">${gr||'<div class="empty">등록된 게스트가 없습니다.</div>'}</div></div><button class="btn ghost" style="width:100%;margin-top:10px" onclick="closeModal()">닫기</button>`;
}
function copyGradeLook22(){const root=$('modalSheet');if(!root)return;const refs={};document.querySelectorAll('#members .memberCard').forEach(card=>{const tag=card.querySelector('.tag'),txt=String(tag?.textContent||'').trim().toUpperCase(),g=(txt.match(/([A-E])$/)||[])[1];if(!tag||!g||refs[g])return;const ts=getComputedStyle(tag),cs=getComputedStyle(card);refs[g]={bg:ts.backgroundColor,color:ts.color,border:ts.borderColor,card:cs.backgroundColor}});root.querySelectorAll('.pollAttendeeCard21').forEach(row=>{const tag=row.querySelector('.tag'),g=(String(tag?.textContent||'').trim().toUpperCase().match(/([A-E])$/)||[])[1],r=refs[g];if(!tag||!r)return;tag.style.setProperty('background',r.bg,'important');tag.style.setProperty('color',r.color,'important');tag.style.setProperty('border-color',r.border,'important');row.style.setProperty('background-color',r.card,'important');row.style.setProperty('border-radius','12px','important')})}
window.openPollAttendees22=function(id){const html=attendeeHtml22(id);if(!html)return;openModal(html);requestAnimationFrame(copyGradeLook22)};
window.openPollAttendees21=window.openPollAttendees22;window.openPollAttendees18=window.openPollAttendees22;window.openPollMembers72=window.openPollAttendees22;window.openPollGuests72=window.openPollAttendees22;

window.togglePollVote21=function(pid,btn){const p=poll22(pid);if(p&&ended22(p))return alert('운동이 종료되어 참석투표를 수정할 수 없습니다.');return window.togglePollVote22(pid,btn)};
window.votePoll72=window.togglePollVote21;

for(const name of ['removePollMember21','removePollMember19','removePollGuest21','removePollGuest72']){
 const prev=window[name];if(typeof prev!=='function')continue;
 window[name]=function(pid,...args){const p=poll22(pid);if(p&&ended22(p))return alert('운동이 종료되어 참석명단을 수정할 수 없습니다.');return prev.call(this,pid,...args)}
}
const prevGuestAdd22=window.openGuestAdd72;if(typeof prevGuestAdd22==='function')window.openGuestAdd72=function(id){const p=poll22(id);if(p&&ended22(p))return alert('운동이 종료되어 게스트를 추가할 수 없습니다.');return prevGuestAdd22(id)};
const prevGuestClose22=window.toggleGuestClosed19;if(typeof prevGuestClose22==='function')window.toggleGuestClosed19=function(id,closed){const p=poll22(id);if(p&&ended22(p))return alert('운동이 종료되어 게스트 모집상태를 변경할 수 없습니다.');return prevGuestClose22(id,closed)};
const prevEdit22=window.openPollEdit90;if(typeof prevEdit22==='function')window.openPollEdit90=function(id){const p=poll22(id);if(p&&ended22(p))return alert('운동이 종료되어 투표를 수정할 수 없습니다.');return prevEdit22(id)};
const prevDelete22=window.deletePoll72;if(typeof prevDelete22==='function')window.deletePoll72=function(id){const p=poll22(id);if(p&&ended22(p)&&!permanentStaff22())return alert('종료된 투표는 모임장 또는 운영진만 삭제할 수 있습니다.');return prevDelete22(id)};
const prevCreate22=window.openPollCreate72;if(typeof prevCreate22==='function')window.openPollCreate72=function(){prevCreate22();setTimeout(()=>{const d=$('pollDate19')||$('pollDate72');if(d){const target=selectedDate22>=today22()?selectedDate22:today22();d.min=today22();d.value=target;d.dispatchEvent(new Event('change',{bubbles:true}))}},0)};

const renderStatsPrev22=renderStats;renderStats=function(){renderStatsPrev22();replacePoll22()};
const renderSettingsPrev22=renderSettings;renderSettings=function(){renderSettingsPrev22();const b=$('settings');if(!b)return;[...b.querySelectorAll('.meta')].forEach(el=>{if(/콕매치 v(?:\d+|\d+\.\d+)/.test(el.textContent||''))el.textContent='콕매치 v2.2 · 투표기록 보존 · 종료 후 조회전용 · 급수별 집계 · 달력 가독성 개선'})};

setInterval(()=>{if(me&&currentView==='stats'&&polls22().some(p=>endMs22(p)&&Math.abs(endMs22(p)-Date.now())<65000))renderStats()},30000);
if(me&&currentView==='stats')renderStats();
})();

/* migrated into v6.0: app-v2.3.js */
(()=>{
const HOLIDAY23={
 '2026-02-16':'설날 연휴','2026-02-17':'설날','2026-02-18':'설날 연휴','2026-03-02':'삼일절 대체공휴일','2026-05-24':'부처님오신날','2026-05-25':'부처님오신날 대체공휴일','2026-06-03':'전국동시지방선거일','2026-08-17':'광복절 대체공휴일','2026-09-24':'추석 연휴','2026-09-25':'추석','2026-09-26':'추석 연휴','2026-10-05':'개천절 대체공휴일',
 '2027-02-06':'설날 연휴','2027-02-07':'설날','2027-02-08':'설날 연휴','2027-02-09':'설날 대체공휴일','2027-05-03':'노동절 대체공휴일','2027-05-13':'부처님오신날','2027-07-19':'제헌절 대체공휴일','2027-08-16':'광복절 대체공휴일','2027-09-14':'추석 연휴','2027-09-15':'추석','2027-09-16':'추석 연휴','2027-10-04':'개천절 대체공휴일','2027-10-11':'한글날 대체공휴일','2027-12-27':'기독탄신일 대체공휴일'
};
const FIXED23={'01-01':'신정','03-01':'삼일절','05-01':'노동절','05-05':'어린이날','06-06':'현충일','07-17':'제헌절','08-15':'광복절','10-03':'개천절','10-09':'한글날','12-25':'기독탄신일'};

function today23(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())}
function holidayName23(date){return HOLIDAY23[date]||FIXED23[String(date||'').slice(5)]||''}
function calendarDate23(btn){const s=String(btn?.getAttribute?.('onclick')||'');return (s.match(/selectPollDate22\('([0-9]{4}-[0-9]{2}-[0-9]{2})'\)/)||[])[1]||''}
function selectedCalendarDate23(){const btn=document.querySelector('#stats .pollCalDay21.selected');return calendarDate23(btn)||today23()}
function weekday23(date){const a=String(date||'').split('-').map(Number);if(a.length!==3||!a[0])return -1;return new Date(Date.UTC(a[0],a[1]-1,a[2])).getUTCDay()}

function decorateCalendar23(){
 const box=$('stats');if(!box)return;
 for(const btn of box.querySelectorAll('.pollCalDay21')){
  const date=calendarDate23(btn);if(!date)continue;const wd=weekday23(date),holiday=holidayName23(date);
  btn.classList.toggle('sun23',wd===0);btn.classList.toggle('sat23',wd===6);btn.classList.toggle('holiday23',!!holiday);
  if(holiday)btn.title=holiday;else if(btn.title)btn.removeAttribute('title');
 }
}

function genderPerson23(m){
 const female=m?.gender==='여',label=female?'여성':'남성';
 return `<span class="genderPerson54 compact54 composerGender23 ${female?'female':'male'}" title="${label}" aria-label="${label}"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="7" r="4"></circle><path d="M4.5 21c.5-5 3.2-8 7.5-8s7 3 7.5 8z"></path></svg></span>`;
}
function decorateComposerGender23(){
 const box=$('queue');if(!box||!Array.isArray(draft))return;
 const slots=[...box.querySelectorAll('.composer54 .slot54,.composer .slots > .slot')].slice(0,4);
 slots.forEach((slot,i)=>{
  const id=draft[i],m=id?M(id):null,name=slot.querySelector('.slotName');
  if(!m||!name)return;
  name.querySelectorAll('.composerGender23').forEach((x,j)=>{if(j)x.remove()});
  if(!name.querySelector('.composerGender23'))name.insertAdjacentHTML('afterbegin',genderPerson23(m));
 });
}

function fixPollForm23(){
 const form=$('modalSheet');if(!form)return;const d=form.querySelector('input[type="date"]');
 if(d){d.min=today23();d.style.maxWidth='100%';d.style.minWidth='0';d.style.width='100%';d.style.boxSizing='border-box'}
}
function rejectPast23(date,msg='과거 날짜의 투표는 생성할 수 없습니다.'){
 if(date&&String(date)<today23()){alert(msg);return true}return false;
}

const renderQueue22=renderQueue;
renderQueue=function(){const r=renderQueue22();decorateComposerGender23();return r};
for(const name of ['draftClick','draftRemove','clearDraft','recommendDraft']){
 const prev=window[name]||globalThis[name];if(typeof prev!=='function')continue;
 const wrapped=function(...args){const r=prev.apply(this,args);decorateComposerGender23();return r};
 try{window[name]=wrapped}catch{}
 try{globalThis[name]=wrapped}catch{}
}

const openCreate22=window.openPollCreate72;
if(typeof openCreate22==='function')window.openPollCreate72=function(...args){
 const selected=selectedCalendarDate23();if(rejectPast23(selected))return;
 const r=openCreate22.apply(this,args);fixPollForm23();return r;
};
const create22=window.createPoll72;
if(typeof create22==='function')window.createPoll72=function(...args){const d=$('pollDate19')?.value||$('pollDate72')?.value||'';if(rejectPast23(d))return;return create22.apply(this,args)};
const edit22=window.openPollEdit90;
if(typeof edit22==='function')window.openPollEdit90=function(...args){const r=edit22.apply(this,args);fixPollForm23();return r};
const saveEdit22=window.savePollEdit90;
if(typeof saveEdit22==='function')window.savePollEdit90=function(...args){const d=$('pollDate19')?.value||$('pollDate72')?.value||'';if(rejectPast23(d,'과거 날짜로 투표를 변경할 수 없습니다.'))return;return saveEdit22.apply(this,args)};

const selectDate22=window.selectPollDate22;
if(typeof selectDate22==='function')window.selectPollDate22=function(...args){const r=selectDate22.apply(this,args);decorateCalendar23();return r};
const moveMonth22=window.movePollMonth22;
if(typeof moveMonth22==='function')window.movePollMonth22=function(...args){const r=moveMonth22.apply(this,args);decorateCalendar23();return r};

const renderStats22=renderStats;
renderStats=function(){const r=renderStats22();decorateCalendar23();return r};
const renderSettings22=renderSettings;
renderSettings=function(){renderSettings22();const b=$('settings');if(!b)return;[...b.querySelectorAll('.meta')].forEach(el=>{if(/콕매치 v(?:\d+|\d+\.\d+)/.test(el.textContent||''))el.textContent='콕매치 v2.3 · 편성 성별 즉시표시 · 과거투표 차단 · 주말/공휴일 달력 · 투표폼 폭 보정'})};

if(me){if(currentView==='queue')decorateComposerGender23();if(currentView==='stats')decorateCalendar23()}
})();

/* migrated into v6.0: app-v2.5.js */
(()=>{
let fastNavLast25={id:'',at:0};
let prewarmKey25='';

function navItems25(){
 const items=[['members','👥','회원명부'],['queue','▦','게임대기'],['playing','🏸','게임중'],['stats','▥','오늘통계'],['settings','⚙️','설정']];
 if(typeof canManageGroups==='function'&&canManageGroups())items.push(['groups','🏢','모임관리']);
 return items;
}
function normalizeView25(id){
 let v=String(id||'');
 if(v==='groups'&&typeof canManageGroups==='function'&&!canManageGroups())v='members';
 return ['members','queue','playing','stats','settings','groups'].includes(v)?v:'members';
}
function renderView25(v){
 try{
  if(v==='members'&&typeof renderMembers==='function')renderMembers();
  else if(v==='queue'&&typeof renderQueue==='function')renderQueue();
  else if(v==='playing'&&typeof renderPlaying==='function')renderPlaying();
  else if(v==='stats'&&typeof renderStats==='function')renderStats();
  else if(v==='settings'&&typeof renderSettings==='function')renderSettings();
  else if(v==='groups'&&typeof renderGroups==='function')renderGroups();
 }catch(e){console.error('view render v2.5',v,e)}
}
function ensureView25(v){
 const box=typeof $==='function'?$(v):document.getElementById(v);
 if(!box||box.children.length||v==='groups')return;
 renderView25(v);
}
function refreshAfterSwitch25(v){
 if(v==='groups'||v==='members')return;
 requestAnimationFrame(()=>{
  if(currentView!==v)return;
  renderView25(v);
  for(const el of document.querySelectorAll('.view'))el.classList.toggle('on',el.id===currentView);
  for(const b of document.querySelectorAll('#nav button[data-v]'))b.classList.toggle('on',b.dataset.v===currentView);
 });
}
function fastSwitch25(id){
 const v=normalizeView25(id),now=performance.now();
 if(v===currentView&&now-fastNavLast25.at<300){fastNavLast25={id:v,at:now};return}
 fastNavLast25={id:v,at:now};
 currentView=v;
 ensureView25(v);
 for(const el of document.querySelectorAll('.view'))el.classList.toggle('on',el.id===v);
 for(const b of document.querySelectorAll('#nav button[data-v]'))b.classList.toggle('on',b.dataset.v===v);
 try{window.scrollTo({top:0,left:0,behavior:'auto'})}catch{window.scrollTo(0,0)}
 if(v==='groups'&&typeof loadGroups==='function')requestAnimationFrame(()=>setTimeout(()=>{if(currentView==='groups')loadGroups().catch(showError)},0));
 else refreshAfterSwitch25(v);
}

goView=function(id){fastSwitch25(id)};

function bindFastNav25(){
 const nav=$('nav');if(!nav||nav.dataset.fastNav25==='1')return;
 nav.dataset.fastNav25='1';
 nav.addEventListener('pointerdown',e=>{
  const btn=e.target.closest?.('button[data-v]');if(!btn||!nav.contains(btn))return;
  fastSwitch25(btn.dataset.v);
  btn.classList.add('navPress24');setTimeout(()=>btn.classList.remove('navPress24'),120);
 },{passive:true,capture:true});
 nav.addEventListener('click',e=>{
  const btn=e.target.closest?.('button[data-v]');if(!btn||!nav.contains(btn))return;
  const same=String(btn.dataset.v||'')===fastNavLast25.id&&performance.now()-fastNavLast25.at<700;
  if(same){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation()}
 },true);
}

renderNav=function(){
 const nav=$('nav');if(!nav)return;const items=navItems25(),sig=items.map(x=>x[0]).join('|');
 if(nav.dataset.navSig25!==sig){
  nav.className='n'+items.length;
  nav.innerHTML=items.map(([id,ic,tx])=>`<button data-v="${id}" class="${currentView===id?'on':''}" onclick="goView('${id}')"><i>${ic}</i>${tx}</button>`).join('');
  nav.dataset.navSig25=sig;
 }
 nav.className='n'+items.length;
 for(const b of nav.querySelectorAll('button[data-v]'))b.classList.toggle('on',b.dataset.v===currentView);
 bindFastNav25();
};

function prewarm25(){
 if(!me)return;
 const key=String(currentGroupId||group?.groupId||'default');
 if(prewarmKey25===key)return;
 prewarmKey25=key;
 const jobs=['queue','playing','stats','settings'].filter(v=>{
  const box=$(v);return box&&!box.children.length;
 });
 let i=0;
 const run=()=>{
  if(i>=jobs.length)return;
  const v=jobs[i++];
  if(currentView!==v)renderView25(v);
  if('requestIdleCallback'in window)requestIdleCallback(run,{timeout:180});else setTimeout(run,20);
 };
 if('requestIdleCallback'in window)requestIdleCallback(run,{timeout:120});else setTimeout(run,0);
}

const loadState24=loadState;
loadState=async function(...args){
 const r=await loadState24(...args);
 prewarmKey25='';
 prewarm25();
 return r;
};

const renderSettings24=renderSettings;
renderSettings=function(){
 renderSettings24();const b=$('settings');if(!b)return;
 [...b.querySelectorAll('.meta')].forEach(el=>{if(/콕매치 v(?:\d+|\d+\.\d+)/.test(el.textContent||''))el.textContent='콕매치 v2.5 · 게임대기/게임중 즉시렌더 · 메뉴 프리렌더 안정화'});
};

renderNav();
setTimeout(prewarm25,0);
})();

/* migrated into v6.0: app-v2.6.js */
(()=>{
const QUEUE26_API='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-v26-queue-api';
let queueFillBusy26=false;

async function queueRequest26(action,body={}){
  const r=await fetch(QUEUE26_API,{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+T},body:JSON.stringify({action,groupId:currentGroupId,...body}),cache:'no-store'});
  const x=await r.json().catch(()=>({}));
  if(!r.ok){
    if(r.status===401){reloginLatest();throw new Error('로그인이 만료되었습니다.')}
    const e=new Error(x.error||'편성대기 처리에 실패했습니다.');e.payload=x;throw e;
  }
  return x;
}

/* Route vacancy fills and pending-to-pending moves through the current multi-group API. */
const act25=act;
act=async function(action,body={},opts={}){
  if(action!=='add_to_pending'&&action!=='move_pending_member')return act25(action,body,opts);
  try{
    const x=await queueRequest26(action,body);
    if(x.data){S=x.data;normalizeClient();renderAll()}
    return x;
  }catch(e){
    if(e?.payload?.warning==='repeat_pair'&&opts?.repeat){showRepeat(e.payload,opts.repeat);return null}
    throw e;
  }
};

function pendingNo26(pid){const i=(S.pendingGames||[]).findIndex(g=>String(g.id)===String(pid));return i>=0?i+1:0}
function firstVacancy26(){return (S.pendingGames||[]).find(g=>Array.isArray(g.players)&&g.players.length<4)||null}
function clearEmptyDraftTint26(){
  const box=$('queue');if(!box||!Array.isArray(draft))return;
  const slots=[...box.querySelectorAll('.composer54 .slot54,.composer .slots > .slot,.composer .slot')].slice(0,4);
  slots.forEach((slot,i)=>{
    if(draft[i])return;
    slot.style.removeProperty('background-color');
    slot.style.removeProperty('background');
    slot.style.removeProperty('transition');
    slot.classList.remove('filled');
  });
}

async function autoFillQueue26(id,targetId,force=false){
  if(queueFillBusy26)return;
  const target=(S.pendingGames||[]).find(g=>String(g.id)===String(targetId));
  if(!target||!Array.isArray(target.players)||target.players.length>=4){renderQueue();return}
  const m=M(id);if(!m)return;
  queueFillBusy26=true;
  const no=pendingNo26(targetId);
  try{
    const x=await act('add_to_pending',{pendingId:targetId,memberId:id,forceRepeat:force},{repeat:{keep:()=>autoFillQueue26(id,targetId,true),manual:()=>{}}});
    if(x){clearEmptyDraftTint26();alert(`편성대기 ${no}조의 빈자리에 ${m.name}님을 추가했습니다.`)}
  }catch(e){showError(e)}finally{queueFillBusy26=false}
}

/* Personal queue selection fills the earliest pending vacancy before using the new-game composer. */
const draftClick25=draftClick;
draftClick=function(id){
  if(!canGame())return;
  const selected=Array.isArray(draft)&&draft.includes(id);
  if(selected){const r=draftClick25(id);clearEmptyDraftTint26();return r}
  const target=firstVacancy26();
  if(target){autoFillQueue26(id,target.id,false);return}
  const r=draftClick25(id);clearEmptyDraftTint26();return r;
};

const draftRemove25=draftRemove;
draftRemove=function(i){const r=draftRemove25(i);clearEmptyDraftTint26();return r};
const clearDraft25=clearDraft;
clearDraft=function(){const r=clearDraft25();clearEmptyDraftTint26();return r};
const recommendDraft25=recommendDraft;
recommendDraft=function(){const r=recommendDraft25();clearEmptyDraftTint26();return r};

function sourceMoveAlert26(sourceNo,name){
  alert(`편성대기 ${sourceNo}조에서 ${name}님을 이동했습니다.\n인원이 빠진 편성대기 ${sourceNo}조에 다른 인원을 추가해 주세요.`);
}

/* Fill-vacancy modal: moving from a completed 4-person group now uses the fixed API and warns that the source needs a replacement. */
fillFromPending=async function(source,id,force=false){
  const target=moveCtx?.targetPendingId;if(!target)return;
  const src=(S.pendingGames||[]).find(g=>String(g.id)===String(source));
  const sourceWasFull=!!src&&Array.isArray(src.players)&&src.players.length===4;
  const sourceNo=pendingNo26(source),name=M(id)?.name||'회원';
  try{
    const x=await act('move_pending_member',{sourcePendingId:source,targetPendingId:target,memberId:id,forceRepeat:force},{repeat:{keep:()=>{moveCtx={mode:'fill',targetPendingId:target};fillFromPending(source,id,true)},manual:()=>closeModal()}});
    if(!x)return;
    closeModal();
    if(sourceWasFull)sourceMoveAlert26(sourceNo,name);
  }catch(e){showError(e)}
};

/* Member move modal uses the same fixed route. */
moveToPartial=async function(target,force=false){
  const c=moveCtx;if(!c)return;
  const src=(S.pendingGames||[]).find(g=>String(g.id)===String(c.sourcePendingId));
  const sourceWasFull=!!src&&Array.isArray(src.players)&&src.players.length===4;
  const sourceNo=pendingNo26(c.sourcePendingId),name=M(c.memberId)?.name||'회원';
  try{
    const x=await act('move_pending_member',{sourcePendingId:c.sourcePendingId,targetPendingId:target,memberId:c.memberId,forceRepeat:force},{repeat:{keep:()=>{moveCtx=c;moveToPartial(target,true)},manual:()=>closeModal()}});
    if(!x)return;
    closeModal();
    if(sourceWasFull)sourceMoveAlert26(sourceNo,name);
  }catch(e){showError(e)}
};

const renderQueue25=renderQueue;
renderQueue=function(){const r=renderQueue25();clearEmptyDraftTint26();return r};
const renderSettings25=renderSettings;
renderSettings=function(){
  renderSettings25();const b=$('settings');if(!b)return;
  [...b.querySelectorAll('.meta')].forEach(el=>{if(/콕매치 v(?:\d+|\d+\.\d+)/.test(el.textContent||''))el.textContent='콕매치 v2.6 · 편성대기 빈자리 우선충원 · 조간 이동 오류수정 · 급수배경 즉시정리'});
};

if(me&&currentView==='queue')clearEmptyDraftTint26();
})();

/* migrated into v6.0: app-v2.8.js */
(()=>{
const QUEUE28_API='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-v26-queue-api';
const busy28=new Set();
let gesture28=null,suppress28={key:'',at:0};
let statsDecorating28=false,statsRaf28=0;

function toast28(msg,kind='ok'){
 let t=document.getElementById('kokToast27');
 if(!t){t=document.createElement('div');t.id='kokToast27';document.body.appendChild(t)}
 t.className='kokToast27 '+kind;t.textContent=msg;
 requestAnimationFrame(()=>t.classList.add('show'));
 clearTimeout(toast28.tm);toast28.tm=setTimeout(()=>t.classList.remove('show'),2100);
}
async function q28(action,body={}){
 const r=await fetch(QUEUE28_API,{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+T},body:JSON.stringify({action,groupId:currentGroupId,...body}),cache:'no-store'});
 const x=await r.json().catch(()=>({}));
 if(!r.ok){if(r.status===401){reloginLatest();throw new Error('로그인이 만료되었습니다.')}const e=new Error(x.error||'편성대기 처리에 실패했습니다.');e.payload=x;throw e}
 return x;
}
const loadState27=loadState;
loadState=async function(...args){if(busy28.size)return;return loadState27(...args)};
function qsig28(){return JSON.stringify([(S.queue||[]).map(String),(S.pendingGames||[]).map(g=>[String(g.id),(g.players||[]).map(String)])])}
function applyServer28(x,beforeSig){
 if(!x?.data)return;
 S=x.data;normalizeClient();
 const after=qsig28();
 try{renderHeader()}catch{}
 if(currentView==='queue'&&after!==beforeSig)renderQueue();
}
function snap28(ids=[]){
 return {queue:[...(S.queue||[])],pendingGames:(S.pendingGames||[]).map(g=>({...g,players:[...(g.players||[])]})),members:ids.map(id=>{const m=M(id);return m?{id,state:m.state,joinedAt:m.joinedAt}:null}).filter(Boolean)};
}
function restore28(snap){
 S.queue=[...snap.queue];S.pendingGames=snap.pendingGames.map(g=>({...g,players:[...g.players]}));
 for(const x of snap.members){const m=M(x.id);if(m){m.state=x.state;m.joinedAt=x.joinedAt}}
 try{renderHeader()}catch{};if(currentView==='queue')renderQueue();
}
function pendingNo28(pid){const i=(S.pendingGames||[]).findIndex(g=>String(g.id)===String(pid));return i>=0?i+1:0}
function firstVacancy28(){return (S.pendingGames||[]).find(g=>Array.isArray(g.players)&&g.players.length<4)||null}
function repeatRisk28(ids){if(ids.length!==4)return false;for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++)if(pairCount(ids[i],ids[j])>=3)return true;return false}
function renderQueueOnly28(){if(currentView==='queue')renderQueue();try{renderHeader()}catch{}}

async function optimisticAdd28(id,targetId,force=false){
 const key='a:'+id+':'+targetId;if(busy28.has(key))return;
 const target=(S.pendingGames||[]).find(g=>String(g.id)===String(targetId)),m=M(id);
 if(!target||!m||target.players.length>=4)return;
 if(!force&&repeatRisk28([...target.players,id])){
   try{await act('add_to_pending',{pendingId:targetId,memberId:id,forceRepeat:false},{repeat:{keep:()=>optimisticAdd28(id,targetId,true),manual:()=>{}}})}catch(e){showError(e)}
   return;
 }
 busy28.add(key);const no=pendingNo28(targetId),snap=snap28([id]);
 target.players.push(id);S.queue=(S.queue||[]).filter(x=>String(x)!==String(id));m.state='matched';
 renderQueueOnly28();toast28(`편성대기 ${no}조에 ${m.name}님을 추가했습니다.`);
 const optimisticSig=qsig28();
 try{const x=await q28('add_to_pending',{pendingId:targetId,memberId:id,forceRepeat:force});applyServer28(x,optimisticSig)}
 catch(e){restore28(snap);toast28('추가에 실패해 원래 상태로 되돌렸습니다.','err');showError(e)}finally{busy28.delete(key)}
}
async function optimisticMove28(sourceId,targetId,id,force=false){
 const key='m:'+sourceId+':'+targetId+':'+id;if(busy28.has(key))return;
 const source=(S.pendingGames||[]).find(g=>String(g.id)===String(sourceId)),target=(S.pendingGames||[]).find(g=>String(g.id)===String(targetId)),m=M(id);
 if(!source||!target||!m||target.players.length>=4)return;
 if(!force&&repeatRisk28([...target.players,id])){
   try{await act('move_pending_member',{sourcePendingId:sourceId,targetPendingId:targetId,memberId:id,forceRepeat:false},{repeat:{keep:()=>optimisticMove28(sourceId,targetId,id,true),manual:()=>closeModal()}})}catch(e){showError(e)}
   return;
 }
 const sourceNo=pendingNo28(sourceId),targetNo=pendingNo28(targetId),sourceWasFull=source.players.length===4,snap=snap28([id]);
 busy28.add(key);
 source.players=source.players.filter(x=>String(x)!==String(id));target.players.push(id);m.state='matched';
 if(!source.players.length)S.pendingGames=S.pendingGames.filter(g=>String(g.id)!==String(sourceId));
 closeModal();renderQueueOnly28();
 toast28(sourceWasFull?`편성대기 ${targetNo}조로 이동 완료 · ${sourceNo}조에 인원을 추가해 주세요.`:`편성대기 ${targetNo}조로 ${m.name}님을 이동했습니다.`);
 const optimisticSig=qsig28();
 try{const x=await q28('move_pending_member',{sourcePendingId:sourceId,targetPendingId:targetId,memberId:id,forceRepeat:force});applyServer28(x,optimisticSig)}
 catch(e){restore28(snap);toast28('이동에 실패해 원래 상태로 되돌렸습니다.','err');showError(e)}finally{busy28.delete(key)}
}

const draftClick27=draftClick;
draftClick=function(id){
 if(!canGame())return;
 if(Array.isArray(draft)&&draft.includes(id))return draftClick27(id);
 const target=firstVacancy28();if(target){optimisticAdd28(id,target.id,false);return}
 return draftClick27(id);
};
fillFromPending=async function(source,id,force=false){const target=moveCtx?.targetPendingId;if(!target)return;return optimisticMove28(source,target,id,force)};
moveToPartial=async function(target,force=false){const c=moveCtx;if(!c)return;return optimisticMove28(c.sourcePendingId,target,c.memberId,force)};

function actionFromTarget28(t){
 const card=t?.closest?.('.queueCard54,.queueCard53,.queueCard');
 if(card){const s=String(card.getAttribute('onclick')||''),m=s.match(/draftClick\(['\"]([^'\"]+)['\"]\)/);if(m)return{key:'q:'+m[1],run:()=>draftClick(m[1])}}
 const empty=t?.closest?.('.pendingSlot.emptySlot,.emptySlot');
 if(empty){const s=String(empty.getAttribute('onclick')||''),m=s.match(/openFillPending\(['\"]([^'\"]+)['\"]\)/);if(m)return{key:'e:'+m[1],run:()=>openFillPending(m[1])}}
 const choice=t?.closest?.('.choiceBtn');
 if(choice){const s=String(choice.getAttribute('onclick')||'');let m=s.match(/fillFromPending\(['\"]([^'\"]+)['\"],['\"]([^'\"]+)['\"]\)/);if(m)return{key:'f:'+m[1]+':'+m[2],run:()=>fillFromPending(m[1],m[2])};m=s.match(/moveToPartial\(['\"]([^'\"]+)['\"]\)/);if(m)return{key:'p:'+m[1],run:()=>moveToPartial(m[1])}}
 return null;
}
const TAP_MOVE28=10,TAP_MAX_MS28=850;
document.addEventListener('pointerdown',e=>{
 const a=actionFromTarget28(e.target);if(!a)return;
 gesture28={pointerId:e.pointerId,key:a.key,run:a.run,x:e.clientX,y:e.clientY,at:performance.now(),moved:false};
},{capture:true,passive:true});
document.addEventListener('pointermove',e=>{
 const g=gesture28;if(!g||g.pointerId!==e.pointerId)return;
 if(Math.hypot(e.clientX-g.x,e.clientY-g.y)>TAP_MOVE28)g.moved=true;
},{capture:true,passive:true});
document.addEventListener('pointercancel',e=>{if(gesture28?.pointerId===e.pointerId)gesture28=null},{capture:true,passive:true});
document.addEventListener('pointerup',e=>{
 const g=gesture28;if(!g||g.pointerId!==e.pointerId)return;gesture28=null;
 const moved=g.moved||Math.hypot(e.clientX-g.x,e.clientY-g.y)>TAP_MOVE28;
 const held=performance.now()-g.at>TAP_MAX_MS28;
 suppress28={key:g.key,at:performance.now()};
 if(moved||held)return;
 e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();g.run();
},{capture:true,passive:false});
document.addEventListener('click',e=>{
 const a=actionFromTarget28(e.target);if(!a)return;
 if(a.key===suppress28.key&&performance.now()-suppress28.at<900){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();return}
},{capture:true});

function todayParts28(){const p=new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',month:'numeric',day:'numeric'}).formatToParts(new Date());return {m:p.find(x=>x.type==='month')?.value||'',d:p.find(x=>x.type==='day')?.value||''}}
function decorateStats28(){
 if(statsDecorating28)return;const box=$('stats');if(!box)return;statsDecorating28=true;
 try{
   const {m,d}=todayParts28(),title=box.querySelector(':scope > .title h2');if(title)title.textContent=`${m}월 ${d}일 게임 통계`;
   [...box.querySelectorAll(':scope > .card')].forEach(c=>{if((c.textContent||'').includes('오늘 최근 경기'))c.remove()});
   const wrap=box.querySelector('.pollWrap90');if(!wrap)return;
   let top=wrap.querySelector(':scope > .pollTopTitle27');if(!top){top=document.createElement('div');top.className='pollTopTitle27';top.innerHTML='<h3>운동참석투표</h3>';wrap.prepend(top)}
   const cal=wrap.querySelector(':scope > .pollCalendar21,:scope > .pollCalendar22');
   const head=[...wrap.querySelectorAll(':scope > .subhead')].find(x=>(x.textContent||'').includes('운동 참석 투표')||(x.textContent||'').includes('투표내용'));
   if(cal&&top.nextElementSibling!==cal)top.insertAdjacentElement('afterend',cal);
   if(head){const b=head.querySelector('b');if(b)b.textContent='투표내용';if(cal&&cal.nextElementSibling!==head)cal.insertAdjacentElement('afterend',head)}
 }finally{statsDecorating28=false}
}
function scheduleStats28(){cancelAnimationFrame(statsRaf28);statsRaf28=requestAnimationFrame(decorateStats28)}
const renderStats27=renderStats;
renderStats=function(){const r=renderStats27();decorateStats28();return r};
const statsBox28=$('stats');if(statsBox28)new MutationObserver(scheduleStats28).observe(statsBox28,{childList:true,subtree:true});
for(const n of ['selectPollDate22','movePollMonth22','togglePollVote22']){const f=window[n];if(typeof f==='function')window[n]=function(...a){const r=f.apply(this,a);scheduleStats28();return r}}

function renameStatsNav28(){const b=$('nav')?.querySelector('button[data-v="stats"]');if(b)b.innerHTML='<i>▥</i>운동통계'}
const renderNav27=renderNav;
renderNav=function(){const r=renderNav27();renameStatsNav28();return r};
renameStatsNav28();

const renderSettings27=renderSettings;
renderSettings=function(){renderSettings27();const b=$('settings');if(!b)return;[...b.querySelectorAll('.meta')].forEach(el=>{if(/콕매치 v(?:\d+|\d+\.\d+)/.test(el.textContent||''))el.textContent='콕매치 v2.8 · 스크롤 오편성 방지 · 탭/스크롤 구분 · 운동통계 메뉴명 변경'})};
if(me&&currentView==='stats')decorateStats28();
})();

/* migrated into v6.0: app-v2.9.js */
(()=>{
const groupCache29=new Map();
const groupFetch29=new Map();
const GROUP_CACHE_TTL29=20000;

function cacheSnapshot29(id,x){
 if(!id||!x?.data||!x?.group)return;
 groupCache29.set(String(id),{at:Date.now(),x:{data:x.data,user:x.user,group:x.group,groups:x.groups||groups}});
}
function currentSnapshot29(){
 if(!currentGroupId||!group)return;
 groupCache29.set(String(currentGroupId),{at:Date.now(),x:{data:S,user:me,group,groups}});
}
function renderCurrentView29(view){
 try{renderHeader()}catch{}
 try{renderNav()}catch{}
 const v=String(view||currentView||'members');
 try{
  if(v==='members')renderMembers();
  else if(v==='queue')renderQueue();
  else if(v==='playing')renderPlaying();
  else if(v==='stats')renderStats();
  else if(v==='settings')renderSettings();
  else if(v==='groups'&&canManageGroups())renderGroups();
 }catch(e){console.error('group switch render',e)}
 document.querySelectorAll('.view').forEach(el=>el.classList.toggle('on',el.id===v));
 document.querySelectorAll('#nav button[data-v]').forEach(b=>b.classList.toggle('on',b.dataset.v===v));
}
function clearOtherViews29(keep){
 for(const id of ['members','queue','playing','stats','settings']){
  if(id!==keep){const el=$(id);if(el)el.innerHTML=''}
 }
}
function applyGroup29(id,x,view){
 S=x.data;me=x.user||me;group=x.group;groups=x.groups||groups;currentGroupId=String(id);localStorage.setItem(GROUP_KEY,currentGroupId);normalizeClient();
 currentView=view||'members';clearOtherViews29(currentView);renderCurrentView29(currentView);
}
async function fetchGroup29(id){
 const key=String(id);if(groupFetch29.has(key))return groupFetch29.get(key);
 const p=request('state','GET',null,{groupId:key}).then(x=>{cacheSnapshot29(key,x);return x}).finally(()=>groupFetch29.delete(key));
 groupFetch29.set(key,p);return p;
}
function prefetchGroups29(){
 if(!me?.globalAdmin||!Array.isArray(groups))return;
 const ids=groups.map(g=>String(g.groupId||'')).filter(id=>id&&id!==String(currentGroupId));
 let i=0;
 const run=()=>{
  if(i>=ids.length)return;
  const id=ids[i++],c=groupCache29.get(id);
  if(!c||Date.now()-c.at>GROUP_CACHE_TTL29)fetchGroup29(id).catch(()=>{});
  if('requestIdleCallback'in window)requestIdleCallback(run,{timeout:250});else setTimeout(run,80);
 };
 if('requestIdleCallback'in window)requestIdleCallback(run,{timeout:150});else setTimeout(run,40);
}

const loadState28=loadState;
loadState=async function(...args){
 const r=await loadState28(...args);currentSnapshot29();prefetchGroups29();return r;
};

const openGroupSwitch28=openGroupSwitch;
openGroupSwitch=async function(){
 if(!me?.globalAdmin)return;
 currentSnapshot29();prefetchGroups29();return openGroupSwitch28();
};

switchGroup=async function(id,view='members'){
 if(!me?.globalAdmin)return;
 const target=String(id||'');if(!target)return;
 if(target===String(currentGroupId)){closeModal();goView(view);return}
 currentSnapshot29();closeModal();
 const cached=groupCache29.get(target);
 if(cached&&Date.now()-cached.at<GROUP_CACHE_TTL29){
  applyGroup29(target,cached.x,view);
  try{window.scrollTo(0,0)}catch{}
  fetchGroup29(target).then(x=>{
    if(String(currentGroupId)!==target)return;
    const sigBefore=JSON.stringify([S.members?.length,S.queue?.length,S.pendingGames?.length,S.games?.length,S.history?.length,group?.name]);
    const sigAfter=JSON.stringify([x.data?.members?.length,x.data?.queue?.length,x.data?.pendingGames?.length,x.data?.games?.length,x.data?.history?.length,x.group?.name]);
    if(sigBefore!==sigAfter)applyGroup29(target,x,currentView);
    else{S=x.data;me=x.user||me;group=x.group;groups=x.groups||groups;normalizeClient();renderHeader()}
  }).catch(showError);
  return;
 }
 const g=(groups||[]).find(x=>String(x.groupId)===target);
 if(g){currentGroupId=target;localStorage.setItem(GROUP_KEY,target);const btn=$('groupBtn');if(btn)btn.textContent=`${g.name} · 불러오는 중`}
 try{const x=await fetchGroup29(target);applyGroup29(target,x,view);prefetchGroups29()}catch(e){showError(e);currentSnapshot29()}
};

const renderSettings28=renderSettings;
renderSettings=function(){
 renderSettings28();const b=$('settings');if(!b)return;
 [...b.querySelectorAll('.meta')].forEach(el=>{if(/콕매치 v(?:\d+|\d+\.\d+)/.test(el.textContent||''))el.textContent='콕매치 v2.9 · 개발자 모임전환 캐시 · 사전 로딩 · 선택 즉시 전환'});
};

currentSnapshot29();prefetchGroups29();
})();

/* migrated into v6.0: app-v3.0.js */
(()=>{
const attendanceBusy30=new Set();
let memberRefreshRaf30=0;

function renderMembersFresh30(){
 cancelAnimationFrame(memberRefreshRaf30);
 memberRefreshRaf30=requestAnimationFrame(()=>{
  if(currentView!=='members')return;
  try{renderMembers();renderHeader()}catch(e){console.error('members refresh v3.0',e)}
 });
}

/* Re-entering Members must refresh the actual member buttons/status, not reuse stale DOM. */
const goView29=goView;
goView=function(id){
 const r=goView29(id);
 if(String(id)==='members')renderMembersFresh30();
 return r;
};

document.addEventListener('pointerdown',e=>{
 const btn=e.target.closest?.('#nav button[data-v="members"]');
 if(!btn)return;
 requestAnimationFrame(renderMembersFresh30);
},{capture:true,passive:true});

document.addEventListener('click',e=>{
 const btn=e.target.closest?.('#nav button[data-v="members"]');
 if(!btn)return;
 renderMembersFresh30();
},true);

function snapshotAttendance30(m){return {state:m.state,joinedAt:m.joinedAt,queue:[...(S.queue||[])],draft:Array.isArray(draft)?[...draft]:[]}}
function restoreAttendance30(id,snap){
 const m=M(id);if(m){m.state=snap.state;m.joinedAt=snap.joinedAt}
 S.queue=[...snap.queue];draft=[...snap.draft];
 if(currentView==='members')renderMembers();
 try{renderHeader()}catch{}
}
function applyAttendanceLocal30(id,mode){
 const m=M(id);if(!m)return;
 S.queue=(S.queue||[]).filter(x=>String(x)!==String(id));
 if(Array.isArray(draft))draft=draft.map(x=>String(x)===String(id)?null:x);
 if(mode==='waiting'){
  if(!S.queue.some(x=>String(x)===String(id)))S.queue.push(id);
  m.state='waiting';m.joinedAt=Date.now();
 }else if(mode==='spectator'){
  m.state='spectator';m.joinedAt=null;
 }else if(mode==='out'){
  m.state='out';m.joinedAt=null;
 }
}

/* Attendance buttons are optimistic and update only Members/Header instead of triggering renderAll(). */
setOther=async function(id,mode){
 const key=String(id);if(attendanceBusy30.has(key))return;
 const m=M(id);if(!m)return;
 const snap=snapshotAttendance30(m);attendanceBusy30.add(key);
 applyAttendanceLocal30(id,mode);
 if(currentView==='members')renderMembers();
 try{renderHeader()}catch{}
 try{
  const x=await request('action','POST',{action:'set_member_attendance',groupId:currentGroupId,memberId:id,mode});
  if(x?.data){S=x.data;normalizeClient();if(currentView==='members')renderMembers();try{renderHeader()}catch{}}
 }catch(e){restoreAttendance30(id,snap);showError(e)}
 finally{attendanceBusy30.delete(key)}
};

/* Make member attendance buttons feel responsive on mobile without interfering with scrolling. */
let tap30=null,suppressClick30={key:'',at:0};
function memberAction30(t){
 const b=t?.closest?.('#members .memberBtns button');if(!b)return null;
 const s=String(b.getAttribute('onclick')||'');const m=s.match(/setOther\(['\"]([^'\"]+)['\"],['\"](waiting|spectator|out)['\"]\)/);
 if(!m)return null;return{key:m[1]+':'+m[2],id:m[1],mode:m[2]};
}
document.addEventListener('pointerdown',e=>{
 const a=memberAction30(e.target);if(!a)return;
 tap30={pointerId:e.pointerId,key:a.key,id:a.id,mode:a.mode,x:e.clientX,y:e.clientY,moved:false};
},{capture:true,passive:true});
document.addEventListener('pointermove',e=>{
 if(!tap30||tap30.pointerId!==e.pointerId)return;
 if(Math.hypot(e.clientX-tap30.x,e.clientY-tap30.y)>8)tap30.moved=true;
},{capture:true,passive:true});
document.addEventListener('pointercancel',e=>{if(tap30?.pointerId===e.pointerId)tap30=null},{capture:true,passive:true});
document.addEventListener('pointerup',e=>{
 const a=tap30;if(!a||a.pointerId!==e.pointerId)return;tap30=null;
 if(a.moved||Math.hypot(e.clientX-a.x,e.clientY-a.y)>8)return;
 e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
 suppressClick30={key:a.key,at:performance.now()};setOther(a.id,a.mode);
},{capture:true,passive:false});
document.addEventListener('click',e=>{
 const a=memberAction30(e.target);if(!a)return;
 if(a.key===suppressClick30.key&&performance.now()-suppressClick30.at<900){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation()}
},true);

const renderSettings29=renderSettings;
renderSettings=function(){
 renderSettings29();const b=$('settings');if(!b)return;
 [...b.querySelectorAll('.meta')].forEach(el=>{if(/콕매치 v(?:\d+|\d+\.\d+)/.test(el.textContent||''))el.textContent='콕매치 v3.0 · 회원명부 재진입 즉시갱신 · 입장/관람/퇴장 즉시반응'});
};
})();

/* migrated into v6.0: app-v3.1.js */
(()=>{
const ATOMIC31_API='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-atomic-api';
const ATOMIC31_ACTIONS=new Set(['set_my_attendance','set_member_attendance','create_pending','remove_from_pending','cancel_pending','begin_game','finish_game','set_game_court','set_courts']);
const attendanceBusy31=new Set();
async function atomic31(action,body={}){
 const r=await fetch(ATOMIC31_API,{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+T},body:JSON.stringify({action,groupId:currentGroupId,...body}),cache:'no-store'});
 const x=await r.json().catch(()=>({}));
 if(!r.ok){if(r.status===401){reloginLatest();throw new Error('로그인이 만료되었습니다.')}const e=new Error(x.error||'처리에 실패했습니다.');e.payload=x;throw e}
 return x;
}
const act30=act;
act=async function(action,body={},opts={}){
 if(!ATOMIC31_ACTIONS.has(action))return act30(action,body,opts);
 try{
  const x=await atomic31(action,body);
  if(x?.data){S=x.data;normalizeClient();renderAll()}
  return x;
 }catch(e){if(e?.payload?.warning==='repeat_pair'&&opts?.repeat){showRepeat(e.payload,opts.repeat);return null}throw e}
};
function snap31(m){return{state:m.state,joinedAt:m.joinedAt,queue:[...(S.queue||[])],draft:Array.isArray(draft)?[...draft]:[]}}
function restore31(id,s){const m=M(id);if(m){m.state=s.state;m.joinedAt=s.joinedAt}S.queue=[...s.queue];draft=[...s.draft];if(currentView==='members')renderMembers();try{renderHeader()}catch{}}
function local31(id,mode){const m=M(id);if(!m)return;S.queue=(S.queue||[]).filter(x=>String(x)!==String(id));if(Array.isArray(draft))draft=draft.map(x=>String(x)===String(id)?null:x);if(mode==='waiting'){if(!S.queue.some(x=>String(x)===String(id)))S.queue.push(id);m.state='waiting';m.joinedAt=Date.now()}else if(mode==='spectator'){m.state='spectator';m.joinedAt=null}else{m.state='out';m.joinedAt=null}}
setOther=async function(id,mode){const key=String(id);if(attendanceBusy31.has(key))return;const m=M(id);if(!m)return;const s=snap31(m);attendanceBusy31.add(key);local31(id,mode);if(currentView==='members')renderMembers();try{renderHeader()}catch{}
 try{const x=await atomic31('set_member_attendance',{memberId:id,mode});if(x?.data){S=x.data;normalizeClient();if(currentView==='members')renderMembers();try{renderHeader()}catch{}}}
 catch(e){restore31(id,s);showError(e)}finally{attendanceBusy31.delete(key)}};
const renderSettings30=renderSettings;renderSettings=function(){renderSettings30();const b=$('settings');if(!b)return;[...b.querySelectorAll('.meta')].forEach(el=>{if(/콕매치 v(?:\d+|\d+\.\d+)/.test(el.textContent||''))el.textContent='콕매치 v3.1 · 6인 운영진 동시조작 원자처리 · 상태 유실 방지'})};
})();

/* migrated into v6.0: app-v3.2.js */
(()=>{
let memberResetQueued32=false;

function removeLegacyMemberPager32(){
 const box=$('members');if(!box)return;
 box.querySelectorAll('.memberPageHidden88').forEach(el=>el.classList.remove('memberPageHidden88'));
 box.querySelectorAll('.memberPager88').forEach(el=>el.remove());
}

/* v46 is the single source of truth for member paging. v88's second 50-card pager
   could hide part of the already-paged v46 result, so always neutralize it. */
const renderMembers31=renderMembers;
renderMembers=function(){
 const r=renderMembers31();
 removeLegacyMemberPager32();
 return r;
};

function resetMemberRoster32(){
 if(currentView!=='members')return;
 try{
  if(typeof window.memberPageGo46==='function')window.memberPageGo46(1);
  else renderMembers();
 }catch(e){console.error('member roster reset v3.2',e);try{renderMembers()}catch{}}
 removeLegacyMemberPager32();
}
function queueMemberReset32(){
 if(memberResetQueued32)return;memberResetQueued32=true;
 queueMicrotask(()=>{
  memberResetQueued32=false;
  if(currentView==='members')resetMemberRoster32();
 });
}

/* Fast navigation v2.5 switches views directly on pointerdown and bypasses v46's
   original goView reset. Restore the reset before the next paint. */
document.addEventListener('pointerdown',e=>{
 const btn=e.target.closest?.('#nav button[data-v="members"]');
 if(!btn||currentView==='members')return;
 queueMemberReset32();
},{capture:true,passive:true});

/* Keep programmatic navigation/group-switch paths safe too. */
const goView31=goView;
goView=function(id){
 const prev=currentView,r=goView31(id);
 if(String(id)==='members'&&prev!=='members')queueMemberReset32();
 return r;
};

const renderSettings31=renderSettings;
renderSettings=function(){
 renderSettings31();const b=$('settings');if(!b)return;
 [...b.querySelectorAll('.meta')].forEach(el=>{
  if(/콕매치 v(?:\d+|\d+\.\d+)/.test(el.textContent||''))el.textContent='콕매치 v3.2 · 회원명부 단일 페이지처리 · 재진입 1페이지 복원 · 일부목록 표시 오류수정';
 });
};

if(me&&currentView==='members')removeLegacyMemberPager32();
})();

/* migrated into v6.0: app-v3.3.js */
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
 const role=globalAdmin?'개발자':esc(c.roleLabel||'회원');
 return `<button type="button" class="choiceBtn loginChoice33" onclick="chooseLoginGroup33(${i})"><b>${esc(pendingLoginName)} · ${year}</b><span>${esc(c.groupName||'모임')}</span><small>${role}</small></button>`;
}
function renderLoginPin33(){
 const c=selectedLogin33;if(!c)return renderLoginName();
 const year=c.year?`${esc(c.year)}년생`:'출생연도 미등록';
 const role=c.globalAdmin?'개발자':esc(c.roleLabel||'회원');
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
  if(!loginChoices33.length&&x.globalAdmin)loginChoices33.push({groupId:'',groupName:'전체 모임',memberId:'',year:'',roleLabel:'개발자'});
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

/* migrated into v6.0: app-v3.4.js */
(()=>{
const BULK34_API='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-bulk-v44';
function yearNow34(){return Number(new Intl.DateTimeFormat('en',{timeZone:'Asia/Seoul',year:'numeric'}).format(new Date()))||new Date().getFullYear()}
function roleLabel34(r){return r==='manager'?'모임장':r==='organizer'?'운영진':'일반'}
function canAssign34(role){if(me?.globalAdmin)return ['member','organizer','manager'].includes(role);if(me?.role==='manager')return ['member','organizer'].includes(role);return role==='member'}
function parseRole34(raw){const t=String(raw||'일반').trim().toLowerCase();if(['모임장','모임장','manager'].includes(t))return{type:'member',role:'manager'};if(['운영진','운영진','organizer'].includes(t))return{type:'member',role:'organizer'};if(['일반','일반','회원','member',''].includes(t))return{type:'member',role:'member'};if(['게스트','guest'].includes(t))return{type:'guest',role:'member'};return null}
function parseBulk34(text){const lines=String(text||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean),rows=[],errors=[];lines.forEach((line,idx)=>{const cells=(line.includes('\t')?line.split('\t'):line.split(',')).map(x=>x.trim());if(idx===0&&['이름','name'].includes((cells[0]||'').toLowerCase()))return;const [name,yr,gender,clsRaw,kindRaw='일반']=cells,year=Number(yr),cls=String(clsRaw||'').toUpperCase(),rr=parseRole34(kindRaw);if(!name)errors.push(`${idx+1}행: 이름이 없습니다.`);if(!Number.isInteger(year)||year<1900||year>yearNow34())errors.push(`${idx+1}행: 출생연도를 확인해주세요.`);if(!['남','여'].includes(gender))errors.push(`${idx+1}행: 성별은 남 또는 여로 입력해주세요.`);if(!['A','B','C','D','E'].includes(cls))errors.push(`${idx+1}행: 급수는 A~E로 입력해주세요.`);if(!rr)errors.push(`${idx+1}행: 구분은 모임장, 운영진, 일반 또는 게스트로 입력해주세요.`);else if(rr.type!=='guest'&&!canAssign34(rr.role))errors.push(`${idx+1}행: ${roleLabel34(rr.role)} 역할을 등록할 권한이 없습니다.`);rows.push({name,year,gender,cls,type:rr?.type||'member',role:rr?.role||'member'})});return{rows,errors}}
function duplicateSig34(x){return [String(x?.name||'').trim(),String(Number(x?.year)||''),String(x?.gender||'').trim(),String(x?.cls||'').trim().toUpperCase()].join('|')}
function duplicateLabel34(x){return `${String(x?.name||'').trim()} · ${Number(x?.year)||''}년생 · ${String(x?.gender||'')} · ${String(x?.cls||'').toUpperCase()}급`}
function exactDuplicates34(rows){const existing=new Set((S?.members||[]).filter(m=>m?.type!=='guest').map(duplicateSig34)),batch=new Set(),dups=[];for(const r of rows){if(r.type==='guest')continue;const sig=duplicateSig34(r);if(existing.has(sig)||batch.has(sig))dups.push(r);else batch.add(sig)}return dups}
function duplicateAlert34(rows){const labels=[...new Map(rows.map(r=>[duplicateSig34(r),duplicateLabel34(r)])).values()];alert(`동일한 회원 정보가 확인되었습니다.\n\n${labels.slice(0,10).join('\n')}\n\n이름·출생연도·성별·급수가 모두 같은 회원은 중복 등록할 수 없습니다.`)}
function allowedText34(){if(me?.globalAdmin)return'모임장 · 운영진 · 일반 · 게스트';if(me?.role==='manager')return'운영진 · 일반 · 게스트';return'일반 · 게스트'}
window.openBulkMembers37=function(){openModal(`<h3>회원 일괄등록</h3><div class="note">엑셀에서 아래 순서로 복사해 붙여넣을 수 있습니다.<br><b>이름 / 출생연도 / 성별 / 급수 / 구분</b><br>구분은 <b>모임장 · 운영진 · 일반 · 게스트</b> 중 하나를 입력합니다.<br>현재 등록 가능: <b>${allowedText34()}</b><br><span class="bulkPinNote34">신규 모임장·운영진의 초기 PIN은 자동으로 <b>000000</b>으로 설정됩니다.</span><br><b>동명이인은 출생연도·성별·급수가 다르면 등록 가능</b>하며, 네 정보가 모두 같을 때만 중복 경고가 표시됩니다.</div><div class="bulkExample37">홍길동\t1990\t남\tC\t일반<br>김운영\t1988\t남\tB\t운영진<br>이모임\t1985\t여\tA\t모임장</div><div class="field"><label>회원 목록 붙여넣기</label><textarea id="bulkText37" rows="11" placeholder="홍길동    1990    남    C    일반\n김운영    1988    남    B    운영진\n이모임    1985    여    A    모임장"></textarea></div><div id="bulkPreview37" class="meta">탭으로 구분된 엑셀 복사 또는 쉼표(,) 구분 입력을 지원합니다.</div><div class="acts"><button class="btn ghost" onclick="previewBulk37()">내용 확인</button><button class="btn pri" onclick="submitBulk37()">일괄등록</button></div><button class="btn ghost" style="width:100%;margin-top:8px" onclick="closeModal()">취소</button>`);setTimeout(()=>$('bulkText37')?.focus(),50)};
window.previewBulk37=function(){const p=parseBulk34($('bulkText37')?.value||''),el=$('bulkPreview37');if(!el)return;if(!p.rows.length){el.innerHTML='<span class="bulkErr37">등록할 내용을 붙여넣어주세요.</span>';return}if(p.errors.length){el.innerHTML=`<span class="bulkErr37">${p.errors.slice(0,8).map(esc).join('<br>')}</span>`;return}const c={manager:0,organizer:0,member:0,guest:0};for(const r of p.rows){if(r.type==='guest')c.guest++;else c[r.role]++}const d=exactDuplicates34(p.rows);el.innerHTML=`<b>${p.rows.length}명</b> 등록 준비 · 모임장 ${c.manager}명 · 운영진 ${c.organizer}명 · 일반 ${c.member}명 · 게스트 ${c.guest}명${d.length?`<br><span class="bulkErr37">완전 일치 중복 ${d.length}건 · 일괄등록 시 경고됩니다.</span>`:''}`};
window.submitBulk37=async function(){const p=parseBulk34($('bulkText37')?.value||'');if(!p.rows.length)return alert('등록할 회원 목록을 붙여넣어주세요.');if(p.errors.length)return alert(p.errors.slice(0,12).join('\n'));const d=exactDuplicates34(p.rows);if(d.length)return duplicateAlert34(d);if(!confirm(`${group?.name||'현재 모임'}에 ${p.rows.length}명을 한 번에 등록하시겠습니까?`))return;try{const r=await fetch(BULK34_API,{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+T},body:JSON.stringify({groupId:currentGroupId,members:p.rows}),cache:'no-store'});const x=await r.json().catch(()=>({}));if(!r.ok){const details=Array.isArray(x.details)?x.details:[];if(x.duplicateWarning||details.some(v=>/동일 회원|같은 회원/.test(String(v)))){alert(['동일한 회원 정보가 확인되었습니다.',...details.slice(0,10),'','이름·출생연도·성별·급수가 모두 같은 회원은 중복 등록할 수 없습니다.'].join('\n'));return}const e=new Error(x.error||'일괄등록에 실패했습니다.');e.details=details;throw e}S=x.data;normalizeClient();closeModal();renderAll();const staff=p.rows.filter(x=>x.type!=='guest'&&['manager','organizer'].includes(x.role)).length;alert(`${Number(x.addedCount)||p.rows.length}명을 등록했습니다.${staff?`\n모임장·운영진 초기 PIN: 000000`:''}`)}catch(e){alert([e.message,...(e.details||[]).slice(0,12)].join('\n'))}};
function newRoleOptions34(){if(me?.globalAdmin)return['member','organizer','manager'];if(me?.role==='manager')return['member','organizer'];return['member']}
function syncInitialPin34(){if(editMemberId)return;const type=$('fmType'),role=$('fmRole'),pin=$('fmPin'),wrap=$('fmPinWrap');if(!role)return;if(type?.value==='guest'){role.value='member';role.disabled=true}else role.disabled=false;const staff=type?.value!=='guest'&&['manager','organizer'].includes(role.value);if(wrap)wrap.classList.toggle('hide',!staff);if(pin){if(staff){pin.value='000000';pin.readOnly=true;pin.dataset.autoPin34='1'}else if(pin.dataset.autoPin34==='1'){pin.value='';pin.readOnly=false;delete pin.dataset.autoPin34}}let note=$('staffPinNote34');if(staff){if(!note){note=document.createElement('div');note.id='staffPinNote34';note.className='meta staffPinNote34';(wrap||role.closest('.field'))?.appendChild(note)}note.innerHTML='신규 모임장·운영진 초기 PIN은 <b>000000</b>으로 자동 설정됩니다.'}else note?.remove()}
function setupNewRole34(){if(editMemberId)return;const type=$('fmType');if(!type)return;let role=$('fmRole');if(!role){const opts=newRoleOptions34();if(opts.length>1){const field=type.closest('.field');field?.insertAdjacentHTML('afterend',`<div class="field newRoleField34"><label>역할</label><select id="fmRole">${opts.map(r=>`<option value="${r}">${roleLabel34(r)}</option>`).join('')}</select></div><div id="fmPinWrap" class="field hide"><label>초기 PIN</label><input id="fmPin" type="password" inputmode="numeric" readonly placeholder="모임장·운영진 선택 시 자동설정"></div>`);role=$('fmRole')}}if(role&&!role.dataset.pin34){role.dataset.pin34='1';role.addEventListener('change',()=>setTimeout(syncInitialPin34,0))}if(!type.dataset.pin34){type.dataset.pin34='1';type.addEventListener('change',()=>setTimeout(syncInitialPin34,0))}syncInitialPin34()}
const openMemberModal33=openMemberModal;openMemberModal=function(m){const r=openMemberModal33(m);if(!m)setTimeout(setupNewRole34,0);return r};
const saveMemberNow33=saveMemberNow;saveMemberNow=async function(){if(!editMemberId){const role=$('fmRole')?.value,pin=$('fmPin');if(pin&&['manager','organizer'].includes(role))pin.value='000000'}return saveMemberNow33()};
const renderSettings33=renderSettings;renderSettings=function(){renderSettings33();const b=$('settings');if(!b)return;[...b.querySelectorAll('.meta')].forEach(el=>{if(/콕매치 v(?:\d+|\d+\.\d+)/.test(el.textContent||''))el.textContent='콕매치 v3.4 · 역할별 등록 · 동명이인 허용 · 완전일치 회원만 중복 경고'})};
})();

/* migrated into v6.0: app-v3.5.js */
(()=>{
const LOGIN35_API='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-login-v33';
let loginCandidates35=[],selectedLogin35=null,loginBusy35=false,loginFinalizing35=false;
async function loginReq35(action,body={}){const r=await fetch(LOGIN35_API,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action,...body}),cache:'no-store'});const x=await r.json().catch(()=>({}));if(!r.ok){const e=new Error(x.error||'로그인 처리에 실패했습니다.');e.payload=x;throw e}return x}
function candidateInfo35(c){const year=c.year?`${esc(c.year)}년생`:'출생연도 미등록',gender=String(c.gender||'').trim(),cls=c.cls?`${esc(c.cls)}급`:'급수 미등록',role=esc(c.roleLabel||'회원');return[year,gender?esc(gender):'',cls,role].filter(Boolean).join(' · ')}
function candidateHtml35(c,i){return`<button type="button" class="choiceBtn loginChoice33" onclick="chooseLoginMember35(${i})"><b>${esc(pendingLoginName)}</b><span>${candidateInfo35(c)}</span><small>${esc(c.groupName||'모임')}</small></button>`}
function renderLoginCandidates35(){if(!loginCandidates35.length)return renderLoginName();$('loginBox').innerHTML=`<h2>${loginCandidates35.length>1?'동명이인 회원 선택':'회원 확인'}</h2><div class="authName">${esc(pendingLoginName)}</div><div class="note loginGuide33">${loginCandidates35.length>1?'같은 이름으로 등록된 회원이 있습니다. 본인의 출생연도·성별·급수·역할을 확인하고 선택해주세요.':'회원정보를 확인해주세요.'}</div><div class="choiceList loginChoices33">${loginCandidates35.map((c,i)=>candidateHtml35(c,i)).join('')}</div><div id="loginErr" class="error"></div><button class="btn ghost" style="width:100%;margin-top:9px" onclick="renderLoginName()">← 이름 다시 입력</button>`}
window.chooseLoginMember35=function(i){const c=loginCandidates35[Number(i)];if(!c)return;selectedLogin35=c;renderLoginPin35()};
function renderLoginPin35(){const c=selectedLogin35;if(!c)return renderLoginCandidates35();const adminOnly=!!c.globalAdminOnly;const title=adminOnly?'개발자 PIN':'모임 PIN';$('loginBox').innerHTML=`<h2>${title} 입력</h2><div class="loginMember33"><b>${esc(pendingLoginName)}</b><span>${adminOnly?'개발자':candidateInfo35(c)}</span><small>${adminOnly?'':esc(c.groupName||'모임')}</small></div><div class="note" style="margin-bottom:12px">${adminOnly?'개발자 PIN을 입력해주세요.':'선택한 모임의 모임 PIN을 입력해주세요.'}</div><div class="field"><label>${title}</label><input id="loginPin" type="password" inputmode="numeric" autocomplete="current-password" placeholder="${title} 입력"></div><button id="loginSubmit35" class="btn pri" style="width:100%" onclick="submitLogin()">로그인</button><div id="loginErr" class="error"></div><button class="btn ghost" style="width:100%;margin-top:8px" onclick="${loginCandidates35.length>1?'renderLoginCandidates35()':'renderLoginName()'}">← ${loginCandidates35.length>1?'회원 다시 선택':'이름 다시 입력'}</button>`;const p=$('loginPin');if(p){p.addEventListener('keydown',e=>{if(e.key==='Enter')submitLogin()});setTimeout(()=>p.focus(),30)}}
renderLoginName=function(){loginCandidates35=[];selectedLogin35=null;pendingLoginPin='';$('loginBox').innerHTML=`<h1>🏸 콕매치</h1><div class="meta" style="font-size:14px;margin-bottom:18px">모임 회원 로그인</div><div class="field"><label>등록된 이름</label><input id="loginName" autocomplete="username" placeholder="이름"></div><button class="btn pri" style="width:100%" onclick="startLogin()">다음</button><div id="loginErr" class="error"></div><div class="note" style="margin-top:12px">동명이인이 있으면 <b>이름 · 출생연도 · 성별 · 급수 · 역할</b>을 확인해 본인을 선택한 뒤 모임 PIN으로 로그인합니다.</div>`;const n=$('loginName');if(n){n.addEventListener('keydown',e=>{if(e.key==='Enter')startLogin()});setTimeout(()=>n.focus(),30)}};
startLogin=async function(){if(loginBusy35)return;const name=$('loginName')?.value.trim()||'',err=$('loginErr');if(err)err.textContent='';if(!name){if(err)err.textContent='이름을 입력해주세요.';return}loginBusy35=true;try{const x=await loginReq35('probe',{name});pendingLoginName=name;loginCandidates35=(Array.isArray(x.memberships)?x.memberships:[]).map(c=>({...c}));if(!loginCandidates35.length&&x.globalAdmin)loginCandidates35.push({globalAdminOnly:true,groupId:'',groupName:'',memberId:'',year:'',gender:'',cls:'',roleLabel:'개발자'});if(loginCandidates35.length===1){selectedLogin35=loginCandidates35[0];renderLoginPin35()}else renderLoginCandidates35()}catch(e){if(err)err.textContent=e.message}finally{loginBusy35=false}};
async function finalizeLogin35(x,c){T=x.token;localStorage.setItem(TOKEN_KEY,T);const gid=x.groupId||c?.groupId||'';if(gid){currentGroupId=gid;localStorage.setItem(GROUP_KEY,currentGroupId)}$('login').classList.add('hide');pendingLoginPin='';await loadState(true);const mine=me?.memberId?M(me.memberId):null;if(mine?.state==='out')openEntry()}
submitLogin=async function(){if(loginBusy35)return;const c=selectedLogin35||loginCandidates35[0];if(!c){renderLoginCandidates35();return}const pin=$('loginPin')?.value.trim()||pendingLoginPin;if(!pin){const e=$('loginErr');if(e)e.textContent='모임 PIN을 입력해주세요.';return}pendingLoginPin=pin;loginBusy35=true;loginFinalizing35=true;const btn=$('loginSubmit35');if(btn)btn.disabled=true;try{let x=await loginReq35('login',{name:pendingLoginName,pin,groupId:c.groupId||'',memberId:c.memberId||''});try{await finalizeLogin35(x,c)}catch(e){if(!/로그인이 만료|로그인이 필요|401/i.test(String(e?.message||e)))throw e;await new Promise(r=>setTimeout(r,120));x=await loginReq35('login',{name:pendingLoginName,pin,groupId:c.groupId||'',memberId:c.memberId||''});await finalizeLogin35(x,c)}}catch(e){$('login')?.classList.remove('hide');const el=$('loginErr');if(el)el.textContent=e.message;else alert(e.message)}finally{loginFinalizing35=false;loginBusy35=false;if(btn)btn.disabled=false}};
function memberSig35(x){const type=String(x?.type||'member')==='guest'?'guest':'member',role=type==='guest'?'member':String(x?.role||'member');return[String(x?.name||'').trim(),String(Number(x?.year)||''),String(x?.gender||'남'),String(x?.cls||'C').toUpperCase(),type,role].join('|')}
function formMember35(){const cur=editMemberId?M(editMemberId):null,type=$('fmType')?.value==='guest'?'guest':'member';let role=$('fmRole')?.value||(cur?roleOf(cur):'member');if(type==='guest')role='member';return{name:$('fmName')?.value.trim()||'',year:Number($('fmYear')?.value),gender:$('fmGender')?.value||'남',cls:($('fmCls')?.value||'C').toUpperCase(),type,role}}
const saveMemberNow35=saveMemberNow;saveMemberNow=async function(){const f=formMember35();if(f.name){const dup=(S?.members||[]).find(m=>String(m?.id)!==String(editMemberId||'')&&memberSig35(m)===memberSig35(f));if(dup){const kind=f.type==='guest'?'게스트':f.role==='manager'?'모임장':f.role==='organizer'?'운영진':'일반';return alert(`동일한 회원 정보가 이미 등록되어 있습니다.\n\n${f.name} · ${f.year}년생 · ${f.gender} · ${f.cls}급 · ${kind}\n\n출생연도·성별·급수·구분·역할 중 하나라도 다르면 동명이인으로 등록할 수 있습니다.`)}}return saveMemberNow35()};
const openMemberModal35=openMemberModal;openMemberModal=function(m){const r=openMemberModal35(m);if(!m)setTimeout(()=>{if($('sameNameGuide35'))return;const field=$('fmName')?.closest('.field');field?.insertAdjacentHTML('afterend','<div id="sameNameGuide35" class="meta" style="margin:-2px 0 8px">동명이인은 출생연도·성별·급수·구분·역할 중 하나라도 다르면 등록할 수 있습니다.</div>')},0);return r};
const renderSettings34=renderSettings;renderSettings=function(){renderSettings34();const b=$('settings');if(!b)return;[...b.querySelectorAll('.meta')].forEach(el=>{if(/콕매치 v(?:\d+|\d+\.\d+)/.test(el.textContent||''))el.textContent='콕매치 v3.5 · 동명이인 개별등록 허용 · 완전일치만 중복차단 · 로그인 성별 구분'})};
if(!T)renderLoginName();
})();

/* migrated into v6.0: app-v3.6.js */
(()=>{
const MEMBER36_API='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-member-v45';
function role36(){const type=$('fmType')?.value==='guest'?'guest':'member';let role=$('fmRole')?.value||'member';if(type==='guest')role='member';return{type,role}}
function sig36(x){const type=String(x?.type||'member')==='guest'?'guest':'member',role=type==='guest'?'member':String(x?.role||'member');return[String(x?.name||'').trim(),String(Number(x?.year)||''),String(x?.gender||'남'),String(x?.cls||'C').toUpperCase(),type,role].join('|')}
function label36(x){const kind=x.type==='guest'?'게스트':x.role==='manager'?'모임장':x.role==='organizer'?'운영진':'일반';return`${x.name} · ${x.year}년생 · ${x.gender} · ${x.cls}급 · ${kind}`}
const saveMemberNowPrev36=saveMemberNow;
saveMemberNow=async function(){
 if(editMemberId)return saveMemberNowPrev36();
 const rr=role36(),name=$('fmName')?.value.trim()||'',year=Number($('fmYear')?.value),gender=$('fmGender')?.value||'남',cls=($('fmCls')?.value||'C').toUpperCase();
 const inviter=rr.type==='guest'?($('fmInviter45')?.value.trim()||''):'';
 if(!name)return alert('이름을 입력해주세요.');
 if(!Number.isInteger(year)||year<1900)return alert('출생연도를 확인해주세요.');
 if(!['남','여'].includes(gender))return alert('성별을 확인해주세요.');
 if(!['A','B','C','D','E'].includes(cls))return alert('급수는 A~E로 선택해주세요.');
 if(rr.type==='guest'&&!inviter)return alert('게스트의 초대인을 입력해주세요.');
 const candidate={name,year,gender,cls,type:rr.type,role:rr.role};
 const dup=(S?.members||[]).find(m=>sig36(m)===sig36(candidate));
 if(dup)return alert(`동일한 회원 정보가 이미 등록되어 있습니다.\n\n${label36(candidate)}\n\n이름이 같아도 출생연도·성별·급수·구분·역할 중 하나라도 다르면 새 회원으로 등록할 수 있습니다.`);
 const body={action:'save_member',groupId:currentGroupId,memberId:'',name,year,gender,cls,type:rr.type,role:rr.role,pin:['manager','organizer'].includes(rr.role)?'000000':'',inviter};
 try{
  const r=await fetch(MEMBER36_API,{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+T},body:JSON.stringify(body),cache:'no-store'});
  const x=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(x.error||'회원 저장에 실패했습니다.');
  S=x.data;normalizeClient();closeModal();renderAll();
 }catch(e){if(typeof showError==='function')showError(e);else alert(e?.message||'회원 저장에 실패했습니다.')}
};
const renderSettings35=renderSettings;
renderSettings=function(){renderSettings35();const b=$('settings');if(!b)return;[...b.querySelectorAll('.meta')].forEach(el=>{if(/콕매치 v(?:\d+|\d+\.\d+)/.test(el.textContent||''))el.textContent='콕매치 v3.6 · 동일이름 개별등록 수정 · 신규등록 전용 저장경로 · 캐시 분리'})};
})();

/* migrated into v6.0: app-v3.7.js */
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
 const adminOnly=!!c.globalAdminOnly,title=adminOnly?'개발자 PIN':'모임 PIN';
 $('loginBox').innerHTML=`<h2>${title} 입력</h2><div class="loginMember33"><b>${esc(pendingLoginName)}</b><span>${adminOnly?'개발자':candidateInfo37(c)}</span><small>${adminOnly?'':esc(c.groupName||'모임')}</small></div><div class="note" style="margin-bottom:12px">${adminOnly?'개발자 PIN을 입력해주세요.':'선택한 모임의 모임 PIN을 입력해주세요.'}</div><div class="field"><label>${title}</label><input id="loginPin" type="password" inputmode="numeric" autocomplete="current-password" placeholder="${title} 입력"></div><button id="loginSubmit37" class="btn pri" style="width:100%" onclick="submitLogin()">로그인</button><div id="loginErr" class="error"></div><button class="btn ghost" style="width:100%;margin-top:8px" onclick="${loginCandidates37.length>1?'renderLoginCandidates37()':'renderLoginName()'}">← ${loginCandidates37.length>1?'회원 다시 선택':'이름 다시 입력'}</button>`;
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
  if(!loginCandidates37.length&&x.globalAdmin)loginCandidates37.push({globalAdminOnly:true,groupId:'',groupName:'',memberId:'',year:'',gender:'',cls:'',roleLabel:'개발자'});
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
 const pin=$('loginPin')?.value.trim()||pendingLoginPin;if(!pin){const e=$('loginErr');if(e)e.textContent=c.globalAdminOnly?'개발자 PIN을 입력해주세요.':'모임 PIN을 입력해주세요.';return}
 pendingLoginPin=pin;loginBusy37=true;loginFinalizing37=true;const btn=$('loginSubmit37');if(btn){btn.disabled=true;btn.textContent='로그인 중...'}
 try{
  let x=await loginReq37('login',{name:pendingLoginName,pin,groupId:c.groupId||'',memberId:c.memberId||''});
  try{await finalizeLogin37(x,c)}catch(e){if(!/로그인이 만료|로그인이 필요|401/i.test(String(e?.message||e)))throw e;await new Promise(r=>setTimeout(r,80));x=await loginReq37('login',{name:pendingLoginName,pin,groupId:c.groupId||'',memberId:c.memberId||''});await finalizeLogin37(x,c)}
 }catch(e){$('login')?.classList.remove('hide');const el=$('loginErr');if(el)el.textContent=e.message;else alert(e.message)}
 finally{loginFinalizing37=false;loginBusy37=false;if(btn&&document.body.contains(btn)){btn.disabled=false;btn.textContent='로그인'}}
};

function roleForm37(){const type=$('fmType')?.value==='guest'?'guest':'member';let role=$('fmRole')?.value||'member';if(type==='guest')role='member';return{type,role}}
function sig37(x){const type=String(x?.type||'member')==='guest'?'guest':'member',role=type==='guest'?'member':String(x?.role||'member');return[String(x?.name||'').trim(),String(Number(x?.year)||''),String(x?.gender||'남'),String(x?.cls||'C').toUpperCase(),type,role].join('|')}
function label37(x){const kind=x.type==='guest'?'게스트':x.role==='manager'?'모임장':x.role==='organizer'?'운영진':'일반';return`${x.name} · ${x.year}년생 · ${x.gender} · ${x.cls}급 · ${kind}`}
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

/* migrated into v6.0: app-v3.8.js */
(()=>{
const VER38='3.8';
const LOGIN38_API='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-login-v33';
const AUTH38_API='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-auth-v38';
const GROUP38_API='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-groups-v38';
let loginCandidates38=[],selectedLogin38=null,loginBusy38=false,loginIsDeveloper38=false;
let prefetch38=0,composing38=false;
const probeCache38=new Map();
let myMemberships38=[],membershipsReady38=false,membershipAt38=0,membershipBusy38=null,currentPinDefault38=null;

async function post38(url,body={},auth=false){
 const r=await fetch(url,{method:'POST',headers:{'content-type':'application/json',...(auth&&T?{authorization:'Bearer '+T}:{})},body:JSON.stringify(body),cache:'no-store'});
 const x=await r.json().catch(()=>({}));if(!r.ok){const e=new Error(x.error||'요청 처리에 실패했습니다.');e.status=r.status;e.payload=x;throw e}return x;
}
async function probe38(name,force=false){const key=String(name||'').trim();if(!key)throw new Error('이름을 입력해주세요.');const c=probeCache38.get(key);if(!force&&c&&Date.now()-c.at<5000)return c.data;const data=await post38(LOGIN38_API,{action:'probe',name:key});probeCache38.set(key,{at:Date.now(),data});return data}
function info38(c){const year=c.year?`${esc(c.year)}년생`:'출생연도 미등록',gender=String(c.gender||'').trim(),cls=c.cls?`${esc(c.cls)}급`:'급수 미등록',role=esc(c.roleLabel||'회원');return[year,gender?esc(gender):'',cls,role].filter(Boolean).join(' · ')}
function candidate38(c,i){return `<button type="button" class="choiceBtn" onclick="chooseLogin38(${i})"><b>${esc(pendingLoginName)}</b><span>${info38(c)}</span><small>${esc(c.groupName||'모임')}</small></button>`}
window.renderLoginCandidates38=function(){if(!loginCandidates38.length)return renderLoginName();$('loginBox').innerHTML=`<h2>회원 선택</h2><div class="authName">${esc(pendingLoginName)}</div><div class="note">같은 이름 또는 여러 모임의 회원정보가 있습니다. 출생연도·성별·급수·역할·모임을 확인하고 본인을 선택해주세요.</div><div class="choiceList">${loginCandidates38.map(candidate38).join('')}</div><div id="loginErr" class="error"></div><button class="btn ghost" style="width:100%;margin-top:9px" onclick="renderLoginName()">← 이름 다시 입력</button>`};
window.chooseLogin38=function(i){const c=loginCandidates38[Number(i)];if(!c)return;selectedLogin38=c;loginIsDeveloper38=false;renderLoginPin38()};
function renderLoginPin38(){const c=selectedLogin38||{},title=loginIsDeveloper38?'개발자 PIN':'모임 PIN';$('loginBox').innerHTML=`<h2>${title} 입력</h2><div class="loginMember33"><b>${esc(pendingLoginName)}</b>${loginIsDeveloper38?'<span>개발자</span>':`<span>${info38(c)}</span><small>${esc(c.groupName||'모임')}</small>`}</div><div class="note" style="margin-bottom:12px">${loginIsDeveloper38?'마지막으로 사용한 모임으로 자동 접속합니다.':'선택한 모임의 PIN을 입력해주세요.'}</div><div class="field"><label>${title}</label><input id="loginPin" type="password" inputmode="numeric" autocomplete="current-password" placeholder="${title} 입력"></div><button id="loginSubmit38" class="btn pri" style="width:100%" onclick="submitLogin()">로그인</button><div id="loginErr" class="error"></div><button class="btn ghost" style="width:100%;margin-top:8px" onclick="${!loginIsDeveloper38&&loginCandidates38.length>1?'renderLoginCandidates38()':'renderLoginName()'}">← ${!loginIsDeveloper38&&loginCandidates38.length>1?'회원 다시 선택':'이름 다시 입력'}</button>`;const p=$('loginPin');if(p){p.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.isComposing)submitLogin()});setTimeout(()=>p.focus(),20)}}
function scheduleProbe38(){clearTimeout(prefetch38);if(composing38)return;const name=$('loginName')?.value.trim()||'';if(name.length<2)return;prefetch38=setTimeout(()=>probe38(name).catch(()=>{}),180)}
renderLoginName=function(){loginCandidates38=[];selectedLogin38=null;loginIsDeveloper38=false;pendingLoginPin='';$('loginBox').innerHTML=`<h1>🏸 콕매치</h1><div class="meta" style="font-size:14px;margin-bottom:18px">모임 회원 로그인</div><div class="field"><label>등록된 이름</label><input id="loginName" autocomplete="username" placeholder="이름"></div><button id="loginNext38" class="btn pri" style="width:100%" onclick="startLogin()">다음</button><div id="loginErr" class="error"></div><div class="note" style="margin-top:12px">일반 회원은 본인 정보를 선택한 뒤 모임 PIN으로 로그인합니다. 개발자는 이름 확인 후 바로 개발자 PIN을 입력합니다.</div>`;const n=$('loginName');if(n){n.addEventListener('compositionstart',()=>composing38=true);n.addEventListener('compositionend',()=>{composing38=false;scheduleProbe38()});n.addEventListener('input',scheduleProbe38);n.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.isComposing)startLogin()});setTimeout(()=>n.focus(),20)}};
startLogin=async function(){if(loginBusy38)return;const name=$('loginName')?.value.trim()||'',err=$('loginErr'),btn=$('loginNext38');if(err)err.textContent='';if(!name){if(err)err.textContent='이름을 입력해주세요.';return}loginBusy38=true;if(btn){btn.disabled=true;btn.textContent='회원정보 확인 중...'}try{const x=await probe38(name);pendingLoginName=name;loginCandidates38=Array.isArray(x.memberships)?x.memberships.map(c=>({...c})):[];if(x.globalAdmin){loginIsDeveloper38=true;const last=localStorage.getItem(GROUP_KEY)||'';selectedLogin38=loginCandidates38.find(c=>c.groupId===last)||loginCandidates38[0]||{globalAdminOnly:true,groupId:last,memberId:'',groupName:''};renderLoginPin38();return}loginIsDeveloper38=false;if(loginCandidates38.length===1){selectedLogin38=loginCandidates38[0];renderLoginPin38()}else renderLoginCandidates38()}catch(e){if(err)err.textContent=e.message}finally{loginBusy38=false;if(btn&&document.body.contains(btn)){btn.disabled=false;btn.textContent='다음'}}};
function initialPinAlert38(){alert('초기 비밀번호 000000을 사용 중입니다.\n\n보안을 위해 개인 비밀번호를 변경해주세요.\n변경 방법: 설정 → 개인 비밀번호 변경 → 현재 비밀번호(초기 000000) 입력 → 새 비밀번호 입력\n\n000000을 그대로 사용하면 로그인할 때마다 이 안내가 표시됩니다.')}
async function finalizeLogin38(x,c){T=x.token;localStorage.setItem(TOKEN_KEY,T);const gid=x.groupId||c?.groupId||'';if(gid){currentGroupId=gid;localStorage.setItem(GROUP_KEY,gid)}$('login').classList.add('hide');pendingLoginPin='';await loadState(true);await refreshMyMemberships38(true).catch(()=>{});const mine=me?.memberId?M(me.memberId):null;if(x.initialPinPending)setTimeout(initialPinAlert38,40);if(mine?.state==='out')setTimeout(()=>openEntry(),70)}
submitLogin=async function(){if(loginBusy38)return;const c=selectedLogin38||loginCandidates38[0]||{},pin=$('loginPin')?.value.trim()||pendingLoginPin,err=$('loginErr'),btn=$('loginSubmit38');if(!pin){if(err)err.textContent=loginIsDeveloper38?'개발자 PIN을 입력해주세요.':'모임 PIN을 입력해주세요.';return}pendingLoginPin=pin;loginBusy38=true;if(btn){btn.disabled=true;btn.textContent='로그인 중...'}try{const x=await post38(LOGIN38_API,{action:'login',name:pendingLoginName,pin,groupId:c.groupId||localStorage.getItem(GROUP_KEY)||'',memberId:loginIsDeveloper38?'':(c.memberId||'')});await finalizeLogin38(x,c)}catch(e){$('login')?.classList.remove('hide');if(err)err.textContent=e.message;else alert(e.message)}finally{loginBusy38=false;if(btn&&document.body.contains(btn)){btn.disabled=false;btn.textContent='로그인'}}};

async function auth38(action,body={}){return post38(AUTH38_API,{action,...body},true)}
async function refreshMyMemberships38(force=false){if(!T||!me)return null;const now=Date.now();if(!force&&membershipsReady38&&now-membershipAt38<15000)return{memberships:myMemberships38,currentPinDefault:currentPinDefault38};if(membershipBusy38&&!force)return membershipBusy38;membershipBusy38=auth38('my_memberships',{currentGroupId}).then(x=>{myMemberships38=Array.isArray(x.memberships)?x.memberships:[];currentPinDefault38=typeof x.currentPinDefault==='boolean'?x.currentPinDefault:null;membershipsReady38=true;membershipAt38=Date.now();try{renderHeader()}catch{}if(currentView==='settings')try{renderSettings()}catch{}return x}).finally(()=>membershipBusy38=null);return membershipBusy38}
const loadStatePrev38=loadState;
loadState=async function(...args){const r=await loadStatePrev38(...args);if(T&&me)refreshMyMemberships38(false).catch(()=>{});return r};

function roleText38(m){return m.roleLabel||'회원'}
openGroupSwitch=function(){if(!membershipsReady38||myMemberships38.length<=1)return;openModal(`<h3>내 모임 선택</h3><div class="note">본인이 가입된 운영중 모임만 표시됩니다.</div><div class="choiceList">${myMemberships38.map(m=>`<button class="choiceBtn" ${m.groupId===currentGroupId?'disabled':''} onclick="switchOwnGroup38('${m.groupId}')"><b>${esc(m.groupName)}</b><span class="meta">${esc(roleText38(m))}${m.groupId===currentGroupId?' · 현재 모임':''}</span></button>`).join('')}</div><button class="btn ghost" style="width:100%;margin-top:9px" onclick="closeModal()">취소</button>`)};
window.switchOwnGroup38=async function(id){if(!id||id===currentGroupId){closeModal();return}try{const x=await auth38('switch_group',{groupId:id});if(x.token){T=x.token;localStorage.setItem(TOKEN_KEY,T)}currentGroupId=x.groupId||id;localStorage.setItem(GROUP_KEY,currentGroupId);membershipsReady38=false;closeModal();await loadState(true);await refreshMyMemberships38(true);if(currentView==='members'&&typeof window.memberPageGo46==='function')window.memberPageGo46(1);window.scrollTo(0,0)}catch(e){showError(e);refreshMyMemberships38(true).catch(()=>{})}};
window.adminSwitchGroup38=async function(id,view='members'){if(!me?.globalAdmin)return switchOwnGroup38(id);currentGroupId=id;localStorage.setItem(GROUP_KEY,id);closeModal();try{await loadState(true);membershipsReady38=false;await refreshMyMemberships38(true).catch(()=>{});if(view==='members'&&typeof window.memberPageGo46==='function')window.memberPageGo46(1);goView(view)}catch(e){showError(e)}};
switchGroup=function(id,view='members'){return me?.globalAdmin?adminSwitchGroup38(id,view):switchOwnGroup38(id)};
const renderHeaderPrev38=renderHeader;
renderHeader=function(){const r=renderHeaderPrev38();const b=$('groupBtn');if(!b)return r;const selectable=membershipsReady38&&myMemberships38.length>1;b.textContent=(group?.name||'모임')+(selectable?' ▾':'');b.disabled=!selectable;b.onclick=selectable?openGroupSwitch:null;return r};

window.openMyPinChange38=function(){openModal(`<h3>개인 비밀번호 변경</h3><div class="note">모임장·운영진 개인 비밀번호입니다. 숫자 4~8자리로 설정할 수 있으며 000000은 새 비밀번호로 사용할 수 없습니다.</div><div class="field"><label>현재 비밀번호</label><input id="myPinOld38" type="password" inputmode="numeric" placeholder="초기 비밀번호는 000000"></div><div class="field"><label>새 비밀번호</label><input id="myPinNew38" type="password" inputmode="numeric" placeholder="숫자 4~8자리"></div><div class="field"><label>새 비밀번호 확인</label><input id="myPinNew238" type="password" inputmode="numeric" placeholder="한 번 더 입력"></div><div class="acts"><button class="btn ghost" onclick="closeModal()">취소</button><button id="saveMyPin38" class="btn pri" onclick="saveMyPin38()">변경</button></div>`);setTimeout(()=>$('myPinOld38')?.focus(),30)};
window.saveMyPin38=async function(){const old=$('myPinOld38')?.value.trim()||'',n1=$('myPinNew38')?.value.trim()||'',n2=$('myPinNew238')?.value.trim()||'',btn=$('saveMyPin38');if(!old)return alert('현재 비밀번호를 입력해주세요.');if(!/^\d{4,8}$/.test(n1))return alert('새 비밀번호는 숫자 4~8자리로 입력해주세요.');if(n1!==n2)return alert('새 비밀번호 확인이 일치하지 않습니다.');if(btn){btn.disabled=true;btn.textContent='변경 중...'}try{await auth38('change_pin',{currentPin:old,newPin:n1});currentPinDefault38=false;closeModal();renderSettings();alert('개인 비밀번호를 변경했습니다. 다음 로그인부터 초기 비밀번호 안내가 표시되지 않습니다.')}catch(e){showError(e);if(btn&&document.body.contains(btn)){btn.disabled=false;btn.textContent='변경'}}};
const renderSettingsPrev38=renderSettings;
renderSettings=function(){const r=renderSettingsPrev38();const box=$('settings');if(!box)return r;if(me&&!me.globalAdmin&&['manager','organizer'].includes(String(me.role))&&!box.querySelector('#personalPinCard38')){const title=box.querySelector('.title');const state=currentPinDefault38===true?'<div class="warn" style="margin-top:7px">초기 비밀번호 000000 사용 중 · 변경을 권장합니다.</div>':currentPinDefault38===false?'<div class="meta" style="margin-top:7px">개인 비밀번호가 변경되어 있습니다.</div>':'<div class="meta" style="margin-top:7px">비밀번호 상태 확인 중...</div>';title?.insertAdjacentHTML('afterend',`<div id="personalPinCard38" class="card"><div class="between"><div><b>개인 비밀번호</b><div class="meta">${me.role==='manager'?'모임장':'운영진'} 계정용</div></div><button class="btn pri" onclick="openMyPinChange38()">비밀번호 변경</button></div>${state}</div>`)}return r};

async function groupToggleReq38(groupId,active){return post38(GROUP38_API,{action:'set_active',groupId,active},true)}
window.toggleGroupActive38=async function(id,active){const g=groupSummaries.find(x=>x.groupId===id);if(!g)return;const verb=active?'활성화':'비활성화';if(!confirm(`${g.name} 모임을 ${verb}하시겠습니까?${active?'':'\n비활성화하면 해당 모임의 일반 로그인 세션이 종료됩니다.'}`))return;try{await groupToggleReq38(id,active);await loadGroups();membershipsReady38=false;await refreshMyMemberships38(true).catch(()=>{});if(!active&&currentGroupId===id&&me?.globalAdmin){const next=myMemberships38.find(x=>groupSummaries.some(g=>g.groupId===x.groupId&&g.isActive))||groupSummaries.find(x=>x.isActive);if(next){currentGroupId=next.groupId;localStorage.setItem(GROUP_KEY,currentGroupId);await loadState(true)}}renderGroups()}catch(e){showError(e)}};
function toggleHtml38(g){return `<button class="groupToggle38 ${g.isActive?'on':'off'}" aria-pressed="${g.isActive?'true':'false'}" onclick="toggleGroupActive38('${g.groupId}',${!g.isActive})"><span></span>${g.isActive?'ON':'OFF'}</button>`}
renderGroups=function(){if(!$('groups')||!canManageGroups())return;$('groups').innerHTML=`<div class="title"><h2>모임관리</h2><button class="btn pri" onclick="openGroupEditor()">+ 모임 생성</button></div><div class="note">ON/OFF로 모임 운영상태를 즉시 관리할 수 있습니다. 비활성 모임의 데이터는 보존됩니다.</div>${groupSummaries.map(g=>`<div class="card groupCard ${g.isActive?'':'inactive'}"><div class="between"><div><b>${esc(g.name)}</b><div class="meta">${g.isActive?'운영중':'비활성'}</div></div><div class="groupCountToggle38"><span class="tag">${g.memberCount}명</span>${toggleHtml38(g)}</div></div><div class="groupStats"><span>모임장 ${g.managers.length?esc(g.managers.join(', ')):'미지정'}</span><span>운영진 ${g.organizers.length?esc(g.organizers.join(', ')):'없음'}</span><span>대기 ${g.waiting}</span><span>게임중 ${g.playing}</span></div><div class="groupActs">${g.isActive?`<button class="btn pri" onclick="adminSwitchGroup38('${g.groupId}','members')">인원/권한 관리</button>`:''}<button class="btn ghost" onclick="openGroupEditor('${g.groupId}')">모임 수정</button>${!g.isActive&&typeof window.purgeGroup42==='function'?`<button class="btn danger" onclick="purgeGroup42('${g.groupId}')">완전삭제</button>`:''}</div></div>`).join('')||'<div class="empty">등록된 모임이 없습니다.</div>'}`};

function style38(){if($('style38'))return;const s=document.createElement('style');s.id='style38';s.textContent=`.groupCountToggle38{display:flex;align-items:center;gap:7px}.groupToggle38{border:0;border-radius:999px;min-width:66px;height:30px;padding:0 9px;display:flex;align-items:center;justify-content:center;gap:6px;font-weight:900;font-size:11px;cursor:pointer}.groupToggle38 span{width:15px;height:15px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.25)}.groupToggle38.on{background:#20a464;color:#fff}.groupToggle38.off{background:#c9ced8;color:#4d5562}.groupCard.inactive{opacity:.72}.choiceBtn:disabled{opacity:.55;cursor:default}`;document.head.appendChild(s)}
style38();
const renderSettingsVersion38=renderSettings;
renderSettings=function(){const r=renderSettingsVersion38();const box=$('settings');if(box)[...box.querySelectorAll('.meta')].forEach(el=>{if(/콕매치 v(?:\d+|\d+\.\d+)/.test(el.textContent||''))el.textContent='콕매치 v3.8 · 내 모임 전환 · 개발자 마지막모임 로그인 · 초기 PIN 안내 · 10명 페이지'});return r};

if(T&&me)refreshMyMemberships38(true).catch(()=>{});else if(!T)renderLoginName();
})();

/* migrated into v6.0: app-v4.1.js */
(()=>{
const ROSTER42='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-roster-v47';
const DEV_NAME42='박태영';
let memberReady42=false,memberGroup42='',memberReq42=null,memberReqGroup42='',memberLoadedAt42=0;

function developer42(){return !!me&&me.globalAdmin===true&&String(me.displayName||'').trim()===DEV_NAME42}
function adminMember42(m){return !!m&&String(m.name||'').trim()===DEV_NAME42&&roleOf(m)==='admin'}
function generalBadge42(){return '<span class="roleBadge role-member44">일반</span>'}
const roleBadgePrev42=roleBadge;
roleBadge=function(m){if(adminMember42(m)&&String(S?.adminBadgeVisibility||'all')==='hidden'&&!developer42())return generalBadge42();return roleBadgePrev42(m)};

function invalidateMembers42(){memberReady42=false;memberLoadedAt42=0}
function hasFullRoster42(){const got=Array.isArray(S?.members)?S.members.length:0,expected=Number(window.__kokmatchMemberCount46||0);return got>0&&(!expected||got>=expected)}
function showRosterLoading42(){const b=$('members');if(!b||hasFullRoster42())return;b.innerHTML='<div class="title"><h2>회원명부</h2></div><div class="empty">회원명단을 불러오는 중입니다...</div>'}
function applyRoster42(x,gid){
 if(String(gid)!==String(currentGroupId||''))return false;
 const members=Array.isArray(x?.members)?x.members:[];
 S={...(S||{}),members,adminBadgeVisibility:String(x?.adminBadgeVisibility||S?.adminBadgeVisibility||'all')};
 window.__kokmatchMemberCount46=Number(x?.memberCount||members.length);normalizeClient();memberReady42=true;memberGroup42=gid;memberLoadedAt42=Date.now();return true;
}
async function fetchRoster42(force=false){
 if(!T||!currentGroupId)return null;const gid=String(currentGroupId);
 if(!force&&memberReady42&&memberGroup42===gid&&Date.now()-memberLoadedAt42<30000)return {members:S.members,memberCount:S.members?.length||0};
 if(memberReq42&&memberReqGroup42===gid)return memberReq42;
 memberGroup42=gid;if(!hasFullRoster42())showRosterLoading42();
 const promise=(async()=>{
  const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),8000);
  try{
   const u=new URL(ROSTER42);u.searchParams.set('groupId',gid);u.searchParams.set('t',Date.now());
   const r=await fetch(u,{headers:{authorization:'Bearer '+T},cache:'no-store',signal:ctl.signal});const x=await r.json().catch(()=>({}));
   if(!r.ok){if(r.status===401){reloginLatest();throw new Error('로그인이 만료되었습니다.')}throw new Error(x.error||'회원명단을 불러오지 못했습니다.')}
   if(String(currentGroupId||'')!==gid)return x;applyRoster42(x,gid);return x;
  }catch(e){if(e?.name==='AbortError')throw new Error('회원명단 응답이 지연되고 있습니다. 다시 시도해주세요.');throw e}finally{clearTimeout(timer)}
 })();
 memberReq42=promise;memberReqGroup42=gid;
 try{return await promise}finally{if(memberReq42===promise){memberReq42=null;memberReqGroup42=''}}
}
function renderFullPage42(){
 if(currentView!=='members'||!memberReady42||memberGroup42!==String(currentGroupId||''))return;
 try{if(typeof window.resetMemberList46==='function')window.resetMemberList46();else renderMembers();$('memberSearchInput46')?.blur()}catch(e){console.error('render roster v4.7',e);try{renderMembers()}catch{}}
}
async function enterMembers42(force=true){
 try{await fetchRoster42(force);renderFullPage42()}catch(e){if(currentView==='members'){const b=$('members');if(b)b.innerHTML=`<div class="title"><h2>회원명부</h2></div><div class="warn">${esc(e.message||'회원명단을 불러오지 못했습니다.')}</div><button class="btn pri" onclick="enterMembers42(true)">다시 불러오기</button>`}}
}
window.enterMembers42=enterMembers42;

const renderMembersPrev42=renderMembers;
renderMembers=function(){
 if(currentView==='members'&&(!memberReady42||memberGroup42!==String(currentGroupId||''))){
  if(hasFullRoster42()){memberReady42=true;memberGroup42=String(currentGroupId||'');memberLoadedAt42=Date.now();return renderMembersPrev42()}
  showRosterLoading42();if(!memberReq42)enterMembers42(true);return;
 }
 return renderMembersPrev42();
};
window.refreshMembers46=function(){invalidateMembers42();return enterMembers42(true)};

const goViewPrev42=goView;
goView=function(id){
 const target=String(id||''),prev=currentView;if(target==='members'&&prev!=='members')invalidateMembers42();
 const r=goViewPrev42(id);
 if(target==='members'&&prev!=='members')queueMicrotask(()=>{if(currentView==='members')enterMembers42(false)});
 return r;
};

const badgeSetPrev42=window.setAdminBadgeVisibility43;
if(typeof badgeSetPrev42==='function')window.setAdminBadgeVisibility43=async function(mode){await badgeSetPrev42(mode);invalidateMembers42()};

function stripVersionCard42(){
 const box=$('settings');if(!box)return;
 for(const c of [...box.querySelectorAll('.card')]){const t=String(c.textContent||'');if(t.includes('프로그램 버전')||c.querySelector('#forceUpdateBtn')||c.querySelector('a[href="/versions/"]')){c.remove();break}}
 box.querySelectorAll('#forceUpdateBtn,a[href="/versions/"]').forEach(el=>el.remove());
}
const renderSettingsPrev42=renderSettings;
renderSettings=function(){const r=renderSettingsPrev42();const box=$('settings');if(!box)return r;if(!developer42()){stripVersionCard42();return r}return r};

setTimeout(()=>{if(T&&me&&currentView==='members')enterMembers42(false)},0);
})();

/* migrated into v6.0: app-v4.3.js */
(()=>{
const VER43='4.3';
const PUSH43_API='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-push-v43';
const VAPID43='BJ0MUsN_Hr6yYqSQfQfD734hbwZZjeoc1SmreGE0jDHDRTb0Hn7Eaaib6LWyUWhXmDIOxUj0TU5-gpIYyBeW6vI';
let swReg43=null,pushBusy43=false,lastSyncKey43='',lastSyncAt43=0,pendingPushNav43=null;

function ios43(){return /iPad|iPhone|iPod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1)}
function standalone43(){return window.matchMedia?.('(display-mode: standalone)')?.matches===true||navigator.standalone===true}
function supported43(){return 'serviceWorker'in navigator&&'PushManager'in window&&'Notification'in window}
function b64u43(s){const p='='.repeat((4-s.length%4)%4),b=(s+p).replace(/-/g,'+').replace(/_/g,'/'),raw=atob(b),out=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);return out}
async function postPush43(body){const r=await fetch(PUSH43_API,{method:'POST',headers:{'content-type':'application/json',...(T?{authorization:'Bearer '+T}:{})},body:JSON.stringify(body),cache:'no-store'});const x=await r.json().catch(()=>({}));if(!r.ok)throw new Error(x.error||'게임 알림 설정에 실패했습니다.');return x}
async function registerSw43(){if(!supported43())return null;if(swReg43)return swReg43;swReg43=await navigator.serviceWorker.register('/kokmatch-sw.js?v=4.3',{scope:'/'});await navigator.serviceWorker.ready;return swReg43}
async function subscription43(){const r=await registerSw43();return r?await r.pushManager.getSubscription():null}
function subJson43(sub){const j=sub.toJSON();return{endpoint:j.endpoint,keys:{p256dh:j.keys?.p256dh||'',auth:j.keys?.auth||''}}}
async function syncExisting43(force=false){
 if(!T||!me||!currentGroupId||!supported43()||Notification.permission!=='granted')return false;
 const sub=await subscription43();if(!sub)return false;
 const key=[sub.endpoint,currentGroupId,me.memberId||me.displayName].join('|');if(!force&&key===lastSyncKey43&&Date.now()-lastSyncAt43<600000)return true;
 await postPush43({action:'subscribe',groupId:currentGroupId,subscription:subJson43(sub),userAgent:navigator.userAgent});lastSyncKey43=key;lastSyncAt43=Date.now();return true;
}
window.enableGamePush43=async function(){
 if(pushBusy43)return;if(!supported43())return alert('이 기기/브라우저에서는 게임 알림을 지원하지 않습니다.');
 if(ios43()&&!standalone43())return alert('아이폰/아이패드는 콕매치를 홈 화면에 추가한 뒤 홈 화면의 콕매치 아이콘으로 실행해야 게임 알림을 켤 수 있습니다.');
 pushBusy43=true;try{
  const permission=Notification.permission==='granted'?'granted':await Notification.requestPermission();
  if(permission!=='granted')throw new Error('알림 권한이 허용되지 않았습니다. 기기 알림 설정에서 콕매치를 허용해주세요.');
  const reg=await registerSw43();let sub=await reg.pushManager.getSubscription();if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64u43(VAPID43)});
  await postPush43({action:'subscribe',groupId:currentGroupId,subscription:subJson43(sub),userAgent:navigator.userAgent});lastSyncKey43=[sub.endpoint,currentGroupId,me?.memberId||me?.displayName].join('|');lastSyncAt43=Date.now();
  if(currentView==='settings')renderSettings();alert('게임 알림을 켰습니다.\n\n편성대기조에 들어가거나 경기가 시작되면 이 기기로 알림이 옵니다.');
 }catch(e){showError(e)}finally{pushBusy43=false;if(currentView==='settings')renderPushCard43()}
};
window.disableGamePush43=async function(){
 if(pushBusy43)return;pushBusy43=true;try{const sub=await subscription43();if(sub){try{await postPush43({action:'unsubscribe',endpoint:sub.endpoint})}catch{}await sub.unsubscribe()}lastSyncKey43='';lastSyncAt43=0;if(currentView==='settings')renderSettings();alert('이 기기의 게임 알림을 껐습니다.')}catch(e){showError(e)}finally{pushBusy43=false;if(currentView==='settings')renderPushCard43()}
};

async function renderPushCard43(){
 const card=$('gamePushCard43');if(!card)return;
 const status=$('gamePushStatus43'),btn=$('gamePushBtn43');if(!status||!btn)return;
 if(!supported43()){status.textContent='이 기기/브라우저는 푸시 알림을 지원하지 않습니다.';btn.disabled=true;btn.textContent='지원하지 않음';return}
 if(ios43()&&!standalone43()){status.textContent='아이폰/아이패드는 홈 화면에 추가한 뒤 콕매치 아이콘으로 실행해야 알림을 켤 수 있습니다.';btn.disabled=false;btn.textContent='홈 화면 추가 후 사용';btn.onclick=()=>alert('Safari 공유 버튼 → 홈 화면에 추가 → 홈 화면의 콕매치 아이콘으로 실행해주세요.');return}
 if(Notification.permission==='denied'){status.textContent='알림 권한이 차단되어 있습니다. 기기 설정의 알림에서 콕매치를 허용해주세요.';btn.disabled=true;btn.textContent='알림 권한 차단됨';return}
 let sub=null;try{sub=Notification.permission==='granted'?await subscription43():null}catch{}
 if(sub){status.textContent='켜짐 · 편성대기 배정과 경기 시작 알림을 이 기기에서 받습니다.';btn.disabled=false;btn.textContent='알림 끄기';btn.onclick=disableGamePush43;syncExisting43(false).catch(()=>{})}
 else{status.textContent=Notification.permission==='granted'?'알림 권한은 허용되어 있습니다. 게임 알림을 연결해주세요.':'꺼짐 · 알림은 기기별로 한 번만 켜면 됩니다.';btn.disabled=false;btn.textContent='게임 알림 켜기';btn.onclick=enableGamePush43}
}
const renderSettingsPrev43=renderSettings;
renderSettings=function(){const r=renderSettingsPrev43();const box=$('settings');if(!box)return r;let card=$('gamePushCard43');if(!card){card=document.createElement('div');card.id='gamePushCard43';card.className='card';card.innerHTML=`<div class="between"><div><b>게임 알림</b><div id="gamePushStatus43" class="meta" style="margin-top:5px;line-height:1.6">상태 확인 중...</div></div><button id="gamePushBtn43" class="btn pri" type="button">게임 알림 켜기</button></div><div class="meta" style="margin-top:8px;line-height:1.6">내가 편성대기조에 들어가면 조 번호를, 경기 시작 시 입장할 코트 번호를 알려줍니다. 알림 설정은 기기별로 적용됩니다.</div>`;const title=box.querySelector('.title');if(title)title.insertAdjacentElement('afterend',card);else box.prepend(card)}if(me?.globalAdmin&&String(me?.displayName||'').trim()==='박태영'){const ver=[...box.querySelectorAll('.card')].find(c=>String(c.textContent||'').includes('프로그램 버전'));if(ver){const meta=ver.querySelector('.meta');if(meta)meta.textContent='콕매치 v4.3 · 편성대기/경기시작 푸시 알림'}}setTimeout(()=>renderPushCard43().catch(()=>{}),0);return r};

async function goPush43(data={}){const view=['queue','playing','members','stats','settings'].includes(String(data.view||''))?String(data.view):'queue';if(!T||!me){pendingPushNav43=data;return}try{if(data.clubId&&String(data.clubId)!==String(currentGroupId)&&typeof switchGroup==='function'){await switchGroup(String(data.clubId));}goView(view)}catch(e){console.error('push navigation v4.3',e);try{goView(view)}catch{}}}
if('serviceWorker'in navigator)navigator.serviceWorker.addEventListener('message',e=>{if(e.data?.type==='KOKMATCH_PUSH_CLICK')goPush43(e.data.data||{view:e.data.view})});
try{const q=new URLSearchParams(location.search),v=q.get('pushView');if(v){pendingPushNav43={view:v};q.delete('pushView');const rest=q.toString();history.replaceState(null,'',location.pathname+(rest?'?'+rest:''))}}catch{}

const loadStatePrev43=loadState;
loadState=async function(...args){const r=await loadStatePrev43(...args);if(T&&me){registerSw43().then(()=>syncExisting43(false)).catch(()=>{});if(pendingPushNav43){const p=pendingPushNav43;pendingPushNav43=null;setTimeout(()=>goPush43(p),30)}}return r};
const logoutPrev43=logout;
logout=async function(...args){try{if(supported43()&&Notification.permission==='granted'){const sub=await subscription43();if(sub&&T)await postPush43({action:'unsubscribe',endpoint:sub.endpoint}).catch(()=>{})}}catch{}lastSyncKey43='';lastSyncAt43=0;return logoutPrev43(...args)};

setTimeout(()=>{registerSw43().then(()=>{if(T&&me)syncExisting43(false).catch(()=>{})}).catch(()=>{})},0);
})();

(()=>{
const CUR43='4.3';let latestUi43=CUR43,refreshUi43=false;
function cmpUi43(a,b){const A=String(a||'0').replace(/^v/i,'').split('.').map(Number),B=String(b||'0').replace(/^v/i,'').split('.').map(Number);for(let i=0;i<Math.max(A.length,B.length);i++){const x=A[i]||0,y=B[i]||0;if(x!==y)return x>y?1:-1}return 0}
function styleUi43(){if($('v43topStyle'))return;const s=document.createElement('style');s.id='v43topStyle';s.textContent='#topActions37,#topActions39,#topActions40,#topActions41,#topActions42{display:none!important}#topActions43{margin-left:auto;display:flex;align-items:center;justify-content:flex-end;gap:4px;position:relative;z-index:70;pointer-events:auto}#currentVersion43{font-size:10px;font-weight:900;padding:6px 5px;border-radius:8px;background:rgba(255,255,255,.18);white-space:nowrap}#headerRefresh43{max-width:170px;min-height:30px;padding:6px 8px;font-size:10.5px;font-weight:800;line-height:1.15;white-space:normal}#logout43{flex:0 0 64px;width:64px;min-width:64px;max-width:64px;min-height:30px;padding:6px 4px;font-size:11px;white-space:nowrap}.toprow>.logout{display:none!important}@media(max-width:380px){#currentVersion43{display:none}#headerRefresh43{max-width:135px;font-size:9.5px}#logout43{flex-basis:56px;width:56px;min-width:56px;max-width:56px;font-size:10px}}';document.head.appendChild(s)}
function updateUi43(){const v=$('currentVersion43'),b=$('headerRefresh43');if(v)v.textContent='v'+CUR43;if(!b)return;const newer=cmpUi43(latestUi43,CUR43)>0;b.textContent=refreshUi43?'불러오는 중…':newer?`v${latestUi43} 업데이트 · 새로고침`:'↻ 새로고침'}
function ensureUi43(){styleUi43();const row=document.querySelector('.toprow');if(!row)return;let a=$('topActions43');if(!a){a=document.createElement('div');a.id='topActions43';a.innerHTML='<span id="currentVersion43">v4.3</span><button id="headerRefresh43" class="btn ghost" type="button">↻ 새로고침</button><button id="logout43" type="button">로그아웃</button>';row.appendChild(a);$('headerRefresh43')?.addEventListener('click',()=>refreshApp43());$('logout43')?.addEventListener('click',()=>logout())}updateUi43()}
async function latestUiCheck43(){try{const r=await fetch('/latest-version.json?t='+Date.now(),{cache:'no-store'});if(r.ok){const x=await r.json();latestUi43=String(x.semanticVersion||x.label||CUR43).replace(/^v/i,'')||CUR43}}catch{}updateUi43();return latestUi43}
window.refreshApp43=async function(target=''){if(refreshUi43)return;refreshUi43=true;updateUi43();try{const v=String(target||await latestUiCheck43()||CUR43).replace(/^v/i,'');location.replace('/?v='+encodeURIComponent(v)+'&refresh='+Date.now())}catch(e){refreshUi43=false;updateUi43();showError(e)}};
window.refreshApp42=window.refreshApp43;window.refreshApp41=window.refreshApp43;window.refreshApp40=window.refreshApp43;window.refreshApp39=window.refreshApp43;window.refreshApp37=window.refreshApp43;
try{sessionStorage.setItem('kokmatch_auto_update_target_v40',CUR43);sessionStorage.setItem('kokmatch_auto_update_target_v39',CUR43)}catch{}
const renderHeaderTopPrev43=renderHeader;renderHeader=function(){const r=renderHeaderTopPrev43();ensureUi43();return r};
setTimeout(()=>{ensureUi43();latestUiCheck43()},0);setInterval(()=>latestUiCheck43(),60000);
})();

/* migrated into v6.0: app-v4.4.js */
(()=>{
const CUR44='4.4';
const PUSH44_API='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-push-v43';
const VAPID44='BJ0MUsN_Hr6yYqSQfQfD734hbwZZjeoc1SmreGE0jDHDRTb0Hn7Eaaib6LWyUWhXmDIOxUj0TU5-gpIYyBeW6vI';
let sw44=null,pushBusy44=false,lastSync44='',lastSyncAt44=0,latest44=CUR44,refreshBusy44=false;

function ios44(){return /iPad|iPhone|iPod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1)}
function standalone44(){return window.matchMedia?.('(display-mode: standalone)')?.matches===true||navigator.standalone===true}
function supported44(){return 'serviceWorker'in navigator&&'PushManager'in window&&'Notification'in window}
function b64u44(s){const p='='.repeat((4-s.length%4)%4),b=(s+p).replace(/-/g,'+').replace(/_/g,'/'),raw=atob(b),out=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);return out}
async function post44(body){const r=await fetch(PUSH44_API,{method:'POST',headers:{'content-type':'application/json',...(T?{authorization:'Bearer '+T}:{})},body:JSON.stringify(body),cache:'no-store'});const x=await r.json().catch(()=>({}));if(!r.ok){const e=new Error(x.error||'게임 알림 처리에 실패했습니다.');e.status=r.status;throw e}return x}
function wait44(ms){return new Promise(r=>setTimeout(r,ms))}
async function activeSw44(force=false){
 if(!supported44())return null;
 if(sw44?.active&&!force)return sw44;
 const initial=await navigator.serviceWorker.register('/kokmatch-sw.js?v=4.4',{scope:'/'});
 try{await initial.update()}catch{}
 const ready=await Promise.race([navigator.serviceWorker.ready,new Promise((_,rej)=>setTimeout(()=>rej(new Error('서비스워커 활성화 시간이 초과되었습니다. 앱을 완전히 종료한 뒤 다시 실행해주세요.')),10000))]);
 if(!ready?.active)throw new Error('서비스워커가 아직 활성화되지 않았습니다. 앱을 완전히 종료한 뒤 다시 실행해주세요.');
 sw44=ready;
 return ready;
}
async function sub44(){const reg=await activeSw44();if(!reg?.active)return null;try{return await reg.pushManager.getSubscription()}catch(e){await wait44(250);const ready=await navigator.serviceWorker.ready;sw44=ready;return await ready.pushManager.getSubscription()}}
function subJson44(sub){const j=sub.toJSON();return{endpoint:j.endpoint,keys:{p256dh:j.keys?.p256dh||'',auth:j.keys?.auth||''}}}
async function sync44(force=false){
 if(!T||!me||!currentGroupId||!supported44()||Notification.permission!=='granted')return false;
 const sub=await sub44();if(!sub)return false;
 const key=[sub.endpoint,currentGroupId,me.memberId||me.displayName].join('|');if(!force&&key===lastSync44&&Date.now()-lastSyncAt44<600000)return true;
 await post44({action:'subscribe',groupId:currentGroupId,subscription:subJson44(sub),userAgent:navigator.userAgent});lastSync44=key;lastSyncAt44=Date.now();return true;
}
function closePopup44(){document.getElementById('gamePushPopup44')?.remove()}
async function goPush44(data={}){const view=['queue','playing','members','stats','settings'].includes(String(data.view||''))?String(data.view):'queue';try{if(data.clubId&&String(data.clubId)!==String(currentGroupId)&&typeof switchGroup==='function')await switchGroup(String(data.clubId));goView(view)}catch{try{goView(view)}catch{}}}
function popup44(payload={}){
 if(document.visibilityState!=='visible')return;
 closePopup44();
 const box=document.createElement('div');box.id='gamePushPopup44';box.style.cssText='position:fixed;left:14px;right:14px;top:max(14px,env(safe-area-inset-top));z-index:100000;background:#fff;color:#111;border-radius:18px;box-shadow:0 12px 38px rgba(0,0,0,.28);padding:16px;border:2px solid #2453d4;animation:push44in .18s ease-out';
 box.innerHTML=`<div style="display:flex;gap:10px;align-items:flex-start"><div style="font-size:26px">🏸</div><div style="flex:1;min-width:0"><b style="font-size:17px;display:block;margin-bottom:5px">${esc(payload.title||'콕매치 게임 알림')}</b><div style="font-size:15px;line-height:1.5">${esc(payload.body||'게임 알림이 도착했습니다.')}</div></div></div><div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px"><button id="pushClose44" class="btn ghost" type="button">확인</button><button id="pushGo44" class="btn pri" type="button">바로가기</button></div>`;
 if(!document.getElementById('push44style')){const s=document.createElement('style');s.id='push44style';s.textContent='@keyframes push44in{from{transform:translateY(-20px);opacity:.2}to{transform:none;opacity:1}}';document.head.appendChild(s)}
 document.body.appendChild(box);box.querySelector('#pushClose44')?.addEventListener('click',closePopup44);box.querySelector('#pushGo44')?.addEventListener('click',()=>{const d=payload.data||{};closePopup44();goPush44(d)});try{navigator.vibrate?.([120,70,120])}catch{};setTimeout(()=>{if(document.getElementById('gamePushPopup44')===box)closePopup44()},12000)
}
window.enableGamePush44=async function(){
 if(pushBusy44)return;if(!supported44())return alert('이 기기/브라우저에서는 게임 알림을 지원하지 않습니다.');
 if(ios44()&&!standalone44())return alert('아이폰/아이패드는 Safari에서 홈 화면에 추가한 뒤, 홈 화면의 콕매치 아이콘으로 실행해야 게임 알림을 켤 수 있습니다.');
 pushBusy44=true;try{
  const permission=Notification.permission==='granted'?'granted':await Notification.requestPermission();if(permission!=='granted')throw new Error('알림 권한이 허용되지 않았습니다. 기기 설정에서 콕매치 알림을 허용해주세요.');
  const reg=await activeSw44(true);let sub=await reg.pushManager.getSubscription();if(!sub){try{sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64u44(VAPID44)})}catch(e){await wait44(300);const ready=await navigator.serviceWorker.ready;sw44=ready;sub=await ready.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64u44(VAPID44)})}}
  await post44({action:'subscribe',groupId:currentGroupId,subscription:subJson44(sub),userAgent:navigator.userAgent});lastSync44=[sub.endpoint,currentGroupId,me?.memberId||me?.displayName].join('|');lastSyncAt44=Date.now();
  let tested=false;try{await post44({action:'test',groupId:currentGroupId,endpoint:sub.endpoint});tested=true}catch(e){console.warn('push test v4.4',e)}
  if(currentView==='settings')renderSettings();if(!tested)alert('게임 알림 연결은 완료됐지만 테스트 알림 전송 확인에 실패했습니다. 실제 편성 알림이 오지 않으면 기기 알림 설정을 확인해주세요.');
 }catch(e){showError(e)}finally{pushBusy44=false;setTimeout(()=>renderPushCard44().catch(()=>{}),30)}
};
window.disableGamePush44=async function(){if(pushBusy44)return;pushBusy44=true;try{const sub=await sub44();if(sub){try{await post44({action:'unsubscribe',endpoint:sub.endpoint})}catch{}await sub.unsubscribe()}lastSync44='';lastSyncAt44=0;if(currentView==='settings')renderSettings();alert('이 기기의 게임 알림을 껐습니다.')}catch(e){showError(e)}finally{pushBusy44=false;setTimeout(()=>renderPushCard44().catch(()=>{}),30)}};
window.enableGamePush43=window.enableGamePush44;window.disableGamePush43=window.disableGamePush44;

async function renderPushCard44(){
 const card=$('gamePushCard43');if(!card)return;const status=$('gamePushStatus43'),btn=$('gamePushBtn43');if(!status||!btn)return;
 if(!supported44()){status.textContent='이 기기/브라우저는 푸시 알림을 지원하지 않습니다.';btn.disabled=true;btn.textContent='지원하지 않음';return}
 if(ios44()&&!standalone44()){status.textContent='아이폰/아이패드는 홈 화면의 콕매치 앱으로 실행해야 알림을 받을 수 있습니다.';btn.disabled=false;btn.textContent='홈 화면 추가 안내';btn.onclick=()=>alert('Safari 공유 버튼 → 홈 화면에 추가 → 홈 화면의 콕매치 아이콘으로 실행해주세요.');return}
 if(Notification.permission==='denied'){status.textContent='알림 권한이 차단되어 있습니다. iPhone/갤럭시 설정에서 콕매치 알림을 허용해주세요.';btn.disabled=true;btn.textContent='알림 권한 차단됨';return}
 let sub=null;try{sub=Notification.permission==='granted'?await sub44():null}catch(e){console.warn('push status v4.4',e)}
 if(sub){status.textContent='켜짐 · 앱 사용 중에는 내부 팝업+시스템 알림, 백그라운드에서는 시스템 푸시 알림을 받습니다.';btn.disabled=false;btn.textContent='알림 끄기';btn.onclick=window.disableGamePush44;sync44(false).catch(()=>{})}
 else{status.textContent=Notification.permission==='granted'?'알림 권한은 허용됐지만 기기 연결이 필요합니다. 아래 버튼을 다시 눌러 연결해주세요.':'꺼짐 · 이 기기에서 게임 알림을 켜주세요.';btn.disabled=false;btn.textContent='게임 알림 켜기';btn.onclick=window.enableGamePush44}
}
window.renderPushCard44=renderPushCard44;
const renderSettingsPrev44=renderSettings;
renderSettings=function(){const r=renderSettingsPrev44();const box=$('settings');if(box){const ver=[...box.querySelectorAll('.card')].find(c=>String(c.textContent||'').includes('프로그램 버전'));if(ver&&me?.globalAdmin&&String(me?.displayName||'').trim()==='박태영'){const m=ver.querySelector('.meta');if(m)m.textContent='콕매치 v4.4 · iOS 푸시 안정화 · 전경 팝업 알림'}setTimeout(()=>renderPushCard44().catch(()=>{}),40)}return r};

if('serviceWorker'in navigator)navigator.serviceWorker.addEventListener('message',e=>{if(e.data?.type==='KOKMATCH_PUSH_RECEIVED')popup44(e.data.payload||{});else if(e.data?.type==='KOKMATCH_PUSH_CLICK')goPush44(e.data.data||{view:e.data.view})});
const loadStatePrev44=loadState;loadState=async function(...args){const r=await loadStatePrev44(...args);if(T&&me&&Notification.permission==='granted')activeSw44().then(()=>sync44(false)).catch(()=>{});return r};
const logoutPrev44=logout;logout=async function(...args){try{if(supported44()&&Notification.permission==='granted'){const sub=await sub44();if(sub&&T)await post44({action:'unsubscribe',endpoint:sub.endpoint}).catch(()=>{})}}catch{}lastSync44='';lastSyncAt44=0;return logoutPrev44(...args)};

function cmp44(a,b){const A=String(a||'0').replace(/^v/i,'').split('.').map(Number),B=String(b||'0').replace(/^v/i,'').split('.').map(Number);for(let i=0;i<Math.max(A.length,B.length);i++){const x=A[i]||0,y=B[i]||0;if(x!==y)return x>y?1:-1}return 0}
function styleTop44(){if($('v44topStyle'))return;const s=document.createElement('style');s.id='v44topStyle';s.textContent='#topActions37,#topActions39,#topActions40,#topActions41,#topActions42,#topActions43{display:none!important}#topActions44{margin-left:auto;display:flex;align-items:center;justify-content:flex-end;gap:4px;position:relative;z-index:80;pointer-events:auto}#currentVersion44{font-size:10px;font-weight:900;padding:6px 5px;border-radius:8px;background:rgba(255,255,255,.18);white-space:nowrap}#headerRefresh44{max-width:170px;min-height:30px;padding:6px 8px;font-size:10.5px;font-weight:800;line-height:1.15;white-space:normal}#logout44{flex:0 0 64px;width:64px;min-width:64px;max-width:64px;min-height:30px;padding:6px 4px;font-size:11px;white-space:nowrap}.toprow>.logout{display:none!important}@media(max-width:380px){#currentVersion44{display:none}#headerRefresh44{max-width:135px;font-size:9.5px}#logout44{flex-basis:56px;width:56px;min-width:56px;max-width:56px;font-size:10px}}';document.head.appendChild(s)}
function updateTop44(){const v=$('currentVersion44'),b=$('headerRefresh44');if(v)v.textContent='v'+CUR44;if(!b)return;const newer=cmp44(latest44,CUR44)>0;b.textContent=refreshBusy44?'불러오는 중…':newer?`v${latest44} 업데이트 · 새로고침`:'↻ 새로고침'}
function ensureTop44(){styleTop44();const row=document.querySelector('.toprow');if(!row)return;let a=$('topActions44');if(!a){a=document.createElement('div');a.id='topActions44';a.innerHTML='<span id="currentVersion44">v4.4</span><button id="headerRefresh44" class="btn ghost" type="button">↻ 새로고침</button><button id="logout44" type="button">로그아웃</button>';row.appendChild(a);$('headerRefresh44')?.addEventListener('click',()=>refreshApp44());$('logout44')?.addEventListener('click',()=>logout())}updateTop44()}
async function latestCheck44(){try{const r=await fetch('/latest-version.json?t='+Date.now(),{cache:'no-store'});if(r.ok){const x=await r.json();latest44=String(x.semanticVersion||x.label||CUR44).replace(/^v/i,'')||CUR44}}catch{}updateTop44();return latest44}
window.refreshApp44=async function(target=''){if(refreshBusy44)return;refreshBusy44=true;updateTop44();try{const v=String(target||await latestCheck44()||CUR44).replace(/^v/i,'');location.replace('/?v='+encodeURIComponent(v)+'&refresh='+Date.now())}catch(e){refreshBusy44=false;updateTop44();showError(e)}};
window.refreshApp43=window.refreshApp44;window.refreshApp42=window.refreshApp44;window.refreshApp41=window.refreshApp44;window.refreshApp40=window.refreshApp44;window.refreshApp39=window.refreshApp44;window.refreshApp37=window.refreshApp44;
const renderHeaderPrev44=renderHeader;renderHeader=function(){const r=renderHeaderPrev44();ensureTop44();return r};
setTimeout(()=>{ensureTop44();latestCheck44();activeSw44().then(()=>{if(T&&me)sync44(false).catch(()=>{})}).catch(()=>{})},0);setInterval(()=>latestCheck44(),60000);
})();

/* migrated into v6.0: app-v4.5.js */
(()=>{
const CUR45='4.5';
try{sessionStorage.setItem('kokmatch_auto_update_target_v39',CUR45);sessionStorage.setItem('kokmatch_auto_update_target_v40',CUR45)}catch{}
let latest45=CUR45,refreshBusy45=false;
function cmp45(a,b){const A=String(a||'0').replace(/^v/i,'').split('.').map(Number),B=String(b||'0').replace(/^v/i,'').split('.').map(Number);for(let i=0;i<Math.max(A.length,B.length);i++){const x=A[i]||0,y=B[i]||0;if(x!==y)return x>y?1:-1}return 0}
function updateTop45(){const v=document.getElementById('currentVersion45'),b=document.getElementById('headerRefresh45');if(v)v.textContent='v'+CUR45;if(!b)return;const newer=cmp45(latest45,CUR45)>0;b.textContent=refreshBusy45?'불러오는 중…':newer?`v${latest45} 업데이트 · 새로고침`:'↻ 새로고침'}
function ensureTop45(){const row=document.querySelector('.toprow');if(!row)return;document.querySelectorAll('#topActions37,#topActions39,#topActions40,#topActions41,#topActions42,#topActions43,#topActions44').forEach(x=>x.style.setProperty('display','none','important'));let a=document.getElementById('topActions45');if(!a){a=document.createElement('div');a.id='topActions45';a.style.cssText='margin-left:auto;display:flex;align-items:center;justify-content:flex-end;gap:4px;position:relative;z-index:90;pointer-events:auto';a.innerHTML='<span id="currentVersion45" style="font-size:10px;font-weight:900;padding:6px 5px;border-radius:8px;background:rgba(255,255,255,.18);white-space:nowrap">v4.5</span><button id="headerRefresh45" class="btn ghost" type="button" style="max-width:170px;min-height:30px;padding:6px 8px;font-size:10.5px;font-weight:800;line-height:1.15;white-space:normal">↻ 새로고침</button><button id="logout45" type="button" style="flex:0 0 64px;width:64px;min-width:64px;max-width:64px;min-height:30px;padding:6px 4px;font-size:11px;white-space:nowrap">로그아웃</button>';row.appendChild(a);a.querySelector('#headerRefresh45')?.addEventListener('click',()=>refreshApp45());a.querySelector('#logout45')?.addEventListener('click',()=>logout())}updateTop45()}
function markLegacyDone45(v){try{sessionStorage.setItem('kokmatch_auto_update_target_v39',v);sessionStorage.setItem('kokmatch_auto_update_target_v40',v)}catch{}}
async function latestCheck45(){try{const r=await fetch('/latest-version.json?t='+Date.now(),{cache:'no-store'});if(r.ok){const x=await r.json();latest45=String(x.semanticVersion||x.label||CUR45).replace(/^v/i,'')||CUR45;markLegacyDone45(latest45)}}catch{}updateTop45();return latest45}
window.refreshApp45=async function(target=''){if(refreshBusy45)return;refreshBusy45=true;updateTop45();try{const v=String(target||await latestCheck45()||CUR45).replace(/^v/i,'');markLegacyDone45(v);location.replace('/?v='+encodeURIComponent(v)+'&refresh='+Date.now())}catch(e){refreshBusy45=false;updateTop45();showError(e)}};
window.refreshApp44=window.refreshApp45;window.refreshApp43=window.refreshApp45;window.refreshApp42=window.refreshApp45;window.refreshApp41=window.refreshApp45;window.refreshApp40=window.refreshApp45;window.refreshApp39=window.refreshApp45;window.refreshApp37=window.refreshApp45;
const renderHeaderPrev45=renderHeader;renderHeader=function(){const r=renderHeaderPrev45();ensureTop45();return r};
setTimeout(()=>{ensureTop45();latestCheck45()},0);setInterval(()=>latestCheck45(),60000);
})();

/* migrated into v6.0: app-v4.6.js */
(()=>{
const CUR46='4.6';
let latest46=CUR46,refreshBusy46=false;
let memberForce46=true,memberRendering46=false,lastMemberSig46='',memberDeferred46=0,lastMemberScroll46=0;

function markLegacy46(v=CUR46){try{sessionStorage.setItem('kokmatch_auto_update_target_v39',v);sessionStorage.setItem('kokmatch_auto_update_target_v40',v)}catch{}}
markLegacy46(CUR46);

function cmp46(a,b){const A=String(a||'0').replace(/^v/i,'').split('.').map(n=>Number(n)||0),B=String(b||'0').replace(/^v/i,'').split('.').map(n=>Number(n)||0);for(let i=0;i<Math.max(A.length,B.length);i++){const x=A[i]||0,y=B[i]||0;if(x!==y)return x>y?1:-1}return 0}
function styleTop46(){if(document.getElementById('v46topStyle'))return;const s=document.createElement('style');s.id='v46topStyle';s.textContent=`
#topActions37,#topActions39,#topActions40,#topActions41,#topActions42,#topActions43,#topActions44,#topActions45{display:none!important}
#topActions46{margin-left:auto;display:flex;align-items:center;justify-content:flex-end;gap:4px;position:relative;z-index:100;pointer-events:auto;min-width:0}
#currentVersion46top{font-size:10px;font-weight:900;padding:6px 5px;border-radius:8px;background:rgba(255,255,255,.18);white-space:nowrap;flex:0 0 auto}
#headerRefresh46{flex:0 1 auto;min-width:0;max-width:170px;min-height:30px;padding:6px 8px;font-size:10.5px;font-weight:800;line-height:1.15;white-space:normal;overflow-wrap:anywhere}
#logout46top{flex:0 0 64px;width:64px;min-width:64px;max-width:64px;min-height:30px;padding:6px 4px;font-size:11px;white-space:nowrap}
.toprow>.logout{display:none!important}
@media(max-width:380px){#currentVersion46top{display:none}#headerRefresh46{max-width:135px;font-size:9.5px}#logout46top{flex-basis:56px;width:56px;min-width:56px;max-width:56px;font-size:10px}}
`;document.head.appendChild(s)}
function updateTop46(){const v=document.getElementById('currentVersion46top'),b=document.getElementById('headerRefresh46');if(v)v.textContent='v'+CUR46;if(!b)return;const newer=cmp46(latest46,CUR46)>0;b.textContent=refreshBusy46?'불러오는 중…':newer?`v${latest46} 업데이트 · 새로고침`:'↻ 새로고침';b.title=newer?`최신버전 v${latest46}이 있습니다. 눌러서 업데이트하세요.`:'현재 페이지를 안전하게 다시 불러옵니다.'}
function ensureTop46(){styleTop46();const row=document.querySelector('.toprow');if(!row)return;let a=document.getElementById('topActions46');if(!a){a=document.createElement('div');a.id='topActions46';a.innerHTML='<span id="currentVersion46top">v4.6</span><button id="headerRefresh46" class="btn ghost" type="button">↻ 새로고침</button><button id="logout46top" type="button">로그아웃</button>';row.appendChild(a);a.querySelector('#headerRefresh46')?.addEventListener('click',()=>refreshApp46());a.querySelector('#logout46top')?.addEventListener('click',()=>logout())}updateTop46()}
async function latestCheck46(){try{const r=await fetch('/latest-version.json?t='+Date.now(),{cache:'no-store'});if(r.ok){const x=await r.json();latest46=String(x.semanticVersion||x.label||CUR46).replace(/^v/i,'')||CUR46;markLegacy46(latest46)}}catch{}updateTop46();return latest46}
window.refreshApp46=async function(target=''){if(refreshBusy46)return;refreshBusy46=true;updateTop46();try{const v=String(target||await latestCheck46()||CUR46).replace(/^v/i,'');markLegacy46(v);try{if(typeof saveRefreshState==='function')saveRefreshState()}catch{}location.replace('/?v='+encodeURIComponent(v)+'&refresh='+Date.now())}catch(e){refreshBusy46=false;updateTop46();if(typeof showError==='function')showError(e);else alert(e?.message||'새로고침에 실패했습니다.')}};
window.refreshApp45=window.refreshApp46;window.refreshApp44=window.refreshApp46;window.refreshApp43=window.refreshApp46;window.refreshApp42=window.refreshApp46;window.refreshApp41=window.refreshApp46;window.refreshApp40=window.refreshApp46;window.refreshApp39=window.refreshApp46;window.refreshApp37=window.refreshApp46;

function memberSig46(){try{return JSON.stringify([currentGroupId,me?.role,me?.globalAdmin,(S?.members||[]).map(m=>[m.id,m.name,m.year,m.gender,m.cls,m.type,m.role,m.state,m.totalGames,m.joinedAt,m.inviter,m.tempOrganizerDay]),S?.queue||[],(S?.pendingGames||[]).map(g=>[g.id,g.players]),(S?.games||[]).map(g=>[g.id,g.court,g.players]),(S?.history||[]).length])}catch{return String(Date.now())}}
function memberIsMoving46(){return currentView==='members'&&Date.now()-lastMemberScroll46<160}
window.addEventListener('scroll',()=>{if(currentView==='members')lastMemberScroll46=Date.now()},{passive:true});
document.addEventListener('touchmove',()=>{if(currentView==='members')lastMemberScroll46=Date.now()},{passive:true,capture:true});
const renderMembersPrev46Safe=renderMembers;
renderMembers=function(){if(memberRendering46)return;const box=typeof $==='function'?$('members'):null,sig=memberSig46(),has=!!box?.children?.length,force=memberForce46;memberForce46=false;if(!force&&has&&sig===lastMemberSig46)return;if(has&&memberIsMoving46()){clearTimeout(memberDeferred46);memberDeferred46=setTimeout(()=>{memberForce46=true;renderMembers()},190);return}memberRendering46=true;try{renderMembersPrev46Safe();lastMemberSig46=sig}finally{memberRendering46=false}};
function forceMember46(){memberForce46=true;lastMemberSig46=''}
if(typeof window.memberPageGo46==='function'){const f=window.memberPageGo46;window.memberPageGo46=function(...a){forceMember46();return f.apply(this,a)}}
if(typeof window.searchMembers46==='function'){const f=window.searchMembers46;window.searchMembers46=function(...a){forceMember46();return f.apply(this,a)}}
if(typeof window.refreshMembers46==='function'){const f=window.refreshMembers46;window.refreshMembers46=function(...a){forceMember46();return f.apply(this,a)}}

const renderHeaderPrev46Safe=renderHeader;
renderHeader=function(){const r=renderHeaderPrev46Safe();ensureTop46();return r};
const goViewPrev46Safe=goView;
goView=function(id){if(String(id)==='members'&&currentView!=='members')forceMember46();return goViewPrev46Safe(id)};

setTimeout(()=>{markLegacy46(CUR46);ensureTop46();latestCheck46().catch(()=>{})},0);
setInterval(()=>latestCheck46().catch(()=>{}),60000);
})();

/* migrated into v6.0: app-v4.7.js */
(()=>{
const CUR47='4.7';let latest47=CUR47,refreshBusy47=false;
function cmp47(a,b){const A=String(a||'0').replace(/^v/i,'').split('.').map(n=>Number(n)||0),B=String(b||'0').replace(/^v/i,'').split('.').map(n=>Number(n)||0);for(let i=0;i<Math.max(A.length,B.length);i++){const x=A[i]||0,y=B[i]||0;if(x!==y)return x>y?1:-1}return 0}
function style47(){if(document.getElementById('v47topStyle'))return;const s=document.createElement('style');s.id='v47topStyle';s.textContent=`#topActions37,#topActions39,#topActions40,#topActions41,#topActions42,#topActions43,#topActions44,#topActions45,#topActions46{display:none!important}#topActions47{margin-left:auto;display:flex;align-items:center;justify-content:flex-end;gap:4px;position:relative;z-index:110;pointer-events:auto;min-width:0}#currentVersion47{font-size:10px;font-weight:900;padding:6px 5px;border-radius:8px;background:rgba(255,255,255,.18);white-space:nowrap;flex:0 0 auto}#headerRefresh47{flex:0 1 auto;min-width:0;max-width:170px;min-height:30px;padding:6px 8px;font-size:10.5px;font-weight:800;line-height:1.15;white-space:normal;overflow-wrap:anywhere}#logout47{flex:0 0 64px;width:64px;min-width:64px;max-width:64px;min-height:30px;padding:6px 4px;font-size:11px;white-space:nowrap}.toprow>.logout{display:none!important}@media(max-width:380px){#currentVersion47{display:none}#headerRefresh47{max-width:135px;font-size:9.5px}#logout47{flex-basis:56px;width:56px;min-width:56px;max-width:56px;font-size:10px}}`;document.head.appendChild(s)}
function update47(){const v=document.getElementById('currentVersion47'),b=document.getElementById('headerRefresh47');if(v)v.textContent='v'+CUR47;if(!b)return;const newer=cmp47(latest47,CUR47)>0;b.textContent=refreshBusy47?'불러오는 중…':newer?`v${latest47} 업데이트 · 새로고침`:'↻ 새로고침';b.title=newer?`최신버전 v${latest47}이 있습니다. 눌러서 업데이트하세요.`:'현재 페이지를 다시 불러옵니다.'}
function ensure47(){style47();const row=document.querySelector('.toprow');if(!row)return;let a=document.getElementById('topActions47');if(!a){a=document.createElement('div');a.id='topActions47';a.innerHTML='<span id="currentVersion47">v4.7</span><button id="headerRefresh47" class="btn ghost" type="button">↻ 새로고침</button><button id="logout47" type="button">로그아웃</button>';row.appendChild(a);a.querySelector('#headerRefresh47')?.addEventListener('click',()=>refreshApp47());a.querySelector('#logout47')?.addEventListener('click',()=>logout())}update47()}
async function latestCheck47(){try{const r=await fetch('/latest-version.json?t='+Date.now(),{cache:'no-store'});if(r.ok){const x=await r.json();latest47=String(x.semanticVersion||x.label||CUR47).replace(/^v/i,'')||CUR47}}catch{}update47();return latest47}
window.refreshApp47=async function(target=''){if(refreshBusy47)return;refreshBusy47=true;update47();try{const v=String(target||await latestCheck47()||CUR47).replace(/^v/i,'');try{if(typeof saveRefreshState==='function')saveRefreshState()}catch{}location.replace('/?v='+encodeURIComponent(v)+'&refresh='+Date.now())}catch(e){refreshBusy47=false;update47();if(typeof showError==='function')showError(e);else alert(e?.message||'새로고침에 실패했습니다.')}};
window.refreshApp46=window.refreshApp47;window.refreshApp45=window.refreshApp47;window.refreshApp44=window.refreshApp47;window.refreshApp43=window.refreshApp47;window.refreshApp42=window.refreshApp47;window.refreshApp41=window.refreshApp47;window.refreshApp40=window.refreshApp47;window.refreshApp39=window.refreshApp47;window.refreshApp37=window.refreshApp47;
const renderHeaderPrev47=renderHeader;renderHeader=function(){const r=renderHeaderPrev47();ensure47();return r};
const renderSettingsPrev47=renderSettings;renderSettings=function(){const r=renderSettingsPrev47();const box=typeof $==='function'?$('settings'):null;if(box&&me?.globalAdmin===true&&String(me?.displayName||'').trim()==='박태영'){const card=[...box.querySelectorAll('.card')].find(c=>String(c.textContent||'').includes('프로그램 버전'));if(card){const m=card.querySelector('.meta');if(m)m.textContent='콕매치 v4.7 · 회원명부 경량조회 · 모바일 로딩 안정화'}}return r};
setTimeout(()=>{ensure47();latestCheck47()},0);setInterval(()=>latestCheck47(),60000);
})();

/* migrated into v6.0: app-v4.8.js */
(()=>{
const CUR48='4.8';
const PUSH48_API='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-push-v43';
const VAPID48='BJ0MUsN_Hr6yYqSQfQfD734hbwZZjeoc1SmreGE0jDHDRTb0Hn7Eaaib6LWyUWhXmDIOxUj0TU5-gpIYyBeW6vI';
let pushBusy48=false,lastSync48='',lastSyncAt48=0,swReady48=null,latest48=CUR48,refreshBusy48=false;

function ios48(){return /iPad|iPhone|iPod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1)}
function standalone48(){return window.matchMedia?.('(display-mode: standalone)')?.matches===true||navigator.standalone===true}
function declarative48(){return !!(window.pushManager&&typeof window.pushManager.subscribe==='function'&&typeof window.pushManager.getSubscription==='function')}
function supported48(){return 'Notification'in window&&(declarative48()||('serviceWorker'in navigator&&'PushManager'in window))}
function b64u48(s){const p='='.repeat((4-s.length%4)%4),b=(s+p).replace(/-/g,'+').replace(/_/g,'/'),raw=atob(b),out=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);return out}
function wait48(ms){return new Promise(r=>setTimeout(r,ms))}
async function post48(body){const r=await fetch(PUSH48_API,{method:'POST',headers:{'content-type':'application/json',...(T?{authorization:'Bearer '+T}:{})},body:JSON.stringify(body),cache:'no-store'});const x=await r.json().catch(()=>({}));if(!r.ok)throw new Error(x.error||'게임 알림 처리에 실패했습니다.');return x}
function subJson48(sub){const j=sub.toJSON();return{endpoint:j.endpoint,keys:{p256dh:j.keys?.p256dh||'',auth:j.keys?.auth||''}}}

async function waitActive48(reg,timeout=12000){
 if(reg?.active)return reg;
 const waiting=reg?.waiting;if(waiting){try{waiting.postMessage({type:'SKIP_WAITING'})}catch{}}
 const worker=reg?.installing||reg?.waiting;
 const started=Date.now();
 while(Date.now()-started<timeout){if(reg?.active)return reg;if(worker?.state==='activated')break;await wait48(120)}
 try{const fresh=await navigator.serviceWorker.getRegistration('/');if(fresh?.active)return fresh}catch{}
 return reg?.active?reg:null;
}
async function ensureSw48(){
 if(!('serviceWorker'in navigator))throw new Error('이 기기는 서비스워커를 지원하지 않습니다.');
 if(swReady48?.active)return swReady48;
 let reg=null;try{reg=await navigator.serviceWorker.getRegistration('/')}catch{}
 try{reg=await navigator.serviceWorker.register('/kokmatch-sw.js',{scope:'/',updateViaCache:'none'})}catch(e){if(!reg)throw e}
 try{await reg.update()}catch{}
 reg=await waitActive48(reg,8000)||reg;
 if(!reg?.active){try{const ready=await Promise.race([navigator.serviceWorker.ready,new Promise(r=>setTimeout(()=>r(null),5000))]);if(ready?.active)reg=ready}catch{}}
 if(!reg?.active)throw new Error('이 iPhone의 서비스워커가 활성화되지 않았습니다. iOS를 최신 버전으로 업데이트하거나 홈 화면의 콕매치를 다시 추가해주세요.');
 swReady48=reg;return reg;
}
async function manager48(){if(ios48()&&declarative48())return{manager:window.pushManager,mode:'ios-direct'};const reg=await ensureSw48();return{manager:reg.pushManager,mode:'service-worker'}}
async function subscription48(){const x=await manager48();return{...x,subscription:await x.manager.getSubscription()}}
async function sync48(force=false){
 if(!T||!me||!currentGroupId||!supported48()||Notification.permission!=='granted')return false;
 const x=await subscription48();if(!x.subscription)return false;
 const key=[x.subscription.endpoint,currentGroupId,me.memberId||me.displayName].join('|');if(!force&&key===lastSync48&&Date.now()-lastSyncAt48<600000)return true;
 await post48({action:'subscribe',groupId:currentGroupId,subscription:subJson48(x.subscription),userAgent:navigator.userAgent,pushMode:x.mode});lastSync48=key;lastSyncAt48=Date.now();return true;
}

window.enableGamePush48=async function(){
 if(pushBusy48)return;if(!supported48())return alert('이 기기/브라우저에서는 게임 알림을 지원하지 않습니다.');
 if(ios48()&&!standalone48())return alert('아이폰/아이패드는 홈 화면에 추가한 콕매치 앱에서만 게임 알림을 켤 수 있습니다. Safari 공유 → 홈 화면에 추가 후 홈 화면 아이콘으로 실행해주세요.');
 pushBusy48=true;
 try{
  const permission=Notification.permission==='granted'?'granted':await Notification.requestPermission();
  if(permission!=='granted')throw new Error('알림 권한이 허용되지 않았습니다. iPhone 설정 → 알림 → 콕매치에서 알림을 허용해주세요.');
  const x=await manager48();let sub=await x.manager.getSubscription();if(!sub)sub=await x.manager.subscribe({userVisibleOnly:true,applicationServerKey:b64u48(VAPID48)});
  await post48({action:'subscribe',groupId:currentGroupId,subscription:subJson48(sub),userAgent:navigator.userAgent,pushMode:x.mode});lastSync48=[sub.endpoint,currentGroupId,me?.memberId||me?.displayName].join('|');lastSyncAt48=Date.now();
  await post48({action:'test',groupId:currentGroupId,endpoint:sub.endpoint});
  if(ios48()&&declarative48())ensureSw48().catch(()=>{});
  alert('게임 알림을 켰습니다.\n\n잠시 후 “게임 알림 설정이 완료되었습니다.” 테스트 알림이 오면 정상입니다.');
 }catch(e){if(typeof showError==='function')showError(e);else alert(e?.message||'게임 알림을 켜지 못했습니다.')}
 finally{pushBusy48=false;setTimeout(()=>window.renderPushCard48().catch(()=>{}),30)}
};
window.disableGamePush48=async function(){
 if(pushBusy48)return;pushBusy48=true;
 try{const x=await subscription48();if(x.subscription){try{await post48({action:'unsubscribe',endpoint:x.subscription.endpoint})}catch{}await x.subscription.unsubscribe()}lastSync48='';lastSyncAt48=0;alert('이 기기의 게임 알림을 껐습니다.')}
 catch(e){if(typeof showError==='function')showError(e);else alert(e?.message||'게임 알림을 끄지 못했습니다.')}
 finally{pushBusy48=false;setTimeout(()=>window.renderPushCard48().catch(()=>{}),30)}
};
window.enableGamePush44=window.enableGamePush48;window.enableGamePush43=window.enableGamePush48;window.disableGamePush44=window.disableGamePush48;window.disableGamePush43=window.disableGamePush48;

function ensurePushCard48(){
 const box=typeof $==='function'?$('settings'):null;if(!box)return null;document.getElementById('gamePushCard43')?.remove();
 let card=document.getElementById('gamePushCard48');if(card)return card;card=document.createElement('div');card.id='gamePushCard48';card.className='card';
 card.innerHTML='<div class="between"><div style="min-width:0;flex:1"><b>게임 알림</b><div id="gamePushStatus48" class="meta" style="margin-top:5px;line-height:1.6">상태 확인 중...</div></div><button id="gamePushBtn48" class="btn pri" type="button">게임 알림 켜기</button></div><div class="meta" style="margin-top:8px;line-height:1.6">편성대기조 배정과 경기 시작 시 조 번호와 코트 번호를 알립니다. iPhone은 최신 iOS에서 서비스워커 없이도 직접 푸시 구독을 사용합니다.</div>';
 const title=box.querySelector('.title');if(title)title.insertAdjacentElement('afterend',card);else box.prepend(card);return card;
}
window.renderPushCard48=async function(){
 const card=ensurePushCard48();if(!card)return;const status=document.getElementById('gamePushStatus48'),btn=document.getElementById('gamePushBtn48');if(!status||!btn)return;btn.disabled=false;
 if(!supported48()){status.textContent='이 기기/브라우저는 푸시 알림을 지원하지 않습니다.';btn.disabled=true;btn.textContent='지원하지 않음';return}
 if(ios48()&&!standalone48()){status.textContent='아이폰은 홈 화면에 추가한 콕매치 앱으로 실행해야 알림을 받을 수 있습니다.';btn.textContent='홈 화면 추가 안내';btn.onclick=()=>alert('Safari 공유 버튼 → 홈 화면에 추가 → 홈 화면의 콕매치 아이콘으로 실행해주세요.');return}
 if(Notification.permission==='denied'){status.textContent='알림 권한이 차단되어 있습니다. iPhone 설정 → 알림 → 콕매치에서 허용해주세요.';btn.disabled=true;btn.textContent='알림 권한 차단됨';return}
 try{const x=Notification.permission==='granted'?await subscription48():null;if(x?.subscription){status.textContent=x.mode==='ios-direct'?'켜짐 · iPhone 직접 푸시 연결됨':'켜짐 · 게임 푸시 연결됨';btn.textContent='알림 끄기';btn.onclick=window.disableGamePush48;sync48(false).catch(()=>{});return}}catch(e){console.warn('push status v4.8',e)}
 status.textContent=Notification.permission==='granted'?'알림 권한은 허용되어 있습니다. 아래 버튼을 눌러 게임 알림을 연결해주세요.':'꺼짐 · 이 기기에서 게임 알림을 켜주세요.';btn.textContent='게임 알림 켜기';btn.onclick=window.enableGamePush48;
};

const renderSettingsPrev48=renderSettings;
renderSettings=function(){const r=renderSettingsPrev48();ensurePushCard48();const box=typeof $==='function'?$('settings'):null;if(box&&me?.globalAdmin===true&&String(me?.displayName||'').trim()==='박태영'){const card=[...box.querySelectorAll('.card')].find(c=>String(c.textContent||'').includes('프로그램 버전'));if(card){const m=card.querySelector('.meta');if(m)m.textContent='콕매치 v4.8 · iPhone 직접 푸시 · 서비스워커 fallback'}}setTimeout(()=>window.renderPushCard48().catch(()=>{}),0);return r};

const loadStatePrev48=loadState;loadState=async function(...args){const r=await loadStatePrev48(...args);if(T&&me&&Notification.permission==='granted')sync48(false).catch(()=>{});return r};

function cmp48(a,b){const A=String(a||'0').replace(/^v/i,'').split('.').map(n=>Number(n)||0),B=String(b||'0').replace(/^v/i,'').split('.').map(n=>Number(n)||0);for(let i=0;i<Math.max(A.length,B.length);i++){const x=A[i]||0,y=B[i]||0;if(x!==y)return x>y?1:-1}return 0}
function styleTop48(){if(document.getElementById('v48topStyle'))return;const s=document.createElement('style');s.id='v48topStyle';s.textContent=`#topActions37,#topActions39,#topActions40,#topActions41,#topActions42,#topActions43,#topActions44,#topActions45,#topActions46,#topActions47{display:none!important}#topActions48{margin-left:auto;display:flex;align-items:center;justify-content:flex-end;gap:4px;position:relative;z-index:120;pointer-events:auto;min-width:0}#currentVersion48{font-size:10px;font-weight:900;padding:6px 5px;border-radius:8px;background:rgba(255,255,255,.18);white-space:nowrap;flex:0 0 auto}#headerRefresh48{flex:0 1 auto;min-width:0;max-width:170px;min-height:30px;padding:6px 8px;font-size:10.5px;font-weight:800;line-height:1.15;white-space:normal;overflow-wrap:anywhere}#logout48{flex:0 0 64px;width:64px;min-width:64px;max-width:64px;min-height:30px;padding:6px 4px;font-size:11px;white-space:nowrap}.toprow>.logout{display:none!important}@media(max-width:380px){#currentVersion48{display:none}#headerRefresh48{max-width:135px;font-size:9.5px}#logout48{flex-basis:56px;width:56px;min-width:56px;max-width:56px;font-size:10px}}`;document.head.appendChild(s)}
function updateTop48(){const v=document.getElementById('currentVersion48'),b=document.getElementById('headerRefresh48');if(v)v.textContent='v'+CUR48;if(!b)return;const newer=cmp48(latest48,CUR48)>0;b.textContent=refreshBusy48?'불러오는 중…':newer?`v${latest48} 업데이트 · 새로고침`:'↻ 새로고침';b.title=newer?`최신버전 v${latest48}이 있습니다. 눌러서 업데이트하세요.`:'현재 페이지를 다시 불러옵니다.'}
function ensureTop48(){styleTop48();const row=document.querySelector('.toprow');if(!row)return;let a=document.getElementById('topActions48');if(!a){a=document.createElement('div');a.id='topActions48';a.innerHTML='<span id="currentVersion48">v4.8</span><button id="headerRefresh48" class="btn ghost" type="button">↻ 새로고침</button><button id="logout48" type="button">로그아웃</button>';row.appendChild(a);a.querySelector('#headerRefresh48')?.addEventListener('click',()=>window.refreshApp48());a.querySelector('#logout48')?.addEventListener('click',()=>logout())}updateTop48()}
async function latestCheck48(){try{const r=await fetch('/latest-version.json?t='+Date.now(),{cache:'no-store'});if(r.ok){const x=await r.json();latest48=String(x.semanticVersion||x.label||CUR48).replace(/^v/i,'')||CUR48}}catch{}updateTop48();return latest48}
window.refreshApp48=async function(target=''){if(refreshBusy48)return;refreshBusy48=true;updateTop48();try{const v=String(target||await latestCheck48()||CUR48).replace(/^v/i,'');try{if(typeof saveRefreshState==='function')saveRefreshState()}catch{}location.replace('/?v='+encodeURIComponent(v)+'&refresh='+Date.now())}catch(e){refreshBusy48=false;updateTop48();if(typeof showError==='function')showError(e);else alert(e?.message||'새로고침에 실패했습니다.')}};
window.refreshApp47=window.refreshApp48;window.refreshApp46=window.refreshApp48;window.refreshApp45=window.refreshApp48;window.refreshApp44=window.refreshApp48;window.refreshApp43=window.refreshApp48;window.refreshApp42=window.refreshApp48;window.refreshApp41=window.refreshApp48;window.refreshApp40=window.refreshApp48;window.refreshApp39=window.refreshApp48;window.refreshApp37=window.refreshApp48;
const renderHeaderPrev48=renderHeader;renderHeader=function(){const r=renderHeaderPrev48();ensureTop48();return r};

try{const q=new URLSearchParams(location.search),view=q.get('pushView'),club=q.get('pushClub');if(view){q.delete('pushView');q.delete('pushClub');history.replaceState(null,'',location.pathname+(q.toString()?'?'+q.toString():''));setTimeout(async()=>{if(!T||!me)return;try{if(club&&String(club)!==String(currentGroupId)&&typeof switchGroup==='function')await switchGroup(String(club));if(['queue','playing','members','stats','settings'].includes(view))goView(view)}catch{}},700)}}catch{}

if(!ios48()||!declarative48()){if('serviceWorker'in navigator)ensureSw48().catch(()=>{})}
if(T&&me&&Notification.permission==='granted')setTimeout(()=>sync48(false).catch(()=>{}),300);
setTimeout(()=>{ensureTop48();latestCheck48().catch(()=>{})},0);setInterval(()=>latestCheck48().catch(()=>{}),60000);
})();

/* migrated into v6.0: app-v4.9.js */
(()=>{
const CUR49='4.9';
window.__kokmatchPushUiOwner49=true;
let latest49=CUR49,refreshBusy49=false;
const push49={known:false,enabled:false,mode:'',permission:typeof Notification!=='undefined'?Notification.permission:'unsupported',checkedAt:0,checking:null,busy:false};

function ios49(){return /iPad|iPhone|iPod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1)}
function standalone49(){return window.matchMedia?.('(display-mode: standalone)')?.matches===true||navigator.standalone===true}
function declarative49(){return !!(window.pushManager&&typeof window.pushManager.getSubscription==='function')}
function supported49(){return 'Notification'in window&&(declarative49()||('serviceWorker'in navigator&&'PushManager'in window))}

function installStyle49(){
 if(document.getElementById('push49style'))return;
 const s=document.createElement('style');s.id='push49style';
 s.textContent=`#gamePushCard43,#gamePushCard48{display:none!important}#gamePushCard49{contain:layout style;overflow:hidden}.pushHelpButtons49{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}.pushHelpToggle49{width:100%;min-height:38px;text-align:left;justify-content:space-between}.pushHelpBody49{margin-top:8px;padding:10px 12px;border-radius:12px;background:rgba(36,83,212,.06);font-size:13px;line-height:1.65}.pushHelpBody49[hidden]{display:none!important}.pushHelpBody49 b{display:block;margin-bottom:4px}.pushHelpBody49 ol{margin:6px 0 0 19px;padding:0}.pushHelpBody49 li{margin:3px 0}@media(max-width:420px){.pushHelpButtons49{grid-template-columns:1fr}}#topActions37,#topActions39,#topActions40,#topActions41,#topActions42,#topActions43,#topActions44,#topActions45,#topActions46,#topActions47,#topActions48{display:none!important}#topActions49{margin-left:auto;display:flex;align-items:center;justify-content:flex-end;gap:4px;position:relative;z-index:130;pointer-events:auto;min-width:0}#currentVersion49{font-size:10px;font-weight:900;padding:6px 5px;border-radius:8px;background:rgba(255,255,255,.18);white-space:nowrap;flex:0 0 auto}#headerRefresh49{flex:0 1 auto;min-width:0;max-width:170px;min-height:30px;padding:6px 8px;font-size:10.5px;font-weight:800;line-height:1.15;white-space:normal;overflow-wrap:anywhere}#logout49{flex:0 0 64px;width:64px;min-width:64px;max-width:64px;min-height:30px;padding:6px 4px;font-size:11px;white-space:nowrap}.toprow>.logout{display:none!important}@media(max-width:380px){#currentVersion49{display:none}#headerRefresh49{max-width:135px;font-size:9.5px}#logout49{flex-basis:56px;width:56px;min-width:56px;max-width:56px;font-size:10px}}`;
 document.head.appendChild(s);
}
installStyle49();

async function inspectPush49(force=false){
 if(push49.checking)return push49.checking;
 if(!force&&push49.known&&Date.now()-push49.checkedAt<60000)return push49;
 push49.checking=(async()=>{
  push49.permission=typeof Notification!=='undefined'?Notification.permission:'unsupported';
  if(!supported49()||push49.permission!=='granted'){push49.known=true;push49.enabled=false;push49.mode='';push49.checkedAt=Date.now();return push49}
  let sub=null,mode='';
  try{
   if(ios49()&&declarative49()){sub=await window.pushManager.getSubscription();mode='ios-direct'}
   else if('serviceWorker'in navigator){const reg=await navigator.serviceWorker.getRegistration('/');if(reg?.pushManager){sub=await reg.pushManager.getSubscription();mode='service-worker'}}
  }catch(e){console.warn('push inspect v4.9',e)}
  push49.known=true;push49.enabled=!!sub;push49.mode=sub?mode:'';push49.checkedAt=Date.now();return push49;
 })();
 try{return await push49.checking}finally{push49.checking=null}
}

function statusText49(){
 if(!supported49())return '이 기기/브라우저는 푸시 알림을 지원하지 않습니다.';
 if(ios49()&&!standalone49())return '아이폰은 홈 화면에 추가한 콕매치 앱으로 실행해야 알림을 받을 수 있습니다.';
 if(push49.permission==='denied')return '알림 권한이 차단되어 있습니다. 아래 기기별 설정방법을 확인해주세요.';
 if(!push49.known)return '알림 연결 상태 확인 중...';
 if(push49.enabled)return push49.mode==='ios-direct'?'켜짐 · iPhone 직접 푸시 연결됨':'켜짐 · 게임 푸시 연결됨';
 if(push49.permission==='granted')return '알림 권한은 허용되어 있습니다. 게임 알림 연결이 필요합니다.';
 return '꺼짐 · 이 기기에서 게임 알림을 켜주세요.';
}
function buttonText49(){if(push49.busy)return '처리 중…';if(!push49.known)return '확인 중…';return push49.enabled?'알림 끄기':'게임 알림 켜기'}

function helpHtml49(){return `<div class="pushHelpButtons49"><button class="btn ghost pushHelpToggle49" id="pushHelpIphone49" type="button" aria-expanded="false">아이폰 알림 설정방법 <span>▾</span></button><button class="btn ghost pushHelpToggle49" id="pushHelpGalaxy49" type="button" aria-expanded="false">갤럭시 알림 설정방법 <span>▾</span></button></div><div id="pushHelpIphoneBody49" class="pushHelpBody49" hidden><b>아이폰 알림 설정방법</b><ol><li>Safari에서 콕매치를 연 뒤 공유 버튼 → <b>홈 화면에 추가</b>를 선택합니다.</li><li>홈 화면의 콕매치 아이콘으로 앱을 실행하고 로그인합니다.</li><li>설정 → 게임 알림 → <b>게임 알림 켜기</b>를 누르고 iPhone 알림 허용을 선택합니다.</li><li>이미 차단했다면 iPhone 설정 → 알림 → 콕매치 → <b>알림 허용</b>을 켭니다.</li><li>설정 직후 “게임 알림 설정이 완료되었습니다.” 테스트 알림이 오면 정상입니다.</li></ol></div><div id="pushHelpGalaxyBody49" class="pushHelpBody49" hidden><b>갤럭시 알림 설정방법</b><ol><li>Chrome 또는 삼성 인터넷에서 콕매치를 홈 화면에 추가하고 홈 화면 아이콘으로 실행합니다.</li><li>로그인 후 설정 → 게임 알림 → <b>게임 알림 켜기</b>를 누르고 알림 허용을 선택합니다.</li><li>알림이 차단된 경우 갤럭시 설정 → 알림 → 앱 알림 → <b>콕매치</b>를 허용합니다. 콕매치가 안 보이면 Chrome 또는 삼성 인터넷의 알림 허용도 확인합니다.</li><li>배터리 절전 설정이 강한 경우 콕매치를 절전 예외 앱으로 두면 백그라운드 알림 수신이 더 안정적입니다.</li><li>설정 직후 테스트 알림이 오면 정상입니다.</li></ol></div>`}

function ensureCard49(){
 const box=typeof $==='function'?$('settings'):document.getElementById('settings');if(!box)return null;
 document.getElementById('gamePushCard43')?.remove();document.getElementById('gamePushCard48')?.remove();
 let card=document.getElementById('gamePushCard49');
 if(!card){
  card=document.createElement('div');card.id='gamePushCard49';card.className='card';
  card.innerHTML=`<div class="between"><div style="min-width:0;flex:1"><b>게임 알림</b><div id="gamePushStatus49" class="meta" style="margin-top:5px;line-height:1.6"></div></div><button id="gamePushBtn49" class="btn pri" type="button"></button></div><div class="meta" style="margin-top:8px;line-height:1.6">편성대기조 배정 시 조 번호를, 경기 시작 시 입장할 코트 번호를 알려줍니다. 알림 설정은 기기별로 한 번씩 필요합니다.</div>${helpHtml49()}`;
  const title=box.querySelector('.title');if(title)title.insertAdjacentElement('afterend',card);else box.prepend(card);
  card.querySelector('#pushHelpIphone49')?.addEventListener('click',()=>toggleHelp49('iphone'));
  card.querySelector('#pushHelpGalaxy49')?.addEventListener('click',()=>toggleHelp49('galaxy'));
  card.querySelector('#gamePushBtn49')?.addEventListener('click',()=>togglePush49());
 }
 paintCard49();return card;
}
function toggleHelp49(kind){
 const mine=kind==='iphone'?document.getElementById('pushHelpIphoneBody49'):document.getElementById('pushHelpGalaxyBody49');
 const other=kind==='iphone'?document.getElementById('pushHelpGalaxyBody49'):document.getElementById('pushHelpIphoneBody49');
 const btn=kind==='iphone'?document.getElementById('pushHelpIphone49'):document.getElementById('pushHelpGalaxy49');
 const otherBtn=kind==='iphone'?document.getElementById('pushHelpGalaxy49'):document.getElementById('pushHelpIphone49');
 if(!mine)return;const open=mine.hidden;mine.hidden=!open;if(other)other.hidden=true;btn?.setAttribute('aria-expanded',open?'true':'false');otherBtn?.setAttribute('aria-expanded','false');
}
function paintCard49(){
 const status=document.getElementById('gamePushStatus49'),btn=document.getElementById('gamePushBtn49');if(!status||!btn)return;
 status.textContent=statusText49();btn.textContent=buttonText49();btn.disabled=push49.busy||!supported49()||!push49.known||push49.permission==='denied'||(ios49()&&!standalone49());
}
async function refreshPushState49(force=false){try{await inspectPush49(force)}finally{paintCard49()}}
async function togglePush49(){
 if(push49.busy)return;push49.busy=true;paintCard49();
 try{
  if(push49.enabled){if(typeof window.disableGamePush48==='function')await window.disableGamePush48();else if(typeof window.disableGamePush44==='function')await window.disableGamePush44()}
  else{if(typeof window.enableGamePush48==='function')await window.enableGamePush48();else if(typeof window.enableGamePush44==='function')await window.enableGamePush44()}
 }finally{push49.busy=false;push49.known=false;await refreshPushState49(true)}
}

/* Stop older async push-card painters. v4.9 owns only the settings UI; the v4.8 subscription logic stays in use. */
if(typeof window.renderPushCard48==='function')window.renderPushCard48=async()=>{};

const renderSettingsPrev49=renderSettings;
renderSettings=function(){
 const r=renderSettingsPrev49();installStyle49();ensureCard49();
 const box=typeof $==='function'?$('settings'):null;
 if(box&&me?.globalAdmin===true&&String(me?.displayName||'').trim()==='박태영'){
  const card=[...box.querySelectorAll('.card')].find(c=>String(c.textContent||'').includes('프로그램 버전'));
  if(card){const m=card.querySelector('.meta');if(m)m.textContent='콕매치 v4.9 · 알림설정 UI 안정화 · 기기별 안내'}
 }
 refreshPushState49(false).catch(()=>{});return r;
};

function cmp49(a,b){const A=String(a||'0').replace(/^v/i,'').split('.').map(n=>Number(n)||0),B=String(b||'0').replace(/^v/i,'').split('.').map(n=>Number(n)||0);for(let i=0;i<Math.max(A.length,B.length);i++){const x=A[i]||0,y=B[i]||0;if(x!==y)return x>y?1:-1}return 0}
function updateTop49(){const v=document.getElementById('currentVersion49'),b=document.getElementById('headerRefresh49');if(v)v.textContent='v'+CUR49;if(!b)return;const newer=cmp49(latest49,CUR49)>0;b.textContent=refreshBusy49?'불러오는 중…':newer?`v${latest49} 업데이트 · 새로고침`:'↻ 새로고침';b.title=newer?`최신버전 v${latest49}이 있습니다. 눌러서 업데이트하세요.`:'현재 페이지를 다시 불러옵니다.'}
function ensureTop49(){installStyle49();const row=document.querySelector('.toprow');if(!row)return;let a=document.getElementById('topActions49');if(!a){a=document.createElement('div');a.id='topActions49';a.innerHTML='<span id="currentVersion49">v4.9</span><button id="headerRefresh49" class="btn ghost" type="button">↻ 새로고침</button><button id="logout49" type="button">로그아웃</button>';row.appendChild(a);a.querySelector('#headerRefresh49')?.addEventListener('click',()=>window.refreshApp49());a.querySelector('#logout49')?.addEventListener('click',()=>logout())}updateTop49()}
async function latestCheck49(){try{const r=await fetch('/latest-version.json?t='+Date.now(),{cache:'no-store'});if(r.ok){const x=await r.json();latest49=String(x.semanticVersion||x.label||CUR49).replace(/^v/i,'')||CUR49}}catch{}updateTop49();return latest49}
window.refreshApp49=async function(target=''){if(refreshBusy49)return;refreshBusy49=true;updateTop49();try{const v=String(target||await latestCheck49()||CUR49).replace(/^v/i,'');try{if(typeof saveRefreshState==='function')saveRefreshState()}catch{}location.replace('/?v='+encodeURIComponent(v)+'&refresh='+Date.now())}catch(e){refreshBusy49=false;updateTop49();if(typeof showError==='function')showError(e);else alert(e?.message||'새로고침에 실패했습니다.')}};
window.refreshApp48=window.refreshApp49;window.refreshApp47=window.refreshApp49;window.refreshApp46=window.refreshApp49;window.refreshApp45=window.refreshApp49;window.refreshApp44=window.refreshApp49;window.refreshApp43=window.refreshApp49;window.refreshApp42=window.refreshApp49;window.refreshApp41=window.refreshApp49;window.refreshApp40=window.refreshApp49;window.refreshApp39=window.refreshApp49;window.refreshApp37=window.refreshApp49;
const renderHeaderPrev49=renderHeader;renderHeader=function(){const r=renderHeaderPrev49();ensureTop49();return r};

setTimeout(()=>{ensureTop49();latestCheck49();if(T&&me&&currentView==='settings'){ensureCard49();refreshPushState49(true).catch(()=>{})}},0);
setInterval(()=>latestCheck49(),60000);
})();

/* migrated into v6.0: app-v5.0.js */
(()=>{
const CUR50='5.0';
const GUIDE_KEY50='kokmatch_push_help_open_v50';
let latest50=CUR50,refreshBusy50=false;
let guideOpen50={iphone:false,galaxy:false};
try{const x=JSON.parse(sessionStorage.getItem(GUIDE_KEY50)||'{}');guideOpen50={iphone:!!x.iphone,galaxy:!!x.galaxy}}catch{}

function saveGuide50(){try{sessionStorage.setItem(GUIDE_KEY50,JSON.stringify(guideOpen50))}catch{}}
function installStyle50(){
 if(document.getElementById('v50style'))return;
 const s=document.createElement('style');s.id='v50style';s.textContent=`
 /* Past calendar days: substantially lighter than today/future while keeping poll dots readable. */
 .pollCalDay21.past22:not(.selected){color:#dce1e9!important;background:transparent!important;box-shadow:none!important}
 .pollCalDay21.past22.sun23:not(.selected),.pollCalDay21.past22.holiday23:not(.selected){color:#efdee1!important}
 .pollCalDay21.past22.sat23:not(.selected):not(.holiday23){color:#dfe7f5!important}
 .pollCalDay21.past22.hasPoll:not(.selected){background:#f8fbf6!important;color:#d2ddd0!important}
 .pollCalDay21.past22.selected{background:#f3f5f8!important;color:#c3cad5!important;box-shadow:inset 0 0 0 1px #e1e5eb!important}
 .pollCalDay21.past22.selected.sun23,.pollCalDay21.past22.selected.holiday23{color:#e2cfd2!important}
 .pollCalDay21.past22.selected.sat23:not(.holiday23){color:#ced9eb!important}
 #topActions37,#topActions39,#topActions40,#topActions41,#topActions42,#topActions43,#topActions44,#topActions45,#topActions46,#topActions47,#topActions48,#topActions49{display:none!important}
 #topActions50{margin-left:auto;display:flex;align-items:center;justify-content:flex-end;gap:4px;position:relative;z-index:140;pointer-events:auto;min-width:0}
 #currentVersion50{font-size:10px;font-weight:900;padding:6px 5px;border-radius:8px;background:rgba(255,255,255,.18);white-space:nowrap;flex:0 0 auto}
 #headerRefresh50{flex:0 1 auto;min-width:0;max-width:170px;min-height:30px;padding:6px 8px;font-size:10.5px;font-weight:800;line-height:1.15;white-space:normal;overflow-wrap:anywhere}
 #logout50{flex:0 0 64px;width:64px;min-width:64px;max-width:64px;min-height:30px;padding:6px 4px;font-size:11px;white-space:nowrap}
 .toprow>.logout{display:none!important}
 @media(max-width:380px){#currentVersion50{display:none}#headerRefresh50{max-width:135px;font-size:9.5px}#logout50{flex-basis:56px;width:56px;min-width:56px;max-width:56px;font-size:10px}}
 `;document.head.appendChild(s)
}
installStyle50();

function removeHomeCard50(){
 const box=typeof $==='function'?$('settings'):document.getElementById('settings');if(!box)return;
 [...box.children].forEach(el=>{
  if(!el.classList?.contains('card'))return;
  if(el.id==='gamePushCard49')return;
  const first=el.firstElementChild;
  if(first?.tagName==='B'&&String(first.textContent||'').trim()==='홈 화면에 추가')el.remove();
 })
}

function applyGuideState50(){
 const ib=document.getElementById('pushHelpIphoneBody49'),gb=document.getElementById('pushHelpGalaxyBody49');
 const it=document.getElementById('pushHelpIphone49'),gt=document.getElementById('pushHelpGalaxy49');
 if(ib)ib.hidden=!guideOpen50.iphone;if(gb)gb.hidden=!guideOpen50.galaxy;
 if(it){it.setAttribute('aria-expanded',guideOpen50.iphone?'true':'false');const sp=it.querySelector('span');if(sp)sp.textContent=guideOpen50.iphone?'▴':'▾'}
 if(gt){gt.setAttribute('aria-expanded',guideOpen50.galaxy?'true':'false');const sp=gt.querySelector('span');if(sp)sp.textContent=guideOpen50.galaxy?'▴':'▾'}
}
function bindGuideButton50(id,kind){
 const old=document.getElementById(id);if(!old||old.dataset.v50bound==='1')return;
 const btn=old.cloneNode(true);btn.dataset.v50bound='1';old.replaceWith(btn);
 let x0=0,y0=0,moved=false;
 btn.addEventListener('pointerdown',e=>{x0=e.clientX;y0=e.clientY;moved=false},{passive:true});
 btn.addEventListener('pointermove',e=>{if(Math.abs(e.clientX-x0)>8||Math.abs(e.clientY-y0)>8)moved=true},{passive:true});
 btn.addEventListener('click',e=>{
  if(moved){e.preventDefault();e.stopPropagation();return}
  guideOpen50[kind]=!guideOpen50[kind];saveGuide50();applyGuideState50()
 });
}
function stabilizeGuides50(){
 bindGuideButton50('pushHelpIphone49','iphone');bindGuideButton50('pushHelpGalaxy49','galaxy');applyGuideState50()
}
function settingsCleanup50(){
 removeHomeCard50();stabilizeGuides50();
 const box=typeof $==='function'?$('settings'):null;
 if(box&&me?.globalAdmin===true&&String(me?.displayName||'').trim()==='박태영'){
  const card=[...box.querySelectorAll('.card')].find(c=>String(c.textContent||'').includes('프로그램 버전'));
  if(card){const m=card.querySelector('.meta');if(m)m.textContent='콕매치 v5.0 · 알림설명 유지 · 지난날짜 가독성 조정'}
 }
}
const renderSettingsPrev50=renderSettings;
renderSettings=function(){const r=renderSettingsPrev50();settingsCleanup50();setTimeout(settingsCleanup50,0);return r};

function cmp50(a,b){const A=String(a||'0').replace(/^v/i,'').split('.').map(n=>Number(n)||0),B=String(b||'0').replace(/^v/i,'').split('.').map(n=>Number(n)||0);for(let i=0;i<Math.max(A.length,B.length);i++){const x=A[i]||0,y=B[i]||0;if(x!==y)return x>y?1:-1}return 0}
function updateTop50(){const v=document.getElementById('currentVersion50'),b=document.getElementById('headerRefresh50');if(v)v.textContent='v'+CUR50;if(!b)return;const newer=cmp50(latest50,CUR50)>0;b.textContent=refreshBusy50?'불러오는 중…':newer?`v${latest50} 업데이트 · 새로고침`:'↻ 새로고침';b.title=newer?`최신버전 v${latest50}이 있습니다. 눌러서 업데이트하세요.`:'현재 페이지를 다시 불러옵니다.'}
function ensureTop50(){installStyle50();const row=document.querySelector('.toprow');if(!row)return;let a=document.getElementById('topActions50');if(!a){a=document.createElement('div');a.id='topActions50';a.innerHTML='<span id="currentVersion50">v5.0</span><button id="headerRefresh50" class="btn ghost" type="button">↻ 새로고침</button><button id="logout50" type="button">로그아웃</button>';row.appendChild(a);a.querySelector('#headerRefresh50')?.addEventListener('click',()=>window.refreshApp50());a.querySelector('#logout50')?.addEventListener('click',()=>logout())}updateTop50()}
async function latestCheck50(){try{const r=await fetch('/latest-version.json?t='+Date.now(),{cache:'no-store'});if(r.ok){const x=await r.json();latest50=String(x.semanticVersion||x.label||CUR50).replace(/^v/i,'')||CUR50}}catch{}updateTop50();return latest50}
window.refreshApp50=async function(target=''){if(refreshBusy50)return;refreshBusy50=true;updateTop50();try{const v=String(target||await latestCheck50()||CUR50).replace(/^v/i,'');try{if(typeof saveRefreshState==='function')saveRefreshState()}catch{}location.replace('/?v='+encodeURIComponent(v)+'&refresh='+Date.now())}catch(e){refreshBusy50=false;updateTop50();if(typeof showError==='function')showError(e);else alert(e?.message||'새로고침에 실패했습니다.')}};
window.refreshApp49=window.refreshApp50;window.refreshApp48=window.refreshApp50;window.refreshApp47=window.refreshApp50;window.refreshApp46=window.refreshApp50;window.refreshApp45=window.refreshApp50;window.refreshApp44=window.refreshApp50;window.refreshApp43=window.refreshApp50;window.refreshApp42=window.refreshApp50;window.refreshApp41=window.refreshApp50;window.refreshApp40=window.refreshApp50;window.refreshApp39=window.refreshApp50;window.refreshApp37=window.refreshApp50;
const renderHeaderPrev50=renderHeader;renderHeader=function(){const r=renderHeaderPrev50();ensureTop50();return r};

setTimeout(()=>{ensureTop50();latestCheck50();if(T&&me&&currentView==='settings')settingsCleanup50()},0);
setInterval(()=>latestCheck50(),60000);
})();

/* migrated into v6.0: app-v5.1.js */
(()=>{
window.__kokmatchVersionLock='6.0';
const CUR51='5.1';let latest51=CUR51,refreshBusy51=false;
function style51(){if(document.getElementById('v51style'))return;const s=document.createElement('style');s.id='v51style';s.textContent='#topActions50{display:none!important}#topActions51{margin-left:auto;display:flex;align-items:center;justify-content:flex-end;gap:4px;position:relative;z-index:150;pointer-events:auto;min-width:0}#currentVersion51{font-size:10px;font-weight:900;padding:6px 5px;border-radius:8px;background:rgba(255,255,255,.18);white-space:nowrap;flex:0 0 auto}#headerRefresh51{flex:0 1 auto;min-width:0;max-width:170px;min-height:30px;padding:6px 8px;font-size:10.5px;font-weight:800;line-height:1.15;white-space:normal;overflow-wrap:anywhere}#logout51{flex:0 0 64px;width:64px;min-width:64px;max-width:64px;min-height:30px;padding:6px 4px;font-size:11px;white-space:nowrap}@media(max-width:380px){#currentVersion51{display:none}#headerRefresh51{max-width:135px;font-size:9.5px}#logout51{flex-basis:56px;width:56px;min-width:56px;max-width:56px;font-size:10px}}';document.head.appendChild(s)}
function cmp51(a,b){const A=String(a||'0').replace(/^v/i,'').split('.').map(n=>Number(n)||0),B=String(b||'0').replace(/^v/i,'').split('.').map(n=>Number(n)||0);for(let i=0;i<Math.max(A.length,B.length);i++){const x=A[i]||0,y=B[i]||0;if(x!==y)return x>y?1:-1}return 0}
function shown51(){const lock=String(window.__kokmatchVersionLock||'').replace(/^v/i,'');return lock&&cmp51(lock,CUR51)>0?lock:CUR51}
function update51(){const shown=shown51(),v=document.getElementById('currentVersion51'),b=document.getElementById('headerRefresh51');if(v)v.textContent='v'+shown;if(!b)return;const newer=cmp51(latest51,shown)>0;b.textContent=refreshBusy51?'불러오는 중…':newer?`v${latest51} 업데이트 · 새로고침`:'↻ 새로고침'}
function ensure51(){style51();const shown=shown51();document.title='콕매치 v'+shown;document.documentElement.dataset.kokmatchVersion=shown;const row=document.querySelector('.toprow');if(!row)return;let a=document.getElementById('topActions51');if(!a){a=document.createElement('div');a.id='topActions51';a.innerHTML='<span id="currentVersion51">v6.0</span><button id="headerRefresh51" class="btn ghost" type="button">↻ 새로고침</button><button id="logout51" type="button">로그아웃</button>';row.appendChild(a);a.querySelector('#headerRefresh51')?.addEventListener('click',()=>window.refreshApp51());a.querySelector('#logout51')?.addEventListener('click',()=>logout())}update51()}
async function latestCheck51(){try{const r=await fetch('/latest-version.json?t='+Date.now(),{cache:'no-store'});if(r.ok){const x=await r.json();latest51=String(x.semanticVersion||x.label||shown51()).replace(/^v/i,'')||shown51()}}catch{}update51();return latest51}
window.refreshApp51=async function(target=''){if(refreshBusy51)return;refreshBusy51=true;update51();try{const v=String(target||await latestCheck51()||shown51()).replace(/^v/i,'');try{if(typeof saveRefreshState==='function')saveRefreshState()}catch{}location.replace('/?v='+encodeURIComponent(v)+'&refresh='+Date.now())}catch(e){refreshBusy51=false;update51();if(typeof showError==='function')showError(e)}};
window.refreshApp50=window.refreshApp51;window.refreshApp49=window.refreshApp51;
const renderHeaderPrev51=renderHeader;renderHeader=function(){const r=renderHeaderPrev51();ensure51();return r};
const renderSettingsPrev51=renderSettings;renderSettings=function(){const r=renderSettingsPrev51();const box=typeof $==='function'?$('settings'):null;if(box&&me?.globalAdmin===true&&String(me?.displayName||'').trim()==='박태영'){const card=[...box.querySelectorAll('.card')].find(c=>String(c.textContent||'').includes('프로그램 버전'));if(card){const m=card.querySelector('.meta');if(m)m.textContent='콕매치 v6.0 · 실사용 QA 안정화 · 최신버전 고정'}}return r};
let stableMemberGroup51='';
const renderMembersPrev51=renderMembers;
renderMembers=function(){
 const box=typeof $==='function'?$('members'):document.getElementById('members');
 const stateCount=Array.isArray(S?.members)?S.members.length:0;
 const renderedCount=box?.querySelectorAll?.('.memberCard')?.length||0;
 const gid=String(currentGroupId||'');
 if(box&&renderedCount>1&&stateCount<=1&&stableMemberGroup51===gid)return;
 const r=renderMembersPrev51();
 if(stateCount>1)stableMemberGroup51=gid;
 else if(stableMemberGroup51!==gid)stableMemberGroup51=gid;
 return r;
};
function selectedPollDate51(){
 const b=document.querySelector('#stats .pollCalDay21.selected');
 const s=String(b?.getAttribute('onclick')||'');
 return (s.match(/selectPollDate22\('([0-9]{4}-[0-9]{2}-[0-9]{2})'\)/)||[])[1]||(typeof todayKst==='function'?todayKst():'');
}
function pollDateLabel51(date){const a=String(date||'').split('-').map(Number);return a.length===3&&a[0]?`${a[0]}년 ${a[1]}월 ${a[2]}일`:String(date||'')}
function pollMainTitle51(p){const loc=String(p?.location||'').trim();if(loc)return /운동$/.test(loc)?loc:`${loc} 운동`;let t=String(p?.title||'운동 참석 투표').trim();t=t.replace(/^\d{1,2}월\s*\d{1,2}일\s*\d{1,2}:\d{2}\s*/,'');return t||'운동 참석 투표'}
function decoratePollNow51(){
 const box=typeof $==='function'?$('stats'):document.getElementById('stats');if(!box)return;
 const date=selectedPollDate51();
 const ps=(Array.isArray(S?.attendancePolls)?S.attendancePolls:[]).filter(p=>String(p?.date||'')===date).slice().sort((a,b)=>String(a.time||'').localeCompare(String(b.time||'')));
 const cards=[...box.querySelectorAll('.pollWrap90 .pollCard21')];
 cards.forEach((card,i)=>{
  const p=ps[i];if(!p)return;
  const title=card.querySelector('.pollTitle21');if(!title)return;
  const ended=title.querySelector('.pollEndedBadge22')?.outerHTML||'';
  const time=p.time&&p.endTime?`${esc(p.time)} ~ ${esc(p.endTime)}`:esc(p.time||'');
  const when=[pollDateLabel51(p.date),time].filter(Boolean).join(' · ');
  const creator=String(p.createdBy||'').trim()||'정보 없음';
  const sig=[p.id,p.title,p.date,p.time,p.endTime,p.location,p.createdBy,ended].join('|');
  if(title.dataset.v51sig===sig&&title.querySelector('.pollMainTitle33'))return;
  title.dataset.v51sig=sig;
  title.innerHTML=`<div class="pollMainTitle33">${esc(pollMainTitle51(p))} ${ended}</div><div class="pollSchedule33">${when}</div><div class="pollCreator33">투표 생성자 · ${esc(creator)}</div>`;
 });
}
const renderStatsPrev51=renderStats;
renderStats=function(){const r=renderStatsPrev51();decoratePollNow51();return r};
for(const n of ['selectPollDate22','movePollMonth22']){
 const f=window[n];if(typeof f==='function')window[n]=function(...a){const r=f.apply(this,a);decoratePollNow51();return r};
}
document.addEventListener('click',e=>{if(e.target?.closest?.('#stats .pollCalDay21'))queueMicrotask(decoratePollNow51)},false);
setTimeout(()=>{ensure51();latestCheck51();if(me&&currentView==='stats')decoratePollNow51()},0);setInterval(()=>latestCheck51(),60000);
})();

/* migrated into v6.0: app-v5.2.js */
(()=>{
const CUR52='5.2';
window.__kokmatchVersionLock='6.0';
const AUTH52='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-auth-v38';
const STATE52='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-state-v46';
let switchBusy52=false,latest52=CUR52,refreshBusy52=false;

function style52(){if(document.getElementById('v52style'))return;const s=document.createElement('style');s.id='v52style';s.textContent='#topActions51{display:none!important}#topActions52{margin-left:auto;display:flex;align-items:center;justify-content:flex-end;gap:4px;position:relative;z-index:160;pointer-events:auto;min-width:0}#currentVersion52{font-size:10px;font-weight:900;padding:6px 5px;border-radius:8px;background:rgba(255,255,255,.18);white-space:nowrap;flex:0 0 auto}#headerRefresh52{flex:0 1 auto;min-width:0;max-width:170px;min-height:30px;padding:6px 8px;font-size:10.5px;font-weight:800;line-height:1.15;white-space:normal;overflow-wrap:anywhere}#logout52{flex:0 0 64px;width:64px;min-width:64px;max-width:64px;min-height:30px;padding:6px 4px;font-size:11px;white-space:nowrap}.groupBtn.switching52{opacity:.72;pointer-events:none}@media(max-width:380px){#currentVersion52{display:none}#headerRefresh52{max-width:135px;font-size:9.5px}#logout52{flex-basis:56px;width:56px;min-width:56px;max-width:56px;font-size:10px}}';document.head.appendChild(s)}
function cmp52(a,b){const A=String(a||'0').replace(/^v/i,'').split('.').map(n=>Number(n)||0),B=String(b||'0').replace(/^v/i,'').split('.').map(n=>Number(n)||0);for(let i=0;i<Math.max(A.length,B.length);i++){const x=A[i]||0,y=B[i]||0;if(x!==y)return x>y?1:-1}return 0}
function shown52(){const lock=String(window.__kokmatchVersionLock||'').replace(/^v/i,'');return lock&&cmp52(lock,CUR52)>0?lock:CUR52}
function topText52(){const shown=shown52(),v=document.getElementById('currentVersion52'),b=document.getElementById('headerRefresh52');if(v)v.textContent='v'+shown;if(!b)return;const newer=cmp52(latest52,shown)>0;b.textContent=refreshBusy52?'불러오는 중…':newer?`v${latest52} 업데이트 · 새로고침`:'↻ 새로고침'}
function ensureTop52(){style52();const shown=shown52();document.title='콕매치 v'+shown;document.documentElement.dataset.kokmatchVersion=shown;const row=document.querySelector('.toprow');if(!row)return;let a=document.getElementById('topActions52');if(!a){a=document.createElement('div');a.id='topActions52';a.innerHTML='<span id="currentVersion52">v6.0</span><button id="headerRefresh52" class="btn ghost" type="button">↻ 새로고침</button><button id="logout52" type="button">로그아웃</button>';row.appendChild(a);a.querySelector('#headerRefresh52')?.addEventListener('click',()=>window.refreshApp52());a.querySelector('#logout52')?.addEventListener('click',()=>logout())}topText52()}
async function latestCheck52(){try{const r=await fetch('/latest-version.json?t='+Date.now(),{cache:'no-store'});if(r.ok){const x=await r.json();latest52=String(x.semanticVersion||x.label||CUR52).replace(/^v/i,'')||CUR52}}catch{}topText52();return latest52}
window.refreshApp52=async function(target=''){if(refreshBusy52)return;refreshBusy52=true;topText52();try{const v=String(target||await latestCheck52()||shown52()).replace(/^v/i,'');try{if(typeof saveRefreshState==='function')saveRefreshState()}catch{}location.replace('/?v='+encodeURIComponent(v)+'&refresh='+Date.now())}catch(e){refreshBusy52=false;topText52();if(typeof showError==='function')showError(e)}};
window.refreshApp51=window.refreshApp52;

async function json52(url,opt){const r=await fetch(url,opt);const x=await r.json().catch(()=>({}));if(!r.ok){const e=new Error(x.error||'모임 전환 중 오류가 발생했습니다.');e.status=r.status;throw e}return x}
async function switchToken52(id){return json52(AUTH52,{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+T},body:JSON.stringify({action:'switch_group',groupId:id}),cache:'no-store'})}
async function compact52(id,token){const u=new URL(STATE52);u.searchParams.set('groupId',id);u.searchParams.set('t',Date.now());return json52(u,{headers:{authorization:'Bearer '+token},cache:'no-store'})}
function setSwitching52(on,name=''){const b=typeof $==='function'?$('groupBtn'):document.getElementById('groupBtn');if(!b)return;b.classList.toggle('switching52',!!on);if(on)b.textContent=(name||'모임')+' · 전환 중…'}
function identity52(x,id){const wasGlobal=!!me?.globalAdmin;currentGroupId=String(x.groupId||id);localStorage.setItem(GROUP_KEY,currentGroupId);group={groupId:currentGroupId,name:String(x.groupName||group?.name||'모임')};me={...(me||{}),role:String(x.role||me?.role||'member'),roleLabel:String(x.roleLabel||me?.roleLabel||''),memberId:x.memberId??me?.memberId,groupId:currentGroupId,groupName:group.name,globalAdmin:wasGlobal||String(x.role)==='admin'};try{renderHeader();renderNav()}catch{}}
function applyCompact52(x,id){if(String(currentGroupId)!==String(id)||!x?.data)return;const full=Array.isArray(S?.members)?S.members:[];S={...x.data,members:full.length?full:(Array.isArray(x.data.members)?x.data.members:[])};me=x.user||me;group=x.group||group;groups=x.groups||groups;currentGroupId=String(group?.groupId||id);localStorage.setItem(GROUP_KEY,currentGroupId);normalizeClient();renderAll()}
async function memberSwitch52(id,x,token){
 const stateP=compact52(id,token);
 let rosterOk=false;
 try{
  if(typeof window.enterMembers42==='function'){await window.enterMembers42(true);rosterOk=true}
  else{const r=await stateP;S=r.data;me=r.user;group=r.group;groups=r.groups||groups;currentGroupId=group.groupId;normalizeClient();renderAll();rosterOk=true;return}
 }finally{setSwitching52(false)}
 stateP.then(r=>{if(String(currentGroupId)===String(id))applyCompact52(r,id)}).catch(e=>{console.warn('background group state v5.2',e);if(!rosterOk&&typeof showError==='function')showError(e)});
}
async function fastSwitch52(id,view=''){
 id=String(id||'');if(!id||id===String(currentGroupId||'')){closeModal();return}if(switchBusy52)return;switchBusy52=true;
 const oldGroup=String(currentGroupId||''),oldToken=T;setSwitching52(true,'모임');
 try{
  const x=await switchToken52(id);if(x.token){T=x.token;localStorage.setItem(TOKEN_KEY,T)}identity52(x,id);closeModal();
  const targetView=String(view||currentView||'members');
  if(targetView==='members'||currentView==='members'){await memberSwitch52(id,x,T);window.scrollTo(0,0)}
  else{await loadState(true);setSwitching52(false);if(view)goView(targetView);window.scrollTo(0,0)}
 }catch(e){setSwitching52(false);if(String(currentGroupId||'')!==oldGroup&&T===oldToken){currentGroupId=oldGroup;localStorage.setItem(GROUP_KEY,oldGroup)}if(typeof showError==='function')showError(e);else alert(e?.message||'모임 전환에 실패했습니다.')}
 finally{switchBusy52=false}
}
window.switchOwnGroup38=function(id){return fastSwitch52(id)};
window.adminSwitchGroup38=function(id,view='members'){return fastSwitch52(id,view)};
try{switchGroup=function(id,view='members'){return fastSwitch52(id,view)}}catch{window.switchGroup=function(id,view='members'){return fastSwitch52(id,view)}}

const renderHeaderPrev52=renderHeader;renderHeader=function(){const r=renderHeaderPrev52();ensureTop52();return r};
const renderSettingsPrev52=renderSettings;renderSettings=function(){const r=renderSettingsPrev52();const box=typeof $==='function'?$('settings'):null;if(box&&me?.globalAdmin===true&&String(me?.displayName||'').trim()==='박태영'){const card=[...box.querySelectorAll('.card')].find(c=>String(c.textContent||'').includes('프로그램 버전'));if(card){const m=card.querySelector('.meta');if(m)m.textContent='콕매치 v6.0 · 다중모임 전환 고속화 · 최신버전 고정'}}return r};
setTimeout(()=>{ensureTop52();latestCheck52()},0);setInterval(()=>latestCheck52(),60000);
})();

/* migrated into v6.0: app-v5.3.js */
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

/* migrated into v6.0: app-v5.4.js */
(()=>{
if(window.__kokmatchV54Hotfix3)return;window.__kokmatchV54Hotfix3=true;
const CUR54='6.0',DRAFT_KEY54='kokmatch_draft_v54_',PROFILE54='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-profile-v53';
let restoredGroup54='',profiles54={},profilesGroup54='',profileLoadSeq54=0,profileSaveSeq54=0;
const avatarBefore54=typeof avatar==='function'?avatar:null;
function gid54(){return String(currentGroupId||'')}
function draftKey54(){return DRAFT_KEY54+gid54()}
function saveDraft54(){try{if(!gid54()||!Array.isArray(draft))return;localStorage.setItem(draftKey54(),JSON.stringify(draft.slice(0,4)))}catch{}}
function restoreDraft54(){try{if(!gid54()||!Array.isArray(draft)||!Array.isArray(S?.members)||!S.members.length)return false;const raw=localStorage.getItem(draftKey54());if(!raw)return true;const a=JSON.parse(raw);if(!Array.isArray(a))return true;const valid=a.slice(0,4).map(id=>id&&typeof M==='function'&&M(id)?id:null);while(valid.length<4)valid.push(null);draft.splice(0,draft.length,...valid);return true}catch{return false}}
function ensureDraft54(){const g=gid54();if(!g||restoredGroup54===g)return;if(restoreDraft54())restoredGroup54=g}
function clearDraft54(){try{localStorage.removeItem(draftKey54())}catch{};restoredGroup54=gid54()}
function wrapDraft54(name,after){const f=window[name];if(typeof f!=='function'||f.__v54fix3)return;const w=function(...a){const r=f.apply(this,a);Promise.resolve(r).finally(()=>{try{after?.()}catch{}});return r};w.__v54fix3=true;window[name]=w;try{eval(`${name}=window[name]`)}catch{}}
for(const n of ['draftClick','draftRemove','recommendDraft'])wrapDraft54(n,()=>{saveDraft54();try{renderQueue()}catch{}});
wrapDraft54('registerDraft',()=>clearDraft54());

function style54(){if(document.getElementById('v54style3'))return;const s=document.createElement('style');s.id='v54style3';s.textContent=`
.composer54 .slots.pendingGrid{display:grid!important;grid-template-columns:1fr 1fr!important;gap:7px!important}
.composer54 .slot54.pendingSlot{min-height:66px!important;border-radius:12px!important;background:#f2f5fd!important;padding:8px!important;position:relative!important;border:1px solid transparent!important}
.composer54 .slot54.pendingSlot.emptySlot{border:1px dashed #b8c4e0!important;background:#fafbff!important;color:#72809a!important;display:flex!important;align-items:center!important;justify-content:center!important;text-align:center!important;font-weight:850!important}
.composer54 .slot54 .slotName{font-weight:900!important;padding-right:24px!important}.composer54 .slot54 .meta{margin-top:2px!important}
.composer54 .slot54 .pendingX{position:absolute!important;right:5px!important;top:5px!important;border:0!important;background:#fff0f0!important;color:var(--red)!important;border-radius:50%!important;width:23px!important;height:23px!important;font-weight:950!important}
.composer54 .slot54 .gradeBadge50,.composer54 .slot54 .tag{margin-left:4px!important}.composer54 .slot54 .roleBadge,.composer54 .slot54 .roleShuttle50{vertical-align:middle!important}
#profileFile53{display:none!important}.profilePreview53 img{width:100%!important;height:100%!important;object-fit:cover!important;display:block!important}
#headerRefresh52.v54hidden{display:none!important}
`;document.head.appendChild(s)}
function fallbackAvatar54(m){return avatarBefore54?String(avatarBefore54(m)||''):`<div class="avatar ${m?.gender==='여'?'female':'male'}">●</div>`}
function avatar54(m){const p=profiles54[String(m?.id||'')]?.image||'';return p?`<div class="avatar profileAvatar53"><img src="${p}" alt="${esc(m?.name||'프로필')} 프로필"></div>`:fallbackAvatar54(m)}
try{avatar=function(m){return avatar54(m)}}catch{window.avatar=avatar54}

function composerSlotHtml54(id,i){const m=id&&typeof M==='function'?M(id):null;if(!m)return `<div class="slot54 pendingSlot emptySlot"><span><b>${i<2?'A팀':'B팀'} ${i%2+1}</b><br><span class="meta">개인 게임대기에서 선택</span></span></div>`;return `<div class="slot54 pendingSlot filled"><button class="pendingX slotX" type="button" onclick="event.stopPropagation();draftRemove(${i})">×</button><div class="slotLabel">${i<2?'A팀':'B팀'} ${i%2+1}</div><div class="slotName">${esc(m.name)} ${ageTag(m)} ${roleBadge(m)}</div><div class="meta">게임 ${dailyCount(id)}회 · ${waitMins(m)}분 대기</div></div>`}
function mirrorPendingLayout54(){const box=typeof $==='function'?$('queue'):document.getElementById('queue');if(!box)return;const comp=box.querySelector('.composer54,.composer');if(!comp)return;comp.classList.add('composer54');const slots=comp.querySelector('.slots');if(!slots)return;slots.classList.add('pendingGrid');slots.innerHTML=(Array.isArray(draft)?draft:[null,null,null,null]).slice(0,4).map(composerSlotHtml54).join('')}
function decoratePhotoGender54(){const box=typeof $==='function'?$('queue'):document.getElementById('queue');if(!box||typeof sortedQueue!=='function')return;const ids=sortedQueue(),cards=[...box.querySelectorAll('.queueCard')];cards.forEach((c,i)=>{const id=ids[i],m=id&&typeof M==='function'?M(id):null;if(!m)return;c.querySelectorAll('.avatar,.profileAvatar53,.queueProfile53,.genderAvatar39,.genderPerson54,.v54genderText').forEach(x=>x.remove());const ord=c.querySelector('.ord');if(ord)ord.insertAdjacentHTML('afterend',avatar54(m).replace('class="avatar ','class="avatar queueProfile53 '));const photo=c.querySelector('.profileAvatar53 img');if(photo){const f=m.gender==='여';photo.closest('.profileAvatar53')?.insertAdjacentHTML('afterend',`<span class="v54genderText ${f?'female':'male'}">${f?'여':'남'}</span>`)}})}
function patchProfileCard54(){const card=document.getElementById('profileCard53');if(!card)return;const inp=card.querySelector('#profileFile53');if(inp){inp.setAttribute('accept','image/*');inp.removeAttribute('onchange');if(!inp.dataset.v54bound){inp.dataset.v54bound='1';inp.addEventListener('change',()=>window.changeProfile53(inp))}}const id=String(me?.memberId||'');const img=profiles54[id]?.image||'';const preview=card.querySelector('.profilePreview53');if(preview&&img)preview.innerHTML=`<img src="${img}" alt="내 프로필 사진">`;const label=card.querySelector('label[for="profileFile53"]');if(label)label.textContent='사진 변경'}
async function profileReq54(url,opt={}){const r=await fetch(url,opt),x=await r.json().catch(()=>({}));if(!r.ok)throw new Error(x.error||`프로필 저장 실패 (${r.status})`);return x}
async function loadProfiles54(force=false){if(!T||!gid54()||gid54()==='__global__')return;const g=gid54();if(!force&&profilesGroup54===g)return;const seq=++profileLoadSeq54,saveAtStart=profileSaveSeq54;const u=new URL(PROFILE54);u.searchParams.set('groupId',g);u.searchParams.set('t',Date.now());try{const x=await profileReq54(u,{headers:{authorization:'Bearer '+T},cache:'no-store'});if(seq!==profileLoadSeq54||g!==gid54()||saveAtStart!==profileSaveSeq54)return;profiles54=x.profiles||{};profilesGroup54=g;try{renderMembers();renderQueue();if(currentView==='settings'){renderSettings();patchProfileCard54()}}catch{}}catch(e){console.warn('profile load',e)}}
function imageToJpeg54(file){return new Promise((resolve,reject)=>{if(!file)return reject(new Error('사진을 선택해주세요.'));if(file.size>20*1024*1024)return reject(new Error('사진은 20MB 이하만 선택할 수 있습니다.'));const url=URL.createObjectURL(file),im=new Image();im.onload=()=>{try{const size=Math.min(im.naturalWidth,im.naturalHeight);if(!size)throw new Error('사진 크기를 확인해주세요.');const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');g.drawImage(im,(im.naturalWidth-size)/2,(im.naturalHeight-size)/2,size,size,0,0,256,256);let d=c.toDataURL('image/jpeg',.82);if(d.length>210000)d=c.toDataURL('image/jpeg',.65);if(d.length>210000)d=c.toDataURL('image/jpeg',.5);URL.revokeObjectURL(url);if(d.length>220000)return reject(new Error('사진 용량을 줄인 뒤 다시 선택해주세요.'));resolve(d)}catch(e){URL.revokeObjectURL(url);reject(e)}};im.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('이 사진 형식은 브라우저에서 읽을 수 없습니다. 다른 사진 또는 JPG/PNG를 선택해주세요.'))};im.src=url})}
window.changeProfile53=async function(input){const file=input?.files?.[0];if(!file||!T||!me?.memberId)return;const card=document.getElementById('profileCard53'),label=card?.querySelector('label[for="profileFile53"]'),preview=card?.querySelector('.profilePreview53');const oldHtml=preview?.innerHTML||'';if(label){label.textContent='저장 중…';label.style.pointerEvents='none'}let temp='';try{temp=URL.createObjectURL(file);if(preview)preview.innerHTML=`<img src="${temp}" alt="선택한 프로필 사진">`;const image=await imageToJpeg54(file);const g=gid54(),id=String(me.memberId);const x=await profileReq54(PROFILE54,{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+T},body:JSON.stringify({action:'save_profile',groupId:g,image}),cache:'no-store'});profileSaveSeq54++;profileLoadSeq54++;profiles54[id]={image:x.image||image,updatedAt:new Date().toISOString()};profilesGroup54=g;try{renderMembers();renderQueue();if(currentView==='settings'){renderSettings();patchProfileCard54()}}catch{} }catch(e){if(preview)preview.innerHTML=oldHtml;if(typeof showError==='function')showError(e);else alert(e.message)}finally{if(temp)URL.revokeObjectURL(temp);if(input)input.value='';if(label){label.textContent='사진 변경';label.style.pointerEvents=''}}};
window.deleteProfile53=async function(){if(!T||!me?.memberId)return;try{await profileReq54(PROFILE54,{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+T},body:JSON.stringify({action:'delete_profile',groupId:gid54()}),cache:'no-store'});profileSaveSeq54++;profileLoadSeq54++;delete profiles54[String(me.memberId)];profilesGroup54=gid54();renderMembers();renderQueue();if(currentView==='settings'){renderSettings();patchProfileCard54()}}catch(e){if(typeof showError==='function')showError(e)}};

async function syncLatest54(){const b=document.getElementById('headerRefresh52');if(!b)return;try{const r=await fetch('/latest-version.json?t='+Date.now(),{cache:'no-store'}),x=await r.json(),latest=String(x.semanticVersion||x.label||CUR54).replace(/^v/i,'');b.classList.toggle('v54hidden',latest===CUR54);if(latest!==CUR54)b.textContent=`v${latest} 업데이트 · 새로고침`}catch{b.classList.add('v54hidden')}}
function mark54(){document.title='콕매치 v6.0';document.documentElement.dataset.kokmatchVersion='6.0';const old=document.getElementById('currentVersion52');if(old&&old.textContent!=='v5.4'){const v=old.cloneNode(true);v.textContent='v5.4';old.replaceWith(v)}syncLatest54()}
const rq54=renderQueue;renderQueue=function(){ensureDraft54();const r=rq54();style54();mirrorPendingLayout54();decoratePhotoGender54();saveDraft54();mark54();return r};
const ra54=renderAll;renderAll=function(){ensureDraft54();const r=ra54();style54();try{mirrorPendingLayout54();decoratePhotoGender54();if(currentView==='settings')patchProfileCard54()}catch{}saveDraft54();mark54();const g=gid54();if(T&&g&&g!=='__global__'&&profilesGroup54!==g)queueMicrotask(()=>loadProfiles54().catch(()=>{}));return r};
const rs54=renderSettings;renderSettings=function(){const r=rs54();style54();patchProfileCard54();return r};
const gv54=goView;goView=function(id){const r=gv54(id);if(id==='settings'){patchProfileCard54();loadProfiles54().catch(()=>{})}return r};
style54();ensureDraft54();setTimeout(()=>{mark54();try{renderQueue();if(currentView==='settings')patchProfileCard54();if(T)loadProfiles54(true)}catch{}},0);setInterval(()=>{mark54();syncLatest54()},30000);
})();

/* migrated into v6.0: app-v5.4-fix4.js */
(()=>{
if(window.__kokmatchV54Fix4)return;window.__kokmatchV54Fix4=true;
window.__kokmatchV54Fix6=true;
window.__kokmatchV54Fix8=true;
window.__kokmatchV54Fix9=true;
window.__kokmatchV54Fix10=true;
window.__kokmatchV54Fix18=true;
window.__kokmatchV54Fix19=true;
window.__kokmatchV54Fix20=true;
window.__kokmatchLegacyProfileRemappersDisabled=true;
function alignQueue54(){
 const box=typeof $==='function'?$('queue'):document.getElementById('queue');if(!box)return;
 const slots=[...box.querySelectorAll('.composer54 .pendingSlot')];
 slots.forEach(s=>{
  s.classList.add('pendingSlot53','pendingSlot54');
  if(s.classList.contains('filled'))s.classList.add('clickable','hasX53');
  const name=s.querySelector('.slotName');if(name)name.classList.add('slotName53');
  const meta=s.querySelector('.meta');if(meta)meta.classList.add('compactMeta53');
  const x=s.querySelector('.pendingX');if(x)x.classList.add('pendingX53');
 });
 const grid=box.querySelector('.composer54 .slots');if(grid)grid.classList.add('pendingGrid');
}
const rq=renderQueue;renderQueue=function(){const r=rq();alignQueue54();return r};
const ra=renderAll;renderAll=function(){const r=ra();alignQueue54();return r};
alignQueue54();setTimeout(alignQueue54,0);
})();

(()=>{
if(window.__kokmatchV54KakaoLoginFix)return;
window.__kokmatchV54KakaoLoginFix='1.0';
const baseLoadStateKakao54=typeof loadState==='function'?loadState:null;
const baseOpenEntryKakao54=typeof openEntry==='function'?openEntry:null;
const uaKakao54=String(navigator.userAgent||'');
const shouldResume54=/iPhone|iPad|iPod|KAKAOTALK|Kakao/i.test(uaKakao54);
const RESUME_KEY54='kokmatch_kakao_login_resume_v54';
function sleepKakao54(ms){return new Promise(r=>setTimeout(r,ms))}
function hasSavedToken54(){try{return !!String(T||localStorage.getItem(TOKEN_KEY)||localStorage.getItem('kokmatch_token')||'').trim()}catch{return !!String(T||'').trim()}}
function clearResumeGuard54(){try{sessionStorage.removeItem(RESUME_KEY54)}catch{}}
function resumeOnce54(reason){if(!shouldResume54||!hasSavedToken54())return false;try{const prev=Number(sessionStorage.getItem(RESUME_KEY54)||0),now=Date.now();if(prev&&now-prev<12000)return false;sessionStorage.setItem(RESUME_KEY54,String(now));console.warn('콕매치 카카오 로그인 후처리 재진입',reason||'state');location.replace('/?loginresume='+now);return true}catch{return false}}
if(baseLoadStateKakao54){
 loadState=async function(...args){let last=null;for(const wait of [0,180,420]){if(wait)await sleepKakao54(wait);try{const r=await baseLoadStateKakao54.apply(this,args);clearResumeGuard54();return r}catch(e){last=e;if(!hasSavedToken54())throw e;if(me&&group){try{if(typeof normalizeClient==='function')normalizeClient()}catch{};try{if(typeof renderAll==='function'){renderAll();clearResumeGuard54();return}}catch{};break}}}if(resumeOnce54(last?.message||'loadState'))return new Promise(()=>{});throw last||new Error('로그인 후 화면을 불러오지 못했습니다.')};
 try{window.loadState=loadState}catch{}
}
if(baseOpenEntryKakao54){openEntry=function(...args){try{return baseOpenEntryKakao54.apply(this,args)}catch(e){console.warn('콕매치 입장창 표시 지연',e);return null}};try{window.openEntry=openEntry}catch{}}
window.addEventListener('pageshow',()=>{if(me&&group)clearResumeGuard54()});
})();

(()=>{
if(window.__kokmatchV54FinalProfileBridge4)return;window.__kokmatchV54FinalProfileBridge4=true;
const add=(src,onload)=>{const s=document.createElement('script');s.src=src;s.async=false;s.onload=onload||null;s.onerror=()=>console.error('콕매치 최종 회원명부 보정 로드 실패',src);document.body.appendChild(s)};
const load26=()=>window.__kokmatchV54Fix26?null:add('/app-v5.4-fix26.js?v=26.0&t='+Date.now());
const load25=()=>window.__kokmatchV54Fix25?load26():add('/app-v5.4-fix25.js?v=25.1&t='+Date.now(),load26);
const load24=()=>window.__kokmatchV54Fix24?load25():add('/app-v5.4-fix24.js?v=24.1&t='+Date.now(),load25);
const load23=()=>window.__kokmatchV54Fix23?load24():add('/app-v5.4-fix23.js?v=23.1&t='+Date.now(),load24);
const load22=()=>window.__kokmatchV54Fix22?load23():add('/app-v5.4-fix22.js?v=22.2&t='+Date.now(),load23);
let tries=0;const timer=setInterval(()=>{
 if(window.__kokmatchV54Fix21){clearInterval(timer);load22();return}
 if(window.__kokmatchV54Fix5&&window.__kokmatchV54KakaoLoginFix){clearInterval(timer);add('/app-v5.4-fix21.js?v=21.2&t='+Date.now(),load22);return}
 if(++tries>=200)clearInterval(timer)
},25);
})();

/* migrated into v6.0: app-v5.4-fix5.js */
(()=>{
if(window.__kokmatchV54Fix5)return;window.__kokmatchV54Fix5=true;
function badge5(m){if(m?.type==='guest')return '<span class="roleBadge guest45">게스트</span>';return typeof roleBadge==='function'?String(roleBadge(m)||''):''}
function genderName5(m){const female=m?.gender==='여',label=female?'여성':'남성';return `<span class="nameGender58 ${female?'female':'male'}" title="${label}" aria-label="${label}"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="7" r="4"></circle><path d="M4.5 21c.5-5 3.2-8 7.5-8s7 3 7.5 8z"></path></svg></span>`}
function invite5(m){const v=m?.type==='guest'?String(m?.inviter||'').trim():'';return `<span class="inviteReserve54 relationEmpty66 queueInviteEmpty55${v?' hasInvite54':''}">${v?`초대 ${esc(v)}`:'&nbsp;'}</span>`}
function slot5(id,i){const m=id&&typeof M==='function'?M(id):null;if(!m)return `<div class="pendingSlot emptySlot pendingEmpty54"><span>＋ 빈자리</span><span class="inviteReserve54 relationEmpty66 queueInviteEmpty55">&nbsp;</span></div>`;return `<div class="pendingSlot pendingSlot53 pendingSlot54 clickable hasX53"><button class="pendingX" type="button" onclick="event.stopPropagation();draftRemove(${i})">×</button><div class="slotTop53"><span class="slotLabel">${i<2?'A팀':'B팀'} ${i%2+1}</span><span class="slotBadges53 slotBadges54 slotBadges58">${badge5(m)}</span></div><div class="slotName slotName53">${genderName5(m)}<span class="compactName53">${esc(m.name)}</span>${ageTag(m)}</div><div class="meta compactMeta53">게임 ${dailyCount(id)}회 · ${waitMins(m)}분 대기</div>${invite5(m)}</div>`}
function equalizeHeight5(grid){if(!grid)return;requestAnimationFrame(()=>{[...grid.querySelectorAll('.pendingSlot')].forEach(s=>{const mh=getComputedStyle(s).minHeight;if(mh&&mh!=='0px'&&mh!=='auto'){s.style.boxSizing='border-box';s.style.height=mh}})})}
function mirror5(){const box=typeof $==='function'?$('queue'):document.getElementById('queue');if(!box||!Array.isArray(draft))return;const comp=box.querySelector('.composer54,.composer');if(!comp)return;comp.classList.add('composer54','card','pendingCard','pendingCard53','pendingCard54');comp.classList.remove('composer');let title=comp.querySelector('.composerTitle');if(title){const head=document.createElement('div');head.className='pendingHead';head.innerHTML='<b>새 게임 편성</b>';title.replaceWith(head)}const grid=comp.querySelector('.slots,.pendingGrid');if(grid){grid.className='pendingGrid';grid.innerHTML=draft.slice(0,4).map(slot5).join('');equalizeHeight5(grid)}const acts=comp.querySelector('.composerActs,.pendingActs');if(acts)acts.className='pendingActs'}
const rq=renderQueue;renderQueue=function(){const r=rq();mirror5();return r};const ra=renderAll;renderAll=function(){const r=ra();mirror5();return r};mirror5();setTimeout(mirror5,0);
})();

/* migrated into v6.0: app-v5.4-kakao-login-fix.js */
(()=>{
if(window.__kokmatchV54KakaoLoginFix)return;
window.__kokmatchV54KakaoLoginFix='1.0';
window.__kokmatchVersionLock='6.0';

const baseLoadStateKakao54=typeof loadState==='function'?loadState:null;
const baseOpenEntryKakao54=typeof openEntry==='function'?openEntry:null;
const uaKakao54=String(navigator.userAgent||'');
const isIOS54=/iPhone|iPad|iPod/i.test(uaKakao54);
const isKakao54=/KAKAOTALK|Kakao/i.test(uaKakao54);
const shouldResume54=isIOS54||isKakao54;
const RESUME_KEY54='kokmatch_kakao_login_resume_v54';

function sleepKakao54(ms){return new Promise(r=>setTimeout(r,ms))}
function hasSavedToken54(){
 try{return !!String(T||localStorage.getItem(TOKEN_KEY)||localStorage.getItem('kokmatch_token')||'').trim()}catch{return !!String(T||'').trim()}
}
function clearResumeGuard54(){try{sessionStorage.removeItem(RESUME_KEY54)}catch{}}
function resumeOnce54(reason){
 if(!shouldResume54||!hasSavedToken54())return false;
 try{
  const prev=Number(sessionStorage.getItem(RESUME_KEY54)||0);
  const now=Date.now();
  if(prev&&now-prev<12000)return false;
  sessionStorage.setItem(RESUME_KEY54,String(now));
  console.warn('콕매치 카카오 로그인 후처리 재진입',reason||'state');
  location.replace('/?loginresume='+now);
  return true;
 }catch{return false}
}

if(baseLoadStateKakao54){
 loadState=async function(...args){
  let last=null;
  const waits=[0,180,420];
  for(let i=0;i<waits.length;i++){
   if(waits[i])await sleepKakao54(waits[i]);
   try{
    const r=await baseLoadStateKakao54.apply(this,args);
    clearResumeGuard54();
    return r;
   }catch(e){
    last=e;
    if(!hasSavedToken54())throw e;
    // 인증/상태 데이터까지 받은 뒤 렌더링 단계에서 난 예외도 한 번 더 복구한다.
    if(me&&group){
     try{if(typeof normalizeClient==='function')normalizeClient()}catch{}
     try{if(typeof renderAll==='function'){renderAll();clearResumeGuard54();return}}catch{}
     break;
    }
   }
  }
  if(resumeOnce54(last?.message||'loadState'))return new Promise(()=>{});
  throw last||new Error('로그인 후 화면을 불러오지 못했습니다.');
 };
 try{window.loadState=loadState}catch{}
}

if(baseOpenEntryKakao54){
 openEntry=function(...args){
  try{return baseOpenEntryKakao54.apply(this,args)}
  catch(e){console.warn('콕매치 입장창 표시 지연',e);return null}
 };
 try{window.openEntry=openEntry}catch{}
}

window.addEventListener('pageshow',()=>{
 if(me&&group)clearResumeGuard54();
});
})();

/* migrated into v6.0: app-v5.4-fix21.js */
(()=>{
'use strict';
if(window.__kokmatchV54Fix21)return;
window.__kokmatchV54Fix21=true;
window.__kokmatchProfileCanonical='21.2';
window.__kokmatchProfileFixReady='21.2';
window.__kokmatchProfilePatch='21.2';

const API='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-profile-v53';
const photos=new Map();
let loadedKey='',loading=null,seq=0,refreshing=false;

function e(v){return String(v??'').replace(/[&"<>]/g,c=>({'&':'&amp;','"':'&quot;','<':'&lt;','>':'&gt;'}[c]))}
function gid(){try{return String(currentGroupId||'')}catch{return''}}
function token(){try{return String(T||'')}catch{return''}}
function member(id){try{return id&&typeof M==='function'?M(String(id)):null}catch{return null}}
function gender(m){return String(m?.gender||'').trim()==='여'?'여':'남'}
function photo(m){return String(photos.get(String(m?.id||''))||'')}
function currentMember(){const id=String(me?.memberId||'').trim();return id?member(id):null}
function iconSvg(){return '<svg class="genderPersonIcon21" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="7" r="4"></circle><path d="M4.5 21c.55-5.05 3.2-8 7.5-8s6.95 2.95 7.5 8z"></path></svg>'}
function identityHtml(m,extra=''){
 const g=gender(m),f=g==='여',src=photo(m),id=String(m?.id||'');
 if(src)return `<div class="avatar profileIdentity21 hasPhoto21 ${f?'female':'male'} ${extra}" data-member-id="${e(id)}" data-gender="${g}" data-photo="1" role="button" tabindex="0" aria-label="${e(m?.name||'회원')} 프로필 사진 크게 보기"><img src="${e(src)}" alt="${e(m?.name||'프로필')} 프로필" draggable="false"></div>`;
 return `<div class="avatar profileIdentity21 noPhoto21 ${f?'female':'male'} ${extra}" data-member-id="${e(id)}" data-gender="${g}" data-photo="0" aria-label="${f?'여성':'남성'}">${iconSvg()}</div>`;
}
function avatar21(m){return identityHtml(m)}
function installAvatar(){try{avatar=avatar21}catch{}try{window.avatar=avatar21}catch{}}

function installCss(){if(document.getElementById('v54fix21style'))return;const s=document.createElement('style');s.id='v54fix21style';s.textContent=`
.profileIdentity21{position:relative!important;display:grid!important;place-items:center!important;border-radius:50%!important;overflow:hidden!important;flex:0 0 auto!important;-webkit-touch-callout:none!important;-webkit-user-select:none!important;user-select:none!important}
.profileIdentity21 img{width:100%!important;height:100%!important;object-fit:cover!important;display:block!important;border-radius:50%!important;pointer-events:none!important;-webkit-user-drag:none!important}
.profileIdentity21.noPhoto21{background:#eef3fb!important;border:1px solid #ccd7e8!important}
.profileIdentity21.noPhoto21.male{background:#eaf2ff!important;color:#2768e8!important;border-color:#b8cef9!important}
.profileIdentity21.noPhoto21.female{background:#fff0f4!important;color:#e34e67!important;border-color:#f4bdc9!important}
.genderPersonIcon21{width:58%!important;height:58%!important;display:block!important;fill:currentColor!important}
.memberCard>.profileIdentity21{width:50px!important;height:50px!important;min-width:50px!important}
.queueCard>.profileIdentity21{width:44px!important;height:44px!important;min-width:44px!important;margin:0!important}
.profilePreview53 .profileFallback21{width:100%!important;height:100%!important;min-height:64px!important;border-radius:50%!important;display:grid!important;place-items:center!important;overflow:hidden!important}
.profilePreview53 .profileFallback21.male{background:#eaf2ff!important;color:#2768e8!important;border:1px solid #b8cef9!important}.profilePreview53 .profileFallback21.female{background:#fff0f4!important;color:#e34e67!important;border:1px solid #f4bdc9!important}
.profilePreview53 .profileFallback21 .genderPersonIcon21{width:54%!important;height:54%!important}
#profileModal21{position:fixed;inset:0;z-index:1200;display:none;align-items:center;justify-content:center;background:#080d19ed;padding:18px;backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px)}#profileModal21.on{display:flex}.profileSheet21{position:relative;width:min(760px,96vw);max-height:94vh;display:flex;flex-direction:column;align-items:center;gap:9px}.profileImg21{display:block;max-width:94vw;max-height:84vh;width:auto;height:auto;object-fit:contain;border-radius:14px;background:#fff;box-shadow:0 18px 56px #0008;-webkit-touch-callout:none!important;-webkit-user-select:none!important;user-select:none!important}.profileClose21{position:absolute;right:0;top:-6px;width:40px;height:40px;border:0;border-radius:50%;background:#fffffff2;color:#172033;font-size:25px;font-weight:900;display:grid;place-items:center}.profileName21{color:#fff;font-size:14px;font-weight:900}.profileState21{color:#dfe6f3;font-size:11px;min-height:16px}
@media(max-width:599px){.memberCard>.profileIdentity21{width:46px!important;height:46px!important;min-width:46px!important}.queueCard>.profileIdentity21{width:42px!important;height:42px!important;min-width:42px!important}}
`;document.head.appendChild(s)}

function cleanMemberLegacy(){const box=document.getElementById('members');if(!box)return;box.querySelectorAll('.v54genderText,.genderMark53').forEach(x=>x.remove())}
function decorateQueue(){const box=document.getElementById('queue');if(!box||typeof sortedQueue!=='function')return;const ids=sortedQueue();[...box.querySelectorAll('.queueCard')].forEach((card,i)=>{const m=member(ids[i]);if(!m)return;for(const x of [...card.children])if(x.classList?.contains('avatar')||x.classList?.contains('profileIdentity80')||x.classList?.contains('profileIdentity21')||x.classList?.contains('genderAvatar39')||x.classList?.contains('genderPerson54')||x.classList?.contains('genderMini39')||x.classList?.contains('v54genderText'))x.remove();card.querySelectorAll('.v54genderText').forEach(x=>x.remove());const ord=card.querySelector('.ord'),tmp=document.createElement('div');tmp.innerHTML=identityHtml(m,'queueProfile21');const el=tmp.firstElementChild;if(ord&&el)ord.insertAdjacentElement('afterend',el);else if(el)card.insertBefore(el,card.firstChild)})}

function ensureProfileControls(){const card=document.getElementById('profileCard53');if(!card)return;let inp=card.querySelector('#profileFile53');if(!inp){const holder=document.createElement('div');holder.className='profileBtns53 profileBtns21';holder.innerHTML='<label class="btn pri" for="profileFile53">사진 변경</label><input id="profileFile53" type="file" accept="image/*" style="display:none"><button id="profileDelete21" class="btn ghost" type="button">기본 사진으로</button>';card.appendChild(holder);inp=holder.querySelector('#profileFile53')}if(inp&&!inp.dataset.v21bound){inp.dataset.v21bound='1';inp.setAttribute('accept','image/*');inp.addEventListener('change',()=>window.changeProfile53(inp))}let del=card.querySelector('#profileDelete21');if(!del){const old=[...card.querySelectorAll('button')].find(b=>(b.textContent||'').includes('기본 사진으로'));if(old){old.id='profileDelete21';del=old}else{del=document.createElement('button');del.id='profileDelete21';del.type='button';del.className='btn ghost';del.textContent='기본 사진으로';(card.querySelector('.profileBtns53')||card).appendChild(del)}}if(del&&!del.dataset.v21bound){del.dataset.v21bound='1';del.addEventListener('click',()=>window.deleteProfile53())}if(!card.querySelector('#profileStatus21')){const st=document.createElement('div');st.id='profileStatus21';st.className='profileHelp53';st.style.fontWeight='700';st.style.marginTop='8px';card.appendChild(st)}}
function setStatus(text,bad=false){const st=document.getElementById('profileStatus21')||document.getElementById('profileStatus65');if(st){st.textContent=text||'';st.style.color=bad?'#b42318':'#667085'}}
function patchSettings(){const preview=document.querySelector('#profileCard53 .profilePreview53');if(!preview)return;ensureProfileControls();const m=currentMember();if(!m){preview.innerHTML='';preview.dataset.profile21='';return}const g=gender(m),f=g==='여',src=photo(m),sig=`${m.id}|${g}|${src}`;if(preview.dataset.profile21!==sig){preview.dataset.profile21=sig;preview.innerHTML=src?`<img src="${e(src)}" alt="내 프로필 사진" draggable="false">`:`<div class="profileFallback21 ${f?'female':'male'}" aria-label="${f?'여성':'남성'}">${iconSvg()}</div>`}const del=document.getElementById('profileDelete21');if(del)del.style.display=src?'':'none';const label=document.querySelector('label[for="profileFile53"]');if(label&&!(label.textContent||'').includes('중')&&!(label.textContent||'').includes('저장'))label.textContent='사진 변경'}

function refreshCurrent(){if(refreshing)return;refreshing=true;try{installAvatar();if(currentView==='members'&&typeof renderMembers==='function')renderMembers();else if(currentView==='queue'&&typeof renderQueue==='function')renderQueue();else if(currentView==='settings'&&typeof renderSettings==='function')renderSettings();else{cleanMemberLegacy();decorateQueue();patchSettings()}}catch(e){console.warn('profile21 refresh',e)}finally{refreshing=false}}
async function loadProfiles(force=false){const g=gid(),t=token(),key=g+'|'+t;if(!g||g==='__global__'||!t){loadedKey=key;photos.clear();window.__kokmatchProfilesLoaded21=g;refreshCurrent();return}if(!force&&loadedKey===key&&window.__kokmatchProfilesLoaded21===g)return;if(loading&&!force)return loading;loadedKey=key;window.__kokmatchProfilesLoaded21='';const mine=++seq;loading=(async()=>{try{const u=new URL(API);u.searchParams.set('groupId',g);u.searchParams.set('t',Date.now());const r=await fetch(u,{headers:{authorization:'Bearer '+t},cache:'no-store'}),x=await r.json().catch(()=>({}));if(!r.ok)throw new Error(x.error||'프로필 조회 실패');if(mine!==seq||gid()!==g||token()!==t)return;photos.clear();for(const [id,v] of Object.entries(x?.profiles||{})){const src=String(v?.image||'');if(src)photos.set(String(id),src)}window.__kokmatchProfilesLoaded21=g;refreshCurrent()}catch(err){console.warn('profile21',err);if(mine===seq){photos.clear();window.__kokmatchProfilesLoaded21=g;refreshCurrent()}}finally{if(mine===seq)loading=null}})();return loading}
function ensureProfiles(){installAvatar();const key=gid()+'|'+token();if(key!==loadedKey||window.__kokmatchProfilesLoaded21!==gid())loadProfiles(false).catch(()=>{})}

function modal(){let m=document.getElementById('profileModal21');if(m)return m;m=document.createElement('div');m.id='profileModal21';m.innerHTML='<div class="profileSheet21"><button class="profileClose21" type="button" aria-label="닫기">×</button><img class="profileImg21" alt="프로필 사진 크게 보기" draggable="false"><div class="profileName21"></div><div class="profileState21"></div></div>';m.addEventListener('click',ev=>{if(ev.target===m)closeModal()});m.querySelector('.profileClose21')?.addEventListener('click',closeModal);document.body.appendChild(m);return m}
function closeModal(){document.getElementById('profileModal21')?.classList.remove('on');try{document.body.style.overflow=''}catch{}}
async function openModal(el){if(!el||el.dataset.photo!=='1')return;const id=String(el.dataset.memberId||''),m=member(id),thumb=String(el.querySelector('img')?.getAttribute('src')||'');if(!id||!thumb)return;const d=modal(),im=d.querySelector('.profileImg21'),nm=d.querySelector('.profileName21'),st=d.querySelector('.profileState21');im.src=thumb;nm.textContent=String(m?.name||'');st.textContent='고화질 사진 불러오는 중…';d.classList.add('on');try{document.body.style.overflow='hidden'}catch{}try{const u=new URL(API);u.searchParams.set('groupId',gid());u.searchParams.set('memberId',id);u.searchParams.set('full','1');u.searchParams.set('t',Date.now());const r=await fetch(u,{headers:{authorization:'Bearer '+token()},cache:'no-store'}),x=await r.json().catch(()=>({}));const full=String(x.fullImage||x.image||thumb);if(d.classList.contains('on'))im.src=full;st.textContent=full!==thumb?'고화질 보기':'저장된 프로필 사진 보기'}catch{st.textContent='저장된 프로필 사진 보기'}}
window.openProfilePhoto21=openModal;window.closeProfilePhoto21=closeModal;

function fileData(file){return new Promise((res,rej)=>{const r=new FileReader();r.onerror=rej;r.onload=()=>res(String(r.result||''));r.readAsDataURL(file)})}
function img(src){return new Promise((res,rej)=>{const im=new Image();im.onload=()=>res(im);im.onerror=rej;im.src=src})}
async function source(file){if(typeof createImageBitmap==='function')try{return await createImageBitmap(file)}catch{}return await img(await fileData(file))}
function jpeg(src,maxSide,q,crop=false){const w=src.width||src.naturalWidth,h=src.height||src.naturalHeight;if(!w||!h)throw new Error('사진 크기를 확인해주세요.');const c=document.createElement('canvas'),g=c.getContext('2d');if(!g)throw new Error('사진 처리 기능을 사용할 수 없습니다.');if(crop){const z=Math.min(w,h);c.width=c.height=maxSide;g.fillStyle='#fff';g.fillRect(0,0,maxSide,maxSide);g.drawImage(src,(w-z)/2,(h-z)/2,z,z,0,0,maxSide,maxSide)}else{const sc=Math.min(1,maxSide/Math.max(w,h));c.width=Math.max(1,Math.round(w*sc));c.height=Math.max(1,Math.round(h*sc));g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height);g.drawImage(src,0,0,w,h,0,0,c.width,c.height)}return c.toDataURL('image/jpeg',q)}
async function post(body){const r=await fetch(API,{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+token()},body:JSON.stringify(body),cache:'no-store'}),x=await r.json().catch(()=>({}));if(!r.ok)throw new Error(x.error||'프로필 저장 실패');return x}
window.changeProfile53=async function(input){const file=input?.files?.[0];if(!file)return;if(file.size>30*1024*1024){setStatus('원본 사진은 30MB 이하만 사용할 수 있습니다.',true);input.value='';return}try{setStatus('사진 처리 중…');const src=await source(file);let thumb=jpeg(src,256,.82,true),full=jpeg(src,2048,.9,false);for(const q of [.84,.78,.72,.66]){if(full.length<=2350000)break;full=jpeg(src,2048,q,false)}if(full.length>2450000)full=jpeg(src,1600,.78,false);if(thumb.length>220000)thumb=jpeg(src,256,.62,true);if(thumb.length>220000||full.length>2500000)throw new Error('사진 용량을 줄인 뒤 다시 선택해주세요.');await post({action:'save_profile',groupId:gid(),image:thumb,fullImage:full});try{src.close?.()}catch{}await loadProfiles(true);setStatus('프로필 사진 저장 완료')}catch(err){setStatus(err?.message||'프로필 사진 저장에 실패했습니다.',true)}finally{if(input)input.value=''}};
window.deleteProfile53=async function(){try{setStatus('프로필 사진 삭제 중…');await post({action:'delete_profile',groupId:gid()});await loadProfiles(true);setStatus('기본 프로필로 변경 완료')}catch(err){setStatus(err?.message||'프로필 삭제에 실패했습니다.',true)}};
try{changeProfile53=window.changeProfile53;deleteProfile53=window.deleteProfile53}catch{}

try{
 const rm=renderMembers;renderMembers=function(){installAvatar();const r=rm();cleanMemberLegacy();ensureProfiles();return r};
 const rq=renderQueue;renderQueue=function(){installAvatar();const r=rq();decorateQueue();ensureProfiles();return r};
 const rs=renderSettings;renderSettings=function(){installAvatar();const r=rs();patchSettings();ensureProfiles();return r};
 const ra=renderAll;renderAll=function(){installAvatar();const r=ra();cleanMemberLegacy();decorateQueue();if(currentView==='settings')patchSettings();ensureProfiles();return r};
}catch(err){console.warn('profile21 wrap',err)}

if(!window.__kokmatchProfileEvents21){window.__kokmatchProfileEvents21=true;window.addEventListener('click',ev=>{const t=ev.target instanceof Element?ev.target:null,el=t?.closest?.('.profileIdentity21');if(!el||!el.closest('#members,#queue'))return;if(el.dataset.photo==='1'){ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();openModal(el)}},true);window.addEventListener('contextmenu',ev=>{const t=ev.target instanceof Element?ev.target:null;if(t?.closest?.('.profileIdentity21,#profileModal21')){ev.preventDefault();ev.stopImmediatePropagation()}},true);window.addEventListener('dragstart',ev=>{const t=ev.target instanceof Element?ev.target:null;if(t?.closest?.('.profileIdentity21,#profileModal21'))ev.preventDefault()},true);window.addEventListener('keydown',ev=>{if(ev.key==='Escape')closeModal()})}

function boot(){installCss();installAvatar();cleanMemberLegacy();decorateQueue();if(currentView==='settings')patchSettings();ensureProfiles();setTimeout(()=>{installAvatar();refreshCurrent()},250)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();

/* v6.0 canonical member roster */
(()=>{
'use strict';
if(window.__kokmatchV54Fix22)return;
window.__kokmatchV54Fix22=true;
window.__kokmatchRosterCanonical='22.3';
window.__kokmatchRosterCanonicalV6='6.0.3';
document.documentElement.dataset.kokmatchRoster='6.0.3';

function e22(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function jsId22(id){return String(id||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'")}
function getMember22(id){try{return typeof M==='function'?M(String(id||'')):null}catch{return null}}
function inviter22(m){return m?.type==='guest'?String(m?.inviter||'').trim():''}
function grade22(m){const c=String(m?.cls||'C').trim().toUpperCase(),safe=['A','B','C','D','E'].includes(c)?c:'C';return `<span class="tag gradeBadge50 grade-${safe.toLowerCase()}50">${e22(m?.age||'30')}${e22(safe)}</span>`}
function roleBadge22(m){
 if(m?.type==='guest')return '<span class="roleBadge guest45">게스트</span>';
 const r=String(m?.role||'member');
 if(r==='admin')return '<span class="roleBadge role-global">개발자</span>';
 if(r==='manager')return '<span class="roleBadge role-manager">모임장</span>';
 if(r==='organizer')return '<span class="roleBadge role-organizer">운영진</span>';
 try{if(typeof isTemp==='function'&&isTemp(m))return '<span class="roleBadge role-temp">편성자</span>'}catch{}
 return '<span class="roleBadge role-member44">일반</span>';
}
function userFirst22(list){const a=Array.isArray(list)?list:[],id=String(me?.memberId||'');if(!id)return a.slice();const mine=a.find(m=>String(m?.id||'')===id);return mine?[mine,...a.filter(m=>String(m?.id||'')!==id)]:a.slice()}
function replaceAvatar22(card,m){
 if(!card||!m||typeof avatar!=='function')return;
 let html='';try{html=String(avatar(m)||'')}catch{}
 if(!html)return;
 const tmp=document.createElement('div');tmp.innerHTML=html;const next=tmp.firstElementChild;if(!next)return;
 next.dataset.memberId22=String(m.id||'');
 const cur=[...card.children].find(el=>el?.classList?.contains('avatar'))||card.querySelector('.profileIdentity21,.profileIdentity80,.genderAvatar39,.genderPerson54');
 if(cur)cur.replaceWith(next);else card.insertBefore(next,card.firstChild);
}
function replaceControls22(card,m){
 if(!card||!m||typeof memberControls!=='function')return;
 let html='';try{html=String(memberControls(m)||'')}catch{}
 if(!html)return;
 const tmp=document.createElement('div');tmp.innerHTML=html;const next=tmp.firstElementChild;if(!next)return;
 const kids=[...card.children];const old=kids.length>=3?kids[kids.length-1]:null;
 if(old&&old!==card.querySelector('.memberInfo48')&&!old.classList.contains('avatar'))old.replaceWith(next);else card.appendChild(next);
}
function patchActions22(card,m){
 const id=String(m?.id||'');if(!id)return;const safe=jsId22(id);
 const pair=card.querySelector('.pairBtn');if(pair)pair.setAttribute('onclick',`openPairs('${safe}')`);
 card.querySelectorAll('button[onclick]').forEach(btn=>{
  const raw=String(btn.getAttribute('onclick')||'');
  if(/^\s*setOther\s*\(/.test(raw)){
   const state=(raw.match(/setOther\s*\(\s*['"][^'"]*['"]\s*,\s*['"]([^'"]+)['"]/)||[])[1];
   if(state)btn.setAttribute('onclick',`setOther('${safe}','${state}')`);
  }else if(/^\s*openEditMember\s*\(/.test(raw))btn.setAttribute('onclick',`openEditMember('${safe}')`);
 });
}
function businessMonth22(){const d=new Date(Date.now()-5*60*60*1000);return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit'}).format(d)}
function monthLabel22(){return Number(businessMonth22().slice(5,7))+'월'}
function attendanceCount22(m){const k=businessMonth22(),h=m?.attendanceHistory&&typeof m.attendanceHistory==='object'&&!Array.isArray(m.attendanceHistory)?m.attendanceHistory:null;if(h&&h[k]!=null)return Math.max(0,Number(h[k])||0);return String(m?.attendanceMonth||'')===k?Math.max(0,Number(m?.attendanceCount)||0):0}
function canPartner22(m){return !!m&&!!me&&(String(me.memberId||'')===String(m.id)||me.globalAdmin||me.role==='manager'||me.role==='organizer')}
function businessMonth22(){const d=new Date(Date.now()-5*60*60*1000);return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit'}).format(d)}
function monthLabel22(){return Number(businessMonth22().slice(5,7))+'월'}
function attendanceCount22(m){const k=businessMonth22(),h=m?.attendanceHistory&&typeof m.attendanceHistory==='object'&&!Array.isArray(m.attendanceHistory)?m.attendanceHistory:null;if(h&&h[k]!=null)return Math.max(0,Number(h[k])||0);return String(m?.attendanceMonth||'')===k?Math.max(0,Number(m?.attendanceCount)||0):0}
function canPartner22(m){return !!m&&!!me&&(String(me.memberId||'')===String(m.id)||me.globalAdmin||me.role==='manager'||me.role==='organizer')}
function businessMonth22(){const d=new Date(Date.now()-5*60*60*1000);return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit'}).format(d)}
function monthLabel22(){return Number(businessMonth22().slice(5,7))+'월'}
function attendanceCount22(m){const k=businessMonth22(),h=m?.attendanceHistory&&typeof m.attendanceHistory==='object'&&!Array.isArray(m.attendanceHistory)?m.attendanceHistory:null;if(h&&h[k]!=null)return Math.max(0,Number(h[k])||0);return String(m?.attendanceMonth||'')===k?Math.max(0,Number(m?.attendanceCount)||0):0}
function canPartner22(m){return !!m&&!!me&&(String(me.memberId||'')===String(m.id)||me.globalAdmin||me.role==='manager'||me.role==='organizer')}
function businessMonth22(){const d=new Date();return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit'}).format(d)}
function monthLabel22(){return Number(businessMonth22().slice(5,7))+'월'}
function attendanceCount22(m){const k=businessMonth22(),h=m?.attendanceHistory&&typeof m.attendanceHistory==='object'&&!Array.isArray(m.attendanceHistory)?m.attendanceHistory:null;if(h&&h[k]!=null)return Math.max(0,Number(h[k])||0);return String(m?.attendanceMonth||'')===k?Math.max(0,Number(m?.attendanceCount)||0):0}
function canPartner22(m){return !!m&&!!me&&(String(me.memberId||'')===String(m.id)||me.globalAdmin||me.role==='manager'||me.role==='organizer')}
function patchVisibleInfo22(card,m){
 const info=card.querySelector('.memberInfo48')||card.children?.[1];if(!info)return;info.classList.add('memberInfoV6');
 const line=info.querySelector('.memberMainLine45')||info.querySelector('.name');if(line){line.classList.add('memberMainLine45');line.innerHTML="<span class='memberName45'>"+e22(m.name)+"</span>"+grade22(m)+roleBadge22(m)}
 info.querySelectorAll('.gamecnt,.recordBtn73,.pairBtn,.memberAttendance71,.memberRecordActions73').forEach(x=>x.remove());
 const meta=info.querySelector(':scope > .meta')||info.querySelector('.meta');if(meta){meta.classList.add('memberMetaV6');meta.innerHTML=e22(m.year||'')+'년생 · '+e22(m.gender||'')}
 info.querySelectorAll('.memberRosterFooterV6').forEach(x=>x.remove());
 const footer=document.createElement('div');footer.className='memberRosterFooterV6';footer.innerHTML="<span class='memberAttendanceV6'>"+monthLabel22()+' 출석 '+attendanceCount22(m)+"회</span>"+(canPartner22(m)?"<button type='button' class='partnerSetBtn66 rosterPartnerBtnV6'>파트너 설정</button>":'');info.appendChild(footer);
 const pb=footer.querySelector('.rosterPartnerBtnV6');if(pb){pb.dataset.memberId=String(m.id||'');pb.setAttribute('aria-label',String(m.name||'')+' 파트너 설정')}
 card.dataset.gradeV6=String(m?.cls||'C').trim().toUpperCase();card.dataset.memberId22=String(m?.id||'');card.dataset.memberId=String(m?.id||'');card.querySelectorAll('.v54genderText,.genderMark53').forEach(x=>x.remove());
}
function finalizeRoster22(){
 const box=document.getElementById('members');if(!box)return;
 const cards=[...box.querySelectorAll('.memberCard')],seen=[];
 cards.forEach(card=>{
  const id=String(card.dataset.memberId46||card.dataset.memberId22||'');const m=getMember22(id);if(!m)return;
  seen.push(id);
  card.dataset.memberId22=id;card.dataset.gender22=String(m.gender||'');card.dataset.grade22=String(m.cls||'');card.dataset.role22=String(m.role||'member');
  patchVisibleInfo22(card,m);replaceAvatar22(card,m);replaceControls22(card,m);patchActions22(card,m);
 });
 window.__kokmatchVisibleMemberIds22=seen;
 window.__kokmatchRosterFinalizedAt22=Date.now();
}
window.__kokmatchFinalizeRoster22=finalizeRoster22;

const rm22=renderMembers;
renderMembers=function(){
 let original=null,reordered=false;
 try{if(Array.isArray(S?.members)&&S.members.length&&me?.memberId){original=S.members;const next=userFirst22(original);if(next.length===original.length&&next.some((m,i)=>m!==original[i])){S.members=next;reordered=true}}}catch{}
 try{const r=rm22();finalizeRoster22();requestAnimationFrame(finalizeRoster22);return r}finally{if(reordered&&original)S.members=original}
};
try{window.renderMembers=renderMembers}catch{}

const ra22=renderAll;
renderAll=function(){const r=ra22();if(currentView==='members'){finalizeRoster22();requestAnimationFrame(finalizeRoster22)}return r};
try{window.renderAll=renderAll}catch{}

const originalPageGo22=window.memberPageGo46;
if(typeof originalPageGo22==='function')window.memberPageGo46=function(p){const r=originalPageGo22(p);finalizeRoster22();requestAnimationFrame(finalizeRoster22);setTimeout(finalizeRoster22,40);return r};
const originalSearch22=window.searchMembers46;
if(typeof originalSearch22==='function')window.searchMembers46=function(v){const r=originalSearch22(v);finalizeRoster22();requestAnimationFrame(finalizeRoster22);return r};

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(finalizeRoster22,0),{once:true});else setTimeout(finalizeRoster22,0);
})();








/* V6_ROSTER_REENTRY_BEGIN */
(()=>{'use strict';let busy=false;async function repair(){if(busy||currentView!=='members')return;busy=true;try{const input=document.getElementById('memberSearchInput46');if(input)input.value='';try{window.__kokmatchMemberPage46=1}catch{}if(typeof window.enterMembers42==='function'){await window.enterMembers42(true)}else if(typeof window.refreshMembers46==='function'){await window.refreshMembers46()}else if(typeof renderMembers==='function'){renderMembers()}try{window.resetMemberList46?.()}catch{}try{window.__kokmatchFinalizeRoster22?.()}catch{}}catch(e){console.warn('v6 roster reentry',e);try{typeof renderMembers==='function'&&renderMembers();window.__kokmatchFinalizeRoster22?.()}catch{}}finally{busy=false}}const old=goView;goView=function(id,...args){const was=currentView,r=old(id,...args);if(id==='members'&&was!=='members'){queueMicrotask(()=>repair());requestAnimationFrame(()=>repair())}return r};window.goView=goView;window.__kokmatchRepairRosterV6=repair;})();
/* V6_ROSTER_REENTRY_END */

/* v6.0 canonical interaction core: replaces legacy fix23/fix24/fix26 overlap */
(()=>{
'use strict';
if(window.__kokmatchInteractionCore==='6.0')return;
window.__kokmatchInteractionCore='6.0';
document.documentElement.dataset.kokmatchInteractionCore='6.0';
const AUTH_V6='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-auth-v38';
const MULTI_V6='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-multi-api';
let groupBusyV6=false,lastTouchV6=0,sxV6=0,syV6=0,stV6=0,movedV6=false,syncBusyV6=false;
const pageFnV6=typeof window.memberPageGo46==='function'?window.memberPageGo46:null;
const legacyLogoutV6=typeof logout==='function'?logout:null;
function tokenV6(){try{return String(T||window.T||localStorage.getItem('kokmatch_token')||'')}catch{return String(window.T||localStorage.getItem('kokmatch_token')||'')}}
function gidV6(){try{return String(currentGroupId||window.currentGroupId||localStorage.getItem('kokmatch_group_id')||'')}catch{return String(window.currentGroupId||localStorage.getItem('kokmatch_group_id')||'')}}
function mineV6(){try{return me||window.me||null}catch{return window.me||null}}
function membersV6(){try{return Array.isArray(S?.members)?S.members:(Array.isArray(window.S?.members)?window.S.members:[])}catch{return Array.isArray(window.S?.members)?window.S.members:[]}}
function memberV6(id){id=String(id||'');return membersV6().find(m=>String(m?.id||'')===id)||null}
function cardIdV6(card){return String(card?.dataset?.memberId22||card?.dataset?.memberId46||card?.dataset?.memberId||'')}
function escV6(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function showV6(e){const msg=e?.message||String(e||'처리 중 오류가 발생했습니다.');try{typeof showError==='function'?showError(new Error(msg)):alert(msg)}catch{}}
async function jsonV6(url,opt={}){const r=await fetch(url,{cache:'no-store',...opt}),x=await r.json().catch(()=>({}));if(!r.ok)throw new Error(x.error||x.message||('요청 실패 ('+r.status+')'));return x}
function setTokenV6(v){v=String(v||'');try{T=v}catch{};window.T=v;try{localStorage.setItem('kokmatch_token',v)}catch{}}
function setGroupV6(v){v=String(v||'');try{currentGroupId=v}catch{};window.currentGroupId=v;try{localStorage.setItem('kokmatch_group_id',v)}catch{}}
function closeModalV6(){try{if(typeof closeModal==='function')return closeModal()}catch{};document.getElementById('modal')?.classList.remove('on')}
function openModalV6(html){try{if(typeof openModal==='function'){openModal(html);return true}}catch{};const m=document.getElementById('modal'),s=document.getElementById('modalSheet');if(!m||!s)return false;s.innerHTML=html;m.classList.add('on');return true}
function editV6(id){id=String(id||'');const m=memberV6(id);if(!m)return showV6(new Error('수정할 회원을 찾지 못했습니다.'));try{editMemberId=id}catch{};try{if(typeof openMemberModal==='function'){openMemberModal(m);return true}}catch(e){showV6(e)}return false}
async function attendanceV6(id,mode){id=String(id||'');if(!memberV6(id))throw new Error('상태를 변경할 회원을 찾지 못했습니다.');const u=new URL(MULTI_V6);u.searchParams.set('api','action');u.searchParams.set('_v6',Date.now());const x=await jsonV6(u,{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+tokenV6()},body:JSON.stringify({action:'set_member_attendance',groupId:gidV6(),memberId:id,mode})});if(x?.data){try{S=x.data}catch{};window.S=x.data;try{typeof normalizeClient==='function'&&normalizeClient()}catch{};try{typeof renderAll==='function'&&renderAll()}catch{}}return true}
async function membershipsV6(){const m=mineV6();if(!m)return[];if(m.globalAdmin){try{return (Array.isArray(groups)?groups:window.groups||[]).map(g=>({groupId:String(g.groupId||g.group_id||''),groupName:String(g.name||g.groupName||'모임'),roleLabel:'개발자'})).filter(x=>x.groupId)}catch{return[]}}const x=await jsonV6(AUTH_V6,{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+tokenV6()},body:JSON.stringify({action:'my_memberships',currentGroupId:gidV6()})});return Array.isArray(x.memberships)?x.memberships:[]}
async function switchGroupV6(target){target=String(target||'');if(!target||groupBusyV6)return false;if(target===gidV6()){closeModalV6();return true}groupBusyV6=true;try{const oldToken=tokenV6();let newToken=oldToken;if(!mineV6()?.globalAdmin){const a=await jsonV6(AUTH_V6,{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+oldToken},body:JSON.stringify({action:'switch_group',groupId:target})});target=String(a.groupId||target);newToken=String(a.token||oldToken)}const u=new URL(MULTI_V6);u.searchParams.set('api','state');u.searchParams.set('groupId',target);u.searchParams.set('_v6',Date.now());const x=await jsonV6(u,{headers:{authorization:'Bearer '+newToken}});if(String(x?.group?.groupId||'')!==target)throw new Error('선택한 모임 정보를 불러오지 못했습니다.');setTokenV6(newToken);setGroupV6(target);try{S=x.data;me=x.user;group=x.group;if(Array.isArray(x.groups))groups=x.groups;if(Array.isArray(x.groupSummaries))groupSummaries=x.groupSummaries}catch(e){throw e}window.S=S;window.me=me;window.group=group;window.currentGroupId=target;try{typeof normalizeClient==='function'&&normalizeClient()}catch{};try{typeof renderAll==='function'&&renderAll()}catch{};try{pageFnV6&&pageFnV6(1)}catch{};closeModalV6();try{window.scrollTo(0,0)}catch{};return true}catch(e){showV6(e);return false}finally{groupBusyV6=false;queueMicrotask(syncUiV6)}}
async function openGroupsV6(){if(groupBusyV6||!mineV6())return false;groupBusyV6=true;try{openModalV6('<h3>모임 변경</h3><div class="note">가입된 모임을 불러오는 중…</div>');const list=await membershipsV6();if(!list.length){openModalV6('<h3>모임 변경</h3><div class="note">변경할 수 있는 가입 모임이 없습니다.</div><div class="acts"><button id="closeGroupV6" class="btn ghost">닫기</button></div>');document.getElementById('closeGroupV6')?.addEventListener('click',closeModalV6);return true}const cur=gidV6();openModalV6('<h3>모임 변경</h3><div class="note">이동할 모임을 선택해주세요.</div><div id="groupChoiceV6" class="choiceList">'+list.map(x=>'<button class="choiceBtn'+(String(x.groupId)===cur?' current':'')+'" type="button" data-group-v6="'+escV6(x.groupId)+'"><b>'+escV6(x.groupName||'모임')+(String(x.groupId)===cur?' · 현재':'')+'</b><span class="meta">'+escV6(x.role==='admin'?'개발자':x.role==='manager'?'모임장':x.role==='organizer'?'운영진':x.role==='member'?'일반':x.roleLabel||'')+'</span></button>').join('')+'</div><button id="closeGroupV6" class="btn ghost" style="width:100%;margin-top:9px">닫기</button>');document.querySelectorAll('#groupChoiceV6 button[data-group-v6]').forEach(btn=>{let touched=0;const fire=ev=>{touched=Date.now();ev?.preventDefault?.();ev?.stopPropagation?.();switchGroupV6(String(btn.dataset.groupV6||''))};btn.addEventListener('touchend',fire,{passive:false});btn.addEventListener('click',ev=>{if(Date.now()-touched<800){ev.preventDefault();return}fire(ev)})});document.getElementById('closeGroupV6')?.addEventListener('click',closeModalV6);return true}catch(e){showV6(e);return false}finally{groupBusyV6=false}}
window.openGroupSwitchV6=openGroupsV6;window.switchGroupV6=switchGroupV6;
function callV6(fn,...args){try{const r=fn?.(...args);if(r&&typeof r.then==='function')r.catch(showV6);return r}catch(e){showV6(e);return null}}
function routeButtonV6(btn){if(!btn||btn.closest?.('#modal'))return false;if(btn.id==='groupBtn'){callV6(openGroupsV6);return true}const pager=btn.closest?.('#members .memberPager46');if(pager&&pageFnV6){const t=String(btn.textContent||'');const cur=Math.max(1,Number(window.__kokmatchMemberPage46)||1);if(t.includes('다음'))callV6(pageFnV6,cur+1);else if(t.includes('이전'))callV6(pageFnV6,Math.max(1,cur-1));else return false;return true}if(btn.closest?.('#members .title')&&String(btn.textContent||'').includes('회원등록')){const f=window.openAddMember||(typeof openAddMember==='function'?openAddMember:null);if(f){callV6(f);return true}}const card=btn.closest?.('#members .memberCard');if(!card)return false;const id=cardIdV6(card);if(!id)return false;const t=String(btn.textContent||'').trim();if(btn.classList.contains('partnerSetBtn66')&&typeof window.openPartner66==='function'){callV6(window.openPartner66,id);return true}if(btn.classList.contains('recordBtn73')||(btn.classList.contains('pairBtn')&&!btn.classList.contains('partnerSetBtn66'))||t.includes('가입·출석')||t.includes('같이한 경기')){const f=window.openPairs||(typeof openPairs==='function'?openPairs:null);if(f){callV6(f,id);return true}}if(t==='수정'){editV6(id);return true}if(btn.classList.contains('enter')||t==='운동'||t==='입장'){callV6(attendanceV6,id,'waiting');return true}if(btn.classList.contains('watch')||t==='관람'){callV6(attendanceV6,id,'spectator');return true}if((btn.classList.contains('danger')&&t==='퇴장')||t==='퇴장'){callV6(attendanceV6,id,'out');return true}return false}
function bindProfileV6(){const card=document.getElementById('profileCard53');if(!card)return;let input=card.querySelector('#profileFile53');const label=card.querySelector('label[for="profileFile53"]');if(label){label.style.pointerEvents='auto';label.removeAttribute('aria-disabled')}if(input&&!input.dataset.v6clean){const fresh=input.cloneNode(true);fresh.dataset.v6clean='1';fresh.removeAttribute('onchange');fresh.disabled=false;input.replaceWith(fresh);input=fresh;input.addEventListener('change',()=>{const f=window.changeProfile53;if(typeof f==='function')Promise.resolve(f(input)).catch(showV6)})}const del=card.querySelector('#profileDelete21')||[...card.querySelectorAll('button')].find(b=>String(b.textContent||'').includes('기본 사진으로'));if(del&&!del.dataset.v6clean){del.dataset.v6clean='1';del.removeAttribute('onclick');del.onclick=null;del.addEventListener('click',ev=>{ev.preventDefault();const f=window.deleteProfile53;if(typeof f==='function')Promise.resolve(f()).catch(showV6)})}}


function installHeaderStyleV6(){
 if(document.getElementById('kokmatchHeaderStyleV6'))return;
 const s=document.createElement('style');s.id='kokmatchHeaderStyleV6';s.textContent='.toprow>#topActions50,.toprow>#topActions51,.toprow>#topActions52,.toprow>.logout{display:none!important}#topActionsV6{margin-left:auto;display:flex;align-items:center;justify-content:flex-end;gap:5px;position:relative;z-index:300;pointer-events:auto;min-width:0}#currentVersionV6{font-size:10px;font-weight:900;padding:6px 5px;border-radius:8px;background:rgba(255,255,255,.18);white-space:nowrap;flex:0 0 auto}#headerRefreshV6,#logoutV6{min-height:30px;padding:6px 8px;font-size:10.5px;font-weight:850;white-space:nowrap}#logoutV6{flex:0 0 64px}@media(max-width:380px){#currentVersionV6{display:none}#headerRefreshV6{max-width:120px;font-size:9.5px}#logoutV6{flex-basis:56px;width:56px;padding:6px 4px}}';document.head.appendChild(s)
}
async function explicitLogoutV6(){
 if(window.__kokmatchLogoutBusyV6)return false;window.__kokmatchLogoutBusyV6=true;
 try{if(typeof legacyLogoutV6==='function'){await legacyLogoutV6();return true}try{localStorage.removeItem('kokmatch_token')}catch{};location.replace('/');return true}
 finally{setTimeout(()=>{window.__kokmatchLogoutBusyV6=false},500)}
}
function blockLegacyLogoutV6(){
 const guard=function(){console.warn('콕매치 v6: 구형 로그아웃 호출 차단');return false};
 guard.__kokmatchV6Guard=true;
 try{logout=guard}catch{};try{window.logout=guard}catch{}
}
function normalizeHeaderV6(){
 installHeaderStyleV6();blockLegacyLogoutV6();
 const row=document.querySelector('.toprow');if(!row)return;
 row.querySelectorAll('#topActions50,#topActions51,#topActions52,:scope > .logout').forEach(el=>el.remove());
 let actions=document.getElementById('topActionsV6');
 if(!actions){actions=document.createElement('div');actions.id='topActionsV6';actions.innerHTML='<span id="currentVersionV6">v6.0</span><button id="headerRefreshV6" class="btn ghost" type="button">↻ 새로고침</button><button id="logoutV6" type="button">로그아웃</button>';row.appendChild(actions);actions.querySelector('#headerRefreshV6')?.addEventListener('click',ev=>{ev.preventDefault();try{typeof saveRefreshState==='function'&&saveRefreshState()}catch{};location.reload()});actions.querySelector('#logoutV6')?.addEventListener('click',ev=>{ev.preventDefault();ev.stopPropagation();explicitLogoutV6()})}
 const ver=actions.querySelector('#currentVersionV6');if(ver)ver.textContent='v6.0';
 document.title='콕매치 v6.0';document.documentElement.dataset.kokmatchVersion='6.0';
}

function memberControlHtmlV6(m){
 if(!m)return '';
 let manage=false;try{manage=typeof canManageMembers==='function'&&canManageMembers()}catch{}
 const state=String(m.state||'out');
 const stateText=typeof stateLabel==='function'?stateLabel(state):(state==='waiting'?'게임대기':state==='matched'?'편성대기':state==='playing'?'게임중':state==='spectator'?'관람':'미입장');
 if(!manage)return '<div class="status">'+escV6(stateText)+'</div>';
 let r='member';try{r=typeof roleOf==='function'?roleOf(m):String(m.role||'member')}catch{r=String(m.role||'member')}
 let editable=false;
 try{editable=!!mineV6()?.globalAdmin||(mineV6()?.role==='manager'?(r!=='manager'||String(m.id)===String(mineV6()?.memberId||'')):r==='member')}catch{}
 let buttons='';
 if(state!=='playing'&&state!=='matched'){
  if(state!=='waiting')buttons+='<button class="btn enter" type="button">운동</button>';
  if(state!=='spectator')buttons+='<button class="btn watch" type="button">관람</button>';
  if(state!=='out')buttons+='<button class="btn danger" type="button">퇴장</button>';
 }
 if(editable)buttons+='<button class="btn ghost" type="button">수정</button>';
 return '<div class="memberActions48 v6MemberActions"><div class="status">'+escV6(stateText)+'</div><div class="memberBtns">'+buttons+'</div></div>';
}
function repairMemberControlsV6(){
 const box=document.getElementById('members');if(!box)return;
 box.querySelectorAll('.memberCard').forEach(card=>{
  const id=cardIdV6(card),m=memberV6(id);if(!m)return;
  const expected=memberControlHtmlV6(m);if(!expected)return;
  const current=card.querySelector(':scope > .v6MemberActions,:scope > .memberActions48')||[...card.children].find((el,i)=>i>=2&&!el.classList?.contains('avatar')&&!el.classList?.contains('memberInfo48'));
  const signature=[String(m.state||'out'),String(m.role||'member'),String(m.type||'member'),String(m.id||''),String(mineV6()?.role||''),String(!!mineV6()?.globalAdmin),String(mineV6()?.memberId||'')].join('|');
  if(current?.dataset?.v6ControlSig===signature)return;
  const temp=document.createElement('div');temp.innerHTML=expected;const next=temp.firstElementChild;if(!next)return;next.dataset.v6ControlSig=signature;
  if(current&&current!==card.querySelector('.memberInfo48')&&!current.classList?.contains('avatar'))current.replaceWith(next);else card.appendChild(next);
 });
}

function syncUiV6(){if(syncBusyV6)return;syncBusyV6=true;try{repairMemberControlsV6();const b=document.getElementById('groupBtn');if(b&&mineV6()){b.disabled=false;b.removeAttribute('disabled');b.style.pointerEvents='auto';b.style.touchAction='manipulation';if(!groupBusyV6)b.textContent=String((typeof group!=='undefined'?group:window.group)?.name||'모임')+' ▾'}document.querySelectorAll('#members button').forEach(b=>b.style.touchAction='manipulation');bindProfileV6()}finally{syncBusyV6=false}}
function laterV6(){queueMicrotask(syncUiV6);requestAnimationFrame(syncUiV6);setTimeout(syncUiV6,60)}
document.addEventListener('click',ev=>{if(Date.now()-lastTouchV6<750)return;const btn=ev.target?.closest?.('button');if(routeButtonV6(btn)){ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();laterV6()}},true);
window.addEventListener('touchstart',ev=>{if(ev.target?.closest?.('#modal'))return;const t=ev.touches?.[0];if(!t)return;sxV6=t.clientX;syV6=t.clientY;stV6=Date.now();movedV6=false},{capture:true,passive:true});
window.addEventListener('touchmove',ev=>{if(ev.target?.closest?.('#modal'))return;const t=ev.touches?.[0];if(!t)return;if(Math.abs(t.clientX-sxV6)>12||Math.abs(t.clientY-syV6)>12)movedV6=true},{capture:true,passive:true});
window.addEventListener('touchend',ev=>{if(ev.target?.closest?.('#modal'))return;const t=ev.changedTouches?.[0];if(!t||movedV6||Date.now()-stV6>900)return;let btn=ev.target?.closest?.('button');if(!btn&&typeof document.elementsFromPoint==='function'){for(const el of document.elementsFromPoint(t.clientX,t.clientY)){const b=el?.closest?.('button');if(b){btn=b;break}}}if(routeButtonV6(btn)){lastTouchV6=Date.now();ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();laterV6()}},{capture:true,passive:false});
try{const f=renderHeader;renderHeader=function(...a){const r=f.apply(this,a);normalizeHeaderV6();laterV6();return r};window.renderHeader=renderHeader}catch{}
try{const f=renderMembers;renderMembers=function(...a){const r=f.apply(this,a);laterV6();return r};window.renderMembers=renderMembers}catch{}
try{const f=renderSettings;renderSettings=function(...a){const r=f.apply(this,a);laterV6();return r};window.renderSettings=renderSettings}catch{}
try{const f=renderAll;renderAll=function(...a){const r=f.apply(this,a);laterV6();return r};window.renderAll=renderAll}catch{}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{normalizeHeaderV6();laterV6()},{once:true});else{normalizeHeaderV6();laterV6()}
})();


window.__kokmatchStandalone='6.0';
window.__kokmatchVersionLock='6.0';
document.documentElement.dataset.kokmatchVersion='6.0';
document.title='콕매치 v6.0';

