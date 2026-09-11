from pathlib import Path

p=Path('scripts/qa-role-layout-current.mjs')
s=p.read_text(encoding='utf-8')

old_vp="const viewports=[{name:'iphone',width:390,height:844,isMobile:true},{name:'tablet',width:768,height:1024,isMobile:false}];"
new_vp="const viewports=[{name:'fold-cover',width:344,height:882,isMobile:true},{name:'iphone',width:390,height:844,isMobile:true},{name:'galaxy',width:412,height:915,isMobile:true},{name:'tablet',width:768,height:1024,isMobile:false}];"
if old_vp not in s: raise SystemExit('viewport patch point missing')
s=s.replace(old_vp,new_vp,1)

old_overlap="""if(width<600){if(ir&&ar.top<ir.bottom-2)failures.push('phone info/actions overlap')}else if(ir&&ir.right>ar.left+2){const cs=getComputedStyle(info),as=getComputedStyle(actions);failures.push(`tablet info/actions overlap id=${cardId(card)} info=${Math.round(ir.left)}-${Math.round(ir.right)} action=${Math.round(ar.left)}-${Math.round(ar.right)} card=${Math.round(cr.left)}-${Math.round(cr.right)} infoWidth=${cs.width} infoGrid=${cs.gridColumnStart}/${cs.gridColumnEnd} actionWidth=${as.width} actionGrid=${as.gridColumnStart}/${as.gridColumnEnd}`)}"""
new_overlap="""if(ir&&ir.right>ar.left+2){const cs=getComputedStyle(info),as=getComputedStyle(actions);failures.push(`${width<600?'phone':'tablet'} info/actions overlap id=${cardId(card)} info=${Math.round(ir.left)}-${Math.round(ir.right)} action=${Math.round(ar.left)}-${Math.round(ar.right)} card=${Math.round(cr.left)}-${Math.round(cr.right)} infoWidth=${cs.width} infoGrid=${cs.gridColumnStart}/${cs.gridColumnEnd} actionWidth=${as.width} actionGrid=${as.gridColumnStart}/${as.gridColumnEnd}`)}const as=getComputedStyle(actions);if(as.gridColumnStart&&as.gridColumnStart!=='3')failures.push(`action rail not in column 3: ${as.gridColumnStart}`)"""
if old_overlap not in s: raise SystemExit('overlap patch point missing')
s=s.replace(old_overlap,new_overlap,1)

old_width="if(r.width<(width<600?41:44))failures.push('button too narrow');"
new_width="if(r.width<(width<360?33:width<600?37:44))failures.push('button too narrow');"
if old_width not in s: raise SystemExit('button width patch point missing')
s=s.replace(old_width,new_width,1)

# Add a regression test proving a wait-time-only server update does not replace the
# queue card or auto-game control DOM nodes. The visible time text must still update.
marker='await browser.close();\n'
if marker not in s: raise SystemExit('browser close marker missing')
queue_test=r'''
{
 const identity=identities.manager,state=makeState();state.autoGame={enabled:true};
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const page=await context.newPage();
 await page.addInitScript(()=>{try{localStorage.setItem('kokmatch_push_denied_notice629',String(Date.now()));localStorage.setItem('kokmatch_install_guide631_seen','1');sessionStorage.setItem('kokmatch_install_later630','1');const kill=()=>document.getElementById('pwaPrompt629')?.remove();new MutationObserver(kill).observe(document,{childList:true,subtree:true});addEventListener('DOMContentLoaded',kill)}catch{}});
 await installRoutes(page,state,identity);
 await page.goto('http://127.0.0.1:4173/?qa=queue-stability',{waitUntil:'networkidle'});await page.waitForFunction(v=>window.__kokmatchVersionLock===v&&window.__kokmatchQueueStable672===v,VERSION,{timeout:15000});
 await page.evaluate(({state,identity})=>{T='qa-token';localStorage.setItem('kokmatch_token',T);currentGroupId='qa';localStorage.setItem('kokmatch_group_id','qa');currentView='queue';S=JSON.parse(JSON.stringify(state));me=identity;group={groupId:'qa',name:'QA 모임'};groups=[];normalizeClient();renderAll();document.getElementById('login')?.classList.add('hide');},{state:clone(state),identity});
 await page.waitForTimeout(350);
 const before=await page.evaluate(()=>{const q=document.querySelector('#queue .queueCard54,#queue .queueCard53,#queue .queueCard');const a=document.querySelector('#queue .autoGameQueue658');window.__qaQueueNode672=q;window.__qaAutoNode672=a;return{wait:q?.querySelector('.queueInfo53 .compactMeta53,.queueInfo53 .meta')?.textContent||'',auto:!!a}});
 if(!before.auto)throw new Error('queue stability QA missing auto-game card');
 const target=state.members.find(m=>m.id==='mgr');target.joinedAt=Number(target.joinedAt||Date.now())-60000;
 await page.evaluate(()=>loadState(true));await page.waitForTimeout(350);
 const after=await page.evaluate(()=>{const q=document.querySelector('#queue .queueCard54,#queue .queueCard53,#queue .queueCard');const a=document.querySelector('#queue .autoGameQueue658');return{sameQueue:window.__qaQueueNode672===q,sameAuto:window.__qaAutoNode672===a,wait:q?.querySelector('.queueInfo53 .compactMeta53,.queueInfo53 .meta')?.textContent||''}});
 if(!after.sameQueue||!after.sameAuto)throw new Error(`queue wait-only update replaced DOM: ${JSON.stringify({before,after})}`);
 if(after.wait===before.wait)throw new Error(`queue wait text did not update in place: ${JSON.stringify({before,after})}`);
 await context.close();
}

'''
s=s.replace(marker,queue_test+marker,1)

# Update success messages so CI output makes the new contract obvious.
s=s.replace("console.log('PASS iPhone 390px + tablet 768px roster action geometry');","console.log('PASS Fold cover 344px + iPhone 390px + Galaxy 412px + tablet 768px right-side roster rail geometry');")
s=s.replace("console.log('PASS in-place refresh keeps current view and receives new state');","console.log('PASS in-place refresh keeps current view and receives new state');\nconsole.log('PASS queue wait-time updates patch in place without card/auto-control DOM replacement');")

p.write_text(s,encoding='utf-8')
print('prepared v6.72 phone right-rail + queue no-flicker QA')
