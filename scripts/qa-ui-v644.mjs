import fs from 'node:fs';
const js=fs.readFileSync('app-v6.44.js','utf8');
const css=fs.readFileSync('app-v6.44.css','utf8');
const index=fs.readFileSync('index.html','utf8');
const latest=JSON.parse(fs.readFileSync('latest-version.json','utf8'));
function ok(c,m){if(!c)throw new Error(m)}
ok(index.includes('app-v6.44.js?v=6.44'),'index js not v6.44');
ok(index.includes('app-v6.44.css?v=6.44'),'index css not v6.44');
ok(latest.semanticVersion==='6.44','latest version mismatch');
ok(js.includes("const CONTAINERS99='.playingPlayer53"),'legacy v99 tint scope not reduced');
ok(js.includes("const GRADE_BOX12='.playingPlayer53"),'legacy v12 tint scope not reduced');
ok(!js.includes("CONTAINERS99='.memberCard73"),'member/queue still in v99 tint scope');
ok(!js.includes("GRADE_BOX12='.memberCard73"),'member/queue still in v12 tint scope');
ok(css.includes('KokMatch v6.44: iPhone-safe queue surface reset'),'white reset block missing');
for(const s of ['#queue .queueCard54','#queue .composer54 .slot54.filled','#queue .pendingCard54 .pendingSlot54:not(.emptySlot)','background-color:#fff!important','background-image:none!important'])ok(css.includes(s),'missing '+s);
ok(css.includes('content:attr(data-grade643)')||css.includes('content:attr(data-grade644)'),'grade watermark removed');
console.log('PASS v6.44 iPhone queue white-surface QA');
