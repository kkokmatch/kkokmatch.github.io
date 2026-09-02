import fs from 'node:fs';
import cp from 'node:child_process';

const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);
let src=read('app-v6.23.js');
const beforeBytes=Buffer.byteLength(src);
const removed=[];

function segmentBounds(name){
  const marker=`/* migrated into v6.0: ${name} */`;
  const start=src.indexOf(marker);
  if(start<0)return null;
  const next=src.indexOf('/* migrated into v6.0:',start+marker.length);
  return {start,end:next<0?src.length:next,marker};
}
function removeBlock(name){
  const b=segmentBounds(name);if(!b)return 0;
  const bytes=Buffer.byteLength(src.slice(b.start,b.end));
  src=src.slice(0,b.start)+src.slice(b.end);
  removed.push({name,bytes,mode:'whole'});return bytes;
}
function transformBlock(name,fn){
  const b=segmentBounds(name);if(!b)return false;
  const old=src.slice(b.start,b.end),next=fn(old);
  if(next===old)return false;
  src=src.slice(0,b.start)+next+src.slice(b.end);
  removed.push({name,bytes:Buffer.byteLength(old)-Buffer.byteLength(next),mode:'surgical'});return true;
}
function cut(s,a,b,repl=''){
  const i=s.indexOf(a);if(i<0)return s;
  const j=s.indexOf(b,i+a.length);if(j<0)return s;
  return s.slice(0,i)+repl+s.slice(j);
}

// Pure historical poll generations: no runtime compatibility stubs retained.
for(const name of ['app-v76.js','app-v90.js','app-v1.9.js','app-v2.0.js','app-v2.1.js','app-v2.2.js','app-v91.js']) removeBlock(name);

// v2.3 also contains queue composer gender UI. Preserve only that non-poll behavior.
transformBlock('app-v2.3.js',seg=>{
  if(!seg.includes('function genderPerson23')||!seg.includes('function decorateComposerGender23'))return seg;
  const marker='/* migrated into v6.0: app-v2.3.js */';
  const g0=seg.indexOf('function genderPerson23');
  const rq=seg.indexOf('const renderQueue22=renderQueue;',g0);
  const afterDraft=seg.indexOf('const openCreate22=window.openPollCreate72;',rq);
  if(g0<0||rq<0)return seg;
  let body=seg.slice(g0, afterDraft>0?afterDraft:seg.lastIndexOf('})();'));
  // body now contains gender helpers + queue wrappers only.
  body=body.replace(/\nfunction fixPollForm23\(\)[\s\S]*?function rejectPast23\([\s\S]*?\n}\n(?=\nconst renderQueue22)/,'\n');
  return `${marker}\n(()=>{\n${body.trim()}\nif(me&&currentView==='queue')decorateComposerGender23();\n})();\n\n`;
});

// v3.3 login is still active; remove any remaining poll decoration tail if an older copy exists.
transformBlock('app-v3.3.js',seg=>{
  const i=seg.indexOf('function selectedPollDate33');
  if(i<0)return seg;
  const head=seg.slice(0,i);
  return head+"if(!T)renderLoginName();\n})();\n\n";
});

// v5.1 keeps version refresh + stable member roster guard. Remove old poll decorators/listeners.
transformBlock('app-v5.1.js',seg=>{
  const i=seg.indexOf('function selectedPollDate51');
  if(i<0)return seg;
  const end=seg.lastIndexOf('})();');
  let head=seg.slice(0,i);
  head += "setTimeout(()=>{ensure51();latestCheck51()},0);setInterval(()=>latestCheck51(),60000);\n";
  return head+'})();\n\n';
});

// v72 remains the game/court API layer. Remove only its attendance-poll implementation.
transformBlock('app-v72.js',seg=>{
  let s=seg;
  const a=s.indexOf('function mine72()');
  const b=s.indexOf('function avgWaitMin72()',a);
  if(a>=0&&b>a)s=s.slice(0,a)+s.slice(b);
  const p=s.indexOf('/* Attendance polls */');
  const settings=s.indexOf('/* Settings:',p);
  if(p>=0&&settings>p){
    const stats=`const renderStats71=renderStats;\nrenderStats=function(){\n renderStats71();const box=$('stats');if(!box)return;\n const grid=box.querySelector('.statsGrid');if(grid&&!grid.querySelector('.avgWaitStat624')){grid.classList.add('statsGrid72');grid.insertAdjacentHTML('beforeend',\`<div class=\"stat avgWaitStat624\"><b>\${avgWaitMin72()}분</b>평균 게임 대기시간</div>\`)}\n};\n\n`;
    s=s.slice(0,p)+stats+s.slice(settings);
  }
  return s;
});

// v73 keeps member attendance-history and game routing; remove its poll form/render chain.
transformBlock('app-v73.js',seg=>cut(seg,'function autoPollTitle73','function patchResetText73'));

// v74 keeps grouped attendance-history UI; remove only poll creation overrides.
transformBlock('app-v74.js',seg=>cut(seg,'function autoPollTitle74','const renderSettings73'));

// v1.8 keeps the iPhone/IME member-search stabilization only.
transformBlock('app-v1.8.js',seg=>{
  const a=seg.indexOf('/* iPhone/tablet member search:');
  const b=seg.indexOf('const settingsBefore18',a);
  if(a<0||b<a)return seg;
  const marker='/* migrated into v6.0: app-v1.8.js */';
  const search=seg.slice(a,b).trim();
  return `${marker}\n(()=>{\nlet searchComposing18=false,searchTimer18=0;\n${search}\nif(me){try{bindMemberSearch18()}catch{}}\n})();\n\n`;
});

// Remove legacy poll API endpoints if any historical residue remains. v72/v73 are intentionally retained for non-poll game/court work.
for(const old of ['kokmatch-v18-api','kokmatch-v19-api','kokmatch-v74-api','kokmatch-v76-api','kokmatch-v90-api']){
  src=src.replaceAll(old,'kokmatch-v21-api');
}

// Normalize runtime identity to v6.24.
src=src.replaceAll("window.__kokmatchStandalone='6.23'","window.__kokmatchStandalone='6.24'");
src=src.replaceAll("window.__kokmatchVersionLock='6.23'","window.__kokmatchVersionLock='6.24'");
src=src.replaceAll("sessionStorage.setItem('kokmatch_runtime_version','6.23')","sessionStorage.setItem('kokmatch_runtime_version','6.24')");
src=src.replaceAll("document.documentElement.dataset.kokmatchVersion='6.23'","document.documentElement.dataset.kokmatchVersion='6.24'");

// Static cleanup assertions: old poll generations and direct obsolete endpoints must be gone.
for(const name of ['app-v76.js','app-v90.js','app-v1.9.js','app-v2.0.js','app-v2.1.js','app-v2.2.js','app-v91.js']){
  if(src.includes(`/* migrated into v6.0: ${name} */`))throw new Error(`legacy poll block remains: ${name}`);
}
for(const old of ['kokmatch-v18-api','kokmatch-v19-api','kokmatch-v74-api','kokmatch-v76-api','kokmatch-v90-api'])if(src.includes(old))throw new Error(`legacy poll endpoint remains: ${old}`);
for(const dead of ['pollWrap90','pollCard21','pollCalDay21','decoratePollCards33','decoratePollNow51','patchPollCounts18'])if(src.includes(dead))throw new Error(`legacy poll DOM/decorator remains: ${dead}`);
if(!src.includes('kokmatch-v21-api'))throw new Error('canonical v21 poll API missing');

write('app-v6.24.js',src);
write('app-v6.24.css',read('app-v6.23.css').replaceAll('v6.23','v6.24'));

let index=read('index.html');
index=index.replaceAll('app-v6.23.css?v=6.23','app-v6.24.css?v=6.24').replaceAll('app-v6.23.js?v=6.23','app-v6.24.js?v=6.24').replaceAll('v6.23','v6.24').replaceAll("'6.23'","'6.24'").replaceAll('data-kokmatch-version="6.23"','data-kokmatch-version="6.24"').replaceAll('data-kokmatch-build="v6.23"','data-kokmatch-build="v6.24"');
write('index.html',index);

const latest=JSON.parse(read('latest-version.json'));
latest.version=64;latest.label='v6.24';latest.semanticVersion='6.24';latest.build='v6.24';latest.updatedAt='2026-09-02T15:43:00+09:00';latest.note='v6.24 과거 투표 코드 의존성 제거 · canonical 단일 런타임 · v21 투표 API 단일화 · 회귀 안정화';
write('latest-version.json',JSON.stringify(latest,null,2)+'\n');

cp.execFileSync('node',['--check','app-v6.24.js'],{stdio:'inherit'});
cp.execFileSync('node',['scripts/validate-standalone-runtime.mjs'],{stdio:'inherit'});
console.log(JSON.stringify({beforeBytes,afterBytes:Buffer.byteLength(src),removed,canonicalPollApi:'kokmatch-v21-api',retainedNonPollApis:['kokmatch-v72-api','kokmatch-v73-api']},null,2));
