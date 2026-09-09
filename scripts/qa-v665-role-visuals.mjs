import fs from 'node:fs';
import { chromium, webkit } from 'playwright';
const latest=JSON.parse(fs.readFileSync('latest-version.json','utf8'));
const VERSION=String(latest.semanticVersion||'').replace(/^v/,'');
const members=[
 {id:'dev',name:'개발자QA',year:1989,gender:'남',age:'30',cls:'A',type:'member',role:'admin',state:'out',totalGames:0},
 {id:'mgr',name:'모임장QA',year:1988,gender:'남',age:'30',cls:'B',type:'member',role:'manager',state:'out',totalGames:0},
 {id:'org',name:'운영진QA',year:1990,gender:'여',age:'30',cls:'C',type:'member',role:'organizer',state:'out',totalGames:0},
 {id:'mem',name:'일반QA',year:1991,gender:'여',age:'30',cls:'D',type:'member',role:'member',state:'out',totalGames:0}
];
const state={courtCount:8,courtNames:Array.from({length:8},(_,i)=>`${i+1}코트`),members,queue:[],pendingGames:[],games:[],history:[],pairCounts:{}};
const clone=()=>JSON.parse(JSON.stringify(state));
async function run(engine,name){
 const browser=await engine.launch({headless:true});
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const errors=[];page.on('pageerror',e=>errors.push(String(e?.stack||e)));
 await page.addInitScript(()=>{try{localStorage.setItem('kokmatch_push_denied_notice629',String(Date.now()));localStorage.setItem('kokmatch_install_guide631_seen','1');sessionStorage.setItem('kokmatch_install_later630','1')}catch{}});
 await page.route('https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,data:clone(),profiles:{},groups:[],group:{groupId:'qa',name:'QA'}})}));
 try{
  await page.goto('http://127.0.0.1:4173/?qa=v665',{waitUntil:'networkidle'});
  await page.waitForFunction(v=>window.__kokmatchVersionLock===v&&typeof window.renderAll==='function',VERSION,{timeout:15000});
  await page.evaluate(({state})=>{T='qa-token';currentGroupId='qa';currentView='members';S=JSON.parse(JSON.stringify(state));window.S=S;me={memberId:'mgr',displayName:'모임장QA',role:'manager',globalAdmin:false,tempOrganizer:false,groupId:'qa'};group={groupId:'qa',name:'QA 모임'};groups=[];normalizeClient();renderAll();document.getElementById('login')?.classList.add('hide');window.__kokmatchSyncRoleAura664?.();window.__kokmatchApplyChallenger659?.()},{state:clone()});
  await page.waitForTimeout(900);
  const info=await page.evaluate(()=>{
   const byId=id=>[...document.querySelectorAll('#members .memberCard')].find(c=>String(c.dataset.memberId22||c.dataset.memberId||c.dataset.memberId46||c.dataset.memberId80||'')===id)||null;
   const target=c=>c?.querySelector('.profileIdentity21,.profileAvatar53,.avatar,.profilePreview53')||null;
   const frame=(id,sel)=>{const c=byId(id),t=target(c),img=t?.querySelector(sel),r=t?.getBoundingClientRect(),ir=img?.getBoundingClientRect();return{card:!!c,target:!!t,img:!!img,nw:Number(img?.naturalWidth||0),src:String(img?.getAttribute('src')||''),opacity:img?getComputedStyle(img).opacity:'',filter:img?getComputedStyle(img).filter:'',tw:r?.width||0,iw:ir?.width||0,role:img?.dataset?.roleAura664||''}};
   const badge=id=>{const c=byId(id),b=c?.querySelector('.roleBadge');if(!b)return null;const s=getComputedStyle(b);return{text:(b.textContent||'').trim(),display:s.display,fontSize:s.fontSize,fontWeight:s.fontWeight,paddingTop:s.paddingTop,paddingRight:s.paddingRight,borderRadius:s.borderRadius,backgroundImage:s.backgroundImage,marker:s.getPropertyValue('--km-dev-badge-v665').trim()}};
   return{dev:frame('dev','img.devFrame661'),mgr:frame('mgr','img.roleAura664'),org:frame('org','img.roleAura664'),mem:frame('mem','img.roleAura664,img.devFrame661'),bd:badge('dev'),bm:badge('mgr'),bo:badge('org'),overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth};
  });
  if(!info.dev.img||info.dev.nw<=0)throw new Error(name+' developer prism missing '+JSON.stringify(info.dev));
  if(!info.org.img||info.org.nw<=0||info.org.role!=='organizer')throw new Error(name+' organizer aura missing '+JSON.stringify(info.org));
  if(!info.org.src.includes('/assets/organizer-silver-aura-v665.webp'))throw new Error(name+' organizer is not using selected silver asset '+info.org.src);
  if(Number(info.org.opacity)<.55)throw new Error(name+' organizer silver aura too faint '+info.org.opacity);
  if(!/contrast\(1\.18\)/.test(info.org.filter))throw new Error(name+' organizer silver contrast filter missing '+info.org.filter);
  if(info.org.iw<=info.org.tw*1.25)throw new Error(name+' organizer aura not larger than profile '+JSON.stringify(info.org));
  if(info.mem.img)throw new Error(name+' ordinary member received aura '+JSON.stringify(info.mem));
  if(info.bd?.marker!=='1')throw new Error(name+' developer prism badge marker missing '+JSON.stringify(info.bd));
  if(info.bd?.backgroundImage==='none')throw new Error(name+' developer prism badge texture missing');
  for(const key of ['fontSize','fontWeight','paddingTop','paddingRight','borderRadius','display']){if(info.bd?.[key]!==info.bm?.[key]||info.bd?.[key]!==info.bo?.[key])throw new Error(name+' role badge geometry mismatch '+key+' '+JSON.stringify({dev:info.bd,mgr:info.bm,org:info.bo}))}
  if(info.overflow>1)throw new Error(name+' horizontal overflow '+info.overflow);if(errors.length)throw new Error(name+' page errors '+errors.join(' | '));
  console.log(`PASS v${VERSION} ${name}: selected organizer silver aura + higher white-card contrast + developer prism badge`);
 }finally{await browser.close()}
}
await run(chromium,'chromium-mobile');
await run(webkit,'webkit-mobile');
