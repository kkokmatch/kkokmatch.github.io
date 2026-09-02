import fs from 'node:fs';
import { chromium } from 'playwright';

const latest=JSON.parse(fs.readFileSync('latest-version.json','utf8'));
const VERSION=String(latest.semanticVersion||'').replace(/^v/,'');
const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const state={courtCount:8,courtNames:Array.from({length:8},(_,i)=>`${i+1}코트`),queue:[],pendingGames:[],games:[],history:[],pairCounts:{},members:[{id:'mgr',name:'관리자',year:1985,gender:'남',age:'40',cls:'B',type:'member',role:'manager',state:'out',totalGames:0},{id:'m1',name:'수정대상',year:1990,gender:'남',age:'30',cls:'C',type:'member',role:'member',state:'out',totalGames:0}],attendancePolls:[{id:'p1',date:today,time:'18:30',endTime:'20:30',location:'QA 코트',title:'QA 투표',createdBy:'관리자',memberVotes:{},guestEntries:[],totalLimit:0,guestLimit:0,guestClosed:false}]};
const clone=()=>JSON.parse(JSON.stringify(state));
let memberSaveCalls=0,lastMemberSave=null;
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
 await page.evaluate(()=>goView('stats'));await page.waitForSelector('.pollWrap623');
 const layout=await page.evaluate(()=>{const box=document.getElementById('stats'),poll=box?.querySelector('.pollWrap623'),todayTitle=[...box?.children||[]].find(x=>x.classList?.contains('title')&&(x.textContent||'').includes('오늘 통계')),day=box?.querySelector('.pollDay623');return{first:box?.firstElementChild===poll,pollIndex:poll?[...box.children].indexOf(poll):-1,todayIndex:todayTitle?[...box.children].indexOf(todayTitle):-1,radius:day?getComputedStyle(day).borderRadius:'',bg:day?getComputedStyle(day).backgroundColor:''}});
 if(!layout.first||layout.todayIndex<=layout.pollIndex)throw new Error('poll is not above today stats: '+JSON.stringify(layout));
 if(layout.radius!=='50%')throw new Error('calendar day design is not restored to circular style: '+JSON.stringify(layout));
 if(pageErrors.length)throw new Error('page errors: '+pageErrors.join(' | '));
 console.log(`PASS save/layout QA v${VERSION}`);console.log('PASS compact member save single request / editor note removed');console.log('PASS exercise poll at top / today stats below');console.log('PASS previous-style circular poll calendar');
}finally{await browser.close();}
