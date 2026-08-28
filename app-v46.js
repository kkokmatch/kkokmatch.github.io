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
 /* Once the current session/group is established, the member roster uses its own lightweight API. */
 if(view==='members'&&memberSessionReady46()){lastPoll46.members=now;return}
 if(!force&&last&&now-last<gap)return;if(actionBusy46&&!force)return;if(stateBusy46)return stateBusy46;
 lastPoll46[view]=now;
 stateBusy46=(compactView46(view)?compactState46():loadState45()).finally(()=>{stateBusy46=null});
 return stateBusy46;
};

const act45=act;
act=async function(...args){actionBusy46++;try{const x=await act45(...args);lastPoll46[currentView]=Date.now();return x}finally{actionBusy46=Math.max(0,actionBusy46-1)}};

function filteredMembers46(){
 const q=memberQuery46.trim().toLowerCase();if(!q)return S.members;
 return S.members.filter(m=>[m.name,m.cls,m.gender,m.inviter,roleLabel(roleOf(m)),m.type==='guest'?'게스트':'일반회원'].some(v=>String(v||'').toLowerCase().includes(q)));
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
 const all=Array.isArray(S?.members)?S.members:[],filtered=filteredMembers46(),start=(memberPage46-1)*MEMBER_PAGE_SIZE46,page=filtered.slice(start,start+MEMBER_PAGE_SIZE46);stampMemberCards46(page);return page.map(m=>String(m.id||''));
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