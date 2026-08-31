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
