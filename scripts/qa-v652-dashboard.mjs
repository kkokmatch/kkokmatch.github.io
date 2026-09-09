import fs from 'node:fs';
import { chromium, webkit } from 'playwright';

const latest=JSON.parse(fs.readFileSync('latest-version.json','utf8'));
const VERSION=String(latest.semanticVersion||'').replace(/^v/,'');
if(VERSION!=='6.52')throw new Error('expected v6.52, got '+VERSION);
const now=Date.now(),min=n=>now-n*60000;
const members=[
 {id:'mgr',name:'관리자',year:1985,gender:'남',age:'40',cls:'B',type:'member',role:'manager',state:'waiting',joinedAt:min(45),totalGames:0},
 {id:'w2',name:'대기2',year:1990,gender:'여',age:'30',cls:'C',type:'member',role:'member',state:'waiting',joinedAt:min(12),totalGames:1},
 {id:'p1',name:'편성1',year:1991,gender:'남',age:'30',cls:'B',type:'member',role:'member',state:'matched',joinedAt:min(25),totalGames:1},
 {id:'p2',name:'편성2',year:1992,gender:'여',age:'30',cls:'C',type:'member',role:'member',state:'matched',joinedAt:min(25),totalGames:1},
 {id:'p3',name:'편성3',year:1993,gender:'남',age:'30',cls:'C',type:'member',role:'member',state:'matched',joinedAt:min(25),totalGames:1},
 {id:'p4',name:'편성4',year:1994,gender:'여',age:'30',cls:'D',type:'member',role:'member',state:'matched',joinedAt:min(25),totalGames:0},
 {id:'g1',name:'게임1',year:1988,gender:'남',age:'30',cls:'A',type:'member',role:'member',state:'playing',joinedAt:min(60),totalGames:2},
 {id:'g2',name:'게임2',year:1989,gender:'여',age:'30',cls:'A',type:'member',role:'member',state:'playing',joinedAt:min(60),totalGames:2},
 {id:'g3',name:'게임3',year:1990,gender:'남',age:'30',cls:'B',type:'member',role:'member',state:'playing',joinedAt:min(60),totalGames:2},
 {id:'g4',name:'게임4',year:1991,gender:'여',age:'30',cls:'B',type:'member',role:'member',state:'playing',joinedAt:min(60),totalGames:2},
 {id:'spec',name:'관람자',year:1995,gender:'여',age:'30',cls:'D',type:'member',role:'member',state:'spectator',joinedAt:null,totalGames:0},
 {id:'out',name:'미입장',year:1996,gender:'남',age:'30',cls:'E',type:'member',role:'member',state:'out',joinedAt:null,totalGames:0}
];
const state={courtCount:4,courtNames:['1코트','2코트','3코트','4코트'],members,queue:['mgr','w2'],pendingGames:[{id:'pg1',players:['p1','p2','p3','p4'],createdAt:min(20)}],games:[{id:'gm1',players:['g1','g2','g3','g4'],court:2,startedAt:min(12)}],history:[{id:'h1',players:['w2','p1','p2','p3'],finishedAt:min(50)}],pairCounts:{},attendancePolls:[]};
const clone=()=>JSON.parse(JSON.stringify(state));

async function suppress(page){await page.addInitScript(()=>{try{localStorage.setItem('kokmatch_push_denied_notice629',String(Date.now()));localStorage.setItem('kokmatch_install_guide631_seen','1');sessionStorage.setItem('kokmatch_install_later630','1')}catch{}})}
async function routeApis(page){await page.route('https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,data:clone(),profiles:{},groups:[],group:{groupId:'qa',name:'QA 모임'},user:{memberId:'mgr',displayName:'관리자',role:'manager',globalAdmin:false,tempOrganizer:false,groupId:'qa'}})}))}
async function bootStats(page){
 await suppress(page);await routeApis(page);
 await page.goto('http://127.0.0.1:4173/?qa=v652-dashboard',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(v=>window.__kokmatchVersionLock===v&&typeof window.renderAll==='function'&&typeof window.__kokmatchRenderOpsDashboard652==='function',VERSION,{timeout:15000});
 await page.evaluate(({state})=>{T='qa-token';currentGroupId='qa';currentView='stats';S=JSON.parse(JSON.stringify(state));window.S=S;me={memberId:'mgr',displayName:'관리자',role:'manager',globalAdmin:false,tempOrganizer:false,groupId:'qa'};group={groupId:'qa',name:'QA 모임'};groups=[];normalizeClient();renderAll();document.getElementById('login')?.classList.add('hide')},{state:clone()});
 await page.waitForSelector('#opsDashboard652');
}
function expect(cond,msg){if(!cond)throw new Error(msg)}

{
 const browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(String(e?.message||e)));
 try{
  await bootStats(page);
  const metrics=await page.locator('#opsDashboard652 .opsMetric652').allTextContents();
  const all=metrics.join(' | ');
  expect(all.includes('현재 입장11명운동 10 · 관람 1'),'entered/exercise/spectator metric mismatch: '+all);
  expect(all.includes('게임 대기6명개인 2 · 편성 4'),'wait metric mismatch: '+all);
  expect(all.includes('진행 경기1게임게임중 4명'),'running game metric mismatch: '+all);
  expect(all.includes('코트 사용1/4가동률 25%'),'court metric mismatch: '+all);
  expect(all.includes('평균 대기26분현재 대기 6명'),'average wait mismatch: '+all);
  expect(all.includes('최장 대기45분30분↑ 1명'),'max wait mismatch: '+all);
  expect(all.includes('편성대기1조총 4명'),'pending metric mismatch: '+all);
  expect(all.includes('완료 0게임2명우선 편성 확인'),'zero-game metric mismatch: '+all);
  const long=await page.locator('#opsDashboard652 .opsPanels652 .opsPanel652').nth(0).textContent();
  expect(long.includes('관리자')&&long.includes('45분'),'long-wait priority list missing manager: '+long);
  const zero=await page.locator('#opsDashboard652 .opsPanels652 .opsPanel652').nth(1).textContent();
  expect(zero.includes('관리자')&&zero.includes('편성4'),'zero-game priority list wrong: '+zero);
  const court=await page.locator('#opsDashboard652 .opsCourtPanel652').textContent();
  expect(court.includes('2코트')&&court.includes('게임1')&&court.includes('빈 코트 3개'),'court panel mismatch: '+court);
  expect(errors.length===0,'page errors: '+errors.join(' | '));
  console.log('PASS v6.52 dashboard metrics / priority lists / court operations');
 }finally{await browser.close()}
}

{
 const browser=await webkit.launch({headless:true});const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1'});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e?.message||e)));
 try{
  await bootStats(page);
  const geom=await page.evaluate(()=>{const d=document.getElementById('opsDashboard652'),r=d.getBoundingClientRect();return{w:r.width,scroll:document.documentElement.scrollWidth,inner:innerWidth,metrics:d.querySelectorAll('.opsMetric652').length}});
  expect(geom.metrics===8,'WebKit dashboard metric count '+JSON.stringify(geom));
  expect(geom.w>300&&geom.scroll<=geom.inner+2,'WebKit mobile overflow '+JSON.stringify(geom));
  expect(errors.length===0,'WebKit page errors: '+errors.join(' | '));
  console.log('PASS v6.52 iPhone/WebKit 390px dashboard layout');
 }finally{await browser.close()}
}
