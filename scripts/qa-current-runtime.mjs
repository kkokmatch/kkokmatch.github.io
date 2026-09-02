import fs from 'node:fs';
import { chromium } from 'playwright';

const latest=JSON.parse(fs.readFileSync('latest-version.json','utf8'));
const VERSION=String(latest.semanticVersion||latest.label||'').replace(/^v/,'');
if(!VERSION)throw new Error('latest-version.json semanticVersion is missing');

const members=[
  {id:'mgr',name:'관리자',year:1985,gender:'남',age:'40',cls:'B',type:'member',role:'manager',totalGames:0,state:'out',joinedAt:null},
  {id:'out1',name:'미입장회원',year:1990,gender:'남',age:'30',cls:'C',type:'member',role:'member',totalGames:0,state:'out',joinedAt:null},
  {id:'wait1',name:'대기회원',year:1991,gender:'여',age:'30',cls:'D',type:'member',role:'member',totalGames:0,state:'waiting',joinedAt:Date.now()-60000},
  {id:'spec1',name:'관람회원',year:1992,gender:'남',age:'30',cls:'E',type:'member',role:'member',totalGames:0,state:'spectator',joinedAt:Date.now()-60000},
  {id:'same1',name:'김민수',year:1990,gender:'남',age:'30',cls:'B',type:'member',role:'member',totalGames:0,state:'out',joinedAt:null},
  {id:'same2',name:'김민수',year:1992,gender:'여',age:'30',cls:'C',type:'member',role:'member',totalGames:0,state:'out',joinedAt:null}
];
const state={courtCount:8,courtNames:Array.from({length:8},(_,i)=>`${i+1}코트`),members,queue:['wait1'],pendingGames:[],games:[],history:[],pairCounts:{}};
const copy=()=>JSON.parse(JSON.stringify(state));

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const pageErrors=[];
const appAssets=[];
page.on('pageerror',e=>pageErrors.push(String(e?.stack||e)));
page.on('request',req=>{
  try{
    const u=new URL(req.url());
    if(/^\/app-v[^/]+\.(?:js|css)$/.test(u.pathname))appAssets.push(u.pathname);
  }catch{}
});

await page.route('https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/**',async route=>{
  const req=route.request();
  const url=new URL(req.url());
  if(url.pathname.endsWith('/kokmatch-v60-api')){
    let body={};
    try{body=JSON.parse(req.postData()||'{}')}catch{}
    if(body.op==='action'&&(body.action==='set_member_attendance'||body.action==='set_my_attendance')){
      const id=body.action==='set_my_attendance'?'mgr':String(body.memberId||'');
      const m=state.members.find(x=>String(x.id)===id);
      if(m){
        state.queue=state.queue.filter(x=>String(x)!==id);
        m.state=String(body.mode||'out');
        m.joinedAt=m.state==='out'?null:Date.now();
        if(m.state==='waiting'&&!state.queue.includes(id))state.queue.push(id);
      }
    }
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,data:copy(),group:{groupId:'qa',name:'QA'}})});
  }
  if(url.pathname.includes('profile'))return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({profiles:{},success:true})});
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,data:copy(),profiles:{},groups:[]})});
});

try{
  await page.goto('http://127.0.0.1:4173/?qa=current',{waitUntil:'networkidle'});
  await page.waitForFunction(v=>window.__kokmatchVersionLock===v&&typeof window.renderAll==='function',VERSION,{timeout:15000});

  const loginReady=await page.evaluate(()=>({
    version:window.__kokmatchVersionLock,
    input:!!document.querySelector('#login input'),
    title:(document.querySelector('#login h1,#login h2')?.textContent||'').trim()
  }));
  if(loginReady.version!==VERSION||!loginReady.input)throw new Error('login shell/version did not initialize: '+JSON.stringify(loginReady));

  await page.evaluate(({state})=>{
    T='qa-token';
    currentGroupId='qa';
    currentView='members';
    S=JSON.parse(JSON.stringify(state));
    window.S=S;
    me={memberId:'mgr',displayName:'관리자',role:'manager',globalAdmin:false,tempOrganizer:false,groupId:'qa'};
    group={groupId:'qa',name:'QA 모임'};
    groups=[];
    normalizeClient();
    renderAll();
    document.getElementById('login')?.classList.add('hide');
  },{state:copy()});
  await page.waitForTimeout(350);

  async function labels(id){
    return await page.evaluate(id=>{
      const card=[...document.querySelectorAll('#members .memberCard')].find(c=>String(c.dataset.memberId22||c.dataset.memberId||c.dataset.memberId46||c.dataset.memberId80||'')===id);
      if(!card)return null;
      const buttons=[...card.querySelectorAll('.memberBtns button')];
      const rects=buttons.map(b=>{const r=b.getBoundingClientRect();return {text:(b.textContent||'').trim(),x:Math.round(r.x*10)/10,w:Math.round(r.width*10)/10,h:Math.round(r.height*10)/10}});
      return {labels:buttons.map(b=>(b.textContent||'').trim()),rects};
    },id);
  }
  function expect(actual,expected,name){
    if(!actual||JSON.stringify(actual.labels)!==JSON.stringify(expected))throw new Error(`${name} buttons ${JSON.stringify(actual)} expected ${JSON.stringify(expected)}`);
    const widths=actual.rects.map(r=>r.w);
    if(widths.length!==3||Math.max(...widths)-Math.min(...widths)>1.1)throw new Error(`${name} button widths are not fixed: ${JSON.stringify(actual.rects)}`);
    for(let i=1;i<actual.rects.length;i++)if(actual.rects[i].x<=actual.rects[i-1].x)throw new Error(`${name} buttons are not in one stable row: ${JSON.stringify(actual.rects)}`);
  }

  expect(await labels('out1'),['입장','관람','수정'],'out');
  expect(await labels('wait1'),['퇴장','관람','수정'],'waiting');
  expect(await labels('spec1'),['입장','퇴장','수정'],'spectator');

  async function clickLabel(id,label){
    await page.evaluate(({id,label})=>{
      const card=[...document.querySelectorAll('#members .memberCard')].find(c=>String(c.dataset.memberId22||c.dataset.memberId||c.dataset.memberId46||c.dataset.memberId80||'')===id);
      const btn=[...(card?.querySelectorAll('.memberBtns button')||[])].find(b=>(b.textContent||'').trim()===label);
      if(!btn)throw new Error(`button ${label} not found for ${id}`);
      btn.click();
    },{id,label});
    await page.waitForTimeout(180);
  }

  await clickLabel('out1','입장');
  expect(await labels('out1'),['퇴장','관람','수정'],'out→waiting');
  await clickLabel('out1','관람');
  expect(await labels('out1'),['입장','퇴장','수정'],'waiting→spectator');
  await clickLabel('out1','퇴장');
  expect(await labels('out1'),['입장','관람','수정'],'spectator→out');

  await page.evaluate(()=>window.openPartner66?.('mgr'));
  await page.waitForSelector('#partnerOverlayV615 #v615PartnerSearch');
  await page.fill('#v615PartnerSearch','김민수');
  const partnerRows=await page.locator('#v615PartnerResults .v615PartnerResult').allTextContents();
  if(partnerRows.length!==2||!partnerRows.some(x=>x.includes('1990년생')&&x.includes('남')&&x.includes('B급'))||!partnerRows.some(x=>x.includes('1992년생')&&x.includes('여')&&x.includes('C급')))throw new Error('partner duplicate-name results are not distinguishable: '+JSON.stringify(partnerRows));
  await page.locator('#v615PartnerResults .v615PartnerResult').filter({hasText:'1992년생'}).click();
  const picked=await page.locator('#v615PartnerPicked').textContent();
  if(!picked?.includes('김민수')||!picked.includes('1992년생'))throw new Error('partner selection did not react: '+picked);
  await page.locator('#partnerOverlayV615 [data-v615-action="partnercancel"]').click();

  const uniqueAssets=[...new Set(appAssets)];
  const expectedAssets=[`/app-v${VERSION}.css`,`/app-v${VERSION}.js`].sort();
  if(JSON.stringify(uniqueAssets.sort())!==JSON.stringify(expectedAssets))throw new Error(`unexpected app assets: ${JSON.stringify(uniqueAssets)} expected ${JSON.stringify(expectedAssets)}`);
  if(pageErrors.length)throw new Error('page errors: '+pageErrors.join(' | '));

  console.log(`PASS current runtime v${VERSION}`);
  console.log('PASS login shell');
  console.log('PASS 3-button states: out / waiting / spectator');
  console.log('PASS click flow: out → waiting → spectator → out');
  console.log('PASS fixed one-row button geometry');
  console.log('PASS one current JS + one current CSS network assets');
}finally{
  await browser.close();
}
