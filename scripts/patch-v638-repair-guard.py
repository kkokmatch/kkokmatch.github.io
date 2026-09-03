from pathlib import Path

p = Path('app-v6.38.js')
s = p.read_text(encoding='utf-8')
old = "function repairMemberControlsV6(){\n"
new = "function repairMemberControlsV6(){\n if(Date.now()<Number(window.__kokmatchResumeNoRailReplaceUntil638||0))return;\n"
if old not in s:
    raise SystemExit('repairMemberControlsV6 insertion point missing')
s = s.replace(old, new, 1)
p.write_text(s, encoding='utf-8')
print('patched v6.38 repairMemberControlsV6 resume guard')
