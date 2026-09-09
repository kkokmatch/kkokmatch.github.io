import fs from 'node:fs';
import { chromium, webkit } from 'playwright';

const latest=JSON.parse(fs.readFileSync('latest-version.json','utf8'));
const VERSION=String(latest.semanticVersion||'').replace(/^v/,'');
if(VERSION!=='6.53')throw new Error('expected v6.53, got '+VERSION);

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
 while(Date.now()-started<timeout){
  try{if(await page.evaluate(expression))return true}catch{}
  await page.waitForTimeout(50);
 }
 throw new Error(`${label} timed out after ${timeout}ms`);
}
async function diagnostics(page,label,rosterHits,fallbackHits){
 let runtime={};
 try{runtime=await page.evaluate(()=>({
   version:window.__kokmatchVersionLock||'',
   enterType:typeof enterMembers42,
   cards:document.querySelectorAll('#members .memberCard').length,
   memberLen:Array.isArray(S?.members)?S.members.length:-1,
   expected:Number(window.__kokmatchMemberCount46||0),
   expectedGroup:String(window.__kokmatchMemberCountGroup46||''),
   currentGroup:String(currentGroupId||''),
   text:String(document.querySelector('#members')?.innerText||'').slice(0,500)
 }))}catch(e){runtime={evalError:String(e?.message||e)}}
 return `${label} diag=${JSON.stringify({...runtime,rosterHits,fallbackHits})}`;
}

async function run(engine,label){
 const browser=await engine.launch({headless:true});
 // Blocking SW is intentional in this focused network-fallback QA: Playwright WebKit can otherwise
 // route external fetches outside page interception. The production SW itself does not proxy Supabase.
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
 const page=await context.newPage();
 let hardOffline=false,rosterHits=0,fallbackHits=0;
 const errors=[];page.on('pageerror',e=>errors.push(String(e?.message||e)));
 await page.addInitScript(()=>{try{localStorage.setItem('kokmatch_push_denied_notice629',String(Date.now()));localStorage.setItem('kokmatch_install_guide631_seen','1');sessionStorage.setItem('kokmatch_install_later630','1')}catch{}});
 await context.route('https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/**',async route=>{
   const req=route.request(),u=new URL(req.url());
   if(hardOffline)return route.abort('failed');
   if(u.pathname.endsWith('/kokmatch-roster-v653')){rosterHits++;return route.abort('failed');}
   if(u.pathname.endsWith('/kokmatch-multi-api')&&u.searchParams.get('api')==='state'){
     fallbackHits++;return route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*','access-control-allow-headers':'*'},body:JSON.stringify({data:fullState,user:{memberId:'m1',displayName:'관리자',role:'manager',globalAdmin:false,tempOrganizer:false,groupId:'qa'},group:{groupId:'qa',name:'QA 모임'},groups:[]})});
   }
   if(u.pathname.endsWith('/kokmatch-state-v46'))return route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*','access-control-allow-headers':'*'},body:JSON.stringify({data:compactState,memberCount:4,user:{memberId:'m1',displayName:'관리자',role:'manager',globalAdmin:false,tempOrganizer:false,groupId:'qa'},group:{groupId:'qa',name:'QA 모임'},groups:[]})});
   return route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*','access-control-allow-headers':'*'},body:JSON.stringify({success:true,data:fullState,profiles:{},user:{memberId:'m1',displayName:'관리자',role:'manager',globalAdmin:false,tempOrganizer:false,groupId:'qa'},group:{groupId:'qa',name:'QA 모임'},groups:[]})});
 });
 try{
  await page.goto('http://127.0.0.1:4173/?qa=v653-roster',{waitUntil:'domcontentloaded'});
  await waitEval(page,()=>window.__kokmatchVersionLock==='6.53'&&typeof enterMembers42==='function',15000,label+' runtime');
  await page.evaluate(({compactState})=>{
    T='qa-token';localStorage.setItem('kokmatch_token',T);currentGroupId='qa';currentView='members';S=JSON.parse(JSON.stringify(compactState));window.S=S;me={memberId:'m1',displayName:'관리자',role:'manager',globalAdmin:false,tempOrganizer:false,groupId:'qa'};group={groupId:'qa',name:'QA 모임'};groups=[];window.__kokmatchMemberCount46=4;window.__kokmatchMemberCountGroup46='qa';normalizeClient();document.getElementById('login')?.classList.add('hide');
  },{compactState});
  await page.evaluate(()=>enterMembers42(true));
  try{await waitEval(page,()=>document.querySelectorAll('#members .memberCard').length===4,7000,label+' fallback cards')}catch(e){throw new Error(`${e.message}; ${await diagnostics(page,label,rosterHits,fallbackHits)}`)}
  const text1=await page.locator('#members').innerText();if(/응답이 지연|불러오지 못/.test(text1))throw new Error(label+' fallback surfaced roster error');
  if(rosterHits<1||fallbackHits<1)throw new Error(label+' fallback path not exercised '+JSON.stringify({rosterHits,fallbackHits}));

  await page.evaluate(()=>{goView('queue');S.members=[S.members[0]];window.S=S;window.__kokmatchMemberCount46=4;window.__kokmatchMemberCountGroup46='qa';normalizeClient();});
  hardOffline=true;
  await page.evaluate(()=>goView('members'));
  try{await waitEval(page,()=>document.querySelectorAll('#members .memberCard').length===4,1800,label+' cached cards')}catch(e){throw new Error(`${e.message}; ${await diagnostics(page,label,rosterHits,fallbackHits)}`)}
  const text2=await page.locator('#members').innerText();if(/응답이 지연|불러오지 못/.test(text2))throw new Error(label+' cached roster surfaced error');
  if(errors.length)throw new Error(label+' page errors: '+errors.join(' | '));
  console.log(`PASS ${label} roster primary failure -> full-state fallback -> offline cache restore`);
 } finally {await browser.close();}
}

await run(chromium,'Chromium mobile');
await run(webkit,'WebKit mobile');
