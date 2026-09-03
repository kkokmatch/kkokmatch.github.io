import { chromium } from 'playwright';

const browser=await chromium.launch({headless:true});
const stateBase={courtCount:8,courtNames:Array.from({length:8},(_,i)=>`${i+1}코트`),members:[
  {id:'self',name:'일반회원',year:1990,gender:'남',age:'30',cls:'C',type:'member',role:'member',totalGames:0,state:'out'},
  {id:'other',name:'다른회원',year:1991,gender:'여',age:'30',cls:'D',type:'member',role:'member',totalGames:0,state:'out'}
],queue:[],pendingGames:[],games:[],history:[],pairCounts:{}};

async function setupPage(viewport, role='member'){
  const context=await browser.newContext({viewport,serviceWorkers:'block'});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e?.stack||e)));
  await page.route('https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/**',route=>route.fulfill({status:200,contentType:'application/json',body:'{}'}));
  await page.goto('http://127.0.0.1:4173/?qa=v636',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__kokmatchVersionLock==='6.36'&&typeof window.renderMembers==='function',{timeout:5000});
  await page.evaluate(({stateBase,role})=>{
    T='qa-token';localStorage.setItem('kokmatch_token',T);currentGroupId='qa';currentView='members';
    S=JSON.parse(JSON.stringify(stateBase));window.S=S;
    me=role==='manager'
      ?{memberId:'self',displayName:'모임장테스트',role:'manager',globalAdmin:false,tempOrganizer:false,groupId:'qa'}
      :{memberId:'self',displayName:'일반회원',role:'member',globalAdmin:false,tempOrganizer:false,groupId:'qa'};
    group={groupId:'qa',name:'QA 모임'};groups=[];normalizeClient();renderAll();document.getElementById('login')?.classList.add('hide');
    window.__kokmatchPaintRosterControls632?.();
  },{stateBase,role});
  await page.waitForTimeout(120);
  return {context,page,errors};
}

async function selfGeometry(page){
  return page.evaluate(()=>{
    const card=[...document.querySelectorAll('#members .memberCard')].find(c=>String(c.dataset.memberId22||c.dataset.memberId||'')==='self');
    if(!card)return {missing:'card'};
    const actions=card.querySelector('.kmRosterActions621');
    const row=card.querySelector('.kmRosterBtns621');
    const slots=[...card.querySelectorAll('.kmRosterSlot621')];
    const buttons=[...card.querySelectorAll('.kmRosterAction621')].map(b=>({text:b.textContent.trim(),rect:b.getBoundingClientRect().toJSON()}));
    const cr=card.getBoundingClientRect(),ar=actions?.getBoundingClientRect(),rr=row?.getBoundingClientRect();
    const sr=slots.map(s=>s.getBoundingClientRect().toJSON());
    const cs=row?getComputedStyle(row):null;
    return {card:cr.toJSON(),actions:ar?.toJSON(),row:rr?.toJSON(),slots:sr,buttons,display:cs?.display,cols:cs?.gridTemplateColumns,gap:cs?.columnGap,scrollWidth:card.scrollWidth,clientWidth:card.clientWidth};
  });
}

function assertTabletGeometry(g,label,expectedTexts){
  if(g.missing)throw new Error(`${label}: missing ${g.missing}`);
  if(g.display!=='grid')throw new Error(`${label}: action row is not grid: ${g.display}`);
  if(g.slots.length!==3)throw new Error(`${label}: expected 3 fixed slots, got ${g.slots.length}`);
  const texts=g.buttons.map(b=>b.text);
  if(JSON.stringify(texts)!==JSON.stringify(expectedTexts))throw new Error(`${label}: labels ${JSON.stringify(texts)} expected ${JSON.stringify(expectedTexts)}`);
  const widths=g.slots.map(r=>Math.round(r.width));
  if(widths.some(w=>Math.abs(w-44)>1))throw new Error(`${label}: slot widths ${widths.join(',')}`);
  const ys=g.slots.map(r=>Math.round(r.y));
  if(Math.max(...ys)-Math.min(...ys)>1)throw new Error(`${label}: slots are not one row: ${ys.join(',')}`);
  const xs=g.slots.map(r=>Math.round(r.x));
  const d1=xs[1]-xs[0],d2=xs[2]-xs[1];
  if(Math.abs(d1-d2)>1)throw new Error(`${label}: unequal slot spacing ${xs.join(',')}`);
  if(g.actions.x<g.card.x-1||g.actions.x+g.actions.width>g.card.x+g.card.width+1)throw new Error(`${label}: action rail outside card`);
  if(g.scrollWidth>g.clientWidth+1)throw new Error(`${label}: card horizontal overflow ${g.scrollWidth}/${g.clientWidth}`);
  for(const b of g.buttons){
    if(Math.abs(b.rect.height-32)>1||Math.abs(b.rect.width-44)>1)throw new Error(`${label}: button ${b.text} geometry ${b.rect.width}x${b.rect.height}`);
  }
}

try{
  // Lenovo Y700-like portrait CSS viewport.
  {
    const {context,page,errors}=await setupPage({width:800,height:1280},'member');
    try{
      let g=await selfGeometry(page);assertTabletGeometry(g,'tablet-out',['입장','관람']);
      const xOut=g.slots.map(r=>Math.round(r.x));
      await page.evaluate(()=>{const m=S.members.find(x=>x.id==='self');m.state='waiting';S.queue=['self'];window.__kokmatchPaintRosterControls632?.()});
      await page.waitForTimeout(30);g=await selfGeometry(page);assertTabletGeometry(g,'tablet-waiting',['퇴장','관람']);
      const xWaiting=g.slots.map(r=>Math.round(r.x));
      await page.evaluate(()=>{const m=S.members.find(x=>x.id==='self');m.state='spectator';S.queue=[];window.__kokmatchPaintRosterControls632?.()});
      await page.waitForTimeout(30);g=await selfGeometry(page);assertTabletGeometry(g,'tablet-spectator',['입장','퇴장']);
      const xSpectator=g.slots.map(r=>Math.round(r.x));
      if(JSON.stringify(xOut)!==JSON.stringify(xWaiting)||JSON.stringify(xOut)!==JSON.stringify(xSpectator))throw new Error(`tablet slot positions moved: ${JSON.stringify({xOut,xWaiting,xSpectator})}`);
      if(errors.length)throw new Error('tablet page errors: '+errors.join(' | '));
      console.log('PASS Android tablet 800x1280: out/waiting/spectator controls stay in identical 3-slot row');
    }finally{await context.close();}
  }

  // Tablet manager row has all 3 actions visible and aligned.
  {
    const {context,page,errors}=await setupPage({width:800,height:1280},'manager');
    try{
      const g=await selfGeometry(page);assertTabletGeometry(g,'tablet-manager',['입장','관람','수정']);
      if(errors.length)throw new Error('manager page errors: '+errors.join(' | '));
      console.log('PASS Android tablet manager: 입장/관람/수정 all fixed and aligned');
    }finally{await context.close();}
  }

  // iPhone portrait remains overflow-free; v6.36 tablet media rule must not disturb it.
  {
    const {context,page,errors}=await setupPage({width:390,height:844},'member');
    try{
      const g=await selfGeometry(page);
      if(g.missing)throw new Error('iPhone missing roster card');
      if(g.buttons.map(b=>b.text).join('/')!=='입장/관람')throw new Error('iPhone labels changed: '+g.buttons.map(b=>b.text).join('/'));
      const ys=g.buttons.map(b=>Math.round(b.rect.y));if(ys.length>1&&Math.max(...ys)-Math.min(...ys)>1)throw new Error('iPhone buttons no longer one row');
      if(g.scrollWidth>g.clientWidth+1)throw new Error(`iPhone card overflow ${g.scrollWidth}/${g.clientWidth}`);
      if(errors.length)throw new Error('iPhone page errors: '+errors.join(' | '));
      console.log('PASS iPhone 390x844: existing member-button layout remains one row and overflow-free');
    }finally{await context.close();}
  }
} finally {
  await browser.close();
}
