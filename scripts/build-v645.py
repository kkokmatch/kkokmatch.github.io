from pathlib import Path
import json, re
from datetime import datetime
from zoneinfo import ZoneInfo

root=Path('.')
js42=(root/'app-v6.42.js').read_text(encoding='utf-8')
css42=(root/'app-v6.42.css').read_text(encoding='utf-8')

# Archive the current v6.44 production state before restoring the pre-v6.43 queue layout.
archive=root/'versions'/'v6.44'
archive.mkdir(parents=True,exist_ok=True)
for name in ['app-v6.44.js','app-v6.44.css']:
    (archive/name).write_text((root/name).read_text(encoding='utf-8'),encoding='utf-8')
idx44=(root/'index.html').read_text(encoding='utf-8')
arch_idx=idx44.replace('/app-v6.44.css?v=6.44','./app-v6.44.css?v=6.44').replace('/app-v6.44.js?v=6.44','./app-v6.44.js?v=6.44')
(archive/'index.html').write_text(arch_idx,encoding='utf-8')

# Restore the last known-good pre-v6.43 UI/runtime, then change ONLY queue member-card backgrounds.
js45=js42.replace('6.42','6.45')

# Legacy grade-tint code must not paint anything inside #queue. Keep all other legacy behavior untouched.
for fn in ['tintGradeContainers97','tintAllGrades99']:
    old=f"function {fn}(root=document){{"
    new=old+"if(root?.id==='queue')return;"
    if old not in js45:
        raise SystemExit(f'{fn} insertion point missing')
    js45=js45.replace(old,new,1)

# When these functions are called with document, skip queue tags before their fallback container lookup.
old="tags.forEach(tag=>{\n  const txt=(tag.textContent||'').trim();"
new="tags.forEach(tag=>{\n  if(tag.closest?.('#queue'))return;\n  const txt=(tag.textContent||'').trim();"
if old not in js45:
    raise SystemExit('v97 tag loop insertion point missing')
js45=js45.replace(old,new,1)

old="function tintAllGrades99(root=document){if(root?.id==='queue')return;[...root.querySelectorAll('.tag')].forEach(tag=>{"
new="function tintAllGrades99(root=document){if(root?.id==='queue')return;[...root.querySelectorAll('.tag')].forEach(tag=>{if(tag.closest?.('#queue'))return;"
if old not in js45:
    raise SystemExit('v99 tag loop insertion point missing')
js45=js45.replace(old,new,1)

non_queue_boxes='.memberCard73,.memberCard71,.memberCard,.playingPlayer53,.player54,.playerCard,.courtPlayer,.choiceBtn,.pickRow,.candidateRow,.partnerSearchRow82,.partnerPickedCard82,.voteMemberRow,.attendeeRow,.pollMemberRow,.memberVoteRow'
for name in ['GRADE_BOX12','GRADE_BOX17']:
    js45,n=re.subn(rf"const {name}='[^']*';",f"const {name}='{non_queue_boxes}';",js45,count=1)
    if n!=1:
        raise SystemExit(f'{name} replacement failed')

# v99 has a fallback lookup, so also remove queue/member-slot candidates from its primary list.
js45,n=re.subn(r"const CONTAINERS99='[^']*';",f"const CONTAINERS99='{non_queue_boxes}';",js45,count=1)
if n!=1:
    raise SystemExit('CONTAINERS99 replacement failed')

(root/'app-v6.45.js').write_text(js45,encoding='utf-8')

# Preserve v6.42 layout exactly. Only filled member surfaces in the queue screen are forced white.
css45=css42.replace('KokMatch v6.42','KokMatch v6.45')+r'''

/* KokMatch v6.45: background-only queue correction. Do not change layout, spacing, badges, or controls. */
#queue .queueCard.queueCard53,
#queue .queueCard.queueCard54{
  background:#fff!important;
  background-color:#fff!important;
  background-image:none!important;
}

/* New-game composer: only the filled member card surface becomes white. */
#queue .composer54 .slot54.pendingSlot.filled,
#queue .composer54 .slot54.filled,
#queue .composer .slot.filled{
  background:#fff!important;
  background-color:#fff!important;
  background-image:none!important;
}

/* Pending groups: only occupied member cards become white; empty slots and group container keep their original appearance. */
#queue .pendingCard54 .pendingSlot54:not(.emptySlot),
#queue .pendingCard .pendingSlot53:not(.emptySlot),
#queue .pendingCard .pendingSlot:not(.emptySlot){
  background:#fff!important;
  background-color:#fff!important;
  background-image:none!important;
}
'''
(root/'app-v6.45.css').write_text(css45,encoding='utf-8')

# Switch entry/update metadata to v6.45 without changing any other entry behavior.
for name in ['index.html','manifest.webmanifest','kokmatch-sw.js','sw.js']:
    p=root/name
    text=p.read_text(encoding='utf-8').replace('6.44','6.45')
    p.write_text(text,encoding='utf-8')

latest={
  'version':85,
  'label':'v6.45',
  'semanticVersion':'6.45',
  'build':'v6.45',
  'updatedAt':datetime.now(ZoneInfo('Asia/Seoul')).isoformat(timespec='seconds'),
  'note':'v6.45 v6.42 게임대기 화면구조 복원 · 개인게임대기/새게임편성/편성대기조 회원카드 배경만 흰색 고정 · 레이아웃/표시 변경 제거'
}
(root/'latest-version.json').write_text(json.dumps(latest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
