import fs from 'node:fs';
import { chromium, webkit } from 'playwright';

const latest=JSON.parse(fs.readFileSync('latest-version.json','utf8'));
const VERSION=String(latest.semanticVersion||'').replace(/^v/,'');
if(VERSION!=='6.55')throw new Error('expected v6.55, got '+VERSION);

const fullMembers=Array.from({length:20},(_,i)=>({id:`m${i+1}`,name:`회원${i+1}`,year:1980+i,gender:i%2?'여':'남',age:i<10?'40':'30',cls:['B','C','D'][i%3],type:'member',role:i===0?'manager':'member',state:'out',joinedAt:null,totalGames:0}));
const fullState={courtCount:4,courtNames:['1코트','2코트','3코트','4코트'],members:fullMembers,queue:[],pendingGames:[],games:[],history:[],pairCounts:{},adminBadgeVisibility:'all'};
const compactMember={...fullMembers[0],state:'waiting',joinedAt:Date.now()-60000};
const compactState={...fullState,members:[compactMember],queue:['m1']};

async function waitEval(page,fn,timeout=8000,label='condition'){
 const t=Date.now();while(Date.now()-t<timeout){try{if(await page.evaluate(fn))return}catch{}await page.waitForTimeout(50)}throw new Error(label+' timeout');
}

async function run(engine,label){
 const browser=await engine.launch({headless:true});
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
 const page=await context.newPage();let rosterHits=0,compactHits=0,fullStateHits=0;const errors=[];
 page.on('pageerror',e=>errors.push(String(e?.message||e)));
 await page.addInitScript(()=>{try{localStorage.setItem('kokmatch_push_denied_notice629',String(Date.now()));localStorage.setItem('kokmatch_install_guide631_seen','1');sessionStorage.setItem('kokmatch_install_later630','1')}catch{}});
 await context.route('https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/**',async route=>{
  const u=new URL(route.request().url());
  const headers={'access-control-allow-origin':'*','access-control-allow-headers':'*'};
  if(u.pathname.endsWith('/kokmatch-state-v46')){compactHits++;return route.fulfill({status:200,contentType:'application/json',headers,body:JSON.stringify({data:compactState,memberCount:20,activeMemberCount:1,user:{memberId:'m1',displayName:'회원1',role:'manager',globalAdmin:false,tempOrganizer:false,groupId:'qa'},group:{groupId:'qa',name:'QA 모임'},groups:[]})})}
  if(u.pathname.endsWith('/kokmatch-roster-v654')){rosterHits++;return route.fulfill({status:200,contentType:'application/json',headers,body:JSON.stringify({groupId:'qa',members:fullMembers,memberCount:20,adminBadgeVisibility:'all'})})}
  if(u.pathname.endsWith('/kokmatch-multi-api')&&u.searchParams.get('api')==='state'){fullStateHits++;return route.fulfill({status:200,contentType:'application/json',headers,body:JSON.stringify({data:fullState,user:{memberId:'m1',displayName:'회원1',role:'manager',globalAdmin:false,tempOrganizer:false,groupId:'qa'},group:{groupId:'qa',name:'QA 모임'},groups:[]})})}
  return route.fulfill({status:200,contentType:'application/json',headers,body:JSON.stringify({success:true,data:fullState})});
 });
 try{
  await page.goto('http://127.0.0.1:4173/?qa=v655-conflict',{waitUntil:'domcontentloaded'});
  await waitEval(page,()=>window.__kokmatchVersionLock==='6.55'&&typeof loadState==='function'&&typeof goView==='function',15000,label+' runtime');
  await page.evaluate(({fullState})=>{
   T='qa-token';localStorage.setItem('kokmatch_token',T);currentGroupId='qa';currentView='stats';S=JSON.parse(JSON.stringify(fullState));window.S=S;
   me={memberId:'m1',displayName:'회원1',role:'manager',globalAdmin:false,tempOrganizer:false,groupId:'qa'};group={groupId:'qa',name:'QA 모임'};groups=[];
   window.__kokmatchMemberCount46=20;window.__kokmatchMemberCountGroup46='qa';normalizeClient();window.__kokmatchSaveRoster654?.('qa',S.members,'all');document.getElementById('login')?.classList.add('hide');renderAll();
  },{fullState});
  await page.evaluate(()=>loadState(true));
  await waitEval(page,()=>Array.isArray(S?.members)&&S.members.length===20&&document.getElementById('opsDashboard652'),5000,label+' compact preservation');
  const merged=await page.evaluate(()=>({len:S.members.length,state:S.members.find(m=>m.id==='m1')?.state,queue:S.queue.length}));
  if(merged.len!==20||merged.state!=='waiting'||merged.queue!==1)throw new Error(label+' compact merge failed '+JSON.stringify(merged));

  // Let any work scheduled by the stats render settle, then measure only requests caused by
  // switching from Stats to Members. A startup/prefetch request is not a tab-transition regression.
  await page.waitForTimeout(450);
  const rosterBeforeMembers=rosterHits;
  await page.evaluate(()=>{
   window.__qaRosterStacks655=[];
   const originalFetch=window.fetch.bind(window);
   window.fetch=(input,init)=>{
    try{const url=typeof input==='string'?input:input?.url||String(input);if(String(url).includes('/kokmatch-roster-v654'))window.__qaRosterStacks655.push(String(new Error('roster fetch').stack||''))}catch{}
    return originalFetch(input,init);
   };
  });
  await page.evaluate(()=>goView('members'));
  await page.waitForTimeout(1200);
  const after=await page.evaluate(()=>({len:S.members.length,cards:document.querySelectorAll('#members .memberCard').length,text:document.querySelector('#members')?.innerText||'',stacks:window.__qaRosterStacks655||[]}));
  const rosterDelta=rosterHits-rosterBeforeMembers;
  if(after.len!==20)throw new Error(label+' full roster was lost after returning to members '+JSON.stringify(after));
  if(/응답이 지연|보조 조회|불러오지 못/.test(after.text))throw new Error(label+' roster delay text surfaced');
  if(rosterDelta!==0)throw new Error(label+` stats -> members triggered ${rosterDelta} roster request(s); stacks=${JSON.stringify(after.stacks)}`);
  if(compactHits<1)throw new Error(label+' compact state path was not exercised');
  if(errors.length)throw new Error(label+' page errors '+errors.join(' | '));
  console.log(`PASS ${label} stats compact state preserved 20-member roster; startupRosterHits=${rosterBeforeMembers}; transitionRosterHits=${rosterDelta}; compactHits=${compactHits}; fullStateHits=${fullStateHits}`);
 } finally {await browser.close()}
}

await run(chromium,'Chromium mobile');
await run(webkit,'WebKit mobile');
