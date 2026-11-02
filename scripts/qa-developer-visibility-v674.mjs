import {boardFixture} from './qa-board-fixture.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const latest=JSON.parse(fs.readFileSync('latest-version.json','utf8'));
const VERSION=String(latest.semanticVersion||'').replace(/^v/,'');
const now=Date.now();
const roles=[
 ['developer',{memberId:'dev',displayName:'박태영',role:'admin',globalAdmin:true,tempOrganizer:false,groupId:'qa'}],
 ['member',{memberId:'m1',displayName:'일반회원',role:'member',globalAdmin:false,tempOrganizer:false,groupId:'qa'}],
 ['guest',{memberId:'g1',displayName:'게스트회원',role:'member',globalAdmin:false,tempOrganizer:false,groupId:'qa'}]
];
function makeState(){return {courtCount:4,courtNames:['1코트','2코트','3코트','4코트'],adminBadgeVisibility:'hidden',autoGame:{enabled:false},members:[
 {id:'dev',name:'박태영',year:1989,age:'30',cls:'B',gender:'남',type:'member',role:'admin',state:'waiting',joinedAt:now-25*60000,waitDay:'2026-09-11',waitTotalMs:40*60000,totalGames:10},
 {id:'m1',name:'일반회원',year:1991,age:'30',cls:'C',gender:'남',type:'member',role:'member',state:'waiting',joinedAt:now-12*60000,waitDay:'2026-09-11',waitTotalMs:15*60000,totalGames:2},
 {id:'g1',name:'게스트회원',year:1992,age:'30',cls:'D',gender:'여',type:'guest',role:'member',state:'waiting',joinedAt:now-10*60000,waitDay:'2026-09-11',waitTotalMs:13*60000,totalGames:1,inviter:'일반회원'}
 ],queue:['dev','m1','g1'],pendingGames:[],games:[],history:[
  {id:'h1',players:['dev','x','y','z'],endedAt:now-60*60000},{id:'h2',players:['dev','a','b','c'],endedAt:now-50*60000}
 ],pairCounts:{},attendancePolls:[]}}
const clone=x=>JSON.parse(JSON.stringify(x));
const browser=await chromium.launch({headless:true});
for(const [roleKey,identity] of roles){
 const state=makeState();const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const page=await context.newPage();
 await page.addInitScript(()=>{try{localStorage.setItem('kokmatch_push_denied_notice629',String(Date.now()));localStorage.setItem('kokmatch_install_guide631_seen','1');sessionStorage.setItem('kokmatch_install_later630','1')}catch{}});
 await page.route('https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/**',async route=>{
   const url=new URL(route.request().url());
   if(url.pathname.endsWith('/kokmatch-state-v46'))return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({data:clone(state),group:{groupId:'qa',name:'QA'},user:identity,memberCount:state.members.length})});
   if(url.pathname.endsWith('/kokmatch-roster-v654')||url.pathname.endsWith('/kokmatch-roster-v653'))return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({members:clone(state.members),memberCount:state.members.length,adminBadgeVisibility:state.adminBadgeVisibility})});
   if(url.pathname.endsWith('/kokmatch-settings-v43')){
     const body=JSON.parse(route.request().postData()||'{}');
     state.adminBadgeVisibility=body.mode==='all'?'all':'hidden';
     return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,mode:state.adminBadgeVisibility,data:clone(state)})});
   }
   return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,data:clone(state),group:{groupId:'qa',name:'QA'},user:identity,groups:[]})});
 });
 await boardFixture(page,()=>state,identity);
 await page.goto('http://127.0.0.1:4173/?qa=dev674',{waitUntil:'networkidle'});
 await page.waitForFunction(v=>window.__kokmatchVersionLock===v&&window.__kokmatchDeveloperVisible674===v,VERSION,{timeout:15000});
 await page.evaluate(({state,identity})=>{T='qa-token';localStorage.setItem('kokmatch_token',T);currentGroupId='qa';S=JSON.parse(JSON.stringify(state));window.S=S;me=identity;group={groupId:'qa',name:'QA'};groups=[];normalizeClient();document.getElementById('login')?.classList.add('hide');currentView='members';renderAll();goView('members')},{state:clone(state),identity});
 await page.waitForTimeout(180);
 assert.equal(await page.evaluate(()=>S.adminBadgeVisibility),'hidden',`${roleKey}: role-frame visibility did not keep the group default hidden`);
 assert.equal(await page.evaluate(()=>document.documentElement.classList.contains('kokmatchRoleFramesHidden681')),true,`${roleKey}: hidden role-frame mode CSS state missing`);

 const devMember=page.locator('#members .memberCard').filter({hasText:'박태영'}).first();
 await devMember.waitFor({state:'visible'});
 assert.equal(await devMember.locator('.roleBadge.role-global').count(),1,`${roleKey}: developer badge missing in member roster`);
 assert.equal(await devMember.locator('.roleBadge.role-member44').count(),0,`${roleKey}: developer was masked as general member`);
 const memberFrame=devMember.locator('.devChallenger659 > img.devFrame661').first();
 await memberFrame.waitFor({state:'attached'});
 assert((await memberFrame.getAttribute('src'))?.includes('dev-prism-frame-v662.webp'),`${roleKey}: developer Challenger frame asset missing`);
 assert.equal(await memberFrame.isVisible(),false,`${roleKey}: developer frame ignored hidden group setting`);

 await page.evaluate(()=>{currentView='settings';renderSettings();goView('settings')});
 await page.waitForTimeout(80);
 const roleCard=page.locator('#roleFrameSetting681');
 if(roleKey==='developer'){
   assert.equal(await roleCard.count(),1,'developer: role-frame setting missing');
 }else{
   assert.equal(await roleCard.count(),0,`${roleKey}: ordinary users must not see role-frame setting`);
 }

 // This regression test validates queue decoration, not navigation. Activate the queue
 // deterministically so late mocked state responses cannot leave the test on settings.
 await page.evaluate(()=>{
   currentView='queue';renderQueue();
   document.querySelectorAll('.view').forEach(v=>v.classList.toggle('on',v.id==='queue'));
   document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('on',b.dataset.v==='queue'));
 });
 await page.waitForTimeout(120);
 const magnet=page.locator('#queue .mbMagnet[data-id="dev"]');await magnet.waitFor();
 assert.match(await magnet.getAttribute('aria-label'),/박태영.*B조.*대기.*2게임.*개발자/);
 assert.equal(await magnet.evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(0, 207, 198)');
 await context.close();
}
await browser.close();
console.log('PASS developer badge stays visible, role frames default hidden, role-setting visibility is permission-scoped, magnet retains grade and accessible game count');
