import fs from 'node:fs';
import {chromium,webkit} from 'playwright';

const latest=JSON.parse(fs.readFileSync('latest-version.json','utf8'));
const VERSION=String(latest.semanticVersion||'').replace(/^v/i,'');
if(VERSION!=='6.60')throw new Error('expected v6.60, got '+VERSION);

const now=Date.now();
const members=[
 {id:'dev',name:'개발자',year:1989,gender:'남',age:'30',cls:'B',type:'member',role:'admin',state:'waiting',joinedAt:now-42*60000,totalGames:5},
 {id:'mgr',name:'모임장',year:1988,gender:'남',age:'30',cls:'B',type:'member',role:'manager',state:'waiting',joinedAt:now-35*60000,totalGames:2},
 {id:'mem1',name:'일반1',year:1992,gender:'남',age:'30',cls:'C',type:'member',role:'member',state:'waiting',joinedAt:now-18*60000,totalGames:0},
 {id:'mem2',name:'일반2',year:1993,gender:'여',age:'30',cls:'C',type:'member',role:'member',state:'waiting',joinedAt:now-12*60000,totalGames:1}
];
const state=()=>({courtCount:4,courtNames:['1코트','2코트','3코트','4코트'],members:members.map(x=>({...x})),queue:members.map(x=>x.id),pendingGames:[],games:[],history:[],pairCounts:{},adminBadgeVisibility:'all',autoGame:{enabled:false,mode:'ai_optimal',updatedAt:0,updatedBy:{}}});
const group={groupId:'qa',name:'QA 모임'};
const devUser={memberId:'dev',displayName:'개발자',role:'admin',globalAdmin:true,tempOrganizer:false,groupId:'qa'};
const clone=x=>JSON.parse(JSON.stringify(x));

async function run(engine,label){
 const browser=await engine.launch({headless:true});
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
 const page=await context.newPage();
 const server=state();
 await page.addInitScript(()=>{try{localStorage.setItem('kokmatch_token','qa-token');localStorage.setItem('kokmatch_group_id','qa');localStorage.setItem('kokmatch_push_denied_notice629',String(Date.now()));localStorage.setItem('kokmatch_install_guide631_seen','1');sessionStorage.setItem('kokmatch_install_later630','1')}catch{}});
 await context.route('https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/**',async route=>{
   const req=route.request(),u=new URL(req.url()),path=u.pathname;const headers={'access-control-allow-origin':'*','access-control-allow-headers':'*'};
   if(path.endsWith('/kokmatch-state-v46'))return route.fulfill({status:200,contentType:'application/json',headers,body:JSON.stringify({data:clone(server),memberCount:server.members.length,activeMemberCount:server.members.length,user:devUser,group,groups:[],compact:true})});
   return route.fulfill({status:200,contentType:'application/json',headers,body:JSON.stringify({success:true,data:clone(server),user:devUser,group,groups:[],members:clone(server.members),memberCount:server.members.length})});
 });
 await page.goto('http://127.0.0.1:4173/?qa=v660',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(v=>window.__kokmatchVersionLock===v&&window.__kokmatchStandalone===v,VERSION,{timeout:15000});
 await page.evaluate(({s,user,group})=>{T='qa-token';currentGroupId='qa';S=JSON.parse(JSON.stringify(s));window.S=S;me=user;window.me=me;window.group=group;groups=[];normalizeClient();document.getElementById('login')?.classList.add('hide');renderAll();goView('members');window.__kokmatchApplyChallenger659?.()},{s:state(),user:devUser,group});
 await page.waitForTimeout(80);
 await page.evaluate(()=>window.__kokmatchApplyChallenger659?.());

 // Rectangular roster cards remain borderless.
 const cardBorder=await page.locator('#members .memberCard').first().evaluate(el=>{const s=getComputedStyle(el);return [s.borderTopWidth,s.borderRightWidth,s.borderBottomWidth,s.borderLeftWidth,s.boxShadow]});
 if(cardBorder.slice(0,4).some(x=>x!=='0px'))throw new Error(label+' rectangular member card border returned: '+JSON.stringify(cardBorder));
 if(await page.locator('#members .memberCard.devChallenger659').count())throw new Error(label+' frame leaked onto rectangular member card');

 // Developer avatar uses the actual optimized image asset, not the old CSS crystal polygon.
 const devHost=page.locator('#members .roleBadge.role-global').first().locator('xpath=ancestor::*[contains(@class,"memberCard")][1]');
 if(await devHost.count()!==1)throw new Error(label+' developer card missing');
 const framed=devHost.locator('.devChallenger659').first();
 if(await framed.count()!==1)throw new Error(label+' developer profile frame target missing');
 const memberVisual=await framed.evaluate(el=>{const a=getComputedStyle(el,'::after'),b=getComputedStyle(el,'::before'),s=getComputedStyle(el);return {afterContent:a.content,afterBg:a.backgroundImage,afterWidth:a.width,afterHeight:a.height,afterClip:a.clipPath,beforeDisplay:b.display,beforeContent:b.content,overflow:s.overflow}});
 if(!memberVisual.afterBg.includes('dev-challenger-frame-v660.webp'))throw new Error(label+' generated frame asset not applied: '+JSON.stringify(memberVisual));
 if(memberVisual.afterContent==='none'||memberVisual.afterClip!=='none'||memberVisual.beforeDisplay!=='none'||memberVisual.overflow!=='visible')throw new Error(label+' old CSS crest still active: '+JSON.stringify(memberVisual));

 // The developer self profile in Settings uses the same image asset.
 await page.evaluate(()=>{goView('settings');renderSettings();window.__kokmatchApplyChallenger659?.()});
 await page.waitForTimeout(100);
 await page.evaluate(()=>window.__kokmatchApplyChallenger659?.());
 const preview=page.locator('#profileCard53 .profilePreview53.devChallenger659');
 if(await preview.count()!==1)throw new Error(label+' developer settings profile frame missing');
 const settingsBg=await preview.evaluate(el=>getComputedStyle(el,'::after').backgroundImage);
 if(!settingsBg.includes('dev-challenger-frame-v660.webp'))throw new Error(label+' settings frame does not use generated image: '+settingsBg);

 const assetOk=await page.evaluate(()=>fetch('/assets/dev-challenger-frame-v660.webp?v=6.60',{cache:'no-store'}).then(r=>r.ok).catch(()=>false));
 if(!assetOk)throw new Error(label+' generated WebP asset failed to load');
 const geom=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,inner:innerWidth}));
 if(geom.scroll>geom.inner+2)throw new Error(label+' horizontal overflow '+JSON.stringify(geom));
 console.log(`PASS ${label} v6.60 generated developer image frame / borderless roster cards`);
 await browser.close();
}

await run(chromium,'Chromium mobile');
await run(webkit,'WebKit mobile');
