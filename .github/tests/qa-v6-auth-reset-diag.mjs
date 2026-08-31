import {webkit,devices} from 'playwright';
const browser=await webkit.launch({headless:true});
const page=await browser.newPage({...devices['iPhone 13'],userAgent:devices['iPhone 13'].userAgent+' KAKAOTALK'});
page.setDefaultTimeout(15000);
page.on('console',m=>console.log('BROWSER',m.type(),m.text()));
page.on('framenavigated',f=>{if(f===page.mainFrame())console.log('NAVIGATED',f.url())});
const calls=[];
const member=(id,name,role='member')=>({id,name,gender:'남',cls:'C',role,year:1990,age:'30',type:'member',state:'out',totalGames:0,joinedAt:null});
const members=[member('mgr','배솜다리','manager'),...Array.from({length:12},(_,i)=>member('m'+(i+1),'회원'+(i+1)))];
const state={data:{dayKey:'2026-08-31',courtCount:4,courtNames:['1코트','2코트','3코트','4코트'],members,queue:[],pendingGames:[],games:[],history:[],pairCounts:{},attendancePolls:[]},user:{role:'manager',displayName:'배솜다리',memberId:'mgr',globalAdmin:false,groupId:'grp_a',groupName:'테스트모임'},group:{groupId:'grp_a',name:'테스트모임'},groups:[{groupId:'grp_a',name:'테스트모임'}]};
await page.addInitScript(()=>{
 localStorage.setItem('kokmatch_token','qa-token-a');localStorage.setItem('kokmatch_group_id','grp_a');
 window.__storageTrace=[];
 const rm=Storage.prototype.removeItem,st=Storage.prototype.setItem,cl=Storage.prototype.clear;
 Storage.prototype.removeItem=function(k){if(String(k).includes('kokmatch')){const row={op:'remove',k:String(k),stack:new Error('storage remove '+k).stack};window.__storageTrace.push(row);console.error('STORAGE_REMOVE',JSON.stringify(row))}return rm.call(this,k)};
 Storage.prototype.setItem=function(k,v){if(String(k)==='kokmatch_token'||String(k)==='kokmatch_group_id'){const row={op:'set',k:String(k),v:String(v),stack:new Error('storage set '+k).stack};window.__storageTrace.push(row);console.warn('STORAGE_SET',JSON.stringify(row))}return st.call(this,k,v)};
 Storage.prototype.clear=function(){const row={op:'clear',stack:new Error('storage clear').stack};window.__storageTrace.push(row);console.error('STORAGE_CLEAR',JSON.stringify(row));return cl.call(this)};
});
await page.route('**/latest-version.json*',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({version:60,label:'6.0',semanticVersion:'6.0'})}));
await page.route('https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/**',async route=>{
 const req=route.request(),u=new URL(req.url()),path=u.pathname;let body={};try{body=req.postData()?JSON.parse(req.postData()):{}}catch{}
 calls.push({path,api:u.searchParams.get('api'),method:req.method(),body});
 let out={data:state.data};
 if(path.endsWith('/kokmatch-multi-api')){const api=u.searchParams.get('api');if(api==='state')out=state;else if(api==='action')out={data:state.data}}
 else if(path.endsWith('/kokmatch-state-v46'))out={...state,memberCount:members.length};
 else if(path.endsWith('/kokmatch-auth-v38')){if(body.action==='my_memberships')out={memberships:[{groupId:'grp_a',groupName:'테스트모임',memberId:'mgr',role:'manager',roleLabel:'모임관리자'}]};else if(body.action==='pin_status')out={currentPinDefault:false,role:'manager'};else out={success:true,keepToken:true,groupId:'grp_a',groupName:'테스트모임',memberId:'mgr',role:'manager',roleLabel:'모임관리자'}}
 else if(path.endsWith('/kokmatch-profile-v53'))out={profiles:{}};
 else if(path.endsWith('/kokmatch-updater'))out={version:60,label:'6.0',semanticVersion:'6.0',autoUpdate:false,ready:true,launchUrl:'https://kkokmatch.github.io/'};
 else if(path.includes('login'))out={success:true};
 await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(out)});
});
await page.goto('http://127.0.0.1:4173/?qa=v6authdiag',{waitUntil:'domcontentloaded'});
for(const ms of [0,200,600,1200,2500]){
 if(ms)await page.waitForTimeout(ms-(ms===200?0:ms===600?200:ms===1200?600:1200));
 const snap=await page.evaluate(()=>({href:location.href,token:localStorage.getItem('kokmatch_token'),gid:localStorage.getItem('kokmatch_group_id'),standalone:window.__kokmatchStandalone||'',core:window.__kokmatchInteractionCore||'',roster:window.__kokmatchRosterCanonical||'',me:(()=>{try{return me}catch{return window.me||null}})(),currentGroup:(()=>{try{return currentGroupId}catch{return window.currentGroupId||''}})(),cards:document.querySelectorAll('#members .memberCard').length,loginHidden:document.getElementById('login')?.classList.contains('hide')||false,trace:window.__storageTrace||[]}));
 console.log('SNAP',ms,JSON.stringify(snap));
}
console.log('API_CALLS',JSON.stringify(calls));
await browser.close();