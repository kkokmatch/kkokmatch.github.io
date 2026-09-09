import fs from 'node:fs';
import {chromium,webkit} from 'playwright';
const latest=JSON.parse(fs.readFileSync('latest-version.json','utf8'));
const VERSION=String(latest.semanticVersion||'').replace(/^v/,'');
if(VERSION!=='6.57')throw new Error('expected v6.57, got '+VERSION);
const now=Date.now();
const members=Array.from({length:4},(_,i)=>({id:`m${i+1}`,name:i===0?'운영자':`회원${i+1}`,year:1985+i,gender:i%2?'여':'남',age:'40',cls:['B','C','B','C'][i],type:'member',role:i===0?'manager':'member',state:'waiting',joinedAt:now-(30-i*3)*60000,totalGames:0}));
const state={courtCount:2,courtNames:['1코트','2코트'],members,queue:members.map(m=>m.id),pendingGames:[],games:[],history:[],pairCounts:{},attendancePolls:[],autoGame:{enabled:true,mode:'ai_optimal',updatedAt:now,updatedBy:{memberId:'m1',name:'운영자',role:'manager',roleLabel:'모임장'}}};
async function run(engine,label){
 const browser=await engine.launch({headless:true});const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});const page=await context.newPage();let hits=0;
 await page.addInitScript(()=>{try{localStorage.setItem('kokmatch_push_denied_notice629',String(Date.now()));localStorage.setItem('kokmatch_install_guide631_seen','1');sessionStorage.setItem('kokmatch_install_later630','1')}catch{}});
 await context.route('https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/**',async route=>{const u=new URL(route.request().url());const headers={'access-control-allow-origin':'*','access-control-allow-headers':'*'};if(u.pathname.endsWith('/kokmatch-auto-v656')){hits++;return route.fulfill({status:200,contentType:'application/json',headers,body:JSON.stringify({success:true,created:false,reason:'enough_pending',data:state,config:state.autoGame})})}return route.fulfill({status:200,contentType:'application/json',headers,body:JSON.stringify({success:true,data:state,user:{memberId:'m1',displayName:'운영자',role:'manager',globalAdmin:false,groupId:'qa'},group:{groupId:'qa',name:'QA'},groups:[]})})});
 await page.goto('http://127.0.0.1:4173/?qa=v657-staff',{waitUntil:'domcontentloaded'});await page.waitForFunction(v=>window.__kokmatchVersionLock===v&&window.__kokmatchAutoGame656===v,VERSION,{timeout:15000});
 await page.evaluate(({state})=>{T='qa';currentGroupId='qa';S=JSON.parse(JSON.stringify(state));window.S=S;group={groupId:'qa',name:'QA'};groups=[];me={memberId:'m2',displayName:'회원2',role:'member',globalAdmin:false,tempOrganizer:false,groupId:'qa'};window.me=me;normalizeClient();document.getElementById('login')?.classList.add('hide')},{state});
 const before=hits;await page.evaluate(()=>window.__kokmatchRunAuto656(true));await page.waitForTimeout(200);if(hits!==before)throw new Error(label+' normal member triggered auto tick');
 await page.evaluate(()=>{me={memberId:'m1',displayName:'운영자',role:'manager',globalAdmin:false,tempOrganizer:false,groupId:'qa'};window.me=me});await page.evaluate(()=>window.__kokmatchRunAuto656(true));await page.waitForTimeout(200);if(hits<=before)throw new Error(label+' manager did not trigger auto tick');
 if(await page.locator('#opsDashboard652').count())throw new Error(label+' live operations dashboard returned');
 console.log(`PASS ${label} v6.57 staff-only auto tick`);await browser.close();
}
await run(chromium,'Chromium mobile');await run(webkit,'WebKit mobile');
