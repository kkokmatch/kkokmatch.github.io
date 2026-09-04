import fs from 'node:fs';

const js=fs.readFileSync('app-v6.42.js','utf8');
const css=fs.readFileSync('app-v6.42.css','utf8');
const html=fs.readFileSync('index.html','utf8');
const latest=JSON.parse(fs.readFileSync('latest-version.json','utf8'));

function ok(cond,msg){if(!cond)throw new Error(msg)}

ok(html.includes('data-kokmatch-version="6.42"'),'index version is not 6.42');
ok(html.includes('/app-v6.42.css?v=6.42'),'index css is not v6.42');
ok(html.includes('/app-v6.42.js?v=6.42'),'index js is not v6.42');
ok(latest.semanticVersion==='6.42','latest-version is not v6.42');

ok(js.includes('window.__kokmatchQueueGrade642=true'),'queue grade decorator missing');
ok(js.includes("card.dataset.queueGrade642=g"),'queue grade data marker missing');
ok(js.includes('const renderQueue641=renderQueue'),'renderQueue wrapper missing');

ok(css.includes('#members .memberCard[data-grade-v6]'),'member white override missing');
ok(css.includes('#queue .queueCard54[data-queue-grade642]'),'queue right stripe base missing');
ok(css.includes('border-right-width:5px!important'),'queue right stripe width missing');
ok(css.includes('data-queue-grade642="A"]{border-right-color:#A60093!important}'),'A stripe color mismatch');
ok(css.includes('data-queue-grade642="B"]{border-right-color:#00CFC6!important}'),'B stripe color mismatch');
ok(css.includes('data-queue-grade642="C"]{border-right-color:#10D400!important}'),'C stripe color mismatch');
ok(css.includes('data-queue-grade642="D"]{border-right-color:#DE9999!important}'),'D stripe color mismatch');
ok(css.includes('data-queue-grade642="E"]{border-right-color:#EBE202!important}'),'E stripe color mismatch');

// Keep the existing member-roster grade stripe; this release only neutralizes its background.
ok(css.includes('border-left-width:5px!important'),'member left grade stripe was removed');
ok(css.includes('border-left-color:#A60093!important'),'member A stripe color missing');

console.log('v6.42 card UI QA passed');
