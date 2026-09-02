import fs from 'node:fs';
import { chromium } from 'playwright';

const latest=JSON.parse(fs.readFileSync('latest-version.json','utf8'));
const VERSION=String(latest.semanticVersion||'').replace(/^v/,'');
const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const yesterday=(()=>{const d=new Date(Date.now()-86400000);return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(d)})();

const state={
  courtCount:8,courtNames:Array.from({length:8},(_,i)=>`${i+1}코트`),queue:[],pendingGames:[],games:[],history:[],pairCounts:{},
  members:[
    {id:'mgr',name:'관리자',year:1985,gender:'남',age:'40',cls:'B',type:'member',role:'manager',state:'out',totalGames:0},
    {id:'same1',name:'김민수',year:1990,gender:'남',age:'30',cls:'B',type:'member',role:'member',state:'out',totalGames:0},
    {id:'same2',name:'김민수',year:1992,gender:'여',age:'30',cls:'C',type:'member',role:'member',state:'out',totalGames:0}
  ],
  attendancePolls:[
    {id:'poll-open',date:today,time:'00:00',endTime:'23:30',location:'QA 코트',title:'QA 운동 참석 투표',createdBy:'관리자',memberVotes:{},guestEntries:[],totalLimit:12,guestLimit:4},
    {id:'poll-ended',date:yesterday,time:'18:30',endTime:'21:30',location:'지난 코트',title:'종료된 QA 투표',createdBy:'관리자',memberVotes:{},guestEntries:[],totalLimit:12,guestLimit:4}
  ]
};
const clone=()=>JSON.parse(JSON.stringify(state));

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const pageErrors=[];
page.on('pageerror',e=>pageErrors.push(String(e?.stack||e)));

await page.route('https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/**',async route=>{
  const req=route.request(),url=new URL(req.url());
  let body={}; try{body=JSON.parse(req.postData()||'{}')}catch{}
  if(url.pathname.endsWith('/kokmatch-v66-api')&&body.action==='partner_set'){
    const m=state.members.find(x=>String(x.id)===String(body.memberId));
    if(m){m.partnerId=String(body.partnerId||'');m.partnerDay=today;}
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,data:clone()})});
  }
  if(url.pathname.endsWith('/kokmatch-v21-api')||url.pathname.endsWith('/kokmatch-v19-api')){
    const action=String(body.action||'');
    if(action==='poll_toggle_vote'||action==='poll_vote'){
      const p=state.attendancePolls.find(x=>String(x.id)===String(body.pollId));
      if(p){p.memberVotes=p.memberVotes||{};if(p.memberVotes.mgr==='yes')delete p.memberVotes.mgr;else p.memberVotes.mgr='yes';}
    }else if(action==='poll_create'){
      state.attendancePolls.push({id:'poll-created',createdBy:'관리자',memberVotes:{},guestEntries:[],...body});
    }else if(action==='poll_update'){
      const p=state.attendancePolls.find(x=>String(x.id)===String(body.pollId)); if(p)Object.assign(p,body);
    }else if(action==='poll_delete'){
      state.attendancePolls=state.attendancePolls.filter(x=>String(x.id)!==String(body.pollId));
    }
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,data:clone()})});
  }
  if(url.pathname.includes('profile'))return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({profiles:{},success:true})});
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,data:clone(),profiles:{},groups:[],group:{groupId:'qa',name:'QA 모임'}})});
});

try{
  await page.goto('http://127.0.0.1:4173/?qa=partner-poll',{waitUntil:'networkidle'});
  await page.waitForFunction(v=>window.__kokmatchVersionLock===v&&typeof window.renderAll==='function',VERSION,{timeout:15000});
  await page.evaluate(({state})=>{
    T='qa-token';currentGroupId='qa';currentView='members';S=JSON.parse(JSON.stringify(state));window.S=S;
    me={memberId:'mgr',displayName:'관리자',role:'manager',globalAdmin:false,tempOrganizer:false,groupId:'qa'};
    group={groupId:'qa',name:'QA 모임'};groups=[];normalizeClient();renderAll();document.getElementById('login')?.classList.add('hide');
  },{state:clone()});

  await page.evaluate(()=>window.openPartner66('mgr'));
  await page.fill('#v615PartnerSearch','김민수');
  const rows=await page.locator('#v615PartnerResults .v615PartnerResult').allTextContents();
  if(rows.length!==2||!rows.some(x=>x.includes('1990년생')&&x.includes('남')&&x.includes('B급'))||!rows.some(x=>x.includes('1992년생')&&x.includes('여')&&x.includes('C급')))throw new Error('partner duplicate-name disambiguation failed: '+JSON.stringify(rows));
  await page.locator('#v615PartnerResults .v615PartnerResult').filter({hasText:'1992년생'}).click();
  if(!(await page.locator('#v615PartnerPicked').textContent())?.includes('1992년생'))throw new Error('partner selection did not update');
  await page.locator('#partnerOverlayV615 [data-v615-action="partnersave"]').click();
  await page.waitForSelector('#partnerOverlayV615',{state:'detached'});
  const savedPartner=await page.evaluate(()=>S.members.find(x=>x.id==='mgr')?.partnerId||'');
  if(savedPartner!=='same2')throw new Error('partner save did not persist selected member id: '+savedPartner);

  await page.evaluate(()=>goView('stats'));
  await page.waitForSelector('.pollCard21');
  let cards=page.locator('.pollCard21');
  if(await cards.count()!==1)throw new Error('today poll card count mismatch: '+await cards.count()+' / '+JSON.stringify(await cards.allTextContents()));
  let openCard=cards.first();
  const openText=await openCard.textContent();
  if(!openText?.includes('QA 코트'))throw new Error('today poll location missing from card: '+openText);
  await openCard.getByRole('button',{name:'참석',exact:true}).click();
  await page.waitForTimeout(120);
  openCard=page.locator('.pollCard21').first();
  if(!(await openCard.textContent()).includes('참석중'))throw new Error('poll attendance toggle ON failed');
  await openCard.getByRole('button',{name:/참석 명단/}).click();
  if(!(await page.locator('#modalSheet').textContent()).includes('관리자'))throw new Error('poll attendee list did not include voter');
  await page.locator('#modalSheet button').filter({hasText:'닫기'}).click();
  openCard=page.locator('.pollCard21').first();
  await openCard.getByRole('button',{name:/참석중/}).click();
  await page.waitForTimeout(120);
  if((await page.locator('.pollCard21').first().textContent()).includes('참석중'))throw new Error('poll attendance toggle OFF failed');

  await page.getByRole('button',{name:'+ 투표 만들기'}).click();
  await page.fill('#pollLocation19','신규 QA 코트');
  await page.fill('#pollTitle19','신규 QA 투표');
  await page.fill('#pollTotalLimit19','16');
  await page.fill('#pollGuestLimit19','6');
  await page.locator('#modalSheet').getByRole('button',{name:'투표 시작'}).click();
  await page.waitForFunction(()=>S.attendancePolls?.some(x=>x.id==='poll-created'));
  let stored=await page.evaluate(()=>S.attendancePolls.find(x=>x.id==='poll-created'));
  if(!stored||stored.title!=='신규 QA 투표'||stored.location!=='신규 QA 코트'||Number(stored.totalLimit)!==16||Number(stored.guestLimit)!==6)throw new Error('poll create values not stored: '+JSON.stringify(stored));
  let created=page.locator('.pollCard21').filter({hasText:'신규 QA 코트'});
  if(await created.count()!==1)throw new Error('poll create render failed: '+JSON.stringify(await page.locator('.pollCard21').allTextContents()));
  await created.getByRole('button',{name:'수정',exact:true}).click();
  await page.fill('#pollLocation19','수정 QA 코트');
  await page.fill('#pollTitle19','수정된 QA 투표');
  await page.locator('#modalSheet').getByRole('button',{name:'수정 저장'}).click();
  await page.waitForFunction(()=>S.attendancePolls?.some(x=>x.id==='poll-created'&&x.location==='수정 QA 코트'));
  stored=await page.evaluate(()=>S.attendancePolls.find(x=>x.id==='poll-created'));
  if(!stored||stored.title!=='수정된 QA 투표'||stored.location!=='수정 QA 코트')throw new Error('poll edit values not stored: '+JSON.stringify(stored));
  created=page.locator('.pollCard21').filter({hasText:'수정 QA 코트'});
  if(await created.count()!==1)throw new Error('poll edit render failed: '+JSON.stringify(await page.locator('.pollCard21').allTextContents()));
  page.once('dialog',d=>d.accept());
  await created.getByRole('button',{name:'삭제',exact:true}).click();
  await page.waitForFunction(()=>!S.attendancePolls?.some(x=>x.id==='poll-created'));
  if(await page.locator('.pollCard21').filter({hasText:'수정 QA 코트'}).count())throw new Error('poll delete render failed');

  await page.evaluate(d=>window.selectPollDate22(d),yesterday);
  await page.waitForSelector('.pollCard21');
  const endedCards=page.locator('.pollCard21');
  if(await endedCards.count()!==1)throw new Error('ended poll card count mismatch: '+JSON.stringify(await endedCards.allTextContents()));
  const endedText=await endedCards.first().textContent();
  if(!endedText.includes('지난 코트')||!endedText.includes('종료')||!endedText.includes('조회만 가능'))throw new Error('ended poll is not read-only: '+endedText);

  if(pageErrors.length)throw new Error('page errors: '+pageErrors.join(' | '));
  console.log(`PASS focused QA v${VERSION}`);
  console.log('PASS partner search / duplicate-name identity / select / save');
  console.log('PASS poll render / attend / attendee list / cancel');
  console.log('PASS poll create / edit / delete / stored values');
  console.log('PASS ended poll read-only lock');
}finally{await browser.close();}
