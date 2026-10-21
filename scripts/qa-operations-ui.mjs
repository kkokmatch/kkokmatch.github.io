import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {chromium,webkit,devices} from 'playwright';
import {repeatPairs687} from '../edge-functions/_shared/repeat.mjs';
const base=process.env.QA_URL||'http://127.0.0.1:4198',server=process.env.QA_URL?null:spawn('python3',['-m','http.server','4198'],{stdio:'ignore'});
if(server)await new Promise(r=>setTimeout(r,500));
try{for(const [engine,name,opts] of [[chromium,'desktop',{viewport:{width:1280,height:900}}],...process.env.QA_CHROMIUM_ONLY?[]:[[webkit,'iphone',{...devices['iPhone 13']}]]]){
 const browser=await engine.launch({headless:true});try{
 const ctx=await browser.newContext({...opts,serviceWorkers:'block',timezoneId:'Asia/Seoul'});
 await ctx.addInitScript(()=>{localStorage.setItem('kokmatch_install_guide631_seen','1');sessionStorage.setItem('kokmatch_install_later630','1');localStorage.setItem('kokmatch_push_denied_notice629',String(Date.now()))});
 const now=Date.now(),identity={memberId:'a',displayName:'가회원',role:'manager',groupId:'qa',globalAdmin:false};
 let state={courtCount:2,courtNames:['1코트','2코트'],members:['a','b','c','d'].map((id,i)=>({id,name:['가회원','나회원','다회원','라회원'][i],type:'member',role:i?'member':'manager',state:'waiting',cls:'C',gender:'남',joinedAt:now-3600000})),queue:['a','b','c','d'],games:[],pendingGames:[],history:[1,2].map(i=>({id:'h'+i,players:['a','b'],endedAt:now-i*60000,startedAt:now-i*60000-600000})),pairCounts:{'a|b':2},autoGame:{enabled:true},attendancePolls:[]};
 let creates=0,sets=[],statsCalls=0,autoWarnings=false;
 const result=()=>({success:true,data:state,user:identity,group:{groupId:'qa',name:'검증 모임'},groups:[]});
 await ctx.route('https://wjelumpbjklfrdjxbesj.supabase.co/**',async route=>{const url=new URL(route.request().url());let b={};try{b=route.request().postDataJSON()||{}}catch{}let x=result();
 if(url.pathname.endsWith('kokmatch-auto-v656')){if(b.action==='set'){state.autoGame.enabled=b.enabled;sets.push(b.enabled)}x={...result(),config:state.autoGame};if(b.action==='tick'&&state.autoGame.enabled&&autoWarnings)x={...x,reason:'repeat_confirmation',players:['a','b','c','d'],revision:1,repeatPairs:repeatPairs687(state,['a','b','c','d'])};}
 if(url.pathname.endsWith('kokmatch-create-v641')){creates++;assert.equal(b.forceRepeat,true);state.pendingGames.push({id:'p1',players:b.players,createdAt:now});state.queue=[];state.members.forEach(m=>m.state='matched');x=result()}
 if(url.pathname.endsWith('kokmatch-stats-v54')){statsCalls++;x={success:true,groupId:'qa',today:new Date(now+4*3600000).toISOString().slice(0,10),from:url.searchParams.get('from'),to:url.searchParams.get('to'),month:url.searchParams.get('month'),members:state.members,rangeGames:[],monthGames:[],baselines:[]};}
 await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(x)});
 });
 const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('dialog',d=>d.accept());
 await page.goto(base+'/?qa=operations',{waitUntil:'networkidle'});
 await page.evaluate(({state,identity})=>{T='qa-token';localStorage.setItem(TOKEN_KEY,T);currentGroupId='qa';S=state;window.S=S;me=identity;group={groupId:'qa',name:'검증 모임'};normalizeClient();document.querySelector('#login').classList.add('hide');renderAll();goView('queue')},{state,identity});
 await page.locator('.autoGameQueue658 .autoToggle656').click();await page.waitForFunction(()=>S.autoGame.enabled===false);assert.equal(sets.at(-1),false);
 await page.evaluate(()=>{closeModal();draft=['a','b','c','d'];renderQueue()});
 await page.evaluate(()=>registerDraft());await page.locator('#modal.on').waitFor();assert.equal(creates,0);
 assert.match(await page.locator('#modalSheet').innerText(),/가회원.*나회원/s);
 await page.getByRole('button',{name:'다른 사람으로 변경',exact:true}).click();assert.equal(creates,0);assert.equal(await page.evaluate(()=>draft.filter(Boolean).length),4);
 await page.evaluate(()=>registerDraft());await page.getByRole('button',{name:'그대로 편성',exact:true}).click();await page.waitForFunction(()=>S.pendingGames.some(p=>p.id==='p1'));
 const warning=page.locator('.pendingCard .repeatWarning687');await warning.waitFor();assert.match(await warning.innerText(),/가회원.*나회원.*3게임/);
 assert.equal(await warning.evaluate(el=>getComputedStyle(el).color),'rgb(196, 91, 8)');
 await page.evaluate(()=>renderAll());await page.waitForTimeout(500);assert.equal(await warning.count(),1,'cleanup must preserve warning');assert.equal(creates,1);
 await page.evaluate(()=>goView('stats'));await page.waitForTimeout(600);assert.ok(statsCalls>0);assert.ok(!/통계 조회 중 오류|통계를 불러오지 못/.test(await page.locator('#stats').innerText()));
 autoWarnings=true;state.autoGame.enabled=true;
 await page.evaluate(()=>{goView('queue');S.autoGame.enabled=true;return window.__kokmatchRunAuto656(true)});
 await page.getByRole('button',{name:'다른 사람으로 변경',exact:true}).click();await page.waitForFunction(()=>!document.querySelector('#modal').classList.contains('on'));assert.equal(sets.at(-1),false);
 assert.deepEqual(errors,[]);fs.mkdirSync('qa-results',{recursive:true});await page.screenshot({path:`qa-results/operations-${name}.png`});console.log('PASS',name,'OFF, stats, repeat cancel/keep, persistent orange warning, auto alternative');
 }finally{await browser.close()}
}}finally{server?.kill()}
