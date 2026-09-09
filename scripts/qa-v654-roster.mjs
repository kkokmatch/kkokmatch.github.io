import fs from 'node:fs';
import { chromium, webkit } from 'playwright';

const latest=JSON.parse(fs.readFileSync('latest-version.json','utf8'));
const VERSION=String(latest.semanticVersion||'').replace(/^v/,'');
if(VERSION!=='6.54')throw new Error('expected v6.54, got '+VERSION);

const fullMembers=[
 {id:'m1',name:'관리자',year:1985,gender:'남',age:'40',cls:'B',type:'member',role:'manager',state:'waiting',joinedAt:Date.now()-600000,totalGames:0},
 {id:'m2',name:'회원둘',year:1990,gender:'여',age:'30',cls:'C',type:'member',role:'member',state:'out',joinedAt:null,totalGames:0},
 {id:'m3',name:'회원셋',year:1992,gender:'남',age:'30',cls:'D',type:'member',role:'member',state:'out',joinedAt:null,totalGames:0},
 {id:'m4',name:'회원넷',year:1995,gender:'여',age:'30',cls:'C',type:'member',role:'member',state:'out',joinedAt:null,totalGames:0}
];
const fullState={courtCount:4,courtNames:['1코트','2코트','3코트','4코트'],members:fullMembers,queue:['m1'],pendingGames:[],games:[],history:[],pairCounts:{}};
const compactState={...fullState,members:[fullMembers[0]]};

async function waitEval(page,expression,timeout=7000,label='condition'){
 const started=Date.now();
 while(Date.now()-started<timeout){try{if(await page.evaluate(expression))return true}catch{}await page.waitForTimeout(50)}
 throw new Error(`${label} timed out after ${timeout}ms`);
}

async function run(engine,label){
 const browser=await engine.launch({headless:true});
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
 let hardOffline=false,rosterHits=0,fallbackHits=0;
 await context.route('https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/**',async route=>{
  const u=new URL(route.request().url());
  if(hardOffline)return route.abort('failed');
  if(u.pathname.endsWith('/kokmatch-roster-v654')){
   rosterHits++;
   await new Promise(r=>setTimeout(r,4100));
   return route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*','access-control-allow-headers':'*'},body:JSON.stringify({groupId:'qa',groupName:'QA 모임',members:fullMembers,memberCount:4,adminBadgeVisibility:'all',source:'roster-v654'})});
  }
  if(u.pathname.endsWith('/kokmatch-multi-api')&&u.searchParams.get('api')==='state'){
   fallbackHits++;
   return route.abort('failed');
  }
  if(u.pathname.endsWith('/kokmatch-state-v46'))return route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*','access-control-allow-headers':'*'},body:JSON.stringify({data:compactState,memberCount:4,user:{memberId:'m1',displayName:'관리자',role:'manager',globalAdmin:false,tempOrganizer:false,groupId:'qa'},group:{groupId:'qa',name:'QA 모임'},groups:[]})});
  return route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*','access-control-allow-headers':'*'},body:JSON.stringify({success:true,data:fullState,user:{memberId:'m1',displayName:'관리자',role:'manager',globalAdmin:false,tempOrganizer:false,groupId:'qa'},group:{groupId:'qa',name:'QA 모임'},groups:[]})});
 });
 const init=()=>{try{localStorage.setItem('kokmatch_push_denied_notice629',String(Date.now()));localStorage.setItem('kokmatch_install_guide631_seen','1');sessionStorage.setItem('kokmatch_install_later630','1')}catch{}};
 let page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e?.message||e)));await page.addInitScript(init);
 try{
  await page.goto('http://127.0.0.1:4173/?qa=v654-roster',{waitUntil:'domcontentloaded'});
  await waitEval(page,()=>window.__kokmatchVersionLock==='6.54'&&typeof enterMembers42==='function'&&typeof window.__kokmatchReadRoster654==='function',15000,label+' runtime');
  await page.evaluate(({compactState})=>{T='qa-token';localStorage.setItem('kokmatch_token',T);currentGroupId='qa';currentView='members';S=JSON.parse(JSON.stringify(compactState));window.S=S;me={memberId:'m1',displayName:'관리자',role:'manager',globalAdmin:false,tempOrganizer:false,groupId:'qa'};group={groupId:'qa',name:'QA 모임'};groups=[];window.__kokmatchMemberCount46=4;window.__kokmatchMemberCountGroup46='qa';normalizeClient();document.getElementById('login')?.classList.add('hide')},{compactState});
  const started=Date.now();await page.evaluate(()=>enterMembers42(true));
  await waitEval(page,()=>document.querySelectorAll('#members .memberCard').length===4,7500,label+' delayed primary cards');
  const elapsed=Date.now()-started;if(elapsed<3800)throw new Error(label+' did not exercise delayed roster response');
  const cacheCount=await page.evaluate(()=>window.__kokmatchReadRoster654?.('qa')?.members?.length||0);if(cacheCount!==4)throw new Error(label+' persistent roster cache not written');
  const text1=await page.locator('#members').innerText();if(/응답이 지연|불러오지 못|연결이 계속 지연/.test(text1))throw new Error(label+' delay error surfaced after valid slow response');

  await page.evaluate(()=>{localStorage.removeItem('kokmatch_token');window.__kokmatchFullRosterCache654=null});
  await page.close();hardOffline=true;
  page=await context.newPage();page.on('pageerror',e=>errors.push(String(e?.message||e)));await page.addInitScript(init);
  await page.goto('http://127.0.0.1:4173/?qa=v654-persist',{waitUntil:'domcontentloaded'});
  await waitEval(page,()=>window.__kokmatchVersionLock==='6.54'&&typeof enterMembers42==='function',15000,label+' reload runtime');
  const persisted=await page.evaluate(()=>window.__kokmatchReadRoster654?.('qa')?.members?.length||0);if(persisted!==4)throw new Error(label+' cache did not survive page restart');
  await page.evaluate(({compactState})=>{T='qa-token';currentGroupId='qa';currentView='members';S=JSON.parse(JSON.stringify(compactState));window.S=S;me={memberId:'m1',displayName:'관리자',role:'manager',globalAdmin:false,tempOrganizer:false,groupId:'qa'};group={groupId:'qa',name:'QA 모임'};groups=[];window.__kokmatchMemberCount46=4;window.__kokmatchMemberCountGroup46='qa';window.__kokmatchFullRosterCache654=null;normalizeClient();document.getElementById('login')?.classList.add('hide')},{compactState});
  await page.evaluate(()=>enterMembers42(false));
  await waitEval(page,()=>document.querySelectorAll('#members .memberCard').length===4,1800,label+' offline persistent cards');
  const text2=await page.locator('#members').innerText();if(/응답이 지연|불러오지 못|연결이 계속 지연/.test(text2))throw new Error(label+' offline cache surfaced roster error');
  if(rosterHits<1)throw new Error(label+' delayed primary path was not exercised');
  if(errors.length)throw new Error(label+' page errors: '+errors.join(' | '));
  console.log(`PASS ${label} v6.54 delayed roster + persistent reload fallback`,{elapsed,rosterHits,fallbackHits});
 } finally {await browser.close()}
}

await run(chromium,'Chromium mobile');
await run(webkit,'WebKit mobile');
