from pathlib import Path
p=Path('app-v6.77.js')
s=p.read_text(encoding='utf-8')
s=s.replace(" try{window.__kokmatchFinalizeRoster22?.()}catch{}\n","")
p.write_text(s,encoding='utf-8')
print('removed roster finalizer from live-state patch path')
