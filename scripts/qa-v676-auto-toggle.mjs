import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const latest=JSON.parse(fs.readFileSync('latest-version.json','utf8'));
const VERSION=String(latest.semanticVersion||'').replace(/^v/,'');
const now=Date.now();
const identity={memberId:'mgr',displayName:'모임장',role:'manager',globalAdmin:false,tempOrganizer:false,groupId:'qa'};
const state={courtCount:3,courtNames:['1코트','2코트','3코트'],autoGame:{enabled:false,mode:'priority_v673',updatedAt:now,updatedBy:{}},members:[
 {id:'mgr',name:'모임장',cls:'B',gender:'남',type:'member',role:'manager',state:'waiting',joinedAt:now-2400000},
 {id:'m1',name:'회원1',cls:'C',gender:'남',type:'member',role:'member',state:'waiting',joinedAt:now-2100000},
 {id:'m2',name:'회원2',cls:'C',gender:'여',type:'member',role:'member',state:'waiting',joinedAt:now-1800000},
 {id:'m3',name:'회원3',cls:'D',gender:'남',type:'member',role:'member',state:'waiting',joinedAt:now-1500000}
],queue:['mgr','m1','m2','m3'],pendingGames:[],games:[],history:[],pairCounts:{},attendancePolls:[]};
const clone=x=>JSON.parse(JSON.stringify(x));
let tickFailures=0,setCalls=[];
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const page=await context.newPage();const pageErrors=[],dialogs=[];
page.on('pageerror',e=>pageErrors.push(String(e?.stack||e)));
page.on('dialog',async d=>{dialogs.push(d.message());await d.dismiss()});
await page.addInitScript(()=>{try{localStorage.setItem('kokmatch_push_denied_notice629',String(Date.now()));localStorage.setItem('kokmatch_install_guide631_seen','1');sessionStorage.setItem('kokmatch_install_later630','1')}catch{}});
await page.route('https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/**',async route=>{
 const req=route.request(),url=new URL(req.url());let body={};try{body=JSON.parse(req.postData()||'{}')}catch{}
 if(url.pathname.endsWith('/kokmatch-auto-v656')){
  if(body.action==='set'){
   setCalls.push(body.enabled===true);state.autoGame={...state.autoGame,enabled:body.enabled===true,updatedAt:Date.now(),updatedBy:{name:'모임장',role:'manager',roleLabel:'모임장'}};
   return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,config:clone(state.autoGame),data:clone(state)})});
  }
  if(body.action==='tick'){
   tickFailures++;
   return route.fulfill({status:546,contentType:'application/json',body:JSON.stringify({code:'WORKER_RESOURCE_LIMIT',message:'Function failed due to not having enough compute resources'})});
  }
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,config:clone(state.autoGame),data:clone(state)})});
 }
 if(url.pathname.endsWith('/kokmatch-state-v46'))return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({data:clone(state),group:{groupId:'qa',name:'QA'},user:identity,memberCount:state.members.length})});
 if(url.pathname.includes('profile'))return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,profiles:{}})});
 return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,data:clone(state),group:{groupId:'qa',name:'QA'},user:identity,groups:[]})});
});
try{
 await page.goto('http://127.0.0.1:4173/?qa=v676-auto',{waitUntil:'networkidle'});
 await page.waitForFunction(v=>window.__kokmatchVersionLock===v&&window.__kokmatchAutoToggle676===v,VERSION,{timeout:15000});
 await page.evaluate(({state,identity})=>{T='qa-token';localStorage.setItem('kokmatch_token',T);currentGroupId='qa';S=JSON.parse(JSON.stringify(state));window.S=S;me=identity;group={groupId:'qa',name:'QA'};groups=[];normalizeClient();currentView='queue';renderAll();document.getElementById('login')?.classList.add('hide');goView('queue')},{state:clone(state),identity});
 await page.waitForSelector('.autoGameQueue658 .autoToggle656');
 await page.locator('.autoGameQueue658 .autoToggle656').click();
 await page.waitForFunction(()=>S?.autoGame?.enabled===true,{timeout:5000});
 await page.waitForTimeout(300);
 assert.equal(setCalls[0],true,'ON was not saved');
 assert(tickFailures>=1,'initial tick failure scenario was not exercised');
 assert.equal(await page.evaluate(()=>S?.autoGame?.enabled===true),true,'tick failure incorrectly rolled ON state back');
 assert.equal(dialogs.some(x=>/서버 응답을 확인하지 못했습니다|WORKER_RESOURCE_LIMIT|compute resources/.test(x)),false,'successful ON save surfaced tick failure as toggle error');
 assert.equal((await page.locator('.autoGameQueue658 .autoToggle656 span').first().innerText()).trim(),'ON','ON label was not retained after tick failure');

 await page.locator('.autoGameQueue658 .autoToggle656').click();
 await page.waitForFunction(()=>S?.autoGame?.enabled===false,{timeout:5000});
 assert.equal(setCalls.at(-1),false,'OFF was not saved');
 assert.equal((await page.locator('.autoGameQueue658 .autoToggle656 span').first().innerText()).trim(),'OFF','OFF label did not update');
 if(pageErrors.length)throw new Error('page errors: '+pageErrors.join(' | '));
 console.log('PASS v6.76: successful ON save survives immediate tick 546 without false toggle error');
 console.log('PASS v6.76: OFF save remains authoritative');
}finally{await browser.close()}
