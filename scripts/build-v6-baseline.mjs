import fs from 'node:fs';
import crypto from 'node:crypto';

const VERSION='6.0';
const indexPath='index.html';
const legacy=fs.readFileSync(indexPath,'utf8');
const uniq=a=>[...new Set(a)];
const cssFiles=uniq([...legacy.matchAll(/href=["']\/(app-v[^"'?]+\.css)(?:\?[^"']*)?["']/g)].map(m=>m[1]));
const initialJs=uniq([...legacy.matchAll(/src=["']\/(app-v[^"'?]+\.js)(?:\?[^"']*)?["']/g)].map(m=>m[1]));

if(!initialJs.includes('app-v35.js')||!initialJs.includes('app-v5.1.js')){
  throw new Error('v6 baseline builder is one-time only and must run against the v5.4 cumulative index.');
}

const excluded=new Set(['app-v5.4-hotfix-loader.js','app-v5.4-fix25.js']);
const v54Fixes=[
  'app-v5.4-fix4.js','app-v5.4-fix5.js','app-v5.4-kakao-login-fix.js',
  'app-v5.4-fix21.js','app-v5.4-fix22.js','app-v5.4-fix23.js','app-v5.4-fix24.js','app-v5.4-fix26.js'
];

function sha(text){return crypto.createHash('sha256').update(text).digest('hex')}
function read(file){if(!fs.existsSync(file))throw new Error(`Missing migration source: ${file}`);return fs.readFileSync(file,'utf8')}
function dynamicTargets(text){return uniq([...text.matchAll(/\.src\s*=\s*["']\/(app-v[^"'?]+\.js)(?:\?[^"']*)?["']/g)].map(m=>m[1]))}
function stripTailDynamicLoader(file,text){
  const match=/\.src\s*=\s*["']\/(app-v[^"'?]+\.js)(?:\?[^"']*)?["']/.exec(text);
  if(!match)return {text,targets:[]};
  const start=text.lastIndexOf('(()=>{',match.index);
  if(start<0)throw new Error(`Dynamic legacy loader is not an isolated tail IIFE: ${file} -> ${match[1]}`);
  const tail=text.slice(start).trim();
  if(!tail.endsWith('})();'))throw new Error(`Dynamic legacy loader tail is not safely removable: ${file} -> ${match[1]}`);
  const targets=dynamicTargets(tail);
  if(!targets.length)throw new Error(`Could not resolve dynamic legacy loader target in ${file}`);
  return {text:text.slice(0,start),targets};
}
function normalizeVersion(text){
  return text.replaceAll("window.__kokmatchVersionLock='5.4'","window.__kokmatchVersionLock='6.0'")
    .replaceAll('window.__kokmatchVersionLock="5.4"','window.__kokmatchVersionLock="6.0"')
    .replaceAll("const CUR54='5.4'","const CUR54='6.0'")
    .replaceAll("document.title='콕매치 v5.4'","document.title='콕매치 v6.0'")
    .replaceAll("document.documentElement.dataset.kokmatchVersion='5.4'","document.documentElement.dataset.kokmatchVersion='6.0'")
    .replaceAll('콕매치 v5.4','콕매치 v6.0')
    .replaceAll('>v5.4<','>v6.0<');
}

const orderedJs=[];
const seen=new Set();
function migrateFile(file){
  if(!file||excluded.has(file)||seen.has(file))return;
  seen.add(file);
  let raw=read(file);
  const stripped=stripTailDynamicLoader(file,raw);
  let text=normalizeVersion(stripped.text).trim();
  orderedJs.push({file,text});
  for(const target of stripped.targets)migrateFile(target);
  if(file==='app-v5.4.js')for(const fix of v54Fixes)migrateFile(fix);
}
for(const file of initialJs)migrateFile(file);

const cssParts=[];
const cssManifest=[];
for(const file of cssFiles){
  let text=read(file).replace(/^\s*@charset\s+[^;]+;\s*/i,'').trim();
  cssParts.push(`/* migrated into v${VERSION}: ${file} */\n${text}`);
  cssManifest.push({file,sha256:sha(text)});
}
const css=`/* 콕매치 v${VERSION} standalone stylesheet. Runtime must load this file only. */\n${cssParts.join('\n\n')}`;
fs.writeFileSync(`app-v${VERSION}.css`,css+'\n');

const jsParts=[];
const jsManifest=[];
for(const {file,text} of orderedJs){
  jsParts.push(`/* migrated into v${VERSION}: ${file} */\n${text}`);
  jsManifest.push({file,sha256:sha(text)});
}
const preamble=`/* 콕매치 v${VERSION} standalone runtime. Do not dynamically load prior app versions. */\nwindow.__kokmatchStandalone='${VERSION}';\nwindow.__kokmatchVersionLock='${VERSION}';\nwindow.__kokmatchLegacyAutoUpdateDisabled=true;\ntry{sessionStorage.setItem('kokmatch_runtime_version','${VERSION}')}catch{}\n`;
const footer=`\nwindow.__kokmatchStandalone='${VERSION}';\nwindow.__kokmatchVersionLock='${VERSION}';\ndocument.documentElement.dataset.kokmatchVersion='${VERSION}';\ndocument.title='콕매치 v${VERSION}';\n`;
const js=preamble+'\n'+jsParts.join('\n\n')+'\n'+footer;

const oldDynamic=[...js.matchAll(/\.src\s*=\s*["']\/app-v[^"']+/g)].map(m=>m[0]);
if(oldDynamic.length)throw new Error('Legacy dynamic app loads remain in v6 bundle: '+oldDynamic.slice(0,10).join(', '));
fs.writeFileSync(`app-v${VERSION}.js`,js+'\n');

const index=`<!doctype html>
<html lang="ko" data-kokmatch-version="${VERSION}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="theme-color" content="#2453d4">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <meta name="apple-mobile-web-app-title" content="콕매치">
  <link rel="manifest" href="/manifest.webmanifest">
  <link rel="stylesheet" href="/app-v${VERSION}.css?v=${VERSION}">
  <title>콕매치 v${VERSION}</title>
</head>
<body>
  <script>window.__kokmatchStandalone='${VERSION}';window.__kokmatchVersionLock='${VERSION}';</script>
  <script src="/app-v${VERSION}.js?v=${VERSION}"></script>
</body>
</html>\n`;
fs.writeFileSync(indexPath,index);

const latest={version:60,label:VERSION,semanticVersion:VERSION,build:'2026.08.31.standalone.1',updatedAt:'2026-08-31T09:30:00+09:00',note:'누적형 구버전 로드를 종료한 v6.0 독립 운영본'};
fs.writeFileSync('latest-version.json',JSON.stringify(latest,null,2)+'\n');

const manifest={version:VERSION,generatedAt:new Date().toISOString(),policy:'Runtime loads only app-v6.0.js and app-v6.0.css. Prior files are migration sources only and are not runtime dependencies.',removedAsDeadOrLoader:[...excluded],javascript:jsManifest,stylesheets:cssManifest,bundle:{jsSha256:sha(js),cssSha256:sha(css)}};
fs.writeFileSync('v6-baseline-manifest.json',JSON.stringify(manifest,null,2)+'\n');

console.log(`Built v${VERSION}: ${orderedJs.length} JS migration sources -> 1 runtime JS; ${cssFiles.length} CSS migration sources -> 1 runtime CSS.`);
