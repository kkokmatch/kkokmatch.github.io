import { chromium } from 'playwright';

const state={courtCount:8,courtNames:Array.from({length:8},(_,i)=>`${i+1}코트`),queue:['s1'],pendingGames:[],games:[],history:[],pairCounts:{},members:[
  {id:'mgr',name:'관리자',year:1985,gender:'남',age:'40',cls:'B',type:'member',role:'manager',state:'out',totalGames:0},
  {id:'s1',name:'S급테스트',year:1990,gender:'여',age:'30',cls:'S',type:'member',role:'member',state:'waiting',joinedAt:Date.now()-60000,totalGames:0},
  {id:'dev',name:'개발자테스트',year:1989,gender:'남',age:'30',cls:'A',type:'member',role:'admin',state:'spectator',totalGames:0}
]};
const clone=()=>JSON.parse(JSON.stringify(state));
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
await page.addInitScript(()=>{try{localStorage.setItem('kokmatch_push_denied_notice629',String(Date.now()));localStorage.setItem('kokmatch_install_guide631_seen','1');sessionStorage.setItem('kokmatch_install_later630','1');const kill=()=>document.getElementById('pwaPrompt629')?.remove();new MutationObserver(kill).observe(document,{childList:true,subtree:true})}catch{}});
await page.route('https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/**',async route=>{
  const url=new URL(route.request().url());
  if(url.pathname.includes('profile'))return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({profiles:{},success:true})});
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,data:clone(),groups:[],group:{groupId:'qa',name:'QA'},user:{memberId:'mgr',displayName:'관리자',role:'manager',globalAdmin:false,groupId:'qa'}})});
});
try{
  await page.goto('http://127.0.0.1:4173/?qa=v648',{waitUntil:'load'});
  await page.waitForFunction(()=>window.__kokmatchVersionLock==='6.48'&&typeof window.renderAll==='function',{timeout:15000});
  await page.evaluate(s=>{T='qa-token';currentGroupId='qa';currentView='members';S=JSON.parse(JSON.stringify(s));window.S=S;me={memberId:'mgr',displayName:'관리자',role:'manager',globalAdmin:false,tempOrganizer:false,groupId:'qa'};group={groupId:'qa',name:'QA'};groups=[];normalizeClient();renderAll();document.getElementById('login')?.classList.add('hide')},clone());
  await page.waitForTimeout(150);

  const memberS=page.locator('#members .memberCard[data-grade-v6="S"]').filter({hasText:'S급테스트'}).first();
  if(await memberS.count()!==1)throw new Error('member roster S card missing');
  const memberStyle=await memberS.evaluate(el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return{bg:s.backgroundImage,size:s.backgroundSize,pos:s.backgroundPosition,border:s.borderLeftWidth,w:r.width,h:r.height}});
  if(!memberStyle.bg.includes('linear-gradient'))throw new Error('member S stripe is not rainbow: '+JSON.stringify(memberStyle));
  if(memberStyle.border!=='5px')throw new Error('member S stripe width changed: '+memberStyle.border);

  const devBadge=page.locator('#members .roleBadge.role-global').filter({hasText:'개발자'}).first();
  if(await devBadge.count()!==1)throw new Error('developer badge missing');
  const devStyle=await devBadge.evaluate(el=>{const s=getComputedStyle(el);return{bg:s.backgroundImage,color:s.color,border:s.borderTopColor}});
  if(!devStyle.bg.includes('linear-gradient'))throw new Error('developer badge is not rainbow: '+JSON.stringify(devStyle));

  await page.evaluate(()=>{currentView='queue';renderQueue();document.querySelectorAll('.view').forEach(v=>v.classList.toggle('on',v.id==='queue'))});
  await page.waitForTimeout(100);
  const queueS=page.locator('#queue .queueCard54[data-queue-grade642="S"]').filter({hasText:'S급테스트'}).first();
  if(await queueS.count()!==1)throw new Error('personal queue S stripe data missing');
  const queueStyle=await queueS.evaluate(el=>{const s=getComputedStyle(el),a=getComputedStyle(el,'::after'),r=el.getBoundingClientRect();return{bg:s.backgroundImage,size:s.backgroundSize,pos:s.backgroundPosition,border:s.borderRightWidth,wm:a.content,wmBg:a.backgroundImage,w:r.width,h:r.height}});
  if(!queueStyle.bg.includes('linear-gradient'))throw new Error('queue S stripe is not rainbow: '+JSON.stringify(queueStyle));
  if(queueStyle.border!=='5px')throw new Error('queue S stripe width mismatch: '+queueStyle.border);
  if(!String(queueStyle.wm).includes('S')||!queueStyle.wmBg.includes('linear-gradient'))throw new Error('v6.47 S watermark was damaged: '+JSON.stringify(queueStyle));

  console.log('PASS v6.48 member roster S rainbow stripe');
  console.log('PASS v6.48 personal queue S rainbow stripe + existing S watermark');
  console.log('PASS v6.48 rainbow developer badge');
}finally{await browser.close()}
