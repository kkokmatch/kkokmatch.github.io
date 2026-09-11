from pathlib import Path
p=Path('scripts/qa-role-layout-current.mjs')
s=p.read_text(encoding='utf-8')

# Match the application's real developer-auth contract. The app intentionally
# downgrades arbitrary names that claim admin, so the synthetic QA identity must
# use the canonical developer identity and matching roster role.
s=s.replace("developer:{memberId:'dev',displayName:'개발자',role:'admin',globalAdmin:true,tempOrganizer:false,groupId:'qa'}", "developer:{memberId:'dev',displayName:'박태영',role:'admin',globalAdmin:true,tempOrganizer:false,groupId:'qa'}")
s=s.replace("{id:'dev',name:'개발자',year:1988,gender:'남',age:'30',cls:'S',type:'member',role:'member',state:'out',totalGames:9}", "{id:'dev',name:'박태영',year:1988,gender:'남',age:'30',cls:'S',type:'member',role:'admin',state:'out',totalGames:9}")

# Make PWA/install-prompt suppression deterministic in the persistent QA itself,
# not only in a one-off workflow patch. This prevents modal overlays from creating
# false layout/click failures in current-runtime CI.
short="""await page.addInitScript(()=>{try{localStorage.setItem('kokmatch_push_denied_notice629',String(Date.now()));localStorage.setItem('kokmatch_install_guide631_seen','1');sessionStorage.setItem('kokmatch_install_later630','1')}catch{}});"""
robust="""await page.addInitScript(()=>{try{localStorage.setItem('kokmatch_push_denied_notice629',String(Date.now()));localStorage.setItem('kokmatch_install_guide631_seen','1');sessionStorage.setItem('kokmatch_install_later630','1');const kill=()=>document.getElementById('pwaPrompt629')?.remove();new MutationObserver(kill).observe(document,{childList:true,subtree:true});addEventListener('DOMContentLoaded',kill)}catch{}});"""
s=s.replace(short,robust)

if "displayName:'박태영'" not in s: raise SystemExit('developer QA identity patch failed')
if "name:'박태영'" not in s or "role:'admin'" not in s: raise SystemExit('developer roster evidence patch failed')
if 'new MutationObserver(kill)' not in s: raise SystemExit('robust prompt guard patch failed')
p.write_text(s,encoding='utf-8')
print('prepared persistent role QA with real developer auth contract')
