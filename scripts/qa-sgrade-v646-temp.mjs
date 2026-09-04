import { chromium } from 'playwright';
const state={courtCount:8,courtNames:Array.from({length:8},(_,i)=>`${i+1}코트`),queue:['s1'],pendingGames:[],games:[],history:[],pairCounts:{},members:[
  {id:'mgr',name:'관리자',year:1985,gender:'남',age:'40',cls:'B',type:'member',role:'manager',state:'out',totalGames:0},
  {id:'s1',name:'S급테스트',year:1990,gender:'여',age:'30',cls:'S',type:'member',role:'member',state:'waiting',joinedAt:Date.now()-60000,totalGames:0}
]};
const clone=()=>JSON.parse(JSON.stringify(state));
let saveBody=null;
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
await page.addInitScript(()=>{localStorage.setItem('kokmatch_push_denied_notice629',String(Date.now()));localStorage.setItem('kokmatch_install_guide631_seen','1');sessionStorage.setItem('kokmatch_install_later630','1');new MutationObserver(()=>document.getElementById('pwaPrompt629')?.remove()).observe(document,{childList:true,subtree:true})});
await page.route('https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/**',async route=>{
  const req=route.request(),url=new URL(req.url());let b={};try{b=JSON.parse(req.postData()||'{}')}catch{}
  if(url.pathname.endsWith('/kokmatch-member-v646')){saveBody=b;const m=state.members.find(x=>x.id===String(b.memberId||''))||state.members[1];Object.assign(m,{name:b.name,year:b.year,gender:b.gender,cls:b.cls,type:b.type,role:b.role,inviter:b.inviter||''});return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,member:JSON.parse(JSON.stringify(m)),group:{groupId:'qa',name:'QA'}})});}
  if(url.pathname.includes('profile'))return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({profiles:{},success:true})});
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,data:clone(),groups:[],group:{groupId:'qa',name:'QA'},user:{memberId:'mgr',displayName:'관리자',role:'manager',globalAdmin:false,groupId:'qa'}})});
});
try{
  await page.goto('http://127.0.0.1:4173/?qa=s646',{waitUntil:'load'});
  await page.waitForFunction(()=>window.__kokmatchVersionLock==='6.46'&&typeof window.renderAll==='function',{timeout:15000});
  await page.evaluate(s=>{T='qa-token';currentGroupId='qa';currentView='members';S=JSON.parse(JSON.stringify(s));window.S=S;me={memberId:'mgr',displayName:'관리자',role:'manager',globalAdmin:false,tempOrganizer:false,groupId:'qa'};group={groupId:'qa',name:'QA'};groups=[];normalizeClient();renderAll();document.getElementById('login')?.classList.add('hide')},clone());
  await page.waitForTimeout(250);
  const badge=page.locator('#members .memberCard').filter({hasText:'S급테스트'}).locator('.grade-s50').first();
  if(await badge.count()!==1)throw new Error('S grade badge missing in roster');
  const bg=await badge.evaluate(el=>getComputedStyle(el).backgroundImage);
  if(!bg.includes('linear-gradient'))throw new Error('S grade badge is not rainbow: '+bg);
  const edit=page.locator('#members .memberCard').filter({hasText:'S급테스트'}).locator('button').filter({hasText:'수정'}).first();
  await edit.click();await page.waitForSelector('#memberEditorV615');
  const options=await page.locator('#v618Cls option').allTextContents();
  if(options[0]!=='S'||!options.includes('E'))throw new Error('S grade option order missing: '+options.join(','));
  await page.locator('#v618Cls').selectOption('S');await page.locator('#v618Save').click();await page.waitForSelector('#memberEditorV615',{state:'detached',timeout:5000});
  if(saveBody?.cls!=='S'||saveBody?.op!=='member_save')throw new Error('S grade save did not use focused endpoint: '+JSON.stringify(saveBody));
  await page.evaluate(()=>{currentView='queue';renderQueue();document.querySelectorAll('.view').forEach(v=>v.classList.toggle('on',v.id==='queue'))});
  await page.waitForTimeout(100);
  const qbadge=page.locator('#queue .queueCard').filter({hasText:'S급테스트'}).locator('.grade-s50').first();
  if(await qbadge.count()!==1)throw new Error('S grade badge missing in queue');
  const q=await qbadge.evaluate(el=>getComputedStyle(el).backgroundImage);if(!q.includes('linear-gradient'))throw new Error('queue S badge is not rainbow');
  const cardBg=await page.locator('#queue .queueCard').filter({hasText:'S급테스트'}).first().evaluate(el=>getComputedStyle(el).backgroundColor);
  if(!/rgb\(255,\s*255,\s*255\)/.test(cardBg))throw new Error('queue card background changed: '+cardBg);
  console.log('PASS v6.46 S-grade roster/editor/save/queue rainbow badge QA');
}finally{await browser.close()}
