import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {chromium,webkit,devices} from 'playwright';
const version=JSON.parse(fs.readFileSync('latest-version.json')).semanticVersion;
const base=process.env.QA_URL||'http://127.0.0.1:4197';
const server=process.env.QA_URL?null:spawn('python3',['-m','http.server','4197'],{stdio:'ignore'});
if(server)await new Promise(r=>setTimeout(r,500));
try{
const report=[];
for(const [engine,name,opts] of [[chromium,'desktop',{viewport:{width:1280,height:900}}],...process.env.QA_CHROMIUM_ONLY?[]:[[webkit,'iphone',{...devices['iPhone 13']}]]]){
 const browser=await engine.launch({headless:true});
 try{
  const ctx=await browser.newContext({...opts,timezoneId:'Asia/Seoul',serviceWorkers:'block'});
  await ctx.addInitScript(()=>{localStorage.setItem('kokmatch_install_guide631_seen','1');sessionStorage.setItem('kokmatch_install_later630','1');localStorage.setItem('kokmatch_push_denied_notice629',String(Date.now()));if(!localStorage.getItem('qa_seeded')){localStorage.setItem('qa_seeded','1');localStorage.setItem('kokmatch_token','stale-old-token');localStorage.setItem('kokmatch_session_business_day_v71','2026-09-01')}});
  let coreStatus=200,token='fresh-token',secondaryFailures=0,hold=false,release,checks=0;
  const state={courtCount:2,courtNames:['1코트','2코트'],members:[{id:'qa',name:'검증회원',year:1989,gender:'남',cls:'C',type:'member',role:'manager',state:'waiting',joinedAt:Date.now(),totalGames:0}],queue:['qa'],pendingGames:[],games:[],history:[],pairCounts:{},autoGame:{enabled:true}};
  const data={data:state,user:{memberId:'qa',displayName:'검증회원',role:'manager',groupId:'qa',globalAdmin:false},group:{groupId:'qa',name:'검증 모임'},groups:[]};
  await ctx.route('https://wjelumpbjklfrdjxbesj.supabase.co/**',async route=>{
   const url=new URL(route.request().url());let body={};try{body=route.request().postDataJSON()||{}}catch{}
   let status=200,result={success:true,profiles:{},memberships:[],...data};
   if(url.pathname.endsWith('kokmatch-login-v33'))result=body.action==='probe'?{memberships:[{groupId:'qa',groupName:'검증 모임',memberId:'qa',roleLabel:'모임장'}]}:{token,groupId:'qa'};
   else if(url.pathname.endsWith('kokmatch-multi-api')){checks++;status=coreStatus;if(hold){hold=false;await new Promise(r=>release=r);status=401}result=status===401?{error:'로그인이 필요합니다.'}:status===500?{error:'temporary outage'}:data;}
   else if(url.pathname.includes('kokmatch-auto-')||url.pathname.includes('kokmatch-push-')){secondaryFailures++;status=401;result={error:'로그인이 필요합니다.'};}
   await route.fulfill({status,contentType:'application/json',body:JSON.stringify(result)});
  });
  const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('dialog',d=>d.dismiss());
  await page.clock.install({time:new Date('2026-10-21T05:00:00Z')});
  await page.goto(base+'/?qa=session',{waitUntil:'networkidle'});
  await page.waitForFunction(v=>window.__kokmatchVersionLock===v,version);
  assert.equal(await page.evaluate(()=>T),'','Old business-day token discarded');
  async function login(){await page.locator('#loginName').fill('검증회원');await page.locator('#loginNext38').click();await page.locator('#loginPin').fill('1234');await page.locator('#loginSubmit38').click();await page.waitForFunction(()=>!!me&&document.querySelector('#login').classList.contains('hide'));}
  await login();await page.clock.fastForward(20000);await page.waitForTimeout(400);
  await page.evaluate(()=>reloginLatest());
  assert.equal(await page.evaluate(()=>T),token,'Auxiliary 401 must not log out a valid session');
  assert.ok(secondaryFailures>0,'Actual background auto API exercised');
  await page.reload({waitUntil:'networkidle'});await page.waitForFunction(()=>!!me);
  await page.clock.fastForward(60000);await page.waitForTimeout(250);
  assert.equal(await page.evaluate(()=>T),token,'Session survives reload and polling');
  coreStatus=500;await page.evaluate(()=>reloginLatest());assert.equal(await page.evaluate(()=>T),token,'Outage is not expiration');
  coreStatus=200;await page.evaluate(()=>reloginLatest('old-request-token'));assert.equal(await page.evaluate(()=>T),token);
  hold=true;await page.evaluate(()=>{window.qaPendingExpiry=reloginLatest()});
  await page.waitForTimeout(150);assert.ok(release);token='replacement-token';await page.evaluate(t=>{T=t;localStorage.setItem(TOKEN_KEY,t)},token);release();await page.evaluate(()=>window.qaPendingExpiry);
  assert.equal(await page.evaluate(()=>T),token,'Delayed expired response cannot delete replacement session');
  coreStatus=401;await page.evaluate(()=>reloginLatest());await page.waitForFunction(()=>!T);
  assert.ok(await page.locator('#loginName').isVisible(),'True expiry still requires login');
  coreStatus=200;token='relogin-token';await login();await page.clock.fastForward(20000);await page.waitForTimeout(250);await page.evaluate(()=>reloginLatest());
  assert.equal(await page.evaluate(()=>T),token);assert.deepEqual(errors,[]);
  fs.mkdirSync('qa-results',{recursive:true});await page.screenshot({path:`qa-results/session-${name}.png`});
  report.push({name,version,secondaryFailures,checks,staleStartup:true,retainedBeyond60Seconds:true,reload:true,outage:true,staleResponse:true,trueExpiry:true,relogin:true});
 }finally{await browser.close()}
}
console.log(JSON.stringify(report));

}finally{server?.kill()}
