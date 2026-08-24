(()=>{
const MEMBER36_API='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-member-v45';
function role36(){const type=$('fmType')?.value==='guest'?'guest':'member';let role=$('fmRole')?.value||'member';if(type==='guest')role='member';return{type,role}}
function sig36(x){const type=String(x?.type||'member')==='guest'?'guest':'member',role=type==='guest'?'member':String(x?.role||'member');return[String(x?.name||'').trim(),String(Number(x?.year)||''),String(x?.gender||'남'),String(x?.cls||'C').toUpperCase(),type,role].join('|')}
function label36(x){const kind=x.type==='guest'?'게스트':x.role==='manager'?'모임장':x.role==='organizer'?'운영진':'일반회원';return`${x.name} · ${x.year}년생 · ${x.gender} · ${x.cls}급 · ${kind}`}
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
