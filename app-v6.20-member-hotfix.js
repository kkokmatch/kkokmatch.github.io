/* 콕매치 v6.21 canonical member/save/roster stabilization · 2026-09-02 */
(()=>{
  'use strict';
  const API='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-v60-api';
  const actionBusy=new Set();

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
  function cardId(card){return String(card?.dataset?.memberId22||card?.dataset?.memberId||card?.dataset?.memberId46||'')}
  function actorKind(){
    try{return me?.globalAdmin?'admin':me?.tempOrganizer?'temp':String(me?.role||'member')}catch{return'member'}
  }
  function memberRole(m){
    try{return typeof roleOf==='function'?roleOf(m):String(m?.role||'member')}catch{return String(m?.role||'member')}
  }
  function isSelf(m){
    if(!m)return false;
    try{if(me?.memberId)return String(me.memberId)===String(m.id)}catch{}
    try{return String(me?.displayName||'').trim()===String(m.name||'').trim()}catch{return false}
  }
  function canAttendance(m){return ['admin','manager','organizer','temp'].includes(actorKind())||isSelf(m)}
  function canEdit(m){return ['admin','manager','organizer'].includes(actorKind())&&(memberRole(m)!=='admin'||!!me?.globalAdmin)}
  function stateText(m){
    try{return typeof stateLabel==='function'?stateLabel(m?.state):String(m?.state||'')}catch{return String(m?.state||'')}
  }

  async function stableApi(op,body={}){
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
      throw new Error(x.error||(op==='member_save'?'회원정보 저장에 실패했습니다.':'상태 변경에 실패했습니다.'));
    }
    return x;
  }

  /* 구형 저장 API 변수 누락 방지. v6.21에서는 이 함수 하나만 사용한다. */
  window.v615MemberApi=stableApi;
  window.v620MemberApi=stableApi;
  window.__kokmatchMemberApiHotfixV621=true;

  function actionButton(cls,label){return `<button class="btn ${cls} kmRosterAction621" type="button">${label}</button>`}
  function slot(name,content){return `<span class="kmRosterSlot621 kmRosterSlot-${name}621">${content||'<span class="kmRosterPlaceholder621" aria-hidden="true"></span>'}</span>`}

  /* 원래 동작: 미입장=입장/관람/수정, 게임대기=퇴장/관람/수정, 관람=입장/퇴장/수정 */
  function controlsHtml(m){
    if(!m)return'';
    const attendance=canAttendance(m)&&!['playing','matched'].includes(String(m.state||'out'));
    const editable=canEdit(m);
    if(!attendance&&!editable)return `<div class="memberActions48 v6MemberActions kmRosterActions621 kmRosterReadonly621"><div class="status">${html(stateText(m))}</div></div>`;

    let first='',second='';
    if(attendance){
      first=String(m.state)==='waiting'?actionButton('danger','퇴장'):actionButton('enter','입장');
      second=String(m.state)==='spectator'?actionButton('danger','퇴장'):actionButton('watch','관람');
    }
    const edit=editable?actionButton('ghost','수정'):'';
    return `<div class="memberActions48 v6MemberActions kmRosterActions621"><div class="status">${html(stateText(m))}</div><div class="memberBtns kmRosterBtns621">${slot('first',first)}${slot('second',second)}${slot('edit',edit)}</div></div>`;
  }

  function applyControls(){
    const box=document.getElementById('members');
    if(!box)return;
    for(const card of box.querySelectorAll('.memberCard')){
      const id=cardId(card),m=currentMember(id);
      if(!id||!m)continue;
      const temp=document.createElement('div');
      temp.innerHTML=controlsHtml(m);
      const next=temp.firstElementChild;
      if(!next)continue;
      const cur=card.querySelector(':scope > .kmRosterActions621,:scope > .v6MemberActions,:scope > .memberActions48,:scope > .memberActions60,:scope > .memberActions65');
      if(cur)cur.replaceWith(next);else card.appendChild(next);
    }
  }

  function scheduleControls(){
    requestAnimationFrame(()=>{
      applyControls();
      setTimeout(applyControls,0);
    });
  }

  /* 렌더 이후에는 항상 v6.21의 한 가지 버튼 구조만 남긴다. */
  try{
    const baseRenderMembers=renderMembers;
    renderMembers=function(...args){
      const result=baseRenderMembers.apply(this,args);
      scheduleControls();
      return result;
    };
    window.renderMembers=renderMembers;
  }catch{}

  function updateSummary(){
    try{document.getElementById('sm').textContent=String((S?.members||[]).filter(m=>m.state!=='out').length)}catch{}
    try{document.getElementById('sw').textContent=String((S?.queue||[]).length+(S?.pendingGames||[]).reduce((n,g)=>n+(g.players?.length||0),0))}catch{}
    try{document.getElementById('sg').textContent=String((S?.games||[]).length)}catch{}
  }
  function optimisticState(m,mode){
    if(!m)return;
    try{S.queue=(S?.queue||[]).filter(x=>String(x)!==String(m.id))}catch{}
    m.state=mode;
    m.joinedAt=mode==='out'?null:Date.now();
    if(mode==='waiting'){
      try{if(!S.queue.includes(m.id))S.queue.push(m.id)}catch{}
    }
  }

  async function changeAttendance(id,mode){
    id=String(id||'');
    if(!id||actionBusy.has(id))return;
    const m=currentMember(id);if(!m)return;
    if(!canAttendance(m)||['playing','matched'].includes(String(m.state||'')))return;
    const prev={state:m.state,joinedAt:m.joinedAt,queue:Array.isArray(S?.queue)?S.queue.slice():[]};
    actionBusy.add(id);
    optimisticState(m,mode);applyControls();updateSummary();
    try{
      const selfOnly=isSelf(m)&&!['admin','manager','organizer','temp'].includes(actorKind());
      const action=selfOnly?'set_my_attendance':'set_member_attendance';
      const body={action,mode};
      if(!selfOnly)body.memberId=id;
      const x=await stableApi('action',body);
      if(x?.data){
        try{S=x.data;window.S=x.data;normalizeClient()}catch{}
      }
      applyControls();updateSummary();
    }catch(e){
      const cur=currentMember(id);
      if(cur){cur.state=prev.state;cur.joinedAt=prev.joinedAt}
      try{S.queue=prev.queue}catch{}
      applyControls();updateSummary();
      try{showError(e)}catch{alert(e?.message||String(e||'상태 변경에 실패했습니다.'))}
    }finally{actionBusy.delete(id);applyControls()}
  }

  /* 구형 v99 setOther의 DOM 재배치 경로를 더 이상 사용하지 않는다. */
  try{setOther=async function(id,mode){return changeAttendance(id,mode)}}catch{}
  window.setOther=async function(id,mode){return changeAttendance(id,mode)};

  function openEdit(id){
    const m=currentMember(id);if(!m||!canEdit(m))return;
    try{editMemberId=id}catch{}
    try{if(typeof openEditMember==='function'){openEditMember(id);return}}catch{}
    try{if(typeof openMemberModal==='function')openMemberModal(m)}catch(e){alert(e?.message||'회원정보 수정화면을 열지 못했습니다.')}
  }
  function handleActionButton(btn){
    const card=btn?.closest?.('#members .memberCard'),id=cardId(card);if(!id)return;
    const label=String(btn.textContent||'').trim();
    if(label==='수정'){openEdit(id);return}
    if(label==='입장'){changeAttendance(id,'waiting');return}
    if(label==='관람'){changeAttendance(id,'spectator');return}
    if(label==='퇴장'){changeAttendance(id,'out');return}
  }

  /* window capture에서 먼저 처리해 과거 document-level v615/v99 라우터가 개입하지 못하게 한다. */
  let tap=null,lastHandledAt=0;
  const pick=t=>t?.closest?.('#members .kmRosterAction621');
  window.addEventListener('pointerdown',ev=>{
    const b=pick(ev.target);if(!b||b.disabled){tap=null;return}
    tap={b,id:ev.pointerId,x:ev.clientX,y:ev.clientY,at:Date.now(),moved:false};
  },{capture:true,passive:true});
  window.addEventListener('pointermove',ev=>{
    if(!tap||tap.id!==ev.pointerId)return;
    if(Math.hypot(ev.clientX-tap.x,ev.clientY-tap.y)>10)tap.moved=true;
  },{capture:true,passive:true});
  window.addEventListener('pointercancel',()=>{tap=null},{capture:true,passive:true});
  window.addEventListener('pointerup',ev=>{
    const a=tap;tap=null;
    if(!a||a.moved||a.id!==ev.pointerId||Date.now()-a.at>800||pick(ev.target)!==a.b)return;
    a.b.classList.remove('v615Pressed');
    lastHandledAt=Date.now();
    ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();
    handleActionButton(a.b);
  },{capture:true,passive:false});
  window.addEventListener('click',ev=>{
    const b=pick(ev.target);if(!b)return;
    ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();
    if(Date.now()-lastHandledAt>700)handleActionButton(b);
  },true);

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
  async function saveEditor(form){
    const root=form.closest('#memberEditorV615')||document.getElementById('memberEditorV615');
    if(!root)return;
    const id=editorMemberId(),old=currentMember(id);
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

    /* 동명이인은 이름만으로 막지 않는다. 세 항목이 모두 같을 때만 중복으로 처리한다. */
    if(type!=='guest'){
      const dup=(S?.members||[]).find(m=>String(m?.id||'')!==id&&m?.type!=='guest'&&String(m?.name||'').trim()===name&&Number(m?.year)===year&&(m?.gender==='여'?'여':'남')===gender);
      if(dup)return editorError('이름·출생연도·성별이 모두 같은 회원이 이미 있습니다.');
    }

    const b=root.querySelector('#v618Save');
    if(b){b.disabled=true;b.textContent='저장 중...'}
    try{
      const x=await stableApi('member_save',{memberId:id,name,year,gender,cls,type,role,pin,inviter});
      if(x?.data){
        try{S=x.data;window.S=x.data;normalizeClient()}catch{}
      }
      root.remove();
      try{editMemberId=null}catch{}
      try{renderAll()}catch{try{renderMembers();renderHeader()}catch{}}
      scheduleControls();
    }catch(e){editorError(e?.message||String(e||'회원정보 저장에 실패했습니다.'))}
    finally{if(b?.isConnected){b.disabled=false;b.textContent=id?'저장':'등록'}}
  }

  /* 구형 v618 저장 리스너보다 상위 캡처단계에서 처리한다. */
  document.addEventListener('submit',ev=>{
    const form=ev.target;
    if(!(form instanceof HTMLFormElement)||form.id!=='memberEditorFormV618')return;
    ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();
    saveEditor(form);
  },true);

  scheduleControls();
  setTimeout(applyControls,100);
})();
