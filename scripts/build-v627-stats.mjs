import fs from 'node:fs';
import cp from 'node:child_process';
const read=p=>fs.readFileSync(p,'utf8'),write=(p,s)=>fs.writeFileSync(p,s);
let js=read('app-v6.26.js');

const baseStart=js.indexOf('function renderStats(){');
const baseEnd=js.indexOf('function openPairs(',baseStart);
if(baseStart<0||baseEnd<0)throw new Error('base renderStats block not found');
js=js.slice(0,baseStart)+"function renderStats(){const box=$('stats');if(box)box.innerHTML='<div class=\"statsLegacyBase627\"></div>'}\n"+js.slice(baseEnd);

const oldSelect="window.selectPollDate623=function(dt){selectedDate623=String(dt);month623=selectedDate623.slice(0,7);renderPoll623()};";
const newSelect="window.selectPollDate623=function(dt){selectedDate623=String(dt);month623=selectedDate623.slice(0,7);renderPoll623();try{window.__kokmatchStatsDateChanged627?.(selectedDate623,month623)}catch{}};";
if(!js.includes(oldSelect))throw new Error('poll date selector not found');
js=js.replace(oldSelect,newSelect);
const oldMove="window.movePollMonth623=function(delta){const next=ymShift623(month623,Number(delta)||0);if(next<earliestMonth623())return;month623=next;selectedDate623=next===today623().slice(0,7)?today623():`${next}-01`;renderPoll623()};";
const newMove="window.movePollMonth623=function(delta){const next=ymShift623(month623,Number(delta)||0);if(next<earliestMonth623())return;month623=next;selectedDate623=next===today623().slice(0,7)?today623():`${next}-01`;renderPoll623();try{window.__kokmatchStatsDateChanged627?.(selectedDate623,month623)}catch{}};";
if(!js.includes(oldMove))throw new Error('poll month mover not found');
js=js.replace(oldMove,newMove);
js=js.replaceAll("['stats','▥','오늘통계']","['stats','▥','운동통계']");
js+='\n'+read('scripts/stats-v627-runtime.js')+'\n';
js=js.replaceAll("window.__kokmatchStandalone='6.26'","window.__kokmatchStandalone='6.27'")
     .replaceAll("window.__kokmatchVersionLock='6.26'","window.__kokmatchVersionLock='6.27'")
     .replaceAll("sessionStorage.setItem('kokmatch_runtime_version','6.26')","sessionStorage.setItem('kokmatch_runtime_version','6.27')");
if(js.includes('오늘 최근 경기'))throw new Error('legacy recent-game section remains');
if(!js.includes('kokmatch-stats-v54')||!js.includes('statsMonthlyTable627')||!js.includes('__kokmatchStatsDateChanged627'))throw new Error('v6.27 stats runtime missing');
write('app-v6.27.js',js);
write('app-v6.27.css',read('app-v6.26.css')+'\n'+read('scripts/stats-v627.css')+'\n');
let index=read('index.html');
index=index.replaceAll('app-v6.26.css?v=6.26','app-v6.27.css?v=6.27').replaceAll('app-v6.26.js?v=6.26','app-v6.27.js?v=6.27').replaceAll('6.26','6.27').replaceAll('v626','v627');
write('index.html',index);
const latest=JSON.parse(read('latest-version.json'));
latest.version=67;latest.label='v6.27';latest.semanticVersion='6.27';latest.build='v6.27';latest.updatedAt='2026-09-02T16:51:00+09:00';latest.note='v6.27 달력 선택 날짜별 통계 · 월간 회원 기록/정렬 · 출석 0회 필터 · 최근경기 제거';
write('latest-version.json',JSON.stringify(latest,null,2)+'\n');
cp.execFileSync('node',['--check','app-v6.27.js'],{stdio:'inherit'});
cp.execFileSync('node',['scripts/validate-standalone-runtime.mjs'],{stdio:'inherit'});
console.log('PASS v6.27 build: selected-date stats + monthly sortable member records');
