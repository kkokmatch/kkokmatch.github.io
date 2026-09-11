import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';

const latest=JSON.parse(fs.readFileSync('latest-version.json','utf8'));
const VERSION=String(latest.semanticVersion||'').replace(/^v/,'');
const now=Date.now();
const month=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit'}).format(new Date());
const members=[
 {id:'mgr',name:'모임장',year:1988,age:'30',cls:'C',gender:'남',type:'member',role:'manager',state:'waiting',joinedAt:now-20*60000,totalGames:4,attendanceMonth:month,attendanceCount:4},
 {id:'m1',name:'회원1',year:1990,age:'30',cls:'D',gender:'남',type:'member',role:'member',state:'waiting',joinedAt:now-18*60000,totalGames:0,attendanceMonth:month,attendanceCount:3},
 {id:'m2',name:'회원2',year:1991,age:'30',cls:'D',gender:'여',type:'member',role:'member',state:'waiting',joinedAt:now-16*60000,totalGames:0,attendanceMonth:month,attendanceCount:2},
 {id:'m3',name:'회원3',year:1992,age:'30',cls:'E',gender:'남',type:'member',role:'member',state:'waiting',joinedAt:now-14*60000,totalGames:0,attendanceMonth:month,attendanceCount:1},
 {id:'m4',name:'회원4',year:1993,age:'30',cls:'E',gender:'여',type:'member',role:'member',state:'waiting',joinedAt:now-12*60000,totalGames:0,attendanceMonth:month,attendanceCount:0}
];
const history=[
 {id:'h1',players:['mgr','m1','m2','m3'],endedAt:now-25*60000,durationMin:15,waitMsByPlayer:{}},
 {id:'h2',players:['mgr','m1','m3','m4'],endedAt:now-8*60000,durationMin:14,waitMsByPlayer:{}}
];
const state={courtCount:3,courtNames:['1코트','2코트','3코트'],members,queue:members.map(x=>x.id),pendingGames:[],games:[],history,pairCounts:{},attendancePolls:[],autoGame:{enabled:true,mode:'priority_v673',updatedAt:now,updatedBy:{name:'모임장',role:'manager',roleLabel:'모임장'}}};
const stats={members:members.map(x=>({...x})),baselines:[],monthGames:history,rangeGames:history};
const clone=x=>JSON.parse(JSON.stringify(x));
let tickCount=0;

const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const page=await context.newPage();
const errors=[];page.on('pageerror',e=>errors.push(String(e?.stack||e)));
await page.addInitScript(()=>{try{localStorage.setItem('kokmatch_push_denied_notice629',String(Date.now()));localStorage.setItem('kokmatch_install_guide631_seen','1');sessionStorage.setItem('kokmatch_install_later630','1')}catch{}});
await page.route('https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/**',async route=>{
 const req=route.request(),url=new URL(req.url());let body={};try{body=JSON.parse(req.postData()||'{}')}catch{}
 if(url.pathname.endsWith('/kokmatch-stats-v54'))return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(clone(stats))});
 if(url.pathname.endsWith('/kokmatch-auto-v656')){
  if(body.action==='tick'){
   tickCount++;
   if(state.pendingGames.length===0&&state.queue.length>=4){
    const players=state.queue.slice(0,4);
    state.pendingGames=[{id:'pauto678',players,createdAt:Date.now(),createdByMode:'auto',createdByName:'AI 자동편성'}];
    state.queue=state.queue.filter(id=>!players.includes(id));
    state.members.forEach(m=>{if(players.includes(m.id))m.state='matched'});
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,created:true,players,data:clone(state),config:clone(state.autoGame)})});
   }
  }
  if(body.action==='set')state.autoGame={...state.autoGame,enabled:body.enabled===true};
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,created:false,data:clone(state),config:clone(state.autoGame)})});
 }
 if(url.pathname.endsWith('/kokmatch-state-v46'))return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({data:clone(state),group:{groupId:'qa',name:'QA'},user:{memberId:'mgr',displayName:'모임장',role:'manager',globalAdmin:false,tempOrganizer:false,groupId:'qa'},memberCount:state.members.length})});
 if(url.pathname.includes('profile'))return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,profiles:{}})});
 return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,data:clone(state),group:{groupId:'qa',name:'QA'},user:{memberId:'mgr',displayName:'모임장',role:'manager',globalAdmin:false,tempOrganizer:false,groupId:'qa'},groups:[]})});
});

try{
 await page.goto('http://127.0.0.1:4173/?qa=v678',{waitUntil:'networkidle'});
 await page.waitForFunction(v=>window.__kokmatchVersionLock===v&&window.__kokmatchUiStability678===v,VERSION,{timeout:15000});
 await page.evaluate(s=>{T='qa-token';localStorage.setItem('kokmatch_token',T);currentGroupId='qa';S=JSON.parse(JSON.stringify(s));window.S=S;me={memberId:'mgr',displayName:'모임장',role:'manager',globalAdmin:false,tempOrganizer:false,groupId:'qa'};group={groupId:'qa',name:'QA'};groups=[];normalizeClient();currentView='members';renderAll();document.getElementById('login')?.classList.add('hide');goView('members')},clone(state));
 await page.waitForSelector('#members .memberCard[data-member-id22="mgr"]');
 await page.waitForTimeout(450);
 const phoneGap=await page.locator('#members .memberCard[data-member-id22="mgr"]').evaluate(card=>{const avatar=card.firstElementChild,info=card.querySelector('.memberInfo48');if(!avatar||!info)return -1;const a=avatar.getBoundingClientRect(),i=info.getBoundingClientRect();return i.left-a.right});
 assert(phoneGap>=14,`phone profile/name gap too tight: ${phoneGap}px`);

 // Preserve v6.77 no-flash guarantee while live operational state changes.
 await page.evaluate(()=>{const c=document.querySelector('#members .memberCard[data-member-id22="mgr"]');window.__card678=c;window.__avatar678=c?.firstElementChild});
 await page.evaluate(()=>{S.queue=S.queue.slice().reverse();S.history=[...S.history,{id:'hx',players:['m1'],endedAt:Date.now()}];renderAll()});
 assert(await page.evaluate(()=>document.querySelector('#members .memberCard[data-member-id22="mgr"]')===window.__card678),'member card rebuilt on operational-only state change');
 assert(await page.evaluate(()=>document.querySelector('#members .memberCard[data-member-id22="mgr"]')?.firstElementChild===window.__avatar678),'member avatar rebuilt on operational-only state change');
 await page.evaluate(()=>{const m=S.members.find(x=>x.id==='mgr');m.state='spectator';m.totalGames=5;renderAll()});
 assert(await page.evaluate(()=>document.querySelector('#members .memberCard[data-member-id22="mgr"]')===window.__card678),'member card rebuilt on live member-state patch');

 // Restore clean fixture before stats/queue checks.
 await page.evaluate(s=>{S=JSON.parse(JSON.stringify(s));window.S=S;normalizeClient();renderAll()},clone(state));
 await page.evaluate(()=>{currentView='stats';renderAll();goView('stats');renderStats();window.__kokmatchRenderOpsDashboard652?.()});
 await page.waitForSelector('#opsPersistentHost678 #opsDashboard652');
 await page.waitForSelector('#stats .statsMonthlyTable628 tbody tr[data-member-id628]');
 await page.waitForTimeout(120);
 assert.equal(await page.locator('#opsPersistentHost678 .opsPanels652').count(),0,'priority panels still visible');
 assert.equal(await page.locator('#opsPersistentHost678 .opsCourtPanel652').count(),0,'court panel still visible');
 await page.evaluate(()=>{window.__ops678=document.getElementById('opsDashboard652');renderStats();window.__kokmatchRenderOpsDashboard652?.();renderStats();});
 await page.waitForTimeout(60);
 assert(await page.evaluate(()=>document.getElementById('opsDashboard652')===window.__ops678),'live operations node was replaced/disappeared');
 assert.equal(await page.locator('#opsPersistentHost678').evaluate(el=>el.hidden),false,'live operations host hidden on stats');
 await page.evaluate(()=>goView('queue'));assert.equal(await page.locator('#opsPersistentHost678').evaluate(el=>el.hidden),true,'live operations leaked outside stats');
 await page.evaluate(()=>goView('stats'));assert.equal(await page.locator('#opsPersistentHost678').evaluate(el=>el.hidden),false,'live operations did not return immediately');

 const visibleNo=await page.locator('#stats .statsNoHead675,#stats td.statsNo675').evaluateAll(els=>els.filter(el=>getComputedStyle(el).display!=='none').length);
 assert.equal(visibleNo,0,'legacy number column is still visible');
 const ranks=await page.locator('#stats .statsMonthlyTable628 tbody tr:not(:has(.statsEmpty628)) td:first-child .statsRank678').allTextContents();
 assert.deepEqual(ranks.slice(0,3),['1','2','3'],'rank circles are not 1/2/3 inside name cells');
 const rankStyle=await page.locator('#stats .statsRank678').first().evaluate(el=>({w:getComputedStyle(el).width,h:getComputedStyle(el).height,r:getComputedStyle(el).borderRadius}));
 assert.equal(rankStyle.w,rankStyle.h,'rank marker is not circular');assert.notEqual(rankStyle.r,'0px','rank marker lost circle radius');

 await page.evaluate(()=>goView('queue'));
 await page.waitForSelector('#queue .queueCard .queueWaitMeta678');
 const meta=page.locator('#queue .queueCard').first().locator('.queueWaitMeta678');
 const pill=await meta.evaluate(el=>({content:getComputedStyle(el,'::after').content,bg:getComputedStyle(el,'::after').backgroundColor,r:getComputedStyle(el,'::after').borderRadius}));
 assert(pill.content.includes('게임 2회'),`green badge content wrong: ${pill.content}`);assert.notEqual(pill.bg,'rgba(0, 0, 0, 0)');assert.notEqual(pill.r,'0px');
 await meta.evaluate(el=>{el.innerHTML='<span class="waitCurrent70">현재 20분 대기중</span><span class="waitSep70"> · </span><span class="waitTotal70">오늘 총 88분 대기</span><span class="legacyGreyGame">게임 2회</span>'});
 const immediatePill=await meta.evaluate(el=>getComputedStyle(el,'::after').content);
 assert(immediatePill.includes('게임 2회'),'green game badge disappeared during legacy rewrite');
 await page.waitForTimeout(60);
 const cleaned=(await meta.innerText()).replace(/\s+/g,' ').trim();
 assert(!cleaned.includes('오늘 총'),'legacy total-wait grey text survived');assert(!cleaned.includes('게임 2회'),'grey game-count text survived beside green badge');
 assert.equal(await meta.locator(':scope > .waitCurrent678').count(),1,'canonical wait row was not restored');

 // Preserve automatic/manual conflict popup while automatic matching keeps running.
 await page.locator('#queue .queueCard').first().click();
 await page.waitForSelector('#autoManualKeep673');
 await page.evaluate(()=>window.__kokmatchRunAuto656(true));
 await page.waitForFunction(()=>S?.pendingGames?.length===1,{timeout:5000});
 assert(tickCount>=1,'automatic matching did not continue while popup was open');
 assert(await page.locator('#modal').evaluate(el=>el.classList.contains('on')),'manual conflict popup closed during auto tick');
 assert.equal(await page.locator('#autoManualKeep673').count(),1,'keep-auto button disappeared');
 assert.equal(await page.locator('#autoManualDisable673').count(),1,'disable-auto button disappeared');

 if(errors.length)throw new Error('page errors: '+errors.join(' | '));
 console.log(`PASS v6.78 phone roster profile/name gap ${phoneGap.toFixed(1)}px`);
 console.log('PASS v6.78 no-flash member roster retained');
 console.log('PASS v6.78 persistent live operations without priority/court panels');
 console.log('PASS v6.78 permanent green queue game-count pill survives legacy rewrites');
 console.log('PASS v6.78 monthly rank circles sit left inside name cells with no visible number column');
 console.log('PASS v6.78 automatic matching continues while manual conflict popup stays open');
}finally{await browser.close()}
