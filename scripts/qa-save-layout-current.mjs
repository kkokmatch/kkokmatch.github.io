import fs from 'node:fs';
import { chromium } from 'playwright';

const latest=JSON.parse(fs.readFileSync('latest-version.json','utf8'));
const VERSION=String(latest.semanticVersion||'').replace(/^v/,'');
const fmt=d=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
const today=fmt(new Date());
const yesterday=fmt(new Date(Date.now()-86400000));
const month=today.slice(0,7);
const state={courtCount:8,courtNames:Array.from({length:8},(_,i)=>`${i+1}코트`),queue:[],pendingGames:[],games:[],history:[],pairCounts:{},members:[
 {id:'mgr',name:'관리자',year:1985,gender:'남',age:'40',cls:'B',type:'member',role:'manager',state:'out',totalGames:4,attendanceMonth:month,attendanceCount:2,attendanceHistory:{[month]:2}},
 {id:'m1',name:'수정대상',year:1990,gender:'남',age:'30',cls:'C',type:'member',role:'member',state:'out',totalGames:3,attendanceMonth:month,attendanceCount:1,attendanceHistory:{[month]:1}},
 {id:'m0',name:'미출석회원',year:1995,gender:'여',age:'30',cls:'D',type:'member',role:'member',state:'out',totalGames:0,attendanceMonth:month,attendanceCount:0,attendanceHistory:{[month]:0}}
],attendancePolls:[{id:'p1',date:today,time:'18:30',endTime:'20:30',location:'QA 코트',title:'QA 투표',createdBy:'관리자',memberVotes:{},guestEntries:[],totalLimit:0,guestLimit:0,guestClosed:false}]};
const clone=()=>JSON.parse(JSON.stringify(state));
const game=(id,day,players,durationMin)=>({gameId:id,businessDay:day,startedAt:1,endedAt:2,matchedAt:1,durationMin,court:1,courtName:'1코트',players,playerNames:players.map(id=>state.members.find(m=>m.id===id)?.name||id),waitMsByPlayer:{},autoEnded:false});
const monthGames=[game('g-y',yesterday,['mgr'],20),game('g-1',today,['mgr','m1'],30),game('g-2',today,['m1'],25)];
let memberSaveCalls=0,lastMemberSave=null,lastStatsQuery=null;
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e?.stack||e)));
await page.route('https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/**',async route=>{
 const req=route.request(),url=new URL(req.url());let body={};try{body=JSON.parse(req.postData()||'{}')}catch{}
 if(url.pathname.endsWith('/kokmatch-v60-api')){
  if(body.op==='member_save'){
   memberSaveCalls++;lastMemberSave=body;const id=String(body.memberId||'m-new');let m=state.members.find(x=>String(x.id)===id);if(!m){m={id,state:'out',totalGames:0};state.members.push(m)}Object.assign(m,{name:body.name,year:body.year,gender:body.gender,age:'30',cls:body.cls,type:body.type,role:body.role,inviter:body.inviter||''});
   if(body.compact===true)return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,member:JSON.parse(JSON.stringify(m)),group:{groupId:'qa',name:'QA'}})});
  }
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,data:clone(),group:{groupId:'qa',name:'QA'}})});
 }
 if(url.pathname.endsWith('/kokmatch-v21-api'))return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,data:clone()})});
 if(url.pathname.endsWith('/kokmatch-stats-v54')){
  const from=url.searchParams.get('from')||today,to=url.searchParams.get('to')||from,mon=url.searchParams.get('month')||month;lastStatsQuery={from,to,month:mon};
  const rangeGames=monthGames.filter(g=>g.businessDay>=from&&g.businessDay<=to);
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,groupId:'qa',today,from,to,month:mon,selfMemberId:'mgr',members:clone().members,rangeGames,monthGames:mon===month?monthGames:[],baselines:[]})});
 }
 if(url.pathname.includes('profile'))return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({profiles:{},success:true})});
 return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,data:clone(),profiles:{},groups:[],group:{groupId:'qa',name:'QA'}})});
});
try{
 await page.goto('http://127.0.0.1:4173/?qa=save-layout',{waitUntil:'networkidle'});
 await page.waitForFunction(v=>window.__kokmatchVersionLock===v&&typeof window.renderAll==='function',VERSION,{timeout:15000});
 await page.evaluate(({state})=>{T='qa-token';currentGroupId='qa';currentView='members';S=JSON.parse(JSON.stringify(state));window.S=S;me={memberId:'mgr',displayName:'관리자',role:'manager',globalAdmin:false,tempOrganizer:false,groupId:'qa'};group={groupId:'qa',name:'QA 모임'};groups=[];normalizeClient();renderAll();document.getElementById('login')?.classList.add('hide')},{state:clone()});
 const edit=page.locator('#members .memberCard[data-member-id22="m1"] .memberBtns button').filter({hasText:'수정'}).first();await edit.click();await page.waitForSelector('#memberEditorV615');
 const editorText=await page.locator('#memberEditorV615').textContent();if(editorText?.includes('박태영'))throw new Error('member registration/editor still shows Park explanatory note');
 await page.fill('#v618Name','저장속도QA');await page.locator('#v618Save').click();await page.waitForSelector('#memberEditorV615',{state:'detached',timeout:5000});
 await page.waitForFunction(()=>S.members?.some(m=>m.id==='m1'&&m.name==='저장속도QA'),null,{timeout:3000});
 if(memberSaveCalls!==1)throw new Error('member save request count '+memberSaveCalls);
 if(!lastMemberSave||lastMemberSave.op!=='member_save'||lastMemberSave.compact!==true)throw new Error('compact member save payload missing: '+JSON.stringify(lastMemberSave));
 await page.evaluate(()=>goView('stats'));await page.waitForSelector('.pollWrap623');await page.waitForSelector('.statsMonthly627');
 const layout=await page.evaluate(()=>{const box=document.getElementById('stats'),poll=box?.querySelector('.pollWrap623'),detail=box?.querySelector('.statsDetail627'),day=box?.querySelector('.pollDay623');return{first:box?.firstElementChild===poll,pollIndex:poll?[...box.children].indexOf(poll):-1,detailIndex:detail?[...box.children].indexOf(detail):-1,radius:day?getComputedStyle(day).borderRadius:''}});
 if(!layout.first||layout.detailIndex<=layout.pollIndex)throw new Error('poll is not above date/month stats: '+JSON.stringify(layout));
 if(layout.radius!=='50%')throw new Error('calendar day design is not circular: '+JSON.stringify(layout));
 if((await page.locator('#stats').textContent()).includes('오늘 최근 경기'))throw new Error('legacy recent games section still exists');
 if(!(await page.locator('.statsDateTitle627').textContent()).includes('통계'))throw new Error('date stats title missing');
 const todayCompleted=await page.locator('.statsDateGrid627 .stat').first().locator('b').textContent();if(String(todayCompleted).trim()!=='2')throw new Error('today completed game count wrong: '+todayCompleted);
 await page.evaluate(d=>window.selectPollDate623(d),yesterday);await page.waitForFunction(d=>document.querySelector('.statsDateTitle627')?.textContent?.includes(d.slice(5).replace('-','월 ')+'일'),yesterday,{timeout:5000}).catch(()=>{});
 await page.waitForFunction(d=>window.__qaLastStatsDate===d||document.querySelector('.statsDateTitle627')?.dataset?.date===d,yesterday,{timeout:5000});
 if(lastStatsQuery?.from!==yesterday||lastStatsQuery?.to!==yesterday)throw new Error('selected date was not sent to stats API: '+JSON.stringify(lastStatsQuery));
 const selectedCompleted=await page.locator('.statsDateGrid627 .stat').first().locator('b').textContent();if(String(selectedCompleted).trim()!=='1')throw new Error('selected-date completed game count wrong: '+selectedCompleted);
 const headers=await page.locator('.statsMonthlyTable627 thead').textContent();for(const t of ['이름','년생','나이/급수','역할','출석','게임'])if(!headers.includes(t))throw new Error('monthly header missing '+t);
 const allRows=page.locator('.statsMonthlyTable627 tbody tr');if(await allRows.count()!==3)throw new Error('monthly member row count mismatch');
 await page.locator('button[data-stats-sort627="attendance"]').click();let first=await allRows.first().locator('td').first().textContent();if(!first?.includes('미출석회원'))throw new Error('attendance ascending sort failed: '+first);
 await page.locator('button[data-stats-sort627="attendance"]').click();first=await allRows.first().locator('td').first().textContent();if(!first?.includes('관리자'))throw new Error('attendance descending sort failed: '+first);
 await page.locator('#statsZeroOnly627').click();if(await allRows.count()!==1||(await allRows.first().textContent())?.includes('미출석회원')!==true)throw new Error('zero-attendance filter failed');
 const navText=await page.locator('nav button[data-v="stats"]').textContent();if(!navText?.includes('운동통계'))throw new Error('stats nav label not updated');
 if(pageErrors.length)throw new Error('page errors: '+pageErrors.join(' | '));
 console.log(`PASS save/layout QA v${VERSION}`);console.log('PASS compact member save single request / editor note removed');console.log('PASS exercise poll remains first / selected-date stats below');console.log('PASS monthly member records / sortable columns / zero-attendance filter');console.log('PASS legacy recent games removed');
}finally{await browser.close();}
