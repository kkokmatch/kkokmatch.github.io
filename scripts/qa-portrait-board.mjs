import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
import {boardFixture} from './qa-board-fixture.mjs';

for(const engine of [chromium,webkit]){
 const browser=await engine.launch();
 try{
  const page=await browser.newPage({viewport:{width:402,height:874},hasTouch:true,isMobile:true,serviceWorkers:'block'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const grades=['S','A','B','C','D','E'];
  const members=grades.map((cls,i)=>({id:'m'+i,name:'회원'+i,cls,age:'30',year:1992,gender:'남',type:'member',role:i?'member':'manager',state:'waiting',joinedAt:Date.now()-100*60000}));
  const s={courtCount:5,courtNames:[],members,queue:members.map(m=>m.id),games:[],pendingGames:[],history:[],pairCounts:{},autoGame:{enabled:false}};
  const me={memberId:'m0',role:'manager',displayName:'회원0',groupId:'qa'};
  await page.route('https://**',r=>r.fulfill({json:{success:true,data:s,user:me,group:{groupId:'qa',name:'QA'},profiles:{},groups:[]}}));
  await boardFixture(page,()=>s,me);
  await page.goto('http://127.0.0.1:4173/');
  await page.evaluate(({s,user})=>{T='qa-token';currentGroupId='qa';S=s;me=user;group={name:'QA',groupId:'qa'};groups=[];normalizeClient();renderAll();document.querySelector('#login').classList.add('hide');goView('queue');},{s,user:me});
  await page.waitForSelector('#queue > #kmBoard692 .mbMagnet');
  for(const width of [320,375,402,430,768,1024]){
   await page.setViewportSize({width,height:874});
   const result=await page.evaluate(grades=>{
    const root=document.querySelector('#queue > #kmBoard692'),style=getComputedStyle(root);
    const grid=n=>getComputedStyle(root.querySelector(n)).gridTemplateColumns.split(' ').length;
    const colors=grades.map((g,i)=>{
     const chip=root.querySelector('[data-id="m'+i+'"]'),badge=document.querySelector('#members .grade-'+g.toLowerCase()+'50');
     const signature=e=>[getComputedStyle(e).backgroundColor,getComputedStyle(e).backgroundImage,getComputedStyle(e).color];
     return {chip:signature(chip),badge:signature(badge),lines:chip.children.length,text:chip.lastElementChild.textContent,w:chip.clientWidth};
    });
    return {position:style.position,nativeNav:!!document.querySelector('#nav button[data-v=queue].on'),legacy:!!document.querySelector('#mbLaunch,#queue .queueCard,#queue .composer54,[data-do=list]'),overflow:document.documentElement.scrollWidth-innerWidth,courts:grid('.mbCourts'),queues:grid('.mbQueues'),colors,groups:root.querySelectorAll('.mbFree article').length};
   },grades);
   assert.equal(result.position,'static');assert(result.nativeNav);assert(!result.legacy);assert(result.overflow<=1);
   assert.equal(result.courts,width<700?2:4);assert.equal(result.queues,width<700?1:2);assert.equal(result.groups,6);
   for(const c of result.colors){assert.deepEqual(c.chip,c.badge);assert.equal(c.lines,3);assert.match(c.text,/^100분 대기$/);assert(c.w>=44);}
  }
  await page.evaluate(()=>goView('members'));await page.waitForSelector('#kmBoard692',{state:'detached'});
  await page.evaluate(()=>goView('queue'));await page.waitForSelector('#queue > #kmBoard692 .mbMagnet');assert.equal(await page.locator('#kmBoard692').count(),1);assert.deepEqual(errors,[]);
  console.log('PASS',engine.name(),'inline game-wait tab, six badge colors, portrait widths, 100-minute labels and tab reentry');
 }finally{await browser.close();}
}
