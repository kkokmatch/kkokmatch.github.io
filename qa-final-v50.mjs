const API='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-v19-api';
const gid='grp_qa2_cc2156d17118';
const tokens={manager:'qa50-manager',org:'qa50-org',m1:'qa50-m1',m2:'qa50-m2',m3:'qa50-m3',m4:'qa50-m4',m5:'qa50-m5',m6:'qa50-m6'};
async function call(token,action,body={}){
  const r=await fetch(API,{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${token}`},body:JSON.stringify({action,groupId:gid,...body})});
  const x=await r.json().catch(()=>({})); return {status:r.status,body:x};
}
function assert(cond,msg,detail){if(!cond){console.error('FAIL',msg,detail||'');process.exitCode=1;throw new Error(msg)}console.log('PASS',msg)}
function pollFrom(x){return x.body?.data?.attendancePolls?.at(-1)}
const memberTokens=[tokens.m1,tokens.m2,tokens.m3,tokens.m4,tokens.m5,tokens.m6];
let r=await call(tokens.m1,'poll_create',{date:'2026-08-26',time:'01:30',endTime:'03:30',location:'QA코트',title:'권한차단QA',totalLimit:5,guestLimit:2});
assert(r.status===403,'일반회원 투표생성 차단',r);
r=await call(tokens.manager,'poll_create',{date:'2026-08-26',time:'01:30',endTime:'03:30',location:'QA코트',title:'QA 동시회원투표',totalLimit:5,guestLimit:2});
assert(r.status===200,'운영진 투표생성'); const p1=pollFrom(r); assert(!!p1?.id,'투표ID 생성');
const votes=await Promise.all(memberTokens.map(t=>call(t,'poll_vote',{pollId:p1.id})));
const vs=votes.map(x=>x.status); console.log('member vote statuses',vs);
assert(vs.filter(x=>x===200).length===5 && vs.filter(x=>x===409).length===1,'전체정원 동시투표 원자성',vs);
r=await call(tokens.manager,'poll_update',{pollId:p1.id,date:'2026-08-26',time:'01:30',endTime:'03:30',location:'QA코트',title:'QA 동시회원투표',totalLimit:4,guestLimit:2});
assert(r.status===400,'현재 참석수보다 정원 축소 차단',r);
r=await call(tokens.manager,'poll_delete',{pollId:p1.id}); assert(r.status===200,'회원투표 QA 삭제');
r=await call(tokens.manager,'poll_create',{date:'2026-08-26',time:'01:30',endTime:'03:30',location:'QA코트',title:'QA 동시게스트',totalLimit:10,guestLimit:2});
assert(r.status===200,'게스트 QA 투표생성'); const p2=pollFrom(r);
const guestReq=[1,2,3,4].map(i=>call(tokens.org,'poll_guest_add',{pollId:p2.id,name:`QA게스트${i}`,year:'1992',age:'30',gender:i%2?'남':'여',cls:'C',inviter:'김용화'}));
const gs=(await Promise.all(guestReq)).map(x=>x.status); console.log('guest statuses',gs);
assert(gs.filter(x=>x===200).length===2 && gs.filter(x=>x===409).length===2,'게스트 정원 동시추가 원자성',gs);
const dup=await Promise.all([1,2].map(()=>call(tokens.org,'poll_guest_add',{pollId:p2.id,name:'QA중복게스트',year:'1991',age:'30',gender:'남',cls:'C',inviter:'김용화'})));
console.log('duplicate guest statuses',dup.map(x=>x.status));
assert(dup.every(x=>x.status===409),'정원 도달 후 추가 게스트 차단',dup);
r=await call(tokens.manager,'poll_guest_close',{pollId:p2.id,closed:true}); assert(r.status===200,'게스트 모집 마감');
r=await call(tokens.org,'poll_guest_add',{pollId:p2.id,name:'QA마감후',year:'1990',age:'30',gender:'남',cls:'C',inviter:'김용화'}); assert(r.status===409,'마감 후 게스트 추가 차단',r);
r=await call(tokens.manager,'poll_delete',{pollId:p2.id}); assert(r.status===200,'게스트 QA 투표삭제 및 임시게스트 정리');
console.log('QA_FINAL_OK');
