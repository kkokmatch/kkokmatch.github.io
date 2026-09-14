import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {chromium,webkit} from 'playwright';
const version=JSON.parse(fs.readFileSync('latest-version.json','utf8')).semanticVersion;
const js=fs.readFileSync(`app-v${version}.js`,'utf8');
const source=js.slice(js.indexOf('function etaTime680('),js.indexOf('function pendingEtaHtml680('));
const sandbox=vm.createContext({gradeV:{A:5,B:4,C:3,D:2,E:1},Intl,Date,Map,Set});
vm.runInContext(source,sandbox);
const now=Date.parse('2026-09-14T19:00:00+09:00'),minute=60000;
const members=Array.from({length:24},(_,i)=>({id:'m'+i,name:'테스트회원'+i,cls:i<12?'A':i%2?'D':'C',year:1990,age:'30',gender:i%2?'여':'남',role:i===0?'manager':'member',type:'member',state:'matched',joinedAt:now-20*minute}));
const groups=Array.from({length:4},(_,i)=>({id:'p'+i,players:members.slice(i*4,i*4+4).map(m=>m.id),createdAt:now-10*minute}));
const state={courtCount:2,courtNames:['1코트','2코트'],members,queue:[],pendingGames:groups,games:[{id:'g1',court:1,players:groups[0].players,startedAt:now-10*minute},{id:'g2',court:2,players:groups[1].players,startedAt:now-5*minute}],history:[],pairCounts:{},autoGame:{enabled:false}};
const clone=x=>JSON.parse(JSON.stringify(x));
const eta=(s,t=now)=>sandbox.pendingEtas680(s,t);
const original=JSON.stringify(state);
assert.deepEqual([...eta(state).values()].map(e=>e.minutes),[7.5,12.5,25,30]);
assert.equal(JSON.stringify(state),original,'prediction mutates state');
assert.equal(sandbox.etaModel680(state,now).estimate(groups[3].players).minutes,12.5);
assert.equal(sandbox.etaModel680(state,now).estimate(['missing','m1','m2','m3']).minutes,15);
let s=clone(state);s.pendingGames.unshift({id:'partial',players:['m20']});assert.equal(eta(s).get('partial'),undefined);assert.equal(eta(s).get('p0').minutes,7.5);
s.games=[];assert.deepEqual([...eta(s).values()].map(e=>e.minutes),[0,0,17.5,17.5]);
s=clone(state);s.games.shift();assert.equal(eta(s).get('p0').minutes,0);assert.equal(eta(s).get('p1').minutes,12.5);
assert.equal(eta(state,now+2*minute).get('p0').minutes,5.5);
s=clone(state);s.games.forEach(g=>g.startedAt=now-45*minute);assert.equal(eta(s).get('p0').minutes,1);
s.courtCount=0;assert.equal(eta(s).get('p0').minutes,null);
s=clone(state);s.history=Array.from({length:8},(_,i)=>({id:'h'+i,players:groups[0].players,startedAt:now-(80-i*3)*minute,endedAt:now-(60-i*3)*minute}));
assert.equal(sandbox.etaModel680(s,now).estimate(groups[3].players).minutes,20,'sufficient measurements must outweigh heuristic');
s.history=[{id:'duration-only',endedAt:now-minute,durationMin:14}];assert.equal(sandbox.etaModel680(s,now).estimate(groups[0].players).samples,1);
s.history.push({id:'old',endedAt:now-24*60*minute,durationMin:20},{id:'future',endedAt:now+minute,durationMin:20},{id:'auto',endedAt:now-minute,durationMin:30},{id:'flagged-auto',endedAt:now-minute,durationMin:20,autoEnded:true},{id:'bad',endedAt:now-minute,startedAt:now});
assert.equal(sandbox.etaModel680(s,now).estimate(groups[0].players).samples,1);
s.history.push(s.history[0]);assert.equal(sandbox.etaModel680(s,now).estimate(groups[0].players).samples,1);
assert.equal(sandbox.etaDay680(Date.parse('2026-09-15T04:59:00+09:00')),'2026-09-14');
assert.equal(sandbox.etaDay680(Date.parse('2026-09-15T05:00:00+09:00')),'2026-09-15');
s=clone(state);s.history=Array.from({length:16},(_,i)=>({id:'h'+i,endedAt:now-(16-i)*minute,durationMin:i<8?12:20}));
const trend=sandbox.etaModel680(s,now).estimate(groups[0].players).minutes;assert(trend>16&&trend<20,'recent matches should shift the daily mean');
console.log('PASS ETA parallel courts, order, incomplete groups, fallback, learning, duration-only history, invalid records, reset, overrun and clock');

fs.mkdirSync('qa-artifacts',{recursive:true});
for(const [engine,width] of [[chromium,1280],[chromium,390],[webkit,390],[webkit,375]]){
 if(process.env.QA_ENGINE&&process.env.QA_ENGINE!==`${engine.name()}-${width}`)continue;
 const browser=await engine.launch({headless:true});
 try{
 const context=await browser.newContext({serviceWorkers:'block',viewport:{width,height:844},...(width<500?{isMobile:true,hasTouch:true}:{})});
 const page=await context.newPage(),errors=[],assets=[],failedRequests=[];
 page.on('requestfailed',r=>failedRequests.push({url:r.url(),method:r.method(),failure:r.failure()}));
 let fixture=clone(state),begun=0,finished=0;
 page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>{if(/\/app-v.*\.(js|css)/.test(r.url()))assets.push(r.url())});
 await page.addInitScript(()=>{localStorage.setItem('kokmatch_push_denied_notice629',String(Date.now()));localStorage.setItem('kokmatch_install_guide631_seen','1');sessionStorage.setItem('kokmatch_install_later630','1')});
 await page.route('https://**/*',route=>{
  const headers={'access-control-allow-origin':'*','access-control-allow-methods':'GET, POST, OPTIONS','access-control-allow-headers':'authorization, content-type'};
  if(route.request().method()==='OPTIONS')return route.fulfill({status:204,headers,body:''});
  let body={};try{body=JSON.parse(route.request().postData()||'{}')}catch{}
  if(body.action==='finish_game'){
   const game=fixture.games.find(g=>g.id===body.gameId);assert(game);
   fixture.games=fixture.games.filter(g=>g!==game);fixture.history.push({...game,endedAt:now,durationMin:(now-game.startedAt)/minute});finished++;
  }
  if(body.action==='begin_game'){
   const pending=fixture.pendingGames.find(g=>g.id===body.pendingId);assert(pending);assert(!fixture.games.some(g=>g.court===body.court));
   fixture.pendingGames=fixture.pendingGames.filter(g=>g!==pending);fixture.games.push({id:'new-game',court:body.court,players:pending.players,startedAt:now});begun++;
  }
  return route.fulfill({status:200,headers,contentType:'application/json',body:JSON.stringify({success:true,data:clone(fixture),group:{groupId:'eta-qa',name:'예상 시작 QA'},user:{memberId:'m0',displayName:'테스트회원0',role:'manager',globalAdmin:false,groupId:'eta-qa'},groups:[]})});
 });
 await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});
 await page.waitForSelector('#login');
 await page.evaluate(({s,t})=>{
  // Isolated fixture: no live API calls, token, or operational writes.
  const realNow=Date.now;window.__etaRealNow=realNow;Date.now=()=>t;
  S=s;window.S=S;me={memberId:'m0',displayName:'테스트회원0',role:'manager',globalAdmin:false,groupId:'eta-qa'};
  group={groupId:'eta-qa',name:'예상 시작 QA'};currentGroupId='eta-qa';T='eta-qa-token';localStorage.setItem(TOKEN_KEY,T);localStorage.setItem(SESSION_DAY_BASE_V670,authBusinessDayV670());groups=[];draft=[null,null,null,null];normalizeClient();currentView='queue';renderAll();goView('queue');document.getElementById('login').classList.add('hide');
 },{s:clone(state),t:now});
 await page.waitForSelector('[data-pending-eta680="p0"]');
 assert.match(await page.locator('[data-pending-eta680="p0"] strong').innerText(),/약 8분 후/);
 assert(await page.evaluate(()=>{const node=document.querySelector('[data-pending-eta680="p0"]');window.__kokmatchRefreshPendingEtas680();return node===document.querySelector('[data-pending-eta680="p0"]')}),'partial refresh rebuilt card');
 // Advance only Date.now; wait for the existing 15-second partial refresh timer.
 await page.evaluate(t=>{Date.now=()=>t},now+2*minute);
 await page.evaluate(()=>{const refresh=window.__kokmatchRefreshPendingEtas680;window.__etaRefreshCount=0;window.__kokmatchRefreshPendingEtas680=()=>{window.__etaRefreshCount++;refresh()}});
 await page.waitForFunction(()=>window.__etaRefreshCount>0,{},{timeout:20000});
 await page.waitForFunction(()=>document.querySelector('[data-pending-eta680="p0"] strong')?.textContent.includes('약 6분 후'),{},{timeout:20000});
 await page.evaluate(()=>{S.games.shift();renderQueue()});assert.match(await page.locator('[data-pending-eta680="p0"] strong').innerText(),/곧 시작 가능/);
 await page.evaluate(()=>{S.pendingGames.shift();renderQueue()});assert.match(await page.locator('[data-pending-eta680="p1"] strong').innerText(),/곧 시작 가능/);
 await page.evaluate(()=>{S.pendingGames[0].players.pop();renderQueue()});assert.equal(await page.locator('[data-pending-eta680="p1"]').isVisible(),false);
 await page.evaluate(()=>{S.pendingGames.reverse();renderQueue()});assert.match(await page.locator('[data-pending-eta680="p3"] strong').innerText(),/곧 시작 가능/);
 await page.evaluate(()=>{S= {...S,courtCount:1,games:[],history:[],pendingGames:[{id:'other-group',players:['m0','m1','m2','m3']} ]};currentGroupId='other-qa';renderQueue()});assert.equal(await page.locator('[data-pending-eta680="p3"]').count(),0);
 await page.evaluate(({s,t})=>{S=s;Date.now=()=>t;renderQueue()},{s:clone(state),t:now});
 const layout=await page.locator('[data-pending-eta680]').evaluateAll(els=>els.map(el=>{
  const r=el.getBoundingClientRect(),card=el.closest('.pendingCard'),c=card.getBoundingClientRect(),head=card.querySelector('.pendingHead').getBoundingClientRect(),grid=card.querySelector('.pendingGrid').getBoundingClientRect();
  return {inside:r.left>=c.left&&r.right<=c.right,fit:el.scrollWidth<=el.clientWidth+1,noOverlap:r.top>=head.bottom&&r.bottom<=grid.top};
 }));assert(layout.every(x=>x.inside&&x.fit&&x.noOverlap),JSON.stringify(layout));
 await page.waitForTimeout(600);
 await page.locator('[data-pending-eta680="p0"]').locator('..').screenshot({path:`qa-artifacts/eta-${engine.name()}-${width}.png`});
 // Use the actual finish/start buttons and API state application, isolated from production.
 fixture=clone(state);fixture.games[0].players=['m16','m17','m18','m19'];fixture.games[1].players=['m20','m21','m22','m23'];
 await page.evaluate(({s,t})=>{const wall=window.__etaRealNow();Date.now=()=>t+window.__etaRealNow()-wall;S=s;renderAll();goView('playing')},{s:clone(fixture),t:now+10*minute});
 await page.waitForTimeout(500);
 const dialogs=[];page.on('dialog',d=>{dialogs.push(d.type()+': '+d.message());return d.accept()});
 await page.evaluate(()=>{window.__finishCalls=0;const original=finishGameNow;finishGameNow=async(...args)=>{window.__finishCalls++;return original(...args)}});
 const press=async selector=>{const el=page.locator(selector);await el.scrollIntoViewIfNeeded();await page.waitForTimeout(200);if(width<500)await el.tap();else await el.click()};
 await press('[onclick="finishGameNow(\'g1\')"]');
 try{await page.waitForFunction(()=>S.games.length===1&&currentView==='queue',{},{timeout:5000})}catch(e){console.log('FINISH DIAGNOSTIC',{finished,dialogs,errors,failedRequests},await page.evaluate(()=>({called:window.__finishCalls,view:currentView,games:S.games,modal:document.getElementById('modalSheet')?.innerText})));await page.screenshot({path:`qa-artifacts/finish-failed-${engine.name()}-${width}.png`});throw e}assert.equal(finished,1);
 assert.match(await page.locator('[data-pending-eta680="p0"] strong').innerText(),/곧 시작 가능/);
 await press('[onclick="openCourtStart(\'p0\')"]');
 await press('[onclick="chooseCourt(1)"]');
 await page.waitForFunction(()=>S.games.some(g=>g.id==='new-game'));assert.equal(begun,1);
 assert.equal(await page.locator('[data-pending-eta680="p0"]').count(),0);
 assert(assets.every(a=>a.includes(`app-v${version}.`)),'cross-version asset loaded');assert.deepEqual(errors,[]);
 console.log(`PASS ${engine.name()} ${width}px: login, ETA timer/node stability, finish/start buttons, removal, reorder, group switch, layout, current assets, no page errors`);
 }finally{await browser.close()}
}
