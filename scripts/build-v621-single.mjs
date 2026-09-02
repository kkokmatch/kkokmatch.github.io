import fs from 'node:fs';

const VERSION='6.21';
const BUILD='v6.21';
const baseJsPath='app-v6.0.js';
const baseCssPath='app-v6.0.css';
const memberHotfixPath='app-v6.20-member-hotfix.js';
const layoutHotfixPath='app-v6.20-layout-hotfix.css';
const outJs=`app-v${VERSION}.js`;
const outCss=`app-v${VERSION}.css`;

for(const f of [baseJsPath,baseCssPath,memberHotfixPath,layoutHotfixPath]){
  if(!fs.existsSync(f))throw new Error(`Missing migration source: ${f}`);
}

let js=fs.readFileSync(baseJsPath,'utf8');
const memberHotfix=fs.readFileSync(memberHotfixPath,'utf8');
let css=fs.readFileSync(baseCssPath,'utf8');
const layoutHotfix=fs.readFileSync(layoutHotfixPath,'utf8');

const before={jsBytes:Buffer.byteLength(js),cssBytes:Buffer.byteLength(css)};
let removedLegacyLaunch=0;
let removedV99FastPath=0;
let removedLegacyFixLoader=0;

// 1) v5.4 fix21~26은 이미 본체에 직접 이관되어 있으므로, 다시 외부 파일을 불러오는 bridge는 죽은/중복 로더다.
const bridgeStart='(()=>{\nif(window.__kokmatchV54FinalProfileBridge4)return;';
const bridgeEnd='/* migrated into v6.0: app-v5.4-fix5.js */';
const bi=js.indexOf(bridgeStart);
if(bi>=0){
  const be=js.indexOf(bridgeEnd,bi);
  if(be<0)throw new Error('legacy v5.4 bridge end marker not found');
  js=js.slice(0,bi)+'/* v6.21: obsolete v5.4 fix21~26 dynamic bridge removed; code is already consolidated below. */\n\n'+js.slice(be);
  removedLegacyFixLoader=1;
}

// 2) 과거 /launch/vXX 전용 리다이렉트는 단일 운영 경로에서 도달하지 않는 죽은 코드다.
// 여러 줄뿐 아니라 v93처럼 IIFE 한 줄 안에 들어간 경우도 정확히 해당 조건문만 제거한다.
js=js.replace(/if\(location\.pathname\.startsWith\(['"]\/launch\/v[^'"]+['"]\)\)\s*history\.replaceState\([^;\n]*\);?/g,()=>{removedLegacyLaunch++;return''});

// 3) v99 회원 상태변경 fast-path는 v6.21 canonical 3버튼 핸들러와 직접 충돌하므로 제거한다.
const fastStart='/* Member attendance fast path: preserve scroll, avoid full roster repaint/flicker. */';
const si=js.indexOf(fastStart);
if(si>=0){
  let ei=js.indexOf("if(location.pathname.startsWith('/launch/v99'))",si);
  if(ei<0)ei=js.indexOf('if(me){restoreDeveloper99()',si);
  if(ei<0)throw new Error('v99 fast-path end marker not found');
  js=js.slice(0,si)+`/* v6.21: obsolete v99 member attendance fast-path removed. */\n`+js.slice(ei);
  removedV99FastPath=1;
}

// v99 블록 제거 후 남을 수 있는 launch 전용 리다이렉트도 한 번 더 정리한다.
js=js.replace(/if\(location\.pathname\.startsWith\(['"]\/launch\/v[^'"]+['"]\)\)\s*history\.replaceState\([^;\n]*\);?/g,()=>{removedLegacyLaunch++;return''});

// 4) 독립 운영본 버전 마커를 v6.21로 고정한다.
js=js
 .replace(/window\.__kokmatchStandalone='6\.0'/g,`window.__kokmatchStandalone='${VERSION}'`)
 .replace(/window\.__kokmatchVersionLock='6\.0'/g,`window.__kokmatchVersionLock='${VERSION}'`)
 .replace(/sessionStorage\.setItem\('kokmatch_runtime_version','6\.0'\)/g,`sessionStorage.setItem('kokmatch_runtime_version','${VERSION}')`)
 .replace(/document\.documentElement\.dataset\.kokmatchVersion='6\.0'/g,`document.documentElement.dataset.kokmatchVersion='${VERSION}'`);

// 5) 현재 최종 회원저장/권한/3버튼 구현을 별도 런타임 파일이 아닌 본체에 직접 이관한다.
js += `\n\n/* ===== v6.21 canonical member/save/roster implementation ===== */\n${memberHotfix}\n`;

// 6) CSS도 현재 본체 + 최종 레이아웃만 합쳐 하나의 파일로 만든다.
css += `\n\n/* ===== v6.21 canonical layout ===== */\n${layoutHotfix}\n`;

// 외부 app-v*.js/css 또는 핫픽스 파일을 런타임이 다시 참조하지 못하게 빌드 단계에서 차단한다.
const crossVersionRefs=[...js.matchAll(/["'](\/app-v[^"'?]+\.(?:js|css))(?:\?[^"']*)?["']/g)].map(m=>m[1]).filter(x=>x!==`/${outJs}`&&x!==`/${outCss}`);
if(crossVersionRefs.length)throw new Error(`Cross-version app refs remain: ${[...new Set(crossVersionRefs)].join(', ')}`);
if(/location\.pathname\.startsWith\(['"]\/launch\/v/.test(js))throw new Error('Legacy /launch/v route remains after cleanup');
for(const [name,text] of [['JS',js],['CSS',css]]){
  if(/app-v6\.20-(?:member|layout)-hotfix\.(?:js|css)/.test(text))throw new Error(`${name} still references a hotfix asset`);
}

fs.writeFileSync(outJs,js);
fs.writeFileSync(outCss,css);

const html=`<!doctype html>
<html lang="ko" data-kokmatch-version="${VERSION}" data-kokmatch-build="${BUILD}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="theme-color" content="#2453d4">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <meta name="apple-mobile-web-app-title" content="콕매치">
  <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
  <meta http-equiv="Pragma" content="no-cache">
  <meta http-equiv="Expires" content="0">
  <title>콕매치 ${BUILD}</title>
  <link rel="manifest" href="/manifest.webmanifest?v=${VERSION}">
  <link rel="stylesheet" href="/${outCss}?v=${VERSION}">
  <script>
  (()=>{
    'use strict';
    window.__kokmatchStandalone='${VERSION}';
    window.__kokmatchVersionLock='${VERSION}';
    window.__kokmatchBuild='${BUILD}';
    document.documentElement.dataset.kokmatchEntry='single-v621';
    let hiddenAt=0;
    document.addEventListener('visibilitychange',()=>{
      if(document.hidden){hiddenAt=Date.now();return;}
      if(hiddenAt&&Date.now()-hiddenAt>30000){const u=new URL(location.href);u.searchParams.set('_km',Date.now().toString(36));location.replace(u.pathname+u.search+u.hash)}
    });
    addEventListener('pageshow',e=>{if(e.persisted){const u=new URL(location.href);u.searchParams.set('_km',Date.now().toString(36));location.replace(u.pathname+u.search+u.hash)}});
  })();
  </script>
  <script defer src="/${outJs}?v=${VERSION}"></script>
</head>
<body></body>
</html>
`;
fs.writeFileSync('index.html',html);

const latest=JSON.parse(fs.readFileSync('latest-version.json','utf8'));
latest.version=61;
latest.label=BUILD;
latest.semanticVersion=VERSION;
latest.build=BUILD;
latest.updatedAt='2026-09-02T10:15:00+09:00';
latest.note='v6.21 단일본 통합 · 런타임 JS/CSS 각 1개 · v5.4 외부 fix 로더/v99 충돌 상태변경/구버전 launch 죽은코드 제거';
fs.writeFileSync('latest-version.json',JSON.stringify(latest,null,2)+'\n');

const report={
  version:VERSION,
  sources:[baseJsPath,baseCssPath,memberHotfixPath,layoutHotfixPath],
  outputs:[outJs,outCss,'index.html'],
  removed:{legacyFixLoader:removedLegacyFixLoader,legacyLaunchRedirects:removedLegacyLaunch,v99AttendanceFastPath:removedV99FastPath},
  bytes:{before,after:{jsBytes:Buffer.byteLength(js),cssBytes:Buffer.byteLength(css)}}
};
fs.writeFileSync('scripts/v621-consolidation-report.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
