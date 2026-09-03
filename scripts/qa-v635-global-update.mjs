import { chromium } from 'playwright';

const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:800,height:1280},serviceWorkers:'block'});
const page=await context.newPage();
const errors=[];const failed=[];const appResponses=[];let adminCalls=[];
page.on('pageerror',e=>errors.push(String(e?.stack||e)));
page.on('requestfailed',r=>failed.push({url:r.url(),failure:r.failure()?.errorText||''}));
page.on('response',r=>{try{const u=new URL(r.url());if(u.pathname.includes('app-v6.35')||u.pathname==='/index.html'||u.pathname==='/')appResponses.push({url:r.url(),status:r.status()})}catch{}});
await page.route('https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/**',async route=>{
  const req=route.request(),url=new URL(req.url());
  if(url.pathname.endsWith('/kokmatch-admin-refresh')){
    let body={};try{body=JSON.parse(req.postData()||'{}')}catch{}
    adminCalls.push({auth:req.headers()['authorization']||'',body});
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,loggedOutSessions:4,latestVersion:body.latestVersion,scope:'all_groups_except_caller'})});
  }
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,data:{courtCount:8,courtNames:[],members:[],queue:[],pendingGames:[],games:[],history:[],pairCounts:{}},groups:[]})});
});

const members=[
 {id:'dev',name:'개발자',year:1989,gender:'남',age:'30',cls:'C',type:'member',role:'admin',totalGames:0,state:'out'},
 {id:'mem',name:'일반회원',year:1990,gender:'여',age:'30',cls:'D',type:'member',role:'member',totalGames:0,state:'out'}
];
const state={courtCount:8,courtNames:Array.from({length:8},(_,i)=>`${i+1}코트`),members,queue:[],pendingGames:[],games:[],history:[],pairCounts:{}};

try{
 await page.goto('http://127.0.0.1:4173/?qa=v635',{waitUntil:'domcontentloaded'});
 await page.waitForTimeout(800);
 const boot=await page.evaluate(()=>({
   lock:window.__kokmatchVersionLock,
   standalone:window.__kokmatchStandalone,
   renderAll:typeof window.renderAll,
   globalUpdate:!!window.__kokmatchGlobalUpdate635,
   title:document.title,
   ready:document.readyState,
   scripts:[...document.scripts].map(s=>s.src).filter(Boolean),
   body:(document.body?.innerText||'').slice(0,300)
 }));
 console.log('V635_BOOT',JSON.stringify(boot));
 console.log('V635_APP_RESPONSES',JSON.stringify(appResponses));
 if(failed.length)console.log('V635_REQUEST_FAILED',JSON.stringify(failed));
 if(errors.length)console.log('V635_PAGE_ERRORS_EARLY',JSON.stringify(errors));
 if(boot.lock!=='6.35'||boot.renderAll!=='function'||!boot.globalUpdate)throw new Error('v6.35 runtime did not initialize: '+JSON.stringify(boot));

 async function installRole(globalAdmin){
  await page.evaluate(({state,globalAdmin})=>{
    T=globalAdmin?'qa-admin':'qa-member';localStorage.setItem('kokmatch_token',T);currentGroupId='qa';currentView='members';S=JSON.parse(JSON.stringify(state));window.S=S;
    me=globalAdmin?{memberId:'dev',displayName:'개발자',role:'admin',globalAdmin:true,tempOrganizer:false,groupId:'qa'}:{memberId:'mem',displayName:'일반회원',role:'member',globalAdmin:false,tempOrganizer:false,groupId:'qa'};
    group={groupId:'qa',name:'QA 모임'};groups=[];normalizeClient();renderAll();document.getElementById('login')?.classList.add('hide');
  },{state,globalAdmin});
  await page.waitForTimeout(120);
 }

 await installRole(false);
 let top=await page.locator('#kokmatchTopVersion635').textContent();
 if(top?.trim()!=='v6.35')throw new Error('member top version mismatch: '+top);
 const realLegacyBefore=await page.evaluate(()=>[...document.querySelectorAll('.top *')].filter(el=>/^(?:버전\s*)?v6\.20$/.test((el.textContent||'').trim())).length);
 if(realLegacyBefore)throw new Error('real rendered legacy v6.20 exists: '+realLegacyBefore);
 await page.evaluate(()=>{const x=document.createElement('span');x.id='legacyTopVersionTest';x.textContent='v6.20';document.querySelector('.top')?.appendChild(x);window.__kokmatchEnsureTopVersion635?.()});
 await page.waitForTimeout(50);
 const legacy=await page.locator('#legacyTopVersionTest').textContent();
 if((legacy||'').trim())throw new Error('manual header repair did not remove stale v6.20: '+legacy);
 await page.evaluate(()=>goView('settings'));
 await page.waitForTimeout(80);
 const memberSetting=await page.locator('#kokmatchGlobalVersion634').textContent();
 if(memberSetting?.trim()!=='콕매치 v6.35 · 최신 운영본')throw new Error('member settings version mismatch: '+memberSetting);

 await installRole(true);
 top=await page.locator('#kokmatchTopVersion635').textContent();
 if(top?.trim()!=='v6.35')throw new Error('admin top version mismatch: '+top);
 await page.evaluate(()=>goView('settings'));
 await page.waitForTimeout(80);
 const adminSetting=await page.locator('#kokmatchGlobalVersion634').textContent();
 if(adminSetting?.trim()!=='콕매치 v6.35 · 최신 운영본')throw new Error('admin settings version mismatch: '+adminSetting);
 await page.evaluate(()=>{window.confirm=()=>true;window.__v635Reload=null;window.__kokmatchHardReload633=async(target,reason)=>{window.__v635Reload={target,reason}}});
 await page.evaluate(()=>forceUpdateApp());
 await page.waitForFunction(()=>!!window.__v635Reload,null,{timeout:5000});
 const reload=await page.evaluate(()=>window.__v635Reload);
 if(reload?.target!=='6.35'||reload?.reason!=='admin-global-refresh')throw new Error('admin reload mismatch: '+JSON.stringify(reload));
 if(adminCalls.length!==1)throw new Error('admin refresh call count: '+adminCalls.length);
 if(adminCalls[0].auth!=='Bearer qa-admin')throw new Error('admin refresh auth mismatch: '+adminCalls[0].auth);
 if(adminCalls[0].body?.latestVersion!=='6.35')throw new Error('admin refresh version body mismatch: '+JSON.stringify(adminCalls[0].body));
 if(errors.length)throw new Error('page errors: '+errors.join(' | '));
 console.log('PASS v6.35 member/admin top version = v6.35');
 console.log('PASS real render has no v6.20 and header repair removes injected stale label');
 console.log('PASS settings global version = v6.35 for member/admin');
 console.log('PASS developer update calls global logout endpoint then hard reload');
}finally{await browser.close();}
