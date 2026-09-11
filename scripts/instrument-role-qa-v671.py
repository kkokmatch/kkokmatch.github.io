from pathlib import Path
p=Path('scripts/qa-role-layout-current.mjs')
s=p.read_text(encoding='utf-8')
old="details.push({id:cardId(card),labels:buttons.map(b=>(b.textContent||'').trim()),widths:buttons.map(b=>Math.round(b.getBoundingClientRect().width))});"
new="""const mid=cardId(card),member=(S?.members||[]).find(x=>String(x?.id||'')===mid);const rawButtons=[...actions.querySelectorAll('button')].map(b=>{const cs=getComputedStyle(b),r=b.getBoundingClientRect();return {text:(b.textContent||'').trim(),display:cs.display,visibility:cs.visibility,w:Math.round(r.width),h:Math.round(r.height)}});details.push({id:mid,labels:buttons.map(b=>(b.textContent||'').trim()),widths:buttons.map(b=>Math.round(b.getBoundingClientRect().width)),railClass:actions.className,rawButtons,generated:member&&typeof window.memberControls==='function'?window.memberControls(member):''});"""
if s.count(old)!=1:raise SystemExit(f'diagnostic patch point count={s.count(old)}')
s=s.replace(old,new,1)
s=s.replace("return {failures:[...new Set(failures)],cards:cards.length,ownButtons,details:failures.length?details:undefined};","return {failures:[...new Set(failures)],cards:cards.length,ownButtons,meSnapshot:{memberId:me?.memberId,role:me?.role,globalAdmin:me?.globalAdmin,tempOrganizer:me?.tempOrganizer},details:failures.length?details:undefined};",1)
p.write_text(s,encoding='utf-8')
print('instrumented role QA diagnostics')
