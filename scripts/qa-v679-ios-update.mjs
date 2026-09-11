import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';

const latest=JSON.parse(fs.readFileSync('latest-version.json','utf8'));
const VERSION=String(latest.semanticVersion||'').replace(/^v/,'');
const now=Date.now();
const month=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit'}).format(new Date());
const state={courtCount:3,courtNames:['1코트','2코트','3코트'],members:[
 {id:'mgr',name:'모임장',year:1988,age:'30',cls:'C',gender:'남',type:'member',role:'manager',state:'waiting',joinedAt:now-20*60000,attendanceMonth:month,attendanceCount:4},
 {id:'m1',name:'김은영',year:1990,age:'30',cls:'D',gender:'여',type:'member',role:'member',state:'waiting',joinedAt:now-18*60000,attendanceMonth:month,attendanceCount:3},
 {id:'m2',name:'김연수',year:1991,age:'30',cls:'D',gender:'남',type:'member',role:'member',state:'waiting',joinedAt:now-16*60000,attendanceMonth:month,attendanceCount:2}
],queue:['mgr','m1','m2'],pendingGames:[],games:[],history:[],pairCounts:{},attendancePolls:[],autoGame:{enabled:false}};
const clone=x=>JSON.parse(JSON.stringify(x));
const browser=await chromium.launch({headless:true});

// A. Simulate an iPhone/PWA update where the main JS fails once. The inline boot guard must prevent a white screen and self-heal.
{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
 const page=await context.newPage();let jsRequests=0;
 await page.route(`**/app-v${VERSION}.js*`,async route=>{jsRequests++;if(jsRequests===1)return route.abort('failed');return route.continue()});
 await page.goto('http://127.0.0.1:4173/?qa=v679-recovery',{waitUntil:'domcontentloaded'});
 assert.equal(await page.locator('#bootFallback679').count(),1,'visible boot fallback missing before bundle recovery');
 const fallbackBox=await page.locator('#bootFallback679').boundingBox();assert(fallbackBox&&fallbackBox.height>100,'boot fallback is not visibly occupying the screen');
 await page.waitForSelector('.app',{state:'visible',timeout:12000});
 assert(jsRequests>=2,`bundle was not retried after first failure: ${jsRequests}`);
 const bodyText=(await page.locator('body').innerText()).trim();assert(bodyText.length>0,'body remained blank after update recovery');
 assert.equal(await page.locator('#bootFallback679').count(),0,'boot fallback survived after app shell loaded');
 await context.close();
}

// B. Simulate stale previous-version cache before SW installation. Current activation must remove it and leave a working app shell.
{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'allow'});
 const page=await context.newPage();
 await page.goto('http://127.0.0.1:4173/manifest.webmanifest',{waitUntil:'domcontentloaded'});
 await page.evaluate(async()=>{const c=await caches.open('kokmatch-static-6.78');await c.put('/stale-v678',new Response('stale'))});
 await page.goto('http://127.0.0.1:4173/?qa=v679-sw',{waitUntil:'domcontentloaded'});
 await page.waitForSelector('.app',{state:'visible',timeout:15000});
 await page.waitForFunction(()=>navigator.serviceWorker&&navigator.serviceWorker.controller,{timeout:15000});
 await page.waitForTimeout(300);
 const cacheKeys=await page.evaluate(()=>caches.keys());
 assert(!cacheKeys.includes('kokmatch-static-6.78'),`stale cache survived activation: ${cacheKeys.join(',')}`);
 assert(cacheKeys.some(k=>k===`kokmatch-static-${VERSION}`),`current cache missing: ${cacheKeys.join(',')}`);
 assert((await page.locator('body').innerText()).trim().length>0,'PWA body blank after SW activation');
 await context.close();
}

// C. Exact monthly-name alignment: circular rank stays left, actual name center lines up with the name header center.
{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e?.stack||e)));
 await page.addInitScript(()=>{try{localStorage.setItem('kokmatch_push_denied_notice629',String(Date.now()));localStorage.setItem('kokmatch_install_guide631_seen','1');sessionStorage.setItem('kokmatch_install_later630','1')}catch{}});
 await page.route('https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/**',async route=>{
  const url=new URL(route.request().url());
  if(url.pathname.endsWith('/kokmatch-stats-v54'))return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,members:clone(state.members),baselines:[],monthGames:[],rangeGames:[]})});
  if(url.pathname.endsWith('/kokmatch-state-v46'))return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({data:clone(state),group:{groupId:'qa',name:'QA'},user:{memberId:'mgr',displayName:'모임장',role:'manager',globalAdmin:false,tempOrganizer:false,groupId:'qa'},memberCount:state.members.length})});
  if(url.pathname.includes('profile'))return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,profiles:{}})});
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,data:clone(state),group:{groupId:'qa',name:'QA'},user:{memberId:'mgr',displayName:'모임장',role:'manager',globalAdmin:false,tempOrganizer:false,groupId:'qa'},groups:[]})});
 });
 await page.goto('http://127.0.0.1:4173/?qa=v679-stats',{waitUntil:'networkidle'});
 await page.waitForFunction(v=>window.__kokmatchVersionLock===v&&window.__kokmatchBootResilience679===v,VERSION,{timeout:15000});
 await page.evaluate(s=>{T='qa-token';currentGroupId='qa';S=JSON.parse(JSON.stringify(s));window.S=S;me={memberId:'mgr',displayName:'모임장',role:'manager',globalAdmin:false,tempOrganizer:false,groupId:'qa'};group={groupId:'qa',name:'QA'};groups=[];normalizeClient();document.getElementById('login')?.classList.add('hide');currentView='stats';renderAll();goView('stats');renderStats()},clone(state));
 await page.waitForSelector('#stats .statsMonthlyTable628 tbody tr[data-member-id628]');await page.waitForTimeout(180);
 const align=await page.locator('#stats .statsMonthlyTable628 tbody tr[data-member-id628]').first().evaluate(tr=>{
   const table=tr.closest('table'),th=table?.querySelector('thead th:first-child'),name=tr.querySelector('td:first-child > b'),rank=tr.querySelector('td:first-child .statsRank678');
   const a=th?.getBoundingClientRect(),b=name?.getBoundingClientRect(),r=rank?.getBoundingClientRect();
   return {delta:a&&b?Math.abs((a.left+a.right)/2-(b.left+b.right)/2):999,rankLeft:r?.left||0,nameLeft:b?.left||0};
 });
 assert(align.delta<2,`name/header center mismatch: ${JSON.stringify(align)}`);
 assert(align.rankLeft<align.nameLeft,`rank circle is not left of the name: ${JSON.stringify(align)}`);
 if(errors.length)throw new Error(errors.join(' | '));
 await context.close();
}

await browser.close();
console.log('PASS v6.79 iPhone-like bundle failure self-recovers without white screen');
console.log('PASS v6.79 stale v6.78 PWA cache is removed and current SW remains usable');
console.log('PASS v6.79 monthly member names align exactly under the name header while rank circle stays left');
