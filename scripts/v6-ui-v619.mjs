import fs from 'node:fs';

const JS='app-v6.0.js';
let js=fs.readFileSync(JS,'utf8');
if(!js.includes("__kokmatchMemberTemplateV618='v6.18'"))throw new Error('v6.18 member template must be generated first');

js=js.replaceAll('v6.18','v6.19');
js=js.replace(/function buildLabelV6\(\)\{return 'v6\.\d+'\}/,"function buildLabelV6(){return 'v6.19'}");

const fn="function openMemberEditorV618(m){\n const add=";
if(!js.includes(fn))throw new Error('v6.18 editor open anchor missing');
js=js.replace(fn,"function openMemberEditorV618(m){\n closeMemberEditorV618();\n const add=");

const late="\n closeMemberEditorV618();document.getElementById('modal')?.classList.remove('on');";
if(!js.includes(late))throw new Error('late editor reset anchor missing');
js=js.replace(late,"\n document.getElementById('modal')?.classList.remove('on');");

// A native form submit owns saving. Keep a direct submit listener and do not route the save button
// through the old custom pointer/touch overlay handler.
const bind="const form=root.querySelector('#memberEditorFormV618');form.addEventListener('submit',saveMemberEditorV618);";
if(!js.includes(bind))throw new Error('native editor submit binding missing');
js=js.replace(bind,"const form=root.querySelector('#memberEditorFormV618');form.addEventListener('submit',saveMemberEditorV618,{capture:false});window.__kokmatchNativeMemberSaveV619='v6.19';");

if(!js.includes("window.__kokmatchNativeMemberSaveV619='v6.19'"))throw new Error('v6.19 native-save marker missing');
if(!js.includes("function openMemberEditorV618(m){\n closeMemberEditorV618();"))throw new Error('editor state reset order not fixed');
if(js.includes("memberEditorStateV618={memberId:m?.id||'',type:m?.type==='guest'?'guest':'member',role:isAdmin?'admin':(add?'member':r)};\n const roleField")===false)throw new Error('editor state creation missing');

fs.writeFileSync(JS,js);
console.log('v6.19 fixes editor state lifetime so native form submit always retains member id and edited values.');
