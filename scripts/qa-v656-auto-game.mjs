import fs from 'node:fs';
import {chromium,webkit} from 'playwright';

const latest=JSON.parse(fs.readFileSync('latest-version.json','utf8'));
const VERSION=String(latest.semanticVersion||'').replace(/^v/,'');
if(VERSION!=='6.56')throw new Error('expected v6.56, got '+VERSION);

const now=Date.now();
const baseMembers=Array.from({length:8},(_,i)=>({id:`m${i+1}`,name:i===0?'관리자':`회원${i+1}`,year:1985+i,gender:i%2?'여':'남',age:i<4?'40':'30',cls:['B','C','D','C'][i%4],type:'member',role:i===0?'manager':'member',state:'waiting',joinedAt:now-(45-i*4)*60000,totalGames:i<4?0:1}));
function state(enabled=false){return {courtCount:4,courtNames:['1코트','2코트','3코트','4코트'],members:baseMembers.map(x=>({...x})),queue:baseMembers.map(x=>x.id),pendingGames:[],games:[],history:[],pairCounts:{},attendancePolls:[],adminBadgeVisibility:'all',autoGame:{enabled,mode:'ai_optimal',updatedAt:enabled?Date.now():0,updatedBy:enabled?{memberId:'m1',name:'관리자',role:'manager',roleLabel:'모임장'}:{}}}}
const user={memberId:'m1',displayName:'관리자',role:'manager',globalAdmin:false,tempOrganizer:false,groupId:'qa'};
const group={groupId:'qa',name:'QA 모임'};
const clone=x=>JSON.parse(JSON.stringify(x));

async function boot(engine,label){
 const browser=await engine.launch({headless:true});
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
 const page=await context.newPage();let server=state(false),autoSetHits=0,autoTickHits=0;
 await page.addInitScript(()=>{try{localStorage.setItem('kokmatch_push_denied_notice629',String(Date.now()));localStorage.setItem('kokmatch_install_guide631_seen','1');sessionStorage.setItem('kokmatch_install_later630','1')}catch{}});
 await context.route('https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/**',async route=>{
  const req=route.request(),u=new URL(req.url()),path=u.pathname;let body={};try{body=JSON.parse(req.postData()||'{}')}catch{}
  const headers={'access-control-allow-origin':'*','access-control-allow-headers':'*'};
  if(path.endsWith('/kokmatch-auto-v656')){
   if(body.action==='set'){
    autoSetHits++;server.autoGame={enabled:body.enabled===true,mode:'ai_optimal',updatedAt:Date.now(),updatedBy:{memberId:'m1',name:'관리자',role:'manager',roleLabel:'모임장'}};
    return route.fulfill({status:200,contentType:'application/json',headers,body:JSON.stringify({success:true,config:server.autoGame,data:clone(server)})});
   }
   if(body.action==='tick'){
    autoTickHits++;
    if(server.autoGame?.enabled&&server.queue.length>=4&&server.pendingGames.length===0){const players=server.queue.slice(0,4);server.pendingGames=[{id:'pa1',players,createdAt:Date.now(),createdByMemberId:'',createdByName:'AI 자동편성',createdByRole:'시스템',createdByMode:'auto',autoEnabledByName:'관리자',autoEnabledByRole:'모임장'}];server.queue=server.queue.slice(4);server.members=server.members.map(m=>players.includes(m.id)?{...m,state:'matched'}:m);return route.fulfill({status:200,contentType:'application/json',headers,body:JSON.stringify({success:true,created:true,players,data:clone(server),config:server.autoGame})})}
    return route.fulfill({status:200,contentType:'application/json',headers,body:JSON.stringify({success:true,created:false,reason:'enough_pending',data:clone(server),config:server.autoGame})});
   }
   return route.fulfill({status:200,contentType:'application/json',headers,body:JSON.stringify({success:true,config:server.autoGame,data:clone(server)})});
  }
  if(path.endsWith('/kokmatch-state-v46'))return route.fulfill({status:200,contentType:'application/json',headers,body:JSON.stringify({data:clone(server),memberCount:server.members.length,activeMemberCount:server.members.length,user,group,groups:[],compact:true})});
  if(path.endsWith('/kokmatch-atomic-api'))return route.fulfill({status:200,contentType:'application/json',headers,body:JSON.stringify({success:true,data:clone(server)})});
  return route.fulfill({status:200,contentType:'application/json',headers,body:JSON.stringify({success:true,data:clone(server),user,group,groups:[],config:server.autoGame,members:clone(server.members),memberCount:server.members.length})});
 });
 await page.goto('http://127.0.0.1:4173/?qa=v656-auto',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(v=>window.__kokmatchVersionLock===v&&window.__kokmatchAutoGame656===v&&typeof window.toggleAutoGame656==='function'&&typeof window.__kokmatchRunAuto656==='function',VERSION,{timeout:15000});
 await page.evaluate(({s,user,group})=>{T='qa-token';currentGroupId='qa';S=JSON.parse(JSON.stringify(s));window.S=S;me=user;window.me=me;window.group=group;groups=[];normalizeClient();document.getElementById('login')?.classList.add('hide');currentView='stats';renderAll()},{s:state(false),user,group});
 return {browser,page,getHits:()=>({autoSetHits,autoTickHits}),getServer:()=>clone(server)};
}

async function managerFlow(engine,label){
 const {browser,page,getHits}=await boot(engine,label);
 try{
  const liveText=await page.locator('#stats').innerText();
  if(await page.locator('#opsDashboard652').count())throw new Error(label+' live operations dashboard still rendered');
  if(liveText.includes('실시간 운영현황'))throw new Error(label+' stats still contains live operations text');

  await page.evaluate(()=>{currentView='settings';renderSettings()});
  await page.waitForSelector('.autoGameCard656');
  const card=await page.locator('.autoGameCard656').innerText();
  if(!card.includes('자동게임편성')||!card.includes('AI 자동 최적화')||!card.includes('OFF'))throw new Error(label+' auto card initial state wrong: '+card);
  await page.evaluate(()=>openAutoGameSettings656());
  const setup=await page.locator('#modalSheet').innerText();
  for(const t of ['게임횟수 균형','대기시간','반복 조합 최소화','급수·팀 밸런스','오늘 파트너 우선','코트·대기조 상황'])if(!setup.includes(t))throw new Error(label+' missing AI rule '+t);
  await page.evaluate(()=>closeModal());

  await page.evaluate(()=>toggleAutoGame656());
  await page.waitForFunction(()=>S?.autoGame?.enabled===true&&Array.isArray(S?.pendingGames)&&S.pendingGames.length===1,{timeout:6000});
  const hits=getHits();if(hits.autoSetHits<1||hits.autoTickHits<1)throw new Error(label+' auto API was not exercised '+JSON.stringify(hits));
  const pg=await page.evaluate(()=>S.pendingGames[0]);
  if(pg.createdByMode!=='auto'||pg.autoEnabledByName!=='관리자'||pg.autoEnabledByRole!=='모임장')throw new Error(label+' auto provenance missing '+JSON.stringify(pg));

  await page.evaluate(()=>openMoveMember('pa1','m1'));
  const moveText=await page.locator('#modalSheet').innerText();
  for(const t of ['기존 편성','AI 자동편성','관리자','모임장'])if(!moveText.includes(t))throw new Error(label+' move popup missing creator text '+t+': '+moveText);
  await page.evaluate(()=>closeModal());

  let dialog='';page.once('dialog',async d=>{dialog=d.message();await d.dismiss()});
  await page.evaluate(()=>removePending('pa1','m1'));
  await page.waitForTimeout(120);
  if(!dialog.includes('기존 편성: AI 자동편성')||!dialog.includes('관리자')||!dialog.includes('모임장'))throw new Error(label+' remove confirm missing creator: '+dialog);

  const manual=await page.evaluate(()=>window.__kokmatchPendingCreatorText656({createdByName:'김운영',createdByRole:'운영진',createdByMode:'manual'}));
  if(manual!=='김운영 · 운영진')throw new Error(label+' manual creator label wrong: '+manual);
  const old=await page.evaluate(()=>window.__kokmatchPendingCreatorText656({id:'old'}));
  if(!old.includes('v6.56 이전'))throw new Error(label+' legacy creator fallback missing: '+old);

  await page.evaluate(()=>{me={memberId:'m2',displayName:'회원2',role:'member',globalAdmin:false,tempOrganizer:false,groupId:'qa'};window.me=me;currentView='settings';renderSettings()});
  if(await page.locator('.autoGameCard656').count())throw new Error(label+' normal member can see auto controls');

  const geom=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,inner:innerWidth}));
  if(geom.scroll>geom.inner+2)throw new Error(label+' horizontal overflow '+JSON.stringify(geom));
  console.log(`PASS ${label} v6.56 operations removed / auto toggle+tick / creator provenance / role controls`);
 }finally{await browser.close()}
}

await managerFlow(chromium,'Chromium mobile');
await managerFlow(webkit,'WebKit mobile');
