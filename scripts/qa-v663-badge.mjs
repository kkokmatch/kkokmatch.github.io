import { chromium, webkit } from 'playwright';

const VERSION='6.63';

async function run(engine,label){
  const browser=await engine.launch({headless:true});
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  const page=await context.newPage();
  const errors=[]; page.on('pageerror',e=>errors.push(String(e?.message||e)));
  await page.addInitScript(()=>{try{localStorage.setItem('kokmatch_push_denied_notice629',String(Date.now()));localStorage.setItem('kokmatch_install_guide631_seen','1');sessionStorage.setItem('kokmatch_install_later630','1')}catch{}});
  await page.goto('http://127.0.0.1:4173/?qa=v663',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(v=>window.__kokmatchVersionLock===v,VERSION,{timeout:15000});

  const result=await page.evaluate(()=>{
    const box=document.createElement('div');
    box.id='badgeQa663';
    box.style.cssText='position:fixed;left:20px;top:20px;z-index:99999;background:white;padding:20px;display:flex;align-items:center;gap:12px';
    box.innerHTML='<span id="dev663" class="roleBadge role-global">개발자</span><span id="mgr663" class="roleBadge role-manager">모임장</span><span id="org663" class="roleBadge role-organizer">운영진</span>';
    document.body.appendChild(box);
    const snap=id=>{const e=document.getElementById(id),s=getComputedStyle(e),r=e.getBoundingClientRect();return {display:s.display,borderRadius:s.borderRadius,paddingTop:s.paddingTop,paddingRight:s.paddingRight,paddingBottom:s.paddingBottom,paddingLeft:s.paddingLeft,fontFamily:s.fontFamily,fontSize:s.fontSize,fontWeight:s.fontWeight,fontStyle:s.fontStyle,lineHeight:s.lineHeight,letterSpacing:s.letterSpacing,marginLeft:s.marginLeft,verticalAlign:s.verticalAlign,width:r.width,height:r.height,backgroundImage:s.backgroundImage,before:getComputedStyle(e,'::before').content,after:getComputedStyle(e,'::after').content}};
    return {dev:snap('dev663'),mgr:snap('mgr663'),org:snap('org663'),scroll:document.documentElement.scrollWidth,inner:innerWidth};
  });

  const keys=['display','borderRadius','paddingTop','paddingRight','paddingBottom','paddingLeft','fontFamily','fontSize','fontWeight','fontStyle','lineHeight','letterSpacing','marginLeft','verticalAlign'];
  for(const key of keys){
    if(result.dev[key]!==result.mgr[key]||result.dev[key]!==result.org[key])throw new Error(`${label} ${key} mismatch ${JSON.stringify(result)}`);
  }
  if(Math.abs(result.dev.height-result.mgr.height)>0.6||Math.abs(result.dev.height-result.org.height)>0.6)throw new Error(`${label} badge height mismatch ${JSON.stringify(result)}`);
  if(Math.abs(result.dev.width-result.mgr.width)>1.1||Math.abs(result.dev.width-result.org.width)>1.1)throw new Error(`${label} badge width mismatch ${JSON.stringify(result)}`);
  if(result.dev.borderRadius!=='999px')throw new Error(`${label} developer badge is not pill-shaped ${JSON.stringify(result.dev)}`);
  if(result.dev.fontSize!=='11px'||result.dev.fontWeight!=='900'||result.dev.paddingTop!=='3px'||result.dev.paddingRight!=='7px')throw new Error(`${label} shared badge scale was not restored ${JSON.stringify(result.dev)}`);
  if(result.dev.before!=='none'&&result.dev.before!=='normal')throw new Error(`${label} v6.62 diamond glyph still affects developer badge ${JSON.stringify(result.dev)}`);
  if(!result.dev.backgroundImage.includes('linear-gradient'))throw new Error(`${label} blue crystal material missing ${JSON.stringify(result.dev)}`);
  if(result.scroll>result.inner+2)throw new Error(`${label} horizontal overflow ${JSON.stringify(result)}`);
  if(errors.length)throw new Error(`${label} page errors ${errors.join(' | ')}`);
  console.log(`PASS ${label} v6.63 developer badge matches manager/organizer geometry and typography while keeping crystal material`);
  await browser.close();
}

await run(chromium,'Chromium mobile');
await run(webkit,'WebKit mobile');
