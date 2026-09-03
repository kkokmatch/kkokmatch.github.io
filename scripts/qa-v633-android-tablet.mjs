import fs from 'node:fs';
import { chromium } from 'playwright';

const latest=JSON.parse(fs.readFileSync('latest-version.json','utf8'));
const VERSION=String(latest.semanticVersion||'').replace(/^v/,'');
if(VERSION!=='6.33')throw new Error('expected v6.33 candidate');

const members=[
 {id:'mgr',name:'관리자',year:1985,gender:'남',age:'40',cls:'B',type:'member',role:'manager',totalGames:0,state:'waiting',joinedAt:Date.now()-60000},
 {id:'out1',name:'미입장회원',year:1990,gender:'남',age:'30',cls:'C',type:'member',role:'member',totalGames:0,state:'out',joinedAt:null},
 {id:'wait1',name:'대기회원',year:1991,gender:'여',age:'30',cls:'D',type:'member',role:'member',totalGames:0,state:'waiting',joinedAt:Date.now()-60000},
 {id:'spec1',name:'관람회원',year:1992,gender:'남',age:'30',cls:'E',type:'member',role:'member',totalGames:0,state:'spectator',joinedAt:Date.now()-60000}
];
const state={courtCount:8,courtNames:Array.from({length:8},(_,i)=>`${i+1}코트`),members,queue:['mgr','wait1'],pendingGames:[],games:[],history:[],pairCounts:{},attendancePolls:[]};
const copy=()=>JSON.parse(JSON.stringify(state));
let stateCalls=0,loginCalls=0;
const requests=[];

const browser=await chromium.launch({headless:true});
try{
 const context=await browser.newContext({
   viewport:{width:800,height:1280},isMobile:true,hasTouch:true,
   userAgent:'Mozilla/5.0 (Linux; Android 14; SM-X710 Build/UP1A.231005.007) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'
 });
 const page=await context.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e?.stack||e)));
 await page.route('https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/**',async route=>{
   const req=route.request(),url=new URL(req.url());let body={};try{body=JSON.parse(req.postData()||'{}')}catch{}
   requests.push(`${req.method()} ${url.pathname}${url.search} action=${body.action||''} op=${body.op||''}`);
   if(url.pathname.endsWith('/kokmatch-login-v33')){
     if(body.action==='probe')return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({globalAdmin:false,memberships:[{groupId:'qa',groupName:'QA 모임',memberId:'mgr',year:1985,gender:'남',cls:'B',roleLabel:'모임장'}]})});
     if(body.action==='login'){loginCalls++;return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({token:'fresh-token-633',groupId:'qa',initialPinPending:false})});}
   }
   if(url.pathname.endsWith('/kokmatch-multi-api')&&url.searchParams.get('api')==='state'){
     stateCalls++;
     if(stateCalls<=2)return route.fulfill({status:401,contentType:'application/json',body:JSON.stringify({error:'로그인이 만료되었습니다.'})});
     return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,data:copy(),user:{memberId:'mgr',displayName:'관리자',role:'manager',globalAdmin:false,tempOrganizer:false,groupId:'qa'},group:{groupId:'qa',name:'QA 모임'},groups:[]})});
   }
   if(url.pathname.endsWith('/kokmatch-state-v46')){
     stateCalls++;
     if(stateCalls<=2)return route.fulfill({status:401,contentType:'application/json',body:JSON.stringify({error:'로그인이 만료되었습니다.'})});
     return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,data:copy(),user:{memberId:'mgr',displayName:'관리자',role:'manager',globalAdmin:false,tempOrganizer:false,groupId:'qa'},group:{groupId:'qa',name:'QA 모임'},groups:[]})});
   }
   if(url.pathname.endsWith('/kokmatch-auth-v38'))return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,memberships:[{groupId:'qa',groupName:'QA 모임',memberId:'mgr',role:'manager'}],currentPinDefault:false})});
   if(url.pathname.includes('roster'))return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,members:copy().members,memberCount:members.length,adminBadgeVisibility:'all'})});
   if(url.pathname.includes('profile'))return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,profiles:{}})});
   if(url.pathname.endsWith('/kokmatch-v60-api'))return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,data:copy(),user:{memberId:'mgr',displayName:'관리자',role:'manager',globalAdmin:false,tempOrganizer:false,groupId:'qa'},group:{groupId:'qa',name:'QA 모임'}})});
   return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,data:copy(),profiles:{},groups:[]})});
 });

 await page.goto('http://127.0.0.1:4173/?qa=android-tablet',{waitUntil:'networkidle'});
 await page.waitForFunction(v=>window.__kokmatchVersionLock===v&&typeof window.submitLogin==='function',VERSION,{timeout:15000});
 await page.locator('#pwaSecondary629').click({timeout:1500}).catch(()=>{});
 await page.fill('#loginName','관리자');
 await page.getByRole('button',{name:'다음',exact:true}).click();
 await page.waitForSelector('#loginPin');
 await page.fill('#loginPin','1234');
 await page.getByRole('button',{name:/로그인/}).click();
 await page.waitForFunction(()=>{try{return document.getElementById('login')?.classList.contains('hide')&&me?.memberId==='mgr'&&group?.groupId==='qa'}catch{return false}},{},{timeout:9000});
 if(loginCalls!==1)throw new Error(`login endpoint called ${loginCalls} times; expected one`);
 if(stateCalls<3)throw new Error(`fresh login state retry missing: ${stateCalls}`);
 const session=await page.evaluate(()=>({token:localStorage.getItem('kokmatch_token'),groupId:localStorage.getItem('kokmatch_group_id'),hidden:document.getElementById('login')?.classList.contains('hide')}));
 if(session.token!=='fresh-token-633'||session.groupId!=='qa'||!session.hidden)throw new Error('first login not persisted: '+JSON.stringify(session));
 console.log('PASS Android tablet first login: one login action, state retry, session retained');

 await page.locator('#pwaSecondary629').click({timeout:700}).catch(()=>{});
 await page.waitForTimeout(500);
 async function inspect(id){return await page.evaluate(id=>{const card=[...document.querySelectorAll('#members .memberCard')].find(c=>String(c.dataset.memberId22||c.dataset.memberId||c.dataset.memberId46||'')===id);if(!card)return null;const cr=card.getBoundingClientRect(),bs=[...card.querySelectorAll('.memberBtns button')];return {card:{left:cr.left,right:cr.right,top:cr.top,bottom:cr.bottom},labels:bs.map(b=>(b.textContent||'').trim()),rects:bs.map(b=>{const r=b.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}})}} ,id)}
 function expectRow(x,labels,name){if(!x)throw new Error(name+' card missing');if(JSON.stringify(x.labels)!==JSON.stringify(labels))throw new Error(name+' labels '+JSON.stringify(x.labels));if(x.rects.length!==3)throw new Error(name+' expected 3 buttons');const tops=x.rects.map(r=>r.top),bottoms=x.rects.map(r=>r.bottom);if(Math.max(...tops)-Math.min(...tops)>1.5||Math.max(...bottoms)-Math.min(...bottoms)>1.5)throw new Error(name+' buttons not one row '+JSON.stringify(x.rects));for(const r of x.rects){if(r.left<x.card.left-1||r.right>x.card.right+1)throw new Error(name+' button pushed outside card '+JSON.stringify({card:x.card,rect:r}))}}
 expectRow(await inspect('out1'),['입장','관람','수정'],'out');
 expectRow(await inspect('wait1'),['퇴장','관람','수정'],'waiting');
 expectRow(await inspect('spec1'),['입장','퇴장','수정'],'spectator');
 console.log('PASS Android tablet member buttons: correct labels, one row, inside card');

 await page.evaluate(()=>goView('settings'));
 await page.waitForTimeout(100);
 const settingsText=await page.locator('#settings').innerText();
 if(!settingsText.includes('콕매치 v6.33'))throw new Error('settings does not show actual runtime v6.33: '+settingsText.slice(-500));
 console.log('PASS settings shows actual runtime v6.33');

 const manifest=JSON.parse(fs.readFileSync('manifest.webmanifest','utf8'));
 if(!String(manifest.start_url||'').includes('kmv=6.33'))throw new Error('manifest start_url does not carry current build');
 const sw=await page.evaluate(async()=>{const r=await navigator.serviceWorker.ready;return r?.active?.scriptURL||''});
 if(!sw.endsWith('/kokmatch-sw.js'))throw new Error('service worker is not stable canonical URL: '+sw);
 console.log('PASS stable canonical service worker URL and versioned PWA launch URL');
 if(errors.length)throw new Error('page errors: '+errors.join(' | '));
} finally {await browser.close()}
