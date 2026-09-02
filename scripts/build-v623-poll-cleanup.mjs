import fs from 'node:fs';
import cp from 'node:child_process';

const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);
const srcPath='app-v6.22.js';
let src=read(srcPath);
const beforeBytes=Buffer.byteLength(src);

function removeMigrationBlock(name){
  const marker=`/* migrated into v6.0: ${name} */`;
  const start=src.indexOf(marker);
  if(start<0)throw new Error(`missing migration block ${name}`);
  const next=src.indexOf('/* migrated into v6.0:',start+marker.length);
  if(next<0)throw new Error(`missing next block after ${name}`);
  const removed=src.slice(start,next);
  src=src.slice(0,start)+src.slice(next);
  return Buffer.byteLength(removed);
}

const pureBlocks=['app-v76.js','app-v90.js','app-v1.9.js','app-v2.0.js','app-v2.1.js','app-v2.2.js'];
let removedBytes=0;
for(const b of pureBlocks)removedBytes+=removeMigrationBlock(b);

// Any legacy poll request path left in mixed historical blocks is routed to the single canonical v21 API.
src=src.replace(/kokmatch-v(?:18|19|72|73|74|76|90)-api/g,'kokmatch-v21-api');

// Current runtime identity.
src=src.replace("window.__kokmatchStandalone='6.22';","window.__kokmatchStandalone='6.23';");
src=src.replace("window.__kokmatchVersionLock='6.22';","window.__kokmatchVersionLock='6.23';");
src=src.replace("sessionStorage.setItem('kokmatch_runtime_version','6.22')","sessionStorage.setItem('kokmatch_runtime_version','6.23')");

const canonical=read('scripts/poll-v623-canonical.js').trim();
src+='\n\n'+canonical+'\n';
write('app-v6.23.js',src);

let css=read('app-v6.22.css');
css+=`\n\n/* v6.23 canonical exercise attendance poll */\n.pollWrap623{margin-top:12px}.pollCalendar623{background:#fff;border:1px solid #e5eaf2;border-radius:16px;padding:12px;margin-bottom:12px}.pollCalHead623{display:grid;grid-template-columns:44px 1fr 44px;align-items:center;text-align:center;margin-bottom:8px}.pollCalHead623 button{border:0;background:#eef4ff;border-radius:10px;min-height:36px;font-size:22px}.pollCalHead623 button:disabled{opacity:.3}.pollWeek623,.pollGrid623{display:grid;grid-template-columns:repeat(7,1fr);gap:4px}.pollWeek623 span{text-align:center;font-size:11px;font-weight:800;color:#728097;padding:3px 0}.pollDay623,.pollBlank623{min-width:0;aspect-ratio:1;border:0;border-radius:9px;background:#f7f9fc;font-weight:800;position:relative}.pollDay623.sun623{color:#d94a4a}.pollDay623.sat623{color:#376bb0}.pollDay623.today{outline:2px solid #8eb8ef}.pollDay623.selected{background:#2267aa;color:#fff}.pollDay623.hasPoll:after{content:'';width:5px;height:5px;border-radius:50%;background:#44ad74;position:absolute;left:50%;bottom:3px;transform:translateX(-50%)}.pollDay623.selected.hasPoll:after{background:#fff}.pollLegend623{display:flex;justify-content:space-between;gap:8px;font-size:11px;color:#718096;margin-top:8px}.pollLegend623 i{display:inline-block;width:6px;height:6px;border-radius:50%;background:#44ad74;margin-right:4px}.pollHead623{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:12px 0 8px}.pollCard623{margin-bottom:10px}.pollTitleRow623{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}.pollMainTitle623{font-size:17px;font-weight:900;line-height:1.35}.pollSchedule623{font-size:12px;font-weight:700;color:#52627a;margin-top:4px}.pollCreator623{font-size:11px;color:#8290a4;margin-top:3px}.pollEnded623{display:inline-flex;font-size:10px;background:#edf0f4;color:#667085;border-radius:999px;padding:3px 6px;vertical-align:2px}.pollAdminBtns623{display:flex;gap:4px;flex:0 0 auto}.pollMini623{border:1px solid #ccd8e7;background:#fff;border-radius:8px;padding:6px 8px;font-size:11px;font-weight:800}.pollMini623.danger{color:#bd3d3d}.pollCounts623{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:11px 0}.pollCounts623>div{background:#f5f8fc;border-radius:11px;padding:8px;text-align:center}.pollCounts623 b{display:block;font-size:16px}.pollCounts623 span{display:block;font-size:10px;color:#68788e;margin-top:2px}.pollActions623{display:grid;grid-template-columns:1fr 1fr;gap:6px}.pollAttendOn623{background:#e7f4ff!important;color:#17609c!important;border-color:#87b9e3!important}.pollGuestBtns623{display:flex;align-items:center;gap:6px;margin-top:7px}.pollGuestBtns623 .btn{flex:1}.pollFormGrid623{display:grid;grid-template-columns:1fr 1fr;gap:8px}.pollFormGrid623 .field{margin:0}.pollFormGrid623 .pollWide623{grid-column:1/-1}.pollPerson623{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:9px 4px;border-bottom:1px solid #edf1f6}.pollPerson623>div{display:flex;align-items:center;gap:6px;flex-wrap:wrap}.pollPerson623 small{width:100%;padding-left:29px;color:#7a8799}.pollPerson623>button{border:0;background:#fbeaea;color:#b43d3d;width:28px;height:28px;border-radius:50%;font-weight:900}.pollGender623{display:inline-flex;width:22px;height:22px;align-items:center;justify-content:center;border-radius:50%;font-size:10px;font-weight:900}.pollGender623.male{background:#e6f0ff;color:#2e68a6}.pollGender623.female{background:#ffeaf1;color:#b64d73}.pollGrade623,.pollRole623{display:inline-flex;border-radius:999px;padding:3px 6px;font-size:10px;font-weight:900;background:#eef2f7;color:#44546b}.pollRole623.dev{background:#e8e8ff;color:#4b4bb0}.pollRole623.manager{background:#fff0d7;color:#94611d}.pollRole623.organizer{background:#e7f6ef;color:#287553}.pollRole623.guest{background:#f1ebff;color:#6c4ea3}.pollListSection623{margin-top:12px}.pollListHead623{display:flex;justify-content:space-between;align-items:center;margin-bottom:5px}.pollEmpty623{margin-top:8px}@media(max-width:430px){.pollCalendar623{padding:9px}.pollDay623{font-size:12px}.pollFormGrid623{grid-template-columns:1fr}.pollFormGrid623 .pollWide623{grid-column:auto}.pollActions623{grid-template-columns:1fr 1fr}.pollMainTitle623{font-size:16px}}\n`;
write('app-v6.23.css',css);

let index=read('index.html');
index=index.replaceAll('app-v6.22.css?v=6.22','app-v6.23.css?v=6.23').replaceAll('app-v6.22.js?v=6.22','app-v6.23.js?v=6.23').replaceAll("'6.22'","'6.23'").replaceAll('v6.22','v6.23').replaceAll('data-kokmatch-version="6.22"','data-kokmatch-version="6.23"').replaceAll('data-kokmatch-build="v6.22"','data-kokmatch-build="v6.23"');
write('index.html',index);

const latest=JSON.parse(read('latest-version.json'));
latest.version=63;latest.label='v6.23';latest.semanticVersion='6.23';latest.build='v6.23';latest.updatedAt='2026-09-02T15:00:00+09:00';latest.note='v6.23 운동참석투표 canonical 단일화 · v21 API 통합 · 중복 투표 런타임 제거 · 안정화 QA';
write('latest-version.json',JSON.stringify(latest,null,2)+'\n');

// Runtime assertions.
if(!src.includes('KokMatch v6.23 canonical exercise attendance poll runtime'))throw new Error('canonical poll module missing');
for(const b of pureBlocks)if(src.includes(`/* migrated into v6.0: ${b} */`))throw new Error(`dead poll block still present: ${b}`);
for(const old of ['kokmatch-v18-api','kokmatch-v19-api','kokmatch-v72-api','kokmatch-v73-api','kokmatch-v74-api','kokmatch-v76-api','kokmatch-v90-api'])if(src.includes(old))throw new Error(`legacy poll API still referenced: ${old}`);
if(!src.includes('kokmatch-v21-api'))throw new Error('canonical v21 API missing');

cp.execFileSync('node',['--check','app-v6.23.js'],{stdio:'inherit'});
cp.execFileSync('node',['scripts/validate-standalone-runtime.mjs'],{stdio:'inherit'});
console.log(JSON.stringify({beforeBytes,afterBytes:Buffer.byteLength(src),removedPurePollBytes:removedBytes,removedBlocks:pureBlocks,api:'kokmatch-v21-api'},null,2));
