from pathlib import Path

p=Path('app-v6.59.js')
s=p.read_text(encoding='utf-8')
old="function canAuto659(){return !!me&&(me.globalAdmin===true||me.role==='manager'||me.role==='organizer')}"
new="function canAuto659(){try{const linked=me?.memberId&&typeof M==='function'?M(String(me.memberId)):null;const roles=[String(me?.role||''),String(linked?.role||'')];return !!me&&(me.globalAdmin===true||roles.some(r=>r==='admin'||r==='manager'||r==='organizer'))}catch{return !!me&&(me.globalAdmin===true||me.role==='manager'||me.role==='organizer')}}"
if old not in s: raise SystemExit('canAuto659 target not found')
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')
print('v6.59 linked-role auto permission stabilized')
