import fs from 'node:fs';

const JS='app-v6.0.js',CSS='app-v6.0.css';
let js=fs.readFileSync(JS,'utf8'),css=fs.readFileSync(CSS,'utf8');
if(!js.includes("window.__kokmatchStandalone='6.0'"))throw new Error('Not a v6 standalone runtime');
if(!js.includes("__kokmatchBackgroundPollV617='v6.17'"))throw new Error('v6.17 must be generated first');

js=js.replaceAll('v6.17','v6.18');
js=js.replace(/function buildLabelV6\(\)\{return 'v6\.\d+'\}/,"function buildLabelV6(){return 'v6.18'}");

const patch=String.raw`
/* V6_18_CANONICAL_MEMBER_TEMPLATE_BEGIN */
window.__kokmatchMemberTemplateV618='v6.18';
function escV618(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function roleV618(m){try{return v615Role(m)}catch{return String(m?.role||'member')}}
function roleBadgeV618(m){const r=roleV618(m);if(r==='admin')return '<span class="roleBadge role-global">개발자</span>';if(r==='manager')return '<span class="roleBadge role-manager">모임장</span>';if(r==='organizer')return '<span class="roleBadge role-organizer">운영진</span>';try{if(typeof isTemp==='function'&&isTemp(m))return '<span class="roleBadge role-temp">편성자</span>'}catch{}return '<span class="roleBadge role-member44">일반</span>'}
function gradeBadgeV618(m){const c=['A','B','C','D','E'].includes(String(m?.cls||'').toUpperCase())?String(m.cls).toUpperCase():'C';return '<span class="tag grade-'+c.toLowerCase()+'50">'+escV618(m?.age||'30')+c+'</span>'}
function monthV618(){const d=new Date();return Number(new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',month:'2-digit'}).format(d))+'월'}
function attendanceV618(m){try{if(typeof attendanceCount22==='function')return attendanceCount22(m)}catch{}return Math.max(0,Number(m?.attendanceCount)||0)}
function canPartnerV618(m){try{return typeof canPartner22==='function'?canPartner22(m):!!m&&!!me&&(String(me.memberId||'')===String(m.id)||me.globalAdmin||me.role==='manager'||me.role==='organizer')}catch{return false}}
function standardizeMemberCardV618(card,m){
 if(!card||!m)return;
 card.dataset.memberId22=String(m.id||'');card.dataset.memberId=String(m.id||'');card.dataset.gradeV6=String(m.cls||'C').toUpperCase();
 let info=card.querySelector(':scope > .memberInfoV618,:scope > .memberInfoV6,:scope > .memberInfo48');
 if(!info){info=card.children?.[1]||null;if(!info)return}
 info.className='memberInfo48 memberInfoV6 memberInfoV618';
 const guest=m?.type==='guest'?'<span class="roleBadge guest">GUEST</span>':'';
 info.innerHTML='<div class="memberMainLine45"><span class="memberName45">'+escV618(m.name||'')+'</span>'+gradeBadgeV618(m)+roleBadgeV618(m)+guest+'</div><div class="memberMetaV6">'+escV618(m.year||'')+'년생 · '+escV618(m.gender||'')+'</div><div class="memberRosterFooterV6"><span class="memberAttendanceV6">'+monthV618()+' 출석 '+attendanceV618(m)+'회</span>'+(canPartnerV618(m)?'<button type="button" class="partnerSetBtn66 rosterPartnerBtnV6" data-member-id="'+escV618(m.id||'')+'">파트너 설정</button>':'<span class="rosterPartnerSpacerV618" aria-hidden="true"></span>')+'</div>';
 card.querySelectorAll(':scope > .memberRelation83,:scope > .relationInfo66,.memberRelation83,.relationInfo66').forEach(el=>el.classList.add('v616PartnerNameHidden'));
}
function standardizeRosterV618(){const box=document.getElementById('members');if(!box||!Array.isArray(S?.members))return;const map=new Map(S.members.map(m=>[String(m.id),m]));[...box.querySelectorAll('.memberCard')].forEach((card,i)=>{const id=String(card.dataset.memberId22||card.dataset.memberId||card.dataset.memberId46||'');const m=map.get(id)||S.members[i];if(m)standardizeMemberCardV618(card,m)})}
const renderMembersV618=renderMembers;
renderMembers=function(...a){const r=renderMembersV618.apply(this,a);try{standardizeRosterV618()}catch{}return r};window.renderMembers=renderMembers;
const finalizeV618=window.__kokmatchFinalizeRoster22;
if(typeof finalizeV618==='function')window.__kokmatchFinalizeRoster22=function(...a){const r=finalizeV618.apply(this,a);try{standardizeRosterV618()}catch{}return r};

let memberEditorStateV618=null;
function closeMemberEditorV618(){document.getElementById('memberEditorV615')?.remove();memberEditorStateV618=null;try{memberEditorStateV615=null}catch{}}
function editorErrorV618(msg=''){const el=document.getElementById('memberEditorErrorV618');if(el)el.textContent=String(msg||'')}
async function saveMemberEditorV618(ev){
 ev?.preventDefault?.();ev?.stopPropagation?.();const st=memberEditorStateV618,root=document.getElementById('memberEditorV615');if(!st||!root)return false;
 const name=String(root.querySelector('#v618Name')?.value||'').trim(),year=Number(root.querySelector('#v618Year')?.value||0),gender=String(root.querySelector('#v618Gender')?.value||'남'),cls=String(root.querySelector('#v618Cls')?.value||'C'),type=String(root.querySelector('#v618Type')?.value||st.type||'member');let role=String(root.querySelector('#v618Role')?.value||st.role||'member');if(type==='guest')role='member';const pin=String(root.querySelector('#v618Pin')?.value||'').trim(),inviter=type==='guest'?String(root.querySelector('#v618Inviter')?.value||'').trim():'';
 editorErrorV618('');if(!name){editorErrorV618('이름을 입력해주세요.');return false}if(!Number.isInteger(year)||year<1900||year>new Date().getFullYear()){editorErrorV618('출생연도를 확인해주세요.');return false}if(pin&&!/^\d{4,8}$/.test(pin)){editorErrorV618('PIN/비밀번호는 숫자 4~8자리로 입력해주세요.');return false}if(type==='guest'&&!inviter){editorErrorV618('게스트의 초대인을 입력해주세요.');return false}
 const b=root.querySelector('#v618Save');if(b){b.disabled=true;b.textContent='저장 중...'}
 try{const x=await v615MemberApi('member_save',{memberId:st.memberId||'',name,year,gender,cls,type,role,pin,inviter});if(x?.data){S=x.data;window.S=x.data;try{normalizeClient()}catch{}}closeMemberEditorV618();renderHeader();renderNav();renderMembers();window.__kokmatchFinalizeRoster22?.();standardizeRosterV618();return true}catch(e){editorErrorV618(e?.message||String(e||'회원정보 저장에 실패했습니다.'));return false}finally{if(b?.isConnected){b.disabled=false;b.textContent=st.memberId?'저장':'등록'}}
}
function openMemberEditorV618(m){
 const add=!m,r=m?roleV618(m):'member',actor=(()=>{try{return v615Actor()}catch{return'member'}})(),isAdmin=!add&&r==='admin',roleEditable=!!me?.globalAdmin||actor==='manager',typeLocked=isAdmin||(actor==='organizer'&&!add&&r!=='member');
 memberEditorStateV618={memberId:m?.id||'',type:m?.type==='guest'?'guest':'member',role:isAdmin?'admin':(add?'member':r)};
 const roleField=isAdmin?'<input id="v618Role" type="hidden" value="admin"><div class="field"><label>역할</label><div class="memberEditorFixedV615">개발자</div></div>':roleEditable?'<div class="field"><label>역할</label><select id="v618Role"><option value="member" '+(memberEditorStateV618.role==='member'?'selected':'')+'>일반</option><option value="organizer" '+(memberEditorStateV618.role==='organizer'?'selected':'')+'>운영진</option><option value="manager" '+(memberEditorStateV618.role==='manager'?'selected':'')+'>모임장</option></select></div>':'<input id="v618Role" type="hidden" value="'+escV618(memberEditorStateV618.role)+'"><div class="field"><label>역할</label><div class="memberEditorFixedV615">'+escV618(typeof v615RoleLabel==='function'?v615RoleLabel(memberEditorStateV618.role):memberEditorStateV618.role)+'</div></div>';
 const typeField=typeLocked?'<input id="v618Type" type="hidden" value="'+escV618(memberEditorStateV618.type)+'"><div class="field"><label>구분</label><div class="memberEditorFixedV615">'+(memberEditorStateV618.type==='guest'?'게스트':'일반')+'</div></div>':'<div class="field"><label>구분</label><select id="v618Type"><option value="member" '+(memberEditorStateV618.type==='member'?'selected':'')+'>일반</option><option value="guest" '+(memberEditorStateV618.type==='guest'?'selected':'')+'>게스트</option></select></div>';
 closeMemberEditorV618();document.getElementById('modal')?.classList.remove('on');const root=document.createElement('div');root.id='memberEditorV615';root.className='memberEditorOverlayV615';root.innerHTML='<form id="memberEditorFormV618" class="memberEditorSheetV615" novalidate><h3>'+(add?'회원등록':'회원 정보 수정')+'</h3><div class="note">박태영 카드와 동일한 회원정보 구조를 사용합니다.</div><div class="field"><label>이름</label><input id="v618Name" value="'+escV618(m?.name||'')+'" '+(isAdmin?'disabled':'')+'></div><div class="grid2"><div class="field"><label>출생연도</label><input id="v618Year" type="number" inputmode="numeric" value="'+escV618(m?.year||'')+'"></div><div class="field"><label>성별</label><select id="v618Gender"><option value="남" '+(m?.gender!=='여'?'selected':'')+'>남</option><option value="여" '+(m?.gender==='여'?'selected':'')+'>여</option></select></div><div class="field"><label>급수</label><select id="v618Cls">'+['A','B','C','D','E'].map(c=>'<option value="'+c+'" '+(String(m?.cls||'C').toUpperCase()===c?'selected':'')+'>'+c+'</option>').join('')+'</select></div>'+typeField+'</div>'+roleField+'<div class="field"><label>로그인 PIN / 비밀번호</label><input id="v618Pin" type="password" inputmode="numeric" maxlength="8" autocomplete="new-password" placeholder="변경할 때만 숫자 4~8자리 입력"></div><div class="field" id="v618InviterWrap"><label>초대인</label><input id="v618Inviter" value="'+escV618(m?.inviter||'')+'" maxlength="40" placeholder="게스트일 때만 입력"></div><div id="memberEditorErrorV618" class="error memberEditorErrorV618" aria-live="polite"></div><div class="acts memberEditorActsV618">'+(!add&&!isAdmin?'<button id="v618Delete" class="btn danger" type="button">삭제</button>':'')+'<button id="v618Cancel" class="btn ghost" type="button">취소</button><button id="v618Save" class="btn pri" type="submit">'+(add?'등록':'저장')+'</button></div></form>';document.body.appendChild(root);
 const form=root.querySelector('#memberEditorFormV618');form.addEventListener('submit',saveMemberEditorV618);root.querySelector('#v618Cancel')?.addEventListener('click',closeMemberEditorV618);root.querySelector('#v618Delete')?.addEventListener('click',()=>{try{memberEditorStateV615={memberId:memberEditorStateV618?.memberId||''};deleteMemberEditorV615()}catch(e){editorErrorV618(e?.message||String(e))}});root.addEventListener('click',ev=>{if(ev.target===root)closeMemberEditorV618()});const sync=()=>{const type=root.querySelector('#v618Type')?.value||memberEditorStateV618.type;root.querySelector('#v618InviterWrap')?.classList.toggle('hide',type!=='guest')};root.querySelector('#v618Type')?.addEventListener('change',sync);sync();return true
}
try{openMemberEditorV615=openMemberEditorV618}catch{};try{window.openMemberModal=openMemberEditorV618}catch{};try{openMemberModal=openMemberEditorV618}catch{};try{window.saveMemberEditorV618=saveMemberEditorV618}catch{}
standardizeRosterV618();
/* V6_18_CANONICAL_MEMBER_TEMPLATE_END */
`;
js+='\n'+patch+'\n';

const marker='/* V6_UI_STABILITY_CSS_END */',pos=css.indexOf(marker);if(pos<0)throw new Error('CSS marker missing');
const style=`
/* v6.18 Park Tae-young canonical member-card template */
#members .memberCard{grid-template-columns:46px minmax(0,1fr) 104px!important;column-gap:6px!important;align-items:center!important;overflow:hidden!important}
#members .memberInfoV618{display:flex!important;flex-direction:column!important;justify-content:center!important;gap:0!important;min-height:62px!important;overflow:hidden!important}
#members .memberInfoV618 .memberMainLine45{margin:0!important;min-height:18px!important;line-height:1.18!important;overflow:visible!important}
#members .memberInfoV618 .memberMetaV6{margin:4px 0 0!important;padding:0!important;line-height:1.15!important;min-height:12px!important}
#members .memberInfoV618 .memberRosterFooterV6{margin:8px 0 0!important;padding:0!important;min-height:16px!important;line-height:1.1!important;display:flex!important;align-items:center!important;gap:6px!important}
#members .rosterPartnerSpacerV618{display:inline-block!important;min-width:1px!important;min-height:12px!important}
#members .v6MemberActions,#members .memberActions48,#members .memberActions60,#members .memberActions65{position:static!important;inset:auto!important;transform:none!important;width:104px!important;min-width:104px!important;max-width:104px!important;align-self:center!important;justify-self:end!important;overflow:visible!important}
#members .memberBtns,#members .memberBtns65{position:static!important;inset:auto!important;transform:none!important;width:104px!important;min-width:104px!important;max-width:104px!important;display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:4px!important;overflow:visible!important}
#members .memberBtns .btn,#members .memberBtns65 .btn{position:static!important;inset:auto!important;transform:none!important;width:100%!important;min-width:0!important;max-width:none!important;height:29px!important;min-height:29px!important;margin:0!important;padding:0 2px!important;display:flex!important;align-items:center!important;justify-content:center!important;white-space:nowrap!important;font-size:9.5px!important;line-height:1!important;overflow:hidden!important}
#members .memberBtns .btn:nth-child(odd):last-child,#members .memberBtns65 .btn:nth-child(odd):last-child{grid-column:1/-1!important}
#memberEditorV615 #memberEditorFormV618{pointer-events:auto!important;touch-action:pan-y!important}
#memberEditorV615 #v618Save,#memberEditorV615 #v618Cancel,#memberEditorV615 #v618Delete{pointer-events:auto!important;touch-action:manipulation!important;position:static!important;transform:none!important;min-height:44px!important}
#memberEditorV615 .memberEditorErrorV618{min-height:18px!important;margin-top:6px!important;font-size:12px!important;color:#c93636!important}
@media(max-width:430px){#members .memberCard{grid-template-columns:42px minmax(0,1fr) 96px!important;column-gap:4px!important}#members .v6MemberActions,#members .memberActions48,#members .memberActions60,#members .memberActions65,#members .memberBtns,#members .memberBtns65{width:96px!important;min-width:96px!important;max-width:96px!important}#members .memberBtns,#members .memberBtns65{gap:3px!important}#members .memberBtns .btn,#members .memberBtns65 .btn{height:28px!important;min-height:28px!important;font-size:9px!important}}
@media(max-width:359px){#members .memberCard{grid-template-columns:39px minmax(0,1fr) 92px!important}#members .v6MemberActions,#members .memberActions48,#members .memberActions60,#members .memberActions65,#members .memberBtns,#members .memberBtns65{width:92px!important;min-width:92px!important;max-width:92px!important}#members .memberBtns .btn,#members .memberBtns65 .btn{font-size:8.7px!important}}
`;
css=css.slice(0,pos)+style+css.slice(pos);

for(const c of ["function buildLabelV6(){return 'v6.18'}","__kokmatchMemberTemplateV618='v6.18'","memberEditorFormV618","saveMemberEditorV618","standardizeRosterV618"]){if(!js.includes(c))throw new Error('v6.18 JS marker missing: '+c)}
for(const c of ['grid-template-columns:46px minmax(0,1fr) 104px','memberInfoV618','memberEditorErrorV618'])if(!css.includes(c))throw new Error('v6.18 CSS marker missing: '+c);
fs.writeFileSync(JS,js);fs.writeFileSync(CSS,css);
console.log('v6.18 standardized every roster card to the Park Tae-young layout, stabilized action buttons, and replaced member save with native form submit.');
