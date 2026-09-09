import fs from 'node:fs';
import { chromium, webkit } from 'playwright';
const latest=JSON.parse(fs.readFileSync('latest-version.json','utf8'));
const VERSION=String(latest.semanticVersion||'').replace(/^v/,'');
const now=Date.now();
const members=[
 {id:'dev',name:'개발자QA',year:1989,gender:'남',age:'30',cls:'A',type:'member',role:'admin',state:'out',totalGames:0},
 {id:'mgr',name:'모임장QA',year:1988,gender:'남',age:'30',cls:'B',type:'member',role:'manager',state:'out',totalGames:0},
 {id:'org',name:'운영진QA',year:1990,gender:'여',age:'30',cls:'C',type:'member',role:'organizer',state:'out',totalGames:0},
 {id:'q1',name:'대기QA',year:1991,gender:'남',age:'30',cls:'D',type:'member',role:'member',state:'waiting',joinedAt:now-8*60000,totalGames:0}
];
const state={courtCount:8,courtNames:Array.from({length:8},(_,i)=>`${i+1}코트`),members,queue:['q1'],pendingGames:[],games:[],history:[],pairCounts:{}};
const clone=()=>JSON.parse(JSON.stringify(state));
async function run(engine,name){
 const browser=await engine.launch({headless:true});
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const errors=[];page.on('pageerror',e=>errors.push(String(e?.stack||e)));
 await page.addInitScript(()=>{try{localStorage.setItem('kokmatch_push_denied_notice629',String(Date.now()));localStorage.setItem('kokmatch_install_guide631_seen','1');sessionStorage.setItem('kokmatch_install_later630','1')}catch{}});
 await page.route('https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,data:clone(),profiles:{},groups:[],group:{groupId:'qa',name:'QA'}})}));
 try{
  await page.goto('http://127.0.0.1:4173/?qa=v666',{waitUntil:'networkidle'});
  await page.waitForFunction(v=>window.__kokmatchVersionLock===v&&typeof window.renderAll==='function',VERSION,{timeout:15000});
  await page.evaluate(({state})=>{T='qa-token';currentGroupId='qa';currentView='members';S=JSON.parse(JSON.stringify(state));window.S=S;me={memberId:'mgr',displayName:'모임장QA',role:'manager',globalAdmin:false,tempOrganizer:false,groupId:'qa'};group={groupId:'qa',name:'QA 모임'};groups=[];normalizeClient();renderAll();document.getElementById('login')?.classList.add('hide')},{state:clone()});
  await page.waitForTimeout(500);
  const badgeInfo=await page.evaluate(()=>{
   const card=id=>[...document.querySelectorAll('#members .memberCard')].find(c=>String(c.dataset.memberId22||c.dataset.memberId||c.dataset.memberId46||c.dataset.memberId80||'')===id)||null;
   const read=(id,sel)=>{const b=card(id)?.querySelector(sel);if(!b)return null;const s=getComputedStyle(b);return{text:(b.textContent||'').trim(),fontSize:s.fontSize,fontWeight:s.fontWeight,paddingTop:s.paddingTop,paddingRight:s.paddingRight,borderRadius:s.borderRadius,display:s.display,bg:s.backgroundImage,color:s.color,manager:s.getPropertyValue('--km-manager-badge-v666').trim(),organizer:s.getPropertyValue('--km-organizer-badge-v666').trim()}};
   return{dev:read('dev','.roleBadge.role-global'),mgr:read('mgr','.roleBadge.role-manager'),org:read('org','.roleBadge.role-organizer')};
  });
  for(const k of ['fontSize','fontWeight','paddingTop','paddingRight','borderRadius','display']){
   if(badgeInfo.dev?.[k]!==badgeInfo.mgr?.[k]||badgeInfo.dev?.[k]!==badgeInfo.org?.[k])throw new Error(name+' badge geometry mismatch '+k+' '+JSON.stringify(badgeInfo));
  }
  if(badgeInfo.mgr?.manager!=='1'||badgeInfo.org?.organizer!=='1')throw new Error(name+' role badge markers missing '+JSON.stringify(badgeInfo));
  if(!badgeInfo.mgr?.bg?.includes('linear-gradient')||!badgeInfo.org?.bg?.includes('linear-gradient'))throw new Error(name+' role aura material gradients missing '+JSON.stringify(badgeInfo));

  await page.evaluate(()=>goView('queue'));
  await page.waitForTimeout(800);
  const queue=await page.evaluate(()=>{
   const c=document.querySelector('#queue .queueCard54,#queue .queueCard53,#queue .queueCard');if(!c)return null;
   const name=c.querySelector('.name');const metas=[...c.querySelectorAll('.meta')];const wait=metas.find(x=>/대기/.test(String(x.textContent||'')))||null;
   return{gamecntTotal:c.querySelectorAll('.gamecnt').length,gamecntInName:name?.querySelectorAll('.gamecnt').length||0,gamecntInWait:wait?.querySelectorAll('.gamecnt,.queueGameCount658').length||0,sepInWait:wait?.querySelectorAll('.queueMetaSep658').length||0,nameText:(name?.textContent||'').trim(),waitText:(wait?.textContent||'').trim(),overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth};
  });
  if(!queue)throw new Error(name+' personal queue card missing');
  if(queue.gamecntTotal!==1||queue.gamecntInName!==1)throw new Error(name+' expected exactly one game-count badge in name row '+JSON.stringify(queue));
  if(queue.gamecntInWait!==0||queue.sepInWait!==0||/게임\s*\d+회/.test(queue.waitText))throw new Error(name+' wait row still contains game count '+JSON.stringify(queue));
  if(!/게임\s*0회/.test(queue.nameText))throw new Error(name+' game count badge text missing '+JSON.stringify(queue));
  if(queue.overflow>1)throw new Error(name+' horizontal overflow '+queue.overflow);
  if(errors.length)throw new Error(name+' page errors '+errors.join(' | '));
  console.log(`PASS v${VERSION} ${name}: gold manager badge + silver organizer badge + one queue game-count badge`);
 }finally{await browser.close()}
}
await run(chromium,'chromium-mobile');
await run(webkit,'webkit-mobile');
