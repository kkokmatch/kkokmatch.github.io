from pathlib import Path
import json
from datetime import datetime
from zoneinfo import ZoneInfo

root=Path('.')
js43=(root/'app-v6.43.js').read_text(encoding='utf-8')
css43=(root/'app-v6.43.css').read_text(encoding='utf-8')
idx43=(root/'index.html').read_text(encoding='utf-8')

# Archive current v6.43 runtime.
archive=root/'versions'/'v6.43'
archive.mkdir(parents=True,exist_ok=True)
(archive/'app-v6.43.js').write_text(js43,encoding='utf-8')
(archive/'app-v6.43.css').write_text(css43,encoding='utf-8')
(archive/'index.html').write_text(idx43.replace('/app-v6.43.css?v=6.43','./app-v6.43.css?v=6.43').replace('/app-v6.43.js?v=6.43','./app-v6.43.js?v=6.43'),encoding='utf-8')

# v6.44: remove legacy grade tinting from roster/queue/composer/pending cards.
js44=js43.replace('6.43','6.44')
old99="const CONTAINERS99='.memberCard73,.memberCard71,.memberCard,.queueCard54,.queueCard,.composer54 .slot54,.composer .slot,.slot54,.pendingSlot54,.pendingSlot,.playingPlayer53,.player54,.playerCard,.courtPlayer,.choiceBtn,.pickRow,.candidateRow,.partnerSearchRow82,.partnerPickedCard82,.voteMemberRow,.attendeeRow,.pollMemberRow,.memberVoteRow';"
new99="const CONTAINERS99='.playingPlayer53,.player54,.playerCard,.courtPlayer,.choiceBtn,.pickRow,.candidateRow,.partnerSearchRow82,.partnerPickedCard82,.voteMemberRow,.attendeeRow,.pollMemberRow,.memberVoteRow';"
old12="const GRADE_BOX12='.memberCard73,.memberCard71,.memberCard,.queueCard54,.queueCard,.composer54 .slot54,.composer .slot,.slot54,.pendingSlot54,.pendingSlot,.playingPlayer53,.player54,.playerCard,.courtPlayer,.choiceBtn,.pickRow,.candidateRow,.partnerSearchRow82,.partnerPickedCard82,.voteMemberRow,.attendeeRow,.pollMemberRow,.memberVoteRow';"
new12="const GRADE_BOX12='.playingPlayer53,.player54,.playerCard,.courtPlayer,.choiceBtn,.pickRow,.candidateRow,.partnerSearchRow82,.partnerPickedCard82,.voteMemberRow,.attendeeRow,.pollMemberRow,.memberVoteRow';"
if old99 not in js44: raise SystemExit('CONTAINERS99 legacy tint selector not found')
if old12 not in js44: raise SystemExit('GRADE_BOX12 legacy tint selector not found')
js44=js44.replace(old99,new99,1).replace(old12,new12,1)
(root/'app-v6.44.js').write_text(js44,encoding='utf-8')

# Final canonical queue white-background rule: no grade/data selector dependency.
css44=css43.replace('v6.43','v6.44').rstrip()+r'''

/* KokMatch v6.44: iPhone-safe queue surface reset. Legacy grade tint must never color these member cards. */
#queue .queueCard,
#queue .queueCard53,
#queue .queueCard54,
#queue .composer .slot,
#queue .composer54 .slot54,
#queue .composer54 .slot54.filled,
#queue .pendingSlot,
#queue .pendingSlot54,
#queue .pendingCard54 .pendingSlot54,
#queue .pendingCard54 .pendingSlot54:not(.emptySlot){
  background:#fff!important;
  background-color:#fff!important;
  background-image:none!important;
}
'''
(root/'app-v6.44.css').write_text(css44,encoding='utf-8')

# Update entry and cache/version metadata.
for name in ['index.html','manifest.webmanifest','kokmatch-sw.js','sw.js']:
    p=root/name
    p.write_text(p.read_text(encoding='utf-8').replace('6.43','6.44'),encoding='utf-8')

latest={
  'version':84,
  'label':'v6.44',
  'semanticVersion':'6.44',
  'build':'v6.44',
  'updatedAt':datetime.now(ZoneInfo('Asia/Seoul')).isoformat(timespec='seconds'),
  'note':'v6.44 iPhone 게임대기 급수 배경 잔상 제거 · 개인게임대기·새게임편성·편성대기조 카드 배경 완전 흰색 고정 · 급수띠/워터마크 유지'
}
(root/'latest-version.json').write_text(json.dumps(latest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
