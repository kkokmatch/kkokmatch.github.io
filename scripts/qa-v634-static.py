from pathlib import Path

js = Path('app-v6.34.js').read_text(encoding='utf-8')
idx = Path('index.html').read_text(encoding='utf-8')
latest = Path('latest-version.json').read_text(encoding='utf-8')
manifest = Path('manifest.webmanifest').read_text(encoding='utf-8')
sw = Path('kokmatch-sw.js').read_text(encoding='utf-8')

checks = {
    'runtime lock': "window.__kokmatchVersionLock='6.34'" in js,
    'standalone marker': "window.__kokmatchStandalone='6.34'" in js,
    'early boot removed': 'setInterval(backgroundStatePollV617,10000);boot();' not in js,
    'shell created early': 'window.__kokmatchShellReady634=true' in js,
    'stored token skips login form': ';if(!T)renderLoginName();renderNav()}' in js,
    'final coordinator': 'window.__kokmatchSessionCoordinator634=true' in js,
    'global version renderer': 'window.__kokmatchRenderGlobalVersion634=renderGlobalVersion634' in js,
    'canonical version label': '콕매치 v6.34 · 최신 운영본' in js,
    'state loads serialized': 'inflight634&&inflight634.key===key' in js,
    'loadState args preserved': 'baseLoadState634.apply(this,args)' in js,
    'v632 direct resume listeners removed': "schedule632('pageshow'" not in js and "schedule632('visibility'" not in js and "schedule632('focus'" not in js,
    'v46 competing visibility load removed': 'visibility state refresh is handled by the final session coordinator' in js,
    'v633 version overlay delegated': 'function patchVersion633(){try{window.__kokmatchRenderGlobalVersion634?.()}catch{}}' in js,
    'index forced resume reload removed': 'let hiddenAt=0' not in idx and "location.replace(u.pathname+u.search+u.hash)" not in idx,
    'index coordinator marker': "window.__kokmatchEntryResumeMode='session-coordinator-v634'" in idx,
    'index js v634': '/app-v6.34.js?v=6.34' in idx,
    'index css v634': '/app-v6.34.css?v=6.34' in idx,
    'latest v634': '"semanticVersion": "6.34"' in latest,
    'manifest v634': 'kmv=6.34' in manifest,
    'sw v634': "KOKMATCH_SW_VERSION='6.34'" in sw,
}

bad = [name for name, ok in checks.items() if not ok]
for name, ok in checks.items():
    print(('PASS' if ok else 'FAIL'), name)
if bad:
    raise SystemExit('Static QA failed: ' + ', '.join(bad))

shell = js.find('window.__kokmatchShellReady634=true')
coordinator = js.find('window.__kokmatchSessionCoordinator634=true')
startup = js.rfind("queueMicrotask(()=>syncSession634('startup'))")
if not (0 <= shell < coordinator < startup):
    raise SystemExit(f'Invalid session order: shell={shell}, coordinator={coordinator}, startup={startup}')

# The final v6.34 wrappers must occur after the legacy v6.30 first-login stabilization.
first_login = js.find('window.__kokmatchLoginStable630=true')
if not (0 <= first_login < coordinator):
    raise SystemExit(f'v6.30 login stabilizer order invalid: first_login={first_login}, coordinator={coordinator}')

print('PASS v6.34 ordered session/version static QA')
