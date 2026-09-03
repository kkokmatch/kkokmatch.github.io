import { webkit } from 'playwright';

const browser = await webkit.launch({headless:true});
const base = 'http://127.0.0.1:4173/';

function payload(kind){
  const isAdmin=kind==='admin', isTemp=kind==='temp', isGuest=kind==='guest';
  const role=isAdmin?'admin':kind==='manager'?'manager':kind==='organizer'?'organizer':'member';
  return {
    data:{
      courtCount:4,courtNames:['1코트','2코트','3코트','4코트'],
      members:[{id:'m1',name:'테스트',year:1989,age:'30',gender:'남',cls:'C',type:isGuest?'guest':'member',role,state:'waiting',totalGames:0,inviter:isGuest?'초대인':''}],
      queue:[],pendingGames:[],games:[],history:[],pairCounts:{}
    },
    user:{memberId:'m1',displayName:'테스트',role,globalAdmin:isAdmin,tempOrganizer:isTemp,groupId:'g1'},
    group:{groupId:'g1',name:'테스트모임'},groups:[]
  };
}

async function runRole(kind){
  const ctx=await browser.newContext({
    viewport:{width:390,height:844},serviceWorkers:'block',
    userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1'
  });
  await ctx.addInitScript(()=>{
    localStorage.clear();sessionStorage.clear();
    localStorage.setItem('kokmatch_token','qa-token');
    localStorage.setItem('kokmatch_group_id','g1');
    localStorage.setItem('kokmatch_v1_6_reset_once','done');
  });
  const p=await ctx.newPage();
  let active=0,maxActive=0,stateCalls=0;
  const nav=[],errors=[];
  p.on('framenavigated',f=>{if(f===p.mainFrame())nav.push(f.url())});
  p.on('pageerror',e=>errors.push(String(e)));
  await p.route('**/functions/v1/**',async route=>{
    const req=route.request(),u=new URL(req.url());
    const isState=(u.pathname.includes('kokmatch-multi-api')&&u.searchParams.get('api')==='state')||u.pathname.includes('kokmatch-state-v46');
    if(isState){
      stateCalls++;active++;maxActive=Math.max(maxActive,active);
      await new Promise(r=>setTimeout(r,stateCalls===1?450:130));
      active--;
      return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(payload(kind))});
    }
    if(u.pathname.includes('kokmatch-stats'))return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({rows:[],members:[],days:[]})});
    return route.fulfill({status:200,contentType:'application/json',body:'{}'});
  });

  await p.goto(base+'?qa='+kind,{waitUntil:'domcontentloaded',timeout:30000});
  const early=await p.evaluate(()=>({
    hidden:document.getElementById('login')?.classList.contains('hide')===true,
    loginName:!!document.getElementById('loginName'),
    token:localStorage.getItem('kokmatch_token'),
    shell:window.__kokmatchShellReady634===true,
    coordinator:window.__kokmatchSessionCoordinator634===true
  }));
  if(!early.hidden)throw new Error(kind+' exposed login during stored-session restore: '+JSON.stringify(early));
  if(early.loginName)throw new Error(kind+' rendered/focused hidden login form: '+JSON.stringify(early));
  if(!early.shell||!early.coordinator)throw new Error(kind+' session ordering markers missing: '+JSON.stringify(early));

  await p.waitForFunction(()=>document.getElementById('who')?.textContent.includes('테스트'),null,{timeout:15000});
  await p.evaluate(()=>goView('settings'));
  await p.waitForFunction(()=>document.getElementById('kokmatchGlobalVersion634')?.textContent==='콕매치 v6.34 · 최신 운영본',null,{timeout:8000});
  await p.waitForTimeout(250);
  const version=await p.evaluate(()=>({
    metas:[...document.querySelectorAll('.meta')].map(e=>(e.textContent||'').trim()).filter(t=>/^콕매치\s+v\d/.test(t)),
    cards:[...document.querySelectorAll('#settings > .card')].filter(c=>(c.textContent||'').includes('프로그램 버전')).length,
    global:document.getElementById('kokmatchGlobalVersion634')?.textContent||'',
    hidden:document.getElementById('login')?.classList.contains('hide')===true,
    token:localStorage.getItem('kokmatch_token')
  }));
  if(version.metas.length!==1||version.metas[0]!=='콕매치 v6.34 · 최신 운영본')throw new Error(kind+' stale/duplicate version text: '+JSON.stringify(version));
  if(version.cards!==1||version.global!=='콕매치 v6.34 · 최신 운영본')throw new Error(kind+' global version card invalid: '+JSON.stringify(version));

  const before=p.url();
  await p.evaluate(()=>{
    window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));
    window.dispatchEvent(new Event('focus'));
  });
  await p.waitForTimeout(900);
  const after=await p.evaluate(()=>({
    url:location.href,token:localStorage.getItem('kokmatch_token'),
    hidden:document.getElementById('login')?.classList.contains('hide')===true,
    version:document.getElementById('kokmatchGlobalVersion634')?.textContent||''
  }));
  if(p.url()!==before)throw new Error(kind+' forced navigation on resume: '+before+' -> '+p.url());
  if(after.token!=='qa-token'||!after.hidden||after.version!=='콕매치 v6.34 · 최신 운영본')throw new Error(kind+' session/version lost after resume: '+JSON.stringify(after));
  if(maxActive>1)throw new Error(kind+' concurrent state requests detected: '+maxActive);
  if(errors.length)throw new Error(kind+' page errors: '+errors.join(' | '));
  console.log('ROLE_QA',kind,JSON.stringify({early,version,after,stateCalls,maxActive,nav}));
  await ctx.close();
}

for(const kind of ['member','guest','temp','organizer','manager','admin'])await runRole(kind);

const clean=await browser.newContext({serviceWorkers:'block'});
await clean.addInitScript(()=>{localStorage.clear();sessionStorage.clear();localStorage.setItem('kokmatch_v1_6_reset_once','done')});
const cleanPage=await clean.newPage();
const cleanErrors=[];cleanPage.on('pageerror',e=>cleanErrors.push(String(e)));
await cleanPage.route('**/functions/v1/**',route=>route.fulfill({status:200,contentType:'application/json',body:'{}'}));
await cleanPage.goto(base+'?qa=logged-out',{waitUntil:'domcontentloaded',timeout:30000});
await cleanPage.waitForSelector('#loginName',{state:'visible',timeout:10000});
const cleanBefore=cleanPage.url();
await cleanPage.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));
await cleanPage.waitForTimeout(500);
if(cleanPage.url()!==cleanBefore)throw new Error('logged-out pageshow forced navigation');
if(cleanErrors.length)throw new Error('logged-out page errors: '+cleanErrors.join(' | '));
console.log('LOGGED_OUT_QA',cleanBefore);
await clean.close();
await browser.close();
console.log('PASS v6.34 WebKit role/session/version QA');
