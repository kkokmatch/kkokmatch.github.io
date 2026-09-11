import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const latest=JSON.parse(fs.readFileSync('latest-version.json','utf8'));
const VERSION=String(latest.semanticVersion||'').replace(/^v/,'');
const roles=[
 ['developer',{memberId:'dev',displayName:'박태영',role:'admin',globalAdmin:true,tempOrganizer:false,groupId:'qa'}],
 ['manager',{memberId:'mgr',displayName:'모임장',role:'manager',globalAdmin:false,tempOrganizer:false,groupId:'qa'}],
 ['organizer',{memberId:'org',displayName:'운영진',role:'organizer',globalAdmin:false,tempOrganizer:false,groupId:'qa'}]
];
const now=Date.now();
function makeState(){return {courtCount:4,courtNames:['1코트','2코트','3코트','4코트'],autoGame:{enabled:true,mode:'priority_v673',updatedAt:now,updatedBy:{name:'모임장',role:'manager',roleLabel:'모임장'}},members:[
{id:'dev',name:'박태영',year:1989,age:'30',cls:'B',gender:'남',type:'member',role:'admin',state:'waiting',joinedAt:now-1800000},
{id:'mgr',name:'모임장',year:1988,age:'30',cls:'C',gender:'남',type:'member',role:'manager',state:'waiting',joinedAt:now-1700000},
{id:'org',name:'운영진',year:1990,age:'30',cls:'C',gender:'여',type:'member',role:'organizer',state:'waiting',joinedAt:now-1600000},
{id:'m1',name:'회원1',year:1991,age:'30',cls:'D',gender:'남',type:'member',role:'member',state:'waiting',joinedAt:now-1500000},
{id:'m2',name:'회원2',year:1992,age:'30',cls:'D',gender:'여',type:'member',role:'member',state:'waiting',joinedAt:now-1400000}],queue:['dev','mgr','org','m1','m2'],pendingGames:[],games:[],history:[],pairCounts:{},attendancePolls:[]}}
const clone=x=>JSON.parse(JSON.stringify(x));
const browser=await chromium.launch({headless:true});
for(const [roleKey,identity] of roles){
 const state=makeState(),context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const page=await context.newPage();
 await page.addInitScript(()=>{try{localStorage.setItem('kokmatch_push_denied_notice629',String(Date.now()));localStorage.setItem('kokmatch_install_guide631_seen','1');sessionStorage.setItem('kokmatch_install_later630','1')}catch{}});
 await page.route('https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/**',async route=>{
   const req=route.request(),url=new URL(req.url());let body={};try{body=JSON.parse(req.postData()||'{}')}catch{}
   if(url.pathname.endsWith('/kokmatch-auto-v656')){
     if(body.action==='set')state.autoGame={...state.autoGame,enabled:body.enabled===true,updatedAt:Date.now(),updatedBy:{name:identity.displayName,role:identity.role,roleLabel:roleKey}};
     return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,created:false,config:clone(state.autoGame),data:clone(state)})});
   }
   if(url.pathname.endsWith('/kokmatch-state-v46'))return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({data:clone(state),group:{groupId:'qa',name:'QA'},user:identity,memberCount:state.members.length})});
   return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,data:clone(state),group:{groupId:'qa',name:'QA'},user:identity,groups:[]})});
 });
 await page.goto('http://127.0.0.1:4173/?qa=auto673',{waitUntil:'networkidle'});
 await page.waitForFunction(v=>window.__kokmatchVersionLock===v&&window.__kokmatchAutoManualGuard673===v,VERSION,{timeout:15000});
 await page.evaluate(({state,identity})=>{T='qa-token';localStorage.setItem('kokmatch_token',T);currentGroupId='qa';S=JSON.parse(JSON.stringify(state));window.S=S;me=identity;group={groupId:'qa',name:'QA'};groups=[];normalizeClient();currentView='queue';renderAll();document.getElementById('login')?.classList.add('hide');goView('queue')},{state:clone(state),identity});
 await page.waitForTimeout(120);
 // Rules text must match the requested order and gender equivalence.
 await page.locator('.autoGameQueue658 .autoSettingsBtn656').click();
 const rules=(await page.locator('#modalSheet').innerText()).replace(/\s+/g,' ');
 for(const t of ['① 대기시간 최우선','② 당일 게임수','③ 오늘 파트너 우선','④ 급수·남녀 밸런스','여자 C조를 남자 D조','⑤ 반복조합 최소화','3회 이상'])assert(rules.includes(t),`${roleKey} missing rule ${t}`);
 await page.locator('#modalSheet button',{hasText:'닫기'}).click();
 // First manual attempt must be blocked while auto remains on.
 const first=page.locator('#queue .queueCard').first();await first.click();
 await page.waitForSelector('#autoManualKeep673');
 assert.equal(await page.evaluate(()=>draft.filter(Boolean).length),0,`${roleKey} draft changed before conflict choice`);
 await page.locator('#autoManualKeep673').click();
 await page.waitForTimeout(80);
 assert.equal(await page.evaluate(()=>S.autoGame.enabled),true,`${roleKey} keep did not preserve auto`);
 assert.equal(await page.evaluate(()=>draft.filter(Boolean).length),0,`${roleKey} keep unexpectedly resumed manual action`);
 // Second attempt: turn auto off and replay the exact manual click.
 await first.click();await page.waitForSelector('#autoManualDisable673');await page.locator('#autoManualDisable673').click();
 await page.waitForFunction(()=>S?.autoGame?.enabled===false&&draft.filter(Boolean).length===1,{timeout:5000});
 assert.equal(await page.evaluate(()=>S.autoGame.enabled),false,`${roleKey} auto did not turn off`);
 assert.equal(await page.evaluate(()=>draft.filter(Boolean).length),1,`${roleKey} manual action was not resumed after disabling auto`);
 await context.close();
}
await browser.close();
console.log('PASS v6.73 automatic/manual conflict UI for developer, manager, organizer');
