/* 콕매치 v6.21 member/save/roster hotfix · 2026-09-02 */
(()=>{
  'use strict';
  const API='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-v60-api';

  function token(){
    try{if(typeof T!=='undefined'&&T)return String(T)}catch{}
    try{return String(localStorage.getItem('kokmatch_token')||'')}catch{return ''}
  }
  function groupId(){
    try{if(typeof currentGroupId!=='undefined'&&currentGroupId)return String(currentGroupId)}catch{}
    try{return String(localStorage.getItem('kokmatch_group_id')||'')}catch{return ''}
  }
  function html(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function currentMember(id){
    try{return (S?.members||[]).find(m=>String(m?.id||'')===String(id||''))||null}catch{return null}
  }
  function actorKind(){
    try{return me?.globalAdmin?'admin':me?.tempOrganizer?'temp':String(me?.role||'member')}catch{return'member'}
  }
  function memberRole(m){
    try{return typeof roleOf==='function'?roleOf(m):String(m?.role||'member')}catch{return String(m?.role||'member')}
  }
  function canAttendance(){return ['admin','manager','organizer','temp'].includes(actorKind())}
  function canEdit(m){return ['admin','manager','organizer'].includes(actorKind())&&(memberRole(m)!=='admin'||!!me?.globalAdmin)}

  async function stableMemberApi(op,body={}){
    const t=token();
    const r=await fetch(API,{
      method:'POST',
      headers:{'content-type':'application/json',...(t?{'authorization':'Bearer '+t}:{})},
      body:JSON.stringify({op,groupId:groupId(),...body}),
      cache:'no-store'
    });
    const x=await r.json().catch(()=>({}));
    if(!r.ok){
      if(r.status===401){
        try{if(typeof reloginLatest==='function')reloginLatest()}catch{}
        throw new Error('로그인이 만료되었습니다.');
      }
      throw new Error(x.error||'회원정보 저장에 실패했습니다.');
    }
    return x;
  }

  /* v6.18 이전 저장화면의 전역 API 누락을 제거한다. */
  window.v615MemberApi=stableMemberApi;
  window.v620MemberApi=stableMemberApi;
  window.__kokmatchMemberApiHotfixV621=true;

  function stateText(m){
    try{return typeof stateLabel==='function'?stateLabel(m?.state):String(m?.state||'')}catch{return String(m?.state||'')}
  }
  function button(cls,label){return `<button class="btn ${cls} kmRosterAction621" type="button">${label}</button>`}
  function slot(name,content){return `<span class="kmRosterSlot621 kmRosterSlot-${name}621">${content||'<span class="kmRosterPlaceholder621" aria-hidden="true"></span>'}</span>`}

  /*
    원래 사용하던 3칸 고정 동작을 복원한다.
    미입장: 입장 | 관람 | 수정
    게임대기: 퇴장 | 관람 | 수정
    관람: 입장 | 퇴장 | 수정
  */
  function threeButtonControlHtml(m){
    if(!m)return'';
    const attendance=canAttendance()&&!['playing','matched'].includes(String(m.state||'out'));
    const editable=canEdit(m);
    if(!attendance&&!editable)return `<div class="status">${html(stateText(m))}</div>`;

    let first='',second='';
    if(attendance){
      if(String(m.state)==='waiting')first=button('danger','퇴장');
      else first=button('enter','입장');

      if(String(m.state)==='spectator')second=button('danger','퇴장');
      else second=button('watch','관람');
    }
    const edit=editable?button('ghost','수정'):'';
    return `<div class="memberActions48 v6MemberActions kmRosterActions621"><div class="status">${html(stateText(m))}</div><div class="memberBtns kmRosterBtns621">${slot('first',first)}${slot('second',second)}${slot('edit',edit)}</div></div>`;
  }

  try{memberControlHtmlV6=threeButtonControlHtml}catch{}
  try{memberControls=threeButtonControlHtml}catch{}
  window.memberControlHtmlV6=threeButtonControlHtml;
  window.__kokmatchThreeButtonRoster621=true;

  function editorError(msg=''){
    const el=document.getElementById('memberEditorErrorV618');
    if(el)el.textContent=String(msg||'');
    else if(msg)alert(msg);
  }
  function editorMemberId(){
    try{if(typeof memberEditorStateV618!=='undefined'&&memberEditorStateV618?.memberId)return String(memberEditorStateV618.memberId)}catch{}
    try{if(typeof editMemberId!=='undefined'&&editMemberId)return String(editMemberId)}catch{}
    return'';
  }
  async function saveV621(form){
    const root=form.closest('#memberEditorV615')||document.getElementById('memberEditorV615');
    if(!root)return;
    const id=editorMemberId();
    const old=currentMember(id);
    const name=String(root.querySelector('#v618Name')?.value??old?.name??'').trim();
    const year=Number(root.querySelector('#v618Year')?.value||0);
    const gender=String(root.querySelector('#v618Gender')?.value||old?.gender||'남')==='여'?'여':'남';
    const cls=String(root.querySelector('#v618Cls')?.value||old?.cls||'C').toUpperCase();
    const type=String(root.querySelector('#v618Type')?.value||old?.type||'member')==='guest'?'guest':'member';
    let role=String(root.querySelector('#v618Role')?.value||old?.role||'member');
    if(type==='guest')role='member';
    const pin=String(root.querySelector('#v618Pin')?.value||'').trim();
    const inviter=type==='guest'?String(root.querySelector('#v618Inviter')?.value||'').trim():'';

    editorError('');
    if(!name)return editorError('이름을 입력해주세요.');
    if(!Number.isInteger(year)||year<1900||year>new Date().getFullYear())return editorError('출생연도를 확인해주세요.');
    if(!['A','B','C','D','E'].includes(cls))return editorError('급수는 A~E로 선택해주세요.');
    if(pin&&!/^\d{4,8}$/.test(pin))return editorError('PIN/비밀번호는 숫자 4~8자리로 입력해주세요.');
    if(type==='guest'&&!inviter)return editorError('게스트의 초대인을 입력해주세요.');

    /* 이름만으로 막지 않고 이름+출생연도+성별이 모두 같을 때만 동일인 후보로 판단 */
    if(type!=='guest'){
      const dup=(S?.members||[]).find(m=>String(m?.id||'')!==id&&m?.type!=='guest'&&String(m?.name||'').trim()===name&&Number(m?.year)===year&&(m?.gender==='여'?'여':'남')===gender);
      if(dup)return editorError('이름·출생연도·성별이 모두 같은 회원이 이미 있습니다.');
    }

    const b=root.querySelector('#v618Save');
    if(b){b.disabled=true;b.textContent='저장 중...'}
    try{
      const x=await stableMemberApi('member_save',{memberId:id,name,year,gender,cls,type,role,pin,inviter});
      if(x?.data){
        try{S=x.data;window.S=x.data;normalizeClient()}catch{}
      }
      root.remove();
      try{editMemberId=null}catch{}
      try{renderAll()}catch{try{renderMembers();renderHeader()}catch{}}
      try{window.__kokmatchFinalizeRoster22?.()}catch{}
      try{if(typeof standardizeRosterV618==='function')standardizeRosterV618()}catch{}
    }catch(e){editorError(e?.message||String(e||'회원정보 저장에 실패했습니다.'))}
    finally{if(b?.isConnected){b.disabled=false;b.textContent=id?'저장':'등록'}}
  }

  /* 기존 v618 submit 핸들러보다 먼저 처리해 v615MemberApi 범위 오류를 완전히 차단한다. */
  document.addEventListener('submit',ev=>{
    const form=ev.target;
    if(!(form instanceof HTMLFormElement)||form.id!=='memberEditorFormV618')return;
    ev.preventDefault();
    ev.stopPropagation();
    ev.stopImmediatePropagation();
    saveV621(form);
  },true);

  function refreshRoster(){
    try{
      if(typeof repairMemberControlsV6==='function')repairMemberControlsV6();
      else if(typeof renderMembers==='function')renderMembers();
    }catch{}
  }
  requestAnimationFrame(refreshRoster);
  setTimeout(refreshRoster,80);
})();
