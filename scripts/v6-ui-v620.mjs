import fs from 'node:fs';

const JS='app-v6.0.js',CSS='app-v6.0.css';
let js=fs.readFileSync(JS,'utf8'),css=fs.readFileSync(CSS,'utf8');
if(!js.includes("window.__kokmatchNativeMemberSaveV619='v6.19'"))throw new Error('v6.19 native member editor must be generated first');

js=js.replaceAll('v6.19','v6.20');
js=js.replace(/function buildLabelV6\(\)\{return 'v6\.\d+'\}/,"function buildLabelV6(){return 'v6.20'}");

const anchor='let memberEditorStateV618=null;';
if(!js.includes(anchor))throw new Error('v6.18 member editor state anchor missing');
const helpers=String.raw`let memberEditorStateV618=null;
window.__kokmatchMemberSaveApiV620='v6.20';
function v620Token(){try{return String(T||localStorage.getItem('kokmatch_token')||'')}catch{return String(localStorage.getItem('kokmatch_token')||'')}}
function v620Group(){try{return String(currentGroupId||localStorage.getItem('kokmatch_group_id')||'')}catch{return String(localStorage.getItem('kokmatch_group_id')||'')}}
async function v620MemberApi(op,body={}){
 const r=await fetch('https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-v60-api',{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+v620Token()},body:JSON.stringify({op,groupId:v620Group(),...body}),cache:'no-store'});
 const x=await r.json().catch(()=>({}));
 if(!r.ok){if(r.status===401){try{reloginLatest()}catch{};throw new Error('로그인이 만료되었습니다.')}throw new Error(x.error||'회원정보 저장에 실패했습니다.')}
 return x
}
async function deleteMemberEditorV620(){
 const st=memberEditorStateV618,id=String(st?.memberId||''),m=(S?.members||[]).find(x=>String(x?.id||'')===id);if(!m)return editorErrorV618('삭제할 회원을 찾지 못했습니다.');if(String(m.role||'member')==='admin')return editorErrorV618('개발자 계정은 삭제할 수 없습니다.');if(!confirm(String(m.name||'회원')+' 회원정보를 삭제하시겠습니까?'))return false;
 try{const x=await v620MemberApi('member_delete',{memberId:id});if(x?.data){S=x.data;window.S=x.data;try{normalizeClient()}catch{}}closeMemberEditorV618();renderHeader();renderNav();renderMembers();window.__kokmatchFinalizeRoster22?.();standardizeRosterV618();return true}catch(e){editorErrorV618(e?.message||String(e||'회원 삭제에 실패했습니다.'));return false}
}`;
js=js.replace(anchor,helpers);

const oldSave="const x=await v615MemberApi('member_save',{memberId:st.memberId||'',name,year,gender,cls,type,role,pin,inviter})";
const newSave="const x=await v620MemberApi('member_save',{memberId:st.memberId||'',name,year,gender,cls,type,role,pin,inviter})";
if(!js.includes(oldSave))throw new Error('active v6.18 editor save API call not found');
js=js.replace(oldSave,newSave);

const oldDelete="root.querySelector('#v618Delete')?.addEventListener('click',()=>{try{memberEditorStateV615={memberId:memberEditorStateV618?.memberId||''};deleteMemberEditorV615()}catch(e){editorErrorV618(e?.message||String(e))}});";
if(js.includes(oldDelete))js=js.replace(oldDelete,"root.querySelector('#v618Delete')?.addEventListener('click',deleteMemberEditorV620);");

js=js.replace("actor=(()=>{try{return v615Actor()}catch{return'member'}})()","actor=(()=>{try{return me?.globalAdmin?'admin':String(me?.role||'member')}catch{return'member'}})()")

css=css.replace(/#members \.memberBtns,#members \.memberBtns65\{([^}]*)gap:4px!important;/,"#members .memberBtns,#members .memberBtns65{$1gap:6px!important;");
css=css.replace(/@media\(max-width:430px\)\{#members \.memberCard\{([^}]*)\}#members \.v6MemberActions,#members \.memberActions48,#members \.memberActions60,#members \.memberActions65,#members \.memberBtns,#members \.memberBtns65\{([^}]*)\}#members \.memberBtns,#members \.memberBtns65\{gap:3px!important;\}/,"@media(max-width:430px){#members .memberCard{$1}#members .v6MemberActions,#members .memberActions48,#members .memberActions60,#members .memberActions65,#members .memberBtns,#members .memberBtns65{$2}#members .memberBtns,#members .memberBtns65{gap:5px!important;}");

for(const c of ["function buildLabelV6(){return 'v6.20'}","__kokmatchMemberSaveApiV620='v6.20'",newSave,"addEventListener('click',deleteMemberEditorV620)"]){if(!js.includes(c))throw new Error('v6.20 active editor marker missing: '+c)}
if(!css.includes('gap:6px!important')||!css.includes('gap:5px!important'))throw new Error('v6.20 +2px action-button gaps missing');

fs.writeFileSync(JS,js);fs.writeFileSync(CSS,css);
console.log('v6.20 active member editor now uses its self-contained API and action buttons have 2px more spacing.');
