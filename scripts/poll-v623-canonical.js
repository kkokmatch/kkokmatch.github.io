/* KokMatch v6.23 canonical exercise attendance poll runtime */
(()=>{
const POLL623_API='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-v21-api';
let selectedDate623=today623(),month623=selectedDate623.slice(0,7),busy623=new Set();

function today623(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())}
function polls623(){S.attendancePolls=Array.isArray(S?.attendancePolls)?S.attendancePolls:[];return S.attendancePolls}
function poll623(id){return polls623().find(p=>String(p.id)===String(id))}
function votes623(p){p.memberVotes=p?.memberVotes&&typeof p.memberVotes==='object'?p.memberVotes:{};return p.memberVotes}
function guests623(p){p.guestEntries=Array.isArray(p?.guestEntries)?p.guestEntries:[];return p.guestEntries}
function mine623(){return me?.memberId?M(me.memberId):null}
function role623(m){const r=String(m?.role||'member');return r==='admin'?'admin':r==='manager'?'manager':r==='organizer'?'organizer':'member'}
function staff623(){const m=mine623();const temp=!!m&&m.type!=='guest'&&role623(m)==='member'&&m.state!=='out'&&String(m.tempOrganizerDay||'')===todayKst();return !!me&&(me.globalAdmin||me.role==='manager'||me.role==='organizer'||temp)}
function permanentStaff623(){return !!me&&(me.globalAdmin||me.role==='manager'||me.role==='organizer')}
function canVote623(){const m=mine623();return !!m&&m.type!=='guest'}
function validDate623(v){return /^\d{4}-\d{2}-\d{2}$/.test(String(v||''))}
function validTime623(v){return /^\d{2}:(00|30)$/.test(String(v||''))}
function endMs623(p){const d=String(p?.date||''),t=String(p?.endTime||'');if(!validDate623(d)||!validTime623(t))return 0;return Date.parse(`${d}T${t}:00+09:00`)}
function ended623(p){const n=endMs623(p);return !!n&&n<=Date.now()}
function count623(p){const member=Object.values(votes623(p)).filter(v=>v==='yes').length,guest=guests623(p).length;return {member,guest,total:member+guest}}
function limit623(v){return Math.max(0,Math.floor(Number(v)||0))}
function totalLimit623(p){return limit623(p?.totalLimit)}
function guestLimit623(p){return limit623(p?.guestLimit)}
function roleRank623(m){const r=role623(m);return r==='admin'?0:r==='manager'?1:r==='organizer'?2:3}
function yesMembers623(p){const mv=votes623(p);return (S.members||[]).filter(m=>m.type!=='guest'&&mv[String(m.id)]==='yes')}
function ageBand623(year){const n=Number(year),y=Number(today623().slice(0,4));if(!n||n<1900||n>y)return '30';const age=y-n;return String(Math.max(10,Math.min(80,Math.floor(age/10)*10||10)))}
function autoTitle623(date,time,location){const a=String(date||'').split('-').map(Number);return a.length===3&&a[1]&&a[2]?`${a[1]}월 ${a[2]}일 ${time||''}${location?' '+location:''} 운동`:'운동 참석 투표'}
function dateLabel623(date){const a=String(date||'').split('-').map(Number);return a.length===3&&a[0]?`${a[0]}년 ${a[1]}월 ${a[2]}일`:String(date||'')}
function ymShift623(ym,delta){const [y,m]=String(ym).split('-').map(Number),d=new Date(Date.UTC(y,m-1+delta,1));return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}`}
function date623(y,m,d){return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`}
function earliestMonth623(){const a=polls623().map(p=>String(p?.date||'').slice(0,7)).filter(v=>/^\d{4}-\d{2}$/.test(v));return a.length?a.sort()[0]:today623().slice(0,7)}
function weekdayClass623(dt){const d=new Date(`${dt}T00:00:00+09:00`).getDay();return d===0?'sun623':d===6?'sat623':''}
function gradeTag623(m){return `<span class="pollGrade623">${esc(String(m?.age||'30'))}${esc(String(m?.cls||'C'))}</span>`}
function gender623(m){return `<span class="pollGender623 ${m?.gender==='여'?'female':'male'}">${m?.gender==='여'?'여':'남'}</span>`}
function roleBadge623(m){const r=role623(m);if(r==='admin')return '<span class="pollRole623 dev">개발자</span>';if(r==='manager')return '<span class="pollRole623 manager">모임장</span>';if(r==='organizer')return '<span class="pollRole623 organizer">운영진</span>';return ''}

async function requestPoll623(action,body={}){
 const r=await fetch(POLL623_API,{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+T},body:JSON.stringify({action,groupId:currentGroupId,...body}),cache:'no-store'});
 const x=await r.json().catch(()=>({}));
 if(!r.ok){if(r.status===401){reloginLatest();throw new Error('로그인이 만료되었습니다.')}throw new Error(x.error||'처리에 실패했습니다.')}
 if(x.data){S=x.data;normalizeClient()}
 return x;
}

function cleanupOldPollDom623(){const box=$('stats');if(!box)return;[...box.querySelectorAll('[class*="poll"]')].forEach(el=>{if(!el.closest('.pollWrap623'))el.remove()})}
function calendar623(){
 const [y,m]=month623.split('-').map(Number),first=new Date(Date.UTC(y,m-1,1)).getUTCDay(),last=new Date(Date.UTC(y,m,0)).getUTCDate(),has=new Set(polls623().map(p=>String(p.date||''))),cells=[],min=earliestMonth623();
 for(let i=0;i<first;i++)cells.push('<span class="pollBlank623"></span>');
 for(let d=1;d<=last;d++){const dt=date623(y,m,d),sel=dt===selectedDate623,isToday=dt===today623(),withPoll=has.has(dt);cells.push(`<button class="pollDay623 ${weekdayClass623(dt)} ${sel?'selected':''} ${isToday?'today':''} ${withPoll?'hasPoll':''}" onclick="selectPollDate623('${dt}')"><span>${d}</span></button>`)}
 return `<div class="pollCalendar623"><div class="pollCalHead623"><button ${month623<=min?'disabled':''} onclick="movePollMonth623(-1)">‹</button><b>${y}년 ${m}월</b><button onclick="movePollMonth623(1)">›</button></div><div class="pollWeek623"><span>일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span></div><div class="pollGrid623">${cells.join('')}</div><div class="pollLegend623"><span><i></i> 투표 있음</span><span>선택 ${selectedDate623.slice(5).replace('-','/')}</span></div></div>`;
}
function countsHtml623(p){const c=count623(p),tl=totalLimit623(p),gl=guestLimit623(p);return `<div class="pollCounts623"><div><b>${tl?`${c.total}/${tl}`:c.total}</b><span>전체</span></div><div><b>${c.member}</b><span>회원</span></div><div><b>${gl?`${c.guest}/${gl}`:c.guest}</b><span>게스트</span></div></div>`}
function pollCard623(p){
 const c=count623(p),m=mine623(),on=!!m&&votes623(p)[String(m.id)]==='yes',ended=ended623(p),staff=staff623(),canDelete=ended?permanentStaff623():staff,closed=!!p.guestClosed;
 const adminBtns=ended?(canDelete?`<button class="pollMini623 danger" onclick="deletePoll623('${esc(p.id)}')">삭제</button>`:''):(staff?`<button class="pollMini623" onclick="openPollEdit623('${esc(p.id)}')">수정</button><button class="pollMini623 danger" onclick="deletePoll623('${esc(p.id)}')">삭제</button>`:'');
 const voteBtn=ended?'<button class="btn ghost" disabled>운동 종료 · 조회만 가능</button>':(canVote623()?`<button class="btn ${on?'pollAttendOn623':'pri'}" onclick="togglePollVote623('${esc(p.id)}',this)">${on?'✓ 참석중 · 다시 누르면 취소':'참석'}</button>`:'<button class="btn ghost" disabled>회원만 참석</button>');
 const guestBtns=!ended&&staff?`<div class="pollGuestBtns623">${closed?`<button class="btn ghost" disabled>게스트 마감</button><button class="pollMini623" onclick="toggleGuestClosed623('${esc(p.id)}',false)">모집 재개</button>`:`<button class="btn ghost" onclick="openGuestAdd623('${esc(p.id)}')">+ 게스트 참가 추가</button><button class="pollMini623" onclick="toggleGuestClosed623('${esc(p.id)}',true)">게스트 모집 마감</button>`}</div>`:'';
 const schedule=[dateLabel623(p.date),p.time&&p.endTime?`${esc(p.time)} ~ ${esc(p.endTime)}`:esc(p.time||'')].filter(Boolean).join(' · ');
 return `<div class="card pollCard623" data-poll-id="${esc(p.id)}"><div class="pollTitleRow623"><div><div class="pollMainTitle623">${esc(p.location||p.title||'운동')} 운동 ${ended?'<span class="pollEnded623">종료</span>':''}</div><div class="pollSchedule623">${schedule}</div><div class="pollCreator623">투표 생성자 · ${esc(p.createdBy||'정보 없음')}</div></div><div class="pollAdminBtns623">${adminBtns}</div></div>${countsHtml623(p)}<div class="pollActions623">${voteBtn}<button class="btn ghost" onclick="openPollAttendees623('${esc(p.id)}')">참석 명단 ${c.total}명</button></div>${guestBtns}</div>`;
}
function section623(){const ps=polls623().filter(p=>String(p.date||'')===selectedDate623).slice().sort((a,b)=>String(a.time||'').localeCompare(String(b.time||'')));const past=selectedDate623<today623();return `${calendar623()}<div class="pollHead623"><b>운동 참석 투표</b>${staff623()?'<button class="btn pri" onclick="openPollCreate623()">+ 투표 만들기</button>':''}</div>${ps.length?ps.map(pollCard623).join(''):`<div class="empty pollEmpty623">${selectedDate623.slice(5).replace('-','/')} ${past?'기록된 참석 투표가 없습니다.':'예정된 참석 투표가 없습니다.'}</div>`}`}
function renderPoll623(){const box=$('stats');if(!box)return;cleanupOldPollDom623();let wrap=box.querySelector('.pollWrap623');if(!wrap){wrap=document.createElement('div');wrap.className='pollWrap623';const recent=[...box.querySelectorAll(':scope > .card')].find(c=>(c.textContent||'').includes('오늘 최근 경기'));if(recent)recent.insertAdjacentElement('beforebegin',wrap);else box.appendChild(wrap)}wrap.innerHTML=section623()}

window.selectPollDate623=function(dt){selectedDate623=String(dt);month623=selectedDate623.slice(0,7);renderPoll623()};
window.movePollMonth623=function(delta){const next=ymShift623(month623,Number(delta)||0);if(next<earliestMonth623())return;month623=next;selectedDate623=next===today623().slice(0,7)?today623():`${next}-01`;renderPoll623()};

window.togglePollVote623=async function(pid,btn){const key='v:'+pid;if(busy623.has(key))return;const p=poll623(pid),m=mine623();if(!p||!m||m.type==='guest')return;if(ended623(p))return alert('운동이 종료되어 참석투표를 수정할 수 없습니다.');const mid=String(m.id),old={...votes623(p)},was=old[mid]==='yes';if(was)delete p.memberVotes[mid];else{const c=count623(p),l=totalLimit623(p);if(l>0&&c.total>=l)return alert(`참석 인원 ${l}명이 모두 찼습니다.`);p.memberVotes[mid]='yes'}busy623.add(key);if(btn)btn.disabled=true;renderPoll623();try{await requestPoll623('poll_toggle_vote',{pollId:pid});renderPoll623()}catch(e){p.memberVotes=old;showError(e);renderPoll623()}finally{busy623.delete(key)}};

function attendeeHtml623(id){const p=poll623(id);if(!p)return'';const order=new Map((S.members||[]).map((m,i)=>[String(m.id),i])),members=yesMembers623(p).sort((a,b)=>roleRank623(a)-roleRank623(b)||(order.get(String(a.id))??99999)-(order.get(String(b.id))??99999)),gs=guests623(p).slice(),editable=staff623()&&!ended623(p),c=count623(p);const mr=members.map(m=>`<div class="pollPerson623" data-kind="member" data-id="${esc(m.id)}"><div>${gender623(m)}<b>${esc(m.name)}</b>${gradeTag623(m)}${roleBadge623(m)}</div>${editable?`<button onclick="removePollMember623('${esc(id)}','${esc(m.id)}')">×</button>`:''}</div>`).join('');const gr=gs.map(g=>`<div class="pollPerson623" data-kind="guest" data-id="${esc(g.id)}"><div>${gender623(g)}<b>${esc(g.name)}</b>${gradeTag623(g)}<span class="pollRole623 guest">게스트</span><small>${esc(g.year||'')}년생${g.inviter?` · 초대 ${esc(g.inviter)}`:''}</small></div>${editable?`<button onclick="removePollGuest623('${esc(id)}','${esc(g.id)}')">×</button>`:''}</div>`).join('');return `<h3>참석 명단 · 총 ${c.total}명</h3>${countsHtml623(p)}<div class="pollListSection623"><div class="pollListHead623"><b>회원</b><span>${members.length}명</span></div>${mr||'<div class="empty">참석 회원이 없습니다.</div>'}</div><div class="pollListSection623"><div class="pollListHead623"><b>게스트</b><span>${gs.length}명</span></div>${gr||'<div class="empty">등록된 게스트가 없습니다.</div>'}</div><button class="btn ghost" style="width:100%;margin-top:10px" onclick="closeModal()">닫기</button>`}
window.openPollAttendees623=function(id){const html=attendeeHtml623(id);if(html)openModal(html)};
window.removePollMember623=async function(pid,mid){if(!staff623()||ended623(poll623(pid)))return;if(!confirm('이 회원을 참석명단에서 제외하시겠습니까?'))return;try{await requestPoll623('poll_member_remove',{pollId:pid,memberId:mid});renderAll();openPollAttendees623(pid)}catch(e){showError(e)}};
window.removePollGuest623=async function(pid,gid){if(!staff623()||ended623(poll623(pid)))return;if(!confirm('이 게스트를 참석명단에서 삭제하시겠습니까?'))return;try{await requestPoll623('poll_guest_remove',{pollId:pid,guestId:gid});renderAll();openPollAttendees623(pid)}catch(e){showError(e)}};

function inviterOptions623(){return (S.members||[]).filter(m=>m.type!=='guest').map(m=>`<option value="${esc(m.name)}">${esc(m.name)}</option>`).join('')}
window.openGuestAdd623=function(id){const p=poll623(id);if(!p||!staff623()||ended623(p)||p.guestClosed)return;openModal(`<h3>게스트 참가 추가</h3><div class="field"><label>이름</label><input id="pollGuestName623" maxlength="30"></div><div class="field"><label>출생연도</label><input id="pollGuestYear623" inputmode="numeric" maxlength="4" placeholder="예: 1990"></div><div class="field"><label>성별</label><select id="pollGuestGender623"><option>남</option><option>여</option></select></div><div class="field"><label>연령대</label><select id="pollGuestAge623">${['10','20','30','40','50','60','70','80'].map(v=>`<option value="${v}" ${v==='30'?'selected':''}>${v}대</option>`).join('')}</select></div><div class="field"><label>급수</label><select id="pollGuestCls623">${['A','B','C','D','E'].map(v=>`<option ${v==='C'?'selected':''}>${v}</option>`).join('')}</select></div><div class="field"><label>초대인</label><select id="pollGuestInviter623"><option value="">선택</option>${inviterOptions623()}</select></div><div class="acts"><button class="btn ghost" onclick="closeModal()">취소</button><button class="btn pri" onclick="addPollGuest623('${esc(id)}')">추가</button></div>`);const y=$('pollGuestYear623'),a=$('pollGuestAge623');y?.addEventListener('input',()=>{if(/^\d{4}$/.test(y.value)&&a)a.value=ageBand623(y.value)});setTimeout(()=>$('pollGuestName623')?.focus(),20)};
window.addPollGuest623=async function(id){const name=$('pollGuestName623')?.value.trim()||'',year=$('pollGuestYear623')?.value.trim()||'',gender=$('pollGuestGender623')?.value||'남',age=$('pollGuestAge623')?.value||'30',cls=$('pollGuestCls623')?.value||'C',inviter=$('pollGuestInviter623')?.value||'';if(!name)return alert('게스트 이름을 입력해주세요.');if(!/^\d{4}$/.test(year))return alert('출생연도를 4자리로 입력해주세요.');if(!inviter)return alert('초대인을 선택해주세요.');try{await requestPoll623('poll_guest_add',{pollId:id,name,year,gender,age,cls,inviter});closeModal();renderAll()}catch(e){showError(e)}};
window.toggleGuestClosed623=async function(id,closed){const p=poll623(id);if(!p||!staff623()||ended623(p))return;try{await requestPoll623('poll_guest_close',{pollId:id,closed:!!closed});renderPoll623()}catch(e){showError(e)}};

function timeOptions623(selected='18:30',start=false){const out=[];for(let h=0;h<24;h++)for(const m of [0,30]){const v=`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;out.push(`<option value="${v}" ${v===selected?'selected':''} ${start&&v==='23:30'?'disabled':''}>${v}</option>`)}return out.join('')}
function addMinutes623(t,min){const [h,m]=String(t||'18:30').split(':').map(Number),n=Math.min(23*60+30,h*60+m+min);return `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`}
function pollForm623(p=null){const date=p?.date||Math.max(selectedDate623,today623()),time=p?.time||'18:30',end=p?.endTime||'20:30',loc=p?.location||'',title=p?.title||'',total=limit623(p?.totalLimit),guest=limit623(p?.guestLimit);return `<h3>${p?'운동 참석 투표 수정':'운동 참석 투표 만들기'}</h3><div class="pollFormGrid623"><div class="field"><label>일자</label><input id="pollDate19" type="date" min="${today623()}" value="${esc(date)}"></div><div class="field"><label>시작 시간</label><select id="pollStart19">${timeOptions623(time,true)}</select></div><div class="field"><label>종료 시간</label><select id="pollEnd19">${timeOptions623(end)}</select></div><div class="field"><label>운동 장소</label><input id="pollLocation19" maxlength="40" value="${esc(loc)}" placeholder="예: 동탄체육관"></div><div class="field pollWide623"><label>제목</label><input id="pollTitle19" maxlength="60" value="${esc(title)}" placeholder="비워두면 자동 생성"></div><div class="field"><label>전체 제한인원 <small>0=제한없음</small></label><input id="pollTotalLimit19" type="number" min="0" max="999" value="${total}"></div><div class="field"><label>게스트 제한인원 <small>0=제한없음</small></label><input id="pollGuestLimit19" type="number" min="0" max="999" value="${guest}"></div></div><div class="acts"><button class="btn ghost" onclick="closeModal()">취소</button><button class="btn pri" onclick="${p?`savePollEdit623('${esc(p.id)}')`:'createPoll623()'}">${p?'수정 저장':'투표 시작'}</button></div>`}
function bindPollForm623(){const st=$('pollStart19'),en=$('pollEnd19');if(!st||!en)return;const enforce=()=>{const vals=[...en.options];vals.forEach(o=>o.disabled=o.value<=st.value);if(en.value<=st.value){const n=addMinutes623(st.value,120),pick=vals.find(o=>o.value===n&&!o.disabled)||vals.find(o=>!o.disabled);if(pick)en.value=pick.value}};enforce();st.addEventListener('change',enforce)}
function readPollForm623(){const date=$('pollDate19')?.value||'',time=$('pollStart19')?.value||'',endTime=$('pollEnd19')?.value||'',location=$('pollLocation19')?.value.trim()||'',title=$('pollTitle19')?.value.trim()||'',totalLimit=limit623($('pollTotalLimit19')?.value),guestLimit=limit623($('pollGuestLimit19')?.value);if(!date||!time||!endTime)return {error:'운동 일자와 시작·종료시간을 입력해주세요.'};if(date<today623())return {error:'지난 날짜에는 새 투표를 만들거나 수정할 수 없습니다.'};if(endTime<=time)return {error:'운동 종료시간은 시작시간보다 늦게 선택해주세요.'};if(!location)return {error:'운동 장소를 입력해주세요.'};if(totalLimit>0&&guestLimit>0&&guestLimit>totalLimit)return {error:'게스트 제한인원은 전체 제한인원보다 많을 수 없습니다.'};return {date,time,endTime,location,title:title||autoTitle623(date,time,location),totalLimit,guestLimit}}
window.openPollCreate623=function(){if(!staff623())return alert('개발자·모임장·운영진·편성자만 투표를 만들 수 있습니다.');openModal(pollForm623());setTimeout(bindPollForm623,0)};
window.openPollEdit623=function(id){const p=poll623(id);if(!p||!staff623())return;if(ended623(p))return alert('운동이 종료되어 투표를 수정할 수 없습니다.');openModal(pollForm623(p));setTimeout(bindPollForm623,0)};
window.createPoll623=async function(){const v=readPollForm623();if(v.error)return alert(v.error);try{await requestPoll623('poll_create',v);closeModal();renderAll();goView('stats')}catch(e){showError(e)}};
window.savePollEdit623=async function(id){const v=readPollForm623();if(v.error)return alert(v.error);try{await requestPoll623('poll_update',{pollId:id,...v});closeModal();renderAll();goView('stats')}catch(e){showError(e)}};
window.deletePoll623=async function(id){const p=poll623(id);if(!p||!staff623())return;if(ended623(p)&&!permanentStaff623())return alert('종료된 투표는 모임장 또는 운영진만 삭제할 수 있습니다.');if(!confirm('이 참석 투표를 삭제하시겠습니까?'))return;try{await requestPoll623('poll_delete',{pollId:id});renderAll()}catch(e){showError(e)}};

const renderStatsBefore623=renderStats;
renderStats=function(){const r=renderStatsBefore623();renderPoll623();return r};
const goViewBefore623=goView;
goView=function(id){const r=goViewBefore623(id);if(id==='stats')renderPoll623();return r};
setInterval(()=>{if(me&&currentView==='stats')renderPoll623()},30000);
if(me&&currentView==='stats')renderStats();
})();
