/* 콕매치 v6.20 member editor API hotfix · 2026-09-02 */
(()=>{
  'use strict';
  const API='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-v60-api';

  function token(){
    try{
      if(typeof T!=='undefined'&&T)return String(T);
    }catch{}
    try{return String(localStorage.getItem('kokmatch_token')||'')}catch{return ''}
  }

  function groupId(){
    try{
      if(typeof currentGroupId!=='undefined'&&currentGroupId)return String(currentGroupId);
    }catch{}
    try{return String(localStorage.getItem('kokmatch_group_id')||'')}catch{return ''}
  }

  async function stableMemberApi(op,body={}){
    const r=await fetch(API,{
      method:'POST',
      headers:{
        'content-type':'application/json',
        ...(token()?{'authorization':'Bearer '+token()}:{})
      },
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

  /* v6.18 저장화면이 호출하는 이름을 전역에 보장한다. */
  window.v615MemberApi=stableMemberApi;
  if(typeof window.v620MemberApi!=='function')window.v620MemberApi=stableMemberApi;
  window.__kokmatchMemberApiHotfixV620=true;
})();
