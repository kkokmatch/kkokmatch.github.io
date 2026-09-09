import fs from 'node:fs';
import {chromium,webkit} from 'playwright';

const latest=JSON.parse(fs.readFileSync('latest-version.json','utf8'));
const VERSION=String(latest.semanticVersion||'').replace(/^v/i,'');
if(VERSION!=='6.58')throw new Error('expected v6.58, got '+VERSION);

const now=Date.now();
const members=[
 {id:'mgr',name:'모임장',year:1988,gender:'남',age:'30',cls:'B',type:'member',role:'manager',state:'waiting',joinedAt:now-38*60000,totalGames:2},
 {id:'org',name:'운영진',year:1990,gender:'여',age:'30',cls:'C',type:'member',role:'organizer',state:'waiting',joinedAt:now-31*60000,totalGames:1},
 {id:'mem1',name:'일반1',year:1992,gender:'남',age:'30',cls:'C',type:'member',role:'member',state:'waiting',joinedAt:now-26*60000,totalGames:0},
 {id:'mem2',name:'일반2',year:1994,gender:'여',age:'30',cls:'D',type:'member',role:'member',state:'waiting',joinedAt:now-22*60000,totalGames:0},
 {id:'mem3',name:'일반3',year:1991,gender:'남',age:'30',cls:'C',type:'member',role:'member',state:'waiting',joinedAt:now-18*60000,totalGames:0}
];
function state(enabled=false){return {courtCount:4,courtNames:['1코트','2코트','3코트','4코트'],members:members.map(x=>({...x})),queue:members.map(x=>x.id),pendingGames:[],games:[],history:[],pairCounts:{},adminBadgeVisibility:'all',autoGame:{enabled,mode:'ai_optimal',updatedAt:enabled?Date.now():0,updatedBy:enabled?{memberId:'mgr',name:'모임장',role:'manager',roleLabel:'모임장'}:{}}}}
const group={groupId:'qa',name:'QA 모임'};
const manager={memberId:'mgr',displayName:'모임장',role:'manager',globalAdmin:false,tempOrganizer:false,groupId:'qa'};
const normal={memberId:'mem1',displayName:'일반1',role:'member',globalAdmin:false,tempOrganizer:false,groupId:'qa'};
const clone=x=>JSON.parse(JSON.stringify(x));

async function run(engine,label){
 const browser=await engine.launch({headless:true});
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
 const page=await context.newPage();let server=state(false);
 await page.addInitScript(()=>{try{localStorage.setItem('kokmatch_token','qa-token');localStorage.setItem('kokmatch_group_id','qa');localStorage.setItem('kokmatch_push_denied_notice629',String(Date.now()));localStorage.setItem('kokmatch_install_guide631_seen','1');sessionStorage.setItem('kokmatch_install_later630','1')}catch{}});
 await context.route('https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/**',async route=>{
   const req=route.request(),u=new URL(req.url()),path=u.pathname;let body={};try{body=JSON.parse(req.postData()||'{}')}catch{}
   const headers={'access-control-allow-origin':'*','access-control-allow-headers':'*'};
   if(path.endsWith('/kokmatch-auto-v656')){
     if(body.action==='set'){server.autoGame={enabled:body.enabled===true,mode:'ai_optimal',updatedAt:Date.now(),updatedBy:{memberId:'mgr',name:'모임장',role:'manager',roleLabel:'모임장'}}}
     return route.fulfill({status:200,contentType:'application/json',headers,body:JSON.stringify({success:true,created:false,reason:'qa',config:server.autoGame,data:clone(server)})});
   }
   if(path.endsWith('/kokmatch-state-v46'))return route.fulfill({status:200,contentType:'application/json',headers,body:JSON.stringify({data:clone(server),memberCount:server.members.length,activeMemberCount:server.members.length,user:manager,group,groups:[],compact:true})});
   return route.fulfill({status:200,contentType:'application/json',headers,body:JSON.stringify({success:true,data:clone(server),user:manager,group,groups:[],members:clone(server.members),memberCount:server.members.length})});
 });
 await page.goto('http://127.0.0.1:4173/?qa=v658',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(v=>window.__kokmatchVersionLock===v&&window.__kokmatchUiRefine658===v,VERSION,{timeout:15000});
 await page.evaluate(({s,user,group})=>{T='qa-token';currentGroupId='qa';S=JSON.parse(JSON.stringify(s));window.S=S;me=user;window.me=me;window.group=group;groups=[];normalizeClient();document.getElementById('login')?.classList.add('hide');currentView='queue';renderAll()},{s:state(false),user:manager,group});

 // 1) auto controls live on waiting screen, not settings.
 if(await page.locator('#queue .autoGameQueue658').count()!==1)throw new Error(label+' auto controls missing from queue');
 const autoText=await page.locator('#queue .autoGameQueue658').innerText();
 if(!autoText.includes('자동게임편성')||!autoText.includes('OFF')||!autoText.includes('자동게임설정 보기'))throw new Error(label+' queue auto card text wrong: '+autoText);
 await page.evaluate(()=>{currentView='settings';renderSettings()});
 if(await page.locator('#settings .autoGameCard656').count())throw new Error(label+' auto controls still present in settings');
 await page.evaluate(()=>{currentView='queue';renderQueue()});
 await page.evaluate(()=>toggleAutoGame656());
 await page.waitForFunction(()=>S?.autoGame?.enabled===true,{timeout:4000});
 if(!(await page.locator('#queue .autoToggle656').innerText()).includes('ON'))throw new Error(label+' auto toggle did not switch ON');

 // 2) ordinary member badges disappear while staff badges remain.
 await page.evaluate(()=>{currentView='members';renderMembers()});
 if(await page.locator('#members .roleBadge.role-member44').count())throw new Error(label+' ordinary member badge still exists');
 if(await page.locator('#members .roleBadge.role-manager').count()<1)throw new Error(label+' manager badge disappeared');
 if(await page.locator('#members .roleBadge.role-organizer').count()<1)throw new Error(label+' organizer badge disappeared');

 // 3) game count is immediately to the right of waiting time in personal queue.
 await page.evaluate(()=>{currentView='queue';renderQueue()});
 const meta=page.locator('#queue .queueCard').first().locator('.queueWaitMeta658');
 if(await meta.count()!==1)throw new Error(label+' waiting meta row missing');
 if(await meta.locator('.queueGameCount658').count()!==1)throw new Error(label+' game count not moved beside wait time');
 const mt=await meta.innerText();if(!mt.includes('대기')||!mt.includes('게임'))throw new Error(label+' queue meta missing wait/game: '+mt);

 // Normal users cannot see auto controls.
 await page.evaluate(({s,user})=>{S=JSON.parse(JSON.stringify(s));window.S=S;me=user;window.me=me;normalizeClient();currentView='queue';renderAll()},{s:state(true),user:normal});
 if(await page.locator('#queue .autoGameQueue658').count())throw new Error(label+' normal member can see auto controls');

 // 4) developer gets challenger-style profile frame, but no ordinary badge leaks.
 const devMember={id:'dev',name:'개발자',year:1989,gender:'남',age:'30',cls:'B',type:'member',role:'admin',state:'waiting',joinedAt:now-12*60000,totalGames:3};
 const devState={...state(false),members:[devMember,...members],queue:['dev',...members.map(x=>x.id)],adminBadgeVisibility:'all'};
 const devUser={memberId:'dev',displayName:'개발자',role:'admin',globalAdmin:true,tempOrganizer:false,groupId:'qa'};
 await page.evaluate(({s,user})=>{S=JSON.parse(JSON.stringify(s));window.S=S;me=user;window.me=me;normalizeClient();currentView='members';renderAll()},{s:devState,user:devUser});
 if(await page.locator('#members .roleBadge.role-global').count()<1)throw new Error(label+' developer badge missing');
 if(await page.locator('#members .devChallenger658').count()<1)throw new Error(label+' developer member frame missing');
 await page.evaluate(()=>{currentView='settings';renderSettings()});
 if(await page.locator('#profileCard53 .profilePreview53.devChallenger658').count()!==1)throw new Error(label+' developer settings profile frame missing');

 const geom=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,inner:innerWidth}));
 if(geom.scroll>geom.inner+2)throw new Error(label+' horizontal overflow '+JSON.stringify(geom));
 console.log(`PASS ${label} v6.58 queue auto control / clean member badge / challenger frame / wait+game alignment`);
 await browser.close();
}

await run(chromium,'Chromium mobile');
await run(webkit,'WebKit mobile');
