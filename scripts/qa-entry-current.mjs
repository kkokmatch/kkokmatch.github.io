import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {stripTypeScriptTypes} from 'node:module';
import {webcrypto} from 'node:crypto';
import {chromium,webkit,devices} from 'playwright';
import {repeatPairs687} from '../edge-functions/_shared/repeat.mjs';

const latest=JSON.parse(fs.readFileSync('latest-version.json'));
const version=process.env.QA_VERSION||latest.semanticVersion;
const base='http://127.0.0.1:4173';
const fresh=()=>({courtCount:2,members:[{id:'manager',name:'검증관리자',role:'manager',type:'member',state:'out',year:1989,gender:'남',cls:'C'},{id:'member',name:'검증회원',role:'member',type:'member',state:'out',year:1990,gender:'여',cls:'C'}],queue:[],pendingGames:[],games:[],history:[],pairCounts:{},autoGame:{enabled:false}});
let state=fresh(),role='manager',valid=true,atomicFailure=0,writes=0,legacyCalls=0,atomicCalls=0;
const sql=async(strings,...values)=>{
 const q=strings.join('?');
 if(q.includes('kokmatch_sessions'))return valid?[{club_id:'qa',role,member_id:role==='member'?'member':'manager',display_name:'검증사용자'}]:[];
 if(q.includes('kokmatch_atomic_game_action')){
  const b=values.at(-1),m=state.members.find(m=>m.id===b.memberId);
  if(!m||!['waiting','spectator','out'].includes(b.mode))throw Error('invalid attendance');
  m.state=b.mode;m.joinedAt=b.mode==='out'?null:Date.now();state.queue=state.queue.filter(x=>x!==m.id);if(b.mode==='waiting')state.queue.push(m.id);writes++;
  return [{data:structuredClone(state)}];
 }
 if(q.includes('kokmatch_state'))return [{data:structuredClone(state)}];
 throw Error('Unexpected SQL: '+q);
};sql.begin=f=>f(sql);sql.json=x=>x;
function loadHandler(file,extra={}){
 let handler;
 const source=stripTypeScriptTypes(fs.readFileSync(file,'utf8').replace(/^import .*;\n/gm,''));
 vm.runInNewContext(source,{Deno:{env:{get:key=>key==='SUPABASE_URL'?'https://qa.supabase.co':''},serve:f=>handler=f},postgres:()=>sql,createClient:()=>({from:()=>{throw Error('Legacy REST path must not handle attendance')}}),fetch:req=>req,TextEncoder,Response,Request,AbortSignal,crypto:webcrypto,console:{error:()=>{}},Date,Map,Set,repeatPairs687,...extra});
 return handler;
}
const atomic=loadHandler('edge-functions/kokmatch-atomic-api/index.ts');
let forwarded=0;
const legacy=loadHandler('edge-functions/kokmatch-v60-api/index.ts',{fetch:async(url,options)=>{assert.equal(url,'https://qa.supabase.co/functions/v1/kokmatch-atomic-api');assert.equal(options.headers.authorization,'Bearer fixture');forwarded++;return atomic(new Request(url,options))}});
const req=b=>new Request('https://qa/',{method:'POST',headers:{authorization:'Bearer fixture','content-type':'application/json'},body:JSON.stringify({op:'action',groupId:'qa',...b})});
for(const mode of ['waiting','spectator','out'])assert.equal((await legacy(req({action:'set_member_attendance',memberId:'member',mode}))).status,200);
assert.equal(writes,3);assert.equal(forwarded,3);
role='member';assert.equal((await legacy(req({action:'set_member_attendance',memberId:'manager',mode:'waiting'}))).status,403);
assert.equal((await legacy(req({action:'set_my_attendance',memberId:'manager',mode:'waiting'}))).status,200);assert.equal(state.members[0].state,'out','self action cannot spoof another member');
assert.equal((await legacy(req({action:'set_my_attendance',groupId:'other',mode:'waiting'}))).status,403);
valid=false;assert.equal((await legacy(req({action:'set_my_attendance',mode:'waiting'}))).status,401);valid=true;
const unavailable=loadHandler('edge-functions/kokmatch-v60-api/index.ts',{fetch:async()=>{throw Error('outage')}});assert.equal((await unavailable(req({action:'set_my_attendance',mode:'waiting'}))).status,503);
console.log('PASS legacy attendance forwards authorization; role/group/self checks; real expiry; outage classification');

const engine=process.env.QA_BROWSER==='webkit'?webkit:chromium;
const profiles=[['desktop',{viewport:{width:1280,height:900}}],['iPhone Safari',{...devices['iPhone 13']}],...(engine===chromium?[['Android Chrome',{...devices['Pixel 7']}]]:[])];
const browser=await engine.launch({headless:true});
try{for(const [name,opts] of profiles){
 state=fresh();role='manager';valid=true;atomicFailure=0;writes=0;legacyCalls=0;atomicCalls=0;
 const ctx=await browser.newContext({...opts,timezoneId:'Asia/Seoul',serviceWorkers:'block'}),errors=[],alerts=[];
 await ctx.addInitScript(()=>{try{localStorage.setItem('kokmatch_install_prompt_day',new Date(Date.now()+9*3600000).toISOString().slice(0,10));sessionStorage.setItem('kokmatch_push_later629','1');localStorage.setItem('kokmatch_push_denied_notice629',String(Date.now()))}catch{}});
 await ctx.route(base+'/**',async route=>{
  const rel=new URL(route.request().url()).pathname.slice(1)||'index.html',file=path.resolve(rel);
  if(!file.startsWith(process.cwd()+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile())return route.fulfill({status:404,body:''});
  if(rel==='index.html')return route.fulfill({contentType:'text/html',body:fs.readFileSync(file,'utf8').replaceAll(latest.semanticVersion,version)});
  return route.fulfill({path:file});
 });
 const response=()=>({success:true,data:structuredClone(state),user:{memberId:role==='member'?'member':'manager',displayName:'검증사용자',role,groupId:'qa',globalAdmin:false},group:{groupId:'qa',name:'입장 검증'},groups:[],profiles:{},config:{enabled:false}});
 await ctx.route('https://wjelumpbjklfrdjxbesj.supabase.co/**',async route=>{
  const r=route.request(),url=new URL(r.url());let status=200,result=response();
  if(url.pathname.endsWith('/kokmatch-v60-api')){legacyCalls++;status=401;result={error:'로그인이 필요합니다.'}}
  else if(url.pathname.endsWith('/kokmatch-atomic-api')){
   atomicCalls++;
   if(atomicFailure){status=atomicFailure;result={error:'서버 인증 처리 오류'}}
   else{const rr=await atomic(new Request(r.url(),{method:'POST',headers:r.headers(),body:r.postData()}));status=rr.status;result=await rr.json()}
  }else if(url.pathname.endsWith('/kokmatch-multi-api')&&!valid){status=401;result={error:'로그인이 필요합니다.'}}
  return route.fulfill({status,contentType:'application/json',body:JSON.stringify(result)});
 });
 const page=await ctx.newPage();page.on('pageerror',e=>errors.push(String(e)));page.on('dialog',async d=>{alerts.push(d.message());await d.dismiss()});
 await page.goto(base,{waitUntil:'networkidle'});await page.waitForFunction(v=>window.__kokmatchVersionLock===v,version);
 async function seed(){await page.evaluate(({s,role})=>{T='fixture';localStorage.setItem(TOKEN_KEY,T);localStorage.setItem(SESSION_DAY_BASE_V670,authBusinessDayV670());currentGroupId='qa';currentView='members';S=s;window.S=S;me={memberId:role==='member'?'member':'manager',displayName:'검증사용자',role,groupId:'qa',globalAdmin:false};group={groupId:'qa',name:'입장 검증'};groups=[];normalizeClient();renderAll();document.getElementById('login').classList.add('hide');goView('members')},{s:structuredClone(state),role});await page.waitForTimeout(800)}
 await seed();
 async function click(id,label){const target=page.locator(`#members .memberCard[data-member-id22="${id}"]`).getByRole('button',{name:label,exact:true});if(opts.isMobile)await target.tap();else await target.click()}
 for(const [label,mode] of [['입장','waiting'],['관람','spectator'],['퇴장','out']]){
  const before=writes;await click('member',label);await page.waitForFunction(({id,mode})=>S.members.find(m=>m.id===id)?.state===mode,{id:'member',mode});await page.waitForTimeout(850);
  assert.equal(writes,before+1,'one server mutation per click/tap');assert.equal(state.members[1].state,mode);assert.equal(await page.evaluate(()=>T),'fixture');
 }
 assert.equal(legacyCalls,0,'roster must use canonical endpoint');assert.deepEqual(alerts,[]);
 role='member';await seed();assert.equal(await page.locator('#members .memberCard[data-member-id22="manager"]').getByRole('button',{name:'입장',exact:true}).count(),0);
 await click('member','입장');await page.waitForTimeout(850);assert.equal(state.members[1].state,'waiting');
 await page.evaluate(()=>setMySetting('spectator'));assert.equal(state.members[1].state,'spectator');await page.evaluate(()=>setMyEntry('waiting'));assert.equal(state.members[1].state,'waiting');
 await page.evaluate(()=>goView('members'));await page.waitForTimeout(850);
 for(const failure of [401,500]){
  atomicFailure=failure;const before=writes;await click('member','퇴장');await page.waitForTimeout(1000);
  assert.equal(writes,before);assert.equal(state.members[1].state,'waiting');assert.equal(await page.evaluate(()=>S.members.find(m=>m.id==='member').state),'waiting');assert.equal(await page.evaluate(()=>T),'fixture');assert.ok(!alerts.at(-1).includes('만료'),'a valid session must not be reported as expired');
 }
 atomicFailure=0;valid=false;await click('member','퇴장');await page.waitForFunction(()=>!T);assert.ok(await page.locator('#loginName').isVisible());assert.match(alerts.at(-1),/만료/);
 valid=true;await seed();await click('member','퇴장');await page.waitForTimeout(900);assert.equal(state.members[1].state,'out');assert.deepEqual(errors,[]);
 console.log('PASS',engine.name(),name,'roster enter/watch/exit; single write; self/settings/entry; rollback; valid/expired session; recovery');await ctx.close();
}}finally{await browser.close()}
