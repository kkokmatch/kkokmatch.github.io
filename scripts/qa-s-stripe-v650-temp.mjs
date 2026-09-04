import fs from 'node:fs';
import { chromium } from 'playwright';
import { PNG } from 'pngjs';

const latest=JSON.parse(fs.readFileSync('latest-version.json','utf8'));
const VERSION=String(latest.semanticVersion||'').replace(/^v/,'');
if(VERSION!=='6.50')throw new Error('expected v6.50, got '+VERSION);

const members=[
 {id:'mgr',name:'관리자',year:1985,gender:'남',age:'40',cls:'B',type:'member',role:'manager',state:'out',joinedAt:null,totalGames:0},
 {id:'s1',name:'에스회원',year:1990,gender:'남',age:'30',cls:'S',type:'member',role:'member',state:'waiting',joinedAt:Date.now()-120000,totalGames:0},
 {id:'a1',name:'에이회원',year:1990,gender:'남',age:'30',cls:'A',type:'member',role:'member',state:'waiting',joinedAt:Date.now()-120000,totalGames:0}
];
const state={courtCount:8,courtNames:Array.from({length:8},(_,i)=>`${i+1}코트`),members,queue:['s1','a1'],pendingGames:[],games:[],history:[],pairCounts:{}};
const copy=()=>JSON.parse(JSON.stringify(state));
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
await page.addInitScript(()=>{try{localStorage.setItem('kokmatch_push_denied_notice629',String(Date.now()));localStorage.setItem('kokmatch_install_guide631_seen','1');sessionStorage.setItem('kokmatch_install_later630','1');const kill=()=>document.getElementById('pwaPrompt629')?.remove();new MutationObserver(kill).observe(document,{childList:true,subtree:true});addEventListener('DOMContentLoaded',kill)}catch{}});
await page.route('https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,data:copy(),profiles:{},groups:[]})}));

function samples(path,side){
 const png=PNG.sync.read(fs.readFileSync(path));
 const x=side==='left'?2:png.width-3;
 const ys=[.18,.34,.50,.66,.82].map(f=>Math.max(1,Math.min(png.height-2,Math.round(png.height*f))));
 return ys.map(y=>{const i=(png.width*y+x)<<2;return [png.data[i],png.data[i+1],png.data[i+2],png.data[i+3]]});
}
function rgbDist(a,b){return Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);}
function verifyRainbow(px,label){
 if(px.some(p=>p[3]<240))throw new Error(label+' stripe has transparent sampled pixels: '+JSON.stringify(px));
 if(px.every(p=>p[0]>238&&p[1]>238&&p[2]>238))throw new Error(label+' stripe is visually white/invisible: '+JSON.stringify(px));
 let max=0;for(let i=0;i<px.length;i++)for(let j=i+1;j<px.length;j++)max=Math.max(max,rgbDist(px[i],px[j]));
 if(max<70)throw new Error(label+' stripe does not visibly vary as rainbow: '+JSON.stringify(px));
}

try{
 await page.goto('http://127.0.0.1:4173/?qa=sstripe650',{waitUntil:'networkidle'});
 await page.waitForFunction(v=>window.__kokmatchVersionLock===v&&typeof window.renderAll==='function',VERSION,{timeout:15000});
 await page.evaluate(({state})=>{T='qa-token';currentGroupId='qa';currentView='members';S=JSON.parse(JSON.stringify(state));window.S=S;me={memberId:'mgr',displayName:'관리자',role:'manager',globalAdmin:false,tempOrganizer:false,groupId:'qa'};group={groupId:'qa',name:'QA 모임'};groups=[];normalizeClient();renderAll();document.getElementById('login')?.classList.add('hide');},{state:copy()});
 await page.waitForTimeout(300);

 const ms=page.locator('#members .memberCard[data-grade-v6="S"]');
 const ma=page.locator('#members .memberCard[data-grade-v6="A"]');
 if(await ms.count()!==1||await ma.count()!==1)throw new Error('S/A member cards missing');
 const memberCheck=await page.evaluate(()=>{const s=document.querySelector('#members .memberCard[data-grade-v6="S"]'),a=document.querySelector('#members .memberCard[data-grade-v6="A"]');const ss=getComputedStyle(s),as=getComputedStyle(a),ps=getComputedStyle(s,'::before'),sr=s.getBoundingClientRect(),ar=a.getBoundingClientRect();return {sBorder:ss.borderLeftWidth,sStyle:ss.borderLeftStyle,aBorder:as.borderLeftWidth,aStyle:as.borderLeftStyle,sRadius:ss.borderRadius,aRadius:as.borderRadius,sBg:ss.backgroundImage,pseudoDisplay:ps.display,sW:sr.width,aW:ar.width};});
 if(memberCheck.sBorder!=='5px'||memberCheck.sBorder!==memberCheck.aBorder||memberCheck.sStyle!=='solid'||memberCheck.sStyle!==memberCheck.aStyle)throw new Error('member S border geometry mismatch: '+JSON.stringify(memberCheck));
 if(memberCheck.sRadius!==memberCheck.aRadius||Math.abs(memberCheck.sW-memberCheck.aW)>.25)throw new Error('member S card geometry mismatch: '+JSON.stringify(memberCheck));
 if(!memberCheck.sBg.includes('linear-gradient')||memberCheck.pseudoDisplay!=='none')throw new Error('member S stripe paint setup invalid: '+JSON.stringify(memberCheck));
 await ms.screenshot({path:'/tmp/member-s650.png'});verifyRainbow(samples('/tmp/member-s650.png','left'),'member S');

 await page.evaluate(()=>{currentView='queue';renderAll();document.querySelectorAll('.view').forEach(v=>v.classList.toggle('on',v.id==='queue'))});
 await page.waitForTimeout(250);
 const qs=page.locator('#queue .queueCard54[data-queue-grade642="S"]');
 const qa=page.locator('#queue .queueCard54[data-queue-grade642="A"]');
 if(await qs.count()!==1||await qa.count()!==1)throw new Error('S/A queue cards missing');
 const queueCheck=await page.evaluate(()=>{const s=document.querySelector('#queue .queueCard54[data-queue-grade642="S"]'),a=document.querySelector('#queue .queueCard54[data-queue-grade642="A"]');const ss=getComputedStyle(s),as=getComputedStyle(a),ps=getComputedStyle(s,'::before'),sr=s.getBoundingClientRect(),ar=a.getBoundingClientRect();return {sBorder:ss.borderRightWidth,sStyle:ss.borderRightStyle,aBorder:as.borderRightWidth,aStyle:as.borderRightStyle,sRadius:ss.borderRadius,aRadius:as.borderRadius,sBg:ss.backgroundImage,pseudoDisplay:ps.display,sW:sr.width,aW:ar.width,watermark:getComputedStyle(s,'::after').content};});
 if(queueCheck.sBorder!=='5px'||queueCheck.sBorder!==queueCheck.aBorder||queueCheck.sStyle!=='solid'||queueCheck.sStyle!==queueCheck.aStyle)throw new Error('queue S border geometry mismatch: '+JSON.stringify(queueCheck));
 if(queueCheck.sRadius!==queueCheck.aRadius||Math.abs(queueCheck.sW-queueCheck.aW)>.25)throw new Error('queue S card geometry mismatch: '+JSON.stringify(queueCheck));
 if(!queueCheck.sBg.includes('linear-gradient')||queueCheck.pseudoDisplay!=='none')throw new Error('queue S stripe paint setup invalid: '+JSON.stringify(queueCheck));
 if(!String(queueCheck.watermark||'').includes('S'))throw new Error('S watermark disappeared: '+JSON.stringify(queueCheck));
 await qs.screenshot({path:'/tmp/queue-s650.png'});verifyRainbow(samples('/tmp/queue-s650.png','right'),'queue S');

 console.log('PASS v6.50 S stripe geometry matches A-E at 5px');
 console.log('PASS actual rendered screenshot pixels show visible rainbow on member and queue edges');
 console.log('PASS S queue watermark preserved');
}finally{await browser.close();}
