import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const js=read('app-v6.45.js');
const css=read('app-v6.45.css');
const idx=read('index.html');
const latest=JSON.parse(read('latest-version.json'));
const must=(ok,msg)=>{if(!ok)throw new Error(msg)};

must(idx.includes('/app-v6.45.css?v=6.45'),'index missing v6.45 css');
must(idx.includes('/app-v6.45.js?v=6.45'),'index missing v6.45 js');
must(latest.label==='v6.45','latest-version is not v6.45');
must(js.includes("window.__kokmatchStandalone='6.45'"),'standalone version mismatch');
must(js.includes("if(tag.closest?.('#queue'))return;"),'legacy queue tint guard missing');

for(const name of ['GRADE_BOX12','GRADE_BOX17','CONTAINERS99']){
  const m=js.match(new RegExp(`const ${name}='([^']*)';`));
  must(m,`${name} missing`);
  for(const bad of ['queueCard','composer54','pendingSlot','slot54']) must(!m[1].includes(bad),`${name} still colors ${bad}`);
}

must(css.includes('KokMatch v6.45: background-only queue correction'),'v6.45 css marker missing');
must(css.includes('#queue .composer54 .slot54.pendingSlot.filled'),'new-game filled card white override missing');
must(css.includes('#queue .pendingCard54 .pendingSlot54:not(.emptySlot)'),'pending filled card white override missing');
must(css.includes('background-color:#fff!important'),'white background enforcement missing');
must(!css.includes('data-grade643'),'v6.43 grade-watermark styling leaked into v6.45');
must(!js.includes('__kokmatchGradeCards643'),'v6.43 grade-card decorator leaked into v6.45');
console.log('PASS v6.45 background-only queue correction');
