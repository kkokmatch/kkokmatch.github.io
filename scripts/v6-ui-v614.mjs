import fs from 'node:fs';

const JS='app-v6.0.js',CSS='app-v6.0.css';
let js=fs.readFileSync(JS,'utf8'),css=fs.readFileSync(CSS,'utf8');
if(!js.includes("window.__kokmatchStandalone='6.0'"))throw new Error('Not a v6 standalone runtime');
if(!js.includes('function normalizeHeaderV6(){'))throw new Error('Canonical header is missing');

// Short visible version.
js=js.replaceAll('v6.13','v6.14');
js=js.replace(/function buildLabelV6\(\)\{return 'v6\.\d+'\}/,"function buildLabelV6(){return 'v6.14'}");

// Replace the previous v6 interaction block instead of layering another runtime patch.
const TB='/* V6_RELIABLE_ACTION_TAP_BEGIN */',TE='/* V6_RELIABLE_ACTION_TAP_END */';
const ts=js.indexOf(TB),te=js.indexOf(TE);
if(ts<0||te<=ts)throw new Error('Previous v6 interaction block not found');

const block=String.raw`/* V6_RELIABLE_ACTION_TAP_BEGIN */
let memberEditorStateV614=null,partnerEditorStateV614=null;
function v614Esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function v614Token(){try{return String(T||localStorage.getItem('kokmatch_token')||'')}catch{return String(localStorage.getItem('kokmatch_token')||'')}}
function v614Group(){try{return String(currentGroupId||localStorage.getItem('kokmatch_group_id')||'')}catch{return String(localStorage.getItem('kokmatch_group_id')||'')}}
function v614Member(id){id=String(id||'');try{return (S?.members||[]).find(m=>String(m?.id)===id)||null}catch{return null}}
function v614Role(m){try{return roleOf(m)}catch{return String(m?.role||'member')}}
function v614RoleLabel(r){return r==='admin'?'개발자':r==='manager'?'모임장':r==='organizer'?'운영진':'일반'}
function v614Actor(){try{return me?.globalAdmin?'admin':String(me?.role||'member')}catch{return'member'}}
function v614ShowError(e){try{showV6(e)}catch{alert(e?.message||String(e||'오류가 발생했습니다.'))}}
function v614SkipHeavy(ms=160){window.__kokmatchSkipHeavyUntilV614=Math.max(Number(window.__kokmatchSkipHeavyUntilV614)||0,Date.now()+ms)}

function installReliableActionTapV6(){
 if(window.__kokmatchReliableActionTapV6==='v6.14')return;
 window.__kokmatchReliableActionTapV6='v6.14';
 let tap=null;
 const pick=t=>t?.closest?.('#topActionsV6 button,#modal .sheet button,#memberEditorV614 button,#partnerOverlayV614 button');
 document.addEventListener('touchstart',ev=>{
  const btn=pick(ev.target),t=ev.touches?.[0];
  if(!btn||btn.disabled||!t){tap=null;return}
  tap={btn,x:t.clientX,y:t.clientY,at:Date.now(),moved:false};btn.classList.add('v614Pressed');
 },{capture:true,passive:true});
 document.addEventListener('touchmove',ev=>{
  if(!tap)return;const t=ev.touches?.[0];if(!t)return;
  if(Math.hypot(t.clientX-tap.x,t.clientY-tap.y)>10){tap.moved=true;tap.btn?.classList.remove('v614Pressed')}
 },{capture:true,passive:true});
 const clear=()=>{tap?.btn?.classList.remove('v614Pressed');tap=null};
 document.addEventListener('touchcancel',clear,{capture:true,passive:true});
 document.addEventListener('touchend',ev=>{
  const a=tap;tap=null;a?.btn?.classList.remove('v614Pressed');if(!a||a.moved||a.btn.disabled||!a.btn.isConnected)return;
  const t=ev.changedTouches?.[0];if(!t)return;
  if(Math.hypot(t.clientX-a.x,t.clientY-a.y)>10||Date.now()-a.at>850)return;
  const endBtn=pick(ev.target);if(endBtn!==a.btn)return;
  ev.preventDefault();ev.stopPropagation();a.btn.click();
 },{capture:true,passive:false});
 document.addEventListener('touchstart',ev=>{const b=ev.target?.closest?.('#members .memberBtns button,#members .rosterPartnerBtnV6');if(b&&!b.disabled)b.classList.add('v614Pressed')},{capture:true,passive:true});
 document.addEventListener('touchend',ev=>ev.target?.closest?.('#members .memberBtns button,#members .rosterPartnerBtnV6')?.classList.remove('v614Pressed'),{capture:true,passive:true});
 document.addEventListener('touchcancel',()=>document.querySelectorAll('#members .v614Pressed').forEach(x=>x.classList.remove('v614Pressed')),{capture:true,passive:true});
}

async function v614ActionApi(action,body={}){
 const r=await fetch('https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-v60-api',{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+v614Token()},body:JSON.stringify({op:'action',action,groupId:v614Group(),...body}),cache:'no-store'});
 const x=await r.json().catch(()=>({}));
 if(!r.ok){if(r.status===401){try{reloginLatest()}catch{};throw new Error('로그인이 만료되었습니다.')}throw new Error(x.error||'상태 변경에 실패했습니다.')}
 return x;
}
function v614PaintHeader(){
 try{document.getElementById('sm').textContent=String((S?.members||[]).filter(m=>m.state!=='out').length)}catch{}
 try{document.getElementById('sw').textContent=String((S?.queue||[]).length+(S?.pendingGames||[]).reduce((n,g)=>n+(g.players?.length||0),0))}catch{}
 try{document.getElementById('sg').textContent=String((S?.games||[]).length)}catch{}
}
function v614PaintMemberCard(id){
 const card=[...document.querySelectorAll('#members .memberCard')].find(c=>String(c.dataset.memberId22||c.dataset.memberId||'')===String(id));
 const m=v614Member(id);if(!card||!m)return;
 try{
  const current=card.querySelector(':scope > .v6MemberActions,:scope > .memberActions48,:scope > .memberActions60,:scope > .memberActions65');
  if(typeof memberControlHtmlV6==='function'){
   const box=document.createElement('div');box.innerHTML=memberControlHtmlV6(m);const next=box.firstElementChild;if(next){if(current)current.replaceWith(next);else card.appendChild(next)}
  }else if(current?.querySelector('.status'))current.querySelector('.status').textContent=stateLabel(m.state);
 }catch{}
}
function installFastMemberActionsV6(){
 if(window.__kokmatchFastMemberActionsV6==='v6.14')return;
 window.__kokmatchFastMemberActionsV6='v6.14';
 attendanceV6=async function(id,mode){
  id=String(id||'');const m=v614Member(id);if(!m)throw new Error('상태를 변경할 회원을 찾지 못했습니다.');
  if(m.__v614Busy)return false;m.__v614Busy=true;v614SkipHeavy(220);
  const oldState=String(m.state||'out'),oldJoined=m.joinedAt,oldQueue=Array.isArray(S?.queue)?S.queue.slice():[];
  try{
   m.state=mode;m.joinedAt=mode==='out'?null:Date.now();
   if(Array.isArray(S?.queue)){S.queue=S.queue.filter(x=>String(x)!==id);if(mode==='waiting')S.queue.push(id)}
   v614PaintMemberCard(id);v614PaintHeader();
   const x=await v614ActionApi('set_member_attendance',{memberId:id,mode});
   if(x.data){S=x.data;window.S=x.data;try{normalizeClient()}catch{}}
   setTimeout(()=>{try{renderMembers();renderHeader();window.__kokmatchFinalizeRoster22?.()}catch{}},0);
   return true;
  }catch(e){
   m.state=oldState;m.joinedAt=oldJoined;S.queue=oldQueue;v614PaintMemberCard(id);v614PaintHeader();throw e;
  }finally{delete m.__v614Busy}
 };
 window.attendanceV6=attendanceV6;
}

async function v614MemberApi(op,body={}){
 const r=await fetch('https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-v60-api',{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+v614Token()},body:JSON.stringify({op,groupId:v614Group(),...body}),cache:'no-store'});
 const x=await r.json().catch(()=>({}));
 if(!r.ok){if(r.status===401){try{reloginLatest()}catch{};throw new Error('로그인이 만료되었습니다.')}throw new Error(x.error||'회원정보 저장에 실패했습니다.')}
 return x;
}
function closeMemberEditorV614(){document.getElementById('memberEditorV614')?.remove();memberEditorStateV614=null}
function v614ChoiceHtml(key,items){
 return '<div class="v614Choice" data-choice="'+key+'">'+items.map(([v,label])=>'<button type="button" class="v614ChoiceBtn '+(String(memberEditorStateV614?.[key])===String(v)?'on':'')+'" data-key="'+key+'" data-value="'+v+'">'+label+'</button>').join('')+'</div>';
}
function v614SyncEditor(){
 const root=document.getElementById('memberEditorV614');if(!root||!memberEditorStateV614)return;
 root.querySelectorAll('.v614ChoiceBtn').forEach(b=>b.classList.toggle('on',String(memberEditorStateV614[b.dataset.key])===String(b.dataset.value)));
 const pin=root.querySelector('#v614PinWrap');if(pin)pin.classList.toggle('hide',memberEditorStateV614.type==='guest'||!['manager','organizer'].includes(memberEditorStateV614.role));
 const inv=root.querySelector('#v614InviterWrap');if(inv)inv.classList.toggle('hide',memberEditorStateV614.type!=='guest');
}
function v614SetChoice(key,value){
 if(!memberEditorStateV614)return;memberEditorStateV614[key]=value;
 if(key==='type'&&value==='guest')memberEditorStateV614.role='member';
 v614SyncEditor();
}
async function saveMemberEditorV614(){
 const st=memberEditorStateV614;if(!st)return;
 const root=document.getElementById('memberEditorV614');if(!root)return;
 const name=root.querySelector('#v614Name')?.value.trim()||st.name||'';
 const year=Number(root.querySelector('#v614Year')?.value||0);
 const pin=root.querySelector('#v614Pin')?.value.trim()||'';
 const inviter=st.type==='guest'?(root.querySelector('#v614Inviter')?.value.trim()||''):'';
 if(!name)return alert('이름을 입력해주세요.');
 if(!Number.isInteger(year)||year<1900||year>new Date().getFullYear())return alert('출생연도를 확인해주세요.');
 if(st.type==='guest'&&!inviter)return alert('게스트의 초대인을 입력해주세요.');
 if(pin&&!/^\d{4,8}$/.test(pin))return alert('PIN/비밀번호는 숫자 4~8자리로 입력해주세요.');
 const save=root.querySelector('#v614Save');if(save){save.disabled=true;save.textContent='저장 중...'}
 try{
  const x=await v614MemberApi('member_save',{memberId:st.memberId||'',name,year,gender:st.gender,cls:st.cls,type:st.type,role:st.role,pin,inviter});
  if(x.data){S=x.data;window.S=x.data;try{normalizeClient()}catch{}}
  closeMemberEditorV614();try{renderAll();window.__kokmatchFinalizeRoster22?.()}catch{}
 }catch(e){v614ShowError(e)}finally{if(save?.isConnected){save.disabled=false;save.textContent=st.memberId?'저장':'등록'}}
}
async function deleteMemberEditorV614(){
 const st=memberEditorStateV614,m=st?.memberId?v614Member(st.memberId):null;if(!m||v614Role(m)==='admin')return;
 if(!confirm(m.name+' 회원정보를 삭제하시겠습니까?'))return;
 try{const x=await v614MemberApi('member_delete',{memberId:m.id});if(x.data){S=x.data;window.S=x.data;try{normalizeClient()}catch{}}closeMemberEditorV614();try{renderAll()}catch{}}catch(e){v614ShowError(e)}
}
function openMemberEditorV614(m){
 const add=!m,r=m?v614Role(m):'member',actor=v614Actor(),isAdmin=!add&&r==='admin';
 const roleEditable=!!me?.globalAdmin||actor==='manager';
 const typeLocked=isAdmin||(actor==='organizer'&&!add&&r!=='member');
 memberEditorStateV614={memberId:m?.id||'',name:m?.name||'',year:m?.year||'',gender:m?.gender==='여'?'여':'남',cls:['A','B','C','D','E'].includes(String(m?.cls||'C'))?String(m?.cls||'C'):'C',type:m?.type==='guest'?'guest':'member',role:isAdmin?'admin':(add?'member':r)};
 const roleHtml=isAdmin?'<div class="field"><label>역할</label><div class="memberEditorFixedV614">개발자</div></div>':roleEditable?'<div class="field"><label>역할</label>'+v614ChoiceHtml('role',[['member','일반'],['organizer','운영진'],['manager','모임장']])+'</div>':'<div class="field"><label>역할</label><div class="memberEditorFixedV614">'+v614RoleLabel(memberEditorStateV614.role)+'</div></div>';
 const root=document.createElement('div');root.id='memberEditorV614';root.className='memberEditorOverlayV614';
 root.innerHTML='<div class="memberEditorSheetV614"><h3>'+(add?'회원등록':'회원 정보 수정')+'</h3><div class="note">화면에서 선택한 성별·급수·구분·역할 값을 그대로 저장합니다.</div><div class="field"><label>이름</label><input id="v614Name" value="'+v614Esc(m?.name||'')+'" '+(isAdmin?'disabled':'')+'></div><div class="field"><label>출생연도</label><input id="v614Year" type="number" inputmode="numeric" value="'+v614Esc(m?.year||'')+'"></div><div class="field"><label>성별</label>'+v614ChoiceHtml('gender',[['남','남'],['여','여']])+'</div><div class="field"><label>급수</label>'+v614ChoiceHtml('cls',[['A','A'],['B','B'],['C','C'],['D','D'],['E','E']])+'</div><div class="field"><label>구분</label>'+(typeLocked?'<div class="memberEditorFixedV614">'+(memberEditorStateV614.type==='guest'?'게스트':'일반')+'</div>':v614ChoiceHtml('type',[['member','일반'],['guest','게스트']]))+'</div>'+roleHtml+'<div id="v614PinWrap" class="field"><label>로그인 PIN / 비밀번호</label><input id="v614Pin" type="password" inputmode="numeric" maxlength="8" autocomplete="new-password" placeholder="변경할 때만 숫자 4~8자리 입력"></div><div id="v614InviterWrap" class="field"><label>초대인</label><input id="v614Inviter" value="'+v614Esc(m?.inviter||'')+'" maxlength="40" placeholder="초대한 회원 이름"></div><div class="acts">'+(!add&&!isAdmin?'<button id="v614Delete" class="btn danger" type="button">삭제</button>':'')+'<button id="v614Cancel" class="btn ghost" type="button">취소</button><button id="v614Save" class="btn pri" type="button">'+(add?'등록':'저장')+'</button></div></div>';
 closeMemberEditorV614();document.getElementById('modal')?.classList.remove('on');document.body.appendChild(root);
 root.addEventListener('click',ev=>{const b=ev.target?.closest?.('.v614ChoiceBtn');if(b){ev.preventDefault();v614SetChoice(String(b.dataset.key||''),String(b.dataset.value||''));return}if(ev.target===root)closeMemberEditorV614()});
 root.querySelector('#v614Cancel')?.addEventListener('click',closeMemberEditorV614);root.querySelector('#v614Save')?.addEventListener('click',saveMemberEditorV614);root.querySelector('#v614Delete')?.addEventListener('click',deleteMemberEditorV614);
 v614SyncEditor();v614SkipHeavy(120);return true;
}
function installCanonicalMemberEditorV6(){
 if(window.__kokmatchCanonicalMemberEditorV6==='v6.14')return;
 window.__kokmatchCanonicalMemberEditorV6='v6.14';
 openMemberModal=function(m){return openMemberEditorV614(m)};window.openMemberModal=openMemberModal;
}

function v614PartnerDay(){const shifted=new Date(Date.now()-5*60*60*1000);return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(shifted)}
function v614CanPartner(m){return !!m&&!!me&&(String(me.memberId||'')===String(m.id)||me.globalAdmin||me.role==='manager'||me.role==='organizer')}
function closePartnerOverlayV614(){document.getElementById('partnerOverlayV614')?.remove();partnerEditorStateV614=null}
function v614PartnerResults(){
 const st=partnerEditorStateV614,root=document.getElementById('partnerOverlayV614');if(!st||!root)return;
 const q=String(root.querySelector('#v614PartnerSearch')?.value||'').trim().toLowerCase();
 const list=(S?.members||[]).filter(x=>String(x.id)!==String(st.targetId)&&(!q||String(x.name||'').toLowerCase().includes(q))).slice(0,40);
 const box=root.querySelector('#v614PartnerResults');if(!box)return;
 box.innerHTML=list.length?list.map(x=>'<button type="button" class="v614PartnerResult '+(String(st.selectedId)===String(x.id)?'on':'')+'" data-partner-id="'+v614Esc(x.id)+'"><b>'+v614Esc(x.name)+'</b><span>'+v614Esc(String(x.year||''))+'년생 · '+v614Esc(x.gender||'')+' · '+v614Esc(x.cls||'')+'급</span></button>').join(''):'<div class="partnerSearchHint82">검색 결과가 없습니다.</div>';
 const picked=root.querySelector('#v614PartnerPicked'),p=st.selectedId?v614Member(st.selectedId):null;if(picked)picked.textContent=p?'선택: '+p.name:'파트너 없음';
}
async function v614PartnerApi(memberId,partnerId){
 const r=await fetch('https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-v66-api',{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+v614Token()},body:JSON.stringify({action:'partner_set',groupId:v614Group(),memberId:String(memberId),partnerId:String(partnerId||'')}),cache:'no-store'});
 const x=await r.json().catch(()=>({}));if(!r.ok){if(r.status===401){try{reloginLatest()}catch{};throw new Error('로그인이 만료되었습니다.')}throw new Error(x.error||'파트너 저장에 실패했습니다.')}return x;
}
async function savePartnerOverlayV614(){
 const st=partnerEditorStateV614,root=document.getElementById('partnerOverlayV614');if(!st||!root)return;const b=root.querySelector('#v614PartnerSave');if(b){b.disabled=true;b.textContent='저장 중...'}
 try{const x=await v614PartnerApi(st.targetId,st.selectedId);if(x.data){S=x.data;window.S=x.data;try{normalizeClient()}catch{}}closePartnerOverlayV614();try{renderMembers();window.__kokmatchFinalizeRoster22?.()}catch{}}catch(e){v614ShowError(e);if(b?.isConnected){b.disabled=false;b.textContent='저장'}}
}
function openPartnerOverlayV614(id){
 id=String(id||'');const m=v614Member(id);if(!m)return false;if(!v614CanPartner(m)){alert('본인 또는 관리 가능한 회원의 파트너만 설정할 수 있습니다.');return false}
 const cur=String(m.partnerDay||'')===v614PartnerDay()?String(m.partnerId||''):'';partnerEditorStateV614={targetId:id,selectedId:cur};
 const root=document.createElement('div');root.id='partnerOverlayV614';root.className='partnerOverlayV614';root.innerHTML='<div class="partnerSheetV614"><h3>'+v614Esc(m.name)+' · 오늘 파트너 설정</h3><div class="note">팝업은 회원명부의 현재 정보로 즉시 열립니다. 이름을 검색하거나 바로 선택할 수 있습니다.</div><div class="field"><label>파트너 이름 검색</label><input id="v614PartnerSearch" autocomplete="off" placeholder="이름 입력"></div><div id="v614PartnerResults" class="partnerResultsV614"></div><div class="partnerPickedV614"><span id="v614PartnerPicked">파트너 없음</span><button id="v614PartnerClear" type="button" class="btn ghost">선택 해제</button></div><div class="acts"><button id="v614PartnerCancel" type="button" class="btn ghost">취소</button><button id="v614PartnerSave" type="button" class="btn pri">저장</button></div></div>';
 closePartnerOverlayV614();document.getElementById('modal')?.classList.remove('on');document.body.appendChild(root);v614PartnerResults();
 root.querySelector('#v614PartnerSearch')?.addEventListener('input',v614PartnerResults);root.querySelector('#v614PartnerResults')?.addEventListener('click',ev=>{const b=ev.target?.closest?.('[data-partner-id]');if(!b)return;partnerEditorStateV614.selectedId=String(b.dataset.partnerId||'');v614PartnerResults()});root.querySelector('#v614PartnerClear')?.addEventListener('click',()=>{partnerEditorStateV614.selectedId='';v614PartnerResults()});root.querySelector('#v614PartnerCancel')?.addEventListener('click',closePartnerOverlayV614);root.querySelector('#v614PartnerSave')?.addEventListener('click',savePartnerOverlayV614);root.addEventListener('click',ev=>{if(ev.target===root)closePartnerOverlayV614()});
 v614SkipHeavy(120);return true;
}
function installFastPartnerV6(){
 if(window.__kokmatchFastPartnerV6==='v6.14')return;window.__kokmatchFastPartnerV6='v6.14';
 window.openPartner66=openPartnerOverlayV614;window.savePartner66=savePartnerOverlayV614;
}

function installMemberRoutesV614(){
 if(window.__kokmatchMemberRoutesV614)return;window.__kokmatchMemberRoutesV614='v6.14';
 const base=routeButtonV6;
 routeButtonV6=function(btn){
  if(btn&&!btn.closest?.('#modal')){
   const card=btn.closest?.('#members .memberCard'),id=card?cardIdV6(card):'';
   if(id&&btn.classList.contains('partnerSetBtn66')){v614SkipHeavy(140);openPartnerOverlayV614(id);return true}
   const t=String(btn.textContent||'').trim();
   if(id&&t==='수정'){v614SkipHeavy(140);editV6(id);return true}
   if(id&&(btn.classList.contains('enter')||t==='운동'||t==='입장')){v614SkipHeavy(220);callV6(attendanceV6,id,'waiting');return true}
   if(id&&(btn.classList.contains('watch')||t==='관람')){v614SkipHeavy(220);callV6(attendanceV6,id,'spectator');return true}
   if(id&&((btn.classList.contains('danger')&&t==='퇴장')||t==='퇴장')){v614SkipHeavy(220);callV6(attendanceV6,id,'out');return true}
  }
  return base(btn);
 };
 window.routeButtonV6=routeButtonV6;
 try{
  const original=laterV6;
  laterV6=function(){const remain=(Number(window.__kokmatchSkipHeavyUntilV614)||0)-Date.now();if(remain>0){clearTimeout(window.__kokmatchDeferredLaterV614);window.__kokmatchDeferredLaterV614=setTimeout(()=>{try{original()}catch{}},remain+20);return}return original()};window.laterV6=laterV6;
 }catch{}
}
/* V6_RELIABLE_ACTION_TAP_END */`;

js=js.slice(0,ts)+block+js.slice(te+TE.length);
const oldInstall='installHeaderStyleV6();blockLegacyLogoutV6();installReliableActionTapV6();installFastMemberActionsV6();installCanonicalMemberEditorV6();';
const newInstall='installHeaderStyleV6();blockLegacyLogoutV6();installReliableActionTapV6();installFastMemberActionsV6();installCanonicalMemberEditorV6();installFastPartnerV6();installMemberRoutesV614();';
if(!js.includes(oldInstall))throw new Error('v6.13 normalize install chain not found');
js=js.replace(oldInstall,newInstall);

const CB='/* V6_UI_STABILITY_CSS_BEGIN */',CE='/* V6_UI_STABILITY_CSS_END */';
const cs=css.indexOf(CB),ce=css.indexOf(CE);
if(cs<0||ce<=cs)throw new Error('Previous v6 stability CSS block not found');
const cssBlock=`${CB}
#topActionsV6 button,#modal .sheet button,#memberEditorV614 button,#partnerOverlayV614 button,#members .memberBtns button,#members .rosterPartnerBtnV6{pointer-events:auto!important;touch-action:manipulation!important;-webkit-tap-highlight-color:transparent!important}
.v614Pressed{transform:scale(.92)!important;filter:brightness(.92)!important;transition:none!important}

.grade-a50{background:#A60093!important;color:#fff!important;border-color:transparent!important}.grade-b50{background:#00CFC6!important;color:#073937!important;border-color:transparent!important}.grade-c50{background:#10D400!important;color:#063b00!important;border-color:transparent!important}.grade-d50{background:#DE9999!important;color:#4b2020!important;border-color:transparent!important}.grade-e50{background:#EBE202!important;color:#3b3800!important;border-color:transparent!important}
#members .memberCard[data-grade-v6="A"]{background:#f8d8f2!important;border-color:#e8a9dd!important}#members .memberCard[data-grade-v6="B"]{background:#cef7f4!important;border-color:#8fe4df!important}#members .memberCard[data-grade-v6="C"]{background:#d8f5d4!important;border-color:#9fdf97!important}#members .memberCard[data-grade-v6="D"]{background:#f4dada!important;border-color:#dda9a9!important}#members .memberCard[data-grade-v6="E"]{background:#f6efb9!important;border-color:#ddd173!important}
#members .memberCard[data-grade-v6="A"] .grade-a50{background:#A60093!important;color:#fff!important}#members .memberCard[data-grade-v6="B"] .grade-b50{background:#00CFC6!important;color:#073937!important}#members .memberCard[data-grade-v6="C"] .grade-c50{background:#10D400!important;color:#063b00!important}#members .memberCard[data-grade-v6="D"] .grade-d50{background:#DE9999!important;color:#4b2020!important}#members .memberCard[data-grade-v6="E"] .grade-e50{background:#EBE202!important;color:#3b3800!important}

/* v6.14 requested spacing: 5px tighter name→birth, 5px wider birth→monthly attendance than v6.13. */
#members .memberCard{padding-top:7px!important;padding-bottom:7px!important}#members .memberInfo48,#members .memberInfoV6{display:flex!important;flex-direction:column!important;gap:0!important}#members .memberMainLine45{margin:0!important;line-height:1.15!important}#members .memberName45{line-height:1.15!important}#members .memberMetaV6{margin:-8px 0 0!important;padding:0!important;line-height:1.12!important}#members .memberRosterFooterV6{margin:8px 0 0!important;padding:0!important;min-height:0!important;gap:6px!important;line-height:1.1!important}#members .memberAttendanceV6{line-height:1.1!important}#members .rosterPartnerBtnV6{padding:0!important;min-height:0!important;line-height:1.1!important}

.memberEditorOverlayV614,.partnerOverlayV614{position:fixed;inset:0;z-index:1200;background:#10182d88;display:flex;align-items:flex-end;justify-content:center;padding:0}.memberEditorSheetV614,.partnerSheetV614{width:min(760px,100%);max-height:92vh;overflow:auto;background:#fff;border-radius:24px 24px 0 0;padding:18px 18px calc(18px + env(safe-area-inset-bottom));box-shadow:0 -12px 38px #1118272e}.memberEditorSheetV614 h3,.partnerSheetV614 h3{margin:0 0 10px}.memberEditorOverlayV614 input,.partnerOverlayV614 input{width:100%;padding:12px;border:1px solid var(--line);border-radius:12px;background:#fff;font-size:16px!important;pointer-events:auto!important;touch-action:auto!important;-webkit-user-select:text!important;user-select:text!important}.memberEditorFixedV614{padding:11px 12px;border:1px solid var(--line);border-radius:12px;background:#f3f5fa;font-weight:850}.v614Choice{display:flex;gap:6px;flex-wrap:wrap}.v614ChoiceBtn{border:1px solid var(--line);background:#fff;border-radius:10px;padding:9px 12px;font-weight:850;min-width:48px}.v614ChoiceBtn.on{background:#e5ebff;border-color:#8da8f5;color:#2453d4}.memberEditorSheetV614 .acts,.partnerSheetV614 .acts{position:sticky;bottom:0;background:#fff;padding-top:10px}.partnerResultsV614{display:grid;gap:6px;max-height:300px;overflow:auto;margin-bottom:10px}.v614PartnerResult{width:100%;border:1px solid var(--line);background:#fff;border-radius:12px;padding:10px 11px;text-align:left;display:flex;align-items:center;justify-content:space-between;gap:8px}.v614PartnerResult span{font-size:11px;color:var(--mut)}.v614PartnerResult.on{background:#edf3ff;border-color:#96adf2}.partnerPickedV614{display:flex;align-items:center;justify-content:space-between;gap:8px;background:#f5f7fb;border-radius:12px;padding:8px 10px;margin-bottom:8px;font-size:12px;font-weight:850}
@media(max-width:430px){#members .memberCard{padding-top:6px!important;padding-bottom:6px!important}.memberEditorSheetV614,.partnerSheetV614{padding:15px 14px calc(15px + env(safe-area-inset-bottom))}.v614Choice{gap:5px}.v614ChoiceBtn{padding:9px 10px}.v614PartnerResult{align-items:flex-start;flex-direction:column;gap:2px}}
${CE}`;
css=css.slice(0,cs)+cssBlock+css.slice(ce+CE.length);

for(const check of ["function buildLabelV6(){return 'v6.14'}","__kokmatchReliableActionTapV6='v6.14'","__kokmatchFastMemberActionsV6='v6.14'","__kokmatchCanonicalMemberEditorV6='v6.14'","__kokmatchFastPartnerV6='v6.14'","memberEditorStateV614","openPartnerOverlayV614","margin:-8px 0 0","margin:8px 0 0"]){if(!(js.includes(check)||css.includes(check)))throw new Error('v6.14 marker missing: '+check)}
fs.writeFileSync(JS,js);fs.writeFileSync(CSS,css);
console.log('v6.14 partner popup, member actions, canonical editor controls and roster spacing installed.');
