import fs from 'node:fs';
import { chromium } from 'playwright';

const latest=JSON.parse(fs.readFileSync('latest-version.json','utf8'));
const VERSION=String(latest.semanticVersion||latest.label||'').replace(/^v/,'');
if(!VERSION)throw new Error('latest-version.json semanticVersion is missing');
const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());

const identities={
  developer:{memberId:'dev',displayName:'박태영',role:'admin',globalAdmin:true,tempOrganizer:false,groupId:'qa'},
  manager:{memberId:'mgr',displayName:'모임장',role:'manager',globalAdmin:false,tempOrganizer:false,groupId:'qa'},
  organizer:{memberId:'org',displayName:'운영진',role:'organizer',globalAdmin:false,tempOrganizer:false,groupId:'qa'},
  member:{memberId:'mem',displayName:'일반회원',role:'member',globalAdmin:false,tempOrganizer:false,groupId:'qa'},
  guest:{memberId:'gst',displayName:'게스트회원',role:'member',globalAdmin:false,tempOrganizer:false,groupId:'qa'},
  temp:{memberId:'tmp',displayName:'편성자회원',role:'member',globalAdmin:false,tempOrganizer:true,groupId:'qa'}
};

function makeState(){
 const members=[
  {id:'dev',name:'박태영',year:1988,gender:'남',age:'30',cls:'S',type:'member',role:'admin',state:'out',totalGames:9},
  {id:'mgr',name:'모임장',year:1987,gender:'남',age:'30',cls:'A',type:'member',role:'manager',state:'waiting',joinedAt:Date.now()-360000,totalGames:8},
  {id:'org',name:'운영진',year:1990,gender:'여',age:'30',cls:'B',type:'member',role:'organizer',state:'spectator',joinedAt:Date.now()-240000,totalGames:7},
  {id:'mem',name:'일반회원',year:1992,gender:'남',age:'30',cls:'C',type:'member',role:'member',state:'out',totalGames:6},
  {id:'gst',name:'게스트회원',year:1993,gender:'여',age:'30',cls:'D',type:'guest',role:'member',state:'out',totalGames:2,inviter:'모임장'},
  {id:'tmp',name:'편성자회원',year:1991,gender:'남',age:'30',cls:'E',type:'member',role:'member',state:'waiting',joinedAt:Date.now()-120000,tempOrganizerDay:today,totalGames:4},
  {id:'long',name:'아주긴이름테스트회원입니다',year:1989,gender:'여',age:'30',cls:'B',type:'member',role:'member',state:'waiting',joinedAt:Date.now()-60000,totalGames:5},
  {id:'p1',name:'게임회원1',year:1994,gender:'남',age:'30',cls:'C',type:'member',role:'member',state:'playing',joinedAt:Date.now()-900000,totalGames:3},
  {id:'p2',name:'게임회원2',year:1995,gender:'여',age:'30',cls:'C',type:'member',role:'member',state:'playing',joinedAt:Date.now()-900000,totalGames:3},
  {id:'p3',name:'게임회원3',year:1996,gender:'남',age:'30',cls:'D',type:'member',role:'member',state:'playing',joinedAt:Date.now()-900000,totalGames:3},
  {id:'p4',name:'게임회원4',year:1997,gender:'여',age:'30',cls:'D',type:'member',role:'member',state:'playing',joinedAt:Date.now()-900000,totalGames:3}
 ];
 return {
  refreshSerial:0,
  courtCount:4,courtNames:['1코트','2코트','3코트','4코트'],members,
  queue:['mgr','tmp','long'],pendingGames:[],
  games:[{id:'g-qa',court:1,players:['p1','p2','p3','p4'],matchedAt:Date.now()-1000000,startedAt:Date.now()-900000}],
  history:[],pairCounts:{},attendancePolls:[]
 };
}
const clone=x=>JSON.parse(JSON.stringify(x));
const viewports=[{name:'iphone',width:390,height:844,isMobile:true},{name:'tablet',width:768,height:1024,isMobile:false}];
const roleEntries=Object.entries(identities);
const browser=await chromium.launch({headless:true});
let checked=0;

function genericPayload(state,identity){
 return {success:true,data:clone(state),profiles:{},group:{groupId:'qa',name:'QA 모임'},groups:[{groupId:'qa',name:'QA 모임',sortOrder:1}],user:identity,memberships:[{groupId:'qa',groupName:'QA 모임',memberId:identity.memberId,role:identity.role,roleLabel:identity.globalAdmin?'개발자':identity.role==='manager'?'모임장':identity.role==='organizer'?'운영진':'일반'}],settings:{}};
}

async function installRoutes(page,state,identity){
 await page.route('https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/**',async route=>{
  const req=route.request(),url=new URL(req.url());let body={};try{body=JSON.parse(req.postData()||'{}')}catch{}
  if(url.pathname.includes('profile'))return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,profiles:{}})});
  if(url.pathname.endsWith('/kokmatch-stats-v54'))return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,groupId:'qa',today,from:today,to:today,month:today.slice(0,7),selfMemberId:identity.memberId,members:clone(state).members,rangeGames:[],monthGames:[],baselines:[]})});
  if(url.pathname.endsWith('/kokmatch-v21-api'))return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,data:clone(state)})});
  if(url.pathname.endsWith('/kokmatch-multi-api')&&url.searchParams.get('api')==='state')return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(genericPayload(state,identity))});
  if(url.pathname.endsWith('/kokmatch-multi-api')&&url.searchParams.get('api')==='groups')return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,groups:[{groupId:'qa',name:'QA 모임',isActive:true,memberCount:state.members.length}]})});
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(genericPayload(state,identity))});
 });
}

async function assertViewFits(page,label,view){
 const fit=await page.evaluate(view=>{
  const doc=document.documentElement,body=document.body,active=document.getElementById(view);
  const dw=doc.clientWidth,sw=Math.max(doc.scrollWidth,body?.scrollWidth||0);
  const activeRect=active?.getBoundingClientRect();
  const bad=[];
  if(active&&activeRect){
   for(const el of active.querySelectorAll('.card,button,input,select,textarea,.queueCard,.courtCard,.stat,.statsTableWrap628')){
    const cs=getComputedStyle(el),r=el.getBoundingClientRect();
    if(cs.display==='none'||cs.visibility==='hidden'||r.width<1||r.height<1||cs.position==='fixed')continue;
    if(r.left<activeRect.left-3||r.right>activeRect.right+3)bad.push({tag:el.tagName,cls:String(el.className||'').slice(0,80),text:String(el.textContent||'').trim().slice(0,40),left:r.left,right:r.right,activeLeft:activeRect.left,activeRight:activeRect.right});
    if(bad.length>=5)break;
   }
  }
  return {dw,sw,bad};
 },view);
 if(fit.sw>fit.dw+2)throw new Error(`${label}/${view} horizontal page overflow ${JSON.stringify(fit)}`);
 if(fit.bad.length)throw new Error(`${label}/${view} active-view overflow ${JSON.stringify(fit.bad)}`);
}

async function assertRoster(page,label,width,roleKey,identity){
 const result=await page.evaluate(({width,roleKey,selfId})=>{
  const failures=[],details=[];const cards=[...document.querySelectorAll('#members .memberCard')];
  const stateLabels=new Set(['입장','관람','퇴장']);
  const visibleButtons=actions=>actions?[...actions.querySelectorAll('button')].filter(b=>{const cs=getComputedStyle(b),r=b.getBoundingClientRect();return cs.display!=='none'&&cs.visibility!=='hidden'&&r.width>1&&r.height>1}):[];
  const actionRail=card=>card.querySelector(':scope > .kmRosterActions621,:scope > .v6MemberActions,:scope > .memberActions48,:scope > .memberActions60,:scope > .memberActions64,:scope > .memberActions65');
  const cardId=card=>String(card.dataset.memberId22||card.dataset.memberId||card.dataset.memberId46||card.dataset.memberId80||'');
  for(const card of cards){
   const cr=card.getBoundingClientRect(),info=card.querySelector('.memberInfo48'),actions=actionRail(card);
   if(!actions){failures.push('missing action rail');continue}
   const ar=actions.getBoundingClientRect(),ir=info?.getBoundingClientRect();
   if(ar.left<cr.left-2||ar.right>cr.right+2||ar.top<cr.top-2||ar.bottom>cr.bottom+2)failures.push('actions outside card');
   if(width<600){if(ir&&ar.top<ir.bottom-2)failures.push('phone info/actions overlap')}else if(ir&&ir.right>ar.left+2){const cs=getComputedStyle(info),as=getComputedStyle(actions);failures.push(`tablet info/actions overlap id=${cardId(card)} info=${Math.round(ir.left)}-${Math.round(ir.right)} action=${Math.round(ar.left)}-${Math.round(ar.right)} card=${Math.round(cr.left)}-${Math.round(cr.right)} infoWidth=${cs.width} infoGrid=${cs.gridColumnStart}/${cs.gridColumnEnd} actionWidth=${as.width} actionGrid=${as.gridColumnStart}/${as.gridColumnEnd}`)}
   const status=actions.querySelector('.status');
   if(status&&status.scrollWidth>status.clientWidth+2)failures.push('status clipped');
   const buttons=visibleButtons(actions);let prev=null;
   for(const b of buttons){
    const r=b.getBoundingClientRect();
    if(r.left<ar.left-2||r.right>ar.right+2)failures.push('button outside actions');
    if(prev&&r.left<prev.right-1&&Math.abs(r.top-prev.top)<8)failures.push('button overlap');
    if(b.scrollWidth>b.clientWidth+2)failures.push('button text clipped');
    if(r.width<(width<600?41:44))failures.push('button too narrow');
    prev=r;
   }
   details.push({id:cardId(card),labels:buttons.map(b=>(b.textContent||'').trim()),widths:buttons.map(b=>Math.round(b.getBoundingClientRect().width))});
  }
  const own=cards.find(c=>cardId(c)===String(selfId)),ownActions=actionRail(own),ownButtons=visibleButtons(ownActions).map(b=>(b.textContent||'').trim()),ownState=ownButtons.filter(x=>stateLabels.has(x));
  if(['member','guest'].includes(roleKey)){
   if(ownState.length!==2)failures.push(`self state action count ${ownState.length} for ${roleKey}`);
   if(ownButtons.includes('수정'))failures.push(`${roleKey} unexpectedly has edit action`);
  }
  if(roleKey==='temp'){
   const stateRails=details.filter(d=>d.labels.filter(x=>stateLabels.has(x)).length>=2).length;
   if(stateRails<3)failures.push('temp organizer state rails missing');
   if(details.some(d=>d.labels.includes('수정')))failures.push('temp organizer unexpectedly has edit action');
  }
  if(['developer','manager','organizer'].includes(roleKey)){
   const editRails=details.filter(d=>d.labels.includes('수정')).length;
   if(editRails<3)failures.push(`privileged edit rails missing: ${editRails}`);
  }
  return {failures:[...new Set(failures)],cards:cards.length,ownButtons,details:failures.length?details:undefined};
 },{width,roleKey,selfId:identity.memberId});
 if(result.failures.length)throw new Error(`${label}/members roster ${JSON.stringify(result)}`);
}

for(const vp of viewports){
 for(const [roleKey,identity] of roleEntries){
  const state=makeState();
  const context=await browser.newContext({viewport:{width:vp.width,height:vp.height},isMobile:vp.isMobile,hasTouch:true});
  const page=await context.newPage();const pageErrors=[];
  page.on('pageerror',e=>pageErrors.push(String(e?.stack||e)));
  await page.addInitScript(()=>{try{localStorage.setItem('kokmatch_push_denied_notice629',String(Date.now()));localStorage.setItem('kokmatch_install_guide631_seen','1');sessionStorage.setItem('kokmatch_install_later630','1');const kill=()=>document.getElementById('pwaPrompt629')?.remove();new MutationObserver(kill).observe(document,{childList:true,subtree:true});addEventListener('DOMContentLoaded',kill)}catch{}});
  await installRoutes(page,state,identity);
  await page.goto('http://127.0.0.1:4173/?qa=roles',{waitUntil:'networkidle'});
  await page.waitForFunction(v=>window.__kokmatchVersionLock===v&&typeof window.renderAll==='function',VERSION,{timeout:15000});
  await page.evaluate(({state,identity})=>{T='qa-token';localStorage.setItem('kokmatch_token',T);currentGroupId='qa';localStorage.setItem('kokmatch_group_id','qa');currentView='members';S=JSON.parse(JSON.stringify(state));window.S=S;me=identity;group={groupId:'qa',name:'QA 모임'};groups=[{groupId:'qa',name:'QA 모임',sortOrder:1}];normalizeClient();renderAll();document.getElementById('login')?.classList.add('hide');},{state:clone(state),identity});
  await page.waitForTimeout(300);
  const views=['members','queue','playing','stats','settings',...(roleKey==='developer'?['groups']:[])];
  for(const view of views){
   await page.evaluate(v=>goView(v),view);await page.waitForTimeout(view==='stats'?260:120);
   const label=`${vp.name}/${roleKey}`;await assertViewFits(page,label,view);if(view==='members')await assertRoster(page,label,vp.width,roleKey,identity);checked++;
  }
  if(pageErrors.length)throw new Error(`${vp.name}/${roleKey} page errors: ${pageErrors.join(' | ')}`);
  await context.close();
 }
}

for(const vp of viewports){
 const identity=identities.member,state=makeState();
 const context=await browser.newContext({viewport:{width:vp.width,height:vp.height},isMobile:vp.isMobile,hasTouch:true});const page=await context.newPage();
 await page.addInitScript(()=>{try{localStorage.setItem('kokmatch_push_denied_notice629',String(Date.now()));localStorage.setItem('kokmatch_install_guide631_seen','1');sessionStorage.setItem('kokmatch_install_later630','1');const kill=()=>document.getElementById('pwaPrompt629')?.remove();new MutationObserver(kill).observe(document,{childList:true,subtree:true});addEventListener('DOMContentLoaded',kill)}catch{}});await installRoutes(page,state,identity);
 await page.goto('http://127.0.0.1:4173/?qa=refresh',{waitUntil:'networkidle'});await page.waitForFunction(v=>window.__kokmatchVersionLock===v&&typeof window.renderAll==='function',VERSION,{timeout:15000});
 await page.evaluate(({state,identity})=>{T='qa-token';localStorage.setItem('kokmatch_token',T);currentGroupId='qa';currentView='members';S=JSON.parse(JSON.stringify(state));window.S=S;me=identity;group={groupId:'qa',name:'QA 모임'};groups=[];normalizeClient();renderAll();document.getElementById('login')?.classList.add('hide');},{state:clone(state),identity});
 await page.evaluate(()=>goView('stats'));const before=page.url();state.refreshSerial=1;await page.locator('#headerRefreshV6').click();await page.waitForFunction(()=>Number(S?.refreshSerial)===1,null,{timeout:5000});
 await page.waitForFunction(()=>document.getElementById('headerRefreshV6')?.textContent?.trim()==='↻ 새로고침',null,{timeout:5000});
 let view=await page.evaluate(()=>({currentView,stats:document.getElementById('stats')?.classList.contains('on'),label:document.getElementById('headerRefreshV6')?.textContent?.trim()}));if(view.currentView!=='stats'||!view.stats||page.url()!==before||view.label!=='↻ 새로고침')throw new Error(`${vp.name} header refresh left current screen: ${JSON.stringify(view)} url=${page.url()} before=${before}`);
 await page.evaluate(()=>goView('settings'));state.refreshSerial=2;await page.locator('#forceUpdateBtn').click();await page.waitForFunction(()=>Number(S?.refreshSerial)===2,null,{timeout:5000});await page.waitForFunction(()=>document.getElementById('forceUpdateBtn')?.textContent?.trim()==='↻ 새로고침',null,{timeout:5000});view=await page.evaluate(()=>({currentView,settings:document.getElementById('settings')?.classList.contains('on'),label:document.getElementById('forceUpdateBtn')?.textContent?.trim()}));if(view.currentView!=='settings'||!view.settings||view.label!=='↻ 새로고침')throw new Error(`${vp.name} settings refresh left current screen: ${JSON.stringify(view)}`);
 await context.close();
}

await browser.close();
console.log(`PASS role/layout QA v${VERSION}: ${checked} role-view combinations`);
console.log('PASS developer / manager / organizer / member / guest / temp organizer');
console.log('PASS iPhone 390px + tablet 768px roster action geometry');
console.log('PASS in-place refresh keeps current view and receives new state');
