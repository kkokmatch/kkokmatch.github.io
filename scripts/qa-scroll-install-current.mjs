import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {chromium, webkit, devices} from 'playwright';

const latest=JSON.parse(fs.readFileSync('latest-version.json','utf8'));
const version=process.env.QA_VERSION||latest.semanticVersion;
const base=process.env.QA_URL||'http://127.0.0.1:4173';
const browser=await (process.env.QA_BROWSER==='webkit'?webkit:chromium).launch({headless:true});
const errors=[];
const day='2026-10-21';
const state={courtCount:4,courtNames:['1코트','2코트','3코트','4코트'],members:Array.from({length:24},(_,i)=>({id:'m'+i,name:'검증회원'+String(i).padStart(2,'0'),year:1990,gender:i%2?'여':'남',age:'30',cls:'C',role:i?'member':'manager',type:'member',state:'waiting',joinedAt:1792500000000})),queue:Array.from({length:24},(_,i)=>'m'+i),games:[],pendingGames:[],history:[],pairCounts:{},autoGame:{enabled:false}};

async function context(opts={}){
 const ctx=await browser.newContext({viewport:{width:1280,height:800},timezoneId:'Asia/Seoul',serviceWorkers:'block',...opts});
 // Route all data calls to an isolated fixture; no live accounts or records are used.
 await ctx.route('https://wjelumpbjklfrdjxbesj.supabase.co/**',r=>r.fulfill({json:{success:true,data:state,profiles:{},groups:[],config:{enabled:false},members:state.members,rangeGames:[],monthGames:[],baselines:[]}}));
 if(!process.env.QA_URL)await ctx.route(base+'/**',async r=>{
  const u=new URL(r.request().url()),relative=u.pathname==='/'?'index.html':decodeURIComponent(u.pathname.slice(1));
  const file=path.resolve(relative);
  if(!file.startsWith(process.cwd()+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile())return r.fulfill({status:404,body:''});
  if(relative==='index.html')return r.fulfill({contentType:'text/html',body:fs.readFileSync(file,'utf8').replaceAll(latest.semanticVersion,version)});
  return r.fulfill({path:file});
 });
 ctx.on('page',p=>p.on('pageerror',e=>errors.push(String(e))));
 return ctx;
}
async function page(ctx,clock=true){
 const p=await ctx.newPage();
 if(clock)await p.clock.install({time:new Date('2026-10-21T14:50:00Z')});
 await p.goto(base+'/?qa=scroll-install',{waitUntil:'networkidle'});
 await p.waitForFunction(v=>window.__kokmatchVersionLock===v,version);
 return p;
}
async function signal(p){
 await p.evaluate(()=>{
  window.dispatchEvent(new Event('pageshow'));
  document.dispatchEvent(new Event('visibilitychange'));
  const e=new Event('beforeinstallprompt',{cancelable:true});
  e.prompt=async()=>{window.__qaInstallCalls=(window.__qaInstallCalls||0)+1};
  e.userChoice=Promise.resolve({outcome:'dismissed'});
  window.dispatchEvent(e);
 });
 await p.waitForTimeout(1100);
}
async function noPrompt(p,label){assert.equal(await p.locator('#pwaPrompt629').count(),0,label)}
async function prompt(p){await p.locator('#pwaPrompt629').waitFor({state:'visible',timeout:5000});}
async function login(p){await p.evaluate(state=>{
 T='qa-token';currentGroupId='qa';currentView='members';S=structuredClone(state);window.S=S;
 me={memberId:'m0',displayName:'검증회원00',role:'manager',groupId:'qa',globalAdmin:false};
 group={groupId:'qa',name:'스크롤 검증 모임'};groups=[];normalizeClient();renderAll();document.getElementById('login').classList.add('hide');goView('members');
},state);}
async function wheel(p,x=640,y=500,dy=550){await p.mouse.move(x,y);await p.mouse.wheel(0,dy);await p.waitForTimeout(350);}

try{
 const scrollCtx=await context();
 await scrollCtx.addInitScript(()=>{try{localStorage.setItem('kokmatch_install_prompt_day',new Date(Date.now()+9*3600000).toISOString().slice(0,10));sessionStorage.setItem('kokmatch_push_later629','1');localStorage.setItem('kokmatch_push_denied_notice629',String(Date.now()))}catch{}});
 const desktop=await page(scrollCtx,false);await login(desktop);
 for(const view of ['members','queue','settings']){
  await desktop.evaluate(view=>goView(view),view);await desktop.waitForTimeout(700);
  const range=await desktop.evaluate(()=>document.scrollingElement.scrollHeight-innerHeight);
  assert.ok(range>100,view+' fixture must overflow the viewport');
  await wheel(desktop);const scrolled=await desktop.evaluate(()=>({y:scrollY,html:getComputedStyle(document.documentElement).overflow,body:getComputedStyle(document.body).overflow,overscroll:getComputedStyle(document.body).overscrollBehaviorY,top:document.elementFromPoint(640,500)?.outerHTML.slice(0,200),prompt:document.getElementById('pwaPrompt629')?.textContent}));assert.ok(scrolled.y>100,view+' must scroll with a physical wheel: '+JSON.stringify(scrolled));
  const before=await desktop.evaluate(()=>scrollY);await wheel(desktop,640,450,-300);
  assert.ok(await desktop.evaluate(()=>scrollY)<before,view+' must scroll upward');
  const nav=await desktop.locator('#nav').boundingBox();assert.ok(Math.abs(nav.y+nav.height-800)<30,'bottom nav must stay fixed');
 }
 await desktop.evaluate(()=>{openModal('<h3>스크롤 검증</h3>'+Array.from({length:45},(_,i)=>'<p>팝업 항목 '+i+'</p>').join(''))});
 const sheet=desktop.locator('#modalSheet');const rect=await sheet.boundingBox();
 await wheel(desktop,rect.x+rect.width/2,rect.y+Math.min(250,rect.height/2));
 assert.ok(await sheet.evaluate(el=>el.scrollTop)>100,'modal must scroll independently');
 await desktop.evaluate(()=>{closeModal();goView('members')});await wheel(desktop);
 assert.ok(await desktop.evaluate(()=>scrollY)>100,'closing a modal must preserve page wheel scrolling');
 await desktop.evaluate(()=>{
  const avatar=document.createElement('div');avatar.dataset.photo='1';avatar.dataset.memberId='m0';
  avatar.innerHTML='<img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7">';
  return window.openProfilePhoto21(avatar);
 });
 await desktop.locator('#profileModal21.on .profileClose21').click();
 await desktop.evaluate(()=>goView('members'));await desktop.waitForTimeout(700);await wheel(desktop);
 assert.ok(await desktop.evaluate(()=>scrollY)>100,'photo close must release the body scroll lock');
 console.log('PASS desktop wheel down/up: roster, queue, settings; modal/photo close; fixed nav');
 await scrollCtx.close();

 for(const [name,opts] of [
  ['iPhone Safari',{...devices['iPhone 13']}],
  ['iPhone Kakao',{...devices['iPhone 13'],userAgent:devices['iPhone 13'].userAgent+' KAKAOTALK 26.1'}],
  ['Android Kakao',{...devices['Pixel 7'],userAgent:devices['Pixel 7'].userAgent+'; wv) KAKAOTALK 26.1'}],
  ['Android Chrome',{...devices['Pixel 7']}],
  ['desktop Chrome',{}]
 ]){
  const ctx=await context(opts),p=await page(ctx);await prompt(p);
  assert.match(await p.locator('#pwaPromptTitle629').innerText(),/설치/);
  if(name==='Android Kakao')assert.match(await p.locator('.pwaPromptBody629').innerText(),/다른 브라우저로 열기/);
  assert.equal(await p.evaluate(()=>localStorage.getItem('kokmatch_install_prompt_day')),day);
  if(opts.isMobile)await p.locator('#pwaSecondary629').tap();else await p.locator('#pwaSecondary629').click();
  await signal(p);await noPrompt(p,name+' foreground/repeated install event');
  await p.reload({waitUntil:'networkidle'});await signal(p);await noPrompt(p,name+' reload');
  const p2=await page(ctx);await signal(p2);await noPrompt(p2,name+' new tab');await p2.close();
  const persisted=await ctx.storageState();
  await p.clock.setFixedTime(new Date('2026-10-21T15:05:00Z'));await signal(p);await prompt(p);
  assert.equal(await p.evaluate(()=>localStorage.getItem('kokmatch_install_prompt_day')),'2026-10-22','new Korean calendar day, even less than 24h later');
  await p.locator('#pwaPrimary629').click();await signal(p);await noPrompt(p,name+' primary action must not retrigger');
  if(name==='desktop Chrome')assert.equal(await p.evaluate(()=>window.__qaInstallCalls),1,'native installer called once by user action');
  await ctx.close();
  if(name==='iPhone Safari'){
   const restored=await context({...opts,storageState:persisted}),p3=await page(restored);await signal(p3);await noPrompt(p3,'browser restart retains the day');await restored.close();
  }
  console.log('PASS',name,'first guide, same-day suppression, reload, new tab, midnight, primary action');
 }

 const nativeCtx=await context();await nativeCtx.addInitScript(()=>{window.addEventListener('DOMContentLoaded',()=>{const e=new Event('beforeinstallprompt',{cancelable:true});e.prompt=async()=>{window.__qaInstallCalls=(window.__qaInstallCalls||0)+1};e.userChoice=Promise.resolve({outcome:'accepted'});window.dispatchEvent(e)})});
 const native=await page(nativeCtx);await prompt(native);assert.equal(await native.locator('#pwaPrimary629').innerText(),'지금 설치');await native.locator('#pwaPrimary629').click();await signal(native);await noPrompt(native,'native installer repeated event');assert.equal(await native.evaluate(()=>window.__qaInstallCalls),1);await nativeCtx.close();
 console.log('PASS native install event before first guide and dismissed/accepted action suppression');

 for(const mode of ['standalone','restricted-local-storage','all-storage-blocked','legacy-dismissal']){
  const ctx=await context({...devices['iPhone 13']});
  await ctx.addInitScript(mode=>{
   if(mode==='standalone')Object.defineProperty(navigator,'standalone',{get:()=>true});
   if(mode==='legacy-dismissal')try{sessionStorage.setItem('kokmatch_install_later630','1')}catch{}
   if(mode.includes('storage')){
    const read=Storage.prototype.getItem,write=Storage.prototype.setItem;
    const blocked=(store,key)=>/kokmatch_(?:install|ios_install)/.test(key)&&(mode==='all-storage-blocked'||store===localStorage);
    Storage.prototype.getItem=function(key){if(blocked(this,key))throw new DOMException('blocked','SecurityError');return read.call(this,key)};
    Storage.prototype.setItem=function(key,value){if(blocked(this,key))throw new DOMException('blocked','SecurityError');return write.call(this,key,value)};
    if(mode==='all-storage-blocked')Object.defineProperty(document,'cookie',{get:()=>'',set:()=>{}});
   }
  },mode);
  const p=await page(ctx);
  if(['standalone','legacy-dismissal'].includes(mode)){await signal(p);await noPrompt(p,mode)}
  else{await prompt(p);await p.locator('#pwaSecondary629').click();await signal(p);await noPrompt(p,mode+' in-page guard');if(mode==='restricted-local-storage'){await p.reload({waitUntil:'networkidle'});await signal(p);await noPrompt(p,'storage fallback survives reload')}}
  if(mode==='legacy-dismissal'){await p.clock.setFixedTime(new Date('2026-10-21T15:05:00Z'));await signal(p);await prompt(p)}
  await ctx.close();console.log('PASS',mode);
 }

 const short=await context({viewport:{width:1280,height:400}}),p=await page(short);await prompt(p);
 const card=p.locator('.pwaPromptCard629'),box=await card.boundingBox();assert.ok(box.y>=0&&box.y+box.height<=401,'short viewport guide stays inside screen');
 await p.locator('#pwaSecondary629').click();await noPrompt(p,'short viewport dismissal remains reachable');await short.close();
 assert.deepEqual(errors,[],'no unhandled JavaScript errors');
 console.log('PASS short-window popup scrolling and accessible dismissal; zero page errors; v'+version);
}finally{await browser.close()}
