import fs from 'node:fs';

const JS='app-v6.0.js',CSS='app-v6.0.css';
let js=fs.readFileSync(JS,'utf8'),css=fs.readFileSync(CSS,'utf8');
if(!js.includes("window.__kokmatchStandalone='6.0'"))throw new Error('Not a v6 standalone runtime');
if(!js.includes("__kokmatchMemberPointerRouterV615='v6.15'"))throw new Error('v6.15 interaction core must be generated first');

// Short visible release name.
js=js.replaceAll('v6.15','v6.16');
js=js.replace(/function buildLabelV6\(\)\{return 'v6\.\d+'\}/,"function buildLabelV6(){return 'v6.16'}");

// Do not delete partner relationship DOM nodes after render. Keep the structure intact and
// suppress only partner-name presentation. This avoids changing the member-card child tree.
const oldStrip="function v615StripPartnerNames(){document.querySelectorAll('#members .memberRelation83,#members .relationInfo66').forEach(el=>{if(/파트너/.test(String(el.textContent||'')))el.remove()})}";
const newStrip="function v615StripPartnerNames(){document.querySelectorAll('#members .memberRelation83,#members .relationInfo66').forEach(el=>{const t=String(el.textContent||'').trim();el.classList.toggle('v616PartnerNameHidden',/^파트너(?:\\s|$)/.test(t)||/·\\s*파트너(?:\\s|$)/.test(t))})}";
if(!js.includes(oldStrip))throw new Error('v6.15 partner strip function not found');
js=js.replace(oldStrip,newStrip);

const filter=String.raw`
function installPartnerDisplayFilterV616(){
 if(window.__kokmatchPartnerDisplayFilterV616==='v6.16')return;
 window.__kokmatchPartnerDisplayFilterV616='v6.16';
 try{
  if(typeof relation83==='function'&&!relation83.__v616){
   const base=relation83;
   const next=function(m){const t=String(base(m)||'');return /^파트너(?:\s|$)/.test(t.trim())?'':t};
   next.__v616=true;relation83=next;window.relation83=next;
  }
 }catch{}
 try{
  if(typeof relationText66==='function'&&!relationText66.__v616){
   const base=relationText66;
   const next=function(m){const t=String(base(m)||'');return /^파트너(?:\s|$)/.test(t.trim())?'':t};
   next.__v616=true;relationText66=next;window.relationText66=next;
  }
 }catch{}
}
`;
const anchor='function installReliableActionTapV6(){';
if(!js.includes(anchor))throw new Error('v6 interaction anchor missing');
js=js.replace(anchor,filter+'\n'+anchor);

const oldInstall='installFastPartnerV6();installMemberPointerRouterV615();v615StripPartnerNames();';
const newInstall='installFastPartnerV6();installMemberPointerRouterV615();installPartnerDisplayFilterV616();v615StripPartnerNames();';
if(!js.includes(oldInstall))throw new Error('v6.15 installer sequence missing');
js=js.replaceAll(oldInstall,newInstall);

// Restore a real 4px gap between name and birth/gender. The previous -8px overlap was too
// aggressive once the partner-name row disappeared.
if(!css.includes('#members .memberMetaV6{margin:-8px 0 0!important;'))throw new Error('v6.15 member meta spacing not found');
css=css.replace('#members .memberMetaV6{margin:-8px 0 0!important;','#members .memberMetaV6{margin:4px 0 0!important;');

const CE='/* V6_UI_STABILITY_CSS_END */';
const p=css.indexOf(CE);if(p<0)throw new Error('v6 stability css end missing');
const stable=`
/* v6.16 member-card geometry: partner display must never change action-column structure. */
#members .v616PartnerNameHidden{display:none!important}
#members .memberCard{align-items:center!important;grid-auto-flow:row!important}
#members .memberInfo48,#members .memberInfoV6{align-self:center!important;min-width:0!important}
#members .memberActions48,#members .v6MemberActions,#members .memberActions60,#members .memberActions65{align-self:center!important;justify-self:end!important;display:flex!important;flex-direction:column!important;justify-content:center!important;overflow:visible!important}
#members .memberActions48 .status,#members .v6MemberActions .status,#members .memberActions60 .status,#members .memberActions65 .status{margin:0 0 3px!important;line-height:1.05!important;min-height:11px!important}
#members .memberBtns,#members .memberBtns65{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:3px!important;align-items:stretch!important;justify-items:stretch!important;overflow:visible!important}
#members .memberBtns .btn,#members .memberBtns65 .btn{width:100%!important;min-width:0!important;margin:0!important;padding:6px 2px!important;line-height:1.05!important;text-align:center!important}
#members .memberBtns .btn:nth-child(odd):last-child,#members .memberBtns65 .btn:nth-child(odd):last-child{grid-column:1/-1!important}
@media(max-width:430px){#members .memberBtns,#members .memberBtns65{gap:2px!important}#members .memberBtns .btn,#members .memberBtns65 .btn{padding:6px 1px!important;font-size:9px!important}}
`;
css=css.slice(0,p)+stable+css.slice(p);

for(const check of ["function buildLabelV6(){return 'v6.16'}","__kokmatchPartnerDisplayFilterV616='v6.16'","installPartnerDisplayFilterV616();v615StripPartnerNames();"]){if(!js.includes(check))throw new Error('v6.16 js marker missing: '+check)}
for(const check of ['margin:4px 0 0','v616PartnerNameHidden','grid-template-columns:repeat(2,minmax(0,1fr))'])if(!css.includes(check))throw new Error('v6.16 css marker missing: '+check);

fs.writeFileSync(JS,js);fs.writeFileSync(CSS,css);
console.log('v6.16 member action layout stabilized; partner name suppressed without DOM deletion; name-to-meta gap set to 4px.');
