import fs from 'node:fs';
import { chromium } from 'playwright';

const latest=JSON.parse(fs.readFileSync('latest-version.json','utf8'));
const VERSION=String(latest.semanticVersion||'').replace(/^v/,'');
if(VERSION!=='6.30')throw new Error('expected v6.30 candidate');

const state={
  courtCount:8,
  courtNames:Array.from({length:8},(_,i)=>`${i+1}코트`),
  members:[{id:'mgr',name:'관리자',year:1985,gender:'남',age:'40',cls:'B',type:'member',role:'manager',totalGames:0,state:'waiting',joinedAt:Date.now()-60000}],
  queue:['mgr'],pendingGames:[],games:[],history:[],pairCounts:{},attendancePolls:[]
};
const copy=()=>JSON.parse(JSON.stringify(state));
let stateCalls=0,loginCalls=0;

const browser=await chromium.launch({headless:true});
try{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(String(e?.stack||e)));

  await page.route('https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/**',async route=>{
    const req=route.request(),url=new URL(req.url());let body={};try{body=JSON.parse(req.postData()||'{}')}catch{}
    if(url.pathname.endsWith('/kokmatch-login-v33')){
      if(body.action==='probe')return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({globalAdmin:false,memberships:[{groupId:'qa',groupName:'QA 모임',memberId:'mgr',year:1985,gender:'남',cls:'B',roleLabel:'모임장'}]})});
      if(body.action==='login'){loginCalls++;return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({token:'fresh-token-630',groupId:'qa',initialPinPending:false})});}
    }
    if(url.pathname.endsWith('/kokmatch-multi-api')&&url.searchParams.get('api')==='state'){
      stateCalls++;
      if(stateCalls<=2)return route.fulfill({status:401,contentType:'application/json',body:JSON.stringify({error:'로그인이 만료되었습니다.'})});
      return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,data:copy(),user:{memberId:'mgr',displayName:'관리자',role:'manager',globalAdmin:false,tempOrganizer:false,groupId:'qa'},group:{groupId:'qa',name:'QA 모임'},groups:[]})});
    }
    if(url.pathname.endsWith('/kokmatch-auth-v38'))return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,memberships:[{groupId:'qa',groupName:'QA 모임',memberId:'mgr',role:'manager'}],currentPinDefault:false})});
    if(url.pathname.includes('roster'))return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,members:copy().members,memberCount:1,adminBadgeVisibility:'all'})});
    if(url.pathname.includes('profile'))return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,profiles:{}})});
    if(url.pathname.endsWith('/kokmatch-v60-api'))return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,data:copy(),user:{memberId:'mgr',displayName:'관리자',role:'manager',globalAdmin:false,tempOrganizer:false,groupId:'qa'},group:{groupId:'qa',name:'QA 모임'}})});
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,data:copy(),profiles:{},groups:[]})});
  });

  await page.goto('http://127.0.0.1:4173/?qa=first-login',{waitUntil:'networkidle'});
  await page.waitForFunction(v=>window.__kokmatchVersionLock===v&&typeof window.submitLogin==='function',VERSION,{timeout:15000});
  // The install guide is intentionally modal in production. Dismiss only for this login QA.
  await page.locator('#pwaSecondary629').click({timeout:1500}).catch(()=>{});
  await page.fill('#loginName','관리자');
  await page.getByRole('button',{name:'다음',exact:true}).click();
  await page.waitForSelector('#loginPin');
  await page.fill('#loginPin','1234');
  await page.getByRole('button',{name:/로그인/}).click();
  await page.waitForFunction(()=>{try{return document.getElementById('login')?.classList.contains('hide')&&me?.memberId==='mgr'&&group?.groupId==='qa'}catch{return false}},{},{timeout:12000});

  const result=await page.evaluate(()=>({
    token:localStorage.getItem('kokmatch_token'),
    groupId:localStorage.getItem('kokmatch_group_id'),
    loginHidden:document.getElementById('login')?.classList.contains('hide'),
    me:(typeof me!=='undefined'&&me?.memberId)||'',
    group:(typeof group!=='undefined'&&group?.groupId)||'',
    freshUntil:Number(window.__kokmatchFreshLoginUntil630||0)
  }));
  if(loginCalls!==1)throw new Error(`login endpoint called ${loginCalls} times; expected one login attempt`);
  if(stateCalls<3)throw new Error(`state retry did not happen: ${stateCalls}`);
  if(result.token!=='fresh-token-630'||result.groupId!=='qa'||!result.loginHidden||result.me!=='mgr'||result.group!=='qa')throw new Error('first-login session did not persist: '+JSON.stringify(result));
  if(errors.length)throw new Error('page errors: '+errors.join(' | '));
  console.log('PASS v6.30 first login survives two initial state 401 responses');
  console.log(`PASS one login call, ${stateCalls} state attempts, token retained`);
} finally {
  await browser.close();
}
