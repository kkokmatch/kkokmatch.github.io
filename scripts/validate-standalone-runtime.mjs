import fs from 'node:fs';

const latest=JSON.parse(fs.readFileSync('latest-version.json','utf8'));
const version=String(latest.semanticVersion||latest.label||'').replace(/^v/i,'').trim();
if(!version)throw new Error('latest-version.json has no semantic version');
const jsName=`app-v${version}.js`,cssName=`app-v${version}.css`;
for(const f of ['index.html',jsName,cssName])if(!fs.existsSync(f))throw new Error(`Missing current runtime file: ${f}`);
const html=fs.readFileSync('index.html','utf8'),js=fs.readFileSync(jsName,'utf8');

const scriptAssets=[...html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)].map(m=>m[1]);
const styleAssets=[...html.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["']/gi)].map(m=>m[1]);
const appScripts=scriptAssets.filter(x=>/\/app-v/i.test(x));
const appStyles=styleAssets.filter(x=>/\/app-v/i.test(x));
if(appScripts.length!==1||!appScripts[0].startsWith(`/${jsName}`))throw new Error(`Runtime must load exactly one current app JS (${jsName}): ${appScripts.join(', ')}`);
if(appStyles.length!==1||!appStyles[0].startsWith(`/${cssName}`))throw new Error(`Runtime must load exactly one current app CSS (${cssName}): ${appStyles.join(', ')}`);

const dynamic=[...js.matchAll(/(?:\.src\s*=|createElement\(['"]script['"]\)[\s\S]{0,160}?src\s*=)[\s\S]{0,100}?["'](\/app-v[^"']+)/g)].map(m=>m[1]);
if(dynamic.length)throw new Error(`Dynamic app-version loading is forbidden: ${[...new Set(dynamic)].join(', ')}`);

const externalAppRefs=[...js.matchAll(/["'](\/app-v[^"'?]+\.(?:js|css))(?:\?[^"']*)?["']/g)].map(m=>m[1]).filter(x=>x!==`/${jsName}`&&x!==`/${cssName}`);
if(externalAppRefs.length)throw new Error(`Current runtime references old/new app asset files: ${[...new Set(externalAppRefs)].slice(0,20).join(', ')}`);

if(!js.includes(`window.__kokmatchStandalone='${version}'`))throw new Error('Standalone runtime marker missing or version mismatch');
if(!html.includes(`data-kokmatch-version="${version}"`))throw new Error('index.html version marker mismatch');
console.log(`PASS standalone runtime v${version}: one JS, one CSS, zero cross-version app loads.`);
