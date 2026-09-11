from pathlib import Path

JS=Path('app-v6.71.js')
CSS=Path('app-v6.71.css')
js=JS.read_text(encoding='utf-8')

# v6.22 still has a legacy DOM rail repair that runs after render and can overwrite
# the newer role-safe canonical controls. Keep its unrelated syncUi work, but stop
# this obsolete action-rail rewrite so v6.21+/v6.69 canonical controls remain the
# single source of truth for developer/manager/organizer/member/guest/temp roles.
needle="function repairMemberControlsV6(){\n"
if js.count(needle)!=1:
    raise SystemExit(f'legacy roster repair patch point count={js.count(needle)}')
js=js.replace(needle,needle+" // v6.71: obsolete roster rail rewriting disabled; canonical role-safe rail owns this DOM.\n return;\n",1)

# v6.69 canonicalization used an async scheduled repair and could be skipped by the
# no-flash resume guard even after the actor/role changed. Make explicit renderMembers
# calls canonicalize synchronously; background resume can still retain the guard.
old_guard="if(Date.now()<Number(window.__kokmatchResumeNoRailReplaceUntil638||0)&&!needs637())return;"
new_guard="if(!force&&Date.now()<Number(window.__kokmatchResumeNoRailReplaceUntil638||0)&&!needs637())return;"
if js.count(old_guard)!=1:
    raise SystemExit(f'canonical force guard patch point count={js.count(old_guard)}')
js=js.replace(old_guard,new_guard,1)
old_render="renderMembers=function(...args){const r=baseRender637.apply(this,args);schedule637(true);return r};"
new_render="renderMembers=function(...args){const r=baseRender637.apply(this,args);stabilize637(true);schedule637(false);return r};"
if js.count(old_render)!=1:
    raise SystemExit(f'canonical render wrapper patch point count={js.count(old_render)}')
js=js.replace(old_render,new_render,1)
JS.write_text(js,encoding='utf-8')

# Older phone rules set flex-basis independently from width. Explicitly reset the
# flex basis in the final canonical section. Apply this to every visible button in
# the roster action rail as well as the canonical class so an older class name
# cannot physically collapse a valid role button after rendering.
css=CSS.read_text(encoding='utf-8')
css += r'''

/* v6.71 final physical action-button sizing: defeat legacy flex-basis constraints. */
@media(max-width:599px){
 #members .kmRosterAction621,
 #members .kmRosterActions621 button,
 #members .v6MemberActions button,
 #members .memberActions48 button,
 #members .memberActions60 button,
 #members .memberActions64 button,
 #members .memberActions65 button{
  flex:0 0 46px!important;flex-basis:46px!important;width:46px!important;min-width:46px!important;max-width:46px!important;
  height:34px!important;min-height:34px!important;max-height:34px!important;box-sizing:border-box!important;
 }
}
@media(max-width:359px){
 #members .kmRosterAction621,
 #members .kmRosterActions621 button,
 #members .v6MemberActions button,
 #members .memberActions48 button,
 #members .memberActions60 button,
 #members .memberActions64 button,
 #members .memberActions65 button{
  flex:0 0 43px!important;flex-basis:43px!important;width:43px!important;min-width:43px!important;max-width:43px!important;
 }
}
@media(min-width:600px){
 #members .kmRosterAction621,
 #members .kmRosterActions621 button,
 #members .v6MemberActions button,
 #members .memberActions48 button,
 #members .memberActions60 button,
 #members .memberActions64 button,
 #members .memberActions65 button{
  flex:0 0 48px!important;flex-basis:48px!important;width:48px!important;min-width:48px!important;max-width:48px!important;
  height:34px!important;min-height:34px!important;max-height:34px!important;box-sizing:border-box!important;
 }
}
'''
CSS.write_text(css,encoding='utf-8')

assert 'obsolete roster rail rewriting disabled' in js
assert 'if(!force&&Date.now()<Number(window.__kokmatchResumeNoRailReplaceUntil638||0)&&!needs637())return;' in js
assert 'stabilize637(true);schedule637(false)' in js
assert 'flex-basis:46px!important' in css
assert '#members .kmRosterActions621 button' in css
assert 'flex-basis:48px!important' in css
print('patched v6.71 canonical roster ownership, sync role controls and physical button sizing')
