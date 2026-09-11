import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const latest=JSON.parse(fs.readFileSync('latest-version.json','utf8'));
const VERSION=String(latest.semanticVersion||'').replace(/^v/,'');
const fmt=d=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
const today=fmt(new Date()), yesterday=fmt(new Date(Date.now()-86400000)), month=today.slice(0,7), now=Date.now();
const state={courtCount:3,courtNames:['1코트','2코트','3코트'],autoGame:{enabled:false,mode:'priority_v673',updatedAt:now,updatedBy:{}},members:[
 {id:'mgr',name:'모임장',year:1985,gender:'남',age:'40',cls:'B',type:'member',role:'manager',state:'waiting',joinedAt:now-2400000,attendanceMonth:month,attendanceCount:3,attendanceHistory:{[month]:3}},
 {id:'m1',name:'김회원',year:1990,gender:'남',age:'30',cls:'C',type:'member',role:'member',state:'waiting',joinedAt:now-2100000,attendanceMonth:month,attendanceCount:2,attendanceHistory:{[month]:2}},
 {id:'m2',name:'박회원',year:1992,gender:'여',age:'30',cls:'C',type:'member',role:'member',state:'waiting',joinedAt:now-1800000,attendanceMonth:month,attendanceCount:1,attendanceHistory:{[month]:1}},
 {id:'m3',name:'이회원',year:1994,gender:'남',age:'30',cls:'D',type:'member',role:'member',state:'waiting',joinedAt:now-1500000,attendanceMonth:month,attendanceCount:0,attendanceHistory:{[month]:0}}
],queue:['mgr','m1','m2','m3'],pendingGames:[],games:[],history:[],pairCounts:{},attendancePolls:[]};
const clone=x=>JSON.parse(JSON.stringify(x));
const games=[{gameId:'g1',businessDay:today,startedAt:now-3600000,endedAt:now-1800000,matchedAt:now-3900000,durationMin:30,court:1,courtName:'1코트',players:['mgr','m1'],playerNames:['모임장','김회원'],waitMsByPlayer:{mgr:600000,m1:900000},autoEnded:false},{gameId:'g0',businessDay:yesterday,startedAt:now-90000000,endedAt:now-88200000,matchedAt:now-90600000,durationMin:30,court:1,courtName:'1코트',players:['m2','m3'],playerNames:['박회원','이회원'],waitMsByPlayer:{m2:300000,m3:300000},autoEnded:false}];
let autoCalls=[];
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e?.stack||e)));
await page.addInitScript(()=>{try{localStorage.setItem('kokmatch_push_denied_notice629',String(Date.now()));localStorage.setItem('kokmatch_install_guide631_seen','1');sessionStorage.setItem('kokmatch_install_later630','1')}catch{}});
await page.route('https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/**',async route=>{const req=route.request(),url=new URL(req.url());let body={};try{body=JSON.parse(req.postData()||'{}')}catch{}
 if(url.pathname.endsWith('/kokmatch-auto-v656')){autoCalls.push(body.action);if(body.action==='set')state.autoGame={...state.autoGame,enabled:body.enabled===true,updatedAt:Date.now(),updatedBy:{name:'모임장',role:'manager',roleLabel:'모임장'}};if(body.action==='tick'&&state.autoGame.enabled&&state.queue.length>=4&&state.pendingGames.length===0){const players=state.queue.slice(0,4);state.pendingGames=[{id:'p-auto',players,createdAt:Date.now(),createdByMode:'auto',createdByName:'AI 자동편성'}];state.queue=state.queue.filter(x=>!players.includes(x));state.members.forEach(m=>{if(players.includes(m.id))m.state='matched'});return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,created:true,players,data:clone(state),config:clone(state.autoGame)})});}return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,created:false,config:clone(state.autoGame),data:clone(state)})});}
 if(url.pathname.endsWith('/kokmatch-stats-v54')){const from=url.searchParams.get('from')||today,to=url.searchParams.get('to')||from,mon=url.searchParams.get('month')||month;return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,groupId:'qa',today,from,to,month:mon,selfMemberId:'mgr',members:clone(state).members,rangeGames:games.filter(g=>g.businessDay>=from&&g.businessDay<=to),monthGames:mon===month?games:[],baselines:[]})});}
 if(url.pathname.endsWith('/kokmatch-state-v46'))return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({data:clone(state),group:{groupId:'qa',name:'QA'},user:{memberId:'mgr',displayName:'모임장',role:'manager',globalAdmin:false,tempOrganizer:false,groupId:'qa'},memberCount:state.members.length})});
 if(url.pathname.includes('profile'))return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,profiles:{}})});
 return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,data:clone(state),group:{groupId:'qa',name:'QA'},user:{memberId:'mgr',displayName:'모임장',role:'manager',globalAdmin:false,tempOrganizer:false,groupId:'qa'},groups:[]})});
});
try{
 await page.goto('http://127.0.0.1:4173/?qa=v675',{waitUntil:'networkidle'});
 await page.waitForFunction(v=>window.__kokmatchVersionLock===v&&window.__kokmatchFix675===v,VERSION,{timeout:15000});
 await page.evaluate(s=>{T='qa-token';localStorage.setItem('kokmatch_token',T);currentGroupId='qa';S=JSON.parse(JSON.stringify(s));window.S=S;me={memberId:'mgr',displayName:'모임장',role:'manager',globalAdmin:false,tempOrganizer:false,groupId:'qa'};group={groupId:'qa',name:'QA 모임'};groups=[];normalizeClient();currentView='queue';renderAll();document.getElementById('login')?.classList.add('hide');goView('queue')},clone(state));
 await page.waitForSelector('.autoGameQueue658 .autoSettingsBtn656');
 await page.locator('.autoGameQueue658 .autoSettingsBtn656').click();await page.waitForSelector('#modal.on');assert((await page.locator('#modalSheet').innerText()).includes('자동게임설정'),'settings modal did not open');await page.locator('#modalSheet button',{hasText:'닫기'}).click();
 await page.locator('.autoGameQueue658 .autoToggle656').click();await page.waitForFunction(()=>S?.autoGame?.enabled===true&&S?.pendingGames?.length===1,{timeout:7000});assert(autoCalls.includes('get')&&autoCalls.includes('set')&&autoCalls.includes('tick'),'verified auto path did not call get/set/tick');
 await page.evaluate(()=>{currentView='stats';renderStats();goView('stats')});
 await page.waitForSelector('#stats #opsDashboard652');await page.waitForSelector('.statsMonthlyTable628 .statsNoHead675');await page.waitForFunction(()=>document.querySelectorAll('.statsMonthlyTable628 tbody tr').length>=4);
 const heads=(await page.locator('.statsMonthlyTable628 thead tr').innerText()).replace(/\s+/g,' ').trim();assert(heads.startsWith('이름 번호'),`header order wrong: ${heads}`);
 const nums=await page.locator('.statsMonthlyTable628 tbody tr .statsNo675').allTextContents();assert.deepEqual(nums.slice(0,4),['1','2','3','4'],'monthly sequence numbers wrong');
 const aligned=await page.evaluate(()=>{const th=document.querySelector('.statsMonthlyTable628 thead th:first-child'),td=document.querySelector('.statsMonthlyTable628 tbody td.statsName675');const a=th?.getBoundingClientRect(),b=td?.getBoundingClientRect();return{align:getComputedStyle(td).textAlign,delta:a&&b?Math.abs((a.left+a.right)/2-(b.left+b.right)/2):99}});assert.equal(aligned.align,'center','name cell not centered');assert(aligned.delta<2,`name not under name header: ${JSON.stringify(aligned)}`);
 await page.evaluate(()=>window.__liveRef675=document.getElementById('opsDashboard652'));
 await page.evaluate(d=>changeStatsDate628(d),yesterday);await page.waitForFunction(d=>document.querySelector('.statsDateTitle628')?.dataset.date===d,yesterday,{timeout:5000});await page.waitForTimeout(250);
 assert(await page.evaluate(()=>document.getElementById('opsDashboard652')===window.__liveRef675),'today live dashboard node was removed/recreated during stats refresh');
 assert(await page.locator('#stats #opsDashboard652').isVisible(),'today live dashboard disappeared');
 if(errors.length)throw new Error('page errors: '+errors.join(' | '));
 console.log('PASS v6.75 auto settings open + server-synced toggle/tick UI path');
 console.log('PASS monthly member record name alignment + right-side 1,2,3 numbering');
 console.log('PASS today live dashboard persists through async stats refresh');
}finally{await browser.close()}
