import fs from 'node:fs';
const js=fs.readFileSync('app-v6.43.js','utf8');
const css=fs.readFileSync('app-v6.43.css','utf8');
const html=fs.readFileSync('index.html','utf8');
const latest=JSON.parse(fs.readFileSync('latest-version.json','utf8'));
function ok(cond,msg){if(!cond)throw new Error(msg)}
ok(html.includes('app-v6.43.js?v=6.43'),'index does not point to v6.43 JS');
ok(html.includes('app-v6.43.css?v=6.43'),'index does not point to v6.43 CSS');
ok(latest.label==='v6.43','latest-version not v6.43');
ok(js.includes('window.__kokmatchGradeCards643'),'v6.43 grade decorator missing');
ok(js.includes(".composer54 .slot54"),'composer grade decoration missing');
ok(js.includes(".pendingCard54"),'pending grade decoration missing');
ok(css.includes('background:#fff!important'),'white card rule missing');
ok(css.includes('content:attr(data-grade643)'),'grade watermark missing');
ok(css.includes('border-left-width:5px'),'member left stripe missing');
ok(css.includes('border-right-width:5px'),'right stripe missing');
for(const g of ['A','B','C','D','E']){
  ok(css.includes(`data-grade643=\\"${g}\\"`)||css.includes(`data-grade643="${g}"`),`grade ${g} rule missing`);
}
console.log('PASS v6.43 unified grade card UI');
