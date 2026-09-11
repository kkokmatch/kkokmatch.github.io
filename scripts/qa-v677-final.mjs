import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';
const latest=JSON.parse(fs.readFileSync('latest-version.json','utf8'));const VERSION=String(latest.semanticVersion||'').replace(/^v/,'');
const now=Date.now();
const ms=[
{id:'mgr',name:'모임장',year:1988,age:'30',cls:'C',gender:'남',type:'member',role:'manager',state:'waiting',joinedAt:now-20*60000,totalGames:4},
{id:'m1',name:'회원1',year:1990,age:'30',cls:'D',gender:'남',type:'member',role:'member',state:'waiting',joinedAt:now-18*60000,totalGames:0},
{id:'m2',name:'회원2',year:1991,age:'30',cls:'D',gender:'여',type:'member',role:'member',state:'waiting',joinedAt:now-16*60000,totalGames:0},
{id:'m3',name:'회원3',year:1992,age:'30',cls:'E',gender:'남',type:'member',role:'member',state:'waiting',joinedAt:now-14*60000,totalGames:0},
{id:'m4',name:'회원4',year:1993,age:'30',cls:'E',gender:'여',type:'member',role:'member',state:'waiting',joinedAt:now-12*60000,totalGames:0}
];
const state={courtCount:3,courtNames:['1코트','2코트','3코트'],members:ms,queue:ms.map(x=>x.id),pendingGames:[],games:[],history:[],pairCounts:{},attendancePolls:[],autoGame:{enabled:true,mode:'priority_v673',updatedAt:now,updatedBy:{name:'모임장',role:'manager',roleLabel:'모임장'}}};
const clone=x=>JSON.parse(JSON.stringify(x));let tickCount=0;
const browser=await chromium.launch({headless:true});const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const page=await context.newPage();const errs=[];page.on('pageerror',e=>errs.push(String(e?.stack||e)));
await page.addInitScript(()=>{try{localStorage.setItem('kokmatch_push_denied_notice629',String(Date.now()));localStorage.setItem('kokmatch_install_guide631_seen','1');sessionStorage.setItem('kokmatch_install_later630','1')}catch{}});
await page.route('https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/**',async route=>{const req=route.request(),url=new URL(req.url());let body={};try{body=JSON.parse(req.postData()||'{}')}catch{}
 if(url.pathname.endsWith('/kokmatch-auto-v656')){if(body.action==='tick'){tickCount++;if(state.pendingGames.length===0&&state.queue.length>=4){const players=state.queue.slice(0,4);state.pendingGames=[{id:'pauto',players,createdAt:Date.now(),createdByMode:'auto'}];state.queue=state.queue.filter(id=>!players.includes(id));state.members.forEach(m=>{if(players.includes(m.id))m.state='matched'});return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,created:true,players,data:clone(state),config:clone(state.autoGame)})});}}if(body.action==='set')state.autoGame={...state.autoGame,enabled:body.enabled===true};return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,created:false,data:clone(state),config:clone(state.autoGame)})});}
 if(url.pathname.endsWith('/kokmatch-state-v46'))return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({data:clone(state),group:{groupId:'qa',name:'QA'},user:{memberId:'mgr',displayName:'모임장',role:'manager',globalAdmin:false,tempOrganizer:false,groupId:'qa'},memberCount:state.members.length})});
 if(url.pathname.includes('profile'))return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,profiles:{}})});
 return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,data:clone(state),group:{groupId:'qa',name:'QA'},user:{memberId:'mgr',displayName:'모임장',role:'manager',globalAdmin:false,tempOrganizer:false,groupId:'qa'},groups:[]})});});
try{
 await page.goto('http://127.0.0.1:4173/?qa=v677-final',{waitUntil:'networkidle'});await page.waitForFunction(v=>window.__kokmatchVersionLock===v&&window.__kokmatchUiStability677===v,VERSION,{timeout:15000});
 await page.evaluate(s=>{T='qa-token';currentGroupId='qa';S=JSON.parse(JSON.stringify(s));window.S=S;me={memberId:'mgr',displayName:'모임장',role:'manager',globalAdmin:false,tempOrganizer:false,groupId:'qa'};group={groupId:'qa',name:'QA'};groups=[];normalizeClient();currentView='members';renderAll();document.getElementById('login')?.classList.add('hide');goView('members')},clone(state));
 await page.waitForSelector('#members .memberCard[data-member-id22="mgr"]');await page.waitForTimeout(450);
 await page.evaluate(()=>{const c=document.querySelector('#members .memberCard[data-member-id22="mgr"]');window.__c677=c;window.__a677=c?.firstElementChild});
 await page.evaluate(()=>{S.queue=S.queue.slice().reverse();S.history=[{id:'h',players:['m1'],endedAt:Date.now()}];renderAll()});
 assert(await page.evaluate(()=>document.querySelector('#members .memberCard[data-member-id22="mgr"]')===window.__c677),'member card rebuilt on operational poll');assert(await page.evaluate(()=>document.querySelector('#members .memberCard[data-member-id22="mgr"]')?.firstElementChild===window.__a677),'member avatar cell rebuilt on operational poll');
 await page.evaluate(()=>{const m=S.members.find(x=>x.id==='mgr');m.state='spectator';m.totalGames=5;renderAll()});assert(await page.evaluate(()=>document.querySelector('#members .memberCard[data-member-id22="mgr"]')===window.__c677),'member card rebuilt on live state patch');
 await page.evaluate(s=>{S=JSON.parse(JSON.stringify(s));window.S=S;normalizeClient();currentView='queue';renderAll();goView('queue')},clone(state));await page.waitForSelector('#queue .queueCard');
 const meta=page.locator('#queue .queueCard').first().locator('.queueWaitMeta677');await meta.waitFor();const txt=(await meta.innerText()).replace(/\s+/g,' ').trim();assert(txt.includes('대기중'),'wait text missing');assert(!txt.includes('오늘 총'),'duplicate total wait still shown');const badge=meta.locator('.queueGameCount677');assert.equal(await badge.count(),1);assert.equal((await badge.innerText()).trim(),'게임 0회');const st=await badge.evaluate(el=>({d:getComputedStyle(el).display,b:getComputedStyle(el).backgroundColor,r:getComputedStyle(el).borderRadius}));assert.notEqual(st.d,'none');assert.notEqual(st.b,'rgba(0, 0, 0, 0)');assert.notEqual(st.r,'0px');
 await page.locator('#queue .queueCard').first().click();await page.waitForSelector('#autoManualKeep673');await page.evaluate(()=>window.__kokmatchRunAuto656(true));await page.waitForFunction(()=>S?.pendingGames?.length===1,{timeout:5000});assert(tickCount>=1);assert(await page.locator('#modal').evaluate(el=>el.classList.contains('on')),'manual conflict popup closed during auto tick');assert.equal(await page.locator('#autoManualKeep673').count(),1);assert.equal(await page.locator('#autoManualDisable673').count(),1);
 if(errs.length)throw new Error(errs.join(' | '));console.log('PASS v6.77 no-flash roster, green queue game badge, persistent conflict popup while auto continues');
}finally{await browser.close()}
