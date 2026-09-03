import { chromium } from 'playwright';

const browser=await chromium.launch({headless:true});
const errors=[];let adminCalls=[];
const members=[
 {id:'dev',name:'개발자',year:1989,gender:'남',age:'30',cls:'C',type:'member',role:'admin',totalGames:0,state:'out'},
 {id:'mem',name:'일반회원',year:1990,gender:'여',age:'30',cls:'D',type:'member',role:'member',totalGames:0,state:'out'}
];
const state={courtCount:8,courtNames:Array.from({length:8},(_,i)=>`${i+1}코트`),members,queue:[],pendingGames:[],games:[],history:[],pairCounts:{}};
const emptyState={courtCount:8,courtNames:[],members:[],queue:[],pendingGames:[],games:[],history:[],pairCounts:{}};

async function makePage(role){
 const context=await browser.newContext({viewport:{width:800,height:1280},serviceWorkers:'block'});
 const page=await context.newPage();
 page.on('pageerror',e=>errors.push(role+': '+String(e?.stack||e)));
 await page.route('https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/**',async route=>{
   const req=route.request(),url=new URL(req.url()),auth=req.headers()['authorization']||'';
   if(url.pathname.endsWith('/kokmatch-admin-refresh')){
     let body={};try{body=JSON.parse(req.postData()||'{}')}catch{}
     adminCalls.push({auth,body});
     return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,loggedOutSessions:4,latestVersion:body.latestVersion,scope:'all_groups_except_caller'})});
   }
   const isAdmin=auth==='Bearer qa-admin',isMember=auth==='Bearer qa-member';
   const user=isAdmin?{memberId:'dev',displayName:'개발자',role:'admin',globalAdmin:true,tempOrganizer:false,groupId:'qa'}:isMember?{memberId:'mem',displayName:'일반회원',role:'member',globalAdmin:false,tempOrganizer:false,groupId:'qa'}:null;
   return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,data:user?state:emptyState,user,group:user?{groupId:'qa',name:'QA 모임'}:null,groups:[]})});
 });
 await page.goto('http://127.0.0.1:4173/?qa=v635-'+role,{waitUntil:'domcontentloaded'});
 await page.waitForTimeout(500);
 const boot=await page.evaluate(()=>({lock:window.__kokmatchVersionLock,standalone:window.__kokmatchStandalone,renderAll:typeof window.renderAll,globalUpdate:!!window.__kokmatchGlobalUpdate635,scripts:[...document.scripts].map(s=>s.src).filter(Boolean),body:(document.body?.innerText||'').slice(0,220)}));
 console.log('V635_BOOT_'+role.toUpperCase(),JSON.stringify(boot));
 if(boot.lock!=='6.35'||boot.renderAll!=='function'||!boot.globalUpdate)throw new Error(role+' v6.35 runtime did not initialize: '+JSON.stringify(boot));
 return {context,page};
}

async function installRole(page,globalAdmin){
 await page.evaluate(({state,globalAdmin})=>{
   T=globalAdmin?'qa-admin':'qa-member';localStorage.setItem('kokmatch_token',T);currentGroupId='qa';localStorage.setItem('kokmatch_group_id','qa');currentView='members';S=JSON.parse(JSON.stringify(state));window.S=S;
   me=globalAdmin?{memberId:'dev',displayName:'개발자',role:'admin',globalAdmin:true,tempOrganizer:false,groupId:'qa'}:{memberId:'mem',displayName:'일반회원',role:'member',globalAdmin:false,tempOrganizer:false,groupId:'qa'};
   group={groupId:'qa',name:'QA 모임'};groups=[];normalizeClient();renderAll();document.getElementById('login')?.classList.add('hide');
 },{state,globalAdmin});
 await page.waitForTimeout(100);
}

try{
 const memberRun=await makePage('member');
 await installRole(memberRun.page,false);
 let top=await memberRun.page.locator('#kokmatchTopVersion635').textContent();
 if(top?.trim()!=='v6.35')throw new Error('member top version mismatch: '+top);
 const realLegacyBefore=await memberRun.page.evaluate(()=>[...document.querySelectorAll('.top *')].filter(el=>/^(?:버전\s*)?v6\.20$/.test((el.textContent||'').trim())).length);
 if(realLegacyBefore)throw new Error('real rendered legacy v6.20 exists: '+realLegacyBefore);
 await memberRun.page.evaluate(()=>{const x=document.createElement('span');x.id='legacyTopVersionTest';x.textContent='v6.20';document.querySelector('.top')?.appendChild(x);window.__kokmatchEnsureTopVersion635?.()});
 const legacy=await memberRun.page.locator('#legacyTopVersionTest').textContent();
 if((legacy||'').trim())throw new Error('header repair did not remove stale v6.20: '+legacy);
 await memberRun.page.evaluate(()=>goView('settings'));
 const memberSetting=await memberRun.page.locator('#kokmatchGlobalVersion634').textContent();
 if(memberSetting?.trim()!=='콕매치 v6.35 · 최신 운영본')throw new Error('member settings version mismatch: '+memberSetting);
 await memberRun.context.close();
 console.log('PASS v6.35 general member header/settings version');

 const adminRun=await makePage('admin');
 await installRole(adminRun.page,true);
 top=await adminRun.page.locator('#kokmatchTopVersion635').textContent();
 if(top?.trim()!=='v6.35')throw new Error('admin top version mismatch: '+top);
 await adminRun.page.evaluate(()=>goView('settings'));
 const adminSetting=await adminRun.page.locator('#kokmatchGlobalVersion634').textContent();
 if(adminSetting?.trim()!=='콕매치 v6.35 · 최신 운영본')throw new Error('admin settings version mismatch: '+adminSetting);
 const adminSession=await adminRun.page.evaluate(()=>({globalAdmin:!!me?.globalAdmin,role:me?.role||'',token:T}));
 if(!adminSession.globalAdmin||adminSession.token!=='qa-admin')throw new Error('developer session invalid before refresh: '+JSON.stringify(adminSession));
 await adminRun.page.evaluate(()=>{window.confirm=()=>true;window.__v635Reload=null;window.__kokmatchHardReload633=async(target,reason)=>{window.__v635Reload={target,reason}}});
 await adminRun.page.evaluate(()=>forceUpdateApp());
 await adminRun.page.waitForFunction(()=>!!window.__v635Reload,null,{timeout:5000});
 const reload=await adminRun.page.evaluate(()=>window.__v635Reload);
 if(reload?.target!=='6.35'||reload?.reason!=='admin-global-refresh')throw new Error('admin reload mismatch: '+JSON.stringify(reload));
 if(adminCalls.length!==1)throw new Error('admin refresh call count: '+adminCalls.length);
 if(adminCalls[0].auth!=='Bearer qa-admin')throw new Error('admin refresh auth mismatch: '+adminCalls[0].auth);
 if(adminCalls[0].body?.latestVersion!=='6.35')throw new Error('admin refresh version mismatch: '+JSON.stringify(adminCalls[0].body));
 await adminRun.context.close();
 console.log('PASS v6.35 developer header/settings version');
 console.log('PASS developer global logout endpoint + admin hard reload');
 if(errors.length)throw new Error('page errors: '+errors.join(' | '));
}finally{await browser.close();}
