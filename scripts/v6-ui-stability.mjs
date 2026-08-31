import fs from 'node:fs';

const JS='app-v6.0.js',CSS='app-v6.0.css';
let js=fs.readFileSync(JS,'utf8'),css=fs.readFileSync(CSS,'utf8');
if(!js.includes("window.__kokmatchStandalone='6.0'"))throw new Error('Not a v6 standalone runtime');
if(!js.includes('function normalizeHeaderV6(){'))throw new Error('Canonical header is missing');

// Keep the visible release name short. Internal standalone architecture stays v6.0.
js=js.replace(/function buildLabelV6\(\)\{[^}]*\}/,"function buildLabelV6(){return 'v6.13'}");
js=js.replaceAll('v6.12','v6.13').replaceAll('standalone.10','v6.13').replaceAll('standalone.11','v6.13');
js=js.replace("document.title='콕매치 v6.0 · '+buildLabelV6();","document.title='콕매치 '+buildLabelV6();");

// Keep the captured logout callable instead of poisoning the legacy symbol.
{
 const s=js.indexOf('function blockLegacyLogoutV6(){');
 const e=s>=0?js.indexOf('\nfunction normalizeHeaderV6(){',s):-1;
 if(s<0||e<0)throw new Error('Legacy logout guard block not found');
 js=js.slice(0,s)+"function blockLegacyLogoutV6(){return true}\n"+js.slice(e+1);
}

// Remove the previous stability block when this script is run repeatedly.
const TB='/* V6_RELIABLE_ACTION_TAP_BEGIN */',TE='/* V6_RELIABLE_ACTION_TAP_END */';
{
 const s=js.indexOf(TB),e=js.indexOf(TE);
 if(s>=0&&e>s)js=js.slice(0,s)+js.slice(e+TE.length);
}

const tapBlock=String.raw`/* V6_RELIABLE_ACTION_TAP_BEGIN */
function installReliableActionTapV6(){
 if(window.__kokmatchReliableActionTapV6==='v6.13')return;
 window.__kokmatchReliableActionTapV6='v6.13';
 let tap=null;
 const pick=t=>t?.closest?.('#topActionsV6 button,#modal .sheet button,#memberEditorV613 button');
 document.addEventListener('touchstart',ev=>{
  const btn=pick(ev.target),t=ev.touches?.[0];
  if(!btn||btn.disabled||!t){tap=null;return}
  tap={btn,x:t.clientX,y:t.clientY,at:Date.now(),moved:false};
 },{capture:true,passive:true});
 document.addEventListener('touchmove',ev=>{
  if(!tap)return;const t=ev.touches?.[0];if(!t)return;
  if(Math.hypot(t.clientX-tap.x,t.clientY-tap.y)>10)tap.moved=true;
 },{capture:true,passive:true});
 document.addEventListener('touchcancel',()=>{tap=null},{capture:true,passive:true});
 document.addEventListener('touchend',ev=>{
  const a=tap;tap=null;if(!a||a.moved||a.btn.disabled||!a.btn.isConnected)return;
  const t=ev.changedTouches?.[0];if(!t)return;
  if(Math.hypot(t.clientX-a.x,t.clientY-a.y)>10||Date.now()-a.at>900)return;
  const endBtn=pick(ev.target);if(endBtn!==a.btn)return;
  ev.preventDefault();ev.stopPropagation();a.btn.click();
 },{capture:true,passive:false});
}

function installFastMemberActionsV6(){
 if(window.__kokmatchFastMemberActionsV6==='v6.13')return;
 window.__kokmatchFastMemberActionsV6='v6.13';
 const serverAttendance=attendanceV6;
 attendanceV6=async function(id,mode){
  id=String(id||'');const m=memberV6(id);if(!m)throw new Error('상태를 변경할 회원을 찾지 못했습니다.');
  const beforeState=String(m.state||'out');
  const beforeQueue=Array.isArray(S?.queue)?S.queue.slice():[];
  try{
   m.state=mode;
   if(Array.isArray(S?.queue)){
    S.queue=S.queue.filter(x=>String(x)!==id);
    if(mode==='waiting')S.queue.push(id);
   }
   try{typeof renderMembers==='function'&&renderMembers()}catch{}
   try{typeof renderHeader==='function'&&renderHeader()}catch{}
   try{window.__kokmatchFinalizeRoster22?.()}catch{}
   return await serverAttendance(id,mode);
  }catch(e){
   try{m.state=beforeState;S.queue=beforeQueue;typeof renderMembers==='function'&&renderMembers();typeof renderHeader==='function'&&renderHeader();window.__kokmatchFinalizeRoster22?.()}catch{}
   throw e;
  }
 };
 window.attendanceV6=attendanceV6;
}

function memberEditorEscV613(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function closeMemberEditorV613(){document.getElementById('memberEditorV613')?.remove()}
function editorRoleOptionsV613(){return me?.globalAdmin||me?.role==='manager'?['member','organizer','manager']:[]}
function editorRoleLabelV613(r){return r==='admin'?'개발자':r==='manager'?'모임장':r==='organizer'?'운영진':'일반'}
function syncMemberEditorV613(){
 const type=document.getElementById('fmType')?.value||'member';
 const role=document.getElementById('fmRole');
 if(role&&type==='guest'){role.value='member';role.disabled=true}else if(role)role.disabled=false;
 const rr=role?.value||document.getElementById('fmFixedRoleV613')?.dataset.role||'member';
 const pinWrap=document.getElementById('fmPinWrap');if(pinWrap)pinWrap.classList.toggle('hide',type==='guest'||!['manager','organizer'].includes(rr));
 const inv=document.getElementById('fmInviterWrap60');if(inv)inv.classList.toggle('hide',type!=='guest');
}
async function memberApiV613(op,body={}){
 const r=await fetch('https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-v60-api',{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+String(typeof T!=='undefined'?T:'')},body:JSON.stringify({op,groupId:String(typeof currentGroupId!=='undefined'?currentGroupId:''),...body}),cache:'no-store'});
 const x=await r.json().catch(()=>({}));
 if(!r.ok){if(r.status===401){try{reloginLatest()}catch{};throw new Error('로그인이 만료되었습니다.')}throw new Error(x.error||'회원정보 저장에 실패했습니다.')}
 return x;
}
async function saveMemberEditorV613(){
 const cur=editMemberId?memberV6(editMemberId):null;
 const name=document.getElementById('fmName')?.value.trim()||cur?.name||'';
 const year=Number(document.getElementById('fmYear')?.value||0);
 const gender=document.getElementById('fmGender')?.value||'남';
 const cls=document.getElementById('fmCls')?.value||'C';
 const type=document.getElementById('fmType')?.value||cur?.type||'member';
 const fixedRole=document.getElementById('fmFixedRoleV613')?.dataset.role||'';
 const role=fixedRole||document.getElementById('fmRole')?.value||(cur?roleOf(cur):'member');
 const pin=document.getElementById('fmPin')?.value.trim()||'';
 const inviter=type==='guest'?(document.getElementById('fmInviter60')?.value.trim()||''):'';
 if(!name)return alert('이름을 입력해주세요.');
 if(!Number.isInteger(year)||year<1900||year>new Date().getFullYear())return alert('출생연도를 확인해주세요.');
 if(type==='guest'&&!inviter)return alert('게스트의 초대인을 입력해주세요.');
 if(pin&&!/^\d{4,8}$/.test(pin))return alert('PIN/비밀번호는 숫자 4~8자리로 입력해주세요.');
 const save=document.getElementById('memberEditorSaveV613');if(save){save.disabled=true;save.textContent='저장 중...'}
 try{
  const x=await memberApiV613('member_save',{memberId:editMemberId||'',name,year,gender,cls,type,role,pin,inviter});
  if(x.data){S=x.data;window.S=x.data;try{normalizeClient()}catch{}}
  closeMemberEditorV613();try{renderAll()}catch{}
 }catch(e){showV6(e)}finally{if(save?.isConnected){save.disabled=false;save.textContent=editMemberId?'저장':'등록'}}
}
async function deleteMemberEditorV613(){
 const m=editMemberId?memberV6(editMemberId):null;if(!m||roleOf(m)==='admin')return;
 if(!confirm(m.name+' 회원정보를 삭제하시겠습니까?'))return;
 try{const x=await memberApiV613('member_delete',{memberId:m.id});if(x.data){S=x.data;window.S=x.data;try{normalizeClient()}catch{}}closeMemberEditorV613();try{renderAll()}catch{}}catch(e){showV6(e)}
}
function openMemberEditorV613(m){
 const add=!m,r=m?roleOf(m):'member',isAdmin=!add&&r==='admin';
 const actor=me?.globalAdmin?'admin':String(me?.role||'member');
 const opts=editorRoleOptionsV613();
 const organizer=actor==='organizer'&&!me?.globalAdmin;
 const typeLocked=isAdmin||(organizer&&!add&&r!=='member');
 const roleHtml=isAdmin?'<div class="field"><label>역할</label><div id="fmFixedRoleV613" data-role="admin" class="memberEditorFixedV613">개발자</div></div>':opts.length?'<div class="field"><label>역할</label><select id="fmRole">'+opts.map(x=>'<option value="'+x+'" '+((add?x==='member':r===x)?'selected':'')+'>'+editorRoleLabelV613(x)+'</option>').join('')+'</select></div>':'<div class="field"><label>역할</label><div id="fmFixedRoleV613" data-role="'+memberEditorEscV613(r)+'" class="memberEditorFixedV613">'+editorRoleLabelV613(r)+'</div></div>';
 const root=document.createElement('div');root.id='memberEditorV613';root.className='memberEditorOverlayV613';
 root.innerHTML='<div class="memberEditorSheetV613"><h3>'+(add?'회원등록':'회원 정보 수정')+'</h3><div class="note">출생연도·성별·급수·구분·역할과 PIN/비밀번호를 수정할 수 있습니다.</div><div class="field"><label>이름</label><input id="fmName" value="'+memberEditorEscV613(m?.name||'')+'" '+(isAdmin?'disabled':'')+'></div><div class="grid2"><div class="field"><label>출생연도</label><input id="fmYear" type="number" inputmode="numeric" value="'+memberEditorEscV613(m?.year||'')+'"></div><div class="field"><label>성별</label><select id="fmGender"><option '+(m?.gender!=='여'?'selected':'')+'>남</option><option '+(m?.gender==='여'?'selected':'')+'>여</option></select></div><div class="field"><label>급수</label><select id="fmCls">'+['A','B','C','D','E'].map(c=>'<option '+(String(m?.cls||'C')===c?'selected':'')+'>'+c+'</option>').join('')+'</select></div><div class="field"><label>구분</label><select id="fmType" '+(typeLocked?'disabled':'')+'><option value="member" '+(m?.type!=='guest'?'selected':'')+'>일반</option><option value="guest" '+(m?.type==='guest'?'selected':'')+'>게스트</option></select></div></div>'+roleHtml+'<div id="fmPinWrap" class="field '+((!['manager','organizer'].includes(r))||m?.type==='guest'||add?'hide':'')+'"><label>로그인 PIN / 비밀번호</label><input id="fmPin" type="password" inputmode="numeric" maxlength="8" autocomplete="new-password" placeholder="변경 시 숫자 4~8자리"></div><div id="fmInviterWrap60" class="field '+(m?.type==='guest'?'':'hide')+'"><label>초대인</label><input id="fmInviter60" value="'+memberEditorEscV613(m?.inviter||'')+'" maxlength="40" placeholder="초대한 회원 이름"></div><div class="acts">'+(!add&&!isAdmin?'<button id="memberEditorDeleteV613" class="btn danger" type="button">삭제</button>':'')+'<button id="memberEditorCancelV613" class="btn ghost" type="button">취소</button><button id="memberEditorSaveV613" class="btn pri" type="button">'+(add?'등록':'저장')+'</button></div></div>';
 document.getElementById('modal')?.classList.remove('on');closeMemberEditorV613();document.body.appendChild(root);
 const role=document.getElementById('fmRole'),type=document.getElementById('fmType');
 role?.addEventListener('change',syncMemberEditorV613);type?.addEventListener('change',syncMemberEditorV613);
 document.getElementById('memberEditorCancelV613')?.addEventListener('click',closeMemberEditorV613);
 document.getElementById('memberEditorSaveV613')?.addEventListener('click',saveMemberEditorV613);
 document.getElementById('memberEditorDeleteV613')?.addEventListener('click',deleteMemberEditorV613);
 root.addEventListener('click',ev=>{if(ev.target===root)closeMemberEditorV613()});
 syncMemberEditorV613();
 const y=document.getElementById('fmYear');if(y)y.focus({preventScroll:true});
 return true;
}
function installCanonicalMemberEditorV6(){
 if(window.__kokmatchCanonicalMemberEditorV6==='v6.13')return;
 window.__kokmatchCanonicalMemberEditorV6='v6.13';
 openMemberModal=function(m){return openMemberEditorV613(m)};window.openMemberModal=openMemberModal;
}
/* V6_RELIABLE_ACTION_TAP_END */`;

js=js.replace('function normalizeHeaderV6(){',tapBlock+'\nfunction normalizeHeaderV6(){');
js=js.replace('installHeaderStyleV6();blockLegacyLogoutV6();installReliableActionTapV6();','installHeaderStyleV6();blockLegacyLogoutV6();installReliableActionTapV6();installFastMemberActionsV6();installCanonicalMemberEditorV6();');
js=js.replace('installHeaderStyleV6();blockLegacyLogoutV6();','installHeaderStyleV6();blockLegacyLogoutV6();installReliableActionTapV6();installFastMemberActionsV6();installCanonicalMemberEditorV6();');

const CB='/* V6_UI_STABILITY_CSS_BEGIN */',CE='/* V6_UI_STABILITY_CSS_END */';
{
 const s=css.indexOf(CB),e=css.indexOf(CE);
 if(s>=0&&e>s)css=css.slice(0,s)+css.slice(e+CE.length);
}
const cssBlock=`${CB}
#topActionsV6 button,#modal .sheet button,#memberEditorV613 button{pointer-events:auto!important;touch-action:manipulation!important;-webkit-tap-highlight-color:transparent!important}
#modal .sheet{pointer-events:auto!important}
#modal .sheet input,#modal .sheet select,#memberEditorV613 input,#memberEditorV613 select{pointer-events:auto!important;touch-action:auto!important;-webkit-user-select:auto!important;user-select:auto!important;position:relative!important;z-index:2!important}

/* Original grade badge palette. */
.grade-a50{background:#A60093!important;color:#fff!important;border-color:transparent!important}
.grade-b50{background:#00CFC6!important;color:#073937!important;border-color:transparent!important}
.grade-c50{background:#10D400!important;color:#063b00!important;border-color:transparent!important}
.grade-d50{background:#DE9999!important;color:#4b2020!important;border-color:transparent!important}
.grade-e50{background:#EBE202!important;color:#3b3800!important;border-color:transparent!important}

/* Two steps stronger than v6.12 while remaining pastel. */
#members .memberCard[data-grade-v6="A"]{background:#f8d8f2!important;border-color:#e8a9dd!important}
#members .memberCard[data-grade-v6="B"]{background:#cef7f4!important;border-color:#8fe4df!important}
#members .memberCard[data-grade-v6="C"]{background:#d8f5d4!important;border-color:#9fdf97!important}
#members .memberCard[data-grade-v6="D"]{background:#f4dada!important;border-color:#dda9a9!important}
#members .memberCard[data-grade-v6="E"]{background:#f6efb9!important;border-color:#ddd173!important}
#members .memberCard[data-grade-v6="A"] .grade-a50{background:#A60093!important;color:#fff!important}
#members .memberCard[data-grade-v6="B"] .grade-b50{background:#00CFC6!important;color:#073937!important}
#members .memberCard[data-grade-v6="C"] .grade-c50{background:#10D400!important;color:#063b00!important}
#members .memberCard[data-grade-v6="D"] .grade-d50{background:#DE9999!important;color:#4b2020!important}
#members .memberCard[data-grade-v6="E"] .grade-e50{background:#EBE202!important;color:#3b3800!important}

/* Requested line spacing: name→birth 3px tighter, birth→monthly attendance 3px wider. */
#members .memberCard{padding-top:7px!important;padding-bottom:7px!important}
#members .memberInfo48,#members .memberInfoV6{display:flex!important;flex-direction:column!important;gap:0!important}
#members .memberMainLine45{margin:0!important;line-height:1.15!important}
#members .memberName45{line-height:1.15!important}
#members .memberMetaV6{margin:-3px 0 0!important;padding:0!important;line-height:1.12!important}
#members .memberRosterFooterV6{margin:3px 0 0!important;padding:0!important;min-height:0!important;gap:6px!important;line-height:1.1!important}
#members .memberAttendanceV6{line-height:1.1!important}
#members .rosterPartnerBtnV6{padding:0!important;min-height:0!important;line-height:1.1!important}
#members .memberBtns .btn,#members .memberBtns65 .btn{transition:transform .04s ease,filter .04s ease!important}
#members .memberBtns .btn:active,#members .memberBtns65 .btn:active{transform:scale(.94)!important;filter:brightness(.96)!important}

/* Dedicated member editor, isolated from accumulated legacy modal handlers. */
.memberEditorOverlayV613{position:fixed;inset:0;z-index:5000;background:#10182d88;display:flex;align-items:flex-end;justify-content:center;padding:0}
.memberEditorSheetV613{width:min(760px,100%);max-height:92vh;overflow:auto;background:#fff;border-radius:24px 24px 0 0;padding:18px 18px calc(18px + env(safe-area-inset-bottom));-webkit-overflow-scrolling:touch}
.memberEditorSheetV613 h3{margin:0 0 12px}.memberEditorSheetV613 .field input,.memberEditorSheetV613 .field select{font-size:16px!important;min-height:46px!important;background:#fff!important}
.memberEditorFixedV613{min-height:46px;display:flex;align-items:center;padding:0 12px;border:1px solid var(--line);border-radius:12px;background:#f5f7fb;font-weight:850;color:#52617c}
.memberEditorSheetV613 .acts{position:sticky;bottom:calc(-18px - env(safe-area-inset-bottom));background:#fff;padding-top:8px;padding-bottom:calc(4px + env(safe-area-inset-bottom));z-index:4}
@media(max-width:430px){#members .memberCard{padding-top:6px!important;padding-bottom:6px!important}#members .memberRosterFooterV6{gap:5px!important}.memberEditorSheetV613{padding:16px 14px calc(16px + env(safe-area-inset-bottom))}}
${CE}`;
css=css.trimEnd()+'\n\n'+cssBlock+'\n';

if(!js.includes("function buildLabelV6(){return 'v6.13'}"))throw new Error('Short build label was not installed');
if(!js.includes("__kokmatchReliableActionTapV6='v6.13'"))throw new Error('Reliable action tap bridge missing');
if(!js.includes("__kokmatchFastMemberActionsV6='v6.13'"))throw new Error('Optimistic member attendance missing');
if(!js.includes("__kokmatchCanonicalMemberEditorV6='v6.13'"))throw new Error('Canonical member editor missing');
if(!js.includes('memberApiV613'))throw new Error('Member editor API missing');
for(const color of ['#A60093','#00CFC6','#10D400','#DE9999','#EBE202'])if(!css.includes(color))throw new Error('Grade palette incomplete: '+color);
for(const bg of ['#f8d8f2','#cef7f4','#d8f5d4','#f4dada','#f6efb9'])if(!css.includes(bg))throw new Error('Stronger roster pastel missing: '+bg);
if(!css.includes('margin:-3px 0 0')||!css.includes('margin:3px 0 0'))throw new Error('Requested roster line spacing missing');
if(!css.includes('.memberEditorOverlayV613'))throw new Error('Dedicated member editor CSS missing');

fs.writeFileSync(JS,js);fs.writeFileSync(CSS,css);
console.log('v6.13: compact spacing, stronger roster pastels, optimistic member actions and isolated member editor installed.');
