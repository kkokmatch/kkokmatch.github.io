import fs from 'node:fs';
import { chromium, webkit } from 'playwright';

const latest=JSON.parse(fs.readFileSync('latest-version.json','utf8'));
const VERSION=String(latest.semanticVersion||'').replace(/^v/,'');
const members=[
 {id:'mgr',name:'모임장QA',year:1988,gender:'남',age:'30',cls:'B',type:'member',role:'manager',state:'out',totalGames:0},
 {id:'org',name:'운영진QA',year:1990,gender:'여',age:'30',cls:'C',type:'member',role:'organizer',state:'out',totalGames:0}
];
const state={courtCount:8,courtNames:Array.from({length:8},(_,i)=>`${i+1}코트`),members,queue:[],pendingGames:[],games:[],history:[],pairCounts:{}};
const clone=()=>JSON.parse(JSON.stringify(state));

async function run(engine,name){
 const browser=await engine.launch({headless:true});
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const errors=[]; page.on('pageerror',e=>errors.push(String(e?.stack||e)));
 await page.addInitScript(()=>{try{localStorage.setItem('kokmatch_push_denied_notice629',String(Date.now()));localStorage.setItem('kokmatch_install_guide631_seen','1');sessionStorage.setItem('kokmatch_install_later630','1')}catch{}});
 await page.route('https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,data:clone(),profiles:{},groups:[],group:{groupId:'qa',name:'QA'}})}));
 try{
  await page.goto('http://127.0.0.1:4173/?qa=v668',{waitUntil:'networkidle'});
  await page.waitForFunction(v=>window.__kokmatchVersionLock===v&&typeof window.renderAll==='function',VERSION,{timeout:15000});
  await page.evaluate(({state})=>{T='qa';currentGroupId='qa';currentView='members';S=JSON.parse(JSON.stringify(state));window.S=S;me={memberId:'mgr',displayName:'모임장QA',role:'manager',globalAdmin:false,tempOrganizer:false,groupId:'qa'};group={groupId:'qa',name:'QA 모임'};groups=[];normalizeClient();renderAll();document.getElementById('login')?.classList.add('hide');window.__kokmatchSyncRoleAura664?.()},{state:clone()});
  await page.waitForTimeout(650);
  const info=await page.evaluate(()=>{
   const cards=[...document.querySelectorAll('#members .memberCard')];
   const byName=n=>cards.find(c=>String(c.textContent||'').includes(n));
   const mgr=byName('모임장QA'),org=byName('운영진QA');
   const mf=mgr?.querySelector('img.roleAuraManagerImg664'),of=org?.querySelector('img.roleAuraOrganizerImg664');
   const mb=mgr?.querySelector('.roleBadge.role-manager');
   const ms=mf?getComputedStyle(mf):null,os=of?getComputedStyle(of):null,bs=mb?getComputedStyle(mb):null;
   return {
    manager:{exists:!!mf,nw:Number(mf?.naturalWidth||0),opacity:ms?.opacity||'',filter:ms?.filter||'',marker:ms?.getPropertyValue('--km-manager-frame-v668').trim()||''},
    organizer:{exists:!!of,nw:Number(of?.naturalWidth||0),opacity:os?.opacity||'',filter:os?.filter||''},
    badge:{exists:!!mb,color:bs?.color||'',text:(mb?.textContent||'').trim()},
    overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth
   };
  });
  if(!info.manager.exists||info.manager.nw<=0)throw new Error(name+' manager frame missing '+JSON.stringify(info.manager));
  if(info.manager.marker!=='1')throw new Error(name+' manager v668 marker missing '+JSON.stringify(info.manager));
  const op=Number(info.manager.opacity); if(!(op>=.36&&op<=.42))throw new Error(name+' manager opacity unexpected '+op);
  if(!/sepia\(1\)/.test(info.manager.filter)||!/saturate\(8\.5\)/.test(info.manager.filter))throw new Error(name+' manager deep-gold filter missing '+info.manager.filter);
  if(!info.organizer.exists||info.organizer.nw<=0)throw new Error(name+' organizer frame regressed '+JSON.stringify(info.organizer));
  if(info.badge.text!=='모임장')throw new Error(name+' manager badge changed unexpectedly '+JSON.stringify(info.badge));
  if(info.overflow>1)throw new Error(name+' horizontal overflow '+info.overflow);
  if(errors.length)throw new Error(name+' page errors '+errors.join(' | '));
  console.log(`PASS v${VERSION} ${name}: deeper manager gold frame only; organizer/badge preserved`);
 } finally { await browser.close(); }
}

await run(chromium,'chromium-mobile');
await run(webkit,'webkit-mobile');
