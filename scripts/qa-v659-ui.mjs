import fs from 'node:fs';
import {chromium,webkit} from 'playwright';

const latest=JSON.parse(fs.readFileSync('latest-version.json','utf8'));
const VERSION=String(latest.semanticVersion||'').replace(/^v/i,'');
if(VERSION!=='6.59')throw new Error('expected v6.59, got '+VERSION);

const now=Date.now();
const members=[
 {id:'dev',name:'개발자',year:1989,gender:'남',age:'30',cls:'B',type:'member',role:'admin',state:'waiting',joinedAt:now-42*60000,totalGames:5},
 {id:'mgr',name:'모임장',year:1988,gender:'남',age:'30',cls:'B',type:'member',role:'manager',state:'waiting',joinedAt:now-35*60000,totalGames:2},
 {id:'org',name:'운영진',year:1990,gender:'여',age:'30',cls:'C',type:'member',role:'organizer',state:'waiting',joinedAt:now-28*60000,totalGames:1},
 {id:'mem1',name:'일반1',year:1992,gender:'남',age:'30',cls:'C',type:'member',role:'member',state:'waiting',joinedAt:now-18*60000,totalGames:0}
];
function state(enabled=false){return {courtCount:4,courtNames:['1코트','2코트','3코트','4코트'],members:members.map(x=>({...x})),queue:members.map(x=>x.id),pendingGames:[],games:[],history:[],pairCounts:{},adminBadgeVisibility:'all',autoGame:{enabled,mode:'ai_optimal',updatedAt:0,updatedBy:{}}}}
const group={groupId:'qa',name:'QA 모임'};
const devUser={memberId:'dev',displayName:'개발자',role:'admin',globalAdmin:true,tempOrganizer:false,groupId:'qa'};
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
     if(body.action==='set')server.autoGame={enabled:body.enabled===true,mode:'ai_optimal',updatedAt:Date.now(),updatedBy:{memberId:'dev',name:'개발자',role:'admin',roleLabel:'개발자'}};
     return route.fulfill({status:200,contentType:'application/json',headers,body:JSON.stringify({success:true,config:server.autoGame,data:clone(server)})});
   }
   if(path.endsWith('/kokmatch-state-v46'))return route.fulfill({status:200,contentType:'application/json',headers,body:JSON.stringify({data:clone(server),memberCount:server.members.length,activeMemberCount:server.members.length,user:devUser,group,groups:[],compact:true})});
   return route.fulfill({status:200,contentType:'application/json',headers,body:JSON.stringify({success:true,data:clone(server),user:devUser,group,groups:[],members:clone(server.members),memberCount:server.members.length})});
 });
 await page.goto('http://127.0.0.1:4173/?qa=v659',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(v=>window.__kokmatchVersionLock===v&&window.__kokmatchUiRefine659===v,VERSION,{timeout:15000});
 await page.evaluate(({s,user,group})=>{T='qa-token';currentGroupId='qa';S=JSON.parse(JSON.stringify(s));window.S=S;me=user;window.me=me;window.group=group;groups=[];normalizeClient();document.getElementById('login')?.classList.add('hide');currentView='queue';renderAll();window.__kokmatchApplyChallenger659?.()},{s:state(false),user:devUser,group});

 // 1) Automatic assignment card is a compact button-first single row.
 const auto=page.locator('#queue .autoGameQueue658.compactAuto659');
 if(await auto.count()!==1)throw new Error(label+' compact auto card missing');
 const autoText=await auto.innerText();
 for(const required of ['자동게임편성','설정','OFF'])if(!autoText.includes(required))throw new Error(label+' compact auto card missing '+required+': '+autoText);
 for(const removed of ['AI 자동 최적화','게임대기 운영','현재 대기상황','직접 편성 모드','마지막 설정'])if(autoText.includes(removed))throw new Error(label+' redundant auto text remains: '+removed);
 const ar=await auto.boundingBox();if(!ar||ar.height>72)throw new Error(label+' auto card too tall: '+JSON.stringify(ar));
 await page.evaluate(()=>toggleAutoGame656());
 await page.waitForFunction(()=>S?.autoGame?.enabled===true,{timeout:4000});
 if(!(await page.locator('#queue .autoToggle656').innerText()).includes('ON'))throw new Error(label+' auto toggle failed');
 await page.evaluate(()=>{currentView='settings';renderSettings()});
 if(await page.locator('#settings .autoGameCard656').count())throw new Error(label+' auto card leaked back into settings');

 // 2) Member roster rectangular cards have no border, while the developer frame never lands on the card itself.
 await page.evaluate(()=>{currentView='members';renderMembers();window.__kokmatchApplyChallenger659?.()});
 const border=await page.locator('#members .memberCard').first().evaluate(el=>{const s=getComputedStyle(el);return {t:s.borderTopWidth,r:s.borderRightWidth,b:s.borderBottomWidth,l:s.borderLeftWidth,shadow:s.boxShadow}});
 if([border.t,border.r,border.b,border.l].some(x=>x!=='0px'))throw new Error(label+' member card border remains: '+JSON.stringify(border));
 if(await page.locator('#members .memberCard.devChallenger659').count())throw new Error(label+' challenger frame applied to rectangular member card');
 const devHost=page.locator('#members .roleBadge.role-global').first().locator('xpath=ancestor::*[contains(@class,"memberCard")][1]');
 if(await devHost.count()!==1)throw new Error(label+' developer member card missing');
 if(await devHost.locator('.devChallenger659').count()<1)throw new Error(label+' developer profile-photo frame missing in member list');

 // 3) Settings profile preview has a winged gold/cyan Challenger-style crest, not the old simple glow.
 await page.evaluate(()=>{currentView='settings';renderSettings();window.__kokmatchApplyChallenger659?.()});
 const preview=page.locator('#profileCard53 .profilePreview53.devChallenger659');
 if(await preview.count()!==1)throw new Error(label+' developer settings profile frame missing');
 const visual=await preview.evaluate(el=>{
   const s=getComputedStyle(el),b=getComputedStyle(el,'::before'),a=getComputedStyle(el,'::after');
   return {border:s.borderTopWidth,outline:s.outlineStyle,shadow:s.boxShadow,bContent:b.content,bClip:b.clipPath,bBg:b.backgroundImage,aContent:a.content,aClip:a.clipPath,aBg:a.backgroundImage,overflow:s.overflow};
 });
 if(visual.border!=='3px'||visual.outline==='none'||visual.overflow!=='visible')throw new Error(label+' challenger ring styling incomplete: '+JSON.stringify(visual));
 if(visual.bContent==='none'||visual.aContent==='none'||visual.bClip==='none'||visual.aClip==='none'||visual.bBg==='none'||visual.aBg==='none')throw new Error(label+' challenger crystal wings missing: '+JSON.stringify(visual));

 const geom=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,inner:innerWidth}));
 if(geom.scroll>geom.inner+2)throw new Error(label+' horizontal overflow '+JSON.stringify(geom));
 console.log(`PASS ${label} v6.59 compact auto card / borderless member cards / Challenger profile crest`);
 await browser.close();
}

await run(chromium,'Chromium mobile');
await run(webkit,'WebKit mobile');
