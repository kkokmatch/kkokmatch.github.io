import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const latest=JSON.parse(fs.readFileSync('latest-version.json','utf8'));
const VERSION=String(latest.semanticVersion||'').replace(/^v/,'');
const now=Date.now();
const members=[
 {id:'dev',name:'개발자',year:1989,age:'30',cls:'B',gender:'남',type:'member',role:'admin',state:'waiting',joinedAt:now-600000,totalGames:2},
 {id:'mgr',name:'모임장',year:1990,age:'30',cls:'B',gender:'남',type:'member',role:'manager',state:'waiting',joinedAt:now-590000,totalGames:2},
 {id:'org',name:'운영진',year:1991,age:'30',cls:'C',gender:'여',type:'member',role:'organizer',state:'waiting',joinedAt:now-580000,totalGames:1},
 ...Array.from({length:21},(_,i)=>({id:'m'+i,name:'회원'+String(i+1).padStart(2,'0'),year:1992,age:'30',cls:'C',gender:i%2?'여':'남',type:'member',role:'member',state:'out',joinedAt:now-(i+20)*10000,totalGames:0}))
];
const state={courtCount:4,courtNames:['1코트','2코트','3코트','4코트'],adminBadgeVisibility:'hidden',autoGame:{enabled:false},members,queue:['dev','mgr','org'],pendingGames:[],games:[],history:[],pairCounts:{},attendancePolls:[]};
const clone=x=>JSON.parse(JSON.stringify(x));
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const page=await context.newPage();
const settingsCalls=[];
let qaIdentity681={memberId:'mgr',displayName:'모임장',role:'manager',globalAdmin:false,tempOrganizer:false,groupId:'qa'};
await page.addInitScript(()=>{try{localStorage.setItem('kokmatch_push_denied_notice629',String(Date.now()));localStorage.setItem('kokmatch_install_guide631_seen','1');sessionStorage.setItem('kokmatch_install_later630','1')}catch{}});
await page.route('https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/**',async route=>{
 const url=new URL(route.request().url());
 if(url.pathname.endsWith('/kokmatch-state-v46'))return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({data:clone(state),group:{groupId:'qa',name:'QA'},user:{...qaIdentity681,groupId:'qa'},memberCount:state.members.length})});
 if(url.pathname.endsWith('/kokmatch-roster-v654')||url.pathname.endsWith('/kokmatch-roster-v653'))return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({members:clone(state.members),memberCount:state.members.length,adminBadgeVisibility:state.adminBadgeVisibility})});
 if(url.pathname.endsWith('/kokmatch-settings-v43')){const body=JSON.parse(route.request().postData()||'{}');settingsCalls.push(body);state.adminBadgeVisibility=body.mode==='all'?'all':'hidden';return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,mode:state.adminBadgeVisibility,data:clone(state)})})}
 return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,data:clone(state),group:{groupId:'qa',name:'QA'},user:{...qaIdentity681,groupId:'qa'},groups:[]})});
});
await page.goto('http://127.0.0.1:4173/?qa=v681',{waitUntil:'networkidle'});
await page.waitForFunction(v=>window.__kokmatchVersionLock===v,VERSION,{timeout:15000});
await page.evaluate(({state})=>{T='qa-token';localStorage.setItem('kokmatch_token',T);currentGroupId='qa';localStorage.setItem('kokmatch_group_id','qa');S=JSON.parse(JSON.stringify(state));window.S=S;me={memberId:'mgr',displayName:'모임장',role:'manager',globalAdmin:false,tempOrganizer:false,groupId:'qa'};group={groupId:'qa',name:'QA'};groups=[];normalizeClient();document.getElementById('login')?.classList.add('hide');currentView='members';renderAll();goView('members')},{state:clone(state)});
await page.waitForTimeout(120);
let pager=page.locator('#members .memberPager46');await pager.waitFor({state:'visible'});
assert.match((await pager.innerText()).replace(/\s+/g,' '),/1\s*\/\s*3/,'member roster did not start on page 1/3');
await pager.getByRole('button',{name:'다음'}).click();
await page.waitForTimeout(120);
pager=page.locator('#members .memberPager46');
assert.match((await pager.innerText()).replace(/\s+/g,' '),/2\s*\/\s*3/,'member roster next page click did not move to page 2');

await page.evaluate(()=>{currentView='settings';renderAll();goView('settings')});
await page.waitForTimeout(80);
const court=page.locator('#courtCountInput');await court.focus();await court.fill('');
await page.evaluate(()=>renderAll());await page.waitForTimeout(50);
assert.equal(await page.evaluate(()=>document.activeElement?.id),'courtCountInput','court count input lost focus while editing');
assert.equal(await page.locator('#courtCountInput').inputValue(),'','empty court-count draft was replaced by a rerender');
await page.evaluate(()=>document.activeElement?.blur());
await page.evaluate(()=>renderSettings());await page.waitForTimeout(50);
assert.equal(await page.locator('#roleFrameSetting681').count(),1,'manager role-frame setting missing');
assert.equal(await page.evaluate(()=>document.documentElement.classList.contains('kokmatchRoleFramesHidden681')),true,'hidden must be the default frame mode');
await page.locator('#roleFrameSetting681 button',{hasText:'보이기'}).click();await page.waitForTimeout(80);
assert.equal(settingsCalls.at(-1)?.action,'set_admin_badge_visibility','frame setting API action mismatch');
assert.equal(settingsCalls.at(-1)?.mode,'all','show mode was not saved');
assert.equal(await page.evaluate(()=>document.documentElement.classList.contains('kokmatchRoleFramesHidden681')),false,'show mode did not reveal role frames');
for(const identity of [
 {memberId:'org',displayName:'운영진',role:'organizer',globalAdmin:false},
 {memberId:'dev',displayName:'개발자',role:'admin',globalAdmin:true},
]){qaIdentity681={...identity,tempOrganizer:false,groupId:'qa'};await page.waitForTimeout(80);const roleCheck=await page.evaluate(identity=>{me=identity;renderSettings();return{count:document.querySelectorAll('#roleFrameSetting681').length,role:String(me?.role||''),globalAdmin:!!me?.globalAdmin}},identity);assert.equal(roleCheck.count,1,identity.displayName+' setting missing')}
qaIdentity681={memberId:'m0',displayName:'회원01',role:'member',globalAdmin:false,tempOrganizer:false,groupId:'qa'};await page.waitForTimeout(80);const generalRoleCheck=await page.evaluate(()=>{me={memberId:'m0',displayName:'회원01',role:'member',globalAdmin:false};renderSettings();return document.querySelectorAll('#roleFrameSetting681').length});
assert.equal(generalRoleCheck,0,'general member must not see role-frame setting');
await context.close();await browser.close();
console.log('PASS v6.81 roster paging + court focus + group role-frame visibility');
