import fs from 'node:fs';
import { chromium } from 'playwright';

const latest=JSON.parse(fs.readFileSync('latest-version.json','utf8'));
const VERSION=String(latest.semanticVersion||'').replace(/^v/,'');
const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const yesterday=(()=>{const d=new Date(Date.now()-86400000);return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(d)})();
const state={courtCount:8,courtNames:Array.from({length:8},(_,i)=>`${i+1}코트`),queue:[],pendingGames:[],games:[],history:[],pairCounts:{},members:[{id:'mgr',name:'관리자',year:1985,gender:'남',age:'40',cls:'B',type:'member',role:'manager',state:'out',totalGames:0},{id:'same1',name:'김민수',year:1990,gender:'남',age:'30',cls:'B',type:'member',role:'member',state:'out',totalGames:0},{id:'same2',name:'김민수',year:1992,gender:'여',age:'30',cls:'C',type:'member',role:'member',state:'out',totalGames:0}],attendancePolls:[{id:'poll-open',date:today,time:'00:00',endTime:'23:30',location:'QA 코트',title:'QA 운동 참석 투표',createdBy:'관리자',memberVotes:{},guestEntries:[],totalLimit:12,guestLimit:4,guestClosed:false},{id:'poll-ended',date:yesterday,time:'18:30',endTime:'21:30',location:'지난 코트',title:'종료된 QA 투표',createdBy:'관리자',memberVotes:{},guestEntries:[],totalLimit:12,guestLimit:4,guestClosed:false}]};
const clone=()=>JSON.parse(JSON.stringify(state));
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const pageErrors=[],pollApiPaths=[];
page.on('pageerror',e=>pageErrors.push(String(e?.stack||e)));
page.on('request',r=>{const u=r.url();if(u.includes('/functions/v1/kokmatch-v')&&u.includes('-api'))pollApiPaths.push(new URL(u).pathname)});

await page.route('https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/**',async route=>{
  const req=route.request(),url=new URL(req.url());let body={};try{body=JSON.parse(req.postData()||'{}')}catch{}
  if(url.pathname.endsWith('/kokmatch-v66-api')&&body.action==='partner_set'){const m=state.members.find(x=>String(x.id)===String(body.memberId));if(m){m.partnerId=String(body.partnerId||'');m.partnerDay=today;}return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,data:clone()})});}
  if(url.pathname.endsWith('/kokmatch-v21-api')){
    const action=String(body.action||''),p=state.attendancePolls.find(x=>String(x.id)===String(body.pollId));
    if(action==='poll_toggle_vote'&&p){p.memberVotes=p.memberVotes||{};if(p.memberVotes.mgr==='yes')delete p.memberVotes.mgr;else p.memberVotes.mgr='yes';}
    else if(action==='poll_create')state.attendancePolls.push({id:'poll-created',createdBy:'관리자',memberVotes:{},guestEntries:[],guestClosed:false,...body});
    else if(action==='poll_update'&&p)Object.assign(p,body);
    else if(action==='poll_delete')state.attendancePolls=state.attendancePolls.filter(x=>String(x.id)!==String(body.pollId));
    else if(action==='poll_member_remove'&&p){p.memberVotes=p.memberVotes||{};delete p.memberVotes[String(body.memberId||'')];}
    else if(action==='poll_guest_close'&&p)p.guestClosed=!!body.closed;
    else if(action==='poll_guest_add'&&p){const id='guest-qa';const g={id,memberId:id,name:body.name,year:body.year,gender:body.gender,age:body.age,cls:body.cls,inviter:body.inviter};p.guestEntries=p.guestEntries||[];p.guestEntries.push(g);state.members.push({id,name:body.name,year:body.year,gender:body.gender,age:body.age,cls:body.cls,type:'guest',role:'member',state:'out',pollGuest:true});}
    else if(action==='poll_guest_remove'&&p){p.guestEntries=(p.guestEntries||[]).filter(g=>String(g.id)!==String(body.guestId));state.members=state.members.filter(m=>String(m.id)!==String(body.guestId));}
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,data:clone()})});
  }
  if(url.pathname.includes('profile'))return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({profiles:{},success:true})});
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,data:clone(),profiles:{},groups:[],group:{groupId:'qa',name:'QA 모임'}})});
});

try{
  await page.goto('http://127.0.0.1:4173/?qa=partner-poll',{waitUntil:'networkidle'});
  await page.waitForFunction(v=>window.__kokmatchVersionLock===v&&typeof window.renderAll==='function',VERSION,{timeout:15000});
  await page.evaluate(({state})=>{T='qa-token';currentGroupId='qa';currentView='members';S=JSON.parse(JSON.stringify(state));window.S=S;me={memberId:'mgr',displayName:'관리자',role:'manager',globalAdmin:false,tempOrganizer:false,groupId:'qa'};group={groupId:'qa',name:'QA 모임'};groups=[];normalizeClient();renderAll();document.getElementById('login')?.classList.add('hide');},{state:clone()});

  await page.evaluate(()=>window.openPartner66('mgr'));await page.fill('#v615PartnerSearch','김민수');
  const rows=await page.locator('#v615PartnerResults .v615PartnerResult').allTextContents();
  if(rows.length!==2||!rows.some(x=>x.includes('1990년생')&&x.includes('남')&&x.includes('B급'))||!rows.some(x=>x.includes('1992년생')&&x.includes('여')&&x.includes('C급')))throw new Error('partner duplicate-name disambiguation failed: '+JSON.stringify(rows));
  await page.locator('#v615PartnerResults .v615PartnerResult').filter({hasText:'1992년생'}).click();await page.locator('#partnerOverlayV615 [data-v615-action="partnersave"]').click();await page.waitForSelector('#partnerOverlayV615',{state:'detached'});
  if(await page.evaluate(()=>S.members.find(x=>x.id==='mgr')?.partnerId||'')!=='same2')throw new Error('partner save failed');

  await page.evaluate(()=>goView('stats'));await page.waitForSelector('.pollCard623');let cards=page.locator('.pollCard623');if(await cards.count()!==1)throw new Error('today poll count mismatch');let openCard=cards.first();
  await openCard.getByRole('button',{name:'참석',exact:true}).click();await page.waitForTimeout(80);openCard=page.locator('.pollCard623').first();if(!(await openCard.textContent()).includes('참석중'))throw new Error('attendance ON failed');
  await openCard.getByRole('button',{name:/참석 명단/}).click();if(!(await page.locator('#modalSheet').textContent()).includes('관리자'))throw new Error('attendee list missing voter');await page.getByRole('button',{name:'닫기',exact:true}).click();
  openCard=page.locator('.pollCard623').first();await openCard.getByRole('button',{name:/참석중/}).click();await page.waitForTimeout(80);if((await page.locator('.pollCard623').first().textContent()).includes('참석중'))throw new Error('attendance OFF failed');

  await page.getByRole('button',{name:'+ 투표 만들기'}).click();await page.fill('#pollLocation19','신규 QA 코트');await page.fill('#pollTitle19','신규 QA 투표');await page.fill('#pollTotalLimit19','16');await page.fill('#pollGuestLimit19','6');await page.getByRole('button',{name:'투표 시작',exact:true}).click();await page.waitForFunction(()=>S.attendancePolls?.some(x=>x.id==='poll-created'));
  let stored=await page.evaluate(()=>S.attendancePolls.find(x=>x.id==='poll-created'));if(!stored||stored.title!=='신규 QA 투표'||stored.location!=='신규 QA 코트'||Number(stored.totalLimit)!==16||Number(stored.guestLimit)!==6)throw new Error('create values wrong: '+JSON.stringify(stored));
  let created=page.locator('.pollCard623').filter({hasText:'신규 QA 코트'});await created.getByRole('button',{name:'수정',exact:true}).click();await page.fill('#pollLocation19','수정 QA 코트');await page.fill('#pollTitle19','수정된 QA 투표');await page.getByRole('button',{name:'수정 저장',exact:true}).click();await page.waitForFunction(()=>S.attendancePolls?.some(x=>x.id==='poll-created'&&x.location==='수정 QA 코트'));

  created=page.locator('.pollCard623').filter({hasText:'수정 QA 코트'});await created.getByRole('button',{name:'+ 게스트 참가 추가'}).click();await page.fill('#pollGuestName623','게스트QA');await page.fill('#pollGuestYear623','1993');await page.selectOption('#pollGuestGender623','여');await page.selectOption('#pollGuestCls623','C');await page.selectOption('#pollGuestInviter623','관리자');await page.getByRole('button',{name:'추가',exact:true}).click();await page.waitForFunction(()=>S.attendancePolls?.find(x=>x.id==='poll-created')?.guestEntries?.length===1);
  created=page.locator('.pollCard623').filter({hasText:'수정 QA 코트'});await created.getByRole('button',{name:'게스트 모집 마감',exact:true}).click();await page.waitForFunction(()=>S.attendancePolls?.find(x=>x.id==='poll-created')?.guestClosed===true);if(!(await created.textContent()).includes('게스트 마감'))throw new Error('guest close UI failed');
  await created.getByRole('button',{name:/참석 명단/}).click();page.once('dialog',d=>d.accept());await page.locator('.pollPerson623[data-kind="guest"] button').click();await page.waitForFunction(()=>S.attendancePolls?.find(x=>x.id==='poll-created')?.guestEntries?.length===0);await page.getByRole('button',{name:'닫기',exact:true}).click();

  created=page.locator('.pollCard623').filter({hasText:'수정 QA 코트'});page.once('dialog',d=>d.accept());await created.getByRole('button',{name:'삭제',exact:true}).click();await page.waitForFunction(()=>!S.attendancePolls?.some(x=>x.id==='poll-created'));

  await page.evaluate(d=>window.selectPollDate623(d),yesterday);await page.waitForSelector('.pollCard623');const ended=page.locator('.pollCard623').first(),endedText=await ended.textContent();if(!endedText.includes('지난 코트')||!endedText.includes('종료')||!endedText.includes('조회만 가능'))throw new Error('ended poll read-only failed: '+endedText);

  const wrongPollApis=[...new Set(pollApiPaths.filter(p=>p.includes('kokmatch-v')&&!p.endsWith('/kokmatch-v21-api')&&!p.endsWith('/kokmatch-v66-api')))];if(wrongPollApis.length)throw new Error('legacy poll API requested: '+wrongPollApis.join(','));
  if(pageErrors.length)throw new Error('page errors: '+pageErrors.join(' | '));
  console.log(`PASS focused QA v${VERSION}`);console.log('PASS partner duplicate-name search / select / save');console.log('PASS poll render / attend / cancel / attendee list');console.log('PASS poll create / edit / delete');console.log('PASS guest add / remove / close');console.log('PASS ended poll read-only');console.log('PASS canonical poll API only: kokmatch-v21-api');
}finally{await browser.close();}
